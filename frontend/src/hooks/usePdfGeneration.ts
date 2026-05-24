import { useState } from "react";
import { api } from "@/lib/api";

export interface ValidationReport {
  is_valid: boolean;
  missing_required_fields: string[];
  missing_required_documents: string[];
  missing_optional_fields: string[];
  missing_optional_documents: string[];
  can_generate: boolean;
}

export interface PdfModalState {
  open: boolean;
  pdfId?: string;
  downloadUrl?: string;
  programName?: string;
}

export interface PendingGenerateParams {
  programId: string;
  applicationId?: string;
  programName?: string;
}

export function usePdfGeneration() {
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfModal, setPdfModal] = useState<PdfModalState>({ open: false });
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingParams, setPendingParams] = useState<PendingGenerateParams | null>(null);

  const handleGeneratePdf = async (programId: string, applicationId?: string, programName?: string) => {
    // Determine loading indicator key (use application_id if tracker, otherwise program_id)
    const loadId = applicationId || programId;
    setGeneratingPdfId(loadId);

    try {
      // Validate first
      const valRes = await api.post("/api/pdf/validate", { program_id: programId });
      const report: ValidationReport = valRes.data.data;

      const hasMissingRequired = 
        report.missing_required_fields.length > 0 || 
        report.missing_required_documents.length > 0;
      
      const hasMissingOptional = 
        report.missing_optional_fields.length > 0 || 
        report.missing_optional_documents.length > 0;

      if (hasMissingRequired || hasMissingOptional) {
        setValidationReport(report);
        setPendingParams({ programId, applicationId, programName });
        setShowWarningModal(true);
        setGeneratingPdfId(null);
      } else {
        // Safe to generate directly
        await confirmAndGeneratePdf(programId, applicationId, programName);
      }
    } catch (err) {
      console.error("Failed to validate program requirements:", err);
      setGeneratingPdfId(null);
    }
  };

  const confirmAndGeneratePdf = async (
    programId: string,
    applicationId?: string,
    programName?: string
  ) => {
    const loadId = applicationId || programId;
    setGeneratingPdfId(loadId);
    setShowWarningModal(false);

    try {
      const res = await api.post("/api/pdf/generate", {
        program_id: programId,
        application_id: applicationId,
      });
      const pdfId = res.data.data.id;
      const urlRes = await api.get(`/api/pdf/${pdfId}/download`);
      
      setPdfModal({
        open: true,
        pdfId,
        downloadUrl: urlRes.data.data.url,
        programName,
      });
    } catch (err) {
      console.error("Failed to generate PDF application packet:", err);
    } finally {
      setGeneratingPdfId(null);
      setPendingParams(null);
    }
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
    setValidationReport(null);
    setPendingParams(null);
  };

  const closePdfModal = () => {
    setPdfModal({ open: false });
  };

  return {
    generatingPdfId,
    pdfModal,
    validationReport,
    showWarningModal,
    pendingParams,
    handleGeneratePdf,
    confirmAndGeneratePdf,
    closeWarningModal,
    closePdfModal,
  };
}
