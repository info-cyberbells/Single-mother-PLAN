"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Plus, ExternalLink, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { slugToTitle } from "@/lib/utils";

export default function ProgramsPage() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => api.get("/api/programs").then((r) => r.data.data || r.data),
  });

  return (
    <>
      <TopBar title="Benefit Programs" subtitle="Manage all government benefit programs" />
      <main className="flex-1 p-6 space-y-5 min-h-0">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {(programs || []).length} programs in database
          </p>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Program
          </button>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-5/6" />
                </div>
              ))
            : (programs || []).map((program: any, i: number) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card card-hover p-5 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-brand-400" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 leading-snug">{program.name}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge badge-purple text-[10px]">{slugToTitle(program.program_type)}</span>
                    {program.agency && (
                      <span className="badge badge-gray text-[10px]">{program.agency}</span>
                    )}
                    {program.state && (
                      <span className="badge badge-blue text-[10px]">{program.state}</span>
                    )}
                  </div>
                  {program.contact_email && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-slate-500">Contact Email:</span>
                      <span className="font-mono text-brand-300">{program.contact_email}</span>
                    </div>
                  )}
                </motion.div>
              ))}
        </div>
      </main>
    </>
  );
}
