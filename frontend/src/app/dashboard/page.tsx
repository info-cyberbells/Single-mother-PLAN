"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  ClipboardList,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { StatCardSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { formatCurrency, formatRelativeDate, getConfidenceColor } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: eligibilityResults, isLoading: loadingEligibility } = useQuery({
    queryKey: ["eligibility-results"],
    queryFn: () => api.get("/api/eligibility/results").then((r) => r.data.data),
  });

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get("/api/applications").then((r) => r.data.data),
  });

  const { data: deadlines, isLoading: loadingDeadlines } = useQuery({
    queryKey: ["deadlines"],
    queryFn: () => api.get("/api/deadlines").then((r) => r.data.data),
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications").then((r) => r.data.data),
  });

  const qualifiedPrograms = eligibilityResults?.filter(
    (r: any) => r.status === "qualified" || r.status === "likely_qualified"
  ) || [];

  const totalBenefitValue = qualifiedPrograms.reduce(
    (acc: number, r: any) => acc + (r.program?.estimated_monthly_value_max || 0),
    0
  );

  const activeApps = applications?.filter(
    (a: any) => !["approved", "rejected", "withdrawn"].includes(a.status)
  ) || [];

  const upcomingDeadlines = deadlines?.filter(
    (d: any) =>
      !d.is_completed &&
      new Date(d.due_date) > new Date() &&
      new Date(d.due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ) || [];

  const unreadNotifications = notifications?.filter((n: any) => !n.is_read) || [];

  const stats = [
    {
      label: "Potential Monthly Benefits",
      value: formatCurrency(totalBenefitValue),
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      subtext: `${qualifiedPrograms.length} programs matched`,
      loading: loadingEligibility,
    },
    {
      label: "Active Applications",
      value: activeApps.length.toString(),
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600",
      subtext: `${applications?.filter((a: any) => a.status === "action_required")?.length || 0} need attention`,
      loading: loadingApps,
    },
    {
      label: "Upcoming Deadlines",
      value: upcomingDeadlines.length.toString(),
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      subtext: upcomingDeadlines.length > 0 ? "Don't miss your renewals" : "All clear!",
      loading: loadingDeadlines,
    },
    {
      label: "Unread Notifications",
      value: unreadNotifications.length.toString(),
      icon: Sparkles,
      color: "bg-primary-50 text-primary-600",
      subtext: unreadNotifications.length > 0 ? "New updates available" : "You're all caught up",
      loading: loadingNotifications,
    },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          {greeting()}, {user?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-on-surface-variant text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </motion.div>

      {/* No eligibility scan banner */}
      {!loadingEligibility && eligibilityResults?.length === 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="mb-8"
        >
          <Card className="border-2 border-primary-200 bg-primary-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-on-surface mb-1">
                  Run your AI eligibility scan
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Discover all the government benefits your family qualifies for in just a few minutes.
                </p>
              </div>
              <Button asChild size="md">
                <Link href="/eligibility">
                  Start Scan
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) =>
          stat.loading ? (
            <StatCardSkeleton key={stat.label} />
          ) : (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i * 0.1}
            >
              <Card hover>
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="font-display font-bold text-2xl text-on-surface mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-on-surface-variant">{stat.label}</div>
                <div className="text-xs text-on-surface-variant/70 mt-1">{stat.subtext}</div>
              </Card>
            </motion.div>
          )
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Benefits & Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Matched Benefits */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.4}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Benefits & Eligibility</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/benefits">
                      View all
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEligibility ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-14 bg-surface-container rounded-lg" />
                    ))}
                  </div>
                ) : qualifiedPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant">Run your eligibility scan to see matched benefits</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {qualifiedPrograms.slice(0, 4).map((result: any) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-on-surface truncate">
                              {result.program?.name}
                            </span>
                            <StatusBadge status={result.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">
                              {result.program?.agency}
                            </span>
                            <span className="text-xs text-on-surface-variant">•</span>
                            <span className={`text-xs font-semibold ${getConfidenceColor(result.confidence_score)}`}>
                              {result.confidence_score}% match
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-emerald-600">
                            {formatCurrency(result.program?.estimated_monthly_value_max || 0)}
                          </div>
                          <div className="text-xs text-on-surface-variant">per month</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Applications */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Applications Tracker</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/applications">
                      View all
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingApps ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="animate-pulse h-14 bg-surface-container rounded-lg" />
                    ))}
                  </div>
                ) : activeApps.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant mb-3">No active applications yet</p>
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/dashboard/benefits">Browse Programs</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeApps.slice(0, 3).map((app: any) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        {app.status === "action_required" ? (
                          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-on-surface truncate">
                            {app.program?.name}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            Updated {formatRelativeDate(app.last_updated_at)}
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.6}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/deadlines">
                      View all
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDeadlines ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-12 bg-surface-container rounded-lg" />
                    ))}
                  </div>
                ) : upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant">No upcoming deadlines!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.slice(0, 4).map((deadline: any) => {
                      const dueTime = new Date(deadline.due_date).getTime();
                      const daysLeft = isNaN(dueTime)
                        ? 0
                        : Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
                      const isUrgent = !isNaN(dueTime) && daysLeft <= 7;

                      return (
                        <div
                          key={deadline.id}
                          className={`p-3 rounded-xl border ${
                            isUrgent
                              ? "bg-orange-50 border-orange-200"
                              : "bg-surface-container-low border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-on-surface">
                                {deadline.application?.program?.name}
                              </div>
                              <div className="text-xs text-on-surface-variant capitalize">
                                {deadline.deadline_type.replace(/_/g, " ")}
                              </div>
                            </div>
                            <div
                              className={`text-xs font-bold shrink-0 ${
                                isUrgent ? "text-orange-600" : "text-on-surface-variant"
                              }`}
                            >
                              {daysLeft === 0
                                ? "Today!"
                                : daysLeft === 1
                                ? "Tomorrow"
                                : `${daysLeft}d left`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.7}>
            <Card className="bg-gradient-primary text-white border-0" glass={false}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-white/80" />
                <h3 className="font-display font-semibold text-white">Quick Actions</h3>
              </div>
              <p className="text-sm text-white/70 mb-4">
                Need a hand with paperwork? Our caseworkers are online.
              </p>
              <div className="space-y-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white/20 border border-white/20"
                >
                  <Link href="/eligibility">
                    <Sparkles className="w-4 h-4" />
                    Run Eligibility Scan
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white/20 border border-white/20"
                >
                  <Link href="/dashboard/sessions">
                    <Calendar className="w-4 h-4" />
                    Book Counselor Session
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white/20 border border-white/20"
                >
                  <Link href="/dashboard/deadlines">
                    <Clock className="w-4 h-4" />
                    Track Deadlines
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white/20 border border-white/20"
                >
                  <Link href="/dashboard/documents">
                    <ClipboardList className="w-4 h-4" />
                    Upload Documents
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
