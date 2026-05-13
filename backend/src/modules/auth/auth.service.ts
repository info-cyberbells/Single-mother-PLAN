import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
// Simple in-memory caches replacing Redis
const refreshTokensCache = new Map<string, string>();
const resetTokensCache = new Map<string, string>();
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserRole, UserPlan } from '@prisma/client';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export class AuthService {
  private generateTokens(user: TokenPayload) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async register(data: { email: string; password: string; full_name: string; phone?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email is already registered');
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        full_name: data.full_name,
        phone: data.phone,
      },
    });

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to MomPlan!',
      html: `<h1>Welcome to MomPlan, ${user.full_name}!</h1><p>We are thrilled to help you discover and apply for the benefits your family deserves.</p>`,
    });

    const tokens = this.generateTokens(user);

    // Store refresh token in memory session cache for validation/revocation
    refreshTokensCache.set(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        plan: user.plan,
      },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || user.status === 'inactive') {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { last_active_at: new Date() },
    });

    const tokens = this.generateTokens(user);
    refreshTokensCache.set(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        plan: user.plan,
      },
      ...tokens,
    };
  }

  async logout(userId: string) {
    refreshTokensCache.delete(userId);
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
      const storedToken = refreshTokensCache.get(decoded.id);

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Refresh token revoked or invalid');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.status === 'inactive') {
        throw new UnauthorizedError('User account not found or inactive');
      }

      const tokens = this.generateTokens(user);
      refreshTokensCache.set(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return;
    }

    // Generate secure simple token
    const resetToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '1h' });
    resetTokensCache.set(resetToken, user.id);

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - MomPlan',
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><a href="${resetUrl}">Reset Password</a><p>This link is valid for 1 hour.</p>`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = resetTokensCache.get(token);
    if (!userId) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    // Invalidate reset token and user's existing refresh token sessions
    resetTokensCache.delete(token);
    refreshTokensCache.delete(userId);
  }
}
