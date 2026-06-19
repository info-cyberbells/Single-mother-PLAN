import type { Metadata } from "next";
import { Suspense } from "react";
import { CaseManagementClient } from "@/components/cases/CaseManagementClient";

export const metadata: Metadata = {
  title: "Case Management",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" /></div>}>
      <CaseManagementClient />
    </Suspense>
  );
}
