"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  ClipboardList,
  BookOpen,
  FileBarChart,
  Settings,
  LogOut,
  Heart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/programs", label: "Programs", icon: BookOpen },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch { }
    logout();
    router.push("/");
  };

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <div className="font-display font-bold text-white">MomPlan</div>
            <div className="text-xs text-slate-400">Admin Dashboard</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {adminNav.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-900/50 text-primary-300 border border-primary-800/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary-400" />
              <span className="text-xs text-primary-400">System Admin</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
