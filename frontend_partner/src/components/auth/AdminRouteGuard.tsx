"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePartnerAuthStore } from "@/store/auth.store";
import { isOrgAdmin } from "@/lib/auth-utils";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = usePartnerAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isOrgAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isOrgAdmin(user)) return null;

  return <>{children}</>;
}
