"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CaseDetailView } from "@/components/cases/CaseDetailView";
import type { CaseDetail } from "@/types";

interface CaseShowClientProps {
  caseId: string;
}

async function fetchCase(id: string): Promise<CaseDetail> {
  const res = await api.get(`/api/partner/cases/${id}`);
  return res.data.data;
}

export function CaseShowClient({ caseId }: CaseShowClientProps) {
  const { data: caseData, isLoading, isError } = useQuery({
    queryKey: ["partner-case-detail", caseId],
    queryFn: () => fetchCase(caseId),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="flex-1 p-8">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-6" asChild>
          <Link href="/cases">
            <ArrowLeft className="w-4 h-4" /> Back to cases
          </Link>
        </Button>
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
          <p className="text-text-soft">Case not found or you don&apos;t have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-primary text-white px-8 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
          asChild
        >
          <Link href="/cases">
            <ArrowLeft className="w-4 h-4" /> Back to cases
          </Link>
        </Button>
      </div>

      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <CaseDetailView caseData={caseData} caseId={caseId} />
      </div>
    </div>
  );
}
