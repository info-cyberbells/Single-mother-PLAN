"use client";

import { useState, useEffect } from "react";
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

const SECTIONS = [
  { id: 1, label: "Personal Info",  icon: User,       emoji: "🧍", color: "from-primary to-secondary" },
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

// Helper component for Year/Month/Day date selection
function DateOfBirthDropdowns({
  value,
  onChange,
  isChild = false,
}: {
  value: string;
  onChange: (val: string) => void;
  isChild?: boolean;
}) {
  // Parse YYYY-MM-DD
  let initialYear = "";
  let initialMonth = "";
  let initialDay = "";
  if (value && value.includes("-")) {
    const parts = value.split("-");
    if (parts.length === 3) {
      initialYear = parts[0];
      initialMonth = parts[1];
      initialDay = parts[2];
    }
  }

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);

  // Sync state if value changes externally (e.g. from hydration/localStorage)
  useEffect(() => {
    if (value && value.includes("-")) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    } else {
      setYear("");
      setMonth("");
      setDay("");
    }
  }, [value]);

  const handleSelect = (y: string, m: string, d: string) => {
    setYear(y);
    setMonth(m);
    setDay(d);
    if (y && m && d) {
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange("");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  if (isChild) {
    // Child age 0 to 18
    for (let i = currentYear; i >= currentYear - 18; i--) {
      years.push(String(i));
    }
  } else {
    // Adult age 18 to 100+
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(String(i));
    }
  }

  const months = [
    { val: "01", label: "January" },
    { val: "02", label: "February" },
    { val: "03", label: "March" },
    { val: "04", label: "April" },
    { val: "05", label: "May" },
    { val: "06", label: "June" },
    { val: "07", label: "July" },
    { val: "08", label: "August" },
    { val: "09", label: "September" },
    { val: "10", label: "October" },
    { val: "11", label: "November" },
    { val: "12", label: "December" },
  ];

  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push(String(i).padStart(2, "0"));
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={month}
        onChange={(e) => handleSelect(year, e.target.value, day)}
        className="px-3 py-2.5 rounded-xl border border-outline-variant bg-white focus:border-primary-500 outline-none text-sm font-medium text-on-surface"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m.val} value={m.val}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={day}
        onChange={(e) => handleSelect(year, month, e.target.value)}
        className="px-3 py-2.5 rounded-xl border border-outline-variant bg-white focus:border-primary-500 outline-none text-sm font-medium text-on-surface"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {parseInt(d)}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => handleSelect(e.target.value, month, day)}
        className="px-3 py-2.5 rounded-xl border border-outline-variant bg-white focus:border-primary-500 outline-none text-sm font-medium text-on-surface"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function EligibilityPage() {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, updateUser } = useAuthStore();
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

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pending_eligibility_scan")) {
      return;
    }
    if (user) {
      const [first, ...rest] = (user.full_name || "").split(" ");
      const last = rest.join(" ");
      
      const dobStr = (() => {
        if (!user.family_profile?.date_of_birth) return "";
        try {
          const d = new Date(user.family_profile.date_of_birth);
          return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
        } catch {
          return "";
        }
      })();

      const numChildren = user.family_profile?.num_children || 0;
      const initialDobs = [...(user.family_profile?.children_dobs || [])];
      while (initialDobs.length < numChildren) {
        initialDobs.push("");
      }

      setFormData({
        first_name: user.family_profile?.first_name || first || "",
        last_name: user.family_profile?.last_name || last || "",
        date_of_birth: dobStr,
        ssn_last_four: user.family_profile?.ssn_last_four || "",
        phone: user.phone || user.family_profile?.phone || "",
        email: user.email || user.family_profile?.email || "",
        preferred_language: user.family_profile?.preferred_language || "English",
        street_address: user.family_profile?.street_address || "",
        city: user.family_profile?.city || "",
        state: user.state || user.family_profile?.state || "GA",
        zip_code: user.zip_code || user.family_profile?.zip_code || "",
        monthly_income: user.family_profile?.monthly_income !== null && user.family_profile?.monthly_income !== undefined ? String(user.family_profile.monthly_income) : "",
        income_sources: (user.family_profile?.income_sources as string[]) || [],
        employment_status: user.family_profile?.employment_status || "full_time",
        employer_name: user.family_profile?.employer_name || "",
        other_earners: user.family_profile?.other_household_income ? "family" : "none",
        savings_assets: user.family_profile?.savings_assets || "none",
        child_support_status: user.family_profile?.child_support_status || "no_arrangement",
        household_size: user.family_profile?.household_size || 1,
        num_children: numChildren,
        children_birthdates: initialDobs,
        has_disability: user.family_profile?.has_disability ?? null,
        is_pregnant: user.family_profile?.is_pregnant ?? null,
        marital_status: user.family_profile?.marital_status || "single",
        other_adults: user.family_profile?.other_adults ?? null,
        housing_status: user.family_profile?.housing_status || "renting",
        monthly_rent: user.family_profile?.monthly_rent !== null && user.family_profile?.monthly_rent !== undefined ? String(user.family_profile.monthly_rent) : "",
        monthly_utilities: user.family_profile?.monthly_utilities !== null && user.family_profile?.monthly_utilities !== undefined ? String(user.family_profile.monthly_utilities) : "",
        landlord_name: user.family_profile?.landlord_name || "",
        eviction_risk: user.family_profile?.eviction_risk ?? null,
        needs_childcare: user.family_profile?.needs_childcare ?? null,
        childcare_preference: user.family_profile?.childcare_preference || "",
        childcare_provider: user.family_profile?.childcare_provider || "",
        monthly_childcare_cost: user.family_profile?.monthly_childcare_cost !== null && user.family_profile?.monthly_childcare_cost !== undefined ? String(user.family_profile.monthly_childcare_cost) : "",
        work_hours: user.family_profile?.work_situation || "",
        health_insurance: user.family_profile?.health_insurance || "none",
        chronic_illness: user.family_profile?.chronic_illness ?? null,
        er_visit: null,
        immigration_status: user.family_profile?.immigration_status || "citizen",
        legal_issues: (user.family_profile?.legal_issues as string[]) || [],
        urgency: user.family_profile?.urgency || "not_urgent",
        domestic_violence: user.family_profile?.domestic_violence ?? null,
      });
    }
  }, [user]);

  // Load pending scan from localStorage on mount/login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingScan = localStorage.getItem("pending_eligibility_scan");
      if (pendingScan) {
        try {
          const parsed = JSON.parse(pendingScan);
          if (parsed) {
            setFormData(parsed);
            if (isAuthenticated) {
              localStorage.removeItem("pending_eligibility_scan");
              runScan(parsed);
            }
          }
        } catch (e) {
          console.error("Failed to parse pending eligibility scan:", e);
        }
      }
    }
  }, [isAuthenticated]);

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

  const runScan = async (overrideData?: typeof formData) => {
    const dataToSubmit = overrideData || formData;
    setError(null);
    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_eligibility_scan", JSON.stringify(dataToSubmit));
      }
      router.push("/register?redirect=eligibility");
      return;
    }
    setIsScanning(true);
    try {
      const ages = dataToSubmit.children_birthdates.map((dob) => {
        if (!dob) return 2;
        const birth = new Date(dob);
        if (isNaN(birth.getTime())) return 2;
        const diff = Date.now() - birth.getTime();
        return Math.max(0, Math.abs(new Date(diff).getUTCFullYear() - 1970));
      });

      const profileRes = await api.put("/api/user/profile", {
        full_name: `${dataToSubmit.first_name} ${dataToSubmit.last_name}`.trim() || undefined,
        first_name: dataToSubmit.first_name || null,
        last_name: dataToSubmit.last_name || null,
        phone: dataToSubmit.phone || undefined,
        email: dataToSubmit.email || undefined,
        state: dataToSubmit.state || undefined,
        zip_code: dataToSubmit.zip_code || undefined,
        street_address: dataToSubmit.street_address || undefined,
        city: dataToSubmit.city || undefined,
        household_size: dataToSubmit.household_size,
        num_children: dataToSubmit.num_children,
        children_ages: ages,
        children_dobs: dataToSubmit.children_birthdates,
        monthly_income: parseFloat(dataToSubmit.monthly_income) || 0,
        employment_status: dataToSubmit.employment_status,
        housing_status: dataToSubmit.housing_status,
        is_pregnant: dataToSubmit.is_pregnant ?? false,
        has_disability: dataToSubmit.has_disability ?? false,
        needs_childcare: dataToSubmit.needs_childcare ?? false,
        monthly_rent: parseFloat(dataToSubmit.monthly_rent) || 0,
        monthly_utilities: parseFloat(dataToSubmit.monthly_utilities) || 0,
        eviction_risk: dataToSubmit.eviction_risk ?? false,
        domestic_violence: dataToSubmit.domestic_violence ?? false,
        chronic_illness: dataToSubmit.chronic_illness ?? false,
        immigration_status: dataToSubmit.immigration_status,
        date_of_birth: dataToSubmit.date_of_birth || null,
        ssn_last_four: dataToSubmit.ssn_last_four || null,
        preferred_language: dataToSubmit.preferred_language,
        marital_status: dataToSubmit.marital_status,
        other_adults: dataToSubmit.other_adults ?? false,
        income_sources: dataToSubmit.income_sources,
        work_situation: dataToSubmit.employment_status,
        employer_name: dataToSubmit.employer_name || undefined,
        health_insurance: dataToSubmit.health_insurance,
        savings_assets: dataToSubmit.savings_assets,
        monthly_childcare_cost: dataToSubmit.needs_childcare ? (parseFloat(dataToSubmit.monthly_childcare_cost) || 0) : null,
        childcare_preference: dataToSubmit.childcare_preference || undefined,
        childcare_provider: dataToSubmit.childcare_provider || undefined,
        legal_issues: dataToSubmit.legal_issues,
        urgency: dataToSubmit.urgency,
      });
      updateUser(profileRes.data.data);

      const scanRes = await api.post("/api/eligibility/scan");
      setResults(scanRes.data.data || []);
      queryClient.invalidateQueries({ queryKey: ["eligibility-results"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setScanComplete(true);
    } catch (err: any) {
      console.error("Benefit Scan Error:", err);
      setError(
        err.response?.data?.error?.message ||
        "An unexpected error occurred during the benefits scan. Please try again."
      );
    } finally {
      setIsScanning(false);
    }
  };
  const currentSection = SECTIONS.find(s => s.id === step)!;

  // ─── Loading ───────────────────────────────────────────
  if (isScanning) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-primary-lg mx-auto">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-primary-400/20 blur-2xl animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-3xl text-on-surface mb-3">MomPlan Smart Scan</h2>
          <p className="text-on-surface-variant text-base mb-6 leading-relaxed">
            Running eligibility checks against 200+ programs for <b>{formData.first_name || "you"}</b>…
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
                <Button size="lg" onClick={() => router.push("/register")} className="bg-gradient-primary text-white font-bold px-8 shadow-primary">
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
    <div className="min-h-screen bg-surface pt-6 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-lg text-on-surface">Mom<span className="text-primary">Plan</span></span>
          </Link>
          <span className="text-xs font-bold text-on-surface-variant bg-white px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
            Section {step} of {SECTIONS.length}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
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
                    ? "bg-white border-primary-300 shadow-md text-primary"
                    : isDone
                    ? "bg-primary-50 border-primary-200 text-primary-500"
                    : "bg-white/60 border-outline-variant/30 text-on-surface-variant hover:bg-white hover:border-outline-variant"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-gradient-primary text-white shadow-sm" :
                  isDone ? "bg-primary-100 text-primary" : "bg-surface-container text-on-surface-variant"
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-bold leading-tight text-center ${isActive ? "text-primary" : ""}`}>
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
                      <select
                        value={formData.state}
                        onChange={(e) => set("state", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all font-medium text-on-surface"
                      >
                        <option value="" disabled>Select your state...</option>
                        {US_STATES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label} ({s.value})
                          </option>
                        ))}
                      </select>
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
                      <DateOfBirthDropdowns
                        value={formData.date_of_birth}
                        onChange={(val) => set("date_of_birth", val)}
                      />
                    </div>

                    <div>
                      <FieldLabel sub="Used only for identity verification. Never stored or shared.">
                        Last 4 digits of your Social Security Number
                      </FieldLabel>
                      <Input placeholder="••••" type="password" value={formData.ssn_last_four} onChange={(v) => set("ssn_last_four", v.replace(/\D/g, "").slice(0, 4))} maxLength={4} inputMode="numeric" />
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
                            <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low">
                              <span className="text-xs font-bold text-on-surface-variant">Child {i + 1} Birthdate</span>
                              <DateOfBirthDropdowns
                                value={formData.children_birthdates[i] || ""}
                                onChange={(val) => {
                                  const dates = [...formData.children_birthdates];
                                  dates[i] = val;
                                  set("children_birthdates", dates);
                                }}
                                isChild={true}
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
                                ? "bg-primary-50 border-primary-500 text-primary-900"
                                : "bg-white border-outline-variant/40 text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            <div className="font-bold text-sm">{opt.label}</div>
                            <div className={`text-xs mt-0.5 ${formData.urgency === opt.id ? "text-primary" : "text-on-surface-variant"}`}>{opt.desc}</div>
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

              {error && (
                <div className="mx-6 mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <div className="font-bold">Scan Failed</div>
                    <div className="text-xs text-red-600 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

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
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white font-bold text-sm rounded-xl shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5 transition-all">
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
