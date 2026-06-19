"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CasesAreaChart, CasesStatusChart } from "@/components/dashboard/CasesChart";
import { api } from "@/lib/api";

interface ChartData {
  trend: Array<{ date: string; value: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

async function fetchCasesChartData(): Promise<ChartData> {
  const res = await api.get("/api/partner/dashboard/cases-chart");
  return res.data.data;
}

// Fallback sample data when API is not yet implemented
const SAMPLE_TREND = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return {
    date: d.toISOString().split("T")[0],
    value: Math.floor(Math.random() * 30 + 10),
  };
});

const SAMPLE_STATUS = [
  { status: "open", count: 24 },
  { status: "in_progress", count: 18 },
  { status: "pending", count: 11 },
  { status: "closed", count: 47 },
];

export function CasesChartWidget() {
  const { data } = useQuery({
    queryKey: ["partner-cases-chart"],
    queryFn: fetchCasesChartData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Use sample data as placeholder when API not ready
    placeholderData: { trend: SAMPLE_TREND, byStatus: SAMPLE_STATUS },
  });

  const trend = data?.trend ?? SAMPLE_TREND;
  const byStatus = data?.byStatus ?? SAMPLE_STATUS;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Cases Overview
          </CardTitle>
          <p className="text-xs text-text-soft mt-0.5">Last 14 days case activity</p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend">
          <TabsList className="mb-5">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
          </TabsList>
          <TabsContent value="trend">
            <CasesAreaChart data={trend} height={220} />
          </TabsContent>
          <TabsContent value="status">
            <CasesStatusChart data={byStatus} height={200} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
