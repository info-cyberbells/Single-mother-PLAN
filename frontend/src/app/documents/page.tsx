"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  MapPin,
  FileText,
  Shield,
  Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DocumentItem {
  name: string;
  note?: string;
}

interface Program {
  id: string;
  name: string;
  shortName: string;
  category: string;
  categoryColor: string;
  level: "Federal" | "State";
  description: string;
  eligibility: string[];
  mandatoryDocs: DocumentItem[];
  optionalDocs: DocumentItem[];
  officialUrl: string;
  states?: string[]; // if state-specific
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PROGRAMS: Program[] = [
  {
    id: "snap",
    name: "SNAP (Food Stamps)",
    shortName: "SNAP",
    category: "Food & Nutrition",
    categoryColor: "bg-green-100 text-green-700",
    level: "Federal",
    description: "Monthly food assistance to buy groceries. Benefits loaded onto an EBT card.",
    eligibility: [
      "Household income ≤ $30,000/yr",
      "Employment: employed, unemployed, part-time, self-employed",
      "Housing: rent, own",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Social Security numbers for household" },
      { name: "Proof of income", note: "pay stubs, tax return" },
      { name: "Proof of residence", note: "utility bill, lease" },
      { name: "Bank statements" },
      { name: "Proof of expenses", note: "rent, childcare, utilities" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.fns.usda.gov/snap/state-directory",
  },
  {
    id: "wic",
    name: "WIC (Women, Infants & Children)",
    shortName: "WIC",
    category: "Food & Nutrition",
    categoryColor: "bg-green-100 text-green-700",
    level: "Federal",
    description: "Nutrition support for pregnant women, new mothers, and children under 5. Includes food vouchers and nutrition counseling.",
    eligibility: [
      "Household income ≤ $35,000/yr",
      "Pregnant or new mother",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Proof of pregnancy or child's birth certificate" },
      { name: "Proof of income" },
      { name: "Proof of residence" },
      { name: "Immunization records", note: "for children" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.fns.usda.gov/wic/wic-state-agencies",
  },
  {
    id: "tanf",
    name: "TANF (Cash Assistance)",
    shortName: "TANF",
    category: "Income Support",
    categoryColor: "bg-amber-100 text-amber-700",
    level: "Federal",
    description: "Temporary cash assistance for families with children. Can help with basic needs like housing, food, and clothing.",
    eligibility: [
      "At least 1 child",
      "Household income ≤ $20,000/yr",
      "Employment: unemployed, part-time",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Social Security cards for all household members" },
      { name: "Birth certificates for children" },
      { name: "Proof of income" },
      { name: "Proof of residence" },
      { name: "Bank statements" },
    ],
    optionalDocs: [
      { name: "Proof of pregnancy", note: "if applicable" },
    ],
    officialUrl: "https://www.acf.hhs.gov/ofa/map/about/help-families",
  },
  {
    id: "eitc",
    name: "Earned Income Tax Credit",
    shortName: "EITC",
    category: "Tax Credits",
    categoryColor: "bg-blue-100 text-blue-700",
    level: "Federal",
    description: "A refundable tax credit for working people with low to moderate income. Can result in a significant tax refund.",
    eligibility: [
      "Household income ≤ $60,000/yr",
      "Employment: employed, part-time, self-employed",
    ],
    mandatoryDocs: [
      { name: "Social Security numbers for self, spouse, and dependents" },
      { name: "W-2s and 1099s" },
      { name: "Prior year tax return" },
      { name: "Proof of qualifying children", note: "school records, medical records" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc",
  },
  {
    id: "child_tax_credit",
    name: "Child Tax Credit",
    shortName: "CTC",
    category: "Tax Credits",
    categoryColor: "bg-blue-100 text-blue-700",
    level: "Federal",
    description: "A tax credit of up to $2,000 per qualifying dependent child under 17.",
    eligibility: [
      "At least 1 child",
      "Household income ≤ $200,000/yr",
    ],
    mandatoryDocs: [
      { name: "Social Security numbers for each qualifying child" },
      { name: "Child's birth certificate" },
      { name: "Proof of relationship and residence" },
      { name: "Filed federal tax return", note: "Form 1040" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.irs.gov/credits-deductions/child-tax-credit",
  },
  {
    id: "section8",
    name: "Section 8 Housing Choice Voucher",
    shortName: "Section 8",
    category: "Housing",
    categoryColor: "bg-purple-100 text-purple-700",
    level: "Federal",
    description: "Rental assistance that helps low-income families afford safe, decent housing in the private market.",
    eligibility: [
      "Household income ≤ $35,000/yr",
      "Housing: rent",
    ],
    mandatoryDocs: [
      { name: "Photo ID for all adults" },
      { name: "Social Security cards" },
      { name: "Birth certificates" },
      { name: "Proof of income", note: "last 3 months" },
      { name: "Bank statements" },
      { name: "Current lease or rental history" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts",
  },
  {
    id: "liheap",
    name: "LIHEAP (Energy Assistance)",
    shortName: "LIHEAP",
    category: "Utilities",
    categoryColor: "bg-orange-100 text-orange-700",
    level: "Federal",
    description: "Help paying heating and cooling bills, energy crisis assistance, and weatherization services.",
    eligibility: [
      "Household income ≤ $35,000/yr",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Social Security numbers for household" },
      { name: "Proof of income", note: "last 30 days" },
      { name: "Most recent utility bill" },
      { name: "Proof of residence" },
    ],
    optionalDocs: [],
    officialUrl: "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap",
  },
  {
    id: "medicaid",
    name: "Medicaid",
    shortName: "Medicaid",
    category: "Health",
    categoryColor: "bg-red-100 text-red-700",
    level: "Federal",
    description: "Free or low-cost health coverage for low-income individuals and families. Covers doctor visits, prescriptions, hospital care, and more.",
    eligibility: [
      "Household income ≤ $30,000/yr",
      "Employment: employed, unemployed, part-time, self-employed",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Social Security numbers" },
      { name: "Proof of citizenship or immigration status" },
      { name: "Proof of income" },
      { name: "Proof of residence" },
    ],
    optionalDocs: [
      { name: "Current health insurance info", note: "if any" },
    ],
    officialUrl: "https://www.healthcare.gov/medicaid-chip/",
  },
  {
    id: "chip",
    name: "CHIP (Children's Health Insurance)",
    shortName: "CHIP",
    category: "Health",
    categoryColor: "bg-red-100 text-red-700",
    level: "Federal",
    description: "Low-cost health coverage for children in families that earn too much to qualify for Medicaid.",
    eligibility: [
      "At least 1 child",
      "Household income ≤ $50,000/yr",
    ],
    mandatoryDocs: [
      { name: "Child's birth certificate or ID" },
      { name: "Social Security number for child" },
      { name: "Proof of income" },
      { name: "Proof of residence" },
    ],
    optionalDocs: [
      { name: "Proof of citizenship or immigration status" },
    ],
    officialUrl: "https://www.healthcare.gov/medicaid-chip/childrens-health-insurance-program/",
  },
  {
    id: "ccdf",
    name: "Child Care Subsidy (CCDF)",
    shortName: "CCDF",
    category: "Childcare",
    categoryColor: "bg-sky-100 text-sky-700",
    level: "Federal",
    description: "Help paying for daycare or after-school care so you can work or attend school.",
    eligibility: [
      "At least 1 child under 13",
      "Household income ≤ $45,000/yr",
      "Employment or student status required",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Child's birth certificate" },
      { name: "Proof of income" },
      { name: "Proof of employment or school enrollment" },
      { name: "Childcare provider information" },
    ],
    optionalDocs: [
      { name: "Immunization records for child" },
    ],
    officialUrl: "https://www.childcare.gov/state-resources",
  },
  {
    id: "legal_aid",
    name: "Civil Legal Aid Services",
    shortName: "Legal Aid",
    category: "Legal",
    categoryColor: "bg-slate-100 text-slate-700",
    level: "Federal",
    description: "Free civil legal assistance for low-income individuals facing housing, family, or domestic violence issues.",
    eligibility: [
      "Household income ≤ $30,000/yr",
      "Civil legal issue (eviction, custody, DV, benefits denial)",
    ],
    mandatoryDocs: [
      { name: "Photo ID" },
      { name: "Proof of income" },
      { name: "Documentation of legal issue", note: "eviction notice, court papers, etc." },
    ],
    optionalDocs: [
      { name: "Prior case documents" },
      { name: "Witness statements" },
    ],
    officialUrl: "https://www.lsc.gov/grants/our-grantees",
  },
  {
    id: "head_start",
    name: "Head Start & Early Head Start",
    shortName: "Head Start",
    category: "Education",
    categoryColor: "bg-indigo-100 text-indigo-700",
    level: "Federal",
    description: "Free early learning, health, and family services for kids 0–5 from low-income families.",
    eligibility: [
      "Child age 0–5",
      "Household income at or below poverty level",
    ],
    mandatoryDocs: [
      { name: "Child's birth certificate" },
      { name: "Proof of income" },
      { name: "Immunization records" },
      { name: "Proof of residence" },
    ],
    optionalDocs: [
      { name: "Child's health/medical records" },
    ],
    officialUrl: "https://eclkc.ohs.acf.hhs.gov/center-locator",
  },
  {
    id: "pell_grant",
    name: "Federal Pell Grant",
    shortName: "Pell Grant",
    category: "Education",
    categoryColor: "bg-indigo-100 text-indigo-700",
    level: "Federal",
    description: "Free college money for low-income students — doesn't need to be repaid.",
    eligibility: [
      "Enrolled in college or university",
      "Household income ≤ $60,000/yr",
    ],
    mandatoryDocs: [
      { name: "FAFSA application (studentaid.gov)" },
      { name: "Tax returns", note: "student and parent" },
      { name: "Social Security number" },
      { name: "Enrollment verification" },
    ],
    optionalDocs: [
      { name: "Selective Service registration", note: "if male 18–25" },
    ],
    officialUrl: "https://studentaid.gov/h/apply-for-aid/fafsa",
  },
];

const US_STATES_LIST = [
  "All states","Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas",
  "Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington",
  "West Virginia","Wisconsin","Wyoming"
];

const LEVEL_TABS = ["All levels", "Federal", "State"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RequiredDocumentsPage() {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All states");
  const [selectedLevel, setSelectedLevel] = useState("All levels");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PROGRAMS.filter((p) => {
      const matchLevel =
        selectedLevel === "All levels" ||
        p.level === selectedLevel;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.mandatoryDocs.some((d) => d.name.toLowerCase().includes(search.toLowerCase())) ||
        p.optionalDocs.some((d) => d.name.toLowerCase().includes(search.toLowerCase()));
      return matchLevel && matchSearch;
    });
  }, [search, selectedLevel]);

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/20">
            <FileText className="w-3.5 h-3.5" />
            Documents checklist
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 leading-tight">
            Required Documents by Scheme
          </h1>
          <p className="text-indigo-100 text-base max-w-2xl leading-relaxed">
            Pick your state to see the schemes available to you, who qualifies, and exactly which documents you'll need — clearly marked as required or optional.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/20 p-4 flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4 h-4" />
            <input
              type="text"
              placeholder="Search scheme or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm text-on-surface transition-all"
            />
          </div>
          {/* State selector */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4 h-4" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm text-on-surface transition-all appearance-none min-w-[160px]"
            >
              {US_STATES_LIST.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 mt-4 mb-6">
          {LEVEL_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedLevel(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                selectedLevel === tab
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                  : "bg-white border-outline-variant/40 text-on-surface-variant hover:border-violet-300"
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="ml-auto text-sm text-on-surface-variant self-center">
            Showing {filtered.length} schemes
          </span>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[2fr_0.7fr_1.5fr_2fr_0.5fr] gap-4 px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30 mb-2">
          <span>Scheme</span>
          <span>Level</span>
          <span>Eligibility</span>
          <span>Required Documents</span>
          <span>Link</span>
        </div>

        {/* Programs List */}
        <div className="space-y-3 pb-20">
          <AnimatePresence>
            {filtered.map((program, idx) => {
              const isExpanded = expandedId === program.id;
              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden"
                >
                  {/* Main row */}
                  <div className="md:grid md:grid-cols-[2fr_0.7fr_1.5fr_2fr_0.5fr] gap-4 p-4 items-start">
                    {/* Scheme */}
                    <div>
                      <div className="flex items-start gap-2 flex-wrap mb-1.5">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : program.id)}
                          className="font-bold text-sm text-on-surface hover:text-violet-700 transition-colors text-left"
                        >
                          {program.name}
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${program.categoryColor}`}>
                          {program.category}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{program.description}</p>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : program.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium md:hidden"
                      >
                        {isExpanded ? "Show less" : "Show details"}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {/* Level */}
                    <div className="hidden md:block">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${program.level === "Federal" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                        {program.level}
                      </span>
                    </div>

                    {/* Eligibility */}
                    <div className="hidden md:block space-y-1">
                      {program.eligibility.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-on-surface-variant leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Required Docs */}
                    <div className="hidden md:block">
                      <div className="mb-2">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                          MANDATORY ({program.mandatoryDocs.length})
                        </span>
                        <ul className="mt-1 space-y-0.5">
                          {program.mandatoryDocs.map((doc, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface">
                              <span className="text-rose-400 mt-0.5 shrink-0">•</span>
                              <span>
                                {doc.name}
                                {doc.note && <span className="text-on-surface-variant"> ({doc.note})</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {program.optionalDocs.length > 0 && (
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            OPTIONAL ({program.optionalDocs.length})
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {program.optionalDocs.map((doc, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                                <span className="mt-0.5 shrink-0">•</span>
                                <span>
                                  {doc.name}
                                  {doc.note && <span> ({doc.note})</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Link */}
                    <div className="hidden md:flex items-start justify-center pt-1">
                      <a
                        href={program.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 text-violet-600 hover:text-violet-800 transition-colors group"
                        title="Official site"
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">Official site</span>
                      </a>
                    </div>
                  </div>

                  {/* Expanded mobile content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-outline-variant/10 pt-4 space-y-4">
                          {/* Level */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${program.level === "Federal" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                              {program.level}
                            </span>
                          </div>
                          {/* Eligibility */}
                          <div>
                            <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">Eligibility</div>
                            <div className="space-y-1">
                              {program.eligibility.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="text-xs text-on-surface-variant">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Mandatory docs */}
                          <div>
                            <div className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2">MANDATORY ({program.mandatoryDocs.length})</div>
                            <ul className="space-y-1">
                              {program.mandatoryDocs.map((doc, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface">
                                  <span className="text-rose-400 mt-0.5 shrink-0">•</span>
                                  <span>{doc.name}{doc.note && <span className="text-on-surface-variant"> ({doc.note})</span>}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Optional docs */}
                          {program.optionalDocs.length > 0 && (
                            <div>
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">OPTIONAL ({program.optionalDocs.length})</div>
                              <ul className="space-y-1">
                                {program.optionalDocs.map((doc, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                                    <span className="mt-0.5 shrink-0">•</span>
                                    <span>{doc.name}{doc.note && <span> ({doc.note})</span>}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Official link */}
                          <a
                            href={program.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 w-full justify-center py-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl text-violet-700 font-bold text-sm transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Official Site
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-1">No schemes found</h3>
              <p className="text-on-surface-variant text-sm">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-outline-variant/20 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <p className="text-xs text-on-surface-variant">
          <span className="font-bold text-on-surface">Ready to find your matches?</span> Run our AI eligibility scan to get personalized results.
        </p>
        <Link
          href="/eligibility"
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Star className="w-4 h-4" />
          Check Eligibility
        </Link>
      </div>
    </div>
  );
}
