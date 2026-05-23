"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Filter, Search, Send, Loader2, Edit3, X } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatRelativeDate } from "@/lib/utils";

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<any>(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get("/api/applications").then((r) => r.data.data),
  });

  const filtered = (applications || []).filter((a: any) =>
    filter === "all" ? true : a.status === filter
  );

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "submitted", label: "Submitted" },
    { key: "under_review", label: "In Review" },
    { key: "action_required", label: "Action Required" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const handlePrepareDraft = async (app: any) => {
    setActiveApp(app);
    setDraftModalOpen(true);
    setIsGenerating(true);
    setDraftSubject("");
    setDraftBody("");
    setDraftTo("");
    try {
      const res = await api.get(`/api/applications/${app.id}/draft`);
      setDraftSubject(res.data.data.subject);
      setDraftBody(res.data.data.body);
      setDraftTo(res.data.data.to || "");
    } catch (err) {
      console.error(err);
      setDraftBody("Failed to generate draft. You can write your own email here.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitDraft = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/api/applications/${activeApp.id}/apply`, {
        subject: draftSubject,
        body: draftBody,
        to: draftTo,
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setDraftModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            Applications Tracker
          </h1>
          <p className="text-sm text-on-surface-variant">
            Track all your benefit program applications in one place
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f.key
                ? "bg-primary-100 text-primary-700 border border-primary-200"
                : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f.label}
            {f.key !== "all" && applications && (
              <span className="ml-1.5 text-xs">
                ({applications.filter((a: any) => a.status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-surface-container rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
            No applications found
          </h3>
          <p className="text-on-surface-variant mb-6">
            {filter === "all"
              ? "Start by scanning your eligibility and applying to matched programs"
              : `No applications with status "${filter}"`}
          </p>
          {filter === "all" && (
            <Button asChild>
              <a href="/dashboard/benefits">Browse Programs</a>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any, i: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="sm" hover>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-semibold text-on-surface">
                        {app.program?.name}
                      </span>
                      <StatusBadge status={app.status} />
                      {app.priority && app.priority !== "normal" && (
                        <StatusBadge status={app.priority} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span>{app.program?.agency}</span>
                      {app.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-48">{app.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-on-surface-variant">Last updated</div>
                    <div className="text-sm font-medium text-on-surface">
                      {formatRelativeDate(app.last_updated_at)}
                    </div>
                  </div>
                </div>
                {app.status === "action_required" && app.notes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-xs text-orange-700 font-medium">Action needed: {app.notes}</p>
                  </div>
                )}
                {app.status === "draft" && (
                  <div className="mt-3 pt-3 border-t border-surface-container-highest flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => handlePrepareDraft(app)}
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Review & Send Application
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Draft Modal */}
      {draftModalOpen && activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="font-display font-semibold text-lg text-on-surface">Review Application Email</h3>
                <p className="text-xs text-on-surface-variant">
                  We've drafted an email for {activeApp.program?.name}. You can edit it before sending.
                </p>
              </div>
              <button
                onClick={() => setDraftModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
                  <p className="text-sm text-on-surface-variant font-medium">AI is drafting your application email...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">To (Recipient Email)</label>
                    <input
                      type="email"
                      value={draftTo}
                      onChange={(e) => setDraftTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Email Body</label>
                    <textarea
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 text-sm border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Your uploaded documents will be automatically attached to this email when sent.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-surface-container bg-surface-container-lowest flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDraftModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitDraft} 
                disabled={isGenerating || isSubmitting || !draftBody.trim()}
                loading={isSubmitting}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Submit Application
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
