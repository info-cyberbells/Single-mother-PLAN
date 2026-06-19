"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/billing";

type BillingIntervalToggleProps = {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
};

export function BillingIntervalToggle({ value, onChange, className }: BillingIntervalToggleProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="inline-flex items-center rounded-full border border-surface-border bg-primary-subtle p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
            value === "monthly"
              ? "bg-white text-text-dark shadow-sm"
              : "text-text-soft hover:text-text-dark"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
            value === "yearly"
              ? "bg-white text-text-dark shadow-sm"
              : "text-text-soft hover:text-text-dark"
          )}
        >
          Yearly
        </button>
      </div>
      <p className="text-xs text-text-soft">
        {value === "yearly" ? "Save up to 17% with annual billing" : "Flexible month-to-month billing"}
      </p>
    </div>
  );
}
