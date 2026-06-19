"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, Check, ArrowRight, Shield, AlertCircle, CalendarX2 } from "lucide-react";
import { usePartnerAuthStore } from "@/store/auth.store";
import {
  cancelSubscription,
  formatPlanBillingNote,
  formatPlanPrice,
  getSubscriptionStatus,
  openBillingPortal,
  reactivateSubscription,
  startCheckout,
  upgradePlan,
  downgradePlan,
  type BillingInterval,
  type OrgPlan,
  PLAN_LABELS,
} from "@/lib/billing";
import { BillingIntervalToggle } from "@/components/billing/BillingIntervalToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const plans: {
  name: OrgPlan;
  displayName: string;
  features: string[];
}[] = [
  {
    name: "community",
    displayName: "Community",
    features: [
      "Basic caseworker case queue",
      "Mother profile viewer",
      "Application status tracking",
      "Renewal deadline alerts",
    ],
  },
  {
    name: "partner",
    displayName: "Partner Org",
    features: [
      "Full caseworker dashboard",
      "Organization admin dashboard",
      "Outcomes reporting",
      "Two-way referral network access",
    ],
  },
  {
    name: "network",
    displayName: "Network",
    features: [
      "Unlimited active cases",
      "Custom report builder",
      "Multi-site / branch management",
      "Priority email & phone support",
    ],
  },
];

const isDev = process.env.NODE_ENV === "development";

function planRank(plan: OrgPlan): number {
  return plans.findIndex((p) => p.name === plan);
}

function getPlanDisplay(
  plan: (typeof plans)[number],
  billingInterval: BillingInterval
): { price: string; period: string; billing: string } {
  if (plan.name === "community") {
    return {
      price: "$0",
      period: "/month",
      billing: "Free for qualifying 501(c)(3)s",
    };
  }

  return {
    price: formatPlanPrice(plan.name, billingInterval),
    period: "/month",
    billing: formatPlanBillingNote(plan.name, billingInterval),
  };
}

function PlanBadge({ plan }: { plan: OrgPlan }) {
  const labels: Record<OrgPlan, string> = {
    community: "Community",
    partner: "Partner",
    network: "Network",
  };
  return (
    <Badge variant="outline" className="capitalize">
      {labels[plan]}
    </Badge>
  );
}

export function BillingSettings() {
  const { user } = usePartnerAuthStore();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("yearly");
  const [banner, setBanner] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<OrgPlan>("community");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "cancelled") {
      setBanner({ type: "info", message: "Checkout was cancelled. No charges were made." });
    }
  }, [searchParams]);

  useEffect(() => {
    const interval = searchParams.get("interval");
    if (interval === "monthly" || interval === "yearly") {
      setBillingInterval(interval);
    }
  }, [searchParams]);

  const preselectedPlan = searchParams.get("plan") as OrgPlan | null;

  const { data: billing, isPending: billingLoading } = useQuery({
    queryKey: ["partner-billing-status"],
    queryFn: getSubscriptionStatus,
    enabled: isAdmin,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (billing?.plan) {
      setCurrentPlan(billing.plan);
    }
  }, [billing?.plan]);

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["partner-billing-status"] });
      setCancelDialogOpen(false);
      const accessUntil = result.accessUntil ?? result.currentPeriodEnd;
      setBanner({
        type: "info",
        message: accessUntil
          ? `Your subscription will cancel on ${new Date(accessUntil).toLocaleDateString()}. You'll keep full access until then — no further charges.`
          : "Your subscription will cancel at the end of the billing period. You'll keep full access until then — no further charges.",
      });
    },
    onError: () => setBanner({ type: "error", message: "Failed to cancel subscription. Please try again." }),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-billing-status"] });
      setBanner({ type: "info", message: "Your subscription has been reactivated." });
    },
    onError: () => setBanner({ type: "error", message: "Failed to reactivate subscription." }),
  });

  const handlePlanAction = async (planName: OrgPlan) => {
    const effectivePlan = billing?.plan ?? currentPlan;
    if (planName === effectivePlan) return;

    setCheckoutLoading(planName);
    setBanner(null);
    try {
      if (planRank(planName) > planRank(effectivePlan)) {
        if (effectivePlan === "community") {
          const { url } = await startCheckout(planName as "partner" | "network", billingInterval);
          window.location.href = url;
        } else {
          const result = await upgradePlan(planName as "partner" | "network", billingInterval);
          if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
          } else {
            setCurrentPlan(planName);
            queryClient.invalidateQueries({ queryKey: ["partner-billing-status"] });
          }
        }
      } else if (isDev) {
        const result = await downgradePlan(planName, billingInterval);
        setCurrentPlan(result.plan ?? planName);
        queryClient.invalidateQueries({ queryKey: ["partner-billing-status"] });
        setBanner({ type: "info", message: `Downgraded to ${plans.find((p) => p.name === planName)?.displayName ?? planName} (dev only).` });
      }
    } catch {
      setBanner({ type: "error", message: "Unable to change plan. Please try again or contact support." });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
      setBanner({ type: "error", message: "Unable to open billing portal." });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Billing</CardTitle>
          <CardDescription>
            Only organization admins can view and manage subscription plans.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const renewalDate = billing?.next_billing_date ?? billing?.current_period_end;
  const activePlan = billing?.plan ?? (billingLoading ? null : currentPlan);
  const accessUntilLabel = renewalDate ? new Date(renewalDate).toLocaleDateString() : null;

  return (
    <div className="max-w-5xl space-y-6">
      {banner && (
        <div
          className={cn(
            "p-4 rounded-xl flex items-start gap-3 text-sm",
            banner.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-blue-50 border border-blue-200 text-blue-700"
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {banner.message}
        </div>
      )}

      {preselectedPlan && preselectedPlan !== activePlan && (
        <div className="p-4 rounded-xl bg-primary-subtle border border-primary/20 text-sm text-text-mid">
          You selected the <strong>{preselectedPlan}</strong> plan from our pricing page. Choose a plan below to continue.
        </div>
      )}

      {billing?.cancel_at_period_end && activePlan && activePlan !== "community" && (
        <div className="p-4 rounded-xl flex items-start gap-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
          <CalendarX2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cancellation scheduled</p>
            <p className="mt-0.5">
              Your {PLAN_LABELS[activePlan]} plan stays active
              {accessUntilLabel ? ` until ${accessUntilLabel}` : " until the end of your billing period"}.
              No further payments will be charged. Use Reactivate below to keep your subscription.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-partner flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription className="mt-1">
                {billingLoading && !billing
                  ? "Loading subscription details…"
                  : billing?.cancel_at_period_end && activePlan !== "community"
                    ? `Cancels on ${accessUntilLabel ?? "period end"} — access continues until then`
                    : billing?.status === "active" && activePlan !== "community"
                      ? `Subscription active${renewalDate ? ` • Renews: ${new Date(renewalDate).toLocaleDateString()}` : ""}`
                      : activePlan === "community"
                        ? "Community plan — free for qualifying organizations"
                        : "Upgrade to unlock organization features"}
              </CardDescription>
            </div>
            {activePlan && <PlanBadge plan={activePlan} />}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {billing?.cancel_at_period_end ? (
            <Button
              variant="outline"
              size="sm"
              loading={reactivateMutation.isPending}
              onClick={() => reactivateMutation.mutate()}
            >
              Reactivate
            </Button>
          ) : activePlan && activePlan !== "community" ? (
            <>
              <Button variant="outline" size="sm" loading={portalLoading} onClick={handlePortal}>
                Manage Billing
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-status-error border-status-error/30 hover:bg-status-error-bg"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel subscription
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              Your {activePlan ? PLAN_LABELS[activePlan] : "paid"} plan will remain fully active
              {accessUntilLabel ? ` until ${accessUntilLabel}` : " until the end of your current billing period"}.
              After that, your organization will move to the free Community plan and you will not be charged again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep subscription
            </Button>
            <Button
              variant="destructive"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Confirm cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-bold text-lg text-text-dark">Choose Your Plan</h3>
          {isDev && (
            <p className="text-xs text-amber-700 mt-1">Development mode: plan downgrades are enabled for testing.</p>
          )}
        </div>
        <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-2">
        {plans.map((plan) => {
          const display = getPlanDisplay(plan, billingInterval);
          const isCurrent = activePlan !== null && activePlan === plan.name;
          const isPopular = plan.name === "partner";
          const canUpgrade =
            activePlan !== null && planRank(activePlan) < planRank(plan.name);
          const canDowngrade =
            isDev && activePlan !== null && planRank(activePlan) > planRank(plan.name);

          return (
            <motion.div key={plan.name} whileHover={{ y: -4 }} className="relative flex flex-col">
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-gradient-partner rounded-full text-white text-[10px] uppercase tracking-wider font-black shadow-lg whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <Card className={cn("h-full flex flex-col", isCurrent && "ring-2 ring-primary/30")}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-extrabold text-4xl text-text-dark">{display.price}</span>
                    <span className="text-text-soft text-sm mb-1.5">{display.period}</span>
                  </div>
                  <p className="text-xs text-text-soft mt-2">{display.billing}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <div className="mt-0.5 p-0.5 rounded-full bg-primary-subtle text-primary">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-text-mid leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {billingLoading && !billing ? (
                    <div className="w-full h-11 rounded-xl bg-primary-subtle animate-pulse" />
                  ) : isCurrent ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-subtle text-text-soft text-sm font-bold border border-surface-border">
                      <Check className="w-4 h-4" />
                      Your Current Plan
                    </div>
                  ) : canUpgrade ? (
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      loading={checkoutLoading === plan.name}
                      onClick={() => handlePlanAction(plan.name)}
                    >
                      {plan.name === "community" ? "Switch to Community" : `Upgrade to ${plan.displayName}`}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : canDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      loading={checkoutLoading === plan.name}
                      onClick={() => handlePlanAction(plan.name)}
                    >
                      {plan.name === "community"
                        ? "Switch to Community"
                        : `Downgrade to ${plan.displayName}`}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade via support
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-text-dark mb-1">Secure Payments via Stripe</div>
              <p className="text-xs text-text-soft">
                All payments are processed securely by Stripe. We never store your card details. Cancel anytime — access continues until the end of your billing period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
