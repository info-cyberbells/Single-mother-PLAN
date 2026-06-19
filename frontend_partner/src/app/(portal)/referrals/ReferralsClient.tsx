"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, ArrowLeftRight, Send, Inbox } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { formatRelativeDate, statusColor, formatStatusLabel, pluralize } from "@/lib/utils";
import type { Referral } from "@/types";

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "default" | "purple"> = {
  pending: "warning",
  accepted: "success",
  completed: "info",
  rejected: "error",
  cancelled: "error",
};

async function fetchReferrals(direction: string): Promise<Referral[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (direction !== "all") params.set("direction", direction);
  const res = await api.get(`/api/partner/referrals?${params}`);
  return res.data.data ?? [];
}

export function ReferralsClient() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["partner-referrals", tab],
    queryFn: () => fetchReferrals(tab),
    staleTime: 30 * 1000,
    placeholderData: [],
  });

  const filtered = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.mother_name.toLowerCase().includes(q) ||
      r.referral_number.toLowerCase().includes(q) ||
      r.service_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" /> All
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Sent
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" /> Received
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input
              placeholder="Search referrals…"
              className="pl-9 h-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Referral
          </Button>
        </div>
      </div>

      {!isLoading && (
        <p className="text-sm text-text-soft mb-4">
          {pluralize(filtered.length, "referral")} found
        </p>
      )}

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
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <span className="text-3xl block mb-2">🔗</span>
                  <p className="text-text-soft text-sm">No referrals found</p>
                </td>
              </tr>
            )}
            {!isLoading && filtered.map((r, idx) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-text-soft font-mono text-xs">{r.referral_number}</td>
                <td className="px-4 py-3 font-semibold text-text-dark group-hover:text-primary transition-colors">
                  {r.mother_name}
                </td>
                <td className="px-4 py-3 text-text-mid">{r.service_type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-text-mid">
                    <Send className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate max-w-[120px]" title={r.to_organization_name}>
                      {r.to_organization_name ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[r.status] ?? "default"} dot className="capitalize">
                    {formatStatusLabel(r.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-text-soft">
                  {formatRelativeDate(r.created_at)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
