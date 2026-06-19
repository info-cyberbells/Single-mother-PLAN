"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Star, ShieldCheck, MapPin, Activity, Users } from "lucide-react";

interface CounselorProfileModalProps {
  counselor: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CounselorProfileModal({ counselor, isOpen, onClose }: CounselorProfileModalProps) {
  if (!isOpen || !counselor) return null;

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
          className="relative w-full max-w-2xl bg-[#0f1117] rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-brand-600 to-indigo-600 relative shrink-0 rounded-t-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Header Overlap — sits outside scroll, avatar overlaps banner */}
          <div className="px-8 shrink-0" style={{ marginTop: "-48px" }}>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-[#0f1117] shadow-xl flex items-center justify-center text-4xl font-bold text-white shrink-0 relative z-10">
                {counselor.name.charAt(0)}
              </div>

              {/* Basic Info */}
              <div className="pt-2 sm:pt-14 flex-1 w-full">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      {counselor.name}
                    </h2>
                    <div className="text-brand-400 font-medium text-sm">
                      {counselor.specialization}
                    </div>
                  </div>
                  <span className={`badge ${counselor.active ? "badge-green" : "badge-gray"}`}>
                    {counselor.active ? "Active Counselor" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable details below */}
          <div className="px-8 pb-8 pt-6 flex-1 overflow-y-auto">
            {/* Contact Details */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400 mb-6 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                {counselor.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                {counselor.phone}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                New York, NY
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Total Clients
                </div>
                <div className="text-2xl font-bold text-white">{counselor.clients}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Avg Rating
                </div>
                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                  {counselor.rating} <span className="text-sm font-normal text-slate-500">/ 5.0</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Success Rate
                </div>
                <div className="text-2xl font-bold text-emerald-400">94%</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Response Time
                </div>
                <div className="text-xl font-bold text-white mt-1">&lt; 4 hrs</div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">About</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {counselor.name} has been working with single mothers for over 5 years, specializing in helping families navigate the complex requirements of {counselor.specialization}. They have successfully guided over {counselor.clients * 3} families to secure benefits.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
