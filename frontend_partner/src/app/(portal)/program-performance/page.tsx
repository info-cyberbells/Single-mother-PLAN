import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ProgramPerformanceClient } from "./ProgramPerformanceClient";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Program Performance — MomPlan Partner" };

export default function ProgramPerformancePage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Program Performance"
        description="Which benefit programs generate the most approvals and denials"
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
        <ProgramPerformanceClient />
      </Suspense>
    </div>
  );
}
