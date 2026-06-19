"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { usePartnerAuthStore } from "@/store/auth.store";
import { isOrgAdmin } from "@/lib/auth-utils";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, cn } from "@/lib/utils";
import type { AssignableCaseworker, MotherListItem } from "@/types";

async function fetchMothers(params: Record<string, string>): Promise<MotherListItem[]> {
  const qs = new URLSearchParams(params);
  const res = await api.get(`/api/mothers?${qs}`);
  return res.data.data ?? [];
}

async function fetchCaseworkers(): Promise<AssignableCaseworker[]> {
  const res = await api.get("/api/mothers/caseworkers");
  return res.data.data ?? [];
}

const STATUS_STYLES: Record<string, string> = {
  enrolled: "bg-status-success-bg text-status-success",
  pending: "bg-status-warning-bg text-status-warning",
  inactive: "bg-gray-100 text-gray-600",
};

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MothersClient() {
  const { user } = usePartnerAuthStore();
  const isAdmin = isOrgAdmin(user);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [caseworkerFilter, setCaseworkerFilter] = useState("all");

  const { data: mothers = [], isLoading } = useQuery({
    queryKey: ["mothers", caseworkerFilter, search],
    queryFn: () =>
      fetchMothers({
        ...(caseworkerFilter !== "all" && { caseworker: caseworkerFilter }),
        ...(search && { search }),
      }),
  });

  const { data: caseworkers = [] } = useQuery({
    queryKey: ["assignable-caseworkers"],
    queryFn: fetchCaseworkers,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["mothers"] });
    queryClient.invalidateQueries({ queryKey: ["partner-cases-mgmt"] });
    queryClient.invalidateQueries({ queryKey: ["partner-dashboard-summary"] });
  };

  const assignCaseworker = useMutation({
    mutationFn: async ({ motherId, caseworkerId }: { motherId: string; caseworkerId: string }) => {
      await api.patch(`/api/mothers/${motherId}/assign-caseworker`, { caseworkerId });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Caseworker assigned", variant: "success" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to assign caseworker" });
    },
  });

  const unassignCaseworker = useMutation({
    mutationFn: async (motherId: string) => {
      await api.patch(`/api/mothers/${motherId}/unassign-caseworker`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Caseworker unassigned", variant: "success" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to unassign caseworker" });
    },
  });

  const handleAssignmentChange = (motherId: string, value: string) => {
    if (value === "unassigned") {
      unassignCaseworker.mutate(motherId);
      return;
    }
    assignCaseworker.mutate({ motherId, caseworkerId: value });
  };

  return (
    <div className="flex-1 p-8 space-y-6 bg-surface">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-dark">
            {isAdmin ? "All Mothers" : "My Mothers"}
          </h2>
          <p className="text-sm text-text-soft mt-0.5">
            {isAdmin
              ? "View and assign mothers to caseworkers in your organization"
              : "Mothers assigned to you"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-mid">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{mothers.length}</span>
          <span>{isAdmin ? "mothers" : "assigned"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Select value={caseworkerFilter} onValueChange={setCaseworkerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Caseworkers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Caseworkers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {caseworkers.map((cw) => (
                <SelectItem key={cw.id} value={cw.id}>
                  {cw.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-primary-subtle/60">
              {["Name", "Email", "Status", "Assigned Caseworker", "Created Date", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-bold text-text-mid uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-4 bg-partner-50 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {!isLoading && mothers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-text-soft">
                  {isAdmin ? "No mothers with submitted applications" : "No assigned mothers with submitted applications"}
                </td>
              </tr>
            )}
            {!isLoading &&
              mothers.map((mother) => (
                <tr
                  key={mother.id}
                  className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-semibold text-text-dark hover:text-partner-600 text-left"
                      onClick={() => router.push(`/mothers/${mother.id}`)}
                    >
                      {mother.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-mid">{mother.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        "text-xs font-semibold",
                        STATUS_STYLES[mother.status] ?? "bg-gray-100 text-gray-600"
                      )}
                    >
                      {statusLabel(mother.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <Select
                        value={mother.caseworker?.id ?? "unassigned"}
                        onValueChange={(v) => handleAssignmentChange(mother.id, v)}
                        disabled={assignCaseworker.isPending || unassignCaseworker.isPending}
                      >
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <SelectValue placeholder="Assign Caseworker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {caseworkers.map((cw) => (
                            <SelectItem key={cw.id} value={cw.id}>
                              {cw.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-text-mid">
                        {mother.caseworker?.full_name ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-soft text-xs">
                    {formatDate(mother.created_at, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5">
                      <Link href={`/mothers/${mother.id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
