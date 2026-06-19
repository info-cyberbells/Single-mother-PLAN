"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePartnerAuthStore } from "@/store/auth.store";

export default function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, user } = usePartnerAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isHydrated && isAuthenticated && !user?.must_change_password) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-partner-soft">
        <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.must_change_password) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-partner-soft p-6">
      {children}
    </div>
  );
}
