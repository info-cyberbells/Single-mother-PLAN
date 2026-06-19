"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft, Heart } from "lucide-react";
import { usePartnerAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/lib/utils";
import { getMotherPortalUrl } from "@/lib/portal-urls";

// ---- Constants ----

const ORG_TYPES = [
  "Non-profit (501c3)",
  "Government Agency",
  "Cooperative",
  "Other",
] as const;

const EMP_RANGES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,001-5,000",
  "5,001-10,000",
  "10,000+",
] as const;

const STEPS = [
  { label: "About You", subtitle: "Name, type & mission" },
  { label: "Contact & Location", subtitle: "Address & contact" },
  { label: "Account Setup", subtitle: "Login credentials" },
] as const;

const PROGRESS = [33, 67, 100];

// ---- Schemas ----

const step0Schema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  orgType: z.string().min(1, "Please select an organization type"),
  website: z.string().url("Please enter a valid URL").or(z.literal("")),
  description: z.string().max(1000).optional(),
});

const step1Schema = z.object({
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().min(3, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

const step2Schema = z.object({
  adminName: z.string().min(2, "Full name is required"),
  adminEmail: z.string().email("Please enter a valid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  employees: z.string().optional(),
  founded: z.string().optional(),
  taxId: z.string().optional(),
  linkedin: z.string().url("Please enter a valid URL").or(z.literal("")),
});

type Step0Data = z.infer<typeof step0Schema>;
type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ---- Blossoms SVG ----

function Blossoms() {
  return (
    <svg
      viewBox="0 0 280 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute bottom-0 left-0 w-full opacity-[0.15] pointer-events-none"
    >
      <circle cx="50" cy="310" r="140" fill="white" />
      <circle cx="240" cy="330" r="90" fill="white" />
      <circle cx="210" cy="210" r="50" fill="white" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 55 + 30 * Math.cos(rad);
        const cy = 300 + 30 * Math.sin(rad);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="18"
            ry="10"
            transform={`rotate(${angle} ${cx} ${cy})`}
            fill="white"
          />
        );
      })}
      <circle cx="55" cy="300" r="11" fill="white" />
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 220 + 24 * Math.cos(rad);
        const cy = 85 + 24 * Math.sin(rad);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="14"
            ry="7"
            transform={`rotate(${angle} ${cx} ${cy})`}
            fill="white"
          />
        );
      })}
      <circle cx="220" cy="85" r="9" fill="white" />
    </svg>
  );
}

// ---- Field wrapper ----

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label className="mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-primary-500">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-text-soft mt-1.5">{hint}</p>
      )}
      {error && <p className="text-xs text-status-error mt-1.5">{error}</p>}
    </div>
  );
}

// ---- Native Select ----

function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  name: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-11 w-full rounded-xl border-[1.5px] border-surface-border bg-primary-subtle px-3.5 py-2.5 text-sm text-text-dark transition-all duration-200 outline-none focus:border-primary-500 focus:bg-white focus:shadow-focus appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234d41df' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: "38px",
        color: value ? "#1b1b1e" : "#777587",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ---- Success screen ----

function SuccessScreen({ orgName }: { orgName: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-partner-soft">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center p-14 bg-white rounded-3xl shadow-partner-xl border border-surface-border max-w-md mx-4"
      >
        <div className="w-20 h-20 bg-gradient-partner rounded-full flex items-center justify-center mx-auto mb-6 shadow-partner">
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-text-dark mb-3">
          You are all set! 🌸
        </h2>
        <p className="text-text-mid text-sm leading-relaxed mb-8">
          <strong className="text-primary">{orgName}</strong> has been successfully
          registered. Welcome to the MomPlan community!
        </p>
        <Button size="lg" onClick={() => router.push("/onboarding/organization")}>
          Complete Setup <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}

// ---- Main component ----

export function SignupClient() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [orgName, setOrgName] = useState("");

  // Shared form state across steps
  const [step0Data, setStep0Data] = useState<Partial<Step0Data>>({});
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({});

  const { setAuth } = usePartnerAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  // Step 0 form
  const form0 = useForm<Step0Data>({
    resolver: zodResolver(step0Schema),
    defaultValues: step0Data,
  });

  // Step 1 form
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  // Step 2 form
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  // Preview state — updated from form0/form1 values
  const [preview, setPreview] = useState({
    orgName: "",
    orgType: "",
    city: "",
    state: "",
    employees: "",
    founded: "",
  });

  const updatePreview = (patch: Partial<typeof preview>) =>
    setPreview((p) => ({ ...p, ...patch }));

  const handleStep0 = async (data: Step0Data) => {
    setStep0Data(data);
    setOrgName(data.orgName);
    updatePreview({ orgName: data.orgName, orgType: data.orgType });
    setStep(1);
  };

  const handleStep1 = async (data: Step1Data) => {
    setStep1Data(data);
    updatePreview({ city: data.city, state: data.state ?? "" });
    setStep(2);
  };

  const handleStep2 = async (data: Step2Data) => {
    updatePreview({ employees: data.employees ?? "", founded: data.founded ?? "" });
    try {
      const payload = {
        // org
        orgName: step0Data.orgName,
        orgType: step0Data.orgType,
        website: step0Data.website,
        description: step0Data.description,
        // contact
        email: step1Data.email,
        phone: step1Data.phone,
        address: step1Data.address,
        city: step1Data.city,
        state: step1Data.state,
        zip: step1Data.zip,
        country: step1Data.country,
        // admin account
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        employees: data.employees,
        founded: data.founded,
        taxId: data.taxId,
        linkedin: data.linkedin,
      };

      const response = await api.post("/api/partner/auth/register", payload);
      const { user, accessToken, organization } = response.data.data;
      setAuth(user, accessToken, organization);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        "Registration failed. Please try again.";
      toast({ variant: "destructive", title: "Registration failed", description: msg });
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  if (submitted) return <SuccessScreen orgName={orgName} />;

  const initStr = initials(preview.orgName);

  return (
    <div className="min-h-screen flex font-sans bg-gradient-partner-soft">
      {/* ---- LEFT SIDEBAR ---- */}
      <aside className="hidden lg:flex w-[296px] min-w-[296px] flex-col sticky top-0 h-screen overflow-hidden relative bg-gradient-partner shadow-[4px_0_32px_rgba(77,65,223,0.18)]">
        <Blossoms />

        {/* Brand */}
        <div className="relative z-10 px-7 pt-11 mb-9">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">
              OrgPortal
            </span>
          </div>
          <h1 className="text-white text-[22px] font-extrabold leading-snug">
            Register Your<br />
            <span className="text-partner-200">Organization</span>
          </h1>
          <p className="text-white/55 text-xs mt-2 leading-relaxed">
            A warm place to grow your community together.
          </p>
        </div>

        {/* Step indicators */}
        <div className="relative z-10 px-7 mb-9">
          {STEPS.map((s, i) => {
            const done = i < step;
            const cur = i === step;
            return (
              <div key={i} className="flex items-start gap-3 mb-5">
                <div className="flex flex-col items-center">
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all duration-300"
                    style={{
                      background: done
                        ? "rgba(255,255,255,0.95)"
                        : cur
                        ? "#fff"
                        : "rgba(255,255,255,0.18)",
                      color: done || cur ? "#4d41df" : "rgba(255,255,255,0.5)",
                      boxShadow: cur ? "0 4px 14px rgba(0,0,0,0.18)" : "none",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="w-0.5 h-6 mt-1 rounded-full transition-all"
                      style={{
                        background:
                          i < step
                            ? "rgba(255,255,255,0.55)"
                            : "rgba(255,255,255,0.20)",
                      }}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <div
                    className="text-[13px] font-bold"
                    style={{
                      color: cur
                        ? "#fff"
                        : done
                        ? "rgba(255,255,255,0.78)"
                        : "rgba(255,255,255,0.42)",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{
                      color: cur
                        ? "rgba(255,255,255,0.60)"
                        : "rgba(255,255,255,0.30)",
                    }}
                  >
                    {s.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview card */}
        <div className="relative z-10 mt-auto mx-7 mb-8 sidebar-glass rounded-[18px] p-5">
          <div className="text-[10px] text-white/50 font-bold tracking-widest uppercase mb-3.5">
            ✦ Live Preview
          </div>
          <div className="flex items-center gap-3 mb-3.5">
            <div
              className="w-[46px] h-[46px] rounded-xl shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-300"
              style={{
                background: preview.orgName
                  ? "linear-gradient(135deg, #e3dfff, #7a71ff)"
                  : "rgba(255,255,255,0.15)",
                color: preview.orgName ? "#4d41df" : "rgba(255,255,255,0.35)",
                fontSize: preview.orgName ? "15px" : "20px",
              }}
            >
              {preview.orgName ? initStr : "♡"}
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-snug">
                {preview.orgName || (
                  <span className="text-white/30 italic text-xs">Organization Name</span>
                )}
              </div>
              <div className="text-partner-200 text-xs mt-0.5">
                {preview.orgType || (
                  <span className="text-white/30 italic">Org Type</span>
                )}
              </div>
            </div>
          </div>
          {[
            ["City", [preview.city, preview.state].filter(Boolean).join(", ")],
            ["Size", preview.employees ? `${preview.employees} employees` : ""],
            ["Founded", preview.founded],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="flex gap-2.5 mb-1.5">
                <span className="text-[10px] text-white/45 font-bold min-w-[52px] pt-px uppercase tracking-wide">
                  {label}
                </span>
                <span className="text-[12px] text-white/80 leading-snug">{value}</span>
              </div>
            ))}
        </div>
      </aside>

      {/* ---- RIGHT PANEL ---- */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-14 py-11">
        <a
          href={getMotherPortalUrl("/signup/mother")}
          className="inline-flex items-center gap-1.5 text-sm text-text-soft hover:text-primary transition-colors mb-6 max-w-[600px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Sign up as a Mother instead
        </a>

        {/* Progress bar */}
        <div className="max-w-[600px] mb-10">
          <div className="flex justify-between mb-2.5">
            <span className="text-sm text-text-mid font-semibold">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-primary font-bold">
              {PROGRESS[step]}% complete
            </span>
          </div>
          <Progress value={PROGRESS[step]} className="h-[6px]" />
        </div>

        <div className="max-w-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {/* Step header */}
              <h2 className="text-[28px] font-extrabold text-text-dark mb-1.5">
                {["Basic Information 🌷", "Contact & Location 🏡", "Account Setup 🌿"][step]}
              </h2>
              <p className="text-text-mid text-sm leading-relaxed mb-7">
                {[
                  "Tell us about your organization's identity and what it stands for.",
                  "How can your community reach you? Enter your primary contact details.",
                  "Create your admin account to access the partner portal.",
                ][step]}
              </p>

              <div className="h-0.5 bg-gradient-to-r from-partner-300/40 to-transparent rounded-full mb-7" />

              {/* Step 0 — Basic Info */}
              {step === 0 && (
                <form onSubmit={form0.handleSubmit(handleStep0)} className="space-y-0">
                  <Field
                    label="Organization Name"
                    required
                    error={form0.formState.errors.orgName?.message}
                  >
                    <Input
                      {...form0.register("orgName")}
                      placeholder="e.g. Blossom Community Hub"
                      error={!!form0.formState.errors.orgName}
                      onChange={(e) => {
                        form0.register("orgName").onChange(e);
                        updatePreview({ orgName: e.target.value });
                      }}
                    />
                  </Field>

                  <Field
                    label="Organization Type"
                    required
                    error={form0.formState.errors.orgType?.message}
                  >
                    <NativeSelect
                      name="orgType"
                      value={form0.watch("orgType") ?? ""}
                      onChange={(v) => {
                        form0.setValue("orgType", v, { shouldValidate: true });
                        updatePreview({ orgType: v });
                      }}
                      options={ORG_TYPES}
                      placeholder="Select type"
                    />
                  </Field>

                  <Field
                    label="Website URL"
                    hint="Include https:// for best results"
                    error={form0.formState.errors.website?.message}
                  >
                    <Input
                      {...form0.register("website")}
                      type="url"
                      placeholder="https://www.yourorganization.com"
                    />
                  </Field>

                  <Field
                    label="Mission / Description"
                    hint="What does your organization do and why does it matter?"
                  >
                    <Textarea
                      {...form0.register("description")}
                      placeholder="Share your organization's heart — what you do and why it matters…"
                      className="min-h-[100px]"
                    />
                  </Field>

                  <StepNav step={step} onBack={goBack} isLast={false} isLoading={form0.formState.isSubmitting} />
                </form>
              )}

              {/* Step 1 — Contact */}
              {step === 1 && (
                <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-0">
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Contact Email"
                      required
                      error={form1.formState.errors.email?.message}
                    >
                      <Input
                        {...form1.register("email")}
                        type="email"
                        placeholder="hello@yourorg.com"
                        error={!!form1.formState.errors.email}
                      />
                    </Field>
                    <Field label="Phone Number">
                      <Input
                        {...form1.register("phone")}
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Street Address"
                    required
                    error={form1.formState.errors.address?.message}
                  >
                    <Input
                      {...form1.register("address")}
                      placeholder="123 Lavender Lane, Suite 200"
                      error={!!form1.formState.errors.address}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="City"
                      required
                      error={form1.formState.errors.city?.message}
                    >
                      <Input
                        {...form1.register("city")}
                        placeholder="Springfield"
                        error={!!form1.formState.errors.city}
                        onChange={(e) => {
                          form1.register("city").onChange(e);
                          updatePreview({ city: e.target.value });
                        }}
                      />
                    </Field>
                    <Field label="State / Province">
                      <Input
                        {...form1.register("state")}
                        placeholder="IL"
                        onChange={(e) => {
                          form1.register("state").onChange(e);
                          updatePreview({ state: e.target.value });
                        }}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="ZIP / Postal Code">
                      <Input {...form1.register("zip")} placeholder="62701" />
                    </Field>
                    <Field label="Country">
                      <Input {...form1.register("country")} placeholder="United States" />
                    </Field>
                  </div>

                  <StepNav step={step} onBack={goBack} isLast={false} isLoading={form1.formState.isSubmitting} />
                </form>
              )}

              {/* Step 2 — Account Setup */}
              {step === 2 && (
                <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-0">
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Your Full Name"
                      required
                      error={form2.formState.errors.adminName?.message}
                    >
                      <Input
                        {...form2.register("adminName")}
                        placeholder="Jane Smith"
                        error={!!form2.formState.errors.adminName}
                      />
                    </Field>
                    <Field
                      label="Admin Email"
                      required
                      error={form2.formState.errors.adminEmail?.message}
                    >
                      <Input
                        {...form2.register("adminEmail")}
                        type="email"
                        placeholder="jane@yourorg.com"
                        error={!!form2.formState.errors.adminEmail}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Password"
                    required
                    hint="At least 8 characters"
                    error={form2.formState.errors.adminPassword?.message}
                  >
                    <Input
                      {...form2.register("adminPassword")}
                      type="password"
                      placeholder="Create a secure password"
                      error={!!form2.formState.errors.adminPassword}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Number of Employees">
                      <NativeSelect
                        name="employees"
                        value={form2.watch("employees") ?? ""}
                        onChange={(v) => {
                          form2.setValue("employees", v);
                          updatePreview({ employees: v });
                        }}
                        options={EMP_RANGES}
                        placeholder="Select range"
                      />
                    </Field>
                    <Field label="Year Founded">
                      <Input
                        {...form2.register("founded")}
                        type="number"
                        min="1800"
                        max="2099"
                        placeholder="e.g. 2015"
                        onChange={(e) => {
                          form2.register("founded").onChange(e);
                          updatePreview({ founded: e.target.value });
                        }}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Tax ID / Registration Number"
                    hint="Optional — used for verification purposes only"
                  >
                    <Input {...form2.register("taxId")} placeholder="e.g. 12-3456789" />
                  </Field>

                  <Field
                    label="LinkedIn Page URL"
                    error={form2.formState.errors.linkedin?.message}
                  >
                    <Input
                      {...form2.register("linkedin")}
                      type="url"
                      placeholder="https://linkedin.com/company/your-org"
                    />
                  </Field>

                  <StepNav step={step} onBack={goBack} isLast={true} isLoading={form2.formState.isSubmitting} />
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Already have an account */}
          <p className="text-center text-sm text-text-soft mt-10">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// ---- Step navigation bar ----

function StepNav({
  step,
  onBack,
  isLast,
  isLoading,
}: {
  step: number;
  onBack: () => void;
  isLast: boolean;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-9 pt-6 border-t-2 border-partner-200">
      {/* Back */}
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={step === 0}
        className={step === 0 ? "opacity-0 pointer-events-none" : ""}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Dots */}
      <div className="flex gap-1.5 items-center">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: "8px",
              width: i === step ? "24px" : "8px",
              background: i === step ? "#4d41df" : i < step ? "#7a71ff" : "#e3dfff",
            }}
          />
        ))}
      </div>

      {/* Next / Submit */}
      {isLast ? (
        <Button type="submit" variant="pink" size="lg" loading={isLoading}>
          Register Organization 🌸
        </Button>
      ) : (
        <Button type="submit" size="default" loading={isLoading}>
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
