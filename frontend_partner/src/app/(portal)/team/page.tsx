import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { TeamClient } from "./TeamClient";

export const metadata: Metadata = {
  title: "Team — MomPlan Partner",
};

export default function TeamPage() {
  return (
    <AdminRouteGuard>
      <div className="flex flex-col min-h-full">
        <Header
          title="Team"
          description="Manage caseworkers and organization access"
        />
        <TeamClient />
      </div>
    </AdminRouteGuard>
  );
}
