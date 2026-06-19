"use client";

import { useState } from "react";
import { Bell, Search, Command } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import { CommandMenu } from "./CommandMenu";
import { NotificationsPanel } from "./NotificationsPanel";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuthStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-800/60 bg-[#0f1117] sticky top-0 z-10">
      {/* Page title */}
      <div>
        <h1 className="text-base font-bold text-white font-display">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <button 
          onClick={() => setCmdOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-500 text-xs hover:text-slate-300 hover:border-slate-600 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search</span>
          <span className="flex items-center gap-0.5 ml-2 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono">
            <Command className="w-3 h-3" />K
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
          </button>
          <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs shadow cursor-pointer">
          {getInitials(user?.full_name)}
        </div>
      </div>
      
      <CommandMenu isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </header>
  );
}
