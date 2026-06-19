"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  BarChart3,
  FileText,
  Bell,
  UserCircle2,
  CreditCard,
  ScrollText,
  Settings,
  LogOut,
  Heart,
  Shield,
  ChevronDown,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/applications", label: "Applications", icon: ClipboardList },
      { href: "/programs", label: "Programs", icon: BookOpen },
      { href: "/counselors", label: "Caseworkers", icon: UserCircle2 },
      { href: "/pdfs", label: "PDFs", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch { }
    logout();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 bg-[#0a0c12] border-r border-slate-800/60 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand group-hover:shadow-lg transition-shadow">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">MomPlan</div>
            <div className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest">
              Admin Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "sidebar-link",
                        active && "sidebar-link-active"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          active ? "text-brand-400" : "text-slate-500"
                        )}
                      />
                      <span className={active ? "text-brand-200" : ""}>{item.label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer group mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
            {getInitials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {user?.full_name || "Admin"}
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-brand-400" />
              <span className="text-[10px] text-brand-400 font-medium">System Admin</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
