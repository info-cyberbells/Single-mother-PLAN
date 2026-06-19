"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeDate, statusColor, formatStatusLabel, pluralize } from "@/lib/utils";
import type { Case } from "@/types";

const PRIORITY_ICONS = {
  low: null,
  medium: <Clock className="w-3 h-3 text-status-warning" />,
  high: <AlertCircle className="w-3 h-3 text-orange-500" />,
  urgent: <AlertCircle className="w-3 h-3 text-status-error" />,
};

const PRIORITY_COLORS = {
  low: "text-text-soft",
  medium: "text-status-warning",
  high: "text-orange-500",
  urgent: "text-status-error font-bold",
};

const STATUS_ICON = {
  open: <FolderOpen className="w-3.5 h-3.5 text-status-success" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-status-info" />,
  pending: <AlertCircle className="w-3.5 h-3.5 text-status-warning" />,
  closed: <CheckCircle className="w-3.5 h-3.5 text-partner-500" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-status-error" />,
};

type SortKey = "created_at" | "mother_name" | "status" | "priority";

async function fetchCases(status?: string): Promise<Case[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (status && status !== "all") params.set("status", status);
  const res = await api.get(`/api/partner/cases?${params}`);
  return res.data.data ?? [];
}

export function CasesClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["partner-cases", activeTab],
    queryFn: () => fetchCases(activeTab),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });

  const filtered = cases
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.mother_name.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === "mother_name") {
        cmp = a.mother_name.localeCompare(b.mother_name);
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        cmp = (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      }
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="w-3.5 h-3.5 text-text-soft" />;
    return sortAsc
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  return (
    <div className="flex-1 p-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {["all", "open", "in_progress", "pending", "closed"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input
              placeholder="Search cases…"
              className="pl-9 h-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-text-soft mb-4">
          {pluralize(filtered.length, "case")} found
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-primary-subtle">
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">
                #
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                onClick={() => handleSort("mother_name")}
              >
                <div className="flex items-center gap-1">
                  Mother <SortIcon k="mother_name" />
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide">
                Title
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status <SortIcon k="status" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center gap-1">
                  Priority <SortIcon k="priority" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-bold text-text-mid uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Created <SortIcon k="created_at" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))}
              </>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🌸</span>
                    <p className="text-text-soft text-sm">No cases found</p>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading &&
              filtered.map((c, idx) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/cases/${c.id}`)}
                >
                  <td className="px-4 py-3 text-text-soft font-mono text-xs">
                    {c.case_number}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-dark group-hover:text-primary transition-colors">
                    {c.mother_name}
                  </td>
                  <td className="px-4 py-3 text-text-mid max-w-[200px] truncate">
                    {c.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor(c.status)}`}
                    >
                      {STATUS_ICON[c.status]}
                      {formatStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${PRIORITY_COLORS[c.priority]}`}
                    >
                      {PRIORITY_ICONS[c.priority]}
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-soft">
                    {formatRelativeDate(c.created_at)}
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
