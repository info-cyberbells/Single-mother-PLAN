import type { Metadata } from "next";
import { CaseRedirectClient } from "./CaseRedirectClient";

export const metadata: Metadata = { title: "Case Details" };

export default async function CaseShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseRedirectClient caseId={id} />;
}
