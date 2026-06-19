import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;
  trend?: { value: number; label?: string };
  badge?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-gradient-partner",
  trend,
  badge,
  className,
}: MetricCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-surface-border shadow-card p-6 transition-shadow hover:shadow-card-hover group",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-partner group-hover:scale-105 transition-transform",
            iconBg
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-partner-700 bg-partner-100 rounded-full px-2 py-0.5 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>

      <div className="tabular-nums text-[28px] font-extrabold text-text-dark leading-none mb-1.5">
        {value}
      </div>

      <div className="text-sm font-semibold text-text-mid mb-2">{title}</div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold",
                trendPositive
                  ? "text-status-success"
                  : trendNegative
                  ? "text-status-error"
                  : "text-text-soft"
              )}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {Math.abs(trend.value)}%
            </div>
          )}
          {subtitle && (
            <span className="text-xs text-text-soft">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-partner-100 animate-pulse" />
        <div className="w-14 h-5 rounded-full bg-partner-100 animate-pulse" />
      </div>
      <div className="w-20 h-8 rounded-lg bg-partner-100 animate-pulse mb-2" />
      <div className="w-28 h-4 rounded-lg bg-partner-50 animate-pulse mb-2" />
      <div className="w-20 h-3 rounded-lg bg-partner-50 animate-pulse" />
    </div>
  );
}
