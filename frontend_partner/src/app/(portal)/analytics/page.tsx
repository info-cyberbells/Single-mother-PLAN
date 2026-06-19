import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { AnalyticsClient } from "./AnalyticsClient";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Analytics"
        description="Insights and performance metrics for your organization"
      />
      <Suspense
        fallback={
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <AnalyticsClient />
      </Suspense>
    </div>
  );
}
