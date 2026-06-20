"use client";

import { useMemo, useState } from "react";
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
  Search,
  Check,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  Minus,
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
    deltas: {
      total_active_cases: number;
      avg_completion: number;
      avg_response_hours: number | null;
      renewals_at_risk: number;
      capacity_used: number;
      compare_label: string;
    } | null;
  };
  workers: Worker[];
  reassign: Reassign[];
}

type SortKey = "capacity" | "cases" | "completion" | "response";
type StatusFilter = "all" | "overloaded" | "at-risk" | "healthy";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("capacity");
  const [appliedTransfers, setAppliedTransfers] = useState<Set<number>>(new Set());

  const { data, isFetching } = useQuery({
    queryKey: ["team-overview", period.quarter, period.year],
    queryFn: () => fetchTeamOverview(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const s = data?.summary;
  const d = s?.deltas ?? null;
  const workers = data?.workers ?? [];
  const maxCases = Math.max(10, ...workers.map((w) => Math.max(w.active_cases, w.capacity)));

  const displayWorkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = workers.filter((w) => {
      const matchesSearch = !q || w.full_name.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const sorters: Record<SortKey, (a: Worker, b: Worker) => number> = {
      capacity: (a, b) => b.caseload_pct - a.caseload_pct,
      cases: (a, b) => b.active_cases - a.active_cases,
      completion: (a, b) => b.completion - a.completion,
      response: (a, b) => (b.response_hours ?? 0) - (a.response_hours ?? 0),
    };
    return [...filtered].sort(sorters[sortBy]);
  }, [workers, search, statusFilter, sortBy]);

  const allApplied = data ? data.reassign.length > 0 && appliedTransfers.size >= data.reassign.length : false;

  return (
    <div className="flex-1 p-8 space-y-4">
      <PeriodTabs value={period} onChange={setPeriod} />

      <DataOverlay loading={isFetching}>
        <div className="space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total active cases" value={s?.total_active_cases ?? 0} delta={d?.total_active_cases} deltaLabel={d?.compare_label} />
        <Stat label="Avg completion" value={`${s?.avg_completion ?? 0}%`} valueClass="text-status-success" delta={d?.avg_completion} deltaUnit="pts" deltaLabel={d?.compare_label} />
        <Stat
          label="Avg response"
          value={s?.avg_response_hours != null ? `${s.avg_response_hours}h` : "—"}
          valueClass="text-status-warning"
          delta={d?.avg_response_hours ?? undefined}
          deltaUnit="h"
          deltaLabel={d?.compare_label}
          higherIsWorse
        />
        <Stat label="Renewals at risk" value={s?.renewals_at_risk ?? 0} valueClass="text-status-error" delta={d?.renewals_at_risk} deltaLabel={d?.compare_label} higherIsWorse />
        <Stat
          label="Capacity used"
          value={`${s?.capacity_used ?? 0}%`}
          valueClass="text-status-warning"
          delta={d?.capacity_used}
          deltaUnit="pts"
          deltaLabel={d?.compare_label}
          higherIsWorse
          sub={s?.at_limit ? `${s.at_limit} at limit` : undefined}
        />
      </div>

      {/* Filter & sort toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-surface-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary-subtle border border-surface-border">
          <Search className="w-3.5 h-3.5 text-text-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search caseworker…"
            className="bg-transparent text-xs outline-none w-36 placeholder:text-text-soft text-text-dark"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "overloaded", "at-risk", "healthy"] as StatusFilter[]).map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-colors border",
                statusFilter === sf
                  ? "bg-partner-500 text-white border-partner-500"
                  : "bg-white text-partner-700 border-surface-border hover:bg-partner-50"
              )}
            >
              {sf === "all" ? "All" : sf.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-text-soft">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-xs font-semibold text-partner-700 bg-white border border-surface-border rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="capacity">Capacity used</option>
            <option value="cases">Case count</option>
            <option value="completion">Completion rate</option>
            <option value="response">Response time</option>
          </select>
        </div>
      </div>

      {/* Caseworker cards */}
      <div className="text-[11px] font-bold uppercase tracking-wide text-partner-700 pt-1">
        Caseworker cards
        {displayWorkers.length !== workers.length && (
          <span className="ml-2 font-medium normal-case text-text-soft">
            {displayWorkers.length} of {workers.length} shown
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {workers.length === 0 && (
          <Card className="p-5 text-sm text-text-soft col-span-full">
            No caseworkers found for this organization.
          </Card>
        )}
        {workers.length > 0 && displayWorkers.length === 0 && (
          <Card className="p-5 text-sm text-text-soft col-span-full">
            No caseworkers match the current filters.
          </Card>
        )}
        {displayWorkers.map((w, idx) => {
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
        <div className="flex items-start justify-between mb-3">
          <SectionTitle title="Suggested rebalancing" sub="Recommended transfers to reduce overload this period" />
          {data && data.reassign.length > 0 && (
            <button
              onClick={() => setAppliedTransfers(new Set(data.reassign.map((_, i) => i)))}
              disabled={allApplied}
              className={cn(
                "text-[11px] font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors shrink-0",
                allApplied
                  ? "bg-status-success-bg text-status-success border-status-success/30 cursor-default"
                  : "bg-partner-700 text-white border-partner-700 hover:bg-partner-800"
              )}
            >
              {allApplied ? <CheckCheck className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
              {allApplied ? "All applied" : "Apply all"}
            </button>
          )}
        </div>
        {data && data.reassign.length === 0 && (
          <div className="text-sm text-text-soft py-1.5">
            No rebalancing needed — all caseworkers are within capacity this period.
          </div>
        )}
        {data?.reassign.map((r, i) => {
          const applied = appliedTransfers.has(i);
          return (
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
              <button
                onClick={() => setAppliedTransfers((prev) => new Set(prev).add(i))}
                disabled={applied}
                className={cn(
                  "text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap shrink-0",
                  applied
                    ? "bg-status-success-bg text-status-success cursor-default"
                    : "bg-partner-700 text-white hover:bg-partner-800"
                )}
              >
                <Check className="w-3.5 h-3.5" />
                {applied ? "Applied" : "Apply"}
              </button>
            </div>
          );
        })}
      </Card>
        </div>
      </DataOverlay>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
  sub,
  delta,
  deltaUnit,
  deltaLabel,
  higherIsWorse,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  sub?: string;
  delta?: number;
  deltaUnit?: string;
  deltaLabel?: string;
  higherIsWorse?: boolean;
}) {
  const hasDelta = delta != null && delta !== 0;
  const positive = (delta ?? 0) > 0;
  // "good" colour = green; if higherIsWorse, an increase is bad
  const good = higherIsWorse ? !positive : positive;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;
  const sign = positive ? "+" : "";

  return (
    <Card className="p-3.5">
      <div className="text-[11px] text-text-soft mb-1">{label}</div>
      <div className={cn("text-2xl font-extrabold tabular-nums text-text-dark", valueClass)}>{value}</div>
      {hasDelta ? (
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold mt-0.5",
            good ? "text-status-success" : "text-status-error"
          )}
        >
          <DeltaIcon className="w-3 h-3" />
          {sign}
          {Math.abs(delta as number)}
          {deltaUnit ?? ""}
          {deltaLabel && <span className="font-normal text-text-soft">{deltaLabel}</span>}
        </div>
      ) : delta != null ? (
        <div className="flex items-center gap-1 text-[11px] text-text-soft mt-0.5">
          <Minus className="w-3 h-3" />
          {deltaLabel ?? "no change"}
        </div>
      ) : null}
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
