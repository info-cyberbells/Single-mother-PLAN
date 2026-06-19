"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getSubscriptionStatus, PLAN_LABELS, type OrgPlan } from "@/lib/billing";

export function BillingSuccessClient() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<{
    plan: OrgPlan;
    status: string;
    next_billing_date: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryPlan = searchParams.get("plan") as OrgPlan | null;
  const isMock = searchParams.get("mock") === "true";

  useEffect(() => {
    async function load() {
      try {
        const status = await getSubscriptionStatus();
        queryClient.setQueryData(["partner-billing-status"], status);
        queryClient.invalidateQueries({ queryKey: ["partner-billing-status"] });
        setBilling({
          plan: status.plan,
          status: status.status,
          next_billing_date: status.next_billing_date,
        });
      } catch {
        if (queryPlan) {
          setBilling({
            plan: queryPlan,
            status: "active",
            next_billing_date: null,
          });
        } else {
          setError("We couldn't load your subscription details. Your payment may still be processing.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [queryPlan]);

  const plan = billing?.plan ?? queryPlan ?? "community";

  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-status-success" />
            </div>

            <h1 className="font-extrabold text-2xl text-text-dark mb-2">
              {loading ? "Confirming your subscription…" : "You're all set!"}
            </h1>
            <p className="text-sm text-text-soft mb-6">
              {isMock
                ? "Mock payment succeeded — your plan is active for local testing."
                : "Your organization subscription has been activated successfully."}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {error}
              </div>
            )}

            {!loading && (
              <div className="space-y-4 text-left mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary-subtle">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-text-dark">Current Plan</span>
                  </div>
                  <Badge variant="outline">{PLAN_LABELS[plan as OrgPlan] ?? plan}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-primary-subtle">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                    <span className="text-sm font-medium text-text-dark">Status</span>
                  </div>
                  <span className="text-sm font-semibold text-status-success capitalize">
                    {billing?.status ?? "active"}
                  </span>
                </div>

                {billing?.next_billing_date && plan !== "community" && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary-subtle">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-text-dark">Next Billing Date</span>
                    </div>
                    <span className="text-sm font-semibold text-text-dark">
                      {new Date(billing.next_billing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings?tab=billing">Manage Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
