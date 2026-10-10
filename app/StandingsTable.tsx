"use client";

import type { StandingsData, Team } from "@/lib/types";
import { teamLogoUrl } from "@/lib/teams";

interface Props {
  standings: StandingsData | null;
  teams: Team[];
}

function fmt(n: number): string {
  return n.toFixed(1);
}

export default function StandingsTable({ standings, teams }: Props) {
  if (!standings) {
    return (
      <div className="py-16 text-center text-muted text-sm">
        No standings data yet — hit Refresh or wait for the daily cron.
      </div>
    );
  }

  const standingsMap = new Map(standings.teams.map((s) => [s.id, s]));
  const fetchedAt = new Date(standings.fetchedAt).toLocaleString();

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted">Updated {fetchedAt}</p>

      {(["East", "West"] as const).map((conf) => {
        const confTeams = teams
          .filter((t) => t.conference === conf)
          .sort((a, b) => {
            const sa = standingsMap.get(a.id);
            const sb = standingsMap.get(b.id);
            return (sb?.wins ?? 0) - (sa?.wins ?? 0);
          });

        return (
          <section key={conf}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
              {conf === "East" ? "Eastern" : "Western"} Conference
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted border-b border-foreground/10">
                    <th className="text-left py-2 pr-3 font-semibold">Team</th>
                    <th className="text-right py-2 px-2 font-semibold">W</th>
                    <th className="text-right py-2 px-2 font-semibold">L</th>
                    <th className="text-right py-2 px-2 font-semibold">Proj W</th>
                    <th className="text-right py-2 px-2 font-semibold">Line</th>
                    <th className="text-right py-2 pl-2 font-semibold">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {confTeams.map((team) => {
                    const s = standingsMap.get(team.id);
                    const projectedWins = s && s.gamesPlayed > 0 ? s.projectedWins : null;
                    const diff =
                      projectedWins !== null && team.line !== null
                        ? projectedWins - team.line
                        : null;

                    return (
                      <tr
                        key={team.id}
                        className="border-b border-foreground/5 hover:bg-foreground/3"
                      >
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={teamLogoUrl(team.id)}
                              alt={team.id}
                              width={20}
                              height={20}
                              className="w-5 h-5 shrink-0 object-contain"
                            />
                            {team.name}
                          </div>
                        </td>
                        <td className="text-right py-2 px-2 font-mono">
                          {s?.wins ?? "–"}
                        </td>
                        <td className="text-right py-2 px-2 font-mono">
                          {s?.losses ?? "–"}
                        </td>
                        <td className="text-right py-2 px-2 font-mono">
                          {projectedWins !== null ? fmt(projectedWins) : "–"}
                        </td>
                        <td className="text-right py-2 px-2 font-mono text-muted">
                          {team.line ?? "–"}
                        </td>
                        <td
                          className={`text-right py-2 pl-2 font-mono font-bold ${
                            diff === null
                              ? "text-muted"
                              : diff > 0
                              ? "text-over"
                              : diff < 0
                              ? "text-under"
                              : "text-muted"
                          }`}
                        >
                          {diff === null
                            ? "–"
                            : diff > 0
                            ? `+${fmt(diff)}`
                            : fmt(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
