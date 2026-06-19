/** Fields selected from the community organizations table for mother-facing APIs. */
export const organizationPublicSelect = {
  id: true,
  org_name: true,
  org_type: true,
  category: true,
  purpose: true,
  city: true,
  state: true,
  counties_served: true,
  referral_notes: true,
} as const;

export type OrganizationPublicRecord = {
  id: string;
  org_name: string;
  org_type: string | null;
  category: string;
  purpose: string | null;
  city: string | null;
  state: string | null;
  counties_served: string[];
  referral_notes: string | null;
};

export function toPublicOrganization(org: OrganizationPublicRecord) {
  const serviceArea = org.counties_served.length
    ? org.counties_served.join(', ')
    : org.referral_notes;

  return {
    id: org.id,
    name: org.org_name,
    type: org.category || org.org_type,
    tagline: org.purpose,
    description: org.purpose,
    city: org.city,
    state: org.state,
    service_area: serviceArea,
  };
}

export function toPublicOrganizationSummary(org: {
  id: string;
  org_name: string;
  city: string | null;
  state: string | null;
}) {
  return {
    id: org.id,
    name: org.org_name,
    city: org.city,
    state: org.state,
  };
}

export function normalizeLocationLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export type OrganizationLocationFilters = {
  state?: string;
  city?: string;
  county?: string;
};

/** Whether an org serves the given county (and optional state/city context). */
export function organizationServesLocation(
  org: OrganizationPublicRecord,
  filters: OrganizationLocationFilters
): boolean {
  const county = filters.county?.trim();
  if (!county) return true;

  if (filters.state?.trim()) {
    const orgState = org.state ? normalizeLocationLabel(org.state) : '';
    const userState = normalizeLocationLabel(filters.state);
    if (orgState && orgState !== userState) return false;
  }

  const normalizedCounty = normalizeLocationLabel(county);
  return org.counties_served.some((served) => {
    const normalized = normalizeLocationLabel(served);
    return normalized === normalizedCounty || normalized === 'statewide';
  });
}
