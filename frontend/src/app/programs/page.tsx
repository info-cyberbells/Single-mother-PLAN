'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ExternalLink, Info, CheckCircle, ChevronRight, X } from 'lucide-react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface BenefitProgram {
  id: string;
  name: string;
  agency: string;
  program_type: string;
  federal_or_state: string;
  description: string;
  benefit: string;
  website: string;
  application_url: string;
  contact_email?: string;
  tags: string[];
  eligibility_criteria: any;
}

const CATEGORIES = [
  'All',
  'Food',
  'Cash',
  'Housing',
  'Childcare',
  'Healthcare',
  'Education',
  'Utilities'
];

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

export default function BrowsePrograms() {
  const [programs, setPrograms] = useState<BenefitProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<BenefitProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProgram, setSelectedProgram] = useState<BenefitProgram | null>(null);
  const [showEmails, setShowEmails] = useState(false);
  const [selectedState, setSelectedState] = useState('All');

  useEffect(() => {
    fetchPrograms();
  }, [selectedState]);

  useEffect(() => {
    filterPrograms();
  }, [searchQuery, selectedCategory, programs]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = selectedState && selectedState !== 'All' ? { state: selectedState } : {};
      const response = await api.get('/api/programs', { params });
      if (response.data.success) {
        setPrograms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = programs;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => 
        p.program_type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.agency.toLowerCase().includes(query)
      );
    }

    setFilteredPrograms(filtered);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pb-20 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-primary text-white pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold font-plus-jakarta mb-4"
          >
            Government Benefit Programs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-primary-100 max-w-2xl"
          >
            Discover and browse government assistance programs. We've compiled the most critical resources for mothers and families in one place.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search programs, e.g. 'rent', 'childcare', 'food'..."
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-on-surface"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-56 shrink-0">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-on-surface font-semibold text-sm appearance-none cursor-pointer pr-10"
            >
              <option value="All">All States (Federal)</option>
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                  ? 'bg-primary-500 text-white shadow-primary' 
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 ml-2">
              <input
                type="checkbox"
                id="show-emails-toggle"
                checked={showEmails}
                onChange={(e) => setShowEmails(e.target.checked)}
                className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 border-outline-variant/50 cursor-pointer"
              />
              <label htmlFor="show-emails-toggle" className="text-xs text-slate-600 font-semibold cursor-pointer select-none whitespace-nowrap">
                Show Emails
              </label>
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-[400px] bg-white/50 animate-pulse rounded-2xl border border-slate-100" />
              ))
            ) : filteredPrograms.length > 0 ? (
              filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full uppercase tracking-wider">
                        {program.program_type}
                      </span>
                      <span className="text-xs text-on-surface-variant/70 font-medium">{program.agency}</span>
                    </div>
                    <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary-500 transition-colors line-clamp-2">
                      {program.name}
                    </h3>
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {program.description}
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Benefit</p>
                      <p className="text-lg font-bold text-primary-600">{program.benefit}</p>
                      {showEmails && program.contact_email && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold">Contact Email:</span>
                          <a href={`mailto:${program.contact_email}`} className="text-primary-500 hover:underline font-mono">
                            {program.contact_email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto flex flex-col gap-3">
                    <button 
                      onClick={() => setSelectedProgram(program)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all"
                    >
                      <Info className="w-4 h-4" />
                      Eligibility Criteria
                    </button>
                    <a 
                      href={program.application_url || program.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-on-surface text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
                    >
                      Learn how to apply
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No programs found</h3>
                <p className="text-slate-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Eligibility Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgram(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProgram.name}</h2>
                  <p className="text-slate-500 text-sm">Eligibility Requirements</p>
                </div>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <div className="space-y-8">
                  {/* General Overview */}
                  <section>
                    <h4 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary-500 rounded-full" />
                      General Requirements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedProgram.eligibility_criteria || {}).map(([key, value]: [string, any]) => {
                        if (typeof value === 'boolean') {
                          return (
                            <div key={key} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              {value ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                              )}
                              <span className="text-sm font-medium text-slate-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </section>

                  {/* Specific Details */}
                  <section>
                    <h4 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary-500 rounded-full" />
                      Specific Criteria
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selectedProgram.eligibility_criteria || {}).map(([key, value]: [string, any]) => {
                        if (typeof value !== 'boolean' && value !== null) {
                          return (
                            <div key={key} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-tight capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-semibold text-slate-900">{String(value)}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </section>

                  {selectedProgram.contact_email && (
                    <section>
                      <h4 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full" />
                        Official Contact
                      </h4>
                      <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">Contact Email</span>
                        <span className="text-sm font-semibold text-slate-900 font-mono">{selectedProgram.contact_email}</span>
                      </div>
                    </section>
                  )}

                  {/* Pro Tip */}
                  <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100 flex gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm self-start">
                      <Info className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-primary-900 mb-1">Apply via Scan</h5>
                      <p className="text-sm text-primary-700 leading-relaxed">
                        Don't want to check manually? Use our <strong>AI Eligibility Scan</strong> to automatically determine your qualification for this and other programs in seconds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 rounded-b-3xl">
                <a 
                  href={selectedProgram.application_url || selectedProgram.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary-500 text-white rounded-2xl font-bold hover:shadow-primary-lg transition-all"
                >
                  Start Official Application
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}
