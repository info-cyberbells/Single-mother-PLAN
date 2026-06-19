"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, FolderOpen, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuarterTabs, currentQuarter } from "@/components/cases/QuarterTabs";
import { usePartnerAuthStore } from "@/store/auth.store";
import { isOrgAdmin } from "@/lib/auth-utils";
import { formatDate, formatRelativeDate, initials, cn } from "@/lib/utils";
import type { AlertItem, AlertSummary, CaseFilterOptions } from "@/types";

const BUCKET_LABELS = {
  critical: { label: "Critical (≤7 days)", sub: "immediate action", border: "border-l-status-error", color: "text-status-error" },
  soon: { label: "Soon (8–14 days)", sub: "schedule now", border: "border-l-status-warning", color: "text-status-warning" },
  upcoming: { label: "Upcoming (15–30 days)", sub: "plan ahead", border: "border-l-partner-500", color: "text-partner-600" },
  on_track: { label: "On Track (30+ days)", sub: "monitor", border: "border-l-status-success", color: "text-status-success" },
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  renewal: "text-status-error bg-status-error-bg",
  doc_expiry: "text-status-warning bg-status-warning-bg",
};

const PROGRAM_COLORS: Record<string, string> = {
  SNAP: "bg-secondary-100 text-secondary-700",
  Medicaid: "bg-green-100 text-green-700",
  WIC: "bg-primary-100 text-primary-700",
  TANF: "bg-orange-100 text-orange-700",
};

async function fetchAlertSummary(quarter: string): Promise<AlertSummary> {
  const res = await api.get(`/api/partner/alerts/summary?quarter=${quarter}`);
  return res.data.data;
}

async function fetchAlerts(params: Record<string, string>): Promise<AlertItem[]> {
  const qs = new URLSearchParams(params);
  const res = await api.get(`/api/partner/alerts?${qs}`);
  return res.data.data ?? [];
}

async function fetchFilters(): Promise<CaseFilterOptions> {
  const res = await api.get("/api/partner/cases/filters");
  return res.data.data;
}

export function AlertsClient() {
  const router = useRouter();
  const { user } = usePartnerAuthStore();
  const isAdmin = isOrgAdmin(user);
  const queryClient = useQueryClient();
  const [quarter, setQuarter] = useState(currentQuarter());
  const [search, setSearch] = useState("");
  const [alertType, setAlertType] = useState("all");
  const [program, setProgram] = useState("all");
  const [caseworker, setCaseworker] = useState("all");
  const [showSnoozed, setShowSnoozed] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["partner-alerts-summary", quarter],
    queryFn: () => fetchAlertSummary(quarter),
  });

  const { data: filters } = useQuery({
    queryKey: ["partner-case-filters"],
    queryFn: fetchFilters,
    staleTime: 5 * 60 * 1000,
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["partner-alerts", quarter, alertType, program, caseworker, search, showSnoozed],
    queryFn: () =>
      fetchAlerts({
        quarter,
        show_snoozed: String(showSnoozed),
        ...(alertType !== "all" && { type: alertType }),
        ...(program !== "all" && { program }),
        ...(caseworker !== "all" && { caseworker }),
        ...(search && { search }),
      }),
  });

  const snooze = useMutation({
    mutationFn: (id: string) => api.post(`/api/partner/alerts/${id}/snooze`, { days: 3 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["partner-alerts-summary"] });
    },
  });

  const grouped = {
    critical: alerts.filter((a) => a.urgency_bucket === "critical"),
    soon: alerts.filter((a) => a.urgency_bucket === "soon"),
    upcoming: alerts.filter((a) => a.urgency_bucket === "upcoming"),
    on_track: alerts.filter((a) => a.urgency_bucket === "on_track"),
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-primary text-white px-8 pt-6 pb-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
          Family Support Navigator · Case Management
        </div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Bell className="w-7 h-7 text-yellow-300" /> Deadline Alert Feed
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-xl">
              Chronological view of every renewal and document deadline across all assigned cases — sorted by days remaining.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {summary && (
              <>
                <span className="px-3 py-1 rounded-full bg-status-error/90 text-white text-sm font-bold">
                  {summary.critical} Critical
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">
                  {summary.total_cases} Cases
                </span>
              </>
            )}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-white/20 text-white text-xs">{initials(user?.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{user?.full_name}</span>
            </div>
          </div>
        </div>
        <QuarterTabs value={quarter} onChange={setQuarter} className="pb-4" />
      </div>

      <div className="flex-1 p-8 space-y-6 bg-surface">
        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {(Object.keys(BUCKET_LABELS) as (keyof typeof BUCKET_LABELS)[]).map((key) => {
              const card = BUCKET_LABELS[key];
              return (
                <div key={key} className={cn("bg-white rounded-xl border border-surface-border border-l-4 p-5 shadow-card", card.border)}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-soft">{card.label}</div>
                  <div className={cn("text-3xl font-extrabold tabular-nums mt-1", card.color)}>{summary[key]}</div>
                  <div className="text-xs text-text-soft">{card.sub}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input placeholder="Search name or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={alertType} onValueChange={setAlertType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Alert Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alert Types</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="doc_expiry">Doc Expiry</SelectItem>
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {filters?.programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={caseworker} onValueChange={setCaseworker}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Caseworkers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Caseworkers</SelectItem>
                {filters?.caseworkers.map((cw) => (
                  <SelectItem key={cw.id} value={cw.id}>{cw.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex rounded-lg border border-surface-border overflow-hidden ml-auto">
            <button
              className={cn("px-4 py-2 text-sm font-semibold", !showSnoozed ? "bg-partner-600 text-white" : "bg-white text-text-mid")}
              onClick={() => setShowSnoozed(false)}
            >
              Active
            </button>
            <button
              className={cn("px-4 py-2 text-sm font-semibold", showSnoozed ? "bg-partner-600 text-white" : "bg-white text-text-mid")}
              onClick={() => setShowSnoozed(true)}
            >
              Show Snoozed
            </button>
          </div>
        </div>

        {/* Alert feed */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {(["critical", "soon", "upcoming", "on_track"] as const).map((bucket) => {
              const items = grouped[bucket];
              if (!items.length) return null;
              const sectionTitle =
                bucket === "critical" ? "DUE WITHIN 7 DAYS" :
                bucket === "soon" ? "DUE IN 8–14 DAYS" :
                bucket === "upcoming" ? "DUE IN 15–30 DAYS" : "ON TRACK (30+ DAYS)";

              return (
                <div key={bucket}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text-soft mb-3">{sectionTitle}</h2>
                  <div className="space-y-3">
                    {items.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "bg-white rounded-xl border border-surface-border shadow-card flex overflow-hidden",
                          bucket === "critical" && "border-l-4 border-l-status-error"
                        )}
                      >
                        <div className="w-28 shrink-0 flex flex-col items-center justify-center p-4 border-r border-surface-border bg-primary-subtle/30">
                          <div className={cn("text-2xl font-extrabold tabular-nums", BUCKET_LABELS[bucket].color)}>
                            {alert.days_remaining}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-text-soft">days</div>
                          <div className="text-xs text-text-soft mt-1">{formatDate(alert.due_date)}</div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-text-dark">{alert.client_name}</div>
                            <div className="text-xs text-text-soft font-mono">{alert.case_number}</div>
                            <p className="text-sm text-text-mid mt-1">{alert.description}</p>
                            {alert.last_activity && (
                              <p className="text-xs text-text-soft mt-1">
                                Last activity: {alert.last_activity.description} · {formatRelativeDate(alert.last_activity.date)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", ALERT_TYPE_COLORS[alert.alert_type] ?? "bg-gray-100")}>
                                {alert.alert_type === "renewal" ? "Renewal" : "Doc Expiry"}
                              </span>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", PROGRAM_COLORS[alert.program] ?? "bg-partner-100 text-partner-700")}>
                                {alert.program}
                              </span>
                              {alert.caseworker && (
                                <div className="flex items-center gap-1 text-xs text-text-soft">
                                  <Avatar className="w-5 h-5">
                                    <AvatarFallback className="text-[8px]">{alert.caseworker.initials}</AvatarFallback>
                                  </Avatar>
                                  {alert.caseworker.name}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => snooze.mutate(alert.id)} disabled={snooze.isPending}>
                                Snooze
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <MessageCircle className="w-3.5 h-3.5" /> Message
                              </Button>
                              <Button size="sm" className="gap-1" onClick={() => router.push(`/cases?case=${alert.case_id}`)}>
                                <FolderOpen className="w-3.5 h-3.5" /> Open Case
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
