import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Settings"
        description="Manage your organization and account preferences"
      />
      <Suspense fallback={<div className="flex-1 p-8 animate-pulse h-40 bg-primary-subtle rounded-2xl mx-8" />}>
        <SettingsClient />
      </Suspense>
    </div>
  );
}
