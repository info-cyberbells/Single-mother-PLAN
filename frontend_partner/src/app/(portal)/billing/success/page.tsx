import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { BillingSuccessClient } from "./BillingSuccessClient";

export const metadata: Metadata = { title: "Subscription Confirmed" };

export default function BillingSuccessPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Subscription Confirmed" description="Your organization plan is now active" />
      <Suspense fallback={<div className="flex-1 p-8 animate-pulse h-40 bg-primary-subtle rounded-2xl mx-8" />}>
        <BillingSuccessClient />
      </Suspense>
    </div>
  );
}
