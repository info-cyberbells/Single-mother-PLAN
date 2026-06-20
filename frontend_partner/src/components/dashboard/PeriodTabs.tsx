"use client";

import { cn } from "@/lib/utils";

const PERIODS = [
  { key: "Q1", label: "Q1" },
  { key: "Q2", label: "Q2" },
  { key: "Q3", label: "Q3" },
  { key: "Q4", label: "Q4" },
  { key: "FY", label: "FY to date" },
];

const MONTHS: Record<string, string> = {
  Q1: "Jan–Mar",
  Q2: "Apr–Jun",
  Q3: "Jul–Sep",
  Q4: "Oct–Dec",
};

export interface PeriodValue {
  quarter: string; // "Q1".."Q4" | "FY"
  year: number;
}

export function periodNote(value: PeriodValue): string {
  if (value.quarter === "FY") return `FY ${value.year} to date`;
  return `${value.quarter} ${value.year} · ${MONTHS[value.quarter] ?? ""}`;
}

export function currentQuarter(): string {
  const m = new Date().getMonth();
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
}

interface PeriodTabsProps {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  className?: string;
}

export function PeriodTabs({ value, onChange, className }: PeriodTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap bg-primary-subtle border border-surface-border rounded-xl px-3 py-2",
        className
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-soft mr-1">
        Quarter
      </span>
      {PERIODS.map((p) => {
        const active = value.quarter === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onChange({ ...value, quarter: p.key })}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
              active
                ? "bg-partner-500 text-white border-partner-500 shadow-partner"
                : "bg-white text-partner-700 border-surface-border hover:bg-partner-50"
            )}
          >
            {p.label}
          </button>
        );
      })}
      <span className="ml-auto text-[11px] text-text-soft">
        Showing {periodNote(value)}
      </span>
    </div>
  );
}
