import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { OrganizationClient } from "./OrganizationClient";

export const metadata: Metadata = {
  title: "Organization — MomPlan Partner",
};

export default function OrganizationPage() {
  return (
    <AdminRouteGuard>
      <div className="flex flex-col min-h-full">
        <Header
          title="Organization"
          description="View and manage your organization profile"
        />
        <OrganizationClient />
      </div>
    </AdminRouteGuard>
  );
}
