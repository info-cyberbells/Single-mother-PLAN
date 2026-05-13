"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get("/api/documents").then((r) => r.data.data),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("document", file);
    try {
      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const docTypeIcons: Record<string, string> = {
    identity: "🪪",
    income: "💰",
    residence: "🏠",
    medical: "🏥",
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
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <span className="text-sm text-on-surface-variant">Uploading to secure storage...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-medium text-on-surface mb-1">Drop files here or click to upload</p>
              <p className="text-xs text-on-surface-variant">
                PDF, JPG, PNG, DOC/DOCX up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
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
                    <div className="font-medium text-sm text-on-surface truncate">
                      {doc.file_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="capitalize">{doc.document_type}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.verified ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Pending
                      </span>
                    )}
                    {doc.s3_url && (
                      <a
                        href={doc.s3_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
