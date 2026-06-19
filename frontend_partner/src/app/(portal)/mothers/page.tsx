import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { MothersClient } from "./MothersClient";

export const metadata: Metadata = {
  title: "Mothers — MomPlan Partner",
};

export default function MothersPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Mothers"
        description="Manage mother assignments and caseload"
      />
      <MothersClient />
    </div>
  );
}
