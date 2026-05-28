"use client";

import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

// Duplicate DOCUMENT_META on the frontend for rich UI details
export interface DocumentMeta {
  label: string;
  examples: string;
  agency_note: string;
  urgent: boolean;
}

export const DOCUMENT_META: Record<string, DocumentMeta> = {
  government_id: {
    label: "Government-Issued Photo ID",
    examples: "Driver's license, State ID, Passport, Military ID",
    agency_note: "Must be current and not expired. All adult household members may need to provide ID.",
    urgent: true,
  },
  proof_of_income: {
    label: "Proof of Income",
    examples: "Last 2 pay stubs, W-2, Social Security award letter, unemployment benefit letter",
    agency_note: "Must cover the last 30 days. Self-employed applicants may use a profit/loss statement or tax return.",
    urgent: true,
  },
  birth_certificate: {
    label: "Child's Birth Certificate",
    examples: "Official state-issued birth certificate for each child in the household",
    agency_note: "Required for children claimed as dependents. Hospital certificates are not accepted.",
    urgent: true,
  },
  lease_agreement: {
    label: "Lease / Rental Agreement",
    examples: "Current signed lease, rental contract, letter from landlord",
    agency_note: "Must show your name, address, and landlord contact.",
    urgent: true,
  },
  utility_bill: {
    label: "Utility Bill",
    examples: "Electric, gas, water, or heating oil bill from the past 60 days",
    agency_note: "Used to verify address and calculate utility deductions.",
    urgent: false,
  },
  bank_statement: {
    label: "Bank Statement",
    examples: "Last 1–3 months of checking or savings account statements",
    agency_note: "Required when the program has a resource/asset limit. Must show account holder name.",
    urgent: false,
  },
  medical_record: {
    label: "Medical Documentation",
    examples: "Doctor letter, disability certification, prescription history, hospital discharge summary",
    agency_note: "Required when claiming a disability or chronic illness.",
    urgent: false,
  },
  childcare_record: {
    label: "Childcare Provider Record",
    examples: "Signed childcare provider agreement, enrollment letter, CCDF provider registration",
    agency_note: "Provider must be licensed or certified.",
    urgent: false,
  },
  social_security_card: {
    label: "Social Security Card",
    examples: "Original or certified copy of Social Security card for each household member",
    agency_note: "Required for all members claiming benefits. Must match the name on the application.",
    urgent: true,
  },
  immigration_document: {
    label: "Immigration / Status Document",
    examples: "Permanent Resident Card (Green Card), Employment Authorization Document (EAD)",
    agency_note: "Required for non-citizen applicants.",
    urgent: true,
  },
  school_enrollment: {
    label: "School / Training Enrollment Proof",
    examples: "Enrollment letter, student ID, class schedule",
    agency_note: "Required to satisfy work/training participation requirements.",
    urgent: false,
  },
  tax_return: {
    label: "Prior Year Tax Return",
    examples: "IRS Form 1040 (most recent filed year), all schedules included",
    agency_note: "May be used in place of pay stubs for self-employed or irregular income.",
    urgent: false,
  },
  proof_of_pregnancy: {
    label: "Proof of Pregnancy",
    examples: "Physician's letter confirming pregnancy with expected due date",
    agency_note: "Required for pregnancy-based eligibility. Must be on clinic letterhead.",
    urgent: false,
  },
  custody_order: {
    label: "Child Custody Order",
    examples: "Court-issued custody decree, parenting plan, guardianship paperwork",
    agency_note: "Required when custody is shared or disputed.",
    urgent: false,
  },
};

export function getDocumentLabel(docType: string): string {
  return DOCUMENT_META[docType]?.label ?? docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ValidationReport {
  is_valid: boolean;
  missing_required_fields: string[];
  missing_required_documents: string[];
  missing_optional_fields: string[];
  missing_optional_documents: string[];
  uploaded_document_types: string[];
  can_generate: boolean;
}

export interface PendingGenerateParams {
  programId: string;
  applicationId?: string;
  programName?: string;
}

interface DocumentReadinessModalProps {
  isOpen: boolean;
  validationReport: ValidationReport | null;
  pendingParams: PendingGenerateParams | null;
  generatingPdfId: string | null;
  onClose: () => void;
  onGenerateAnyway: (programId: string, applicationId?: string, programName?: string) => void;
}

export default function DocumentReadinessModal({
  isOpen,
  validationReport,
  pendingParams,
  generatingPdfId,
  onClose,
  onGenerateAnyway,
}: DocumentReadinessModalProps) {
  const router = useRouter();

  if (!isOpen || !validationReport || !pendingParams) return null;

  const {
    missing_required_fields,
    missing_required_documents,
    missing_optional_fields,
    missing_optional_documents,
    uploaded_document_types,
  } = validationReport;

  const hasMissingRequired =
    missing_required_fields.length > 0 || missing_required_documents.length > 0;

  const handleUploadNow = () => {
    onClose();
    router.push("/dashboard/documents");
  };

  const handleConfirmGenerate = () => {
    onGenerateAnyway(
      pendingParams.programId,
      pendingParams.applicationId,
      pendingParams.programName
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-surface rounded-3xl border border-outline-variant/30 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${hasMissingRequired ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-on-surface">
                Document & Profile Readiness
              </h3>
              <p className="text-xs text-on-surface-variant">
                Analyzing requirements for {pendingParams.programName || "Program"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-on-surface">
          <p className="text-on-surface-variant leading-relaxed">
            MomPlan checked your active profile details and secure document vault against the intake requirements for{" "}
            <strong className="text-on-surface font-semibold">{pendingParams.programName}</strong>. Here is your readiness breakdown:
          </p>

          {/* Section 1: ✅ Documents Ready (Green Pills) */}
          {uploaded_document_types.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-display font-semibold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Uploaded & Ready ({uploaded_document_types.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {uploaded_document_types.map((docType) => (
                  <span
                    key={docType}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100/80 shadow-sm"
                  >
                    ✓ {getDocumentLabel(docType)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: ❌ Required — Missing (Red Cards) */}
          {(missing_required_documents.length > 0 || missing_required_fields.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-xs text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Required — Missing Action
              </h4>
              <div className="grid gap-3">
                {/* Missing required documents */}
                {missing_required_documents.map((docType) => {
                  const meta = DOCUMENT_META[docType];
                  return (
                    <div
                      key={docType}
                      className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-200 hover:bg-red-50"
                    >
                      <div className="space-y-1">
                        <div className="font-display font-semibold text-red-950 text-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                          {meta?.label ?? getDocumentLabel(docType)}
                        </div>
                        {meta && (
                          <>
                            <p className="text-xs text-red-700/90 leading-relaxed">
                              <span className="font-medium text-red-950">Examples:</span> {meta.examples}
                            </p>
                            <p className="text-[11px] text-red-800/80 italic font-medium leading-relaxed bg-red-100/40 p-2 rounded-lg border border-red-100/50">
                              💡 Agency info: {meta.agency_note}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={handleUploadNow}
                        className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Now
                      </button>
                    </div>
                  );
                })}

                {/* Missing required fields */}
                {missing_required_fields.length > 0 && (
                  <div className="p-4 bg-red-50/40 border border-red-100/60 rounded-2xl space-y-2">
                    <div className="font-semibold text-red-950 text-xs uppercase tracking-wider">
                      Missing Profile Data Fields:
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-xs text-red-800">
                      {missing_required_fields.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 capitalize font-medium">
                          <span className="w-1 h-1 rounded-full bg-red-400" />
                          {f.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-red-700 mt-2">
                      Please navigate to <span className="font-semibold">Eligibility Profile</span> to complete this information.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: ⚠️ Optional — Recommended (Amber Pills/Details) */}
          {(missing_optional_documents.length > 0 || missing_optional_fields.length > 0) && (
            <div className="space-y-3 p-4 bg-amber-50/40 border border-amber-100/40 rounded-2xl">
              <h4 className="font-display font-semibold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Optional — Recommended
              </h4>
              <p className="text-[11px] text-amber-800 leading-normal mb-2">
                Providing these optional documents or details is highly recommended and may unlock higher priority or speed up state agency approval.
              </p>

              {missing_optional_documents.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-900">Missing Recommended Documents:</div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {missing_optional_documents.map((docType) => (
                      <span
                        key={docType}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200/50"
                      >
                        {getDocumentLabel(docType)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missing_optional_fields.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs font-semibold text-amber-900">Missing Optional Profile Data:</div>
                  <ul className="grid grid-cols-2 gap-1.5 text-xs text-amber-800 pt-1">
                    {missing_optional_fields.map((f) => (
                      <li key={f} className="flex items-center gap-1 capitalize">
                        <span className="w-1 h-1 rounded-full bg-amber-400" />
                        {f.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-on-surface-variant italic leading-relaxed pt-2 border-t border-outline-variant/30">
            ℹ️ You can proceed to generate the official application packet right now. A <strong className="text-red-700">Document Gap Report</strong> will be automatically appended to the PDF, helping you and caseworkers track what remains.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleUploadNow}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-1.5"
          >
            Upload Documents First
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleConfirmGenerate}
            disabled={generatingPdfId !== null}
            loading={generatingPdfId !== null}
            className="w-full sm:w-auto order-0 sm:order-3"
          >
            Generate PDF Anyway
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
