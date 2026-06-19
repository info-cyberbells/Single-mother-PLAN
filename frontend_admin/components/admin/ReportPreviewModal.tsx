"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Download } from "lucide-react";

interface ReportPreviewModalProps {
  report: any | null;
  isOpen: boolean;
  onClose: () => void;
  onExport: (report: any) => void;
}

export function ReportPreviewModal({ report, isOpen, onClose, onExport }: ReportPreviewModalProps) {
  if (!isOpen || !report) return null;

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
          className="relative w-full max-w-3xl bg-[#0f1117] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
                <report.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{report.title}</h2>
                <p className="text-xs text-slate-400">Preview Data Snapshot</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Mock Chart Area */}
            <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-slate-500">
              <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Visualization for {report.title}</p>
              <p className="text-xs mt-1">Data from last 30 days</p>
            </div>

            {/* Mock Data Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Key Metrics</h3>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900/50 text-xs uppercase text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Metric</th>
                      <th className="px-4 py-3 font-semibold">Value</th>
                      <th className="px-4 py-3 font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 text-slate-300">Metric Sample {i}</td>
                        <td className="px-4 py-3 text-white font-medium">{(Math.random() * 1000).toFixed(0)}</td>
                        <td className="px-4 py-3 text-emerald-400">+{(Math.random() * 15).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary">
              Close Preview
            </button>
            <button onClick={() => { onExport(report); onClose(); }} className="btn-primary gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
