"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps the data area of a dashboard. While `loading` is true the content is
 * gently dimmed and a small "Loading…" pill appears over it — so a quarter/
 * filter change shows feedback exactly where the data updates, without a full
 * skeleton takeover. The controls above (period tabs) stay bright & clickable.
 */
export function DataOverlay({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-4 pointer-events-none">
          <div className="flex items-center gap-2 bg-white border border-surface-border shadow-card rounded-full px-3.5 py-1.5 text-xs font-semibold text-partner-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading…
          </div>
        </div>
      )}
      <div
        className={cn(
          "transition-opacity duration-200",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}
