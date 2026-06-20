"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Trophy,
  AlertTriangle,
  FileX,
  ArrowUp,
  ArrowDown,
  Minus,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  Share2,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  PeriodTabs,
  periodNote,
  currentQuarter,
  type PeriodValue,
} from "@/components/dashboard/PeriodTabs";
import { DataOverlay } from "@/components/dashboard/DashboardLoading";
import { cn } from "@/lib/utils";

interface ProgramRow {
  code: string;
  name: string;
  color: string;
  submitted: number;
  approved: number;
  denied: number;
  pending: number;
  approval_rate: number;
  avg_days: number | null;
  trend: "up" | "down" | "flat";
}

interface DenialReason {
  reason: string;
  programs: string[];
  pct: number;
  count: number;
}

interface ProgramPerformance {
  quarter: string;
  year: number;
  period_label: string;
  summary: {
    submitted: number;
    approved: number;
    denied: number;
    decided: number;
    approval_rate: number;
    avg_days: number | null;
  };
  best: { program: string; rate: number; detail: string } | null;
  worst: { program: string; rate: number; detail: string } | null;
  programs: ProgramRow[];
  denial_reasons: DenialReason[];
}

async function fetchProgramPerformance(p: PeriodValue): Promise<ProgramPerformance> {
  const res = await api.get("/api/partner/dashboard/program-performance", {
    params: { quarter: p.quarter, year: p.year },
  });
  return res.data.data;
}

function rateClass(rate: number): string {
  return rate >= 75 ? "text-status-success" : rate >= 60 ? "text-status-warning" : "text-status-error";
}
function rateBg(rate: number): string {
  return rate >= 75 ? "#10B981" : rate >= 60 ? "#F59E0B" : "#EF4444";
}

const TRAINING_RULES: Record<
  string,
  { title: string; detail: string; tag: "High" | "Medium" | "Quick win"; icon: typeof Briefcase }
> = {
  "work-requirement": {
    title: "Work-requirement documentation",
    detail: "Most denials trace to incomplete work docs. A refresher could lift approvals several points.",
    tag: "High",
    icon: Briefcase,
  },
  income: {
    title: "Income verification checklist",
    detail: "Standardize a pre-submission income document checklist to reduce avoidable denials.",
    tag: "High",
    icon: FileText,
  },
  "missed interview": {
    title: "Interview no-show prevention",
    detail: "Enable automated 48h and 2h reminders via the messaging system.",
    tag: "Medium",
    icon: CalendarCheck,
  },
  residency: {
    title: "Residency documentation guide",
    detail: "Share an accepted-proof-of-residency cheat sheet with the team.",
    tag: "Medium",
    icon: GraduationCap,
  },
};

function trainingFor(denials: DenialReason[], best: ProgramPerformance["best"]) {
  const items: {
    title: string;
    detail: string;
    tag: "High" | "Medium" | "Quick win";
    icon: typeof Briefcase;
  }[] = [];
  for (const d of denials.slice(0, 3)) {
    const key = Object.keys(TRAINING_RULES).find((k) => d.reason.toLowerCase().includes(k));
    if (key) items.push(TRAINING_RULES[key]);
  }
  if (best && best.rate >= 80) {
    items.push({
      title: `Share the ${best.program} playbook`,
      detail: `${best.program}'s high approval workflow is the org's best practice — have the lead caseworker present it.`,
      tag: "Quick win",
      icon: Share2,
    });
  }
  return items;
}

const TAG_STYLES: Record<string, string> = {
  High: "bg-status-error-bg text-status-error",
  Medium: "bg-status-warning-bg text-status-warning",
  "Quick win": "bg-status-success-bg text-status-success",
};

export function ProgramPerformanceClient() {
  const [period, setPeriod] = useState<PeriodValue>({
    quarter: currentQuarter(),
    year: new Date().getFullYear(),
  });

  const { data, isFetching } = useQuery({
    queryKey: ["program-performance", period.quarter, period.year],
    queryFn: () => fetchProgramPerformance(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const s = data?.summary;
  const programs = data?.programs ?? [];
  const training = data ? trainingFor(data.denial_reasons, data.best) : [];

  return (
    <div className="flex-1 p-8 space-y-4">
      <PeriodTabs value={period} onChange={setPeriod} />

      <DataOverlay loading={isFetching}>
        <div className="space-y-4">
      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 flex items-start gap-3 bg-status-success-bg border-status-success/30">
          <div className="w-10 h-10 rounded-xl bg-status-success/15 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-status-success" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-status-success">
              Top performer
            </div>
            <div className="text-lg font-extrabold text-status-success mt-0.5">
              {data?.best ? `${data.best.program} — ${data.best.rate}%` : "—"}
            </div>
            <div className="text-[11px] text-status-success/90 mt-0.5">
              {data?.best?.detail ?? "No decided applications this period."}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3 bg-status-error-bg border-status-error/30">
          <div className="w-10 h-10 rounded-xl bg-status-error/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-status-error" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-status-error">
              Needs attention
            </div>
            <div className="text-lg font-extrabold text-status-error mt-0.5">
              {data?.worst ? `${data.worst.program} — ${data.worst.rate}%` : "—"}
            </div>
            <div className="text-[11px] text-status-error/90 mt-0.5">
              {data?.worst?.detail ?? "Not enough data to compare programs."}
            </div>
          </div>
        </Card>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Submitted" value={s?.submitted ?? 0} />
        <Stat label="Approved" value={s?.approved ?? 0} valueClass="text-status-success" />
        <Stat label="Denied" value={s?.denied ?? 0} valueClass="text-status-error" />
        <Stat label="Approval rate" value={`${s?.approval_rate ?? 0}%`} valueClass="text-status-warning" />
        <Stat label="Avg days to decision" value={s?.avg_days ?? "—"} />
      </div>

      {/* Performance by program */}
      <Card className="p-5">
        <SectionTitle title="Performance by program" sub={`All programs · ${periodNote(period)}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-soft border-b-2 border-partner-200">
                <th className="text-left py-2 px-2 font-semibold">Program</th>
                <th className="text-right py-2 px-2 font-semibold">Submitted</th>
                <th className="text-right py-2 px-2 font-semibold">Approved</th>
                <th className="text-right py-2 px-2 font-semibold">Denied</th>
                <th className="text-right py-2 px-2 font-semibold">Pending</th>
                <th className="text-right py-2 px-2 font-semibold">Approval rate</th>
                <th className="text-right py-2 px-2 font-semibold">Avg days</th>
                <th className="text-right py-2 px-2 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-text-soft text-sm">
                    No applications recorded for this period.
                  </td>
                </tr>
              )}
              {programs.map((p) => (
                <tr key={p.code} className="border-b border-surface-border last:border-0 hover:bg-partner-50/50">
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                      <span className="font-semibold text-text-dark">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-right px-2 tabular-nums">{p.submitted}</td>
                  <td className="text-right px-2 tabular-nums text-status-success">{p.approved}</td>
                  <td className="text-right px-2 tabular-nums text-status-error">{p.denied}</td>
                  <td className="text-right px-2 tabular-nums text-text-soft">{p.pending}</td>
                  <td className="text-right px-2">
                    <span className={cn("font-bold tabular-nums", rateClass(p.approval_rate))}>
                      {p.approval_rate}%
                    </span>
                    <span className="inline-block w-16 h-1.5 rounded-full bg-partner-100 ml-2 align-middle overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${p.approval_rate}%`, background: rateBg(p.approval_rate) }}
                      />
                    </span>
                  </td>
                  <td className="text-right px-2 tabular-nums text-text-mid">
                    {p.avg_days != null ? p.avg_days : "—"}
                  </td>
                  <td className="text-right px-2">
                    <TrendBadge trend={p.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approvals vs denials */}
      <Card className="p-5">
        <SectionTitle title="Approvals vs denials" sub="Share of decided applications this period" />
        <div className="space-y-2.5">
          {programs.filter((p) => p.approved + p.denied > 0).length === 0 && (
            <div className="text-sm text-text-soft py-2">No decided applications yet.</div>
          )}
          {programs
            .filter((p) => p.approved + p.denied > 0)
            .map((p) => {
              const decided = p.approved + p.denied;
              const appPct = Math.round((p.approved / decided) * 100);
              const denPct = 100 - appPct;
              return (
                <div key={p.code} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold w-16 shrink-0">{p.name}</span>
                  <div className="flex-1 h-5 rounded-md overflow-hidden flex bg-partner-100">
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${appPct}%`, background: "#7F77DD" }}
                    >
                      {appPct > 18 ? `${p.approved}` : ""}
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold"
                      style={{ width: `${denPct}%`, background: "#E0A6B6", color: "#5A1F30" }}
                    >
                      {denPct > 14 ? `${p.denied}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] text-text-soft w-20 text-right shrink-0">
                    {appPct}% / {denPct}%
                  </span>
                </div>
              );
            })}
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-text-soft">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#7F77DD" }} />
            Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#E0A6B6" }} />
            Denied
          </span>
        </div>
      </Card>

      {/* Top denial reasons */}
      <Card className="p-5">
        <SectionTitle title="Top denial reasons" sub="Across all denials this period, with affected programs" />
        {data && data.denial_reasons.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-text-soft py-2">
            <FileX className="w-4 h-4" /> No denials recorded this period.
          </div>
        )}
        <div>
          {data?.denial_reasons.map((d, i) => (
            <div
              key={d.reason}
              className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0"
            >
              <span className="w-5 h-5 rounded-full bg-partner-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-text-dark">
                {d.reason}
                {d.programs.map((p) => (
                  <span
                    key={p}
                    className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-partner-100 text-partner-700"
                  >
                    {p}
                  </span>
                ))}
              </span>
              <span className="text-sm font-bold text-status-error w-10 text-right">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommended training */}
      {training.length > 0 && (
        <Card className="p-5">
          <SectionTitle title="Recommended training & support" sub="Derived from the denial patterns above" />
          <div>
            {training.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 border-b border-surface-border last:border-0"
              >
                <div className="w-7 h-7 rounded-lg bg-partner-100 text-partner-700 flex items-center justify-center shrink-0">
                  <t.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-dark">{t.title}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">{t.detail}</div>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0",
                    TAG_STYLES[t.tag]
                  )}
                >
                  {t.tag}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
        </div>
      </DataOverlay>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="text-[11px] text-text-soft mb-1">{label}</div>
      <div className={cn("text-2xl font-extrabold tabular-nums text-text-dark", valueClass)}>
        {value}
      </div>
    </Card>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-partner-700">{title}</div>
      {sub && <div className="text-[11px] text-text-soft mt-0.5">{sub}</div>}
    </div>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-status-success">
        <ArrowUp className="w-3 h-3" /> up
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-status-error">
        <ArrowDown className="w-3 h-3" /> down
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-text-soft">
      <Minus className="w-3 h-3" /> flat
    </span>
  );
}
