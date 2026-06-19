"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Users, FileText, ClipboardList, TrendingUp, Settings } from "lucide-react";

export function CommandMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const routes = [
    { name: "Dashboard", path: "/dashboard", icon: TrendingUp },
    { name: "Users", path: "/users", icon: Users },
    { name: "Applications", path: "/applications", icon: ClipboardList },
    { name: "Programs", path: "/programs", icon: FileText },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const filtered = routes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // hack to trigger open from outside if needed, 
          // but TopBar should handle the keyboard listener ideally
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-xl bg-[#0f1117] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
        >
          <div className="flex items-center px-4 py-3 border-b border-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
            />
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-800/50 px-1.5 py-1 rounded">
              <span>ESC</span>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No results found.</div>
            ) : (
              filtered.map((route) => (
                <button
                  key={route.path}
                  onClick={() => handleSelect(route.path)}
                  className="w-full flex items-center px-4 py-3 gap-3 text-left rounded-xl hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors"
                >
                  <route.icon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-sm">{route.name}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
