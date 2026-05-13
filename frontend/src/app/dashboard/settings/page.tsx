"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, ArrowRight, Zap, Shield, Heart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "free",
    displayName: "Free",
    price: "$0",
    period: "/month",
    features: ["Basic eligibility scan", "Application links", "Self-service guide", "Public program info"],
    priceId: null,
  },
  {
    name: "family",
    displayName: "Family",
    price: "$9",
    period: "/month",
    features: [
      "Deep eligibility scanning",
      "Auto-fill applications",
      "Deadline SMS alerts",
      "Multi-program tracking",
      "Document management",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID,
  },
  {
    name: "navigator",
    displayName: "Navigator",
    price: "$24",
    period: "/month",
    features: [
      "Everything in Family",
      "1-on-1 Expert Chat",
      "Denial & Appeal Support",
      "Concierge filing",
      "Priority support",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_NAVIGATOR_PRICE_ID,
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: billing } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data.data),
  });

  const handleCheckout = async (planName: string) => {
    setCheckoutLoading(planName);
    try {
      const res = await api.post("/api/billing/checkout", { plan: planName });
      window.location.href = res.data.data.url;
    } catch (err: any) {
      console.error(err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await api.post("/api/billing/portal");
      window.location.href = res.data.data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Settings & Billing
        </h1>
        <p className="text-sm text-on-surface-variant">Manage your subscription and account preferences</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-semibold text-on-surface">Current Plan</span>
              <PlanBadge plan={user?.plan || "free"} />
            </div>
            <p className="text-sm text-on-surface-variant">
              {billing?.status === "active"
                ? `Subscription active • Next renewal: ${billing?.currentPeriodEnd ? new Date(billing.currentPeriodEnd * 1000).toLocaleDateString() : "—"}`
                : "Upgrade to unlock powerful features for your family"}
            </p>
          </div>
          {user?.plan !== "free" && (
            <Button
              variant="secondary"
              size="sm"
              loading={portalLoading}
              onClick={handlePortal}
            >
              Manage Billing
            </Button>
          )}
        </div>
      </Card>

      {/* Plans */}
      <h2 className="font-display font-semibold text-xl text-on-surface mb-4">
        Choose Your Plan
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mb-8 pt-4">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.name;
          const isPopular = plan.name === "family";

          return (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              className="relative flex flex-col"
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-gradient-primary rounded-full text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-primary/20 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <Card
                padding="lg"
                className={cn(
                  "h-full flex flex-col",
                  isCurrent ? "border-2 border-primary-400 shadow-xl shadow-primary/10 ring-4 ring-primary-50" : "border-outline-variant/50"
                )}
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-xl text-on-surface">
                      {plan.displayName}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-tight">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-display font-bold text-4xl text-on-surface">{plan.price}</span>
                    <span className="text-on-surface-variant text-sm mb-1.5">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary-50 text-primary-500">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-on-surface-variant leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container text-on-surface-variant text-sm font-bold border border-outline-variant">
                    <Check className="w-4 h-4" />
                    Your Current Plan
                  </div>
                ) : (
                  <Button
                    variant={isPopular ? "primary" : "outline"}
                    size="md"
                    className="w-full rounded-xl"
                    loading={checkoutLoading === plan.name}
                    onClick={() => plan.name !== "free" && handleCheckout(plan.name)}
                    disabled={plan.name === "free"}
                  >
                    {plan.name === "free" ? "Free Forever" : `Upgrade to ${plan.displayName}`}
                    {plan.name !== "free" && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Security Note */}
      <Card className="bg-surface-container-low" glass={false}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm text-on-surface mb-1">Secure Payments via Stripe</div>
            <p className="text-xs text-on-surface-variant">
              All payments are processed securely by Stripe. We never store your card details. Cancel anytime from your Stripe billing portal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
