"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, Eye, Clock, Edit2, Download, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { usePdfGeneration } from "@/hooks/usePdfGeneration";

const DOCUMENT_TYPES = [
  { value: "government_id", label: "Government-Issued Photo ID (Driver's License, Passport, etc.)", icon: "🪪" },
  { value: "proof_of_income", label: "Proof of Income (Pay stubs, W-2, award letters)", icon: "💰" },
  { value: "birth_certificate", label: "Child's Birth Certificate", icon: "👶" },
  { value: "lease_agreement", label: "Lease / Rental Agreement", icon: "🏠" },
  { value: "utility_bill", label: "Utility Bill (Electric, gas, water)", icon: "🔌" },
  { value: "bank_statement", label: "Bank / Financial Account Statement", icon: "🏦" },
  { value: "medical_record", label: "Medical Documentation", icon: "🏥" },
  { value: "childcare_record", label: "Childcare Provider Record", icon: "🧸" },
  { value: "social_security_card", label: "Social Security Card", icon: "💳" },
  { value: "immigration_document", label: "Immigration / Status Document", icon: "🌐" },
  { value: "school_enrollment", label: "School / Training Enrollment Proof", icon: "🎒" },
  { value: "tax_return", label: "Prior Year Tax Return", icon: "📊" },
  { value: "proof_of_pregnancy", label: "Proof of Pregnancy", icon: "🤰" },
  { value: "custody_order", label: "Child Custody Order", icon: "⚖️" },
  { value: "other", label: "Other Supporting Document", icon: "📄" }
];

function classifyDocumentType(fileName: string, currentType: string = "other"): string {
  const lowerName = fileName.toLowerCase();
  
  if (
    lowerName.includes("license") || 
    lowerName.includes("licence") || 
    lowerName.includes("passport") || 
    lowerName.includes("govt") || 
    lowerName.includes("government") ||
    /\bid\b/.test(lowerName) ||
    /\bdl\b/.test(lowerName) ||
    lowerName.includes("driver") ||
    lowerName.includes("state_id") ||
    lowerName.includes("state-id")
  ) {
    return "government_id";
  }
  
  if (
    lowerName.includes("income") || 
    lowerName.includes("paystub") || 
    lowerName.includes("pay_stub") || 
    lowerName.includes("pay-stub") || 
    lowerName.includes("stub") || 
    lowerName.includes("w2") || 
    lowerName.includes("w-2") || 
    lowerName.includes("salary") || 
    lowerName.includes("earning") ||
    lowerName.includes("payslip")
  ) {
    return "proof_of_income";
  }

  if (
    lowerName.includes("birth") || 
    lowerName.includes("certificate") || 
    lowerName.includes("baby") || 
    lowerName.includes("child_cert")
  ) {
    return "birth_certificate";
  }

  if (
    lowerName.includes("lease") || 
    lowerName.includes("rental") || 
    lowerName.includes("rent") || 
    lowerName.includes("tenancy")
  ) {
    return "lease_agreement";
  }

  if (
    lowerName.includes("utility") || 
    lowerName.includes("bill") || 
    lowerName.includes("electric") || 
    lowerName.includes("gas") || 
    lowerName.includes("water") || 
    lowerName.includes("heating") || 
    lowerName.includes("sewer")
  ) {
    return "utility_bill";
  }

  if (
    lowerName.includes("bank") || 
    lowerName.includes("statement") || 
    lowerName.includes("checking") || 
    lowerName.includes("savings") ||
    lowerName.includes("financial")
  ) {
    return "bank_statement";
  }

  if (
    lowerName.includes("medical") || 
    lowerName.includes("health") || 
    lowerName.includes("doctor") || 
    lowerName.includes("disability") || 
    lowerName.includes("clinical") ||
    lowerName.includes("vaccin") ||
    lowerName.includes("immuniz")
  ) {
    return "medical_record";
  }

  if (
    lowerName.includes("childcare") || 
    lowerName.includes("provider") || 
    lowerName.includes("nanny") || 
    lowerName.includes("daycare") ||
    lowerName.includes("ccdf")
  ) {
    return "childcare_record";
  }

  if (
    lowerName.includes("ssn") || 
    lowerName.includes("social security") || 
    lowerName.includes("social_security") || 
    lowerName.includes("ssc")
  ) {
    return "social_security_card";
  }

  if (
    lowerName.includes("immigration") || 
    lowerName.includes("green card") || 
    lowerName.includes("greencard") || 
    lowerName.includes("visa") || 
    lowerName.includes("ead") || 
    lowerName.includes("permanent resident")
  ) {
    return "immigration_document";
  }

  if (
    lowerName.includes("school") || 
    lowerName.includes("enrollment") || 
    lowerName.includes("student") || 
    lowerName.includes("class") || 
    lowerName.includes("transcript")
  ) {
    return "school_enrollment";
  }

  if (
    lowerName.includes("tax") || 
    lowerName.includes("return") || 
    lowerName.includes("1040") || 
    lowerName.includes("irs")
  ) {
    return "tax_return";
  }

  if (
    lowerName.includes("pregnant") || 
    lowerName.includes("pregnancy") || 
    lowerName.includes("due date") || 
    lowerName.includes("due_date") || 
    lowerName.includes("ultrasound")
  ) {
    return "proof_of_pregnancy";
  }

  if (
    lowerName.includes("custody") || 
    lowerName.includes("divorce") || 
    lowerName.includes("guardianship") || 
    lowerName.includes("court order") || 
    lowerName.includes("court_order")
  ) {
    return "custody_order";
  }

  return currentType;
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get("type");
  const redirectParam = searchParams.get("redirect");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [activeTab, setActiveTab] = useState<"uploaded" | "generated">("uploaded");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { viewPdf, downloadPdf, isViewing, isDownloading } = usePdfGeneration();
  const [selectedDocType, setSelectedDocType] = useState<string>(typeParam || "government_id");

  // Sync selectedDocType with query parameter when it changes
  useEffect(() => {
    if (typeParam) {
      setSelectedDocType(typeParam);
    }
  }, [typeParam]);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get("/api/documents").then((r) => r.data.data),
  });

  const { data: generatedPdfs, isLoading: loadingPdfs } = useQuery({
    queryKey: ["generated-pdfs"],
    queryFn: () => api.get("/api/pdf").then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeletingId(null);
    },
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    // Auto-classify type if currently set to 'other'
    let docTypeToUpload = selectedDocType;
    if (selectedDocType === "other") {
      const detected = classifyDocumentType(file.name, "other");
      if (detected !== "other") {
        docTypeToUpload = detected;
        setSelectedDocType(detected);
      }
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docTypeToUpload);
    try {
      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setUploadProgress(percentCompleted);
        },
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (redirectParam) {
        router.push(redirectParam);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDocument = async (id: string, mimeType: string) => {
    try {
      const response = await api.get(`/api/documents/${id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to view document", err);
    }
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await api.patch(`/api/documents/${id}/rename`, { name: newName });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("Failed to rename document", err);
    } finally {
      setRenamingId(null);
      setNewName("");
    }
  };

  const docTypeIcons: Record<string, string> = {
    government_id: "🪪",
    identity: "🪪",
    proof_of_income: "💰",
    income: "💰",
    lease_agreement: "🏠",
    residence: "🏠",
    medical_record: "🏥",
    medical: "🏥",
    birth_certificate: "👶",
    utility_bill: "🔌",
    bank_statement: "🏦",
    childcare_record: "🧸",
    social_security_card: "💳",
    immigration_document: "🌐",
    school_enrollment: "🎒",
    tax_return: "📊",
    proof_of_pregnancy: "🤰",
    custody_order: "⚖️",
    other: "📄",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Documents
        </h1>
        <p className="text-sm text-on-surface-variant">
          Securely upload and manage supporting documents for your applications
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("uploaded")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            activeTab === "uploaded"
              ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
              : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Uploaded Documents
        </button>
        <button
          onClick={() => setActiveTab("generated")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            activeTab === "generated"
              ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
              : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Generated Application Packages
        </button>
      </div>

      {activeTab === "uploaded" && (
        <>
          {/* Document Type Selector */}
          <div className="mb-6 bg-surface-container/30 border border-outline-variant/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Select Document Type
              </label>
              <p className="text-xs text-on-surface-variant">
                Choose the correct category to ensure government programs recognize this document.
              </p>
            </div>
            <div className="relative min-w-[280px]">
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm font-medium text-on-surface appearance-none cursor-pointer"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-primary-200 bg-primary-50/30 rounded-2xl p-10 text-center mb-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
                <div className="flex items-center gap-2 mb-1 text-primary-600 font-medium">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-medium text-on-surface mb-1">Drop files here or click to upload</p>
                  <p className="text-xs text-on-surface-variant">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Documents List */}
      {activeTab === "uploaded" && (
        isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: any, i: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="sm" hover>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl shrink-0">
                      {docTypeIcons[doc.document_type] || "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renamingId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 h-8 px-2 text-sm border border-surface-container-highest rounded bg-surface focus:outline-none focus:border-primary-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(doc.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleRename(doc.id)}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="text-xs font-medium text-on-surface-variant hover:text-on-surface"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="font-medium text-sm text-on-surface truncate flex items-center gap-2 group">
                          {doc.display_name}
                          <button
                            onClick={() => {
                              setRenamingId(doc.id);
                              setNewName(doc.display_name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-all"
                            title="Rename Document"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span className="capitalize">{doc.document_type?.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploaded_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleViewDocument(doc.id, doc.mime_type)}
                        title="View Document"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(doc.id)}
                        title="Delete Document"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === "generated" && (
        loadingPdfs ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        ) : !generatedPdfs || generatedPdfs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">No generated packages found. Apply to programs to generate PDFs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {generatedPdfs.map((pdf: any, i: number) => (
              <motion.div
                key={pdf.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="sm" hover>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-on-surface truncate">
                        {pdf.program?.name || "Application Package"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span>v{pdf.version}</span>
                        <span>•</span>
                        <span>{pdf.program?.agency || "Government Assistance"}</span>
                        <span>•</span>
                        <span>{formatDate(pdf.generated_at)}</span>
                        <span>•</span>
                        <span>{formatBytes(pdf.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => viewPdf(pdf.id)}
                        disabled={!!isViewing || !!isDownloading}
                        title="View PDF"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadPdf(pdf.id, pdf.program?.name)}
                        disabled={!!isViewing || !!isDownloading}
                        title="Download PDF"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-glass-lg w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Delete Document?</h3>
                  <p className="text-xs text-on-surface-variant">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                This document will be permanently removed from your vault and any linked applications.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setDeletingId(null)}
                >
                  Keep
                </Button>
                <button
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deletingId)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  );
}
