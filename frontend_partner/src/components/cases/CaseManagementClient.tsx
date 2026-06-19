"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, FolderOpen, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuarterTabs, currentQuarter } from "@/components/cases/QuarterTabs";
import { SummaryCards } from "@/components/cases/SummaryCards";
import { CaseDetailPanel } from "@/components/cases/CaseDetailPanel";
import { usePartnerAuthStore } from "@/store/auth.store";
import { isOrgAdmin } from "@/lib/auth-utils";
import { formatDate, initials, cn } from "@/lib/utils";
import type { CaseListItem, DashboardSummary, CaseFilterOptions } from "@/types";

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  not_started: { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600", label: "Not Started" },
  in_progress: { dot: "bg-status-warning", bg: "bg-status-warning-bg", text: "text-status-warning", label: "In Progress" },
  submitted: { dot: "bg-status-info", bg: "bg-status-info-bg", text: "text-status-info", label: "Submitted" },
  approved: { dot: "bg-status-success", bg: "bg-status-success-bg", text: "text-status-success", label: "Approved" },
  renewal_due: { dot: "bg-status-error", bg: "bg-status-error-bg", text: "text-status-error", label: "Renewal Due" },
};

const PROGRAM_COLORS: Record<string, string> = {
  WIC: "bg-primary-100 text-primary-700",
  SNAP: "bg-secondary-100 text-secondary-700",
  Medicaid: "bg-green-100 text-green-700",
  TANF: "bg-red-100 text-red-700",
  CCAP: "bg-orange-100 text-orange-700",
  Housing: "bg-teal-100 text-teal-700",
};

function deadlineColor(urgency: string) {
  if (urgency === "high") return "text-status-error font-semibold";
  if (urgency === "moderate") return "text-status-warning font-semibold";
  return "text-status-success";
}

function rowBg(status: string, urgency: string) {
  if (status === "renewal_due" || urgency === "high") return "bg-status-error-bg/40";
  if (status === "in_progress" || urgency === "moderate") return "bg-status-warning-bg/30";
  return "";
}

async function fetchSummary(quarter: string): Promise<DashboardSummary> {
  const res = await api.get(`/api/partner/dashboard/summary?quarter=${quarter}`);
  return res.data.data;
}

async function fetchCases(params: Record<string, string>): Promise<CaseListItem[]> {
  const qs = new URLSearchParams(params);
  const res = await api.get(`/api/partner/cases?${qs}`);
  return res.data.data ?? [];
}

async function fetchFilters(): Promise<CaseFilterOptions> {
  const res = await api.get("/api/partner/cases/filters");
  return res.data.data;
}

export function CaseManagementClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = usePartnerAuthStore();
  const isAdmin = isOrgAdmin(user);
  const [quarter, setQuarter] = useState(currentQuarter());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [program, setProgram] = useState("all");
  const [caseworker, setCaseworker] = useState("all");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const openCase = useCallback(
    (id: string) => {
      setSelectedCaseId(id);
      if (pathname === "/cases") {
        router.replace(`/cases?case=${id}`, { scroll: false });
      }
    },
    [pathname, router]
  );

  const closeCase = useCallback(() => {
    setSelectedCaseId(null);
    if (pathname === "/cases") {
      router.replace("/cases", { scroll: false });
    }
  }, [pathname, router]);

  useEffect(() => {
    const caseFromUrl = searchParams.get("case");
    if (pathname === "/cases" && caseFromUrl) {
      setSelectedCaseId(caseFromUrl);
    }
  }, [pathname, searchParams]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["partner-dashboard-summary", quarter],
    queryFn: () => fetchSummary(quarter),
  });

  const { data: filters } = useQuery({
    queryKey: ["partner-case-filters"],
    queryFn: fetchFilters,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["partner-cases-mgmt", quarter, status, program, caseworker, search],
    queryFn: () =>
      fetchCases({
        quarter,
        ...(status !== "all" && { status }),
        ...(program !== "all" && { program }),
        ...(caseworker !== "all" && { caseworker }),
        ...(search && { search }),
      }),
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Purple header */}
      <div className="bg-gradient-primary text-white px-8 pt-6 pb-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold">Family Support Navigator</h1>
            <p className="text-white/60 text-sm mt-0.5">Case Management Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">
              {quarter} · {QUARTER_LABEL(quarter)}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">
              {summary?.total_assigned ?? "—"} {isAdmin ? "Active Cases" : "My Cases"}
            </span>
            <Avatar className="w-9 h-9 ring-2 ring-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <QuarterTabs value={quarter} onChange={setQuarter} className="pb-4" />
      </div>

      <div className="flex-1 p-8 space-y-6 bg-surface">
        {summary && <SummaryCards data={summary} loading={summaryLoading} scope={isAdmin ? "org" : "mine"} />}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input
              placeholder="Search by name or ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {filters?.statuses.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_STYLES[s]?.label ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {filters?.programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={caseworker} onValueChange={setCaseworker}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Caseworkers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Caseworkers</SelectItem>
                {filters?.caseworkers.map((cw) => (
                  <SelectItem key={cw.id} value={cw.id}>{cw.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-text-soft">
          <span className="font-semibold text-text-mid">Status:</span>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", v.dot)} /> {v.label}
            </span>
          ))}
          <span className="font-semibold text-text-mid ml-2">Urgency:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-error" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warning" /> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-success" /> Normal</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-primary-subtle/60">
                {["Mother", "Primary Program", "Status", "Deadline", "Last Activity", "Caseworker", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-text-mid uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-partner-50 rounded animate-pulse" /></td></tr>
                ))}
              {!isLoading && cases.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-text-soft">No submitted applications yet. Cases appear here after a mom sends a secure application email.</td></tr>
              )}
              {!isLoading &&
                cases.map((c) => {
                  const st = STATUS_STYLES[c.status] ?? STATUS_STYLES.not_started;
                  return (
                    <tr
                      key={c.id}
                      className={cn("border-b border-surface-border last:border-0 hover:bg-primary-subtle/30 cursor-pointer transition-colors", rowBg(c.status, c.urgency))}
                      onClick={() => openCase(c.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-partner-100 text-partner-700">{c.mother_initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-text-dark">{c.mother_name}</div>
                            <div className="text-xs text-text-soft font-mono">{c.mother_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", PROGRAM_COLORS[c.program] ?? "bg-partner-100 text-partner-700")}>
                          {c.program}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full", st.bg, st.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                          {st.label}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-xs", deadlineColor(c.urgency))}>
                        {c.deadline_label ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.last_activity ? (
                          <div>
                            <div className="text-text-dark text-xs">{c.last_activity.description}</div>
                            <div className="text-text-soft text-[10px]">{formatDate(c.last_activity.date, "MMM d")}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.caseworker && (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-[10px]">{c.caseworker.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-text-mid">{c.caseworker.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded-lg hover:bg-primary-subtle text-text-soft" onClick={() => openCase(c.id)}>
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-primary-subtle text-text-soft">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <CaseDetailPanel caseId={selectedCaseId} onClose={closeCase} />
    </div>
  );
}

function QUARTER_LABEL(q: string) {
  const map: Record<string, string> = { Q1: "Jan–Mar", Q2: "Apr–Jun", Q3: "Jul–Sep", Q4: "Oct–Dec" };
  return map[q] ?? "";
}
