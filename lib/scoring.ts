import { readJson, writeJson } from "./storage";
import type { DailyScore, StandingsData, Submission, Team } from "./types";
import { latestPerPerson } from "./picks";

export async function readScores(): Promise<DailyScore[]> {
  return (await readJson<DailyScore[]>("scores.json")) ?? [];
}

// Correct pick: +5 + round(|projected - line|), doubled for locks
// Wrong pick:   -5 - round(|projected - line|), doubled for locks
// Exact tie:     0 (neither over nor under)
function scoreTeam(
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

export function computeScores(
  submissions: Submission[],
  standings: StandingsData,
  teams: Team[]
): Record<string, number> {
  const latest = latestPerPerson(submissions);
  const standingsMap = new Map(standings.teams.map((s) => [s.id, s]));
  const scorableTeams = teams.filter((t) => t.line !== null);

  const totals: Record<string, number> = {};

  for (const [, sub] of latest) {
    let score = 0;
    const lockSet = new Set(sub.locks ?? []);
    for (const team of scorableTeams) {
      const pick = sub.picks[team.id];
      if (!pick) continue;
      const standing = standingsMap.get(team.id);
      if (!standing || standing.gamesPlayed === 0) continue;
      score += scoreTeam(pick, standing.projectedWins, team.line!, lockSet.has(team.id));
    }
    totals[sub.name] = score;
  }

  return totals;
}

// Append (or replace) today's entry in scores.json, kept sorted by date.
export async function appendDailyScore(
  date: string,
  totals: Record<string, number>
): Promise<DailyScore[]> {
  const existing = await readScores();
  const filtered = existing.filter((s) => s.date !== date);
  const updated = [...filtered, { date, totals }].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  await writeJson("scores.json", updated);
  return updated;
}
