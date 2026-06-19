import { api } from "@/lib/api";

export type OrgPlan = "community" | "partner" | "network";
export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionStatus {
  plan: OrgPlan;
  status: string;
  current_period_end: string | null;
  next_billing_date: string | null;
  renewal_date: string | null;
  cancel_at_period_end: boolean;
}

export interface CancelSubscriptionResult {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  accessUntil: string | null;
}

export const PLAN_PRICING: Record<
  "partner" | "network",
  { monthly: number; yearly: number; yearlyMonthlyEquivalent: number }
> = {
  partner: { monthly: 349, yearly: 3588, yearlyMonthlyEquivalent: 299 },
  network: { monthly: 899, yearly: 8988, yearlyMonthlyEquivalent: 749 },
};

export function formatPlanPrice(plan: "partner" | "network", interval: BillingInterval): string {
  const pricing = PLAN_PRICING[plan];
  const amount = interval === "monthly" ? pricing.monthly : pricing.yearlyMonthlyEquivalent;
  return `$${amount}`;
}

export function formatPlanBillingNote(plan: "partner" | "network", interval: BillingInterval): string {
  const pricing = PLAN_PRICING[plan];
  if (interval === "monthly") {
    return "Billed monthly — cancel anytime";
  }
  return `Billed annually ($${pricing.yearly.toLocaleString()}/yr)`;
}

export async function activateCommunityPlan() {
  const res = await api.post("/api/partner/billing/activate-community");
  return res.data.data;
}

export async function startCheckout(
  plan: "partner" | "network",
  interval: BillingInterval = "yearly"
) {
  const res = await api.post("/api/partner/billing/checkout", { plan, interval });
  return res.data.data as { url: string };
}

export async function upgradePlan(
  plan: "partner" | "network",
  interval: BillingInterval = "yearly"
) {
  const res = await api.post("/api/partner/billing/upgrade", { plan, interval });
  return res.data.data as { plan?: OrgPlan; upgraded?: boolean; checkoutUrl?: string };
}

export async function downgradePlan(plan: OrgPlan, interval: BillingInterval = "yearly") {
  const res = await api.post("/api/partner/billing/downgrade", { plan, interval });
  return res.data.data as { plan?: OrgPlan; downgraded?: boolean };
}

export async function cancelSubscription() {
  const res = await api.post("/api/partner/billing/cancel");
  return res.data.data as CancelSubscriptionResult;
}

export async function reactivateSubscription() {
  const res = await api.post("/api/partner/billing/reactivate");
  return res.data.data;
}

export async function getSubscriptionStatus() {
  const res = await api.get("/api/partner/billing/subscription");
  return res.data.data as SubscriptionStatus;
}

export async function openBillingPortal() {
  const res = await api.post("/api/partner/billing/portal");
  return res.data.data as { url: string };
}

export const PLAN_LABELS: Record<OrgPlan, string> = {
  community: "Community",
  partner: "Partner Org",
  network: "Network",
};
