"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Settings,
  LogOut,
  Heart,
  Menu,
  X,
  ChevronRight,
  Calendar,
  Sparkles,
  User,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { PlanBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Overview",
    exact: true,
  },
  {
    href: "/dashboard/benefits",
    icon: Sparkles,
    label: "My Benefits",
  },
  {
    href: "/dashboard/applications",
    icon: ClipboardList,
    label: "Applications",
  },
  {
    href: "/dashboard/documents",
    icon: FileText,
    label: "Documents",
  },
  {
    href: "/dashboard/notifications",
    icon: Bell,
    label: "Notifications",
    badge: true,
  },
  {
    href: "/dashboard/sessions",
    icon: Calendar,
    label: "Sessions",
  },
  {
    href: "/dashboard/deadlines",
    icon: Clock,
    label: "Deadlines",
  },
  {
    href: "/dashboard/profile",
    icon: User,
    label: "Profile",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
  },
];

function NavItem({
  item,
  notificationCount,
  collapsed,
}: {
  item: (typeof navItems)[0];
  notificationCount?: number;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-primary-100 text-primary-700 shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          "w-5 h-5 shrink-0",
          isActive ? "text-primary-600" : "text-on-surface-variant group-hover:text-on-surface"
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && notificationCount && notificationCount > 0 ? (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
          {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
        </>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-on-surface text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        const unread = res.data.data.filter((n: any) => !n.is_read).length;
        setNotificationCount(unread);
      } catch {
        // No-op
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // No-op
    }
    logout();
    router.push("/");
  };

  const SidebarContent = (
    <div className={cn(
      "flex flex-col h-full bg-white/80 backdrop-blur-md border-r border-outline-variant/10",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-lg text-on-surface">
              Mom<span className="text-gradient">Plan</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-surface-container items-center justify-center text-on-surface-variant transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            notificationCount={notificationCount}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-outline-variant/10">
        {/* Plan Badge */}
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <PlanBadge plan={user.plan} />
          </div>
        )}

        {/* User info */}
        <div className={cn(
          "flex items-center rounded-xl p-2 hover:bg-surface-container transition-colors cursor-pointer",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.full_name?.charAt(0) || "M"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-on-surface truncate">
                {user?.full_name || "User"}
              </div>
              <div className="text-xs text-on-surface-variant truncate">{user?.email}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-2 mt-1 rounded-xl text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        suppressHydrationWarning
        className="hidden lg:flex shrink-0 h-screen sticky top-0"
      >
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-gradient-primary rounded-full shadow-primary flex items-center justify-center"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              suppressHydrationWarning
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
