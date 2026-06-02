"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  ExternalLink,
  X,
  Save,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { slugToTitle } from "@/lib/utils";

const PROGRAM_TYPES = [
  { value: "cash", label: "Cash Assistance / TANF" },
  { value: "food", label: "SNAP / WIC / Food Support" },
  { value: "healthcare", label: "Medicaid / CHIP / Healthcare" },
  { value: "housing", label: "Section 8 / LIHEAP / Housing" },
  { value: "childcare", label: "Childcare Subsidies" },
  { value: "employment", label: "Employment & Job Training" },
  { value: "education", label: "Education Grants / FAFSA" },
  { value: "other", label: "Other Benefits" },
];

export default function ProgramsPage() {
  const queryClient = useQueryClient();
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state variables
  const [name, setName] = useState("");
  const [agency, setAgency] = useState("");
  const [programType, setProgramType] = useState("cash");
  const [federalOrState, setFederalOrState] = useState("federal");
  const [stateCode, setStateCode] = useState("");
  const [description, setDescription] = useState("");
  const [valMin, setValMin] = useState<number | "">("");
  const [valMax, setValMax] = useState<number | "">("");
  const [appUrl, setAppUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [criteria, setCriteria] = useState("{}");

  const [formError, setFormError] = useState("");

  const { data: programs, isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => api.get("/api/programs").then((r) => r.data.data || r.data),
  });

  const openAdd = () => {
    setEditingProgram(null);
    setName("");
    setAgency("");
    setProgramType("cash");
    setFederalOrState("federal");
    setStateCode("");
    setDescription("");
    setValMin("");
    setValMax("");
    setAppUrl("");
    setEmail("");
    setIsActive(true);
    setDueDate("");
    setCriteria(JSON.stringify({ age: "any", citizenship: "required", income: "fpl_pct" }, null, 2));
    setFormError("");
    setShowDrawer(true);
  };

  const openEdit = (program: any) => {
    setEditingProgram(program);
    setName(program.name || "");
    setAgency(program.agency || "");
    setProgramType(program.program_type || "cash");
    setFederalOrState(program.federal_or_state || "federal");
    setStateCode(program.state_code || "");
    setDescription(program.description || "");
    setValMin(program.estimated_monthly_value_min ?? "");
    setValMax(program.estimated_monthly_value_max ?? "");
    setAppUrl(program.application_url || "");
    setEmail(program.contact_email || "");
    setIsActive(program.is_active ?? true);
    
    // Format program_due_date safely for <input type="date">
    if (program.program_due_date) {
      const d = new Date(program.program_due_date);
      if (!isNaN(d.getTime())) {
        setDueDate(d.toISOString().split("T")[0]);
      } else {
        setDueDate("");
      }
    } else {
      setDueDate("");
    }

    setCriteria(
      program.eligibility_criteria
        ? JSON.stringify(program.eligibility_criteria, null, 2)
        : "{}"
    );
    setFormError("");
    setShowDrawer(true);
  };

  const createMutation = useMutation({
    mutationFn: (newProgram: any) => api.post("/api/programs", newProgram),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      setShowDrawer(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to create program");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/programs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      setShowDrawer(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to update program");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      setShowDeleteConfirm(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate Criteria JSON
    let parsedCriteria = {};
    try {
      parsedCriteria = JSON.parse(criteria);
    } catch (err) {
      setFormError("Eligibility criteria must be a valid JSON object");
      return;
    }

    if (!name.trim()) return setFormError("Program name is required");
    if (!agency.trim()) return setFormError("Agency name is required");
    if (!description.trim()) return setFormError("Description is required");

    const payload = {
      name,
      agency,
      program_type: programType,
      federal_or_state: federalOrState,
      state_code: federalOrState === "state" && stateCode.trim() ? stateCode.trim().toUpperCase() : null,
      description,
      estimated_monthly_value_min: Number(valMin) || 0,
      estimated_monthly_value_max: Number(valMax) || 0,
      application_url: appUrl.trim() || null,
      contact_email: email.trim() || null,
      is_active: isActive,
      program_due_date: dueDate || null,
      eligibility_criteria: parsedCriteria,
    };

    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <>
      <TopBar title="Benefit Programs" subtitle="Manage all government benefit programs" />
      <main className="flex-1 p-6 space-y-5 min-h-0 relative">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {(programs || []).length} programs in database
          </p>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Program
          </button>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-5/6" />
                </div>
              ))
            : (programs || []).map((program: any, i: number) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openEdit(program)}
                  className="card card-hover p-5 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        {!program.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            Inactive
                          </span>
                        )}
                        <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 leading-snug group-hover:text-brand-300 transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{program.description}</p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="badge badge-purple text-[10px]">{slugToTitle(program.program_type)}</span>
                      {program.agency && (
                        <span className="badge badge-gray text-[10px]">{program.agency}</span>
                      )}
                      {program.state_code && (
                        <span className="badge badge-blue text-[10px]">{program.state_code}</span>
                      )}
                    </div>

                    {program.program_due_date && (
                      <div className="pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        <span>Due Date:</span>
                        <span className="font-semibold text-white">
                          {new Date(program.program_due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
        </div>
      </main>

      {/* Side Drawer for Add/Edit Program */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg h-full bg-[#11131a] border-l border-slate-800/80 shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                    {editingProgram ? "Edit Program" : "Add Benefit Program"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {editingProgram ? "Update existing program information and criteria" : "Define a new benefit program in the database"}
                  </p>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Program Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      placeholder="e.g. Supplemental Nutrition Assistance Program (SNAP)"
                      required
                    />
                  </div>

                  {/* Agency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Administering Agency <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      className="input"
                      placeholder="e.g. USDA Food and Nutrition Service"
                      required
                    />
                  </div>

                  {/* Program Type & federal_or_state */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Program Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={programType}
                        onChange={(e) => setProgramType(e.target.value)}
                        className="select"
                      >
                        {PROGRAM_TYPES.map((t) => (
                          <option key={t.value} value={t.value} className="bg-slate-900">
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Scope <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={federalOrState}
                        onChange={(e) => setFederalOrState(e.target.value)}
                        className="select"
                      >
                        <option value="federal" className="bg-slate-900">Federal</option>
                        <option value="state" className="bg-slate-900">State Specific</option>
                      </select>
                    </div>
                  </div>

                  {/* State Code - conditionally shown */}
                  {federalOrState === "state" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        State Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="input font-mono uppercase"
                        placeholder="e.g. NY"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input min-h-[90px] resize-y"
                      placeholder="Enter a brief description of the benefits and value of the program..."
                      required
                    />
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Est. Min Monthly Value ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={valMin}
                        onChange={(e) => setValMin(e.target.value === "" ? "" : Number(e.target.value))}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Est. Max Monthly Value ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={valMax}
                        onChange={(e) => setValMax(e.target.value === "" ? "" : Number(e.target.value))}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Application URL & Contact Email */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Application URL
                      </label>
                      <input
                        type="url"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        placeholder="support@agency.gov"
                      />
                    </div>
                  </div>

                  {/* Program Due Date (THE NEW SYNCHRONIZED SCHEMA FIELD) */}
                  <div className="space-y-1.5 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                    <label className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Program Due / Application Deadline Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Optionally specify a global calendar deadline date for this benefit program.
                    </p>
                  </div>

                  {/* Eligibility Criteria (JSON Editor) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Eligibility Criteria (JSON)</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                    </label>
                    <textarea
                      value={criteria}
                      onChange={(e) => setCriteria(e.target.value)}
                      className="input font-mono text-xs min-h-[120px] resize-y bg-slate-950 border-slate-800"
                      placeholder='{"age": "any"}'
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div>
                      <div className="text-xs font-semibold text-white">Active Status</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Toggle program visibility in user searches</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-800 flex gap-3">
                  {editingProgram && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(editingProgram.id)}
                      className="btn-danger p-2.5 rounded-xl flex items-center justify-center"
                      title="Delete program"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary flex-1 justify-center"
                  >
                    <Save className="w-4 h-4" />
                    {editingProgram ? "Save Changes" : "Create Program"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#151821] border border-slate-800 rounded-2xl p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-center font-bold text-white text-base mb-2">Delete Benefit Program</h3>
              <p className="text-center text-xs text-slate-500 leading-relaxed mb-6">
                Are you sure you want to delete this benefit program? This action is permanent and will remove it from all user eligibility lists.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn-secondary flex-1 justify-center text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(showDeleteConfirm);
                    setShowDrawer(false);
                  }}
                  disabled={deleteMutation.isPending}
                  className="btn-danger flex-1 justify-center text-xs py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
