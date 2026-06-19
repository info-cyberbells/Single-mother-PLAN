"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface CasesAreaChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}

export function CasesAreaChart({
  data,
  color = "#4d41df",
  height = 220,
}: CasesAreaChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="partnerGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3dfff" vertical={false} />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: "#777587", fontFamily: "Nunito" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#777587", fontFamily: "Nunito" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1.5px solid #e3dfff",
            borderRadius: "12px",
            padding: "8px 12px",
            boxShadow: "0 8px 24px rgba(77, 65, 223, 0.12)",
            fontSize: "13px",
            fontFamily: "Nunito, sans-serif",
            color: "#1b1b1e",
          }}
          labelStyle={{ fontWeight: 700, marginBottom: 2 }}
          itemStyle={{ color: color }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#partnerGradient)"
          dot={false}
          activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface StatusBarItem {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#10B981",
  in_progress: "#674bb5",
  pending: "#F59E0B",
  closed: "#4d41df",
  cancelled: "#EF4444",
};

export function CasesStatusChart({ data, height = 180 }: { data: StatusBarItem[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
        barSize={32}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e3dfff" vertical={false} />
        <XAxis
          dataKey="status"
          tick={{ fontSize: 11, fill: "#777587", fontFamily: "Nunito" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#777587", fontFamily: "Nunito" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1.5px solid #e3dfff",
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "13px",
            fontFamily: "Nunito, sans-serif",
            color: "#1b1b1e",
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "#4d41df"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
