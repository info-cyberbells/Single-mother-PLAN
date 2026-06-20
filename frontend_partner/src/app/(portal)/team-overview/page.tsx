import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { TeamOverviewClient } from "./TeamOverviewClient";

export const metadata: Metadata = {
  title: "Team Overview — MomPlan Partner",
};

export default function TeamOverviewPage() {
  return (
    <AdminRouteGuard>
      <div className="flex flex-col min-h-full">
        <Header
          title="Team Overview"
          description="Caseload, completion, and capacity across your caseworkers"
        />
        <TeamOverviewClient />
      </div>
    </AdminRouteGuard>
  );
}
