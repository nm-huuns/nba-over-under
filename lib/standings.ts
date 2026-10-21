import { readJson, writeJson } from "./storage";
import type { StandingEntry, StandingsData } from "./types";

const STANDINGS_URL =
  "https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings";
const GAMES_PER_SEASON = 82;

// ESPN abbreviations that differ from our team IDs
const ESPN_ID_MAP: Record<string, string> = {
  NO: "NOP",
  GS: "GSW",
  SA: "SAS",
  NY: "NYK",
};

function normalizeId(espnAbbrev: string): string {
  return ESPN_ID_MAP[espnAbbrev] ?? espnAbbrev;
}

export async function readStandings(): Promise<StandingsData | null> {
  return readJson<StandingsData>("standings.json");
}

export function projectWins(wins: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return (wins / gamesPlayed) * GAMES_PER_SEASON;
}

export async function fetchAndSaveStandings(): Promise<StandingsData> {
  const res = await fetch(STANDINGS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN standings API returned ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  const entries: StandingEntry[] = [];

  for (const conference of data.children ?? []) {
    for (const entry of conference.standings?.entries ?? []) {
      const abbrev: string = entry.team?.abbreviation ?? "";
      const id = normalizeId(abbrev);
      const stats: { name: string; value: number }[] = entry.stats ?? [];
      const getStat = (name: string) =>
        stats.find((s: { name: string }) => s.name === name)?.value ?? 0;

      const wins = getStat("wins");
      const losses = getStat("losses");
      const gamesPlayed = wins + losses;

      entries.push({
        id,
        wins,
        losses,
        gamesPlayed,
        projectedWins: projectWins(wins, gamesPlayed),
      });
    }
  }

  const standingsData: StandingsData = {
    fetchedAt: new Date().toISOString(),
    teams: entries,
  };

  await writeJson("standings.json", standingsData);
  return standingsData;
}
