"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CircleAlert, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Application",
      message: "Sarah Johnson submitted an application for WIC.",
      time: "2m ago",
      icon: FileText,
      read: false,
      color: "text-blue-400",
      bg: "bg-blue-500/15",
    },
    {
      id: 2,
      title: "System Update",
      message: "Database maintenance scheduled for tonight at 2 AM.",
      time: "1h ago",
      icon: CircleAlert,
      read: false,
      color: "text-amber-400",
      bg: "bg-amber-500/15",
    },
    {
      id: 3,
      title: "Report Generated",
      message: "Monthly executive summary is ready to download.",
      time: "3h ago",
      icon: CheckCircle2,
      read: true,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isRead = localStorage.getItem("admin_notifications_read");
      if (isRead === "true") {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    }
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_notifications_read", "true");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible overlay to catch clicks outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#0f1117] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0f1117]">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">You have no notifications.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex gap-3 hover:bg-slate-800/30 transition-colors ${!n.read ? "bg-slate-800/10" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.bg} ${n.color}`}>
                    <n.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-sm font-semibold truncate ${!n.read ? "text-white" : "text-slate-300"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 text-center border-t border-slate-800 bg-[#0f1117]">
          <button className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
            View all notifications
          </button>
        </div>
      </motion.div>
    </>
  );
}
