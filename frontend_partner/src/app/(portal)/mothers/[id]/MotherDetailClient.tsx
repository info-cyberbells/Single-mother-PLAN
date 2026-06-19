"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { isOrgAdmin } from "@/lib/auth-utils";
import { usePartnerAuthStore } from "@/store/auth.store";
import type { MotherDetail } from "@/types";

async function fetchMother(id: string): Promise<MotherDetail> {
  const res = await api.get(`/api/mothers/${id}`);
  return res.data.data;
}

function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

export function MotherDetailClient() {
  const params = useParams();
  const motherId = params.id as string;
  const { user } = usePartnerAuthStore();
  const isAdmin = isOrgAdmin(user);

  const { data: mother, isLoading, error } = useQuery({
    queryKey: ["mother-detail", motherId],
    queryFn: () => fetchMother(motherId),
    retry: (count, err) => !isForbidden(err) && count < 2,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isForbidden(error)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-status-error mb-4" />
        <h2 className="text-xl font-bold text-text-dark mb-2">Access Denied</h2>
        <p className="text-text-soft max-w-md mb-6">
          You do not have permission to view this mother. Only assigned caseworkers and
          organization admins can access mother records.
        </p>
        <Button asChild variant="outline">
          <Link href={isAdmin ? "/mothers" : "/dashboard"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Link>
        </Button>
      </div>
    );
  }

  if (!mother) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-text-dark mb-2">Mother not found</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/mothers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to mothers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-6 bg-surface">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/mothers">
          <ArrowLeft className="w-4 h-4" />
          Back to mothers
        </Link>
      </Button>

      <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-dark">{mother.name}</h1>
            <p className="text-text-soft mt-1">{mother.email ?? "No email on file"}</p>
          </div>
          <Badge className="self-start bg-partner-100 text-partner-700">
            {mother.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-border">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
              Assigned Caseworker
            </dt>
            <dd className="mt-1 font-semibold text-text-dark">
              {mother.caseworker?.full_name ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
              Created
            </dt>
            <dd className="mt-1 text-text-mid">
              {formatDate(mother.created_at, "MMMM d, yyyy")}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
              Active Cases
            </dt>
            <dd className="mt-1 font-semibold text-text-dark">{mother.cases.length}</dd>
          </div>
        </dl>
      </div>

      {mother.cases.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border">
            <h2 className="font-bold text-text-dark">Cases</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-primary-subtle/40">
                {["Program", "Status", "Quarter", "Opened"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-bold text-text-mid uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mother.cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/20"
                >
                  <td className="px-4 py-3 font-medium">{c.program}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-partner-50 text-partner-700">
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-mid">{c.quarter}</td>
                  <td className="px-4 py-3 text-text-soft text-xs">
                    {formatDate(c.created_at, "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
