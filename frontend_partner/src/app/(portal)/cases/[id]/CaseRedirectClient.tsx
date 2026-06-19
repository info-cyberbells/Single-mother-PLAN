"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CaseRedirectClient({ caseId }: { caseId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/cases?case=${caseId}`);
  }, [caseId, router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
    </div>
  );
}
