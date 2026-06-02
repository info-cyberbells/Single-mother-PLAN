"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Calendar,
  ClipboardList,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { api } from "@/lib/api";

const DEADLINE_TYPES = [
  { value: "renewal", label: "Program Renewal" },
  { value: "document_submission", label: "Document Submission" },
  { value: "interview", label: "Agency Interview / Appointment" },
  { value: "application_deadline", label: "Application Deadline" },
  { value: "verification", label: "Income / Status Verification" },
  { value: "enrollment", label: "Enrollment Deadline" },
  { value: "appeal", label: "Appeal Filing Deadline" },
  { value: "other", label: "Other" },
];

export default function DeadlinesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedType, setSelectedType] = useState("renewal");
  const [dueDate, setDueDate] = useState("");
  const [addError, setAddError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "overdue" | "completed">("all");
  const queryClient = useQueryClient();

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ["deadlines"],
    queryFn: () => api.get("/api/deadlines").then((r) => r.data.data),
  });

  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get("/api/applications").then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/deadlines", {
        application_id: selectedAppId,
        deadline_type: selectedType,
        due_date: dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setShowAddModal(false);
      setSelectedAppId("");
      setSelectedType("renewal");
      setDueDate("");
      setAddError("");
    },
    onError: (err: any) => {
      setAddError(err.response?.data?.error?.message || "Failed to create deadline");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/deadlines/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/deadlines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
  });

  const now = Date.now();

  const filteredDeadlines = (deadlines || []).filter((d: any) => {
    const due = new Date(d.due_date).getTime();
    if (filterStatus === "upcoming") return !d.is_completed && due > now;
    if (filterStatus === "overdue") return !d.is_completed && due < now;
    if (filterStatus === "completed") return d.is_completed;
    return true;
  });

  const upcomingCount = (deadlines || []).filter(
    (d: any) => !d.is_completed && new Date(d.due_date).getTime() > now
  ).length;
  const overdueCount = (deadlines || []).filter(
    (d: any) => !d.is_completed && new Date(d.due_date).getTime() < now
  ).length;
  const completedCount = (deadlines || []).filter((d: any) => d.is_completed).length;

  const getDaysInfo = (dateStr: string, isCompleted: boolean) => {
    if (isCompleted) return { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" };
    const diff = new Date(dateStr).getTime() - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "text-red-600", bg: "bg-red-50 border-red-200" };
    if (days === 0) return { label: "Due Today!", color: "text-red-600", bg: "bg-red-50 border-red-200" };
    if (days === 1) return { label: "Due Tomorrow", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    if (days <= 7) return { label: `${days}d left`, color: "text-orange-500", bg: "bg-orange-50 border-orange-100" };
    return { label: `${days}d left`, color: "text-on-surface-variant", bg: "bg-surface-container-low border-transparent" };
  };

  const getTypeLabel = (type: string) => {
    return DEADLINE_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, " ");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "renewal": return "🔄";
      case "document_submission": return "📄";
      case "interview": return "🤝";
      case "application_deadline": return "📋";
      case "verification": return "✅";
      case "enrollment": return "🎓";
      case "appeal": return "⚖️";
      default: return "📌";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            Deadlines & Renewals
          </h1>
          <p className="text-sm text-on-surface-variant">
            Track important dates for your applications and program renewals
          </p>
        </div>
        <Button onClick={() => { setAddError(""); setShowAddModal(true); }}>
          <Plus className="w-4 h-4" />
          Add Deadline
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming", count: upcomingCount, color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
          { label: "Overdue", count: overdueCount, color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
          { label: "Completed", count: completedCount, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <Card key={label} padding="sm" hover>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold font-display ${color}`}>{count}</div>
                <div className="text-xs text-on-surface-variant">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "upcoming", "overdue", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all capitalize ${
              filterStatus === f
                ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
                : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f === "all" ? `All (${(deadlines || []).length})` : f === "upcoming" ? `Upcoming (${upcomingCount})` : f === "overdue" ? `Overdue (${overdueCount})` : `Completed (${completedCount})`}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-surface-container rounded-xl" />
          ))}
        </div>
      ) : filteredDeadlines.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Calendar className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="font-medium text-on-surface mb-1">No deadlines found</p>
          <p className="text-sm text-on-surface-variant mb-4">
            {filterStatus === "all"
              ? "Add deadlines to track your application renewals and important dates."
              : `No ${filterStatus} deadlines.`}
          </p>
          {filterStatus === "all" && (
            <Button onClick={() => setShowAddModal(true)} variant="secondary" size="sm">
              Add your first deadline
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDeadlines.map((deadline: any, i: number) => {
            const info = getDaysInfo(deadline.due_date, deadline.is_completed);
            const formattedDate = new Date(deadline.due_date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            return (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  padding="sm"
                  className={`border ${info.bg} transition-all`}
                  hover={!deadline.is_completed}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl shrink-0">{getTypeIcon(deadline.deadline_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-on-surface">
                          {deadline.application?.program?.name || "Program"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 border border-outline-variant/30 text-on-surface-variant">
                          {getTypeLabel(deadline.deadline_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs font-bold mr-1 ${info.color}`}>
                        {info.label}
                      </span>
                      {!deadline.is_completed && (
                        <button
                          onClick={() => completeMutation.mutate(deadline.id)}
                          disabled={completeMutation.isPending}
                          title="Mark as complete"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-on-surface-variant hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {deadline.is_completed && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(deadline.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete deadline"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Deadline Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-glass-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-on-surface">Add Deadline</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Track a renewal or submission date</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {addError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Application <span className="text-red-500">*</span>
                  </label>
                  {!applications || applications.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        You need at least one application to add a deadline.{" "}
                        <a href="/dashboard/benefits" className="underline font-semibold">
                          Browse programs →
                        </a>
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedAppId}
                      onChange={(e) => setSelectedAppId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                    >
                      <option value="">Select application...</option>
                      {applications.map((app: any) => (
                        <option key={app.id} value={app.id}>
                          {app.program?.name || "Application"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Deadline Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                  >
                    {DEADLINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="md"
                    className="flex-1"
                    loading={createMutation.isPending}
                    disabled={!selectedAppId || !dueDate}
                    onClick={() => createMutation.mutate()}
                  >
                    Add Deadline
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
