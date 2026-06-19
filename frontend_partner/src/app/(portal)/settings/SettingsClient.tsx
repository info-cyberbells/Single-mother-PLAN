"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Building2, Bell, Shield, Save, Check, CreditCard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePartnerAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BillingSettings } from "@/components/billing/BillingSettings";
import { initials } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  title: z.string().optional(),
});

const orgSchema = z.object({
  name: z.string().min(2),
  website: z.string().url().or(z.literal("")),
  description: z.string().max(1000).optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal("")),
});

type ProfileData = z.infer<typeof profileSchema>;
type OrgData = z.infer<typeof orgSchema>;

function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SettingsClient() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "billing" ? "billing" : "profile";
  const { user, organization, updateUser } = usePartnerAuthStore();
  const { toast } = useToast();
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedOrg, setSavedOrg] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      title: user?.title ?? "",
    },
  });

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? "",
      website: organization?.website ?? "",
      description: organization?.description ?? "",
      phone: organization?.phone ?? "",
      email: organization?.email ?? "",
    },
  });

  const saveProfile = async (data: ProfileData) => {
    try {
      await api.patch("/api/partner/profile", data);
      updateUser(data);
      setSavedProfile(true);
      toast({ title: "Profile updated", variant: "success" });
      setTimeout(() => setSavedProfile(false), 3000);
    } catch {
      toast({ variant: "destructive", title: "Failed to save profile" });
    }
  };

  const saveOrg = async (data: OrgData) => {
    try {
      await api.patch(`/api/partner/organizations/${organization?.id}`, data);
      setSavedOrg(true);
      toast({ title: "Organization updated", variant: "success" });
      setTimeout(() => setSavedOrg(false), 3000);
    } catch {
      toast({ variant: "destructive", title: "Failed to save organization" });
    }
  };

  const tabs = [
    { value: "profile", label: "Profile", icon: User },
    { value: "organization", label: "Organization", icon: Building2 },
    { value: "billing", label: "Billing", icon: CreditCard },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="flex-1 p-8">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-8">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <div className="max-w-2xl space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <SettingSection title="Profile Information" description="Update your personal account details">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-border">
                  <Avatar className="w-16 h-16 ring-4 ring-partner-200">
                    <AvatarImage src={user?.avatar_url ?? ""} />
                    <AvatarFallback className="text-lg">{initials(user?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-text-dark">{user?.full_name}</p>
                    <p className="text-sm text-text-soft">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                      Change photo
                    </Button>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input {...profileForm.register("full_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Title / Role</Label>
                      <Input {...profileForm.register("title")} placeholder="e.g. Program Manager" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Email Address</Label>
                      <Input {...profileForm.register("email")} type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input {...profileForm.register("phone")} type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" loading={profileForm.formState.isSubmitting} className="gap-2">
                      {savedProfile ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </Button>
                  </div>
                </form>
              </SettingSection>
            </motion.div>
          </div>
        </TabsContent>

        {/* Organization tab */}
        <TabsContent value="organization">
          <div className="max-w-2xl space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <SettingSection
                title="Organization Details"
                description="Update your organization's public profile"
              >
                <form onSubmit={orgForm.handleSubmit(saveOrg)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Organization Name</Label>
                    <Input {...orgForm.register("name")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input {...orgForm.register("email")} type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input {...orgForm.register("phone")} type="tel" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input {...orgForm.register("website")} type="url" placeholder="https://" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mission / Description</Label>
                    <Textarea {...orgForm.register("description")} rows={4} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" loading={orgForm.formState.isSubmitting} className="gap-2">
                      {savedOrg ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </Button>
                  </div>
                </form>
              </SettingSection>
            </motion.div>
          </div>
        </TabsContent>

        {/* Billing tab */}
        <TabsContent value="billing">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-primary-subtle" />}>
            <BillingSettings />
          </Suspense>
        </TabsContent>

        {/* Notifications tab */}
        <TabsContent value="notifications">
          <div className="max-w-2xl">
            <SettingSection title="Notification Preferences" description="Choose how you receive notifications">
              <div className="space-y-4">
                {[
                  { label: "New case assigned", description: "Get notified when a new case is assigned to you" },
                  { label: "Referral status update", description: "When a referral is accepted or rejected" },
                  { label: "Document uploaded", description: "When a team member uploads a document" },
                  { label: "Weekly summary", description: "Receive a weekly digest of your organization's activity" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-surface-border hover:bg-primary-subtle transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-text-dark">{item.label}</p>
                      <p className="text-xs text-text-soft mt-0.5">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-partner-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security">
          <div className="max-w-2xl space-y-6">
            <SettingSection title="Change Password" description="Update your account password">
              <form className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="At least 8 characters" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Repeat new password" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </SettingSection>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
