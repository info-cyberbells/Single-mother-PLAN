"use client";

import { formatRelativeDate, statusColor, formatStatusLabel } from "@/lib/utils";
import { FolderOpen, ArrowLeftRight, FileText, User } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "case" | "referral" | "document" | "mother";
  title: string;
  description?: string;
  status?: string;
  timestamp: string;
  actor?: string;
}

const ICONS = {
  case: FolderOpen,
  referral: ArrowLeftRight,
  document: FileText,
  mother: User,
};

const ICON_BG = {
  case: "bg-partner-100 text-partner-600",
  referral: "bg-secondary-100 text-secondary-600",
  document: "bg-green-100 text-green-600",
  mother: "bg-primary-100 text-primary-600",
};

interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
}

export function ActivityFeed({
  items,
  emptyMessage = "No recent activity",
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🌸</span>
        </div>
        <p className="text-text-soft text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-border">
      {items.map((item, idx) => {
        const Icon = ICONS[item.type] ?? FolderOpen;
        const iconBg = ICON_BG[item.type] ?? ICON_BG.case;

        return (
          <div
            key={item.id}
            className="flex gap-3 py-3 px-1 hover:bg-primary-subtle/40 rounded-xl transition-colors group cursor-pointer"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text-dark truncate">
                  {item.title}
                </p>
                {item.status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor(item.status)}`}
                  >
                    {formatStatusLabel(item.status)}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-text-soft mt-0.5 truncate">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {item.actor && (
                  <span className="text-xs text-text-soft font-medium">
                    by {item.actor}
                  </span>
                )}
                <span className="text-[10px] text-text-soft/70">
                  {formatRelativeDate(item.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
