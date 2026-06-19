"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePartnerAuthStore } from "@/store/auth.store";
import { Sidebar } from "@/components/layout/Sidebar";
import { isAdminOnlyRoute, isOrgAdmin } from "@/lib/auth-utils";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, user } = usePartnerAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    if (user?.must_change_password) {
      router.replace("/change-password");
      return;
    }

    if (isAdminOnlyRoute(pathname) && !isOrgAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, user, pathname, router]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      const next = `${pathname}${window.location.search}`;
      const params = new URLSearchParams({ next });
      router.replace(`/login?${params.toString()}`);
    }
  }, [isHydrated, isAuthenticated, router, pathname]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-partner-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-partner animate-pulse" />
          <div className="text-text-soft text-sm">Loading portal…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (user?.must_change_password) return null;
  if (isAdminOnlyRoute(pathname) && !isOrgAdmin(user)) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
