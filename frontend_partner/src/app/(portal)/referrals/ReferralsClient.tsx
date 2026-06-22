"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus, Search, ArrowLeftRight, Send, Inbox, Check, X,
  Network, TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { NewReferralModal } from "@/components/referrals/NewReferralModal";
import { formatRelativeDate, formatStatusLabel, pluralize } from "@/lib/utils";

interface ReferralRow {
  id: string;
  referral_number: string;
  status: string;
  outcome: string | null;
  direction: "sent" | "received";
  mother_id: string | null;
  mother_name: string;
  service_type: string;
  from_organization_id: string;
  to_organization_id: string;
  from_organization_name: string;
  to_organization_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ReferralStats {
  total: number;
  sent: number;
  received: number;
  pending: number;
  accepted: number;
  declined: number;
  acceptance_rate: number;
  success_rate: number;
  avg_response_hours: number | null;
  top_partners: { id: string; name: string; count: number }[];
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  pending: "warning",
  accepted: "success",
  declined: "error",
};

async function fetchReferrals(direction: string): Promise<ReferralRow[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (direction !== "all") params.set("direction", direction);
  const res = await api.get(`/api/partner/referrals?${params}`);
  return res.data.data ?? [];
}

export function ReferralsClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["partner-referrals", tab],
    queryFn: () => fetchReferrals(tab),
    staleTime: 30 * 1000,
    placeholderData: [],
  });

  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: async () => (await api.get("/api/partner/referrals/summary")).data.data as ReferralStats,
    staleTime: 30 * 1000,
  });

  const respond = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "decline" }) =>
      (await api.patch(`/api/partner/referrals/${id}`, { action })).data.data,
    onSuccess: (_d, vars) => {
      toast({
        title: vars.action === "accept" ? "Referral accepted" : "Referral declined",
        variant: vars.action === "accept" ? "success" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["partner-referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Action failed", description: e.message }),
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["partner-referrals"] });
    queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
  };

  const filtered = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.mother_name.toLowerCase().includes(q) ||
      r.referral_number.toLowerCase().includes(q) ||
      r.service_type.toLowerCase().includes(q) ||
      r.to_organization_name.toLowerCase().includes(q) ||
      r.from_organization_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-8 space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Stat label="Sent" value={stats?.sent ?? 0} icon={Send} />
        <Stat label="Received" value={stats?.received ?? 0} icon={Inbox} />
        <Stat label="Acceptance rate" value={`${stats?.acceptance_rate ?? 0}%`} icon={CheckCircle2} accent="text-status-success" />
        <Stat label="Success outcome" value={`${stats?.success_rate ?? 0}%`} icon={TrendingUp} accent="text-status-success" />
        <Stat label="Avg response" value={stats?.avg_response_hours != null ? `${stats.avg_response_hours}h` : "—"} icon={Clock} accent="text-status-warning" />
      </div>

      {/* Top partner organizations (network) */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-partner-700" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-partner-700">Top partner organizations</span>
        </div>
        {!stats?.top_partners?.length ? (
          <p className="text-sm text-text-soft">No referral activity yet — send a referral to start building your network.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.top_partners.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 bg-primary-subtle border border-surface-border rounded-xl px-3 py-2">
                <span className="w-5 h-5 rounded-full bg-partner-700 text-white flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                <span className="text-sm font-semibold text-text-dark">{p.name}</span>
                <span className="text-[11px] text-text-soft">{p.count} {pluralize(p.count, "referral")}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> All</TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Sent</TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5" /> Received</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input placeholder="Search referrals…" className="pl-9 h-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> New Referral
          </Button>
        </div>
      </div>

      {!isLoading && <p className="text-sm text-text-soft">{pluralize(filtered.length, "referral")} found</p>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-primary-subtle">
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Mother</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Direction</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Date</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <span className="text-3xl block mb-2">🔗</span>
                  <p className="text-text-soft text-sm">No referrals found</p>
                </td>
              </tr>
            )}
            {!isLoading && filtered.map((r, idx) => {
              const isReceived = r.direction === "received";
              const otherOrg = isReceived ? r.from_organization_name : r.to_organization_name;
              const canRespond = isReceived && r.status === "pending";
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/50 transition-colors group"
                >
                  <td className="px-4 py-3 text-text-soft font-mono text-xs">{r.referral_number}</td>
                  <td className="px-4 py-3 font-semibold text-text-dark">{r.mother_name}</td>
                  <td className="px-4 py-3 text-text-mid">{r.service_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-mid">
                      {isReceived ? <Inbox className="w-3 h-3 text-secondary-500 shrink-0" /> : <Send className="w-3 h-3 text-primary shrink-0" />}
                      <span className="text-[10px] uppercase font-bold text-text-soft">{isReceived ? "From" : "To"}</span>
                      <span className="truncate max-w-[140px]" title={otherOrg}>{otherOrg}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "default"} dot className="capitalize">
                      {formatStatusLabel(r.status)}
                    </Badge>
                    {r.outcome && (
                      <span className={`ml-1.5 text-[10px] font-semibold ${r.outcome === "success" ? "text-status-success" : "text-status-error"}`}>
                        {r.outcome}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-soft">{formatRelativeDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {canRespond ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => respond.mutate({ id: r.id, action: "accept" })}
                          disabled={respond.isPending}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-status-success-bg text-status-success hover:opacity-80 transition"
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={() => respond.mutate({ id: r.id, action: "decline" })}
                          disabled={respond.isPending}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-status-error-bg text-status-error hover:opacity-80 transition"
                        >
                          <X className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-text-soft text-xs">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewReferralModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={refreshAll} />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Send;
  accent?: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-text-soft mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-extrabold tabular-nums text-text-dark ${accent ?? ""}`}>{value}</div>
    </Card>
  );
}
