"use client";

import { cn, getStatusLabel } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Eligibility
  qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  likely_qualified: "bg-blue-50 text-blue-700 border-blue-200",
  check_required: "bg-amber-50 text-amber-700 border-amber-200",
  not_qualified: "bg-red-50 text-red-700 border-red-200",
  // Application
  draft: "bg-gray-50 text-gray-600 border-gray-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-purple-50 text-purple-700 border-purple-200",
  action_required: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-500 border-gray-200",
  // General
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
  flagged: "bg-red-50 text-red-700 border-red-200",
  // Session
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
  // Priority
  normal: "bg-gray-50 text-gray-600 border-gray-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const statusDots: Record<string, string> = {
  qualified: "bg-emerald-500",
  likely_qualified: "bg-blue-500",
  check_required: "bg-amber-500",
  not_qualified: "bg-red-500",
  approved: "bg-emerald-500",
  active: "bg-emerald-500",
  submitted: "bg-blue-500",
  under_review: "bg-purple-500",
  action_required: "bg-orange-500",
  rejected: "bg-red-500",
  urgent: "bg-red-500",
  high: "bg-orange-500",
};

export function StatusBadge({ status, className }: BadgeProps) {
  const style = statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-200";
  const dot = statusDots[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        style,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />}
      {getStatusLabel(status)}
    </span>
  );
}

interface PlanBadgeProps {
  plan: "free" | "family" | "navigator";
  className?: string;
}

const planStyles: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  family: "bg-primary-50 text-primary-700",
  navigator: "bg-gradient-primary text-white",
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const labels = { free: "Free", family: "Family", navigator: "Navigator" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
        planStyles[plan],
        className
      )}
    >
      {labels[plan]}
    </span>
  );
}
