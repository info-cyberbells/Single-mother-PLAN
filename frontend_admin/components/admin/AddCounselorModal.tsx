"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Loader2 } from "lucide-react";

interface AddCounselorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (counselor: any) => void;
}

export function AddCounselorModal({ isOpen, onClose, onAdd }: AddCounselorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    await new Promise((res) => setTimeout(res, 800));
    onAdd({
      id: Math.random().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      clients: 0,
      rating: 0,
      active: true,
    });
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0f1117] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2 text-white font-bold">
              <UserPlus className="w-5 h-5 text-brand-400" />
              Add New Counselor
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Full Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Sarah Johnson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Email Address</label>
              <input
                required
                type="email"
                placeholder="sarah@momplan.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Phone Number</label>
              <input
                required
                type="text"
                placeholder="+1 555-0101"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Specialization</label>
              <input
                required
                type="text"
                placeholder="e.g. WIC & SNAP"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Counselor"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
