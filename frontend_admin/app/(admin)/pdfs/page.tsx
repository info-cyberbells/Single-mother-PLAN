"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Download, User, Calendar, Database, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { formatDate } from "@/lib/utils";

export default function PdfsPage() {
  const { data: pdfs, isLoading } = useQuery({
    queryKey: ["admin-pdfs"],
    queryFn: () => api.get("/api/admin/pdfs").then((r) => r.data.data),
  });

  const handleDownload = async (pdfId: string) => {
    try {
      const res = await api.get(`/api/admin/pdfs/${pdfId}/download`);
      const downloadUrl = res.data.data.url;
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to fetch download URL:", err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <>
      <TopBar
        title="Generated PDF Packages"
        subtitle={`${(pdfs || []).length} generated application packages`}
      />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        {/* Table */}
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th>Applicant</th>
                  <th>Benefit Program</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>File Size</th>
                  <th>Generated Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j}>
                          <div className="skeleton h-4 w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !pdfs || pdfs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No generated PDF packages found on the platform.
                    </td>
                  </tr>
                ) : (
                  pdfs.map((pdf: any) => (
                    <motion.tr
                      key={pdf.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-white text-sm">
                              {pdf.user?.full_name}
                            </div>
                            <div className="text-xs text-slate-500">{pdf.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-200 text-sm">
                          {pdf.program?.name}
                        </div>
                        <div className="text-xs text-slate-500">{pdf.program?.agency}</div>
                      </td>
                      <td className="text-slate-300 text-sm">
                        v{pdf.version}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                          {pdf.status}
                        </span>
                      </td>
                      <td className="text-slate-400 text-sm font-mono">
                        {formatBytes(pdf.file_size)}
                      </td>
                      <td className="text-slate-500 text-xs">
                        {formatDate(pdf.generated_at)}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(pdf.id)}
                            title="Download PDF Package"
                            className="w-8 h-8 rounded-lg hover:bg-brand-500/15 text-slate-500 hover:text-brand-400 flex items-center justify-center transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
