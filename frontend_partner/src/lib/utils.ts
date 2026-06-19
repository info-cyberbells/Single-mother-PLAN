import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  try {
    return format(new Date(date), pattern);
  } catch {
    return "—";
  }
}

export function formatRelativeDate(date: string | Date): string {
  try {
    const d = new Date(date);
    if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, "h:mm a")}`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function formatNumber(n: number, compact = false): string {
  if (compact && n >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US").format(n);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + "s"}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "text-status-success bg-status-success-bg",
    open: "text-status-success bg-status-success-bg",
    completed: "text-status-info bg-status-info-bg",
    closed: "text-on-surface bg-surface-container",
    pending: "text-status-warning bg-status-warning-bg",
    draft: "text-text-mid bg-primary-subtle",
    rejected: "text-status-error bg-status-error-bg",
    cancelled: "text-status-error bg-status-error-bg",
    referred: "text-partner-700 bg-partner-100",
    accepted: "text-status-success bg-status-success-bg",
    in_progress: "text-status-info bg-status-info-bg",
  };
  return map[status?.toLowerCase()] ?? "text-text-mid bg-primary-subtle";
}

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
