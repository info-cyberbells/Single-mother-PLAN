"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Clock, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatRelativeDate } from "@/lib/utils";

const notificationIcons: Record<string, any> = {
  deadline: Clock,
  status_update: Bell,
  document_required: AlertCircle,
  system: Bell,
};

const notificationColors: Record<string, string> = {
  deadline: "bg-amber-50 text-amber-600",
  status_update: "bg-blue-50 text-blue-600",
  document_required: "bg-orange-50 text-orange-600",
  system: "bg-primary-50 text-primary-600",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications").then((r) => r.data.data),
    refetchInterval: 30_000, // poll every 30 seconds for new notifications
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications?.filter((n: any) => !n.is_read) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            Notifications
          </h1>
          <p className="text-sm text-on-surface-variant">
            {unread.length > 0 ? `${unread.length} unread notification${unread.length !== 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
            variant="secondary"
            size="sm"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-surface-container rounded-xl" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">No notifications</h3>
          <p className="text-on-surface-variant">
            You're all caught up! We'll notify you of important updates here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: any, i: number) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || "bg-primary-50 text-primary-600";

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                layout
              >
                <Card
                  hover={!notification.is_read}
                  className={`${!notification.is_read ? "border-l-4 border-l-primary-400 bg-primary-50/20" : "opacity-75"} transition-all`}
                  padding="sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-sm text-on-surface">
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary-500 align-middle" />
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant shrink-0">
                          {formatRelativeDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          target={notification.action_url.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:text-primary-600 font-medium mt-1 inline-flex items-center gap-1"
                        >
                          {notification.action_url.startsWith("http") ? (
                            <>Open link <ExternalLink className="w-3 h-3" /></>
                          ) : (
                            "View details →"
                          )}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => markReadMutation.mutate(notification.id)}
                          disabled={markReadMutation.isPending}
                          title="Mark as read"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary-500 hover:bg-primary-50 transition-colors text-xs"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete notification"
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
