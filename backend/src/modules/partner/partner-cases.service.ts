import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import {
  caseListWhere,
  motherOrgWhere,
  OrgAccessContext,
  isOrgAdmin,
  secureSubmittedCaseWhere,
} from './partner-access';
import { formatUserName, hasUserName } from '../../utils/name.utils';
import { decimalToNumberOrNull } from '../../utils/decimal.utils';

const PROGRAM_SHORT: Record<string, string> = {
  snap: 'SNAP',
  wic: 'WIC',
  medicaid: 'Medicaid',
  tanf: 'TANF',
  ccdf: 'CCAP',
  section8: 'Housing',
  liheap: 'LIHEAP',
};

function programLabel(programId: string, programName?: string): string {
  return PROGRAM_SHORT[programId] ?? programName?.split(/[—–-]/)[0]?.trim() ?? programId;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatMotherNumber(motherId: string, index?: number): string {
  if (index != null) return `M-${String(index).padStart(4, '0')}`;
  const hex = motherId.replace(/-/g, '').slice(0, 4);
  const num = parseInt(hex, 16) % 10000;
  return `M-${String(num).padStart(4, '0')}`;
}

function caseworkerShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyFromDays(days: number | null): 'high' | 'moderate' | 'normal' {
  if (days == null) return 'normal';
  if (days <= 7) return 'high';
  if (days <= 14) return 'moderate';
  return 'normal';
}

function quarterDateRange(quarter: string, year: number) {
  const q = quarter.toUpperCase();
  const ranges: Record<string, [number, number]> = {
    Q1: [0, 2],
    Q2: [3, 5],
    Q3: [6, 8],
    Q4: [9, 11],
  };
  const [startMonth, endMonth] = ranges[q] ?? ranges.Q2;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0, 23, 59, 59, 999),
  };
}

function currentQuarter(): string {
  const m = new Date().getMonth();
  if (m < 3) return 'Q1';
  if (m < 6) return 'Q2';
  if (m < 9) return 'Q3';
  return 'Q4';
}

async function resolveMotherName(mother: {
  user?: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    family_profile?: { first_name: string | null; last_name: string | null } | null;
  } | null;
}): Promise<string> {
  const fp = mother.user?.family_profile;
  if (fp?.first_name || fp?.last_name) {
    return [fp.first_name, fp.last_name].filter(Boolean).join(' ');
  }
  if (hasUserName(mother.user)) return formatUserName(mother.user);
  return 'Unknown Mother';
}

const caseInclude = {
  mother: {
    include: {
      user: {
        include: { family_profile: true },
      },
    },
  },
  caseworker: true,
  program: true,
  deadlines: { where: { is_resolved: false }, orderBy: { due_date: 'asc' as const } },
  documents: { orderBy: { uploaded_at: 'desc' as const } },
  communications: { orderBy: { sent_at: 'desc' as const }, take: 1 },
  status_history: { orderBy: { changed_at: 'desc' as const }, take: 1 },
} as const;

function mapCaseRow(
  c: Awaited<ReturnType<typeof prisma.partnerCase.findFirst>> & {
    mother: NonNullable<Awaited<ReturnType<typeof prisma.partnerCase.findFirst>>> extends infer T
      ? T extends { mother: infer M }
        ? M
        : never
      : never;
    caseworker: { id: string; full_name: string } | null;
    program: { id: string; name: string };
    deadlines: { due_date: Date; type: string }[];
    communications: { type: string; message: string; sent_at: Date | null }[];
    status_history: { new_status: string; changed_at: Date; notes: string | null }[];
  },
  motherName: string,
  motherNumber: string
) {
  const nextDeadline = c.deadlines[0] ?? null;
  const days = nextDeadline ? daysUntil(nextDeadline.due_date) : null;
  const lastComm = c.communications[0];
  const lastHistory = c.status_history[0];
  const lastActivity = lastComm
    ? { description: lastComm.message, date: (lastComm.sent_at ?? new Date()).toISOString() }
    : lastHistory
      ? {
          description: lastHistory.notes ?? `Status changed to ${lastHistory.new_status}`,
          date: lastHistory.changed_at.toISOString(),
        }
      : null;

  let deadlineLabel: string | null = null;
  if (nextDeadline) {
    if (nextDeadline.type === 'renewal') {
      const d = new Date(nextDeadline.due_date);
      deadlineLabel = `Renewal: ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
    } else {
      deadlineLabel = new Date(nextDeadline.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  return {
    id: c.id,
    mother_id: c.mother_id,
    mother_name: motherName,
    mother_initials: initials(motherName),
    mother_number: motherNumber,
    program: programLabel(c.program.id, c.program.name),
    program_code: c.program.id,
    status: c.status,
    urgency: urgencyFromDays(days),
    deadline_date: nextDeadline?.due_date.toISOString() ?? null,
    deadline_label: deadlineLabel,
    last_activity: lastActivity,
    caseworker: c.caseworker
      ? {
          id: c.caseworker.id,
          name: caseworkerShortName(c.caseworker.full_name),
          full_name: c.caseworker.full_name,
          initials: initials(c.caseworker.full_name),
        }
      : null,
    quarter: c.quarter,
    intake_date: c.intake_date?.toISOString() ?? null,
    created_at: c.created_at.toISOString(),
  };
}

export class PartnerCasesService {
  async createCase(
    ctx: OrgAccessContext,
    input: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      dob?: string;
      address?: string;
      program_id: string;
      caseworker_id?: string;
      intake_date?: string;
      quarter?: string;
      notes?: string;
    }
  ) {
    const program = await prisma.benefitProgram.findFirst({
      where: { id: input.program_id, is_active: true },
    });
    if (!program) throw new BadRequestError('Invalid program');

    const caseworkerId = input.caseworker_id ?? ctx.orgUserId;
    const caseworker = await prisma.orgUser.findFirst({
      where: { id: caseworkerId, org_id: ctx.orgId, is_active: true },
    });
    if (!caseworker) throw new BadRequestError('Invalid caseworker');

    const email =
      input.email?.trim() ||
      `intake+${randomUUID().slice(0, 8)}@intake.momplan.internal`;
    const quarter = (input.quarter ?? currentQuarter()).toUpperCase();
    const intakeDate = input.intake_date ? new Date(input.intake_date) : new Date();
    const dob = input.dob ? new Date(input.dob) : null;

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          first_name: input.first_name.trim(),
          last_name: input.last_name.trim(),
          password_hash: '',
        },
      });

      await tx.familyProfile.create({
        data: {
          user_id: user.id,
          first_name: input.first_name.trim(),
          last_name: input.last_name.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          date_of_birth: dob,
          street_address: input.address?.trim() || null,
        },
      });

      const mother = await tx.mother.create({
        data: {
          user_id: user.id,
          caseworker_id: caseworkerId,
          dob,
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          enrollment_status: 'enrolled',
        },
      });

      const partnerCase = await tx.partnerCase.create({
        data: {
          mother_id: mother.id,
          caseworker_id: caseworkerId,
          program_id: input.program_id,
          status: 'not_started',
          urgency_level: 'normal',
          quarter,
          intake_date: intakeDate,
          last_activity: new Date(),
        },
      });

      await tx.statusHistory.create({
        data: {
          case_id: partnerCase.id,
          old_status: null,
          new_status: 'not_started',
          changed_by: ctx.orgUserId,
          notes: input.notes?.trim() || 'Case opened via partner portal',
        },
      });

      return partnerCase;
    });

    return this.getCaseDetail(ctx, created.id);
  }

  async listCases(
    ctx: OrgAccessContext,
    filters: {
      quarter?: string;
      year?: number;
      search?: string;
      status?: string;
      program?: string;
      caseworker?: string;
      limit?: number;
    }
  ) {
    const year = filters.year ?? new Date().getFullYear();
    const quarter = filters.quarter ?? currentQuarter();

    const caseworkerFilter = isOrgAdmin(ctx) ? filters.caseworker : undefined;

    const cases = await prisma.partnerCase.findMany({
      where: {
        ...caseListWhere(ctx, caseworkerFilter),
        ...secureSubmittedCaseWhere(),
        ...(filters.quarter ? { quarter: filters.quarter.toUpperCase() } : {}),
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.program && filters.program !== 'all' ? { program_id: filters.program } : {}),
      },
      include: caseInclude,
      orderBy: [{ urgency_level: 'desc' }, { last_activity: 'desc' }],
      take: filters.limit ?? 100,
    });

    const motherIndex = new Map<string, number>();
    cases.forEach((c, i) => motherIndex.set(c.mother_id, i + 1));

    const rows = await Promise.all(
      cases.map(async (c) => {
        const motherName = await resolveMotherName(c.mother);
        const motherNumber = formatMotherNumber(c.mother_id, motherIndex.get(c.mother_id));
        return mapCaseRow(c as any, motherName, motherNumber);
      })
    );

    const search = filters.search?.toLowerCase().trim();
    if (!search) return rows;

    return rows.filter(
      (r) =>
        r.mother_name.toLowerCase().includes(search) ||
        r.mother_number.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search)
    );
  }

  async getCaseDetail(ctx: OrgAccessContext, caseId: string) {
    const c = await prisma.partnerCase.findFirst({
      where: { id: caseId, ...caseListWhere(ctx) },
      include: {
        ...caseInclude,
        deadlines: { orderBy: { due_date: 'asc' } },
        documents: { orderBy: { uploaded_at: 'desc' } },
        communications: { orderBy: { sent_at: 'desc' }, take: 20 },
        status_history: { orderBy: { changed_at: 'desc' }, take: 20 },
        outcomes: { orderBy: { decided_at: 'desc' }, take: 1 },
      },
    });

    if (!c) {
      const inOrg = await prisma.partnerCase.findFirst({
        where: {
          id: caseId,
          mother: motherOrgWhere(ctx.orgId),
        },
        select: { id: true },
      });
      if (inOrg) throw new ForbiddenError('You do not have access to this case');
      throw new NotFoundError('Case not found');
    }

    const motherName = await resolveMotherName(c.mother);
    const motherNumber = formatMotherNumber(c.mother_id);
    const fp = c.mother.user?.family_profile;

    const nextDeadline = c.deadlines.find((d) => !d.is_resolved) ?? null;
    const days = nextDeadline ? daysUntil(nextDeadline.due_date) : null;

    const missingDocs = c.documents.filter((d) => d.review_status === 'pending' && !d.file_url);
    const alert =
      nextDeadline && days != null && days <= 14
        ? {
            message: `${programLabel(c.program.id)} ${nextDeadline.type} expires in ${days} day${days === 1 ? '' : 's'} — ${new Date(nextDeadline.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.${missingDocs.length ? ` ${missingDocs.length} document(s) still outstanding.` : ''} Benefits may lapse without action.`,
            severity: days <= 7 ? 'critical' : 'warning',
          }
        : null;

    const age = c.mother.dob
      ? Math.floor((Date.now() - c.mother.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const children: { name: string; age: string }[] = [];
    if (fp?.children_dobs?.length) {
      fp.children_dobs.forEach((dob, i) => {
        const birth = new Date(dob);
        const months = Math.floor((Date.now() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        const ageStr = months < 12 ? `${months} mo` : `${Math.floor(months / 12)}`;
        children.push({ name: `Child ${i + 1}`, age: ageStr });
      });
    }

    const activities = [
      ...c.communications.map((comm) => ({
        id: comm.id,
        type: comm.type,
        description: comm.message,
        date: (comm.sent_at ?? new Date()).toISOString(),
        color: comm.type.includes('request') ? 'red' : comm.type.includes('renewal') ? 'blue' : 'yellow',
      })),
      ...c.status_history.map((h) => ({
        id: h.id,
        type: 'status_change',
        description: h.notes ?? `Status changed to ${h.new_status}`,
        date: h.changed_at.toISOString(),
        color: h.new_status === 'approved' ? 'green' : 'yellow',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      ...mapCaseRow(c as any, motherName, motherNumber),
      alert,
      client_info: {
        phone: c.mother.phone ?? fp?.phone ?? null,
        email: fp?.email ?? c.mother.user?.email ?? null,
        address: c.mother.address ?? ([fp?.street_address, fp?.city, fp?.state, fp?.zip_code].filter(Boolean).join(', ') || null),
        household_size: fp?.household_size ?? null,
        children,
        preferred_contact: fp?.preferred_contact ?? 'email',
        language: fp?.preferred_language ?? 'English',
        dob: c.mother.dob?.toISOString() ?? null,
        age,
        assigned_date: c.intake_date?.toISOString() ?? c.created_at.toISOString(),
      },
      eligibility: {
        monthly_income: decimalToNumberOrNull(fp?.monthly_income),
        income_threshold_pct: 185,
        eligible: true,
        last_verified: fp?.updated_at?.toISOString() ?? null,
        needs_update: fp?.updated_at ? daysUntil(fp.updated_at) > 180 : true,
        proof_of_residency: c.documents.some((d) => d.doc_type.includes('residency') && d.review_status === 'approved')
          ? 'on_file'
          : 'not_on_file',
        postpartum_status: fp?.postpartum_months_since_birth
          ? `Active — ${fp.postpartum_months_since_birth} mo`
          : null,
        next_review_date: nextDeadline?.due_date.toISOString() ?? null,
      },
      documents: c.documents.map((d) => ({
        id: d.id,
        name: d.doc_type.replace(/_/g, ' '),
        file_url: d.file_url,
        status:
          d.review_status === 'approved'
            ? 'on_file'
            : d.review_status === 'pending' && d.file_url
              ? 'pending'
              : 'missing',
        uploaded_at: d.uploaded_at.toISOString(),
        expiry_date: d.expiry_date?.toISOString() ?? null,
      })),
      activity_log: activities,
      deadlines: c.deadlines.map((d) => ({
        id: d.id,
        type: d.type,
        due_date: d.due_date.toISOString(),
        is_resolved: d.is_resolved,
        days_remaining: daysUntil(d.due_date),
      })),
    };
  }

  async getDashboardSummary(ctx: OrgAccessContext, quarter?: string, year?: number) {
    const q = (quarter ?? currentQuarter()).toUpperCase();
    const y = year ?? new Date().getFullYear();
    const { start } = quarterDateRange(q, y);

    const cases = await prisma.partnerCase.findMany({
      where: { ...caseListWhere(ctx), ...secureSubmittedCaseWhere(), quarter: q },
      include: {
        deadlines: { where: { is_resolved: false } },
        documents: true,
      },
    });

    const now = new Date();
    const in14Days = new Date(now);
    in14Days.setDate(in14Days.getDate() + 14);

    let renewalDueSoon = 0;
    let incompleteDocs = 0;
    let approvedThisQuarter = 0;

    for (const c of cases) {
      const hasRenewalSoon = c.deadlines.some(
        (d) => d.type === 'renewal' && d.due_date <= in14Days && d.due_date >= now
      );
      if (hasRenewalSoon || c.status === 'renewal_due') renewalDueSoon++;

      const hasMissing = c.documents.some((d) => d.review_status === 'pending');
      if (hasMissing) incompleteDocs++;

      if (c.status === 'approved' && c.updated_at >= start) approvedThisQuarter++;
    }

    return {
      renewal_due_soon: renewalDueSoon,
      incomplete_docs: incompleteDocs,
      approved_this_quarter: approvedThisQuarter,
      total_assigned: cases.length,
      quarter: q,
      year: y,
    };
  }

  async getFilterOptions(ctx: OrgAccessContext) {
    const caseworkerWhere = isOrgAdmin(ctx)
      ? { org_id: ctx.orgId, is_active: true, role: 'caseworker' as const }
      : { id: ctx.orgUserId, org_id: ctx.orgId, is_active: true };

    const [caseworkers, programs] = await Promise.all([
      prisma.orgUser.findMany({
        where: caseworkerWhere,
        select: { id: true, full_name: true },
        orderBy: { full_name: 'asc' },
      }),
      prisma.benefitProgram.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      statuses: ['not_started', 'in_progress', 'submitted', 'approved', 'renewal_due'],
      programs: programs.map((p) => ({ id: p.id, label: programLabel(p.id, p.name) })),
      caseworkers: caseworkers.map((cw) => ({
        id: cw.id,
        name: caseworkerShortName(cw.full_name),
        full_name: cw.full_name,
      })),
    };
  }

  async sendReminder(ctx: OrgAccessContext, caseId: string) {
    const c = await prisma.partnerCase.findFirst({
      where: { id: caseId, ...caseListWhere(ctx) },
    });
    if (!c) {
      const inOrg = await prisma.partnerCase.findFirst({
        where: { id: caseId, mother: motherOrgWhere(ctx.orgId) },
        select: { id: true },
      });
      if (inOrg) throw new ForbiddenError('You do not have access to this case');
      throw new NotFoundError('Case not found');
    }

    await prisma.communication.create({
      data: {
        case_id: caseId,
        sent_by: ctx.orgUserId,
        type: 'reminder',
        channel: 'email',
        message: 'Renewal reminder sent to client',
        sent_at: new Date(),
        delivery_status: 'sent',
      },
    });

    return { success: true };
  }
}
