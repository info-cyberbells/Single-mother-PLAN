"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, slugToTitle } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
};

const PIE_COLORS = ["#4d41df", "#674bb5", "#914800", "#06d6a0", "#ef233c"];

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={delay}>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="font-display font-bold text-3xl text-white mb-1">{value}</div>
        <div className="text-sm text-slate-400 font-medium">{label}</div>
        {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get("/api/admin/analytics/overview").then((r) => r.data.data),
  });

  const { data: usersTimeseries } = useQuery({
    queryKey: ["admin-users-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/users").then((r) => r.data.data),
  });

  const { data: appsTimeseries } = useQuery({
    queryKey: ["admin-apps-timeseries"],
    queryFn: () => api.get("/api/admin/analytics/applications").then((r) => r.data.data),
  });

  const { data: programsAnalytics } = useQuery({
    queryKey: ["admin-programs-analytics"],
    queryFn: () => api.get("/api/admin/analytics/programs").then((r) => r.data.data),
  });

  const { data: applications } = useQuery({
    queryKey: ["admin-applications-review"],
    queryFn: () =>
      api.get("/api/admin/applications?status=under_review").then((r) => r.data.data.slice(0, 5)),
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => api.get("/api/admin/users?limit=5").then((r) => r.data.data),
  });

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: overview?.totalUsers?.toLocaleString() || "—",
      color: "bg-blue-900/50 text-blue-400",
    },
    {
      icon: ClipboardList,
      label: "Active Apps",
      value: overview?.totalApplications?.toLocaleString() || "—",
      color: "bg-primary-900/50 text-primary-400",
    },
    {
      icon: CheckCircle,
      label: "Approvals",
      value: overview?.verifiedDocuments?.toLocaleString() || "—",
      color: "bg-emerald-900/50 text-emerald-400",
    },
    {
      icon: Clock,
      label: "Pending Review",
      value: overview?.pendingReviews?.toLocaleString() || "—",
      color: "bg-amber-900/50 text-amber-400",
    },
    {
      icon: DollarSign,
      label: "Avg Benefits",
      value: "$8.4k",
      color: "bg-purple-900/50 text-purple-400",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-white mb-1">
          Admin Overview
        </h1>
        <p className="text-slate-400 text-sm">
          Real-time insights across your benefit ecosystem.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Users Growth Chart */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            User Growth & Engagement (30 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={usersTimeseries || []}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4d41df" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4d41df" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#4d41df"
                strokeWidth={2}
                fill="url(#userGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Programs Pie */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary-400" />
            Program Distribution
          </h3>
          {programsAnalytics && programsAnalytics.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={programsAnalytics}
                    dataKey="count"
                    nameKey="program_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {programsAnalytics.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {programsAnalytics.slice(0, 4).map((p: any, i: number) => (
                  <div key={p.program_type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{slugToTitle(p.program_type)}</span>
                    </div>
                    <span className="text-white font-medium">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
              No program data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Needs Review */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-semibold text-white">Needs Review</h3>
            {overview?.pendingReviews > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 text-xs font-bold">
                {overview.pendingReviews}
              </span>
            )}
          </div>
          {!applications || applications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              All applications reviewed!
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {app.user?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {app.user?.full_name}
                    </div>
                    <div className="text-xs text-slate-400">{app.program?.name}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Directory */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              User Directory
            </h3>
            <a href="/admin/users" className="text-xs text-primary-400 hover:text-primary-300">
              View all →
            </a>
          </div>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No users yet</div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{user.full_name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-white">System Health</span>
          <span className="text-sm text-emerald-400 font-bold ml-auto">99.9%</span>
          <span className="text-xs text-slate-400">Uptime (Last 24h)</span>
        </div>
      </div>
    </div>
  );
}
