"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, MoreVertical, UserCheck, UserX, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge, PlanBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, status],
    queryFn: () =>
      api
        .get(`/api/admin/users?page=${page}&limit=10${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`)
        .then((r) => r.data),
  });

  const updateStatus = async (userId: string, newStatus: string) => {
    await api.put(`/api/admin/users/${userId}/status`, { status: newStatus });
    refetch();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-white mb-1">User Directory</h1>
        <p className="text-slate-400 text-sm">
          Showing {data?.meta?.total?.toLocaleString() || "..."} total registered users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-3/4" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                : (data?.data || []).map((user: any) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user.full_name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PlanBadge plan={user.plan} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => updateStatus(user.id, "active")}
                            className="p-1.5 rounded-lg hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(user.id, "flagged")}
                            className="p-1.5 rounded-lg hover:bg-amber-900/30 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Flag"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(user.id, "inactive")}
                            className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <span className="text-sm text-slate-400">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total?.toLocaleString()} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page >= data.meta.totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
