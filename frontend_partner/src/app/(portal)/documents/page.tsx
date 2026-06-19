import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Documents"
        description="Manage organization documents, reports and case files"
      />
      <DocumentsClient />
    </div>
  );
}
