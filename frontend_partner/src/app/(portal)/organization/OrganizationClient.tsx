"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Globe, Mail, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { usePartnerAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Organization } from "@/types";

async function fetchOrganization(): Promise<Organization & { contact_email?: string | null }> {
  const res = await api.get("/api/partner/organization");
  const org = res.data.data.organization;
  return {
    ...org,
    email: org.contact_email ?? org.email ?? null,
    created_at: org.created_at,
  };
}

export function OrganizationClient() {
  const { organization: cachedOrg } = usePartnerAuthStore();

  const { data: org, isLoading } = useQuery({
    queryKey: ["partner-organization"],
    queryFn: fetchOrganization,
    initialData: cachedOrg ?? undefined,
    staleTime: 60 * 1000,
  });

  if (isLoading && !org) {
    return (
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex-1 p-8 text-center text-text-soft">
        Organization details could not be loaded.
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-partner flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <p className="text-sm text-text-soft mt-1">{org.type ?? "Partner organization"}</p>
              </div>
            </div>
            <Badge className="bg-status-success-bg text-status-success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {org.description && (
            <p className="text-sm text-text-mid leading-relaxed">{org.description}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {(org.address || org.city) && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-text-soft mt-0.5 shrink-0" />
                <span className="text-text-mid">
                  {[org.address, org.city, org.state, org.zip].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {org.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-text-soft shrink-0" />
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-partner-600 hover:underline truncate">
                  {org.website}
                </a>
              </div>
            )}
            {org.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-text-soft shrink-0" />
                <span className="text-text-mid">{org.email}</span>
              </div>
            )}
            {org.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-text-soft shrink-0" />
                <span className="text-text-mid">{org.phone}</span>
              </div>
            )}
          </div>
          {org.created_at && (
            <p className="text-xs text-text-soft pt-2 border-t border-surface-border">
              Member since {formatDate(org.created_at)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
