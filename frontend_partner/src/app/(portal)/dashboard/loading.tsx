import { MetricCardSkeleton } from "@/components/dashboard/MetricCard";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header placeholder */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-surface-border">
        <div className="space-y-1.5">
          <div className="w-32 h-3.5 bg-partner-100 rounded animate-pulse" />
          <div className="w-48 h-5 bg-partner-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-36 h-9 bg-partner-50 border border-surface-border rounded-xl animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-partner-50 animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-partner-50 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 p-8 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>

        <CardSkeleton />
      </div>
    </div>
  );
}
