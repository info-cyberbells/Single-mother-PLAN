import { cn } from "@/lib/utils";

const QUARTERS = [
  { key: "Q1", label: "Q1 · Jan–Mar" },
  { key: "Q2", label: "Q2 · Apr–Jun" },
  { key: "Q3", label: "Q3 · Jul–Sep" },
  { key: "Q4", label: "Q4 · Oct–Dec" },
];

interface QuarterTabsProps {
  value: string;
  onChange: (q: string) => void;
  className?: string;
}

export function QuarterTabs({ value, onChange, className }: QuarterTabsProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {QUARTERS.map((q) => (
        <button
          key={q.key}
          onClick={() => onChange(q.key)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            value === q.key
              ? "bg-white text-partner-700 shadow-sm"
              : "bg-white/15 text-white/80 hover:bg-white/25"
          )}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}

export function currentQuarter(): string {
  const m = new Date().getMonth();
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
}

export { QUARTERS };
