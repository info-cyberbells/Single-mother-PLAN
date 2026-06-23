import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ReferralNetworkClient } from "./ReferralNetworkClient";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Referral Network Map" };

export default function ReferralNetworkPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Referral Network Map"
        description="Your organization's position in the referral ecosystem — who sends, who receives, acceptance & outcomes"
      />
      <Suspense fallback={<div className="p-8 grid grid-cols-1 md:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}</div>}>
        <ReferralNetworkClient />
      </Suspense>
    </div>
  );
}
