"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
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
  Check,
  Plus,
  Minus,
  User,
  Phone,
  Mail,
  Scale,
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

const SECTIONS = [
  { id: 1, label: "Personal Info",  icon: User,       emoji: "🧍", color: "from-violet-500 to-indigo-500" },
  { id: 2, label: "Income & Assets", icon: DollarSign, emoji: "💰", color: "from-emerald-500 to-teal-500" },
  { id: 3, label: "Your Family",    icon: Users,       emoji: "👨‍👩‍👧", color: "from-pink-500 to-rose-500" },
  { id: 4, label: "Housing",        icon: Home,        emoji: "🏠", color: "from-amber-500 to-orange-500" },
  { id: 5, label: "Childcare",      icon: Baby,        emoji: "🧸", color: "from-sky-500 to-blue-500" },
  { id: 6, label: "Health",         icon: Heart,       emoji: "🏥", color: "from-red-500 to-rose-600" },
  { id: 7, label: "Legal",          icon: Scale,       emoji: "⚖️", color: "from-slate-600 to-gray-700" },
];

const INCOME_SOURCES = [
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

const WORK_SITUATIONS = [
  { id: "full_time", label: "Working full-time (35+ hrs/week)" },
  { id: "part_time", label: "Working part-time (under 35 hrs/week)" },
  { id: "self_employed", label: "Self-employed" },
  { id: "unemployed", label: "Unemployed — looking for work" },
  { id: "disabled", label: "Not working due to disability" },
  { id: "caretaker", label: "Not working — caring for children" },
  { id: "student", label: "In school or job training" },
];

const OTHER_EARNERS = [
  { id: "none", label: "No — I'm the only earner" },
  { id: "partner", label: "Yes — a partner or spouse works" },
  { id: "adult", label: "Yes — another adult in the home earns income" },
  { id: "unsure", label: "Not sure" },
];

const SAVINGS_OPTIONS = [
  { id: "none", label: "No bank account" },
  { id: "checking_low", label: "Checking account only (under $2,750)" },
  { id: "savings_low", label: "Savings under $2,750" },
  { id: "savings_high", label: "Savings over $2,750" },
  { id: "investments", label: "Investments or retirement accounts" },
  { id: "prefer_not", label: "Prefer not to say" },
];

const CHILD_SUPPORT_OPTIONS = [
  { id: "regular", label: "Yes — I receive regular payments" },
  { id: "inconsistent", label: "Yes — but payments are inconsistent" },
  { id: "no_receive", label: "No — I'm owed support but don't receive it" },
  { id: "no_arrangement", label: "No child support arrangement" },
];

const MARITAL_OPTIONS = [
  { id: "single", label: "Single / never married" },
  { id: "married", label: "Married / partnered" },
  { id: "separated", label: "Separated" },
  { id: "divorced", label: "Divorced" },
  { id: "widowed", label: "Widowed" },
];

const HOUSING_OPTIONS = [
  { id: "renting", label: "Renting an apartment or house" },
  { id: "with_family", label: "Living with family or friends (no lease)" },
  { id: "shelter", label: "Staying in a shelter or transitional housing" },
  { id: "hotel", label: "Living in a hotel or motel" },
  { id: "homeless", label: "Experiencing homelessness" },
  { id: "owning", label: "Own my home" },
];

const CHILDCARE_PROVIDER_OPTIONS = [
  { id: "licensed_center", label: "Yes — a licensed daycare center" },
  { id: "licensed_home", label: "Yes — a licensed home provider" },
  { id: "family_member", label: "Yes — a family member (licensed)" },
  { id: "need_help", label: "Not yet — I need help finding one" },
  { id: "school", label: "My child is in school (before/after care needed)" },
];

const WORK_HOURS_OPTIONS = [
  { id: "weekdays", label: "Monday–Friday, daytime" },
  { id: "evenings", label: "Evenings or nights" },
  { id: "weekends", label: "Weekends" },
  { id: "rotating", label: "Rotating or irregular shifts" },
  { id: "varies", label: "Varies week to week" },
  { id: "not_working", label: "Currently not working" },
];

const HEALTH_INSURANCE_OPTIONS = [
  { id: "none", label: "No — I have no health coverage" },
  { id: "employer", label: "Yes — through my employer" },
  { id: "marketplace", label: "Yes — I bought a marketplace plan" },
  { id: "medicaid", label: "Yes — I already have Medicaid" },
  { id: "medicare", label: "Yes — Medicare" },
  { id: "unsure", label: "Not sure" },
];

const IMMIGRATION_OPTIONS = [
  { id: "citizen", label: "U.S. Citizen" },
  { id: "eligible_non_citizen", label: "Lawful Permanent Resident (Green Card)" },
  { id: "refugee", label: "Refugee / Asylee" },
  { id: "daca", label: "DACA recipient" },
  { id: "visa_holder", label: "Visa holder (work, student, or other)" },
  { id: "undocumented", label: "Undocumented / No status" },
  { id: "prefer_not", label: "Prefer not to say" },
];

const LEGAL_ISSUES_OPTIONS = [
  { id: "eviction", label: "Eviction or threat of eviction" },
  { id: "custody", label: "Child custody or visitation" },
  { id: "domestic_violence", label: "Domestic violence / protective order" },
  { id: "divorce", label: "Divorce or separation" },
  { id: "child_support", label: "Child support issues" },
  { id: "immigration", label: "Immigration or DACA issue" },
  { id: "benefits_denial", label: "Benefits denial or appeal" },
  { id: "debt_collection", label: "Debt collection" },
  { id: "none", label: "None of these" },
];

const URGENCY_OPTIONS = [
  { id: "emergency", label: "Emergency — I need help today or tomorrow", desc: "Emergency cases get same-day intake" },
  { id: "urgent", label: "Urgent — court date or deadline within 2 weeks", desc: "Prioritized legal screening" },
  { id: "soon", label: "Soon — within the next month", desc: "Standard screening queue" },
  { id: "not_urgent", label: "Not urgent — planning ahead", desc: "General information & templates" },
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Mandarin", "Vietnamese", "Arabic", "Haitian Creole", "Other"];

// Helper component: pill toggle button
function PillButton({ active, onClick, children, className = "" }: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all select-none ${
        active
          ? "bg-primary-600 border-primary-600 text-white shadow-sm"
          : "bg-white border-outline-variant/50 text-on-surface-variant hover:border-primary-400 hover:text-primary-700"
      } ${className}`}
    >
      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}

// Helper: Yes/No pair
function YesNo({ value, onChange, yesLabel = "Yes", noLabel = "No" }: {
  value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all ${
          value === true ? "bg-primary-50 border-primary-500 text-primary-700" : "bg-white border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"
        }`}
      >{yesLabel}</button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all ${
          value === false ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"
        }`}
      >{noLabel}</button>
    </div>
  );
}

// Counter component
function Counter({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-4">
      <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
        className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-40 transition-colors">
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-display font-black text-xl text-on-surface w-8 text-center">{value}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-40 transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// Label wrapper
function FieldLabel({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-2">
      <div className="font-bold text-sm text-on-surface">{children}</div>
      {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  );
}

// Input
function Input({ placeholder, value, onChange, type = "text", maxLength, inputMode }: {
  placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; maxLength?: number; inputMode?: any;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all font-medium text-on-surface placeholder:text-on-surface-variant/60"
    />
  );
}

// Dollar input
function DollarInput({ placeholder, value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-on-surface-variant font-bold text-sm pointer-events-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder || "0"}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all font-medium text-on-surface"
      />
    </div>
  );
}

export default function EligibilityPage() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { isAuthenticated, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Personal Info
    first_name: "",
    last_name: "",
    date_of_birth: "",
    ssn_last_four: "",
    phone: "",
    email: "",
    preferred_language: "English",
    street_address: "",
    city: "",
    state: "GA",
    zip_code: "",
    // Income & Assets
    monthly_income: "",
    income_sources: [] as string[],
    employment_status: "full_time",
    employer_name: "",
    other_earners: "none",
    savings_assets: "none",
    child_support_status: "no_arrangement",
    // Family
    household_size: 1,
    num_children: 0,
    children_birthdates: [] as string[],
    has_disability: null as boolean | null,
    is_pregnant: null as boolean | null,
    marital_status: "single",
    other_adults: null as boolean | null,
    // Housing
    housing_status: "renting",
    monthly_rent: "",
    monthly_utilities: "",
    landlord_name: "",
    eviction_risk: null as boolean | null,
    // Childcare
    needs_childcare: null as boolean | null,
    childcare_preference: "",
    childcare_provider: "",
    monthly_childcare_cost: "",
    work_hours: "",
    // Health
    health_insurance: "none",
    chronic_illness: null as boolean | null,
    er_visit: null as boolean | null,
    immigration_status: "citizen",
    // Legal
    legal_issues: [] as string[],
    urgency: "not_urgent",
    domestic_violence: null as boolean | null,
  });

  const set = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleMulti = (field: "income_sources" | "legal_issues", id: string, exclusiveId?: string) => {
    setFormData((prev) => {
      let arr = [...(prev[field] as string[])];
      if (id === exclusiveId || (exclusiveId && arr.includes(exclusiveId) && id !== exclusiveId)) {
        if (id === exclusiveId) { arr = [id]; }
        else { arr = arr.filter(x => x !== exclusiveId); if (arr.includes(id)) arr = arr.filter(x => x !== id); else arr.push(id); }
      } else {
        if (arr.includes(id)) arr = arr.filter(x => x !== id);
        else arr.push(id);
      }
      return { ...prev, [field]: arr };
    });
  };

  const setNumChildren = (n: number) => {
    const count = Math.max(0, n);
    setFormData((prev) => {
      const dates = [...prev.children_birthdates];
      while (dates.length < count) dates.push("");
      return { ...prev, num_children: count, children_birthdates: dates.slice(0, count) };
    });
  };

  const runScan = async () => {
    setIsScanning(true);
    try {
      const ages = formData.children_birthdates.map((dob) => {
        if (!dob) return 2;
        const birth = new Date(dob);
        if (isNaN(birth.getTime())) return 2;
        const diff = Date.now() - birth.getTime();
        return Math.max(0, Math.abs(new Date(diff).getUTCFullYear() - 1970));
      });

      const profileRes = await api.put("/api/user/profile", {
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        phone: formData.phone,
        email: formData.email,
        state: formData.state,
        zip_code: formData.zip_code,
        street_address: formData.street_address,
        city: formData.city,
        household_size: formData.household_size,
        num_children: formData.num_children,
        children_ages: ages,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        employment_status: formData.employment_status,
        housing_status: formData.housing_status,
        is_pregnant: formData.is_pregnant ?? false,
        has_disability: formData.has_disability ?? false,
        needs_childcare: formData.needs_childcare ?? false,
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        monthly_utilities: parseFloat(formData.monthly_utilities) || 0,
        eviction_risk: formData.eviction_risk ?? false,
        domestic_violence: formData.domestic_violence ?? false,
        chronic_illness: formData.chronic_illness ?? false,
        immigration_status: formData.immigration_status,
        date_of_birth: formData.date_of_birth || null,
        ssn_last_four: formData.ssn_last_four || null,
        preferred_language: formData.preferred_language,
        marital_status: formData.marital_status,
        other_adults: formData.other_adults ?? false,
        income_sources: formData.income_sources,
        work_situation: formData.employment_status,
        employer_name: formData.employer_name,
        health_insurance: formData.health_insurance,
        savings_assets: formData.savings_assets,
        monthly_childcare_cost: formData.needs_childcare ? (parseFloat(formData.monthly_childcare_cost) || 0) : null,
        childcare_preference: formData.childcare_preference,
        childcare_provider: formData.childcare_provider,
        legal_issues: formData.legal_issues,
        urgency: formData.urgency,
        child_support_status: formData.child_support_status,
      });
      updateUser(profileRes.data.data);

      const scanRes = await api.post("/api/eligibility/scan");
      setResults(scanRes.data.data || []);
      queryClient.invalidateQueries({ queryKey: ["eligibility-results"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setScanComplete(true);
    } catch (err) {
      console.error("Benefit Scan Error:", err);
      if (!isAuthenticated) router.push("/register?redirect=eligibility");
    } finally {
      setIsScanning(false);
    }
  };

  const currentSection = SECTIONS.find(s => s.id === step)!;

  // ─── Loading ───────────────────────────────────────────
  if (isScanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl mx-auto">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-indigo-400/20 blur-2xl animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-3xl text-on-surface mb-3">MomPlan Smart Scan</h2>
          <p className="text-on-surface-variant text-base mb-6 leading-relaxed">
            Running eligibility checks against 200+ programs for <b>{formData.first_name || "you"}</b>…
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Results ───────────────────────────────────────────
  if (scanComplete) {
    const qualified = results.filter((r) => ["qualified", "likely_qualified"].includes(r.status));
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 pt-24 pb-16">
        <div className="max-w-2xl w-full text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg mx-auto mb-6">
              <CheckCircle2 className="w-11 h-11 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-on-surface mb-3">
              🎉 Found {qualified.length} matches for you{formData.first_name ? `, ${formData.first_name}` : ""}!
            </h1>
            <p className="text-on-surface-variant text-base max-w-lg mx-auto">
              Based on your details, your household qualifies or is likely qualified for {qualified.length} benefit programs.
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
                    <div className="text-sm font-black text-emerald-600">Up to ${result.program?.estimated_monthly_value_max || 0}/mo</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mt-1">
                      {result.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push("/dashboard/benefits")} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-8 shadow-lg">
                View Full Matches & Apply <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/register")} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8 shadow-lg">
                  Save My Match Profile <ArrowRight className="w-5 h-5 ml-1" />
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

  // ─── Main Form ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40 pt-6 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-black text-lg text-on-surface">Mom<span className="text-violet-600">Plan</span></span>
          </Link>
          <span className="text-xs font-bold text-on-surface-variant bg-white px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
            Section {step} of {SECTIONS.length}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
            animate={{ width: `${(step / SECTIONS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Section Tab Bar */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0 min-w-[72px] ${
                  isActive
                    ? "bg-white border-violet-300 shadow-md text-violet-700"
                    : isDone
                    ? "bg-violet-50 border-violet-200 text-violet-500"
                    : "bg-white/60 border-outline-variant/30 text-on-surface-variant hover:bg-white hover:border-outline-variant"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm" :
                  isDone ? "bg-violet-200 text-violet-600" : "bg-surface-container text-on-surface-variant"
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-bold leading-tight text-center ${isActive ? "text-violet-700" : ""}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
          >
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-lg overflow-hidden">
              {/* Section Header */}
              <div className={`bg-gradient-to-r ${currentSection.color} px-6 py-5`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentSection.emoji}</span>
                  <div>
                    <h2 className="font-display font-bold text-xl text-white">{currentSection.label}</h2>
                    <p className="text-white/80 text-xs mt-0.5">
                      {step === 1 && "Your state, identity, contact, and address."}
                      {step === 2 && "Income, savings, and child support drive eligibility for most programs."}
                      {step === 3 && "Your household composition."}
                      {step === 4 && "Housing costs and stability."}
                      {step === 5 && "Childcare needs and current arrangements."}
                      {step === 6 && "Coverage and care needs."}
                      {step === 7 && "Civil legal issues we can route to free legal aid."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* ═══ SECTION 1: PERSONAL INFO ═══ */}
                {step === 1 && (
                  <>
                    <div>
                      <FieldLabel sub="Programs, agencies, and application portals depend on your state.">
                        Which state should we use for your benefits search? *
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {["GA", "NC"].map((s) => (
                          <PillButton key={s} active={formData.state === s} onClick={() => set("state", s)}>
                            {s === "GA" ? "Georgia" : "North Carolina"}
                          </PillButton>
                        ))}
                        <PillButton active={!["GA", "NC"].includes(formData.state)} onClick={() => {}}>
                          <span className="text-xs">Other state</span>
                        </PillButton>
                        {!["GA", "NC"].includes(formData.state) && (
                          <select
                            value={formData.state}
                            onChange={(e) => set("state", e.target.value)}
                            className="ml-1 px-3 py-1.5 rounded-lg border border-outline-variant text-sm bg-white focus:border-primary-500 outline-none"
                          >
                            {US_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>What's your first name? *</FieldLabel>
                        <Input placeholder="Maria" value={formData.first_name} onChange={(v) => set("first_name", v)} />
                      </div>
                      <div>
                        <FieldLabel>What's your last name? *</FieldLabel>
                        <Input placeholder="Garcia" value={formData.last_name} onChange={(v) => set("last_name", v)} />
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Required for identity verification on all applications.">What's your date of birth? *</FieldLabel>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => set("date_of_birth", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all font-medium text-on-surface"
                      />
                    </div>

                    <div>
                      <FieldLabel sub="Used only for identity verification. Never stored or shared.">
                        Last 4 digits of your Social Security Number
                      </FieldLabel>
                      <Input placeholder="••••" value={formData.ssn_last_four} onChange={(v) => set("ssn_last_four", v.replace(/\D/g, "").slice(0, 4))} maxLength={4} inputMode="numeric" />
                    </div>

                    <div>
                      <FieldLabel sub="Agencies will call or text this number about your application.">What's the best phone number to reach you?</FieldLabel>
                      <Input placeholder="(512) 555-0100" value={formData.phone} onChange={(v) => set("phone", v)} type="tel" />
                    </div>

                    <div>
                      <FieldLabel sub="For application confirmations and renewal reminders.">What's your email address?</FieldLabel>
                      <Input placeholder="maria@email.com" value={formData.email} onChange={(v) => set("email", v)} type="email" />
                    </div>

                    <div>
                      <FieldLabel sub="All agencies offer services in multiple languages.">What language do you prefer for communications?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <PillButton key={lang} active={formData.preferred_language === lang} onClick={() => set("preferred_language", lang)}>
                            {lang}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>What's your street address? *</FieldLabel>
                      <Input placeholder="123 Main Street, Apt 4B" value={formData.street_address} onChange={(v) => set("street_address", v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>What city do you live in? *</FieldLabel>
                        <Input placeholder="Austin" value={formData.city} onChange={(v) => set("city", v)} />
                      </div>
                      <div>
                        <FieldLabel>And your ZIP code? *</FieldLabel>
                        <Input placeholder="78701" value={formData.zip_code} onChange={(v) => set("zip_code", v.replace(/\D/g, "").slice(0, 5))} maxLength={5} inputMode="numeric" />
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ SECTION 2: INCOME & ASSETS ═══ */}
                {step === 2 && (
                  <>
                    <div>
                      <FieldLabel sub="Include wages, child support, disability, Social Security — all income sources.">
                        What's your total monthly income before taxes? *
                      </FieldLabel>
                      <DollarInput placeholder="2,200" value={formData.monthly_income} onChange={(v) => set("monthly_income", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Tap all that apply.">Where does your income come from?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {INCOME_SOURCES.map((opt) => (
                          <PillButton
                            key={opt.id}
                            active={formData.income_sources.includes(opt.id)}
                            onClick={() => toggleMulti("income_sources", opt.id, "No income")}
                          >
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>What's your current work situation? *</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {WORK_SITUATIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.employment_status === opt.id} onClick={() => set("employment_status", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Leave blank if self-employed or between jobs.">What's your employer's name?</FieldLabel>
                      <Input placeholder="Walmart / Self-employed / N/A" value={formData.employer_name} onChange={(v) => set("employer_name", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="All household income is combined for eligibility purposes.">Does anyone else in your household have income?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {OTHER_EARNERS.map((opt) => (
                          <PillButton key={opt.id} active={formData.other_earners === opt.id} onClick={() => set("other_earners", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="SNAP may have resource limits; many other programs do not use an asset test.">
                        Do you have any savings or bank accounts?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {SAVINGS_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.savings_assets === opt.id} onClick={() => set("savings_assets", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Child support counts as income. If you're owed support but not receiving it, legal aid can help.">
                        Do you receive child support payments?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {CHILD_SUPPORT_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.child_support_status === opt.id} onClick={() => set("child_support_status", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ SECTION 3: YOUR FAMILY ═══ */}
                {step === 3 && (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <div>
                        <div className="font-bold text-sm text-on-surface">Including yourself, how many people live in your household? *</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Count everyone who lives with you and shares meals or expenses.</div>
                      </div>
                      <Counter value={formData.household_size} onChange={(v) => set("household_size", Math.max(1, v))} min={1} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <div>
                        <div className="font-bold text-sm text-on-surface">How many children under 18 live with you? *</div>
                      </div>
                      <Counter value={formData.num_children} onChange={setNumChildren} min={0} />
                    </div>

                    {formData.num_children > 0 && (
                      <div className="space-y-2">
                        <FieldLabel>Children's birthdates</FieldLabel>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                          {Array.from({ length: formData.num_children }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl border border-outline-variant/30 bg-surface-container-low">
                              <span className="text-xs font-bold text-on-surface-variant shrink-0 w-16">Child {i + 1}</span>
                              <input
                                type="date"
                                value={formData.children_birthdates[i] || ""}
                                onChange={(e) => {
                                  const dates = [...formData.children_birthdates];
                                  dates[i] = e.target.value;
                                  set("children_birthdates", dates);
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-outline-variant bg-white focus:border-primary-500 outline-none text-sm font-medium text-on-surface"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <FieldLabel sub="Some programs offer higher benefit amounts for children with disabilities.">
                        Does any child in your home have a disability or special needs?
                      </FieldLabel>
                      <YesNo value={formData.has_disability} onChange={(v) => set("has_disability", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Pregnancy can matter for Medicaid and SNAP.">Are you currently pregnant?</FieldLabel>
                      <YesNo value={formData.is_pregnant} onChange={(v) => set("is_pregnant", v)} />
                    </div>

                    <div>
                      <FieldLabel>What's your marital status?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {MARITAL_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.marital_status === opt.id} onClick={() => set("marital_status", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Other adults' income may affect eligibility for some programs.">
                        Are there any other adults (18+) living in your home?
                      </FieldLabel>
                      <YesNo value={formData.other_adults} onChange={(v) => set("other_adults", v)} />
                    </div>
                  </>
                )}

                {/* ═══ SECTION 4: HOUSING ═══ */}
                {step === 4 && (
                  <>
                    <div>
                      <FieldLabel sub="This helps route your application — it doesn't affect eligibility.">
                        Which best describes your current housing situation?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {HOUSING_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.housing_status === opt.id} onClick={() => set("housing_status", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Enter $0 if you pay nothing (staying with family, shelter, etc.).">
                        How much do you pay each month for rent?
                      </FieldLabel>
                      <DollarInput placeholder="950" value={formData.monthly_rent} onChange={(v) => set("monthly_rent", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Utility costs are a deduction in the SNAP formula — they help you qualify for more.">
                        How much do you pay monthly for utilities? (electric, gas, water)
                      </FieldLabel>
                      <DollarInput placeholder="120" value={formData.monthly_utilities} onChange={(v) => set("monthly_utilities", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Often needed for Housing Choice Voucher (Section 8) paperwork.">
                        What's your landlord's name or property company?
                      </FieldLabel>
                      <Input placeholder="Sunrise Properties LLC" value={formData.landlord_name} onChange={(v) => set("landlord_name", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="This can qualify you for emergency housing priority and free legal help.">
                        Have you received an eviction notice or are you at risk of losing your home?
                      </FieldLabel>
                      <YesNo value={formData.eviction_risk} onChange={(v) => set("eviction_risk", v)} />
                    </div>
                  </>
                )}

                {/* ═══ SECTION 5: CHILDCARE ═══ */}
                {step === 5 && (
                  <>
                    <div>
                      <FieldLabel>Are you currently paying for childcare, or do you need it to keep working?</FieldLabel>
                      <YesNo value={formData.needs_childcare} onChange={(v) => set("needs_childcare", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Subsidy programs work with licensed centers, home providers, and some relatives who meet licensing rules.">
                        Do you have a childcare provider in mind?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {CHILDCARE_PROVIDER_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.childcare_preference === opt.id} onClick={() => set("childcare_preference", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Leave blank if you haven't chosen one yet.">What's the name of your childcare provider or center?</FieldLabel>
                      <Input placeholder="Sunshine Learning Center" value={formData.childcare_provider} onChange={(v) => set("childcare_provider", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="The higher the cost, the more subsidy you may receive.">
                        How much do you currently pay (or expect to pay) for childcare each month?
                      </FieldLabel>
                      <DollarInput placeholder="900" value={formData.monthly_childcare_cost} onChange={(v) => set("monthly_childcare_cost", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Subsidies usually need proof of work, school, or training hours.">What are your typical work hours?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {WORK_HOURS_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.work_hours === opt.id} onClick={() => set("work_hours", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ SECTION 6: HEALTH ═══ */}
                {step === 6 && (
                  <>
                    <div>
                      <FieldLabel>Do you currently have any health insurance?</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {HEALTH_INSURANCE_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.health_insurance === opt.id} onClick={() => set("health_insurance", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="This may qualify you for expanded coverage or higher priority.">
                        Does anyone in your household have a chronic illness or disability?
                      </FieldLabel>
                      <YesNo value={formData.chronic_illness} onChange={(v) => set("chronic_illness", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Emergency Medicaid rules vary by state.">
                        Has anyone had an ER visit or hospital stay in the past 6 months?
                      </FieldLabel>
                      <YesNo value={formData.er_visit} onChange={(v) => set("er_visit", v)} />
                    </div>

                    <div>
                      <FieldLabel sub="Some programs have residency requirements. Your answer is never shared.">
                        What's your immigration or citizenship status?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {IMMIGRATION_OPTIONS.map((opt) => (
                          <PillButton key={opt.id} active={formData.immigration_status === opt.id} onClick={() => set("immigration_status", opt.id)}>
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ SECTION 7: LEGAL ═══ */}
                {step === 7 && (
                  <>
                    <div>
                      <FieldLabel sub="Legal aid serves low-income residents for civil legal issues. Completely confidential. (Tap all that apply)">
                        Are you dealing with any of these right now?
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {LEGAL_ISSUES_OPTIONS.map((opt) => (
                          <PillButton
                            key={opt.id}
                            active={formData.legal_issues.includes(opt.id)}
                            onClick={() => toggleMulti("legal_issues", opt.id, "none")}
                          >
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FieldLabel sub="Emergency cases (domestic violence, imminent eviction) get same-day intake.">
                        How urgent is your situation?
                      </FieldLabel>
                      <div className="space-y-2">
                        {URGENCY_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => set("urgency", opt.id)}
                            className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                              formData.urgency === opt.id
                                ? "bg-violet-50 border-violet-500 text-violet-900"
                                : "bg-white border-outline-variant/40 text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            <div className="font-bold text-sm">{opt.label}</div>
                            <div className={`text-xs mt-0.5 ${formData.urgency === opt.id ? "text-violet-700" : "text-on-surface-variant"}`}>{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-red-100 bg-red-50/20">
                      <FieldLabel sub="This is confidential. If you are in immediate danger, call 911.">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                          Are you or your children currently experiencing domestic violence or abuse?
                        </span>
                      </FieldLabel>
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => set("domestic_violence", true)}
                          className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all ${formData.domestic_violence === true ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"}`}>
                          Yes
                        </button>
                        <button type="button" onClick={() => set("domestic_violence", false)}
                          className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all ${formData.domestic_violence === false ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"}`}>
                          No
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Navigation */}
              <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/30 justify-between items-center">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-white rounded-xl border border-outline-variant/30 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {step < SECTIONS.length ? (
                  <button type="button" onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={runScan}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    See Results <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[10px] text-on-surface-variant/70 mt-5 max-w-sm mx-auto leading-relaxed">
          Section {step} of {SECTIONS.length} • Your answers are encrypted and strictly secure. We use this information solely to verify eligibility under US Code standards.
        </p>
      </div>
    </div>
  );
}
