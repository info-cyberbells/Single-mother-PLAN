"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Lock, Bell, Save } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const profileSchema = z.object({
  full_name: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: z.string().min(8, "Min 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.put("/api/user/profile", data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => api.put("/api/auth/password", data),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Profile
        </h1>
        <p className="text-sm text-on-surface-variant">Manage your account information</p>
      </div>

      {/* Avatar & Plan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8 p-6 bg-gradient-hero rounded-2xl border border-outline-variant/10"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-2xl shrink-0">
          {user?.full_name?.charAt(0) || "M"}
        </div>
        <div>
          <div className="font-display font-bold text-lg text-on-surface mb-1">{user?.full_name}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">{user?.email}</span>
            <PlanBadge plan={user?.plan || "free"} />
          </div>
        </div>
      </motion.div>

      {/* Profile Form */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            <CardTitle>Personal Information</CardTitle>
          </div>
        </CardHeader>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
            ✓ Profile updated successfully!
          </div>
        )}

        <form
          onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            error={profileForm.formState.errors.full_name?.message}
            {...profileForm.register("full_name")}
          />
          <Input
            label="Email Address"
            type="email"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            hint="Used for deadline SMS alerts"
            {...profileForm.register("phone")}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={profileMutation.isPending}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Password Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-500" />
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            ✓ Password changed successfully!
          </div>
        )}
        {passwordMutation.isError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {(passwordMutation.error as any)?.response?.data?.error?.message || "Password change failed"}
          </div>
        )}

        <form
          onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Current Password"
            type="password"
            error={passwordForm.formState.errors.current_password?.message}
            {...passwordForm.register("current_password")}
          />
          <Input
            label="New Password"
            type="password"
            error={passwordForm.formState.errors.new_password?.message}
            {...passwordForm.register("new_password")}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={passwordForm.formState.errors.confirm_password?.message}
            {...passwordForm.register("confirm_password")}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={passwordMutation.isPending}
          >
            <Lock className="w-4 h-4" />
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
