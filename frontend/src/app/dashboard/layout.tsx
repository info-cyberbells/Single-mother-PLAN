"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { api } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, user, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Sync database profile state with Zustand on mount
    api
      .get("/api/user/profile")
      .then((res) => {
        if (res.data && res.data.data) {
          updateUser(res.data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to sync user profile:", err);
      });
  }, [isHydrated, isAuthenticated, router, updateUser]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-container-low/40">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
