"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  FileText,
  File,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatDate, pluralize } from "@/lib/utils";
import type { Document, DocumentType } from "@/types";

const TYPE_ICONS: Record<DocumentType, typeof FileText> = {
  report: FileText,
  consent: File,
  referral_letter: FileText,
  intake_form: FileText,
  assessment: FileText,
  other: File,
};

const TYPE_COLORS: Record<DocumentType, string> = {
  report: "bg-secondary-100 text-secondary-700",
  consent: "bg-green-100 text-green-700",
  referral_letter: "bg-partner-100 text-partner-700",
  intake_form: "bg-orange-100 text-orange-700",
  assessment: "bg-primary-100 text-primary-700",
  other: "bg-gray-100 text-gray-700",
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchDocuments(type?: string): Promise<Document[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (type && type !== "all") params.set("type", type);
  const res = await api.get(`/api/partner/documents?${params}`);
  return res.data.data ?? [];
}

export function DocumentsClient() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["partner-documents", tab],
    queryFn: () => fetchDocuments(tab),
    staleTime: 60 * 1000,
    placeholderData: [],
  });

  const filtered = docs.filter((d) =>
    !search ? true : d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {["all", "report", "consent", "referral_letter", "intake_form", "assessment"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize text-xs">
                {t.replace(/_/g, " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <Input
              placeholder="Search documents…"
              className="pl-9 h-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" className="gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Upload
          </Button>
        </div>
      </div>

      {!isLoading && (
        <p className="text-sm text-text-soft mb-4">
          {pluralize(filtered.length, "document")} found
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <span className="text-4xl block mb-3">📄</span>
          <p className="text-text-soft">No secure application documents yet</p>
          <Button className="mt-4" size="sm" variant="outline">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc, idx) => {
            const Icon = TYPE_ICONS[doc.type] ?? File;
            const colorClass = TYPE_COLORS[doc.type] ?? TYPE_COLORS.other;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="bg-white rounded-2xl border border-surface-border shadow-card p-5 hover:shadow-card-hover transition-shadow group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-dark truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-text-soft mt-0.5 capitalize">
                      {doc.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <button className="text-text-soft hover:text-text-mid transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-text-soft">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{formatDate(doc.uploaded_at)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
                  <Badge variant="purple" className="text-[10px]">
                    {doc.type.replace(/_/g, " ")}
                  </Badge>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
