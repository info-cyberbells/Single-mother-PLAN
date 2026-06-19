import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { splitFullName } from '../../utils/name.utils';
import { ORG_TYPE_LABELS, parseOrgType } from '../../constants/org-types';
import {
  PartnerOrganization,
  toPartnerOrganization,
} from '../../utils/partner-organization.utils';

// ---- Token helpers ----

const PARTNER_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface OrgUserTokenPayload {
  orgUserId: string;
  email: string;
  role: string;
  orgId: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(64).toString('base64url');
}

function generateAccessToken(payload: OrgUserTokenPayload): string {
  return jwt.sign(
    { orgUserId: payload.orgUserId, email: payload.email, role: payload.role, orgId: payload.orgId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

async function createRefreshToken(orgUserId: string): Promise<string> {
  const raw = generateOpaqueToken();
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + PARTNER_REFRESH_TTL_MS);

  await prisma.orgRefreshToken.create({
    data: { token: hash, org_user_id: orgUserId, expires_at: expiresAt },
  });

  return raw;
}

async function issueSession(orgUser: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string;
  must_change_password: boolean;
  organization: PartnerOrganization;
}) {
  const accessToken = generateAccessToken({
    orgUserId: orgUser.id,
    email: orgUser.email,
    role: orgUser.role,
    orgId: orgUser.org_id,
  });
  const refreshToken = await createRefreshToken(orgUser.id);

  return {
    user: {
      id: orgUser.id,
      email: orgUser.email,
      full_name: orgUser.full_name,
      role: orgUser.role,
      org_id: orgUser.org_id,
      must_change_password: orgUser.must_change_password,
    },
    accessToken,
    refreshToken,
    organization: orgUser.organization,
  };
}

// ---- Service ----

export class PartnerAuthService {
  async register(data: {
    orgName: string;
    orgType: string;
    website?: string;
    description?: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    employees?: string;
    founded?: string;
    taxId?: string;
    linkedin?: string;
  }) {
    // Guard: admin email must be unique across org users
    const existing = await prisma.orgUser.findUnique({ where: { email: data.adminEmail } });
    if (existing) {
      throw new BadRequestError('An account with this email already exists');
    }

    const password_hash = await bcrypt.hash(data.adminPassword, 10);
    const orgType = parseOrgType(data.orgType);
    if (!orgType) {
      throw new BadRequestError('Invalid organization type');
    }

    // Create org + admin in a transaction
    const { org, adminUser } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          org_name:      data.orgName,
          category:      ORG_TYPE_LABELS[orgType],
          org_type:      orgType,
          website:       data.website || null,
          description:   data.description || null,
          purpose:       data.description || null,
          phone:         data.phone || null,
          address:       data.address,
          city:          data.city,
          state:         data.state || null,
          zip_code:      data.zip || null,
          country:       data.country || null,
          contact_email: data.email,
          email:         data.email,
          employees:     data.employees || null,
          founded:       data.founded || null,
          tax_id:        data.taxId || null,
          linkedin:      data.linkedin || null,
        },
      });

      const adminUser = await tx.orgUser.create({
        data: {
          full_name:     data.adminName,
          email:         data.adminEmail,
          password_hash,
          role:          'admin',
          org_id:        org.id,
          is_active:     true,
          must_change_password: false,
        },
      });

      const nameParts = splitFullName(adminUser.full_name);
      const billingUser = await tx.user.create({
        data: {
          email: adminUser.email,
          first_name: nameParts.first_name,
          middle_name: nameParts.middle_name,
          last_name: nameParts.last_name,
          plan: 'community',
          org_id: org.id,
        },
      });

      await tx.organization.update({
        where: { id: org.id },
        data: { billing_user_id: billingUser.id },
      });

      return { org, adminUser };
    });

    return issueSession({
      ...adminUser,
      organization: toPartnerOrganization(org),
    });
  }

  async login(data: { email: string; password: string }) {
    const orgUser = await prisma.orgUser.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!orgUser || !orgUser.is_active) {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    const valid = await bcrypt.compare(data.password, orgUser.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await prisma.orgUser.update({
      where: { id: orgUser.id },
      data: { last_login: new Date() },
    });

    return issueSession({
      ...orgUser,
      organization: toPartnerOrganization(orgUser.organization),
    });
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const hash = hashToken(rawRefreshToken);
    await prisma.orgRefreshToken.updateMany({
      where: { token: hash, revoked: false },
      data: { revoked: true },
    });
  }

  async refresh(rawRefreshToken: string) {
    const hash = hashToken(rawRefreshToken);

    const stored = await prisma.orgRefreshToken.findUnique({
      where: { token: hash },
      include: { orgUser: { include: { organization: true } } },
    });

    if (!stored) throw new UnauthorizedError('Invalid refresh token');
    if (stored.revoked) {
      // Replay attack — revoke all sessions for this user
      await prisma.orgRefreshToken.updateMany({
        where: { org_user_id: stored.org_user_id, revoked: false },
        data: { revoked: true },
      });
      throw new UnauthorizedError('Refresh token revoked');
    }
    if (stored.expires_at < new Date()) {
      await prisma.orgRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      throw new UnauthorizedError('Refresh token expired');
    }

    const orgUser = stored.orgUser;
    if (!orgUser || !orgUser.is_active) throw new UnauthorizedError('Account not found or inactive');

    // Rotate
    await prisma.orgRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    return issueSession({
      ...orgUser,
      organization: toPartnerOrganization(orgUser.organization),
    });
  }

  async changePassword(orgUserId: string, currentPassword: string, newPassword: string) {
    const orgUser = await prisma.orgUser.findUnique({
      where: { id: orgUserId },
      include: { organization: true },
    });

    if (!orgUser || !orgUser.is_active) {
      throw new UnauthorizedError('Account not found or inactive');
    }

    const valid = await bcrypt.compare(currentPassword, orgUser.password_hash);
    if (!valid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.orgUser.update({
      where: { id: orgUserId },
      data: { password_hash, must_change_password: false },
      include: { organization: true },
    });

    return issueSession({
      ...updated,
      organization: toPartnerOrganization(updated.organization),
    });
  }
}
