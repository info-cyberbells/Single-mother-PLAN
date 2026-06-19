"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatRelativeDate } from "@/lib/utils";
import type { Referral } from "@/types";

async function fetchRecentReferrals(): Promise<Referral[]> {
  const res = await api.get("/api/partner/referrals?limit=5&sort=recent");
  return res.data.data ?? [];
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info" | "purple"> = {
  pending: "warning",
  accepted: "success",
  completed: "info",
  rejected: "error",
  cancelled: "error",
};

export function ReferralSummaryWidget() {
  const { data: referrals = [] } = useQuery({
    queryKey: ["partner-recent-referrals"],
    queryFn: fetchRecentReferrals,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    // Return empty array instead of error on API failure
    placeholderData: [],
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-secondary-500" />
          Recent Referrals
        </CardTitle>
        <Link
          href="/referrals"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {referrals.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-sm text-text-soft">No referrals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-primary-subtle transition-colors group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-dark truncate group-hover:text-primary transition-colors">
                    {r.mother_name}
                  </p>
                  <p className="text-xs text-text-soft truncate">{r.service_type}</p>
                  <p className="text-[10px] text-text-soft/70 mt-0.5">
                    {formatRelativeDate(r.created_at)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] ?? "default"} dot className="shrink-0 capitalize">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
