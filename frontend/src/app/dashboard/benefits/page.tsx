"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Filter,
  Search,
  ArrowRight,
  CheckCircle2,
  Info,
  TrendingUp,
  FileText,
  X,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
} from "lucide-react";
import { usePdfGeneration } from "@/hooks/usePdfGeneration";
import DocumentReadinessModal from "@/components/pdf/DocumentReadinessModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency, getConfidenceColor } from "@/lib/utils";

export default function BenefitsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showEmails, setShowEmails] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
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
  } = usePdfGeneration();

  const { data: results, isLoading } = useQuery({
    queryKey: ["eligibility-results"],
    queryFn: () => api.get("/api/eligibility/results").then((r) => r.data.data),
  });

  const scanMutation = useMutation({
    mutationFn: () => api.post("/api/eligibility/scan"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eligibility-results"] });
    },
  });

  const filtered = (results || []).filter((r: any) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      !search ||
      r.program?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.program?.agency?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { key: "all", label: "All Programs" },
    { key: "qualified", label: "Qualified" },
    { key: "likely_qualified", label: "Likely Qualified" },
    { key: "check_required", label: "Additional Review" },
    { key: "not_qualified", label: "Not Qualified" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            My Benefits & Eligibility
          </h1>
          <p className="text-sm text-on-surface-variant">
            AI-powered matching across 200+ government programs
          </p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          loading={scanMutation.isPending}
          size="md"
        >
          <RefreshCw className="w-4 h-4" />
          {scanMutation.isPending ? "Scanning..." : "Re-run AI Scan"}
        </Button>
      </div>

      {/* Total value banner */}
      {results && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-primary border-0" glass={false}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white/70 text-sm">Estimated Total Monthly Benefits</div>
                <div className="font-display font-bold text-3xl text-white">
                  {formatCurrency(
                    results
                      .filter((r: any) => ["qualified", "likely_qualified"].includes(r.status))
                      .reduce((acc: number, r: any) => acc + (r.program?.estimated_monthly_value_max || 0), 0)
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-xs">Qualified programs</div>
                <div className="font-bold text-2xl text-white">
                  {results.filter((r: any) => ["qualified", "likely_qualified"].includes(r.status)).length}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f.key
                  ? "bg-primary-100 text-primary-700 border border-primary-200"
                  : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/30 bg-white text-sm">
            <input
              type="checkbox"
              id="show-emails-checkbox"
              checked={showEmails}
              onChange={(e) => setShowEmails(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-outline-variant/60 cursor-pointer"
            />
            <label htmlFor="show-emails-checkbox" className="text-xs text-on-surface-variant font-semibold cursor-pointer select-none whitespace-nowrap">
              Show Emails
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
            {results?.length === 0 ? "No scan results yet" : "No programs match your filter"}
          </h3>
          <p className="text-on-surface-variant mb-6 max-w-sm mx-auto">
            {results?.length === 0
              ? "We need a bit more information about your family to find the best matches. Complete your profile to see eligible benefits."
              : "Try adjusting your filter criteria"}
          </p>
          {results?.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => router.push("/eligibility")} variant="primary">
                <ArrowRight className="w-4 h-4" />
                Complete Family Profile
              </Button>
              <Button onClick={() => scanMutation.mutate()} variant="outline" loading={scanMutation.isPending}>
                <RefreshCw className="w-4 h-4" />
                Run AI Scan
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((result: any, i: number) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-on-surface">
                        {result.program?.name}
                      </h3>
                      <StatusBadge status={result.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant">{result.program?.agency}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(result.program?.estimated_monthly_value_max || 0)}
                    </div>
                    <div className="text-xs text-on-surface-variant">/ month max</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-on-surface-variant">AI Confidence</span>
                    <span className={`text-xs font-semibold ${getConfidenceColor(result.confidence_score)}`}>
                      {result.confidence_score}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                {result.reasoning && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-surface-container-low">
                    <Info className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {result.reasoning}
                    </p>
                  </div>
                )}

                {showEmails && result.program?.contact_email && (
                  <div className="mb-4 p-3 rounded-lg bg-primary-50/50 border border-primary-100/50 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Contact Email:</span>
                    <a href={`mailto:${result.program.contact_email}`} className="text-primary-700 hover:underline font-mono font-semibold">
                      {result.program.contact_email}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-on-surface-variant capitalize">
                      {result.program?.program_type?.replace(/_/g, " ")} program
                    </span>
                  </div>
                  {["qualified", "likely_qualified"].includes(result.status) && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePdf(result.program.id, undefined, result.program.name)}
                        disabled={generatingPdfId === result.program.id}
                        loading={generatingPdfId === result.program.id}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Generate PDF
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          if (result.program?.id) {
                            api.post("/api/applications", { program_id: result.program.id })
                              .then(() => queryClient.invalidateQueries({ queryKey: ["applications"] }))
                              .catch(console.error);
                          }
                          if (result.program?.application_url) {
                            window.open(result.program.application_url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        Apply Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Validation Warning Modal */}
      <DocumentReadinessModal
        isOpen={showWarningModal}
        validationReport={validationReport}
        pendingParams={pendingParams}
        generatingPdfId={generatingPdfId}
        onClose={closeWarningModal}
        onGenerateAnyway={confirmAndGeneratePdf}
      />

      {/* PDF Success/Download Modal */}
      {pdfModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-lg text-on-surface">Generated Successfully</h3>
              </div>
              <button
                onClick={closePdfModal}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">{pdfModal.programName}</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Your government assistance application package has been generated and is ready for download.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-container bg-surface-container-lowest flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={closePdfModal}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                Close
              </Button>
              {pdfModal.pdfId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => viewPdf(pdfModal.pdfId!)}
                    disabled={!!isViewing || !!isDownloading}
                    loading={isViewing === pdfModal.pdfId}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View PDF
                  </Button>
                  <Button
                    onClick={() => downloadPdf(pdfModal.pdfId!, pdfModal.programName)}
                    disabled={!!isViewing || !!isDownloading}
                    loading={isDownloading === pdfModal.pdfId}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
