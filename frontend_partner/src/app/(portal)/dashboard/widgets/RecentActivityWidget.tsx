"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { api } from "@/lib/api";

interface ActivityItem {
  id: string;
  type: "case" | "referral" | "document" | "mother";
  title: string;
  description?: string;
  status?: string;
  timestamp: string;
  actor?: string;
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const res = await api.get("/api/partner/dashboard/activity?limit=8");
  return res.data.data ?? [];
}

export function RecentActivityWidget() {
  const { data: activity = [] } = useQuery({
    queryKey: ["partner-recent-activity"],
    queryFn: fetchRecentActivity,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: [],
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-partner-500" />
          Recent Activity
        </CardTitle>
        <Link
          href="/cases"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <ActivityFeed
          items={activity}
          emptyMessage="No recent activity to show"
        />
      </CardContent>
    </Card>
  );
}
