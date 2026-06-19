"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Filter, UserCheck, UserX, Flag, MoreHorizontal,
  Download, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge, PlanBadge, RoleBadge } from "@/components/ui/Badge";
import { formatDate, getInitials } from "@/lib/utils";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, status, role],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search && { search }),
        ...(status && { status }),
        ...(role && { role }),
      });
      return api.get(`/api/admin/users?${params}`).then((r) => r.data);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.put(`/api/admin/users/${userId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.data || [];
  const meta = data?.meta;

  const exportToCSV = () => {
    if (!users || users.length === 0) return;
    const headers = ["ID", "Name", "Email", "Role", "Plan", "Status", "Joined"];
    const csvContent = [
      headers.join(","),
      ...users.map((u: any) => [
        u.id, 
        `"${u.full_name}"`, 
        `"${u.email}"`, 
        u.role, 
        u.plan, 
        u.status, 
        `"${formatDate(u.created_at)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <TopBar title="User Management" subtitle={`${meta?.total?.toLocaleString() ?? "—"} total registered users`} />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="user-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="select w-40"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="flagged">Flagged</option>
          </select>

          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="select w-36"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="counselor">Counselor</option>
          </select>

          <button onClick={exportToCSV} className="btn-secondary gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="skeleton w-9 h-9 rounded-lg" />
                            <div className="space-y-1.5">
                              <div className="skeleton h-3.5 w-28" />
                              <div className="skeleton h-3 w-40" />
                            </div>
                          </div>
                        </td>
                        <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                        <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                        <td><div className="skeleton h-5 w-20 rounded-full" /></td>
                        <td><div className="skeleton h-3.5 w-24" /></td>
                        <td><div className="skeleton h-7 w-24 rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  : users.map((user: any) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center text-sm font-bold shrink-0">
                              {getInitials(user.full_name)}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{user.full_name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge role={user.role} /></td>
                        <td><PlanBadge plan={user.plan} /></td>
                        <td><StatusBadge status={user.status} /></td>
                        <td className="text-slate-500 text-xs">{formatDate(user.created_at)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: "active" })}
                              title="Activate"
                              className="w-8 h-8 rounded-lg hover:bg-emerald-500/15 text-slate-500 hover:text-emerald-400 flex items-center justify-center transition-colors"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: "flagged" })}
                              title="Flag"
                              className="w-8 h-8 rounded-lg hover:bg-amber-500/15 text-slate-500 hover:text-amber-400 flex items-center justify-center transition-colors"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ userId: user.id, status: "inactive" })}
                              title="Deactivate"
                              className="w-8 h-8 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
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
          {meta && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/60">
              <span className="text-xs text-slate-500">
                Showing{" "}
                <span className="text-slate-300 font-semibold">
                  {((page - 1) * 15) + 1}–{Math.min(page * 15, meta.total)}
                </span>{" "}
                of <span className="text-slate-300 font-semibold">{meta.total?.toLocaleString()}</span> users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 px-2">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
