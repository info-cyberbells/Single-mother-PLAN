"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, TrendingUp, Users, ClipboardList, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ReportPreviewModal } from "@/components/admin/ReportPreviewModal";

const REPORT_TYPES = [
  {
    id: "user-growth",
    title: "User Growth Report",
    description: "Monthly/weekly new user registrations, cohort analysis, and retention metrics.",
    icon: Users,
    color: "brand" as const,
    tags: ["Users", "Growth", "Retention"],
  },
  {
    id: "application-outcomes",
    title: "Application Outcomes",
    description: "Approval rates, rejection reasons, average processing times by program.",
    icon: ClipboardList,
    color: "blue" as const,
    tags: ["Applications", "Outcomes"],
  },
  {
    id: "benefit-distribution",
    title: "Benefit Distribution",
    description: "Which programs are most applied to, approval rates per program, state breakdown.",
    icon: TrendingUp,
    color: "green" as const,
    tags: ["Benefits", "Programs", "States"],
  },
  {
    id: "monthly-summary",
    title: "Monthly Executive Summary",
    description: "High-level overview of platform KPIs, user growth, and application volumes.",
    icon: Calendar,
    color: "yellow" as const,
    tags: ["Executive", "Monthly"],
  },
];

const colorMap = {
  brand: "bg-brand-500/15 text-brand-400",
  blue: "bg-blue-500/15 text-blue-400",
  green: "bg-emerald-500/15 text-emerald-400",
  yellow: "bg-amber-500/15 text-amber-400",
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const exportCSV = (report: any) => {
    const csvContent = "Metric,Value\nSample 1,100\nSample 2,200\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${report.id}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReport = async () => {
    setGenerating(true);
    await new Promise(res => setTimeout(res, 1200));
    exportCSV({ id: "custom_report" });
    setGenerating(false);
  };

  return (
    <>
      <TopBar title="Reports" subtitle="Generate and export operational reports" />
      <main className="flex-1 p-6 space-y-6 min-h-0">
        <div className="grid sm:grid-cols-2 gap-5">
          {REPORT_TYPES.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card card-hover p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[report.color]}`}>
                  <report.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1.5">{report.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{report.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {report.tags.map((tag) => (
                      <span key={tag} className="badge badge-gray text-[10px]">{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedReport(report)} className="btn-secondary text-xs py-2 gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button onClick={() => exportCSV(report)} className="btn-primary text-xs py-2 gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Report Builder */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-base font-bold text-white mb-2">Custom Report Builder</h3>
          <p className="text-sm text-slate-500 mb-5">
            Select a date range and metrics to build a custom report.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">From</label>
              <input type="date" className="input" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To</label>
              <input type="date" className="input" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metric</label>
              <select className="select">
                <option>User Registrations</option>
                <option>Application Submissions</option>
                <option>Approval Rate</option>
                <option>Active Subscriptions</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={generateReport} disabled={generating} className="btn-primary">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <ReportPreviewModal 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)}
        onExport={exportCSV}
      />
    </>
  );
}
