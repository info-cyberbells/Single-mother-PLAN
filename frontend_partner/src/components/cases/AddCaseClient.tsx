"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currentQuarter } from "@/components/cases/QuarterTabs";
import type { CaseDetail, CaseFilterOptions } from "@/types";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  program_id: z.string().min(1, "Program is required"),
  caseworker_id: z.string().optional(),
  intake_date: z.string().optional(),
  quarter: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

async function fetchFilters(): Promise<CaseFilterOptions> {
  const res = await api.get("/api/partner/cases/filters");
  return res.data.data;
}

export function AddCaseClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [quarter] = useState(currentQuarter());

  const { data: filters, isLoading: filtersLoading } = useQuery({
    queryKey: ["partner-case-filters"],
    queryFn: fetchFilters,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quarter,
      intake_date: new Date().toISOString().slice(0, 10),
    },
  });

  const createCase = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await api.post("/api/partner/cases", values);
      return res.data.data as CaseDetail;
    },
    onSuccess: (data) => {
      toast({ title: "Case created", description: `${data.mother_name} has been added.` });
      router.push(`/cases/${data.id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast({
        title: "Could not create case",
        description: err.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const programId = watch("program_id");
  const caseworkerId = watch("caseworker_id");

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-primary text-white px-8 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10 mb-4"
          asChild
        >
          <Link href="/cases">
            <ArrowLeft className="w-4 h-4" /> Back to cases
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Add New Case</h1>
            <p className="text-white/60 text-sm mt-0.5">
              Open a new case for a mother in your organization&apos;s caseload
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 bg-surface">
        <form
          onSubmit={handleSubmit((values) => createCase.mutate(values))}
          className="max-w-3xl mx-auto space-y-8"
        >
          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-soft">
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name *</Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-xs text-status-error">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name *</Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-xs text-status-error">{errors.last_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-status-error">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" type="date" {...register("dob")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-surface-border shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-soft">
              Case Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Program *</Label>
                <Select
                  value={programId ?? ""}
                  onValueChange={(v) => setValue("program_id", v, { shouldValidate: true })}
                  disabled={filtersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters?.programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.program_id && (
                  <p className="text-xs text-status-error">{errors.program_id.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Caseworker</Label>
                <Select
                  value={caseworkerId ?? "default"}
                  onValueChange={(v) =>
                    setValue("caseworker_id", v === "default" ? undefined : v)
                  }
                  disabled={filtersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to me" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Assign to me</SelectItem>
                    {filters?.caseworkers.map((cw) => (
                      <SelectItem key={cw.id} value={cw.id}>
                        {cw.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake_date">Intake date</Label>
                <Input id="intake_date" type="date" {...register("intake_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quarter">Quarter</Label>
                <Select
                  value={watch("quarter") ?? quarter}
                  onValueChange={(v) => setValue("quarter", v)}
                >
                  <SelectTrigger id="quarter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Optional intake notes…"
                  {...register("notes")}
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/cases">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending ? "Creating…" : "Create case"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
