// =============================================================================
// Partner Portal — Shared Types
// =============================================================================

// ---- Auth ----

export interface PartnerUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "caseworker";
  org_id?: string | null;
  must_change_password?: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  title?: string | null;
  [key: string]: unknown;
}

// ---- Team ----

export type OrgUserRole = "admin" | "caseworker";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: OrgUserRole;
  is_active: boolean;
  created_at: string;
}

export interface BulkCreateMembersResult {
  created: TeamMember[];
  failed: Array<{ email: string; reason: string }>;
}

// ---- Organization ----

export type OrgType =
  | "Corporation (C-Corp)"
  | "S-Corporation"
  | "Limited Liability (LLC)"
  | "Partnership"
  | "Sole Proprietorship"
  | "Non-profit (501c3)"
  | "Government Agency"
  | "Cooperative"
  | "Startup"
  | "Other";

export type OrgStatus = "pending" | "active" | "suspended" | "inactive";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  status: OrgStatus;
  website?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  employees?: string | null;
  founded?: string | null;
  tax_id?: string | null;
  linkedin?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Case Management (Partner Portal) ----

export type PartnerCaseStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "renewal_due"
  | "denied";

export type UrgencyLevel = "high" | "moderate" | "normal";

export interface CaseListItem {
  id: string;
  mother_id: string;
  mother_name: string;
  mother_initials: string;
  mother_number: string;
  program: string;
  program_code: string;
  status: PartnerCaseStatus;
  urgency: UrgencyLevel;
  deadline_date: string | null;
  deadline_label: string | null;
  last_activity: { description: string; date: string } | null;
  caseworker: {
    id: string;
    name: string;
    full_name: string;
    initials: string;
  } | null;
  quarter?: string | null;
  intake_date?: string | null;
  created_at: string;
}

export interface CaseDetail extends CaseListItem {
  alert?: { message: string; severity: string } | null;
  client_info: {
    phone: string | null;
    email: string | null;
    address: string | null;
    household_size: number | null;
    children: { name: string; age: string }[];
    preferred_contact: string;
    language: string;
    dob: string | null;
    age: number | null;
    assigned_date: string;
  };
  eligibility: {
    monthly_income: number | null;
    income_threshold_pct: number;
    eligible: boolean;
    last_verified: string | null;
    needs_update: boolean;
    proof_of_residency: string;
    postpartum_status: string | null;
    next_review_date: string | null;
  };
  documents: {
    id: string;
    name: string;
    file_url?: string;
    status: "missing" | "pending" | "on_file";
    uploaded_at: string;
    expiry_date: string | null;
  }[];
  activity_log: {
    id: string;
    type: string;
    description: string;
    date: string;
    color: string;
  }[];
  deadlines: {
    id: string;
    type: string;
    due_date: string;
    is_resolved: boolean;
    days_remaining: number;
  }[];
}

export interface DashboardSummary {
  renewal_due_soon: number;
  incomplete_docs: number;
  approved_this_quarter: number;
  total_assigned: number;
  quarter: string;
  year: number;
}

export interface MotherListItem {
  id: string;
  name: string;
  email: string | null;
  status: string;
  caseworker: { id: string; full_name: string } | null;
  created_at: string;
}

export interface MotherDetail extends MotherListItem {
  cases: {
    id: string;
    program: string;
    status: string;
    quarter: string;
    created_at: string;
  }[];
}

export interface AssignableCaseworker {
  id: string;
  full_name: string;
}

export interface AlertItem {
  id: string;
  case_id: string;
  client_name: string;
  case_number: string;
  days_remaining: number;
  due_date: string;
  description: string;
  alert_type: string;
  program: string;
  program_code: string;
  urgency_bucket: "critical" | "soon" | "upcoming" | "on_track";
  is_snoozed: boolean;
  last_activity: { description: string; date: string } | null;
  caseworker: {
    id: string;
    name: string;
    full_name: string;
    initials: string;
  } | null;
}

export interface AlertSummary {
  critical: number;
  soon: number;
  upcoming: number;
  on_track: number;
  total_cases: number;
}

export interface CaseFilterOptions {
  statuses: string[];
  programs: { id: string; label: string }[];
  caseworkers: { id: string; name: string; full_name: string }[];
}

// ---- Case (legacy) ----

export type CaseStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "closed"
  | "cancelled";

export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface Case {
  id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  mother_name: string;
  mother_id?: string;
  assigned_to?: string | null;
  organization_id: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

// ---- Referral ----

export type ReferralStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export interface Referral {
  id: string;
  referral_number: string;
  status: ReferralStatus;
  mother_name: string;
  mother_id?: string;
  from_organization_id: string;
  to_organization_id: string;
  from_organization_name?: string;
  to_organization_name?: string;
  service_type: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

// ---- Document ----

export type DocumentType =
  | "report"
  | "consent"
  | "referral_letter"
  | "intake_form"
  | "assessment"
  | "other";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  organization_id: string;
  case_id?: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

// ---- Analytics ----

export interface DashboardMetrics {
  total_cases: number;
  open_cases: number;
  closed_this_month: number;
  total_referrals: number;
  pending_referrals: number;
  accepted_referrals: number;
  total_mothers_served: number;
  new_mothers_this_month: number;
  total_documents: number;
  avg_case_resolution_days?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface CasesByStatus {
  status: string;
  count: number;
  color?: string;
}

// ---- API Helpers ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ---- UI ----

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
