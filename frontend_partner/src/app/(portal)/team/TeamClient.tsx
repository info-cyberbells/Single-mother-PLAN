"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  UserPlus,
  MoreHorizontal,
  KeyRound,
  UserX,
  Trash2,
  Users,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api";
import { usePartnerAuthStore } from "@/store/auth.store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, pluralize } from "@/lib/utils";
import { AddTeamMembersModal } from "@/components/team/AddTeamMembersModal";
import type { TeamMember } from "@/types";

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await api.get("/api/team/members");
  return res.data.data ?? [];
}

function roleLabel(role: TeamMember["role"]) {
  return role === "admin" ? "Admin" : "Caseworker";
}

function roleBadgeClass(role: TeamMember["role"]) {
  return role === "admin"
    ? "bg-partner-100 text-partner-700"
    : "bg-secondary-100 text-secondary-700";
}

export function TeamClient() {
  const { user } = usePartnerAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeamMembers,
    staleTime: 30 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team-members"] });

  const resetPassword = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/team/members/${id}/reset-password`);
      return res.data.data as { temporary_password: string };
    },
    onSuccess: (data) => {
      const temporaryPassword = data.temporary_password;
      toast({
        title: "Password reset",
        description: "Copy the temporary password to share with the team member.",
        action: (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(temporaryPassword);
                toast({
                  title: "Copied",
                  description: "Temporary password copied to clipboard.",
                  variant: "success",
                });
              } catch {
                toast({
                  title: "Copy failed",
                  description: "Unable to copy the password. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        ),
        variant: "success",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to reset password" });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await api.patch(`/api/team/members/${id}/status`, { is_active });
      return res.data.data as TeamMember;
    },
    onSuccess: (member) => {
      invalidate();
      toast({
        title: member.is_active ? "Member activated" : "Member deactivated",
        variant: "success",
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? "Failed to update member status";
      toast({ variant: "destructive", title: message });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/team/members/${id}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Team member removed", variant: "success" });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? "Failed to delete team member";
      toast({ variant: "destructive", title: message });
    },
  });

  return (
    <div className="flex-1 p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          {!isLoading && (
            <p className="text-sm text-text-soft">
              {pluralize(members.length, "team member")} in your organization
            </p>
          )}
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-1.5">
          <UserPlus className="w-4 h-4" />
          Add members
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-surface-border bg-white">
          <div className="w-14 h-14 rounded-2xl bg-partner-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-partner-500" />
          </div>
          <h3 className="text-lg font-bold text-text-dark mb-1">No team members yet</h3>
          <p className="text-sm text-text-soft mb-6 max-w-sm mx-auto">
            Add caseworkers to your organization so they can manage cases and support mothers.
          </p>
          <Button onClick={() => setAddModalOpen(true)} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            Add your first member
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-primary-subtle/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-text-mid">Name</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-mid">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-mid">Role</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-mid">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-mid">Created</th>
                  <th className="px-5 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {members.map((member, i) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-surface-border last:border-0 hover:bg-primary-subtle/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-text-dark">{member.full_name}</td>
                    <td className="px-5 py-4 text-text-mid">{member.email}</td>
                    <td className="px-5 py-4">
                      <Badge className={roleBadgeClass(member.role)}>{roleLabel(member.role)}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        className={
                          member.is_active
                            ? "bg-status-success-bg text-status-success"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-text-soft">{formatDate(member.created_at)}</td>
                    <td className="px-5 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => resetPassword.mutate(member.id)}
                            className="gap-2"
                          >
                            <KeyRound className="w-4 h-4" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleStatus.mutate({
                                id: member.id,
                                is_active: !member.is_active,
                              })
                            }
                            disabled={member.id === user?.id}
                            className="gap-2"
                          >
                            <UserX className="w-4 h-4" />
                            {member.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteMember.mutate(member.id)}
                            disabled={member.id === user?.id}
                            className="gap-2 text-status-error focus:text-status-error"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddTeamMembersModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={invalidate}
      />
    </div>
  );
}
