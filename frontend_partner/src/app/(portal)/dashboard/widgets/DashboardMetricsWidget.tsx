"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderOpen, ArrowLeftRight, Users, TrendingUp } from "lucide-react";
import { MetricCard, MetricCardSkeleton } from "@/components/dashboard/MetricCard";
import { api } from "@/lib/api";
import type { DashboardMetrics } from "@/types";
import { formatNumber } from "@/lib/utils";

async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await api.get("/api/partner/dashboard/metrics");
  return res.data.data;
}

export function DashboardMetricsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["partner-dashboard-metrics"],
    queryFn: fetchMetrics,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Open Cases",
      value: formatNumber(data.open_cases),
      subtitle: `${formatNumber(data.total_cases)} total cases`,
      icon: FolderOpen,
      iconBg: "bg-gradient-partner",
      trend: { value: 12, label: "vs last month" },
      badge: "Cases",
    },
    {
      title: "Pending Referrals",
      value: formatNumber(data.pending_referrals),
      subtitle: `${formatNumber(data.accepted_referrals)} accepted`,
      icon: ArrowLeftRight,
      iconBg: "bg-gradient-to-br from-secondary-400 to-secondary-600",
      trend: { value: -5, label: "vs last month" },
      badge: "Referrals",
    },
    {
      title: "Mothers Served",
      value: formatNumber(data.total_mothers_served, true),
      subtitle: `+${data.new_mothers_this_month} this month`,
      icon: Users,
      iconBg: "bg-gradient-to-br from-primary-400 to-primary-600",
      trend: { value: 8, label: "vs last month" },
      badge: "Mothers",
    },
    {
      title: "Closed This Month",
      value: formatNumber(data.closed_this_month),
      subtitle: data.avg_case_resolution_days
        ? `Avg ${data.avg_case_resolution_days} days to resolve`
        : undefined,
      icon: TrendingUp,
      iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      trend: { value: 15, label: "vs last month" },
      badge: "Resolved",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} icon={card.icon as Parameters<typeof MetricCard>[0]["icon"]} />
      ))}
    </div>
  );
}
