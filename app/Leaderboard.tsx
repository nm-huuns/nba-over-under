"use client";

import { useState } from "react";
import {
  CartesianGrid,
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
  "#1d4ed8", "#60a5fa", "#ec4899", "#a855f7",
  "#f59e0b", "#06b6d4", "#84cc16", "#e87722",
];

const AI_NAMES = new Set(["gemini 3", "claude opus", "gpt-6"]);
const AI_GREYS = ["#888888", "#aaaaaa", "#666666"];

const RANGES = [
  { label: "Full season", days: null },
  { label: "Last 30 days", days: 30 },
  { label: "Last 7 days", days: 7 },
] as const;
type Range = (typeof RANGES)[number];

function isAI(name: string) {
  return AI_NAMES.has(name.trim().toLowerCase());
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function Leaderboard({ scores }: Props) {
  const [range, setRange] = useState<Range>(RANGES[0]);

  if (scores.length === 0) {
    return (
      <div className="py-16 text-center text-muted text-sm">
        No scoring data yet — standings refresh runs daily once the season starts.
      </div>
    );
  }

  const filteredScores = range.days === null
    ? scores
    : scores.slice(-range.days);

  // Collect all unique names: humans first (alphabetical), AIs last
  const allNames = Array.from(new Set(filteredScores.flatMap((s) => Object.keys(s.totals))));
  const humans = allNames.filter((n) => !isAI(n)).sort((a, b) => a.localeCompare(b));
  const ais = allNames.filter((n) => isAI(n)).sort((a, b) => a.localeCompare(b));
  const names = [...humans, ...ais];

  // Shape data for recharts: [{date, Name1: score, Name2: score, ...}]
  const chartData = filteredScores.map((s) => {
    const entry: Record<string, string | number> = { date: formatDate(s.date) };
    for (const name of names) {
      if (s.totals[name] !== undefined) entry[name] = s.totals[name];
    }
    return entry;
  });

  // Build name → chart colour map
  const colorMap: Record<string, string> = {};
  let humanIdx = 0;
  for (const name of names) {
    if (isAI(name)) {
      colorMap[name] = AI_GREYS[ais.indexOf(name) % AI_GREYS.length];
    } else {
      colorMap[name] = LINE_COLORS[humanIdx++ % LINE_COLORS.length];
    }
  }

  // Latest scores for the rankings table
  const latestTotals = filteredScores[filteredScores.length - 1].totals;
  const rankings = Object.entries(latestTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score], i) => ({ rank: i + 1, name, score }));

  return (
    <div className="space-y-10">
      {/* Range selector + chart */}
      <div>
        <div className="flex gap-1.5 mb-4">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                range === r
                  ? "bg-accent text-white"
                  : "bg-foreground/8 text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
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

            {names.map((name, i) => {
              const ai = isAI(name);
              const aiIndex = ais.indexOf(name);
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={ai ? AI_GREYS[aiIndex % AI_GREYS.length] : LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={ai ? 1.5 : 2}
                  strokeDasharray={ai ? "4 4" : undefined}
                  dot={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* Rankings table */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Current Standings
        </h2>
        <div className="space-y-1">
          {rankings.map(({ rank, name, score }) => {
            const color = colorMap[name];
            return (
              <div
                key={name}
                className={`flex items-center gap-4 px-3 py-2.5 rounded ${
                  rank === 1 ? "bg-accent/10" : "bg-foreground/3"
                }`}
              >
                <span className="w-5 text-sm font-bold text-muted text-right shrink-0">
                  {rank}
                </span>
                <span className="flex-1 font-semibold" style={{ color }}>
                  {name}
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    score > 0 ? "text-over" : score < 0 ? "text-under" : "text-muted"
                  }`}
                >
                  {score > 0 ? "+" : ""}
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
