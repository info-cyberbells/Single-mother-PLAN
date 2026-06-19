"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Settings,
  Heart,
  LogOut,
  Building2,
  Users,
  Bell,
  AlertTriangle,
  Sparkles,
  Baby,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { usePartnerAuthStore } from "@/store/auth.store";
import { isOrgAdmin } from "@/lib/auth-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV = [
  {
    section: "Home",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false }],
  },
  {
    section: "Your caseload",
    items: [
      { label: "Mothers", href: "/mothers", icon: Baby, adminOnly: false },
      { label: "Deadline Alerts", href: "/alerts", icon: AlertTriangle, adminOnly: false },
      { label: "Referrals", href: "/referrals", icon: ArrowLeftRight, adminOnly: false },
      { label: "Documents", href: "/documents", icon: FileText, adminOnly: false },
    ],
  },
  {
    section: "Insights",
    items: [{ label: "Analytics", href: "/analytics", icon: BarChart3, adminOnly: false }],
  },
  {
    section: "Workspace",
    items: [
      { label: "Organization", href: "/organization", icon: Building2, adminOnly: true },
      { label: "Team", href: "/team", icon: Users, adminOnly: true },
      { label: "Notifications", href: "/notifications", icon: Bell, adminOnly: false },
      { label: "Settings", href: "/settings", icon: Settings, adminOnly: false },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, logout } = usePartnerAuthStore();
  const isAdmin = isOrgAdmin(user);

  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href || pathname.startsWith("/cases")
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="relative w-[272px] min-w-[272px] h-screen flex flex-col bg-gradient-sidebar-warm overflow-hidden">
      {/* Warm decorative glow */}
      <div className="pointer-events-none absolute -top-20 -left-16 w-56 h-56 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-32 -right-10 w-40 h-40 rounded-full bg-secondary-300/15 blur-2xl" />

      {/* Brand */}
      <div className="relative px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg shrink-0">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-[15px] leading-tight tracking-tight">
              MomPlan
            </div>
            <div className="flex items-center gap-1 text-white/60 text-[11px] font-medium mt-0.5">
              <Sparkles className="w-3 h-3 text-primary-200" />
              Supporting every mom
            </div>
          </div>
        </div>

        {organization && (
          <div className="mt-5 px-3.5 py-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-300 to-secondary-400 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                {initials(organization.name)}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate leading-tight">
                  {organization.name}
                </div>
                <div className="text-white/50 text-[11px] truncate mt-0.5">
                  {organization.type ?? "Partner organization"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        {visibleNav.map((group) => (
          <div key={group.section}>
            <div className="px-3 mb-2 text-[11px] font-semibold text-white/45 tracking-wide">
              {group.section}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={`${group.section}-${item.label}`}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 group relative",
                        active
                          ? "text-partner-800"
                          : "text-white/75 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                          transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0 relative z-10",
                          active ? "text-partner-600" : "text-white/55 group-hover:text-white/90"
                        )}
                      />
                      <span className="relative z-10 flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="relative p-4 mt-auto">
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-colors">
          <Avatar className="w-9 h-9 shrink-0 ring-2 ring-white/30">
            <AvatarImage src={user?.avatar_url ?? ""} alt={user?.full_name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary-300 to-secondary-400 text-white font-bold">
              {initials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate leading-tight">
              {user?.full_name ?? "Welcome"}
            </div>
            <div className="text-white/45 text-[11px] truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => logout()}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
