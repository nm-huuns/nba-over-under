"use client";

import type { LockState, Submission, StandingsData, Team } from "@/lib/types";
import { teamLogoUrl } from "@/lib/teams";

interface Props {
  lockState: LockState;
  submissions: Submission[];
  teams: Team[];
  standings: StandingsData | null;
}

function latestPerPerson(submissions: Submission[]): Submission[] {
  const map = new Map<string, Submission>();
  for (const sub of submissions) {
    const key = sub.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing || sub.submittedAt > existing.submittedAt) {
      map.set(key, sub);
    }
  }
  const AI_NAMES = new Set(["gemini 3", "claude opus"]);
  const isAI = (name: string) => AI_NAMES.has(name.trim().toLowerCase());
  return Array.from(map.values()).sort((a, b) => {
    const aAI = isAI(a.name), bAI = isAI(b.name);
    if (aAI !== bAI) return aAI ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

function calcScore(
  pick: "over" | "under",
  projectedWins: number,
  line: number,
  isLock: boolean
): number {
  if (projectedWins === line) return 0;
  const diff = Math.round(Math.abs(projectedWins - line));
  const correct =
    (pick === "over" && projectedWins > line) ||
    (pick === "under" && projectedWins < line);
  const base = correct ? 5 + diff : -5 - diff;
  return isLock ? base * 2 : base;
}

function fmt(n: number) {
  return n.toFixed(1);
}

export default function Submissions({ lockState, submissions, teams, standings }: Props) {
  const latest = latestPerPerson(submissions);
  const standingsMap = new Map((standings?.teams ?? []).map((s) => [s.id, s]));

  const east = teams.filter((t) => t.conference === "East");
  const west = teams.filter((t) => t.conference === "West");
  const colSpan = 5 + (lockState.locked ? latest.length : 0);

  // Compute running totals per picker (for footer row)
  const runningTotals: Record<string, number> = {};
  if (lockState.locked) {
    for (const sub of latest) {
      let total = 0;
      const locks = new Set(sub.locks ?? []);
      for (const team of teams) {
        if (team.line === null) continue;
        const pick = sub.picks[team.id];
        if (!pick) continue;
        const s = standingsMap.get(team.id);
        if (!s || s.gamesPlayed === 0) continue;
        total += calcScore(pick, s.projectedWins, team.line, locks.has(team.id));
      }
      runningTotals[sub.name] = total;
    }
  }

  if (latest.length === 0) {
    return <p className="text-muted text-sm py-8">No submissions yet.</p>;
  }

  const tableRows = (conf: Team[]) =>
    conf.map((team) => {
      const s = standingsMap.get(team.id);
      const projectedWins = s && s.gamesPlayed > 0 ? s.projectedWins : null;
      const diff =
        projectedWins !== null && team.line !== null
          ? projectedWins - team.line
          : null;

      return (
        <tr key={team.id} className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
          {/* Team */}
          <td className="py-2 pr-3 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamLogoUrl(team.id)}
                alt={team.id}
                width={20}
                height={20}
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="text-sm">{team.name}</span>
            </div>
          </td>

          {/* Line */}
          <td className="py-2 px-3 text-right font-mono text-sm text-muted whitespace-nowrap">
            {team.line ?? "–"}
          </td>

          {/* W */}
          <td className="py-2 px-2 text-right font-mono text-sm whitespace-nowrap">
            {s?.wins ?? "–"}
          </td>

          {/* L */}
          <td className="py-2 px-2 text-right font-mono text-sm whitespace-nowrap">
            {s?.losses ?? "–"}
          </td>

          {/* Proj W */}
          <td className="py-2 pl-2 pr-4 text-right font-mono text-sm whitespace-nowrap">
            {projectedWins !== null ? (
              <span
                className={
                  diff === null ? "text-muted" : diff > 0 ? "text-over" : diff < 0 ? "text-under" : "text-muted"
                }
              >
                {fmt(projectedWins)}
              </span>
            ) : (
              <span className="text-muted">–</span>
            )}
          </td>

          {/* Per-picker columns (locked only) */}
          {lockState.locked &&
            latest.map((sub) => {
              const pick = sub.picks[team.id];
              const isLock = (sub.locks ?? []).includes(team.id);
              const score =
                pick && projectedWins !== null && team.line !== null && s && s.gamesPlayed > 0
                  ? calcScore(pick, projectedWins, team.line, isLock)
                  : null;

              return (
                <td key={sub.name} className="py-2 px-3 text-center whitespace-nowrap">
                  {pick ? (
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <span
                        className={`text-xs font-bold ${
                          score === null ? "text-muted" : score > 0 ? "text-over" : score < 0 ? "text-under" : "text-muted"
                        }`}
                      >
                        {isLock ? "🔒 " : ""}
                        {pick === "over" ? "Over" : "Under"}
                      </span>
                      {score !== null && (
                        <span
                          className={`text-[0.65rem] font-mono font-semibold leading-none ${
                            score > 0 ? "text-over" : score < 0 ? "text-under" : "text-muted"
                          }`}
                        >
                          {score > 0 ? "+" : ""}
                          {score}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted text-xs">–</span>
                  )}
                </td>
              );
            })}
        </tr>
      );
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          {latest.length} picker{latest.length !== 1 ? "s" : ""}
          {!lockState.locked && " — picks hidden until submissions are locked"}
          {standings && (
            <span className="ml-2">
              · updated {new Date(standings.fetchedAt).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="text-left py-2 pr-3 text-xs font-semibold text-muted whitespace-nowrap">Team</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted whitespace-nowrap">Line</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-muted">W</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-muted">L</th>
              <th className="text-right py-2 pl-2 pr-4 text-xs font-semibold text-muted whitespace-nowrap">Proj W</th>
              {lockState.locked &&
                latest.map((sub) => (
                  <th
                    key={sub.name}
                    className="text-center py-2 px-3 text-xs font-semibold text-foreground whitespace-nowrap"
                  >
                    {sub.name}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {/* East */}
            <tr>
              <td
                colSpan={colSpan}
                className="pt-4 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted"
              >
                Eastern Conference
              </td>
            </tr>
            {tableRows(east)}

            {/* West */}
            <tr>
              <td
                colSpan={colSpan}
                className="pt-5 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted"
              >
                Western Conference
              </td>
            </tr>
            {tableRows(west)}

            {/* Totals row */}
            {lockState.locked && (
              <tr className="border-t-2 border-foreground/20">
                <td colSpan={5} className="py-3 pr-4 text-sm font-bold text-right">
                  Total
                </td>
                {latest.map((sub) => {
                  const total = runningTotals[sub.name] ?? 0;
                  return (
                    <td key={sub.name} className="py-3 px-3 text-center">
                      <span
                        className={`text-sm font-bold font-mono ${
                          total > 0 ? "text-over" : total < 0 ? "text-under" : "text-muted"
                        }`}
                      >
                        {total > 0 ? "+" : ""}
                        {total}
                      </span>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
