import { prisma } from '../../config/prisma';
import { caseListWhere, OrgAccessContext, isOrgAdmin } from './partner-access';
import { decimalToNumberOrNull } from '../../utils/decimal.utils';

// ─────────────────────────────────────────────────────────────
// Shared program metadata (label + chart colour, matching the
// client-provided dashboard mockups)
// ─────────────────────────────────────────────────────────────
const PROGRAM_META: Record<string, { label: string; color: string }> = {
  wic: { label: 'WIC', color: '#378ADD' },
  medicaid: { label: 'Medicaid', color: '#2F7D32' },
  chip: { label: 'CHIP', color: '#1D9E75' },
  snap: { label: 'SNAP', color: '#7F77DD' },
  tanf: { label: 'TANF', color: '#9A6A0B' },
  ccdf: { label: 'CCAP', color: '#C2557A' },
  section8: { label: 'Housing', color: '#5B8DB8' },
  liheap: { label: 'LIHEAP', color: '#B07ACB' },
};

const FALLBACK_COLOR = '#7F77DD';

function programLabel(programId: string, programName?: string): string {
  return (
    PROGRAM_META[programId]?.label ??
    programName?.split(/[—–-]/)[0]?.trim() ??
    programId
  );
}

function programColor(programId: string): string {
  return PROGRAM_META[programId]?.color ?? FALLBACK_COLOR;
}

// Quarter → calendar month range (matches partner-cases.service)
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

/** Previous quarter relative to the given quarter/year (for trend comparison). */
function previousQuarter(quarter: string, year: number): { quarter: string; year: number } {
  const order = ['Q1', 'Q2', 'Q3', 'Q4'];
  const idx = order.indexOf(quarter.toUpperCase());
  if (idx <= 0) return { quarter: 'Q4', year: year - 1 };
  return { quarter: order[idx - 1], year };
}

const Q_MONTHS: Record<string, string> = {
  Q1: 'Jan–Mar',
  Q2: 'Apr–Jun',
  Q3: 'Jul–Sep',
  Q4: 'Oct–Dec',
};

function periodLabel(quarter: string, year: number, isFy: boolean): string {
  if (isFy) return `FY ${year} to date`;
  return `${quarter.toUpperCase()} ${year} · ${Q_MONTHS[quarter.toUpperCase()] ?? ''}`.trim();
}

/** Treat a case as "approved" / "denied" using its recorded outcome first,
 *  falling back to the case status when no outcome row exists. */
type DecisionCase = {
  status: string;
  intake_date: Date | null;
  updated_at: Date;
  outcomes: { result: string; denial_reason: string | null; decided_at: Date | null }[];
};

function caseDecision(c: DecisionCase): {
  decided: boolean;
  approved: boolean;
  denied: boolean;
  denialReason: string | null;
  daysToDecision: number | null;
} {
  const outcome = c.outcomes[0];
  let approved = false;
  let denied = false;
  let denialReason: string | null = null;
  let decidedAt: Date | null = null;

  if (outcome) {
    approved = outcome.result === 'approved';
    denied = outcome.result === 'denied';
    denialReason = outcome.denial_reason ?? null;
    decidedAt = outcome.decided_at ?? c.updated_at;
  } else {
    approved = c.status === 'approved';
    denied = c.status === 'denied' || c.status === 'rejected';
    if (approved || denied) decidedAt = c.updated_at;
  }

  let daysToDecision: number | null = null;
  if (decidedAt && c.intake_date) {
    const ms = decidedAt.getTime() - c.intake_date.getTime();
    daysToDecision = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  return { decided: approved || denied, approved, denied, denialReason, daysToDecision };
}

const TERMINAL_STATUSES = new Set(['approved', 'denied', 'rejected', 'closed']);

type TeamSummaryDeltas = {
  total_active_cases: number;
  avg_completion: number;
  avg_response_hours: number | null;
  renewals_at_risk: number;
  capacity_used: number;
  compare_label: string;
};

export class PartnerDashboardService {
  // ───────────────────────────────────────────────────────────
  // 1. Program Performance Breakdown
  // ───────────────────────────────────────────────────────────
  async getProgramPerformance(ctx: OrgAccessContext, quarterInput?: string, yearInput?: number) {
    const year = yearInput ?? new Date().getFullYear();
    const rawQuarter = (quarterInput ?? currentQuarter()).toUpperCase();
    const isFy = rawQuarter === 'FY';
    const quarter = isFy ? currentQuarter() : rawQuarter;

    // Quarter filter on the case rows; FY = whole calendar year.
    const quarterFilter = isFy ? {} : { quarter };
    const prev = isFy ? null : previousQuarter(quarter, year);

    const caseSelect = {
      program_id: true,
      status: true,
      intake_date: true,
      updated_at: true,
      program: { select: { id: true, name: true } },
      outcomes: {
        orderBy: { decided_at: 'desc' as const },
        take: 1,
        select: { result: true, denial_reason: true, decided_at: true },
      },
    };

    // Fetch current + previous-quarter cases concurrently to cut latency
    const [cases, prevCases] = await Promise.all([
      prisma.partnerCase.findMany({
        where: { ...caseListWhere(ctx), ...quarterFilter },
        select: caseSelect,
      }),
      prev
        ? prisma.partnerCase.findMany({
            where: { ...caseListWhere(ctx), quarter: prev.quarter },
            select: caseSelect,
          })
        : Promise.resolve([]),
    ]);

    // Previous quarter rates (for per-program trend) — empty for FY view.
    const prevRates: Record<string, number> = prev ? this.ratesByProgram(prevCases) : {};

    // Aggregate by program
    type Agg = {
      program_id: string;
      name: string;
      submitted: number;
      approved: number;
      denied: number;
      daysSum: number;
      daysCount: number;
    };
    const byProgram = new Map<string, Agg>();
    const denialReasons = new Map<string, { count: number; programs: Set<string> }>();

    let totalSubmitted = 0;
    let totalApproved = 0;
    let totalDenied = 0;
    let decisionDaysSum = 0;
    let decisionDaysCount = 0;

    for (const c of cases) {
      const pid = c.program_id;
      const agg =
        byProgram.get(pid) ??
        {
          program_id: pid,
          name: c.program?.name ?? pid,
          submitted: 0,
          approved: 0,
          denied: 0,
          daysSum: 0,
          daysCount: 0,
        };
      agg.submitted++;
      totalSubmitted++;

      const d = caseDecision(c);
      if (d.approved) {
        agg.approved++;
        totalApproved++;
      }
      if (d.denied) {
        agg.denied++;
        totalDenied++;
        const reason = d.denialReason?.trim() || 'Other / administrative';
        const entry = denialReasons.get(reason) ?? { count: 0, programs: new Set<string>() };
        entry.count++;
        entry.programs.add(pid);
        denialReasons.set(reason, entry);
      }
      if (d.daysToDecision != null) {
        decisionDaysSum += d.daysToDecision;
        decisionDaysCount++;
        agg.daysSum += d.daysToDecision;
        agg.daysCount++;
      }

      byProgram.set(pid, agg);
    }

    const programs = Array.from(byProgram.values())
      .map((a) => {
        const approvalRate = a.submitted > 0 ? Math.round((a.approved / a.submitted) * 100) : 0;
        const prev = prevRates[a.program_id];
        let trend: 'up' | 'down' | 'flat' = 'flat';
        if (prev != null) {
          if (approvalRate - prev > 2) trend = 'up';
          else if (prev - approvalRate > 2) trend = 'down';
        }
        return {
          code: a.program_id,
          name: programLabel(a.program_id, a.name),
          color: programColor(a.program_id),
          submitted: a.submitted,
          approved: a.approved,
          denied: a.denied,
          pending: Math.max(0, a.submitted - a.approved - a.denied),
          approval_rate: approvalRate,
          avg_days: a.daysCount > 0 ? Math.round(a.daysSum / a.daysCount) : null,
          trend,
        };
      })
      .sort((x, y) => y.approval_rate - x.approval_rate);

    const totalDecided = totalApproved + totalDenied;
    const overallRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0;
    const avgDays = decisionDaysCount > 0 ? Math.round(decisionDaysSum / decisionDaysCount) : null;

    // Best / worst performer (only consider programs with at least one submission)
    const decidedPrograms = programs.filter((p) => p.submitted > 0);
    const best = decidedPrograms[0] ?? null;
    const worst = decidedPrograms.length > 1 ? decidedPrograms[decidedPrograms.length - 1] : null;

    const denial_reasons = Array.from(denialReasons.entries())
      .map(([reason, v]) => ({
        reason,
        programs: Array.from(v.programs).map((pid) => programLabel(pid)),
        pct: totalDenied > 0 ? Math.round((v.count / totalDenied) * 100) : 0,
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      quarter: isFy ? 'FY' : quarter,
      year,
      period_label: periodLabel(quarter, year, isFy),
      summary: {
        submitted: totalSubmitted,
        approved: totalApproved,
        denied: totalDenied,
        pending: Math.max(0, totalSubmitted - totalApproved - totalDenied),
        decided: totalDecided,
        approval_rate: overallRate,
        avg_days: avgDays,
      },
      best: best
        ? {
            program: best.name,
            rate: best.approval_rate,
            detail: `Highest approval rate this period (${best.approved}/${best.submitted} approved).`,
          }
        : null,
      worst: worst
        ? {
            program: worst.name,
            rate: worst.approval_rate,
            detail: `Lowest approval rate — ${worst.denied} denial${worst.denied === 1 ? '' : 's'} this period.`,
          }
        : null,
      programs,
      denial_reasons,
    };
  }

  private ratesByProgram(
    cases: Array<DecisionCase & { program_id: string }>
  ): Record<string, number> {
    const agg = new Map<string, { submitted: number; approved: number }>();
    for (const c of cases) {
      const a = agg.get(c.program_id) ?? { submitted: 0, approved: 0 };
      a.submitted++;
      if (caseDecision(c).approved) a.approved++;
      agg.set(c.program_id, a);
    }
    const out: Record<string, number> = {};
    for (const [pid, a] of agg) {
      out[pid] = a.submitted > 0 ? Math.round((a.approved / a.submitted) * 100) : 0;
    }
    return out;
  }

  // ───────────────────────────────────────────────────────────
  // 2. Team Overview Panel (admin scope)
  // ───────────────────────────────────────────────────────────
  async getTeamOverview(ctx: OrgAccessContext, quarterInput?: string, yearInput?: number) {
    const year = yearInput ?? new Date().getFullYear();
    const rawQuarter = (quarterInput ?? currentQuarter()).toUpperCase();
    const isFy = rawQuarter === 'FY';
    const quarter = isFy ? currentQuarter() : rawQuarter;

    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    // Fetch current + previous-quarter cards concurrently to cut latency
    const prev = isFy ? null : previousQuarter(quarter, year);
    const [workerCards, prevCards] = await Promise.all([
      this.computeWorkerCards(ctx, quarter, year, isFy, now, in30Days),
      prev
        ? this.computeWorkerCards(ctx, prev.quarter, prev.year, false, now, in30Days)
        : Promise.resolve(null),
    ]);

    // Org-level summary
    const summary = this.summarizeCards(workerCards);

    // Quarter-over-quarter deltas (skipped for FY view)
    let deltas: TeamSummaryDeltas | null = null;
    if (prev && prevCards) {
      const prevSummary = this.summarizeCards(prevCards);
      deltas = {
        total_active_cases: summary.total_active_cases - prevSummary.total_active_cases,
        avg_completion: summary.avg_completion - prevSummary.avg_completion,
        avg_response_hours:
          summary.avg_response_hours != null && prevSummary.avg_response_hours != null
            ? Math.round((summary.avg_response_hours - prevSummary.avg_response_hours) * 10) / 10
            : null,
        renewals_at_risk: summary.renewals_at_risk - prevSummary.renewals_at_risk,
        capacity_used: summary.capacity_used - prevSummary.capacity_used,
        compare_label: `vs ${prev.quarter}`,
      };
    }

    // Suggested rebalancing: overloaded → healthiest worker with a shared program
    const reassign = this.buildReassignments(workerCards);

    return {
      quarter: isFy ? 'FY' : quarter,
      year,
      period_label: periodLabel(quarter, year, isFy),
      summary: { ...summary, deltas },
      workers: workerCards,
      reassign,
    };
  }

  private async computeWorkerCards(
    ctx: OrgAccessContext,
    quarter: string,
    year: number,
    isFy: boolean,
    now: Date,
    in30Days: Date
  ) {
    const quarterFilter = isFy ? {} : { quarter };

    // Caseworkers in the org (admins manage caseworkers; caseworkers see only themselves)
    const workerWhere = isOrgAdmin(ctx)
      ? { org_id: ctx.orgId, is_active: true, role: 'caseworker' as const }
      : { id: ctx.orgUserId, org_id: ctx.orgId, is_active: true };

    const workers = await prisma.orgUser.findMany({
      where: workerWhere,
      select: {
        id: true,
        full_name: true,
        role: true,
        caseload_capacity: true,
        caseworker_metrics: {
          where: { period: isFy ? `FY${year}` : `${quarter}-${year}` },
          take: 1,
          select: {
            active_case_count: true,
            completion_rate: true,
            avg_response_hours: true,
            caseload_utilization: true,
          },
        },
        cases: {
          where: quarterFilter,
          select: {
            program_id: true,
            status: true,
            deadlines: {
              where: { is_resolved: false, type: 'renewal', due_date: { gte: now, lte: in30Days } },
              select: { id: true },
            },
            documents: { where: { review_status: 'pending' }, select: { id: true } },
            communications: {
              where: { sent_at: { not: null }, responded_at: { not: null } },
              select: { sent_at: true, responded_at: true },
            },
          },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    const DEFAULT_CAPACITY = 8;

    return workers.map((w) => {
      const metric = w.caseworker_metrics[0];
      const capacity = w.caseload_capacity ?? DEFAULT_CAPACITY;

      const activeCases = w.cases.filter((c) => !TERMINAL_STATUSES.has(c.status)).length;
      const totalCases = w.cases.length;
      const approvedOrSubmitted = w.cases.filter(
        (c) => c.status === 'approved' || c.status === 'submitted'
      ).length;

      // completion: prefer pre-computed metric, else derive
      const completion =
        decimalToNumberOrNull(metric?.completion_rate) ??
        (totalCases > 0 ? Math.round((approvedOrSubmitted / totalCases) * 100) : 0);

      // avg response hours: prefer metric, else compute from communications
      let responseHours = decimalToNumberOrNull(metric?.avg_response_hours);
      if (responseHours == null) {
        const durations: number[] = [];
        for (const c of w.cases) {
          for (const comm of c.communications) {
            if (comm.sent_at && comm.responded_at) {
              durations.push((comm.responded_at.getTime() - comm.sent_at.getTime()) / 3_600_000);
            }
          }
        }
        responseHours = durations.length
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
          : null;
      }

      const activeForCapacity = metric?.active_case_count ?? activeCases;
      const caseloadPct = capacity > 0 ? Math.round((activeForCapacity / capacity) * 100) : 0;
      const status: 'overloaded' | 'at-risk' | 'healthy' =
        caseloadPct > 100 ? 'overloaded' : caseloadPct >= 75 ? 'at-risk' : 'healthy';

      const programs = Array.from(new Set(w.cases.map((c) => c.program_id))).map((pid) =>
        programLabel(pid)
      );

      const renewalsDue = w.cases.filter(
        (c) => c.deadlines.length > 0 || c.status === 'renewal_due'
      ).length;
      const docsOverdue = w.cases.reduce((sum, c) => sum + c.documents.length, 0);

      const alerts: { text: string; level: 'danger' | 'warn' | 'win' }[] = [];
      if (caseloadPct > 100)
        alerts.push({ text: `${activeForCapacity} cases — over capacity limit`, level: 'danger' });
      else if (caseloadPct >= 90)
        alerts.push({ text: `At capacity limit — ${activeForCapacity}/${capacity} cases`, level: 'danger' });
      if (renewalsDue > 0)
        alerts.push({
          text: `${renewalsDue} renewal${renewalsDue > 1 ? 's' : ''} due this period`,
          level: caseloadPct > 100 ? 'danger' : 'warn',
        });
      if (responseHours != null && responseHours > 6)
        alerts.push({ text: 'Response time above 6h target', level: 'warn' });
      if (completion < 70)
        alerts.push({ text: 'Completion rate below 70% target', level: 'warn' });
      if (completion >= 85 && status === 'healthy')
        alerts.push({ text: 'Strong completion this period', level: 'win' });

      return {
        id: w.id,
        name: shortName(w.full_name),
        full_name: w.full_name,
        initials: initials(w.full_name),
        role: w.role === 'admin' ? 'Administrator' : 'Caseworker',
        active_cases: activeForCapacity,
        capacity,
        completion,
        response_hours: responseHours,
        caseload_pct: caseloadPct,
        status,
        programs,
        renewals_due: renewalsDue,
        docs_overdue: docsOverdue,
        alerts,
      };
    });
  }

  private summarizeCards(
    cards: Array<{
      active_cases: number;
      capacity: number;
      completion: number;
      response_hours: number | null;
      renewals_due: number;
      caseload_pct: number;
    }>
  ) {
    const totalActive = cards.reduce((s, w) => s + w.active_cases, 0);
    const totalCapacity = cards.reduce((s, w) => s + w.capacity, 0);
    const avgCompletion = cards.length
      ? Math.round(cards.reduce((s, w) => s + w.completion, 0) / cards.length)
      : 0;
    const respValues = cards.map((w) => w.response_hours).filter((v): v is number => v != null);
    const avgResponse = respValues.length
      ? Math.round((respValues.reduce((a, b) => a + b, 0) / respValues.length) * 10) / 10
      : null;
    return {
      total_active_cases: totalActive,
      avg_completion: avgCompletion,
      avg_response_hours: avgResponse,
      renewals_at_risk: cards.reduce((s, w) => s + w.renewals_due, 0),
      capacity_used: totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0,
      at_limit: cards.filter((w) => w.caseload_pct >= 100).length,
    };
  }

  private buildReassignments(
    workers: Array<{
      id: string;
      name: string;
      initials: string;
      active_cases: number;
      capacity: number;
      caseload_pct: number;
      status: string;
      programs: string[];
    }>
  ) {
    const overloaded = workers
      .filter((w) => w.status === 'overloaded')
      .sort((a, b) => b.caseload_pct - a.caseload_pct);
    const receivers = workers
      .filter((w) => w.status === 'healthy' && w.active_cases < w.capacity)
      .sort((a, b) => a.caseload_pct - b.caseload_pct);

    const slots = new Map(receivers.map((r) => [r.id, r.capacity - r.active_cases]));
    const out: Array<{
      from: { id: string; name: string; initials: string; cases: number; capacity: number };
      to: { id: string; name: string; initials: string; cases: number; capacity: number };
      cases: number;
      note: string;
    }> = [];

    for (const from of overloaded) {
      let toMove = from.active_cases - from.capacity;
      if (toMove < 1) toMove = 1;
      for (const to of receivers) {
        if (toMove <= 0) break;
        const free = slots.get(to.id) ?? 0;
        if (free <= 0) continue;
        const shared = from.programs.find((p) => to.programs.includes(p));
        const note = shared
          ? `${free} open slot${free > 1 ? 's' : ''} · ${shared} match`
          : `${free} open slot${free > 1 ? 's' : ''}`;
        out.push({
          from: { id: from.id, name: from.name, initials: from.initials, cases: from.active_cases, capacity: from.capacity },
          to: { id: to.id, name: to.name, initials: to.initials, cases: to.active_cases, capacity: to.capacity },
          cases: 1,
          note,
        });
        slots.set(to.id, free - 1);
        toMove--;
      }
    }
    return out;
  }
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}
