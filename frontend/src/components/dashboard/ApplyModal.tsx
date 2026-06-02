"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Paperclip,
  Upload,
  Globe,
  Plus,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: any;
  applicationId?: string;
}

export default function ApplyModal({
  isOpen,
  onClose,
  program,
  applicationId: initialApplicationId,
}: ApplyModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [applicationId, setApplicationId] = useState<string | undefined>(initialApplicationId);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachPdf, setAttachPdf] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch applications list to see if there is an existing one if not provided
  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get("/api/applications").then((r) => r.data.data),
    enabled: isOpen,
  });

  // Fetch user's documents
  const { data: documents } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get("/api/documents").then((r) => r.data.data),
    enabled: isOpen,
  });

  // Default-check all existing documents on load
  useEffect(() => {
    if (documents) {
      setSelectedDocIds(documents.map((d: any) => d.id));
    }
  }, [documents]);

  // Ensure application draft exists and load email draft
  useEffect(() => {
    if (!isOpen || !program) return;

    const loadDraft = async (appId: string) => {
      setIsGenerating(true);
      try {
        const res = await api.get(`/api/applications/${appId}/draft`);
        setDraftSubject(res.data.data.subject);
        setDraftBody(res.data.data.body);
        setDraftTo(res.data.data.to || "");
      } catch (err) {
        console.error("Failed to fetch application email draft:", err);
        setDraftSubject(`Application Submission: ${program.name}`);
        setDraftBody(`Dear Representative,\n\nI am writing to submit my application for ${program.name}. Please find my details and supporting documents attached.\n\nThank you,\nMomPlan Automations System`);
      } finally {
        setIsGenerating(false);
      }
    };

    const initApplication = async () => {
      // Check if an application already exists
      const existing = (applications || []).find((a: any) => a.program_id === program.id);
      if (existing) {
        setApplicationId(existing.id);
        setAttachPdf(existing.generated_pdfs && existing.generated_pdfs.length > 0);
        loadDraft(existing.id);
      } else {
        setIsGenerating(true);
        try {
          const res = await api.post("/api/applications", { program_id: program.id });
          const newApp = res.data.data;
          setApplicationId(newApp.id);
          setAttachPdf(newApp.generated_pdfs && newApp.generated_pdfs.length > 0);
          loadDraft(newApp.id);
          queryClient.invalidateQueries({ queryKey: ["applications"] });
        } catch (err) {
          console.error("Failed to create application draft:", err);
          setIsGenerating(false);
        }
      }
    };

    if (!applicationId) {
      initApplication();
    } else {
      // Find matching application to check for generated pdf
      const matched = (applications || []).find((a: any) => a.id === applicationId);
      if (matched) {
        setAttachPdf(matched.generated_pdfs && matched.generated_pdfs.length > 0);
      }
      loadDraft(applicationId);
    }
  }, [isOpen, applicationId, program, applications]);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setUploadError("");
      setUploading(false);
      setIsSubmitting(false);
      setDraftSubject("");
      setDraftBody("");
      setDraftTo("");
      setApplicationId(initialApplicationId);
    }
  }, [isOpen, initialApplicationId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "other");
    if (applicationId) {
      formData.append("application_id", applicationId);
    }

    try {
      const res = await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });
      
      const newDoc = res.data.data;
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      // Automatically select the newly uploaded document
      setSelectedDocIds((prev) => [...prev, newDoc.id]);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.error?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSend = async () => {
    if (!applicationId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/applications/${applicationId}/apply`, {
        subject: draftSubject,
        body: draftBody,
        to: draftTo,
        attach_pdf: attachPdf,
        document_ids: selectedDocIds,
      });
      
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSuccess(true);
    } catch (err) {
      console.error("Failed to send application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const docTypeIcons: Record<string, string> = {
    government_id: "🪪",
    proof_of_income: "💰",
    lease_agreement: "🏠",
    utility_bill: "🔌",
    bank_statement: "🏦",
    medical_record: "🏥",
    birth_certificate: "👶",
    childcare_record: "🧸",
    social_security_card: "💳",
    immigration_document: "🌐",
    school_enrollment: "🎒",
    tax_return: "📊",
    proof_of_pregnancy: "🤰",
    custody_order: "⚖️",
    other: "📄",
  };

  const matchedApp = (applications || []).find((a: any) => a.id === applicationId);
  const pdfPackage = matchedApp?.generated_pdfs?.[0];

  return (
    <AnimatePresence>
      {isOpen && program && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-outline-variant/30"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest rounded-t-2xl">
              <div>
                <h3 className="font-display font-bold text-xl text-on-surface">
                  Apply for {program.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Review and customize your secure application email package.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              /* Success View */
              <div className="p-12 text-center flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xl text-on-surface">Application Package Sent!</h4>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                    Your application email, including your generated packet and all selected documents, has been securely transmitted to the agency caseworker.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="primary" onClick={onClose}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              /* Main Form View */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Notice & Website Discouragement Panel */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-sm space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        🔒 Apply via Secure Email (Highly Recommended)
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed mt-1">
                        Government caseworkers process applications sent directly via secure email <strong>3x faster</strong> than standard website portals. Direct website submissions often take 4-6 weeks and have a higher risk of being delayed due to manual entry errors.
                      </p>
                    </div>
                  </div>

                  {program.application_url && (
                    <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="text-amber-800/80 font-medium">
                        If you still wish to apply manually via the slow portal:
                      </span>
                      <a
                        href={program.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-900 hover:text-amber-950 font-semibold underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Go to Agency Website (Not Recommended)
                      </a>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-sm text-on-surface-variant font-medium">
                      AI is drafting your secure submission package...
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-5 gap-6">
                    {/* Left Pane - Email Editor */}
                    <div className="md:col-span-3 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Recipient Agency Email
                        </label>
                        <input
                          type="email"
                          value={draftTo}
                          onChange={(e) => setDraftTo(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                          placeholder="agency@government.gov"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={draftSubject}
                          onChange={(e) => setDraftSubject(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Email Body
                        </label>
                        <textarea
                          value={draftBody}
                          onChange={(e) => setDraftBody(e.target.value)}
                          rows={10}
                          className="w-full px-3.5 py-2.5 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Right Pane - Attachments Manager */}
                    <div className="md:col-span-2 space-y-4 flex flex-col">
                      <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Package Attachments
                        </label>
                        
                        <div className="border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-lowest flex-1 flex flex-col min-h-[300px]">
                          {/* Generated Application PDF attachment */}
                          <div className="p-3 border-b border-surface-container bg-surface-container-low/50">
                            {pdfPackage ? (
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id="attach-pdf-cb"
                                  checked={attachPdf}
                                  onChange={(e) => setAttachPdf(e.target.checked)}
                                  className="w-4 h-4 mt-0.5 rounded text-primary-600 focus:ring-primary-500 border-outline-variant/60 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <label htmlFor="attach-pdf-cb" className="block text-xs font-bold text-on-surface cursor-pointer select-none">
                                    📄 Generated Application PDF
                                  </label>
                                  <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                                    Version {pdfPackage.version} • Created {new Date(pdfPackage.generated_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center p-1.5 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
                                <p className="text-[10px] text-blue-800 leading-normal">
                                  💡 Generate the Application PDF first in the dashboard to attach it here automatically.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Vault documents list */}
                          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[220px]">
                            <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                              From Documents Vault ({documents?.length || 0})
                            </span>

                            {!documents || documents.length === 0 ? (
                              <p className="text-xs text-on-surface-variant/70 italic text-center py-6">
                                Your Document Vault is empty.
                              </p>
                            ) : (
                              documents.map((doc: any) => (
                                <div
                                  key={doc.id}
                                  onClick={() => toggleDocument(doc.id)}
                                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                    selectedDocIds.includes(doc.id)
                                      ? "bg-primary-50/40 border-primary-200"
                                      : "bg-white hover:bg-surface-container border-outline-variant/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="shrink-0 text-base">
                                      {docTypeIcons[doc.document_type] || "📄"}
                                    </div>
                                    <div className="truncate">
                                      <span className="font-semibold block truncate text-on-surface">
                                        {doc.display_name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 pl-2">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      selectedDocIds.includes(doc.id)
                                        ? "bg-primary-600 border-primary-600 text-white"
                                        : "border-outline-variant/60"
                                    }`}>
                                      {selectedDocIds.includes(doc.id) && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Desktop file uploader */}
                          <div className="p-3 bg-surface-container-low border-t border-surface-container">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept=".pdf,.jpeg,.png,.jpg"
                            />
                            
                            {uploading ? (
                              <div className="flex items-center justify-center gap-2 py-1 bg-white border border-outline-variant/30 rounded-lg text-xs font-semibold text-on-surface-variant">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                                <span>Uploading ({uploadProgress}%)</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleUploadClick}
                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 border-dashed rounded-lg text-xs font-bold transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add from Desktop / Cloud
                              </button>
                            )}

                            {uploadError && (
                              <p className="text-[10px] text-red-600 mt-1.5 text-center font-medium">
                                {uploadError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            {!success && (
              <div className="px-6 py-4 border-t border-surface-container bg-surface-container-lowest flex items-center justify-between rounded-b-2xl">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isGenerating || isSubmitting || !draftBody.trim() || !draftTo.trim()}
                  loading={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Send Secure Email Application
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
