import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ValidationReport {
  is_valid: boolean;
  missing_required_fields: string[];
  missing_required_documents: string[];
  missing_optional_fields: string[];
  missing_optional_documents: string[];
  uploaded_document_types: string[];
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
  const queryClient = useQueryClient();
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfModal, setPdfModal] = useState<PdfModalState>({ open: false });
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingParams, setPendingParams] = useState<PendingGenerateParams | null>(null);

  const [isViewing, setIsViewing] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

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

      // Auto-trigger download right after successful generation
      downloadPdf(pdfId, programName);

      // Invalidate applications query to update the UI across components
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["generated-pdfs"] });
    } catch (err) {
      console.error("Failed to generate PDF application packet:", err);
    } finally {
      setGeneratingPdfId(null);
      setPendingParams(null);
    }
  };

  const viewPdf = async (pdfId: string) => {
    setIsViewing(pdfId);
    try {
      const response = await api.get(`/api/pdf/${pdfId}/download/stream`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to view PDF:", err);
    } finally {
      setIsViewing(null);
    }
  };

  const downloadPdf = async (pdfId: string, programName?: string) => {
    setIsDownloading(pdfId);
    try {
      const response = await api.get(`/api/pdf/${pdfId}/download/stream`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${(programName || "Application").replace(/\s+/g, "_")}_Package.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(null);
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
    isViewing,
    isDownloading,
    handleGeneratePdf,
    confirmAndGeneratePdf,
    viewPdf,
    downloadPdf,
    closeWarningModal,
    closePdfModal,
  };
}
