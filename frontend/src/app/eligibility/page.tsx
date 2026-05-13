"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Heart,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  DollarSign,
  MapPin,
  Baby,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "Full-time employed" },
  { value: "part_time", label: "Part-time employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "unemployed", label: "Currently unemployed" },
  { value: "student", label: "Student" },
  { value: "disabled", label: "Receiving disability benefits" },
  { value: "retired", label: "Retired" },
];

const HOUSING_OPTIONS = [
  { value: "renting", label: "Renting" },
  { value: "owning", label: "Own my home" },
  { value: "with_family", label: "Living with family" },
  { value: "subsidized_housing", label: "Subsidized / Section 8 housing" },
  { value: "homeless", label: "Experiencing homelessness" },
];

const eligibilitySchema = z.object({
  household_size: z.string().min(1, "Required"),
  num_children: z.string().min(1, "Required"),
  monthly_income: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  employment_status: z.string().min(1, "Required"),
  citizenship_status: z.string().min(1, "Required"),
  housing_status: z.string().min(1, "Required"),
  is_pregnant: z.boolean().optional(),
  has_disability: z.boolean().optional(),
});

type EligibilityFormData = z.infer<typeof eligibilitySchema>;

const steps = [
  { id: 1, title: "Family Size", description: "Tell us about your household", icon: Users },
  { id: 2, title: "Income", description: "Your household income info", icon: DollarSign },
  { id: 3, title: "Location & Status", description: "State and citizenship details", icon: MapPin },
  { id: 4, title: "Additional Info", description: "Final details for better matches", icon: Baby },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 ${step.id < steps.length ? "flex-1" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step.id < current
                  ? "bg-emerald-500 text-white"
                  : step.id === current
                  ? "bg-gradient-primary text-white shadow-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {step.id < current ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : (
                step.id
              )}
            </div>
            {step.id < steps.length && (
              <div className="flex-1 h-0.5 mx-2">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                  style={{ width: step.id < current ? "100%" : "0%" }}
                />
                <div className="h-full bg-surface-container rounded-full -mt-0.5 -z-10 relative" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <span
            key={step.id}
            className={`text-xs font-medium hidden sm:block ${
              step.id === current ? "text-primary-600" : "text-on-surface-variant"
            }`}
            style={{ width: "25%" }}
          >
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EligibilityPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<EligibilityFormData>({
    resolver: zodResolver(eligibilitySchema),
    defaultValues: {
      is_pregnant: false,
      has_disability: false,
    },
  });

  const nextStep = async () => {
    const fieldsPerStep: Record<number, (keyof EligibilityFormData)[]> = {
      1: ["household_size", "num_children"],
      2: ["monthly_income", "employment_status"],
      3: ["state", "citizenship_status", "housing_status"],
      4: [],
    };

    const valid = await trigger(fieldsPerStep[currentStep]);
    if (valid) setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = async (data: EligibilityFormData) => {
    setIsScanning(true);

    try {
      // Save/update family profile
      await api.put("/api/user/profile", {
        household_size: parseInt(data.household_size),
        num_children: parseInt(data.num_children),
        monthly_income: parseFloat(data.monthly_income),
        employment_status: data.employment_status,
        citizenship_status: data.citizenship_status === "yes",
        housing_status: data.housing_status,
        is_pregnant: data.is_pregnant,
        has_disability: data.has_disability,
        state: data.state,
      });

      // Run AI eligibility scan
      const scanRes = await api.post("/api/eligibility/scan");
      setResults(scanRes.data.data?.results || []);
      setScanComplete(true);
    } catch (err: any) {
      // If not authenticated, redirect to register
      if (!isAuthenticated) {
        router.push("/register?redirect=eligibility");
      }
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  if (isScanning) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary-lg mx-auto">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-2">
            AI Eligibility Scan Running...
          </h2>
          <p className="text-on-surface-variant">
            Analyzing your profile against 200+ federal and state programs
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scanComplete) {
    const qualified = results.filter((r) =>
      ["qualified", "likely_qualified"].includes(r.status)
    );
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-on-surface mb-2">
              🎉 Great news, {qualified.length} programs matched!
            </h1>
            <p className="text-on-surface-variant">
              Your family may qualify for these government benefits programs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 mb-8 text-left">
            {qualified.slice(0, 4).map((result: any) => (
              <Card key={result.id} padding="sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-on-surface">{result.program?.name}</div>
                    <div className="text-xs text-on-surface-variant">{result.program?.agency}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    Up to ${result.program?.estimated_monthly_value_max || 0}/mo
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push("/dashboard/benefits")}>
                View Full Results
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/register")}>
                  Save My Results — Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => router.push("/login")}>
                  Sign In to Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-xl text-on-surface">
              Mom<span className="text-gradient">Plan</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-on-surface mb-2">
            Find Your Family Benefits
          </h1>
          <p className="text-on-surface-variant">
            Takes less than 3 minutes • Completely free • No credit card
          </p>
        </div>

        {/* Progress */}
        <ProgressBar current={currentStep} total={steps.length} />

        {/* Form Step */}
        <Card padding="lg" className="shadow-glass-lg">
          <AnimatePresence mode="wait">
            <motion.form
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit(onSubmit)}
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                      About Your Household
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      This helps us find the right programs for your family size.
                    </p>
                  </div>
                  <Select
                    label="Total household size"
                    placeholder="Select..."
                    error={errors.household_size?.message}
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1} ${i === 0 ? "person" : "people"}`,
                    }))}
                    required
                    {...register("household_size")}
                  />
                  <Select
                    label="Number of children under 18"
                    placeholder="Select..."
                    error={errors.num_children?.message}
                    options={Array.from({ length: 11 }, (_, i) => ({
                      value: String(i),
                      label: i === 0 ? "No children" : `${i} ${i === 1 ? "child" : "children"}`,
                    }))}
                    required
                    {...register("num_children")}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                      Income & Employment
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Used only for eligibility matching — we never store unnecessarily.
                    </p>
                  </div>
                  <Input
                    label="Approximate monthly household income"
                    type="number"
                    placeholder="e.g. 3500"
                    leftIcon={<DollarSign className="w-4 h-4" />}
                    hint="Include all income sources (wages, child support, benefits)"
                    error={errors.monthly_income?.message}
                    required
                    {...register("monthly_income")}
                  />
                  <Select
                    label="Current employment status"
                    placeholder="Select..."
                    error={errors.employment_status?.message}
                    options={EMPLOYMENT_OPTIONS}
                    required
                    {...register("employment_status")}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                      Location & Status
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Many programs vary significantly by state.
                    </p>
                  </div>
                  <Select
                    label="State of residence"
                    placeholder="Select your state..."
                    error={errors.state?.message}
                    options={US_STATES}
                    required
                    {...register("state")}
                  />
                  <Select
                    label="Citizenship / immigration status"
                    placeholder="Select..."
                    error={errors.citizenship_status?.message}
                    options={[
                      { value: "yes", label: "US Citizen or permanent resident" },
                      { value: "no", label: "Non-citizen / visa holder" },
                      { value: "daca", label: "DACA recipient" },
                    ]}
                    required
                    {...register("citizenship_status")}
                  />
                  <Select
                    label="Current housing status"
                    placeholder="Select..."
                    error={errors.housing_status?.message}
                    options={HOUSING_OPTIONS}
                    required
                    {...register("housing_status")}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                      Additional Details
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      These factors can unlock more program matches.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded accent-primary-500"
                      {...register("is_pregnant")}
                    />
                    <div>
                      <div className="font-medium text-sm text-on-surface">Currently pregnant</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Unlocks WIC, Medicaid pregnancy coverage, and other prenatal programs
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded accent-primary-500"
                      {...register("has_disability")}
                    />
                    <div>
                      <div className="font-medium text-sm text-on-surface">
                        Have a disability or family member with disability
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Includes SSI, SSDI, and state disability assistance programs
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 border border-primary-200">
                    <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                    <p className="text-xs text-primary-700">
                      Your data is encrypted and never shared. We use it only to match you with eligible programs.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className={`flex gap-3 mt-8 ${currentStep > 1 ? "justify-between" : "justify-end"}`}>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep((s) => s - 1)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}

                {currentStep < 4 ? (
                  <Button type="button" size="md" onClick={nextStep}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" size="lg" className="px-10">
                    Run Eligibility Scan
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.form>
          </AnimatePresence>
        </Card>

        <p className="text-center text-xs text-on-surface-variant mt-6 opacity-70">
          Step {currentStep} of {steps.length} • Free scan, no credit card required
        </p>
      </div>
    </div>
  );
}
