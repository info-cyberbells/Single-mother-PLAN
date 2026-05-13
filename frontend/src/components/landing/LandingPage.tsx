"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  FileCheck,
  LayoutDashboard,
  Bell,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Heart,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

// Static icon color classes — keep explicit for Tailwind purge and hydration safety
const featureIconClasses = [
  "bg-indigo-50 text-indigo-600",
  "bg-violet-50 text-violet-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
];

const features = [
  {
    icon: Brain,
    title: "Smart Eligibility Engine",
    description:
      "Our AI algorithm scans over 200 state and federal programs simultaneously. Enter your details once, find everything you qualify for instantly.",
  },
  {
    icon: FileCheck,
    title: "Step-by-Step Applications",
    description:
      "We pre-fill up to 80% of application forms using your profile data, saving you hours of repetitive data entry.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Benefits Tracker",
    description:
      "One dashboard to see the status of every application, from submission to final approval.",
  },
  {
    icon: Bell,
    title: "Zero Missed Deadlines",
    description:
      "Automated SMS and email alerts ensure you never miss a renewal window or a request for additional documentation.",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Support",
    description:
      "Real case managers available via chat to help you navigate complex denials or appeals processes.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "HIPAA-compliant encryption protects your sensitive family information at every step.",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell Us Your Story",
    description: "Securely input basic family and income information in our intake tool.",
    icon: Users,
  },
  {
    number: "02",
    title: "See Your Matches",
    description: "Review a personalized list of programs with estimated monthly value.",
    icon: Brain,
  },
  {
    number: "03",
    title: "Apply in One Click",
    description: "Submit multiple applications at once with our concierge service.",
    icon: Zap,
  },
];

const testimonials = [
  {
    quote:
      "I never knew I qualified for child care assistance. MomPlan found the program and helped me apply. It saved our family $600 a month.",
    author: "Maria S.",
    location: "Texas",
    stars: 5,
    program: "CCAP",
  },
  {
    quote:
      "The deadline alerts are a lifesaver. Before MomPlan, I'd always forget to renew my SNAP benefits until they were cut off. Never again.",
    author: "Jessica T.",
    location: "Ohio",
    stars: 5,
    program: "SNAP",
  },
  {
    quote:
      "Having an expert to chat with during my appeal was incredible. They knew exactly which documents I needed to submit. Highly recommend!",
    author: "Priya M.",
    location: "California",
    stars: 5,
    program: "Medicaid",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for exploring your options",
    features: ["Basic eligibility scan", "Application links", "Self-service guide", "Public program info"],
    cta: "Start Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Family",
    price: "$9",
    period: "/month",
    description: "Most popular for active families",
    features: [
      "Deep eligibility scanning",
      "Auto-fill applications",
      "Deadline SMS alerts",
      "Multi-program tracking",
      "Document management",
    ],
    cta: "Get Family Plan",
    href: "/register?plan=family",
    popular: true,
  },
  {
    name: "Navigator",
    price: "$24",
    period: "/month",
    description: "Full concierge benefits management",
    features: [
      "Everything in Family",
      "1-on-1 Expert Chat",
      "Denial & Appeal Support",
      "Concierge filing",
      "Priority support",
    ],
    cta: "Get Navigator",
    href: "/register?plan=navigator",
    popular: false,
  },
];

const stats = [
  { value: "200+", label: "Federal & State Programs" },
  { value: "$8,400", label: "Avg. Monthly Benefits Found" },
  { value: "94%", label: "Eligibility Match Rate" },
  { value: "52,000+", label: "Families Helped" },
];

// Reusable CTA link styled like a primary button — avoids asChild + multi-child issue
function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold text-white",
        "bg-gradient-primary shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5 active:translate-y-0",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
        className
      )}
    >
      {children}
    </Link>
  );
}

function GhostLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold",
        "text-on-surface hover:bg-surface-container-high transition-all duration-200",
        className
      )}
    >
      {children}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden" suppressHydrationWarning>
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-100/30 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative container-max section-padding text-center">
          {/* Pill Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Benefits Eligibility Scanning
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-on-surface leading-tight mb-6 max-w-4xl mx-auto"
          >
            Find Every Benefit
            <br />
            <span className="text-gradient">Your Family Deserves</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            MomPlan scans 200+ federal and state programs to match you with{" "}
            <strong className="text-on-surface">thousands in hidden benefits</strong>. From
            childcare subsidies to nutrition assistance, we handle the complexity so you can
            focus on family.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <PrimaryLink href="/eligibility">
              Scan My Eligibility Free
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
            <GhostLink href="#how-it-works">
              How it Works
              <ChevronRight className="w-5 h-5" />
            </GhostLink>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card py-6 px-4 text-center hover:shadow-glass-lg transition-shadow duration-300"
              >
                <div className="font-display font-bold text-3xl text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-on-surface-variant font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="bg-white border-y border-outline-variant/10 py-8">
        <div className="container-max section-padding">
          <p className="text-center text-sm text-on-surface-variant mb-6 font-medium">
            TRUSTED BY GOVERNMENT PROGRAM PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["WIC", "SNAP", "Medicaid", "CHIP", "CCAP", "SSI", "TANF", "Head Start"].map(
              (program) => (
                <span key={program} className="font-display font-bold text-lg text-on-surface-variant">
                  {program}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              Why Families Love MomPlan
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Complex paperwork, <span className="text-gradient">simplified</span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Automated eligibility scanning and application management — we do the heavy lifting for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.05}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${featureIconClasses[i]} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-on-surface mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50/30 pointer-events-none" />
        <div className="container-max section-padding relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Three Steps to Support
            </h2>
            <p className="text-lg text-on-surface-variant">
              Our streamlined process takes less than 10 minutes from start to finish.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200" />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className="text-center"
              >
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary mb-6 mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary-500 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-xl text-on-surface mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <PrimaryLink href="/eligibility" className="px-10">
              Start My Free Eligibility Scan
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Stories of Impact
            </h2>
            <p className="text-lg text-on-surface-variant">
              Real feedback from mothers across the country.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
              >
                <Card hover className="h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1 mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-on-surface">{t.author}</div>
                      <div className="text-xs text-on-surface-variant">
                        {t.location} &bull; {t.program} recipient
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gradient-hero">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Choose Your Support Level
            </h2>
            <p className="text-lg text-on-surface-variant">No hidden fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary rounded-full text-white text-xs font-bold shadow-primary">
                    Most Popular
                  </div>
                )}
                <Card
                  className={`h-full ${plan.popular ? "border-2 border-primary-300 shadow-primary" : ""}`}
                  padding="lg"
                >
                  <div className="mb-6">
                    <h3 className="font-display font-bold text-xl text-on-surface mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-4">{plan.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="font-display font-bold text-4xl text-on-surface">
                        {plan.price}
                      </span>
                      <span className="text-on-surface-variant text-sm mb-1">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-on-surface-variant">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PrimaryLink
                    href={plan.href}
                    className={cn(
                      "w-full text-sm py-2.5",
                      !plan.popular && "bg-primary-50 text-primary-600 shadow-none hover:bg-primary-100 hover:shadow-none"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryLink>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-on-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-max section-padding relative text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-4">
              Ready to find your benefits?
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
              Join 52,000+ families who&apos;ve already discovered thousands in hidden government benefits.
            </p>
            <PrimaryLink href="/register" className="px-10 py-4">
              Get Started Free Today
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
            <p className="text-sm text-white/40 mt-4">
              No credit card required &bull; Setup in 3 minutes &bull; Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
