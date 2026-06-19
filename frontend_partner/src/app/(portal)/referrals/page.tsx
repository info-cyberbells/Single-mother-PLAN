import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ReferralsClient } from "./ReferralsClient";

export const metadata: Metadata = { title: "Referrals" };

export default function ReferralsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Referrals"
        description="Track referrals sent and received by your organization"
      />
      <ReferralsClient />
    </div>
  );
}
