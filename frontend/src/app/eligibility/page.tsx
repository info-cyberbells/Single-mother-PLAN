"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Home,
  ShieldAlert,
  Briefcase,
  Calendar,
  Languages,
  Check,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
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

const INCOME_SOURCES_OPTIONS = [
  { id: "Job or wages", label: "Job or wages" },
  { id: "Self-employment", label: "Self-employment / freelance" },
  { id: "Child support", label: "Child support" },
  { id: "Alimony", label: "Alimony / spousal support" },
  { id: "SSI", label: "Social Security or SSI" },
  { id: "SSDI", label: "Disability (SSDI)" },
  { id: "Unemployment", label: "Unemployment benefits" },
  { id: "TANF", label: "TANF / cash assistance" },
  { id: "No income", label: "No income right now" },
];

export default function EligibilityPage() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Onboarding wizard friendly state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    state: "GA",
    zip_code: "",
    preferred_language: "English",
    housing_status: "renting",
    monthly_income: "",
    income_sources: [] as string[],
    employment_status: "full_time",
    household_size: 2,
    num_children: 1,
    children_birthdates: [] as string[],
    has_disability: false,
    is_pregnant: false,
    marital_status: "single",
    other_adults: false,
    monthly_rent: "",
    eviction_risk: false,
    needs_childcare: false,
    health_insurance: "none",
    chronic_illness: false,
    immigration_status: "citizen",
    domestic_violence: false,
    savings_assets: "none",
  });

  // Calculate dynamic steps description
  const totalSteps = 8;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Adjust child birthdates array if number of kids changes
      if (field === "num_children") {
        const count = parseInt(value) || 0;
        const currentDates = [...prev.children_birthdates];
        if (currentDates.length < count) {
          while (currentDates.length < count) {
            currentDates.push("");
          }
        } else if (currentDates.length > count) {
          currentDates.splice(count);
        }
        updated.children_birthdates = currentDates;
      }
      return updated;
    });
  };

  const toggleIncomeSource = (source: string) => {
    setFormData((prev) => {
      let sources = [...prev.income_sources];
      if (source === "No income") {
        sources = ["No income"];
      } else {
        sources = sources.filter((s) => s !== "No income");
        if (sources.includes(source)) {
          sources = sources.filter((s) => s !== source);
        } else {
          sources.push(source);
        }
      }
      return { ...prev, income_sources: sources };
    });
  };

  const handleChildDobChange = (index: number, val: string) => {
    setFormData((prev) => {
      const dates = [...prev.children_birthdates];
      dates[index] = val;
      return { ...prev, children_birthdates: dates };
    });
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return formData.first_name.trim().length > 0 && formData.last_name.trim().length > 0;
      case 2:
        return formData.zip_code.trim().length >= 5;
      case 5:
        return formData.monthly_income.trim().length > 0;
      default:
        return true;
    }
  };

  const runScan = async () => {
    setIsScanning(true);
    try {
      // 1. Calculate children ages based on birthdays
      const ages = formData.children_birthdates.map((dob) => {
        if (!dob) return 2; // Default fallback age
        const birth = new Date(dob);
        const diff = Date.now() - birth.getTime();
        const ageDate = new Date(diff);
        return Math.max(0, Math.abs(ageDate.getUTCFullYear() - 1970));
      });

      // 2. Put user profile API
      await api.put("/api/user/profile", {
        full_name: `${formData.first_name} ${formData.last_name}`,
        state: formData.state,
        zip_code: formData.zip_code,
        household_size: formData.household_size,
        num_children: formData.num_children,
        children_ages: ages,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        employment_status: formData.employment_status,
        housing_status: formData.housing_status,
        is_pregnant: formData.is_pregnant,
        has_disability: formData.has_disability || formData.chronic_illness,
        
        // Wiser Moms fields
        needs_childcare: formData.needs_childcare,
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        eviction_risk: formData.eviction_risk,
        domestic_violence: formData.domestic_violence,
        chronic_illness: formData.chronic_illness,
        immigration_status: formData.immigration_status,
        preferred_language: formData.preferred_language,
        marital_status: formData.marital_status,
        other_adults: formData.other_adults,
        income_sources: formData.income_sources,
        work_situation: formData.employment_status,
        health_insurance: formData.health_insurance,
        savings_assets: formData.savings_assets,
      });

      // 3. Trigger benefit match scan
      const scanRes = await api.post("/api/eligibility/scan");
      setResults(scanRes.data.data?.results || []);
      setScanComplete(true);
    } catch (err) {
      console.error("Benefit Scan Error:", err);
      if (!isAuthenticated) {
        router.push("/register?redirect=eligibility");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      runScan();
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  if (isScanning) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-primary-lg mx-auto">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-primary-500/20 blur-2xl animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-3xl text-on-surface mb-3">
            MomPlan Smart Scan
          </h2>
          <p className="text-on-surface-variant text-base mb-6 leading-relaxed">
            Running eligibility equations against 200+ local, state, and national program criteria for <b>{formData.first_name}</b>...
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-primary-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 pt-24 pb-16">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg mx-auto mb-6">
              <CheckCircle2 className="w-11 h-11 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-on-surface mb-3">
              🎉 Found matches for you, {formData.first_name}!
            </h1>
            <p className="text-on-surface-variant text-base max-w-lg mx-auto">
              Based on your details, your household qualifies or is likely qualified for **{qualified.length} benefit programs**.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 mb-8 text-left">
            {qualified.slice(0, 5).map((result: any) => (
              <Card key={result.id} padding="md" className="border-emerald-100 hover:border-emerald-300 transition-all bg-emerald-50/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-on-surface truncate">{result.program?.name}</div>
                    <div className="text-xs text-on-surface-variant">{result.program?.agency}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-emerald-600">
                      Up to ${result.program?.estimated_monthly_value_max || 0}/mo
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mt-1">
                      {result.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push("/dashboard/benefits")} className="bg-gradient-primary text-white font-bold px-8 shadow-primary">
                View Full Matches & Apply
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/register")} className="bg-gradient-primary text-white font-bold px-8 shadow-primary">
                  Save My Match Profile
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => router.push("/login")} className="hover:bg-surface-container">
                  Sign In to Access Dashboard
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16 px-4">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto">
        {/* Navigation & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-display font-black text-2xl text-on-surface">
              Mom<span className="text-gradient">Plan</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Conversational Match Assistant
          </div>
        </div>

        {/* Step Cards with Progress */}
        <Card className="shadow-glass-lg relative overflow-hidden bg-surface/80 backdrop-blur-xl border border-outline-variant/20 p-6 md:p-8">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-surface-container-low">
            <div
              className="h-full bg-gradient-primary transition-all duration-500 rounded-r-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="min-h-[300px] flex flex-col justify-between"
            >
              {/* Step 1: Nice to meet you! */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      First, what is your name, mama?
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Let's personalize your program scanning.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Maria"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rodriguez"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Language & Location */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Nice to meet you, {formData.first_name}! 🌟 Where do you live?
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Benefits vary heavily by state and regional zip codes.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">State</label>
                        <select
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                        >
                          {US_STATES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Zip Code</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="e.g. 30303"
                          value={formData.zip_code}
                          onChange={(e) => handleInputChange("zip_code", e.target.value.replace(/\D/g, ""))}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Preferred Language</label>
                      <select
                        value={formData.preferred_language}
                        onChange={(e) => handleInputChange("preferred_language", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Español (Spanish)</option>
                        <option value="Vietnamese">Tiếng Việt (Vietnamese)</option>
                        <option value="Chinese">中文 (Chinese)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Household Setup */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Tell us about your household size
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Household size includes yourself, children, and any other adults living with you.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {/* Household Size Counter */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                      <div>
                        <div className="font-bold text-base text-on-surface">Total Household Size</div>
                        <div className="text-xs text-on-surface-variant">Including you</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          disabled={formData.household_size <= 1}
                          onClick={() => handleInputChange("household_size", formData.household_size - 1)}
                          className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg font-bold hover:bg-surface-container disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-display font-black text-xl text-on-surface w-6 text-center">{formData.household_size}</span>
                        <button
                          type="button"
                          onClick={() => handleInputChange("household_size", formData.household_size + 1)}
                          className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg font-bold hover:bg-surface-container"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Children Counter */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                      <div>
                        <div className="font-bold text-base text-on-surface">Children under 18</div>
                        <div className="text-xs text-on-surface-variant">Living with you</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          disabled={formData.num_children <= 0}
                          onClick={() => handleInputChange("num_children", formData.num_children - 1)}
                          className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg font-bold hover:bg-surface-container disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-display font-black text-xl text-on-surface w-6 text-center">{formData.num_children}</span>
                        <button
                          type="button"
                          onClick={() => handleInputChange("num_children", formData.num_children + 1)}
                          className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg font-bold hover:bg-surface-container"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pregnant Checkbox */}
                    <label className="flex items-start gap-4 p-4 rounded-2xl border border-outline-variant/30 bg-rose-50/20 hover:bg-rose-50/40 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.is_pregnant}
                        onChange={(e) => handleInputChange("is_pregnant", e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded accent-rose-500 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-rose-800">Are you currently pregnant?</div>
                        <div className="text-xs text-rose-700/80 mt-0.5">
                          Highly important! Unlocks specific WIC nutrition packages and Medicaid pregnancy waivers.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Kids birthdates */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      When were your children born?
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Child care programs like Georgia CAPS and PeachCare require child birthdates to verify eligibility.
                    </p>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {formData.num_children === 0 ? (
                      <div className="text-center py-6 text-on-surface-variant text-sm font-medium">
                        No children under 18 in household. You can proceed directly.
                      </div>
                    ) : (
                      Array.from({ length: formData.num_children }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low">
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            Child {i + 1} Birthdate
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={formData.children_birthdates[i] || ""}
                              onChange={(e) => handleChildDobChange(i, e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Income & Work */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Let's look at household income
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      What is your total monthly household income before taxes? (wages, child support, assistance etc.)
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant font-bold text-lg">
                        $
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 2800"
                        value={formData.monthly_income}
                        onChange={(e) => handleInputChange("monthly_income", e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-lg transition-all font-black text-on-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Work Situation</label>
                      <select
                        value={formData.employment_status}
                        onChange={(e) => handleInputChange("employment_status", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      >
                        <option value="full_time">Employed Full-time</option>
                        <option value="part_time">Employed Part-time</option>
                        <option value="self_employed">Self-employed / Freelance</option>
                        <option value="unemployed">Currently Unemployed</option>
                        <option value="student">Active Student</option>
                        <option value="disabled">Receiving Disability Assistance</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Income Sources */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Where does your income come from?
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Tap all categories that apply to your household.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                    {INCOME_SOURCES_OPTIONS.map((option) => {
                      const active = formData.income_sources.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleIncomeSource(option.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                            active
                              ? "bg-rose-50 border-rose-400 text-rose-900 shadow-sm scale-[0.98]"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <span className="text-sm font-bold">{option.label}</span>
                          {active && (
                            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 7: Housing Setup */}
              {step === 7 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Tell us about your home setup
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Evaluates housing assistance (Section 8) and emergency relief program eligibility.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Housing Situation</label>
                      <select
                        value={formData.housing_status}
                        onChange={(e) => handleInputChange("housing_status", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      >
                        <option value="renting">Renting an apartment/home</option>
                        <option value="owning">Owning a home</option>
                        <option value="with_family">Living with family/friends</option>
                        <option value="subsidized_housing">Subsidized / Section 8 Housing</option>
                        <option value="homeless">Experiencing homelessness / temporary shelter</option>
                      </select>
                    </div>

                    {formData.housing_status === "renting" && (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Monthly Rent Contribution</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-on-surface-variant font-bold">$</span>
                          <input
                            type="number"
                            placeholder="e.g. 1100"
                            value={formData.monthly_rent}
                            onChange={(e) => handleInputChange("monthly_rent", e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                          />
                        </div>
                      </div>
                    )}

                    <label className="flex items-start gap-4 p-3.5 rounded-xl border border-outline-variant/30 bg-amber-50/20 hover:bg-amber-50/40 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.eviction_risk}
                        onChange={(e) => handleInputChange("eviction_risk", e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded accent-amber-500 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Immediate eviction risk?
                        </div>
                        <div className="text-xs text-amber-700/80 mt-0.5">
                          Select this if you have received an eviction notice. Bypasses general queues for rapid housing vouchers.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 8: Safety & Health Checks */}
              {step === 8 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display font-black text-2xl md:text-3xl text-on-surface leading-tight">
                      Special situations & assistance
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Critical factors used to trigger specific child care subsidies, health assistance, and safety support.
                    </p>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {/* Needs Childcare Check */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.needs_childcare}
                        onChange={(e) => handleInputChange("needs_childcare", e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded accent-primary-500 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-on-surface">Do you need childcare assistance?</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          For working or student moms needing help paying for daycare or afterschool programs.
                        </div>
                      </div>
                    </label>

                    {/* Chronic Illness Check */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.chronic_illness}
                        onChange={(e) => handleInputChange("chronic_illness", e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded accent-primary-500 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-on-surface">Chronic illness or disability?</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          Checks medical expense deductions and matches specialized healthcare assistance.
                        </div>
                      </div>
                    </label>

                    {/* Domestic Violence Safe Check */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-outline-variant/30 bg-red-50/20 hover:bg-red-50/40 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.domestic_violence}
                        onChange={(e) => handleInputChange("domestic_violence", e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded accent-red-500 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-red-800 flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" /> Safety & domestic abuse support?
                        </div>
                        <div className="text-xs text-red-700/80 mt-0.5">
                          Triggers safe housing, emergency food vouchers, and immediate legal protection services.
                        </div>
                      </div>
                    </label>

                    {/* Citizenship check */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Citizenship / Immigration Status</label>
                      <select
                        value={formData.immigration_status}
                        onChange={(e) => handleInputChange("immigration_status", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-base transition-all font-medium text-on-surface"
                      >
                        <option value="citizen">US Citizen</option>
                        <option value="eligible_non_citizen">Permanent Resident (Green Card) / Eligible Non-Citizen</option>
                        <option value="daca">DACA Recipient</option>
                        <option value="visa_holder">Other Visa Holder / Non-Citizen</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-outline-variant/10 justify-between items-center">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <Button
                  type="button"
                  size="md"
                  disabled={!canContinue()}
                  onClick={nextStep}
                  className="bg-gradient-primary text-white font-bold px-6 shadow-primary disabled:opacity-50"
                >
                  {step === totalSteps ? (
                    <>
                      Run Smart Match
                      <Sparkles className="w-4 h-4 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Informative Security Footer */}
        <p className="text-center text-[10px] text-on-surface-variant/80 mt-6 max-w-sm mx-auto leading-relaxed">
          Step {step} of {totalSteps} • Your answers are encrypted and strictly secure. We use this information solely to verify eligibility equations under US Code standards.
        </p>
      </div>
    </div>
  );
}
