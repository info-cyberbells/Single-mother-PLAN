"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, MapPin, Layers, Search, Inbox, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PeriodTabs, currentQuarter, periodNote, type PeriodValue } from "@/components/dashboard/PeriodTabs";
import { DataOverlay } from "@/components/dashboard/DashboardLoading";
import { cn } from "@/lib/utils";

export interface NetworkPartner {
  id: string;
  name: string;
  type: string;
  zip: string;
  area: string;
  direction: "in" | "out";
  volume: number;
  acceptance_rate: number;
  outcome_rate: number;
  avg_response_hours: number | null;
}
export interface NetworkData {
  quarter: string;
  year: number;
  period_label: string;
  summary: {
    total_partners: number;
    zips_covered: number;
    partner_types: number;
    total_referrals: number;
    referrals_in: number;
    referrals_out: number;
    acceptance_rate: number;
    positive_outcome_rate: number;
  };
  partners: NetworkPartner[];
  by_type: { type: string; count: number }[];
  by_zip: { zip: string; area: string; volume: number }[];
}

export async function fetchNetwork(p: PeriodValue): Promise<NetworkData> {
  const res = await api.get("/api/partner/referrals/network", { params: { quarter: p.quarter, year: p.year } });
  return res.data.data;
}

type SortKey = "name" | "type" | "zip" | "area" | "volume" | "acceptance_rate";

function accPill(v: number) {
  const c = v >= 80 ? "bg-status-success-bg text-status-success" : v >= 65 ? "bg-status-warning-bg text-status-warning" : "bg-status-error-bg text-status-error";
  return <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", c)}>{v}%</span>;
}

export function ReferralDirectoryClient() {
  const [period, setPeriod] = useState<PeriodValue>({ quarter: currentQuarter(), year: new Date().getFullYear() });
  const [search, setSearch] = useState("");
  const [zipFilter, setZipFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const { data, isFetching } = useQuery({
    queryKey: ["referral-network", period.quarter, period.year],
    queryFn: () => fetchNetwork(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const s = data?.summary;
  const partners = data?.partners ?? [];
  const maxType = Math.max(1, ...(data?.by_type ?? []).map((t) => t.count));
  const maxZip = Math.max(1, ...(data?.by_zip ?? []).map((z) => z.volume));

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = partners.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (zipFilter !== "all" && p.zip !== zipFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.type.toLowerCase().includes(q) && !p.zip.includes(q) && !p.area.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      if (typeof x === "string" && typeof y === "string") return x.toLowerCase() < y.toLowerCase() ? -sortDir : x.toLowerCase() > y.toLowerCase() ? sortDir : 0;
      return ((x as number) - (y as number)) * sortDir;
    });
  }, [partners, search, typeFilter, zipFilter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(k === "volume" || k === "acceptance_rate" ? -1 : 1); }
  };
  const SortHead = ({ k, label, num }: { k: SortKey; label: string; num?: boolean }) => (
    <th onClick={() => toggleSort(k)} className={cn("py-2 px-2 font-semibold cursor-pointer hover:text-partner-700 select-none", num ? "text-right" : "text-left")}>
      {label}{sortKey === k && (sortDir === 1 ? <ArrowUp className="inline w-3 h-3 ml-0.5" /> : <ArrowDown className="inline w-3 h-3 ml-0.5" />)}
    </th>
  );

  return (
    <div className="flex-1 p-8 space-y-4">
      <PeriodTabs value={period} onChange={setPeriod} />

      <DataOverlay loading={isFetching}>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total partners" value={s?.total_partners ?? 0} />
            <Stat label="Zip codes covered" value={s?.zips_covered ?? 0} accent="text-partner-700" />
            <Stat label="Partner types" value={s?.partner_types ?? 0} accent="text-partner-700" />
            <Stat label="Total referrals" value={s?.total_referrals ?? 0} />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="p-5">
              <SectionTitle icon={<Layers className="w-4 h-4" />} title="Partners by type" sub="Count of partner orgs in each category" />
              {(data?.by_type ?? []).length === 0 ? <Empty /> : (data?.by_type ?? []).map((t) => (
                <div key={t.type} className="flex items-center gap-2.5 py-1.5">
                  <span className="text-xs font-semibold w-32 truncate" title={t.type}>{t.type}</span>
                  <div className="flex-1 h-2 rounded-full bg-partner-100 overflow-hidden"><div className="h-full rounded-full bg-partner-500" style={{ width: `${(t.count / maxType) * 100}%` }} /></div>
                  <span className="text-xs font-bold text-partner-700 w-8 text-right">{t.count}</span>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Referral volume by zip" sub="Inbound + outbound per service area" />
              {(data?.by_zip ?? []).length === 0 ? <Empty /> : (data?.by_zip ?? []).map((z) => (
                <div key={z.zip} className="flex items-center gap-2.5 py-1.5">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-partner-100 text-partner-700">{z.zip}</span>
                  <span className="text-[11px] text-text-soft w-24 truncate">{z.area}</span>
                  <div className="flex-1 h-2 rounded-full bg-partner-100 overflow-hidden"><div className="h-full rounded-full bg-partner-500" style={{ width: `${(z.volume / maxZip) * 100}%` }} /></div>
                  <span className="text-xs font-bold text-partner-700 w-8 text-right">{z.volume}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Toolbar + table */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partner, type, or zip…" className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-surface-border bg-white outline-none focus:border-partner-500" />
              </div>
              <Select value={zipFilter} onValueChange={setZipFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="All zip codes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All zip codes</SelectItem>
                  {(data?.by_zip ?? []).map((z) => <SelectItem key={z.zip} value={z.zip}>{z.zip} · {z.area}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(data?.by_type ?? []).map((t) => <SelectItem key={t.type} value={t.type}>{t.type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-[11px] text-text-soft mb-2">{rows.length} partners · {periodNote(period)}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-text-soft border-b-2 border-partner-200">
                  <SortHead k="name" label="Partner" />
                  <SortHead k="type" label="Type" />
                  <SortHead k="zip" label="Zip" />
                  <SortHead k="area" label="Service area" />
                  <th className="text-left py-2 px-2 font-semibold">Direction</th>
                  <SortHead k="volume" label="Volume" num />
                  <SortHead k="acceptance_rate" label="Acceptance" num />
                </tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-text-soft text-sm">No partners match your filters.</td></tr>}
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-surface-border last:border-0 hover:bg-partner-50/50">
                      <td className="py-2.5 px-2 font-semibold text-text-dark">{p.name}</td>
                      <td className="px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-partner-100 text-partner-700">{p.type}</span></td>
                      <td className="px-2"><span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-partner-100 text-partner-700">{p.zip}</span></td>
                      <td className="px-2 text-[11px] text-text-soft">{p.area}</td>
                      <td className="px-2">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold", p.direction === "in" ? "bg-partner-80 text-partner-700" : "bg-secondary-100 text-secondary-700")}>
                          {p.direction === "in" ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {p.direction === "in" ? "Sends to us" : "We send"}
                        </span>
                      </td>
                      <td className="px-2 text-right tabular-nums font-medium">{p.volume}</td>
                      <td className="px-2 text-right">{accPill(p.acceptance_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </DataOverlay>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="p-3.5">
      <div className="text-[11px] text-text-soft mb-1">{label}</div>
      <div className={cn("text-2xl font-extrabold tabular-nums text-text-dark", accent)}>{value}</div>
    </Card>
  );
}
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-partner-700">{icon}{title}</div>
      <div className="text-[11px] text-text-soft mt-0.5">{sub}</div>
    </div>
  );
}
function Empty() {
  return <p className="text-sm text-text-soft py-2">No referral activity in this period.</p>;
}
