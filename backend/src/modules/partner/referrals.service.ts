import { prisma } from '../../config/prisma';
import { OrgAccessContext, caseListWhere } from './partner-access';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

const PROGRAM_SHORT: Record<string, string> = {
  snap: 'SNAP', wic: 'WIC', medicaid: 'Medicaid', tanf: 'TANF',
  ccdf: 'Childcare (CCAP)', section8: 'Housing', liheap: 'LIHEAP',
};

function programLabel(programId: string, programName?: string): string {
  return PROGRAM_SHORT[programId] ?? programName?.split(/[—–-]/)[0]?.trim() ?? programId;
}

function referralNumber(id: string): string {
  return `REF-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function resolveMotherName(mother?: {
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    family_profile?: { first_name: string | null; last_name: string | null } | null;
  } | null;
} | null): string {
  const fp = mother?.user?.family_profile;
  if (fp?.first_name || fp?.last_name) return [fp.first_name, fp.last_name].filter(Boolean).join(' ');
  const u = mother?.user;
  if (u?.first_name || u?.last_name) return [u.first_name, u.last_name].filter(Boolean).join(' ');
  return 'Unknown Mother';
}

const referralInclude = {
  case: {
    select: {
      id: true,
      program_id: true,
      mother_id: true,
      program: { select: { id: true, name: true } },
      mother: {
        select: {
          id: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
              family_profile: { select: { first_name: true, last_name: true } },
            },
          },
        },
      },
    },
  },
} as const;

type ReferralRow = {
  id: string;
  from_org_id: string;
  to_org_id: string;
  status: string;
  outcome: string | null;
  notes: string | null;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  case: {
    id: string;
    program_id: string;
    mother_id: string;
    program: { id: string; name: string } | null;
    mother: { user: { first_name: string | null; last_name: string | null; family_profile: { first_name: string | null; last_name: string | null } | null } | null } | null;
  } | null;
};

export class ReferralsService {
  private async orgNameMap(ids: string[]): Promise<Record<string, string>> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return {};
    const orgs = await prisma.organization.findMany({
      where: { id: { in: unique } },
      select: { id: true, org_name: true },
    });
    return Object.fromEntries(orgs.map((o) => [o.id, o.org_name]));
  }

  private mapRow(r: ReferralRow, ctx: OrgAccessContext, names: Record<string, string>) {
    const direction = r.from_org_id === ctx.orgId ? 'sent' : 'received';
    return {
      id: r.id,
      referral_number: referralNumber(r.id),
      status: r.status,
      outcome: r.outcome,
      direction,
      mother_id: r.case?.mother_id ?? null,
      mother_name: resolveMotherName(r.case?.mother),
      service_type: r.case ? programLabel(r.case.program_id, r.case.program?.name) : '—',
      from_organization_id: r.from_org_id,
      to_organization_id: r.to_org_id,
      from_organization_name: names[r.from_org_id] ?? 'Unknown org',
      to_organization_name: names[r.to_org_id] ?? 'Unknown org',
      notes: r.notes,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
      completed_at: r.responded_at?.toISOString() ?? null,
    };
  }

  async listReferrals(
    ctx: OrgAccessContext,
    filters: { direction?: string; status?: string; limit?: number }
  ) {
    const direction = filters.direction ?? 'all';
    const dirWhere =
      direction === 'sent'
        ? { from_org_id: ctx.orgId }
        : direction === 'received'
          ? { to_org_id: ctx.orgId }
          : { OR: [{ from_org_id: ctx.orgId }, { to_org_id: ctx.orgId }] };

    const referrals = (await prisma.referral.findMany({
      where: {
        ...dirWhere,
        ...(filters.status && filters.status !== 'all' ? { status: filters.status as any } : {}),
      },
      include: referralInclude,
      orderBy: { created_at: 'desc' },
      take: filters.limit ?? 50,
    })) as unknown as ReferralRow[];

    const names = await this.orgNameMap(referrals.flatMap((r) => [r.from_org_id, r.to_org_id]));
    return referrals.map((r) => this.mapRow(r, ctx, names));
  }

  async getStats(ctx: OrgAccessContext) {
    const referrals = (await prisma.referral.findMany({
      where: { OR: [{ from_org_id: ctx.orgId }, { to_org_id: ctx.orgId }] },
      select: {
        from_org_id: true,
        to_org_id: true,
        status: true,
        outcome: true,
        responded_at: true,
        created_at: true,
      },
    })) as Array<{
      from_org_id: string;
      to_org_id: string;
      status: string;
      outcome: string | null;
      responded_at: Date | null;
      created_at: Date;
    }>;

    let sent = 0;
    let received = 0;
    let pending = 0;
    let accepted = 0;
    let declined = 0;
    let successOutcomes = 0;
    let failOutcomes = 0;
    const responseHours: number[] = [];
    const partnerCounts = new Map<string, number>();

    for (const r of referrals) {
      const isSent = r.from_org_id === ctx.orgId;
      if (isSent) sent++;
      else received++;

      // status breakdown across all org referrals
      if (r.status === 'pending') pending++;
      else if (r.status === 'accepted') accepted++;
      else if (r.status === 'declined') declined++;

      if (r.outcome === 'success') successOutcomes++;
      else if (r.outcome === 'fail') failOutcomes++;

      if (r.responded_at) {
        responseHours.push((r.responded_at.getTime() - r.created_at.getTime()) / 3_600_000);
      }

      // network: count the *other* org
      const partnerId = isSent ? r.to_org_id : r.from_org_id;
      partnerCounts.set(partnerId, (partnerCounts.get(partnerId) ?? 0) + 1);
    }

    const respondedTotal = accepted + declined;
    const outcomeTotal = successOutcomes + failOutcomes;
    const names = await this.orgNameMap([...partnerCounts.keys()]);

    const topPartners = [...partnerCounts.entries()]
      .map(([id, count]) => ({ id, name: names[id] ?? 'Unknown org', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: referrals.length,
      sent,
      received,
      pending,
      accepted,
      declined,
      acceptance_rate: respondedTotal > 0 ? Math.round((accepted / respondedTotal) * 100) : 0,
      success_rate: outcomeTotal > 0 ? Math.round((successOutcomes / outcomeTotal) * 100) : 0,
      avg_response_hours: responseHours.length
        ? Math.round((responseHours.reduce((a, b) => a + b, 0) / responseHours.length) * 10) / 10
        : null,
      top_partners: topPartners,
    };
  }

  /** Org cases that can be referred out (no secure-submission filter, so all org cases qualify). */
  async listReferableCases(ctx: OrgAccessContext, search?: string) {
    const cases = await prisma.partnerCase.findMany({
      where: { ...caseListWhere(ctx) },
      select: {
        id: true,
        program_id: true,
        program: { select: { id: true, name: true } },
        mother: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                family_profile: { select: { first_name: true, last_name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const rows = cases.map((c) => ({
      id: c.id,
      mother_name: resolveMotherName(c.mother),
      service_type: programLabel(c.program_id, c.program?.name),
    }));

    const q = search?.toLowerCase().trim();
    return q ? rows.filter((r) => r.mother_name.toLowerCase().includes(q)) : rows;
  }

  async listTargetOrgs(ctx: OrgAccessContext, search?: string) {
    const orgs = await prisma.organization.findMany({
      where: {
        active: true,
        id: { not: ctx.orgId },
        ...(search ? { org_name: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: { id: true, org_name: true, category: true },
      orderBy: { org_name: 'asc' },
      take: 50,
    });
    return orgs.map((o) => ({ id: o.id, name: o.org_name, category: o.category }));
  }

  async createReferral(
    ctx: OrgAccessContext,
    input: { case_id: string; to_org_id: string; notes?: string }
  ) {
    if (!input.case_id || !input.to_org_id) {
      throw new BadRequestError('case_id and to_org_id are required');
    }
    if (input.to_org_id === ctx.orgId) {
      throw new BadRequestError('Cannot refer a case to your own organization');
    }

    const theCase = await prisma.partnerCase.findFirst({
      where: { id: input.case_id, ...caseListWhere(ctx) },
      select: { id: true },
    });
    if (!theCase) throw new NotFoundError('Case not found in your organization');

    const targetOrg = await prisma.organization.findFirst({
      where: { id: input.to_org_id, active: true },
      select: { id: true },
    });
    if (!targetOrg) throw new BadRequestError('Target organization not found');

    const created = await prisma.referral.create({
      data: {
        case_id: input.case_id,
        from_org_id: ctx.orgId,
        to_org_id: input.to_org_id,
        referred_by: ctx.orgUserId,
        status: 'pending',
        notes: input.notes?.trim() || null,
      },
    });

    const full = (await prisma.referral.findUnique({
      where: { id: created.id },
      include: referralInclude,
    })) as unknown as ReferralRow;
    const names = await this.orgNameMap([full.from_org_id, full.to_org_id]);
    return this.mapRow(full, ctx, names);
  }

  async updateStatus(
    ctx: OrgAccessContext,
    id: string,
    input: { action: 'accept' | 'decline'; outcome?: 'success' | 'fail' }
  ) {
    const referral = await prisma.referral.findUnique({
      where: { id },
      select: { id: true, to_org_id: true, from_org_id: true },
    });
    if (!referral) throw new NotFoundError('Referral not found');
    if (referral.to_org_id !== ctx.orgId) {
      throw new ForbiddenError('Only the receiving organization can respond to a referral');
    }
    if (input.action !== 'accept' && input.action !== 'decline') {
      throw new BadRequestError('action must be "accept" or "decline"');
    }

    await prisma.referral.update({
      where: { id },
      data: {
        status: input.action === 'accept' ? 'accepted' : 'declined',
        responded_at: new Date(),
        ...(input.outcome ? { outcome: input.outcome } : {}),
      },
    });

    const full = (await prisma.referral.findUnique({
      where: { id },
      include: referralInclude,
    })) as unknown as ReferralRow;
    const names = await this.orgNameMap([full.from_org_id, full.to_org_id]);
    return this.mapRow(full, ctx, names);
  }
}
