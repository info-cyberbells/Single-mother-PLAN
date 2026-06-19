"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { usePartnerAuthStore } from "@/store/auth.store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth, user } = usePartnerAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await api.post("/api/partner/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      const { user: updatedUser, accessToken, organization } = res.data.data;
      setAuth(updatedUser, accessToken, organization);
      toast({ title: "Password updated", description: "You can now access the portal.", variant: "success" });
      router.replace("/dashboard");
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: "Check your current password and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-partner-xl border-surface-border">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-partner flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          {user?.full_name ? `Welcome, ${user.full_name.split(" ")[0]}. ` : ""}
          You must change your password before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
              <Input
                id="current_password"
                type="password"
                className="pl-9"
                {...form.register("current_password")}
              />
            </div>
            {form.formState.errors.current_password && (
              <p className="text-xs text-status-error">{form.formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
              <Input
                id="new_password"
                type="password"
                className="pl-9"
                {...form.register("new_password")}
              />
            </div>
            {form.formState.errors.new_password && (
              <p className="text-xs text-status-error">{form.formState.errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
              <Input
                id="confirm_password"
                type="password"
                className="pl-9"
                {...form.register("confirm_password")}
              />
            </div>
            {form.formState.errors.confirm_password && (
              <p className="text-xs text-status-error">{form.formState.errors.confirm_password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
