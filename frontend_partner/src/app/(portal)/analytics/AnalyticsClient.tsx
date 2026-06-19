"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FolderOpen,
  ArrowLeftRight,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CasesAreaChart, CasesStatusChart } from "@/components/dashboard/CasesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

const SAMPLE_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().split("T")[0],
    value: Math.floor(Math.random() * 40 + 15),
  };
});

const SAMPLE_STATUS = [
  { status: "open", count: 34 },
  { status: "in_progress", count: 22 },
  { status: "pending", count: 14 },
  { status: "closed", count: 67 },
  { status: "cancelled", count: 8 },
];

async function fetchAnalytics(): Promise<{
  metrics: DashboardMetrics;
  caseTrend: Array<{ date: string; value: number }>;
  referralTrend: Array<{ date: string; value: number }>;
  casesByStatus: Array<{ status: string; count: number }>;
}> {
  const res = await api.get("/api/partner/analytics");
  return res.data.data;
}

export function AnalyticsClient() {
  const { data } = useQuery({
    queryKey: ["partner-analytics"],
    queryFn: fetchAnalytics,
    staleTime: 5 * 60 * 1000,
    placeholderData: {
      metrics: {
        total_cases: 145,
        open_cases: 34,
        closed_this_month: 28,
        total_referrals: 89,
        pending_referrals: 14,
        accepted_referrals: 52,
        total_mothers_served: 312,
        new_mothers_this_month: 22,
        total_documents: 67,
        avg_case_resolution_days: 12,
      },
      caseTrend: SAMPLE_TREND,
      referralTrend: SAMPLE_TREND.map((d) => ({ ...d, value: Math.floor(d.value * 0.6) })),
      casesByStatus: SAMPLE_STATUS,
    },
  });

  const m = data?.metrics;

  return (
    <div className="flex-1 p-8 space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            title: "Total Cases",
            value: formatNumber(m?.total_cases ?? 0),
            subtitle: `${m?.open_cases ?? 0} currently open`,
            icon: FolderOpen,
            iconBg: "bg-gradient-partner",
            trend: { value: 14 },
          },
          {
            title: "Total Referrals",
            value: formatNumber(m?.total_referrals ?? 0),
            subtitle: `${m?.accepted_referrals ?? 0} accepted`,
            icon: ArrowLeftRight,
            iconBg: "bg-gradient-to-br from-secondary-400 to-secondary-600",
            trend: { value: 8 },
          },
          {
            title: "Mothers Served",
            value: formatNumber(m?.total_mothers_served ?? 0, true),
            subtitle: `+${m?.new_mothers_this_month ?? 0} this month`,
            icon: Users,
            iconBg: "bg-gradient-to-br from-primary-400 to-primary-600",
            trend: { value: 11 },
          },
          {
            title: "Closed This Month",
            value: formatNumber(m?.closed_this_month ?? 0),
            subtitle: "Cases resolved",
            icon: CheckCircle,
            iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
            trend: { value: 19 },
          },
          {
            title: "Avg. Resolution",
            value: `${m?.avg_case_resolution_days ?? "—"} days`,
            subtitle: "Time to resolve a case",
            icon: Clock,
            iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
          },
          {
            title: "Acceptance Rate",
            value: m?.total_referrals
              ? `${Math.round(((m.accepted_referrals) / m.total_referrals) * 100)}%`
              : "—",
            subtitle: "Referrals accepted",
            icon: TrendingUp,
            iconBg: "bg-gradient-to-br from-secondary-400 to-secondary-600",
            trend: { value: 5 },
          },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <MetricCard {...card} icon={card.icon as Parameters<typeof MetricCard>[0]["icon"]} />
          </motion.div>
        ))}
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cases">
              <TabsList className="mb-4">
                <TabsTrigger value="cases">Cases</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
              </TabsList>
              <TabsContent value="cases">
                <CasesAreaChart data={data?.caseTrend ?? []} height={240} />
              </TabsContent>
              <TabsContent value="referrals">
                <CasesAreaChart
                  data={data?.referralTrend ?? []}
                  color="#674bb5"
                  height={240}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <CasesStatusChart data={data?.casesByStatus ?? []} height={240} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
