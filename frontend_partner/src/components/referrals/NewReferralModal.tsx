"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReferableCase {
  id: string;
  mother_name: string;
  service_type: string;
}
interface TargetOrg {
  id: string;
  name: string;
  category: string;
}

interface NewReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewReferralModal({ open, onOpenChange, onSuccess }: NewReferralModalProps) {
  const { toast } = useToast();
  const [caseId, setCaseId] = useState("");
  const [toOrgId, setToOrgId] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [notes, setNotes] = useState("");

  const { data: cases = [] } = useQuery({
    queryKey: ["referable-cases"],
    queryFn: async () => (await api.get("/api/partner/referrals/cases")).data.data as ReferableCase[],
    enabled: open,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["target-orgs", orgSearch],
    queryFn: async () =>
      (await api.get(`/api/partner/referrals/target-orgs`, { params: { search: orgSearch || undefined } }))
        .data.data as TargetOrg[],
    enabled: open,
  });

  const reset = () => {
    setCaseId("");
    setToOrgId("");
    setOrgSearch("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!caseId) throw new Error("Select a case to refer");
      if (!toOrgId) throw new Error("Select a partner organization");
      return (await api.post("/api/partner/referrals", { case_id: caseId, to_org_id: toOrgId, notes }))
        .data.data;
    },
    onSuccess: () => {
      toast({ title: "Referral sent", description: "The partner organization has been notified.", variant: "success" });
      reset();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Could not send referral", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New referral</DialogTitle>
          <DialogDescription>
            Refer one of your cases to a partner organization in the network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Case */}
          <div className="space-y-2">
            <Label>Case</Label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger>
                <SelectValue placeholder={cases.length ? "Select a case…" : "No cases available"} />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.mother_name} · {c.service_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target org */}
          <div className="space-y-2">
            <Label>Refer to organization</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
              <Input
                placeholder="Search organizations…"
                className="pl-9 h-9"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
              />
            </div>
            <Select value={toOrgId} onValueChange={setToOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a partner org…" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                    {o.category ? ` · ${o.category}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="ref-notes">Notes (optional)</Label>
            <Textarea
              id="ref-notes"
              rows={3}
              placeholder="Reason for referral, urgency, context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
                Sending…
              </>
            ) : (
              "Send referral"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
