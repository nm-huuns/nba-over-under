"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyScore } from "@/lib/types";

interface Props {
  scores: DailyScore[];
}

const LINE_COLORS = [
  "#e87722", "#3b82f6", "#10b981", "#a855f7",
  "#f59e0b", "#ec4899", "#06b6d4", "#84cc16",
];

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function Leaderboard({ scores }: Props) {
  if (scores.length === 0) {
    return (
      <div className="py-16 text-center text-muted text-sm">
        No scoring data yet — standings refresh runs daily once the season starts.
      </div>
    );
  }

  // Collect all unique names in order of first appearance
  const names = Array.from(
    new Set(scores.flatMap((s) => Object.keys(s.totals)))
  );

  // Shape data for recharts: [{date, Name1: score, Name2: score, ...}]
  const chartData = scores.map((s) => {
    const entry: Record<string, string | number> = { date: formatDate(s.date) };
    for (const name of names) {
      if (s.totals[name] !== undefined) entry[name] = s.totals[name];
    }
    return entry;
  });

  // Latest scores for the rankings table
  const latestTotals = scores[scores.length - 1].totals;
  const rankings = Object.entries(latestTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score], i) => ({ rank: i + 1, name, score }));

  return (
    <div className="space-y-10">
      {/* Line chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-background)",
                border: "1px solid color-mix(in srgb, var(--color-foreground) 15%, transparent)",
                borderRadius: "6px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rankings table */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Current Standings
        </h2>
        <div className="space-y-1">
          {rankings.map(({ rank, name, score }) => (
            <div
              key={name}
              className={`flex items-center gap-4 px-3 py-2.5 rounded ${
                rank === 1 ? "bg-accent/10" : "bg-foreground/3"
              }`}
            >
              <span className="w-5 text-sm font-bold text-muted text-right shrink-0">
                {rank}
              </span>
              <span className="flex-1 font-semibold">{name}</span>
              <span
                className={`font-mono font-bold text-sm ${
                  score > 0 ? "text-over" : score < 0 ? "text-under" : "text-muted"
                }`}
              >
                {score > 0 ? "+" : ""}
                {score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
