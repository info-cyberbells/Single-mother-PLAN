"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CaseDetailView } from "@/components/cases/CaseDetailView";
import type { CaseDetail } from "@/types";

interface CaseDetailPanelProps {
  caseId: string | null;
  onClose: () => void;
}

async function fetchCase(id: string): Promise<CaseDetail> {
  const res = await api.get(`/api/partner/cases/${id}`);
  return res.data.data;
}

function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

export function CaseDetailPanel({ caseId, onClose }: CaseDetailPanelProps) {
  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["partner-case-detail", caseId],
    queryFn: () => fetchCase(caseId!),
    enabled: !!caseId,
    retry: (count, err) => !isForbidden(err) && count < 2,
  });

  useEffect(() => {
    if (!caseId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [caseId, onClose]);

  return (
    <AnimatePresence>
      {caseId && (
        <>
          <motion.div
            key="case-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="case-panel-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Case details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg sm:max-w-xl lg:w-[min(42rem,46vw)] bg-white shadow-partner-xl border-l border-surface-border"
          >
            <div className="flex flex-col h-full w-full overflow-hidden">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-partner-500 border-t-transparent animate-spin" />
                </div>
              ) : isForbidden(error) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <ShieldAlert className="w-10 h-10 text-status-error mb-3" />
                  <h3 className="font-bold text-text-dark mb-1">Access Denied</h3>
                  <p className="text-sm text-text-soft max-w-xs mb-4">
                    This case is not assigned to you.
                  </p>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              ) : !caseData ? (
                <div className="flex-1 flex items-center justify-center text-text-soft">
                  Case not found
                </div>
              ) : (
                <CaseDetailView
                  caseData={caseData}
                  caseId={caseId}
                  headerActions={
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-primary-subtle text-text-soft shrink-0"
                      aria-label="Close case details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  }
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
