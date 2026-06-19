import { Prisma } from '@prisma/client';
import { ForbiddenError } from '../../utils/errors';

export type OrgAccessContext = {
  orgId: string;
  orgUserId: string;
  role: 'admin' | 'caseworker';
};

export function isOrgAdmin(ctx: OrgAccessContext): boolean {
  return ctx.role === 'admin';
}

export function motherOrgWhere(orgId: string): Prisma.MotherWhereInput {
  return {
    OR: [
      { caseworker: { org_id: orgId } },
      { user: { org_id: orgId } },
    ],
  };
}

export function motherListWhere(
  ctx: OrgAccessContext,
  caseworkerFilter?: string
): Prisma.MotherWhereInput {
  if (ctx.role === 'caseworker') {
    return {
      caseworker_id: ctx.orgUserId,
      caseworker: { org_id: ctx.orgId, is_active: true },
    };
  }

  const base = motherOrgWhere(ctx.orgId);

  if (caseworkerFilter === 'unassigned') {
    return { AND: [base, { caseworker_id: null }] };
  }
  if (caseworkerFilter && caseworkerFilter !== 'all') {
    return { AND: [base, { caseworker_id: caseworkerFilter }] };
  }
  return base;
}

export function caseListWhere(
  ctx: OrgAccessContext,
  caseworkerFilter?: string
): Prisma.PartnerCaseWhereInput {
  if (ctx.role === 'caseworker') {
    return {
      mother: {
        caseworker_id: ctx.orgUserId,
        caseworker: { org_id: ctx.orgId },
      },
    };
  }

  const motherWhere = motherListWhere(ctx, caseworkerFilter);
  return { mother: motherWhere };
}

/** Only cases where the mom sent a secure application email package */
export function secureSubmittedCaseWhere(): Prisma.PartnerCaseWhereInput {
  return { secure_submitted_at: { not: null } };
}

/** Cases tied to an org via assigned caseworker or enrolled MomPlan user */
export function orgCaseloadCaseWhere(orgId: string): Prisma.PartnerCaseWhereInput {
  return {
    OR: [
      { caseworker: { org_id: orgId } },
      { mother: { user: { org_id: orgId } } },
    ],
  };
}

export function assertMotherAccess(
  ctx: OrgAccessContext,
  mother: { caseworker_id: string | null }
): void {
  if (ctx.role === 'admin') return;
  if (mother.caseworker_id !== ctx.orgUserId) {
    throw new ForbiddenError('You do not have access to this mother');
  }
}

export function toAccessContext(orgUser: {
  orgId: string;
  orgUserId: string;
  role: string;
}): OrgAccessContext {
  return {
    orgId: orgUser.orgId,
    orgUserId: orgUser.orgUserId,
    role: orgUser.role as OrgAccessContext['role'],
  };
}
