import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
  return formatDate(date);
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugToTitle(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    qualified: "Qualified",
    likely_qualified: "Likely Qualified",
    check_required: "Check Required",
    not_qualified: "Not Qualified",
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    action_required: "Action Required",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };
  return labels[status] || slugToTitle(status);
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}
