"use client";

import { useMutation } from "@tanstack/react-query";
import { Phone, Calendar, FileText, ChevronDown, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate, cn } from "@/lib/utils";
import type { CaseDetail } from "@/types";

const DOC_STATUS: Record<string, string> = {
  missing: "bg-status-error-bg text-status-error",
  pending: "bg-status-warning-bg text-status-warning",
  on_file: "bg-status-success-bg text-status-success",
};

const ACTIVITY_COLORS: Record<string, string> = {
  red: "bg-status-error",
  yellow: "bg-status-warning",
  blue: "bg-primary-500",
  green: "bg-status-success",
};

interface CaseDetailViewProps {
  caseData: CaseDetail;
  caseId: string;
  headerActions?: React.ReactNode;
}

export function CaseDetailView({ caseData: c, caseId, headerActions }: CaseDetailViewProps) {
  const reminder = useMutation({
    mutationFn: () => api.post(`/api/partner/cases/${caseId}/reminder`),
  });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {c.alert && (
        <div className="bg-status-error-bg border-b border-status-error/20 px-6 py-3 flex items-start justify-between gap-3">
          <p className="text-sm text-status-error font-medium flex-1">{c.alert.message}</p>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-status-error/30 text-status-error hover:bg-status-error/10"
            onClick={() => reminder.mutate()}
            disabled={reminder.isPending}
          >
            Send reminder <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      <div className="px-6 py-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-partner-100 text-partner-700 font-bold">
              {c.mother_initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-extrabold text-text-dark">{c.mother_name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-soft mt-1">
              <span>{c.mother_number}</span>
              {c.client_info.dob && (
                <span>
                  DOB {formatDate(c.client_info.dob)}{" "}
                  {c.client_info.age != null && `(${c.client_info.age})`}
                </span>
              )}
              <span>Assigned {formatDate(c.client_info.assigned_date)}</span>
              {c.caseworker && <span>Caseworker {c.caseworker.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Log contact
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Schedule
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Request docs
          </Button>
          {headerActions}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-subtle/50 rounded-xl border border-surface-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-soft mb-3">
              Client Information
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Phone", c.client_info.phone],
                ["Email", c.client_info.email],
                ["Address", c.client_info.address],
                [
                  "Household size",
                  c.client_info.household_size
                    ? `${c.client_info.household_size} (mother + children)`
                    : null,
                ],
                [
                  "Children",
                  c.client_info.children.map((ch) => `${ch.name} ${ch.age}`).join(", ") || null,
                ],
                ["Preferred contact", c.client_info.preferred_contact],
                ["Language", c.client_info.language],
              ].map(([label, val]) =>
                val ? (
                  <div key={label as string} className="flex justify-between gap-2">
                    <dt className="text-text-soft shrink-0">{label}</dt>
                    <dd className="text-text-dark font-medium text-right">{val}</dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>

          <div className="bg-primary-subtle/50 rounded-xl border border-surface-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-soft mb-3">
              Eligibility Snapshot
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-soft">Monthly income</dt>
                <dd className="font-medium">
                  ${c.eligibility.monthly_income?.toLocaleString() ?? "—"} (reported)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-soft">Income threshold</dt>
                <dd>
                  {c.eligibility.income_threshold_pct}% FPL ·{" "}
                  <span className="text-status-success font-semibold">Eligible</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-soft">Last verified</dt>
                <dd>
                  {c.eligibility.last_verified
                    ? formatDate(c.eligibility.last_verified, "MMM yyyy")
                    : "—"}{" "}
                  {c.eligibility.needs_update && (
                    <span className="text-status-warning font-semibold">needs update</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-soft">Proof of residency</dt>
                <dd
                  className={
                    c.eligibility.proof_of_residency === "on_file"
                      ? "text-status-success font-semibold"
                      : "text-status-error font-semibold"
                  }
                >
                  {c.eligibility.proof_of_residency === "on_file" ? "On file" : "Not on file"}
                </dd>
              </div>
              {c.eligibility.postpartum_status && (
                <div className="flex justify-between">
                  <dt className="text-text-soft">Postpartum status</dt>
                  <dd className="text-status-success font-semibold">
                    {c.eligibility.postpartum_status}
                  </dd>
                </div>
              )}
              {c.eligibility.next_review_date && (
                <div className="flex justify-between">
                  <dt className="text-text-soft">Next eligibility review</dt>
                  <dd className="text-status-error font-semibold">
                    {formatDate(c.eligibility.next_review_date)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-soft mb-3">
              Submitted Application Documents
            </h3>
            <p className="text-xs text-text-soft mb-3">
              Documents attached to the mom&apos;s latest secure application email.
            </p>
            <ul className="space-y-3">
              {c.documents.length === 0 && (
                <li className="text-sm text-text-soft">No documents on file yet.</li>
              )}
              {c.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium text-text-dark capitalize">{doc.name}</div>
                    <div className="text-xs text-text-soft">
                      {doc.status === "missing"
                        ? "Not received"
                        : `Received ${formatDate(doc.uploaded_at, "MMM d")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    )}
                    <Badge className={cn("text-[10px] font-bold uppercase", DOC_STATUS[doc.status])}>
                      {doc.status === "on_file" ? "On file" : doc.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-soft mb-3">
              Activity Timeline
            </h3>
            <ul className="space-y-4">
              {c.activity_log.length === 0 && (
                <li className="text-sm text-text-soft">No activity recorded yet.</li>
              )}
              {c.activity_log.map((act) => (
                <li key={act.id} className="flex gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      ACTIVITY_COLORS[act.color] ?? "bg-text-soft"
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium text-text-dark">{act.description}</div>
                    <div className="text-xs text-text-soft">{formatRelativeDate(act.date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
