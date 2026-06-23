"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Inbox, Send, ThumbsUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PeriodTabs, currentQuarter, periodNote, type PeriodValue } from "@/components/dashboard/PeriodTabs";
import { DataOverlay } from "@/components/dashboard/DashboardLoading";
import { usePartnerAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { fetchNetwork, type NetworkPartner } from "../referral-directory/ReferralDirectoryClient";

function edgeColor(acc: number) {
  return acc >= 80 ? "#2F7D32" : acc >= 65 ? "#9A6A0B" : "#A6324E";
}
function accClass(v: number) {
  return v >= 80 ? "text-status-success" : v >= 65 ? "text-status-warning" : "text-status-error";
}

export function ReferralNetworkClient() {
  const [period, setPeriod] = useState<PeriodValue>({ quarter: currentQuarter(), year: new Date().getFullYear() });
  const orgName = usePartnerAuthStore((s) => s.organization?.name) ?? "Our organization";

  const { data, isFetching } = useQuery({
    queryKey: ["referral-network", period.quarter, period.year],
    queryFn: () => fetchNetwork(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const s = data?.summary;
  const partners = data?.partners ?? [];
  const inbound = partners.filter((p) => p.direction === "in").slice(0, 8);
  const outbound = partners.filter((p) => p.direction === "out").slice(0, 8);
  const maxVol = Math.max(1, ...partners.map((p) => p.volume));

  // Insights
  const working = [...partners].filter((p) => p.acceptance_rate >= 80 && p.volume > 0).sort((a, b) => b.volume - a.volume).slice(0, 3);
  const attention = [...partners].filter((p) => p.volume > 0 && (p.acceptance_rate < 65 || p.outcome_rate < 50)).sort((a, b) => a.acceptance_rate - b.acceptance_rate).slice(0, 3);

  return (
    <div className="flex-1 p-8 space-y-4">
      <PeriodTabs value={period} onChange={setPeriod} />

      <DataOverlay loading={isFetching}>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Active partners" value={s?.total_partners ?? 0} />
            <Stat label="Referrals in" value={s?.referrals_in ?? 0} accent="text-partner-700" />
            <Stat label="Referrals out" value={s?.referrals_out ?? 0} accent="text-partner-700" />
            <Stat label="Acceptance rate" value={`${s?.acceptance_rate ?? 0}%`} accent="text-status-success" />
            <Stat label="Positive outcomes" value={`${s?.positive_outcome_rate ?? 0}%`} accent="text-status-warning" />
          </div>

          {/* Network map */}
          <Card className="p-5">
            <div className="mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-partner-700">Network map</div>
              <div className="text-[11px] text-text-soft mt-0.5">Inbound senders (left) → {orgName} → outbound receivers (right) · line thickness = volume · colour = acceptance rate · {periodNote(period)}</div>
            </div>
            {partners.length === 0 ? (
              <p className="text-sm text-text-soft py-6 text-center">No referral activity in this period.</p>
            ) : (
              <NetworkSvg orgName={orgName} inbound={inbound} outbound={outbound} maxVol={maxVol} />
            )}
            <div className="flex gap-4 mt-3 text-[11px] text-text-soft flex-wrap">
              <Legend color="#2F7D32" label="≥80% acceptance" />
              <Legend color="#9A6A0B" label="65–79%" />
              <Legend color="#A6324E" label="<65%" />
              <span className="text-text-soft">Thicker line = more referrals</span>
            </div>
          </Card>

          {/* Partner detail table */}
          <Card className="p-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-partner-700 mb-3">Partner detail</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-text-soft border-b-2 border-partner-200">
                  <th className="text-left py-2 px-2 font-semibold">Partner</th>
                  <th className="text-left py-2 px-2 font-semibold">Direction</th>
                  <th className="text-right py-2 px-2 font-semibold">Volume</th>
                  <th className="text-right py-2 px-2 font-semibold">Acceptance</th>
                  <th className="text-right py-2 px-2 font-semibold">Outcomes</th>
                  <th className="text-right py-2 px-2 font-semibold">Avg response</th>
                </tr></thead>
                <tbody>
                  {partners.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-text-soft text-sm">No partners yet.</td></tr>}
                  {partners.map((p) => (
                    <tr key={p.id} className="border-b border-surface-border last:border-0 hover:bg-partner-50/50">
                      <td className="py-2.5 px-2 font-semibold text-text-dark">{p.name}</td>
                      <td className="px-2">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold", p.direction === "in" ? "bg-partner-80 text-partner-700" : "bg-secondary-100 text-secondary-700")}>
                          {p.direction === "in" ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}{p.direction === "in" ? "Sends to us" : "We send"}
                        </span>
                      </td>
                      <td className="px-2 text-right tabular-nums font-medium">{p.volume}</td>
                      <td className={cn("px-2 text-right font-bold tabular-nums", accClass(p.acceptance_rate))}>{p.acceptance_rate}%</td>
                      <td className="px-2 text-right tabular-nums">{p.outcome_rate}%</td>
                      <td className="px-2 text-right tabular-nums text-text-mid">{p.avg_response_hours != null ? `${p.avg_response_hours}h` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Insight panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="p-5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-status-success mb-3"><ThumbsUp className="w-4 h-4" />What&apos;s working</div>
              {working.length === 0 ? <p className="text-sm text-text-soft">Not enough data yet.</p> : working.map((p) => (
                <div key={p.id} className="py-2 border-b border-surface-border last:border-0">
                  <div className="text-sm font-semibold text-text-dark">{p.name}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">{p.volume} referrals · {p.acceptance_rate}% acceptance · {p.outcome_rate}% positive outcomes</div>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-status-error mb-3"><AlertTriangle className="w-4 h-4" />Needs attention</div>
              {attention.length === 0 ? <p className="text-sm text-text-soft">No weak links this period. 🎉</p> : attention.map((p) => (
                <div key={p.id} className="py-2 border-b border-surface-border last:border-0">
                  <div className="text-sm font-semibold text-text-dark">{p.name}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">{p.acceptance_rate}% acceptance · {p.outcome_rate}% outcomes{p.avg_response_hours != null ? ` · ${p.avg_response_hours}h response` : ""}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </DataOverlay>
    </div>
  );
}

function NetworkSvg({ orgName, inbound, outbound, maxVol }: { orgName: string; inbound: NetworkPartner[]; outbound: NetworkPartner[]; maxVol: number }) {
  const rowH = 46;
  const rows = Math.max(inbound.length, outbound.length, 1);
  const H = Math.max(220, rows * rowH + 40);
  const W = 1000;
  const cx = W / 2, cy = H / 2;
  const yFor = (i: number, n: number) => (n <= 1 ? cy : 30 + (i * (H - 60)) / (n - 1));
  const thickness = (v: number) => 1.5 + (v / maxVol) * 8.5;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 640 }}>
        {/* edges */}
        {inbound.map((p, i) => {
          const y = yFor(i, inbound.length);
          return <path key={`in-${p.id}`} d={`M 200 ${y} C 350 ${y}, 380 ${cy}, ${cx - 70} ${cy}`} stroke={edgeColor(p.acceptance_rate)} strokeWidth={thickness(p.volume)} fill="none" opacity={0.55} />;
        })}
        {outbound.map((p, i) => {
          const y = yFor(i, outbound.length);
          return <path key={`out-${p.id}`} d={`M ${cx + 70} ${cy} C 620 ${cy}, 650 ${y}, 800 ${y}`} stroke={edgeColor(p.acceptance_rate)} strokeWidth={thickness(p.volume)} fill="none" opacity={0.55} />;
        })}

        {/* inbound nodes */}
        {inbound.map((p, i) => {
          const y = yFor(i, inbound.length);
          return <NodeBox key={p.id} x={40} y={y} w={160} label={p.name} sub={`${p.volume} · ${p.acceptance_rate}%`} fill="#EEEDFE" stroke="#7F77DD" textAnchor="start" />;
        })}
        {/* outbound nodes */}
        {outbound.map((p, i) => {
          const y = yFor(i, outbound.length);
          return <NodeBox key={p.id} x={800} y={y} w={160} label={p.name} sub={`${p.volume} · ${p.acceptance_rate}%`} fill="#E9E7FA" stroke="#534AB7" textAnchor="start" />;
        })}

        {/* center node */}
        <g>
          <rect x={cx - 70} y={cy - 26} width={140} height={52} rx={12} fill="#534AB7" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{orgName.length > 18 ? orgName.slice(0, 17) + "…" : orgName}</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="#D8D5F6">Referral hub</text>
        </g>
      </svg>
    </div>
  );
}

function NodeBox({ x, y, w, label, sub, fill, stroke, textAnchor }: { x: number; y: number; w: number; label: string; sub: string; fill: string; stroke: string; textAnchor: "start" | "middle" }) {
  const tx = textAnchor === "start" ? x + 10 : x + w / 2;
  return (
    <g>
      <rect x={x} y={y - 18} width={w} height={36} rx={9} fill={fill} stroke={stroke} strokeWidth={1} />
      <text x={tx} y={y - 2} textAnchor={textAnchor} fontSize="11" fontWeight="600" fill="#3C3489">{label.length > 20 ? label.slice(0, 19) + "…" : label}</text>
      <text x={tx} y={y + 11} textAnchor={textAnchor} fontSize="9" fill="#7C77A0">{sub}</text>
    </g>
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
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded-full" style={{ background: color }} />{label}</span>;
}
