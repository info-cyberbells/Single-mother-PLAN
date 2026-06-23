import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ReferralDirectoryClient } from "./ReferralDirectoryClient";
import { CardSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Referral Network — Partners by Zip & Type" };

export default function ReferralDirectoryPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Partners by Zip & Type"
        description="A flat directory of every referral partner — zip, type, direction, volume, and acceptance"
      />
      <Suspense fallback={<div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>}>
        <ReferralDirectoryClient />
      </Suspense>
    </div>
  );
}
