"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CircleCheck,
  FolderOpen,
  MessageSquare,
  ArrowLeftRight,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  PeriodTabs,
  periodNote,
  currentQuarter,
  type PeriodValue,
} from "@/components/dashboard/PeriodTabs";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  full_name: string;
  initials: string;
  role: string;
  active_cases: number;
  capacity: number;
  completion: number;
  response_hours: number | null;
  caseload_pct: number;
  status: "overloaded" | "at-risk" | "healthy";
  programs: string[];
  renewals_due: number;
  docs_overdue: number;
  alerts: { text: string; level: "danger" | "warn" | "win" }[];
}

interface Reassign {
  from: { id: string; name: string; initials: string; cases: number; capacity: number };
  to: { id: string; name: string; initials: string; cases: number; capacity: number };
  cases: number;
  note: string;
}

interface TeamOverview {
  quarter: string;
  year: number;
  period_label: string;
  summary: {
    total_active_cases: number;
    avg_completion: number;
    avg_response_hours: number | null;
    renewals_at_risk: number;
    capacity_used: number;
    at_limit: number;
  };
  workers: Worker[];
  reassign: Reassign[];
}

async function fetchTeamOverview(p: PeriodValue): Promise<TeamOverview> {
  const res = await api.get("/api/partner/dashboard/team-overview", {
    params: { quarter: p.quarter, year: p.year },
  });
  return res.data.data;
}

const STATUS_PILL: Record<Worker["status"], { cls: string; label: string; border: string }> = {
  overloaded: { cls: "bg-status-error-bg text-status-error", label: "Overloaded", border: "border-l-status-error" },
  "at-risk": { cls: "bg-status-warning-bg text-status-warning", label: "At risk", border: "border-l-status-warning" },
  healthy: { cls: "bg-status-success-bg text-status-success", label: "Healthy", border: "border-l-status-success" },
};

const AVATAR_COLORS = ["#534AB7", "#7F77DD", "#3C3489", "#9f99ff", "#6E66C9", "#8b67e0"];

function capColor(pct: number): string {
  return pct > 100 ? "#EF4444" : pct >= 75 ? "#F59E0B" : "#10B981";
}
function capTextClass(pct: number): string {
  return pct > 100 ? "text-status-error" : pct >= 75 ? "text-status-warning" : "text-status-success";
}

export function TeamOverviewClient() {
  const [period, setPeriod] = useState<PeriodValue>({
    quarter: currentQuarter(),
    year: new Date().getFullYear(),
  });

  const { data, isFetching } = useQuery({
    queryKey: ["team-overview", period.quarter, period.year],
    queryFn: () => fetchTeamOverview(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const s = data?.summary;
  const workers = data?.workers ?? [];
  const maxCases = Math.max(10, ...workers.map((w) => Math.max(w.active_cases, w.capacity)));

  return (
    <div className="flex-1 p-8 space-y-4">
      <PeriodTabs value={period} onChange={setPeriod} className={cn(isFetching && "opacity-70")} />

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total active cases" value={s?.total_active_cases ?? 0} />
        <Stat label="Avg completion" value={`${s?.avg_completion ?? 0}%`} valueClass="text-status-success" />
        <Stat
          label="Avg response"
          value={s?.avg_response_hours != null ? `${s.avg_response_hours}h` : "—"}
          valueClass="text-status-warning"
        />
        <Stat label="Renewals at risk" value={s?.renewals_at_risk ?? 0} valueClass="text-status-error" />
        <Stat
          label="Capacity used"
          value={`${s?.capacity_used ?? 0}%`}
          valueClass="text-status-warning"
          sub={s?.at_limit ? `${s.at_limit} at limit` : undefined}
        />
      </div>

      {/* Caseworker cards */}
      <div className="text-[11px] font-bold uppercase tracking-wide text-partner-700 pt-1">
        Caseworker cards
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {workers.length === 0 && (
          <Card className="p-5 text-sm text-text-soft col-span-full">
            No caseworkers found for this organization.
          </Card>
        )}
        {workers.map((w, idx) => {
          const pill = STATUS_PILL[w.status];
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn("p-4 border-l-[3px]", pill.border)}>
                {/* head */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                  >
                    {w.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-dark">{w.name}</div>
                    <div className="text-[11px] text-text-soft">{w.role}</div>
                  </div>
                  <span className={cn("ml-auto text-[11px] px-2 py-0.5 rounded-full font-semibold", pill.cls)}>
                    {pill.label}
                  </span>
                </div>

                {/* metrics */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  <Mini
                    value={w.active_cases}
                    label="Active"
                    valueClass={
                      w.active_cases > w.capacity
                        ? "text-status-error"
                        : w.active_cases / w.capacity >= 0.75
                        ? "text-status-warning"
                        : "text-status-success"
                    }
                  />
                  <Mini value={w.capacity} label="Capacity" />
                  <Mini
                    value={`${w.completion}%`}
                    label="Completion"
                    valueClass={
                      w.completion >= 75
                        ? "text-status-success"
                        : w.completion >= 60
                        ? "text-status-warning"
                        : "text-status-error"
                    }
                  />
                  <Mini
                    value={w.response_hours != null ? `${w.response_hours}h` : "—"}
                    label="Avg resp"
                    valueClass={
                      w.response_hours == null
                        ? undefined
                        : w.response_hours <= 5
                        ? "text-status-success"
                        : w.response_hours <= 7
                        ? "text-status-warning"
                        : "text-status-error"
                    }
                  />
                </div>

                {/* capacity bar */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-text-soft">Caseload capacity</span>
                  <span className={cn("text-[11px] font-semibold", capTextClass(w.caseload_pct))}>
                    {w.caseload_pct}% · {w.active_cases}/{w.capacity}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-partner-100 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(w.caseload_pct, 100)}%`, background: capColor(w.caseload_pct) }}
                  />
                </div>

                {/* programs + flags */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {w.programs.map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-partner-100 text-partner-700">
                      {p}
                    </span>
                  ))}
                  {w.renewals_due > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-status-error-bg text-status-error">
                      {w.renewals_due} renewal{w.renewals_due > 1 ? "s" : ""} due
                    </span>
                  )}
                  {w.docs_overdue > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-status-warning-bg text-status-warning">
                      {w.docs_overdue} doc{w.docs_overdue > 1 ? "s" : ""} overdue
                    </span>
                  )}
                </div>

                {/* alerts */}
                {w.alerts.length > 0 && (
                  <div className="mb-2.5 space-y-1">
                    {w.alerts.map((a, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-1.5 text-[11px]",
                          a.level === "danger"
                            ? "text-status-error"
                            : a.level === "win"
                            ? "text-status-success"
                            : "text-status-warning"
                        )}
                      >
                        {a.level === "danger" ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : a.level === "win" ? (
                          <CircleCheck className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* footer */}
                <div className="flex gap-1.5 pt-2.5 border-t border-surface-border">
                  <FooterBtn icon={FolderOpen} label="View cases" />
                  <FooterBtn icon={MessageSquare} label="Message" />
                  <FooterBtn icon={ArrowLeftRight} label="Reassign" primary />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Caseload vs capacity chart */}
      <Card className="p-5">
        <SectionTitle title="Caseload vs capacity" sub={`Active cases per worker against their capacity limit · ${periodNote(period)}`} />
        <div className="flex items-end gap-4 h-40 pt-2">
          {workers.map((w) => {
            const barH = Math.round((w.active_cases / maxCases) * 120);
            const capH = Math.round((w.capacity / maxCases) * 120);
            return (
              <div key={w.id} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full">
                <span className="text-[11px] font-semibold" style={{ color: capColor(w.caseload_pct) }}>
                  {w.active_cases}
                </span>
                <div className="relative w-full max-w-[56px]" style={{ height: `${barH}px` }}>
                  <div className="w-full h-full rounded-t-md" style={{ background: capColor(w.caseload_pct) }} />
                  <div
                    className="absolute left-[-4px] right-[-4px] border-t-2 border-dashed border-partner-300"
                    style={{ bottom: `${capH - barH}px` }}
                  />
                </div>
                <span className="text-[10px] text-text-soft text-center">{w.name}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-text-soft flex-wrap">
          <Legend color="#EF4444" label="Over capacity" />
          <Legend color="#F59E0B" label="At risk (75–100%)" />
          <Legend color="#10B981" label="Healthy (<75%)" />
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-partner-300" />
            Capacity limit
          </span>
        </div>
      </Card>

      {/* Suggested rebalancing */}
      <Card className="p-5">
        <SectionTitle title="Suggested rebalancing" sub="Recommended transfers to reduce overload this period" />
        {data && data.reassign.length === 0 && (
          <div className="text-sm text-text-soft py-1.5">
            No rebalancing needed — all caseworkers are within capacity this period.
          </div>
        )}
        {data?.reassign.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0 flex-wrap"
          >
            <ReassignSide name={r.from.name} initials={r.from.initials} sub={`${r.from.cases}/${r.from.capacity} cases`} />
            <ArrowRight className="w-4 h-4 text-partner-300 shrink-0" />
            <ReassignSide name={r.to.name} initials={r.to.initials} sub={`${r.to.cases}/${r.to.capacity} · ${r.note}`} />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-partner-100 text-partner-700 font-semibold whitespace-nowrap">
              −{r.cases} case
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
  sub,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="text-[11px] text-text-soft mb-1">{label}</div>
      <div className={cn("text-2xl font-extrabold tabular-nums text-text-dark", valueClass)}>{value}</div>
      {sub && <div className="text-[11px] text-text-soft mt-0.5">{sub}</div>}
    </Card>
  );
}

function Mini({
  value,
  label,
  valueClass,
}: {
  value: string | number;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-primary-subtle rounded-lg px-2.5 py-2">
      <div className={cn("text-base font-bold tabular-nums text-text-dark", valueClass)}>{value}</div>
      <div className="text-[10px] text-text-soft mt-0.5">{label}</div>
    </div>
  );
}

function FooterBtn({
  icon: Icon,
  label,
  primary,
}: {
  icon: typeof FolderOpen;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex-1 text-[11px] py-1.5 rounded-lg border flex items-center justify-center gap-1 transition-colors",
        primary
          ? "bg-partner-700 text-white border-partner-700 hover:bg-partner-800"
          : "bg-white text-partner-700 border-surface-border hover:bg-partner-50"
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function ReassignSide({ name, initials, sub }: { name: string; initials: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[190px]">
      <div className="w-7 h-7 rounded-full bg-partner-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
        {initials}
      </div>
      <div>
        <div className="text-xs font-bold text-text-dark whitespace-nowrap">{name}</div>
        <div className="text-[11px] text-text-soft">{sub}</div>
      </div>
    </div>
  );
}
