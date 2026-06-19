"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { generatePassword, parseEmailList } from "@/lib/auth-utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BulkCreateMembersResult } from "@/types";

interface AddTeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTeamMembersModal({ open, onOpenChange, onSuccess }: AddTeamMembersModalProps) {
  const { toast } = useToast();
  const [emailsText, setEmailsText] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const emails = parseEmailList(emailsText);
      if (emails.length === 0) {
        throw new Error("Enter at least one valid email");
      }
      if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      const res = await api.post("/api/team/members/bulk-create", { emails, password });
      return res.data.data as BulkCreateMembersResult;
    },
    onSuccess: (result) => {
      const createdCount = result.created.length;
      const failedCount = result.failed.length;

      if (createdCount > 0) {
        toast({
          title: `${createdCount} team member${createdCount === 1 ? "" : "s"} added`,
          description:
            failedCount > 0
              ? `${failedCount} email${failedCount === 1 ? "" : "s"} could not be added.`
              : "New members must change their password on first login.",
          variant: "success",
        });
        onSuccess();
        setEmailsText("");
        setPassword("");
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "No members were added",
          description: result.failed[0]?.reason ?? "Check the email addresses and try again.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to add members",
        description: error.message,
      });
    },
  });

  const handleGeneratePassword = () => {
    setPassword(generatePassword());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add team members</DialogTitle>
          <DialogDescription>
            Enter one or more email addresses. All new members will be caseworkers and share the
            password you set below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="emails">Email addresses</Label>
            <Textarea
              id="emails"
              placeholder={"user1@test.com\nuser2@test.com\nuser3@test.com"}
              rows={5}
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
            />
            <p className="text-xs text-text-soft">
              Separate emails with new lines or commas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleGeneratePassword} className="shrink-0 gap-1.5">
                <Shuffle className="w-3.5 h-3.5" />
                Generate
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-1.5">
            {mutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Adding…
              </>
            ) : (
              "Add members"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
