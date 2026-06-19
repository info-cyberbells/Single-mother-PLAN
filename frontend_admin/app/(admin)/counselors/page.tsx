"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Mail, Phone, Star, Plus, Search, Filter,
  AlertTriangle, ArrowRight, CheckCircle2,
  TrendingUp, Clock, BarChart3, Check, RefreshCw
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { TopBar } from "@/components/layout/TopBar";
import { AddCounselorModal } from "@/components/admin/AddCounselorModal";
import { CounselorProfileModal } from "@/components/admin/CounselorProfileModal";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

// Initial mock caseworkers list matching client numbers (6 caseworkers, 34 cases, capacity limits)
const INITIAL_CASEWORKERS = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah@momplan.com",
    phone: "+1 555-0101",
    specialization: "WIC & SNAP",
    clients: 9,
    capacity: 8,
    rating: 4.9,
    active: true,
    completionRate: 95,
    responseTime: 12,
    programs: ["SNAP", "WIC"],
    alerts: { renewals: 2, docs: 1 }
  },
  {
    id: "2",
    name: "J. Walsh",
    email: "jwalsh@momplan.com",
    phone: "+1 555-0105",
    specialization: "SNAP & WIC (Part-time)",
    clients: 5,
    capacity: 4,
    rating: 4.5,
    active: true,
    completionRate: 88,
    responseTime: 18,
    programs: ["SNAP", "WIC"],
    alerts: { renewals: 1, docs: 1 }
  },
  {
    id: "3",
    name: "Jennifer Lee",
    email: "jen@momplan.com",
    phone: "+1 555-0103",
    specialization: "Housing Assistance",
    clients: 8,
    capacity: 8,
    rating: 4.8,
    active: true,
    completionRate: 90,
    responseTime: 16,
    programs: ["Section 8", "LIHEAP"],
    alerts: { renewals: 1, docs: 2 }
  },
  {
    id: "4",
    name: "Maria Rodriguez",
    email: "maria@momplan.com",
    phone: "+1 555-0102",
    specialization: "Medicaid",
    clients: 7,
    capacity: 8,
    rating: 4.7,
    active: true,
    completionRate: 92,
    responseTime: 15,
    programs: ["Medicaid"],
    alerts: { renewals: 1, docs: 0 }
  },
  {
    id: "5",
    name: "David Smith",
    email: "david@momplan.com",
    phone: "+1 555-0106",
    specialization: "TANF & Lifeline",
    clients: 3,
    capacity: 8,
    rating: 4.4,
    active: true,
    completionRate: 89,
    responseTime: 20,
    programs: ["TANF", "Lifeline"],
    alerts: { renewals: 0, docs: 0 }
  },
  {
    id: "6",
    name: "Amanda Foster",
    email: "amanda@momplan.com",
    phone: "+1 555-0104",
    specialization: "Child Care",
    clients: 2,
    capacity: 8,
    rating: 4.6,
    active: true,
    completionRate: 85,
    responseTime: 24,
    programs: ["CCDF"],
    alerts: { renewals: 0, docs: 1 }
  }
];

// Initial mock suggested transfers
const INITIAL_TRANSFERS = [
  {
    id: "t1",
    caseType: "SNAP",
    fromId: "1", // Sarah Johnson
    toId: "4",   // Maria Rodriguez
    fromName: "S. Johnson",
    toName: "M. Rodriguez",
    rationale: "Sarah is 1 case over capacity limit. Maria has 1 open SNAP slot.",
    applied: false
  },
  {
    id: "t2",
    caseType: "WIC",
    fromId: "2", // J. Walsh
    toId: "6",   // Amanda Foster
    fromName: "J. Walsh",
    toName: "A. Foster",
    rationale: "J. Walsh is part-time and overloaded. Amanda has 6 open slots.",
    applied: false
  },
  {
    id: "t3",
    caseType: "Section 8",
    fromId: "3", // Jennifer Lee
    toId: "5",   // David Smith
    fromName: "J. Lee",
    toName: "D. Smith",
    rationale: "Jennifer is at capacity. David has 5 open slots and covers Housing support.",
    applied: false
  }
];

export default function CounselorsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "profiles">("overview");
  const [caseworkers, setCaseworkers] = useState(INITIAL_CASEWORKERS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("capacity_used"); // default
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);

  // Helper to determine status based on caseload vs capacity
  const getCapacityStatus = (clients: number, capacity: number) => {
    const ratio = clients / capacity;
    if (ratio > 1.0) return { label: "Overloaded", color: "red", stripe: "border-l-4 border-l-rose-500", badge: "badge-red" };
    if (ratio >= 0.9) return { label: "At Risk", color: "yellow", stripe: "border-l-4 border-l-amber-500", badge: "badge-yellow" };
    return { label: "Healthy", color: "green", stripe: "border-l-4 border-l-emerald-500", badge: "badge-green" };
  };

  // Perform single rebalance transfer
  const handleApplyTransfer = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer || transfer.applied) return;

    setCaseworkers(prev => prev.map(worker => {
      if (worker.id === transfer.fromId) {
        return { ...worker, clients: Math.max(0, worker.clients - 1) };
      }
      if (worker.id === transfer.toId) {
        return { ...worker, clients: worker.clients + 1 };
      }
      return worker;
    }));

    setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, applied: true } : t));
  };

  // Apply all remaining active transfers
  const handleApplyAllTransfers = () => {
    const activeTransfers = transfers.filter(t => !t.applied);
    if (activeTransfers.length === 0) return;

    setCaseworkers(prev => {
      let updated = [...prev];
      activeTransfers.forEach(transfer => {
        updated = updated.map(worker => {
          if (worker.id === transfer.fromId) {
            return { ...worker, clients: Math.max(0, worker.clients - 1) };
          }
          if (worker.id === transfer.toId) {
            return { ...worker, clients: worker.clients + 1 };
          }
          return worker;
        });
      });
      return updated;
    });

    setTransfers(prev => prev.map(t => ({ ...t, applied: true })));
  };

  // Reset demo state
  const handleResetDemo = () => {
    setCaseworkers(INITIAL_CASEWORKERS);
    setTransfers(INITIAL_TRANSFERS);
  };

  // Add new counselor
  const handleAddCounselor = (counselor: any) => {
    const newWorker = {
      id: String(caseworkers.length + 1),
      name: counselor.name,
      email: counselor.email,
      phone: counselor.phone || "+1 555-0199",
      specialization: counselor.specialization || "Generalist",
      clients: 0,
      capacity: 8,
      rating: 5.0,
      active: true,
      completionRate: 90,
      responseTime: 24,
      programs: [counselor.specialization || "General"],
      alerts: { renewals: 0, docs: 0 }
    };
    setCaseworkers([newWorker, ...caseworkers]);
  };

  // Calculate Org Summary Strip metrics based on active caseworkers state
  const orgMetrics = useMemo(() => {
    const totalCases = caseworkers.reduce((sum, w) => sum + w.clients, 0);
    const totalCapacity = caseworkers.reduce((sum, w) => sum + w.capacity, 0);
    const capacityUsed = Math.round((totalCases / totalCapacity) * 100);
    
    const avgCompRate = Math.round(caseworkers.reduce((sum, w) => sum + w.completionRate, 0) / caseworkers.length);
    const avgRespTime = parseFloat((caseworkers.reduce((sum, w) => sum + w.responseTime, 0) / caseworkers.length).toFixed(1));
    
    // renewal alerts count
    const renewalsAtRisk = caseworkers.reduce((sum, w) => sum + w.alerts.renewals, 0);

    return {
      totalCases,
      avgCompRate,
      avgRespTime,
      renewalsAtRisk,
      capacityUsed
    };
  }, [caseworkers]);

  // Filter and Sort Caseworkers
  const filteredAndSortedWorkers = useMemo(() => {
    return caseworkers
      .filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              w.specialization.toLowerCase().includes(searchQuery.toLowerCase());
        const status = getCapacityStatus(w.clients, w.capacity).label.toLowerCase();
        const matchesStatus = statusFilter === "all" || status === statusFilter.replace("_", " ");
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "capacity_used") {
          return (b.clients / b.capacity) - (a.clients / a.capacity); // highest capacity ratio first
        }
        if (sortBy === "case_count") {
          return b.clients - a.clients;
        }
        if (sortBy === "completion_rate") {
          return b.completionRate - a.completionRate;
        }
        if (sortBy === "response_time") {
          return a.responseTime - b.responseTime; // lower response time is better
        }
        return 0;
      });
  }, [caseworkers, searchQuery, statusFilter, sortBy]);

  // Recharts Chart Data
  const chartData = useMemo(() => {
    return caseworkers.map(w => ({
      name: w.name.split(" ").slice(-1)[0], // last name only for readability
      caseload: w.clients,
      capacity: w.capacity
    }));
  }, [caseworkers]);

  const stats = [
    {
      label: "Total Active Cases",
      value: orgMetrics.totalCases,
      icon: Users,
      change: 8,
      changeLabel: "vs. last quarter",
      color: "brand" as const
    },
    {
      label: "Avg Completion Rate",
      value: `${orgMetrics.avgCompRate}%`,
      icon: CheckCircle2,
      change: 2,
      changeLabel: "vs. last quarter",
      color: "green" as const
    },
    {
      label: "Avg Response Time",
      value: `${orgMetrics.avgRespTime}h`,
      icon: Clock,
      change: -5,
      changeLabel: "vs. last quarter",
      color: "blue" as const
    },
    {
      label: "Renewals at Risk",
      value: orgMetrics.renewalsAtRisk,
      icon: AlertTriangle,
      color: "yellow" as const
    },
    {
      label: "Team Capacity Used",
      value: `${orgMetrics.capacityUsed}%`,
      icon: BarChart3,
      change: 4,
      changeLabel: "vs. last quarter",
      color: "purple" as const
    }
  ];

  return (
    <>
      <TopBar title="Caseworkers & Team Overview" subtitle="Monitor counselor workloads, balance caseloads, and track performance indicators." />
      
      {/* Navigation tabs & Action controls */}
      <div className="px-6 pt-4 border-b border-slate-800/40 flex flex-wrap items-center justify-between gap-4 bg-[#0a0c12]">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-brand-500 text-brand-400 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Team Overview
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "profiles"
                ? "border-brand-500 text-brand-400 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Counselor Profiles
          </button>
        </div>

        <div className="pb-3.5 flex items-center gap-3">
          <button onClick={handleResetDemo} className="btn-secondary text-xs py-2 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Reset State
          </button>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary text-xs py-2 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Caseworker
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Org Summary Strip */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="card p-4 flex flex-col gap-2 hover:border-slate-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 ${
                        stat.color === "brand" ? "text-brand-400" :
                        stat.color === "green" ? "text-emerald-400" :
                        stat.color === "blue" ? "text-blue-400" :
                        stat.color === "yellow" ? "text-amber-400" : "text-purple-400"
                      }`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      {stat.change !== undefined && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          stat.change > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                        }`}>
                          {stat.change > 0 ? "+" : ""}{stat.change}%
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Toolbar */}
              <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search caseworkers by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10 py-2 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="select py-2 text-xs w-36 bg-slate-900 border-slate-800"
                    >
                      <option value="all">All Capacity Status</option>
                      <option value="healthy">Healthy</option>
                      <option value="at_risk">At Risk</option>
                      <option value="overloaded">Overloaded</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="select py-2 text-xs w-44 bg-slate-900 border-slate-800"
                  >
                    <option value="capacity_used">Capacity Ratio (Default)</option>
                    <option value="case_count">Active Case Count</option>
                    <option value="completion_rate">Completion Rate</option>
                    <option value="response_time">Response Time</option>
                  </select>
                </div>
              </div>

              {/* Main Panel Content Split */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Columns - Caseworkers cards & capacity charts */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Caseworker Cards */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredAndSortedWorkers.map((w) => {
                      const status = getCapacityStatus(w.clients, w.capacity);
                      const capacityPct = Math.min(100, Math.round((w.clients / w.capacity) * 100));
                      
                      return (
                        <div
                          key={w.id}
                          className={`card bg-[#13161f] ${status.stripe} p-4 flex flex-col justify-between hover:border-slate-700/50 transition-all`}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-white leading-tight">{w.name}</h4>
                                <span className="text-[10px] text-slate-500 font-medium">{w.specialization}</span>
                              </div>
                              <span className={`badge ${status.badge} text-[9px] uppercase tracking-wider`}>
                                {status.label}
                              </span>
                            </div>

                            {/* Coverage Chips */}
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {w.programs.map(prog => (
                                <span key={prog} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {prog}
                                </span>
                              ))}
                            </div>

                            {/* Core Metrics Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/50 text-center">
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Cases</div>
                                <div className="text-sm font-bold text-white mt-0.5">{w.clients} / {w.capacity}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Comp.</div>
                                <div className="text-sm font-bold text-emerald-400 mt-0.5">{w.completionRate}%</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Response</div>
                                <div className="text-sm font-bold text-blue-400 mt-0.5">{w.responseTime}h</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {/* Capacity Used Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                                <span>Capacity Limit ({w.capacity})</span>
                                <span className={w.clients > w.capacity ? "text-rose-400 font-bold" : "text-slate-400"}>
                                  {capacityPct}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    status.color === "red" ? "bg-rose-500 shadow-glow-rose" :
                                    status.color === "yellow" ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${capacityPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Alerts & Warnings */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${w.alerts.renewals > 0 ? "bg-amber-400" : "bg-slate-600"}`} />
                                {w.alerts.renewals} renewals
                              </span>
                              <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${w.alerts.docs > 0 ? "bg-blue-400" : "bg-slate-600"}`} />
                                {w.alerts.docs} doc alerts
                              </span>
                              {w.clients > w.capacity && (
                                <span className="text-rose-400 font-bold text-[9px] flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  +{w.clients - w.capacity} case limit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Caseload vs Capacity Chart */}
                  <div className="card p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Caseload vs. Capacity Limits</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Dashed line represents caseworker capacity ceilings. Red bars are over capacity.</p>
                    </div>

                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#1e2130" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#475569" tick={{ fontSize: 10 }} width={25} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#151821",
                              borderRadius: "10px",
                              border: "1px solid #1e2130",
                              color: "#e2e8f0",
                              fontSize: 11
                            }}
                          />
                          <Bar
                            dataKey="caseload"
                            fill="#6d47fc"
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                          />
                          <Line
                            type="step"
                            dataKey="capacity"
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, stroke: "#ef4444", strokeWidth: 1, fill: "#151821" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right Column - Suggested Rebalancing Panel */}
                <div className="space-y-6">
                  <div className="card p-5 border-brand-500/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white">Suggested Rebalancing</h3>
                          <p className="text-xs text-slate-500 mt-0.5">AI-suggested case transfers to balance workload</p>
                        </div>
                        <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                          {transfers.filter(t => !t.applied).length} Actionable
                        </span>
                      </div>

                      {/* Transfers List */}
                      <div className="space-y-3.5 mb-6">
                        {transfers.map((t) => (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              t.applied
                                ? "bg-emerald-950/15 border-emerald-900/30 opacity-70"
                                : "bg-slate-900/40 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                                {t.caseType} case
                              </span>
                              {t.applied && (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                  Applied
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-1 text-xs mb-3">
                              <span className="font-semibold text-white truncate max-w-[90px]">{t.fromName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="font-semibold text-white truncate max-w-[90px]">{t.toName}</span>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                              {t.rationale}
                            </p>

                            {!t.applied && (
                              <button
                                onClick={() => handleApplyTransfer(t.id)}
                                className="w-full btn-secondary text-[11px] py-1.5 hover:bg-slate-800 transition-colors"
                              >
                                Apply Transfer
                              </button>
                            )}
                          </div>
                        ))}

                        {transfers.every(t => t.applied) && (
                          <div className="text-center py-6 text-slate-500 space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                            <div className="text-xs font-semibold text-white">Caseload Fully Rebalanced</div>
                            <div className="text-[10px]">No overloaded caseworkers remaining on team.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!transfers.every(t => t.applied) && (
                      <button
                        onClick={handleApplyAllTransfers}
                        className="w-full btn-primary text-xs py-2.5 font-bold"
                      >
                        Apply All Transfers
                      </button>
                    )}
                  </div>

                  {/* Performance Summary Banner */}
                  <div className="card p-5 bg-gradient-to-br from-brand-600/10 to-brand-900/5 border-brand-500/15">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0 text-brand-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Outcomes Dashboard Sync</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          This overview pairs with the <strong>Outcomes Dashboard</strong>. Case rebalancing decreases avg response times by up to 22% and reduces renewals at risk.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profiles-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {caseworkers.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card card-hover p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.specialization}</div>
                      </div>
                    </div>
                    <span className={`badge ${c.active ? "badge-green" : "badge-gray"} text-[10px]`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      {c.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      {c.phone}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{c.clients}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clients</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-lg font-bold text-white">{c.rating}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</div>
                    </div>
                    <button
                      onClick={() => setSelectedCounselor(c)}
                      className="btn-secondary text-xs py-1.5"
                    >
                      View Profile
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddCounselorModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onAdd={handleAddCounselor} 
      />
      <CounselorProfileModal 
        counselor={selectedCounselor} 
        isOpen={!!selectedCounselor} 
        onClose={() => setSelectedCounselor(null)} 
      />
    </>
  );
}
