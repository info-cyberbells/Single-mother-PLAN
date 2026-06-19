import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-primary-100 via-primary-50 to-primary-100",
        "bg-[length:200%_100%]",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #f0effe 25%, #e3dfff 50%, #f0effe 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s infinite linear",
      }}
      {...props}
    />
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 rounded ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6 space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export { Skeleton, MetricCardSkeleton, TableRowSkeleton, CardSkeleton };
