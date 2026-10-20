export const dynamic = "force-dynamic";

import { readLockState } from "@/lib/lock";
import { readPicks } from "@/lib/picks";
import { readStandings } from "@/lib/standings";
import { readScores } from "@/lib/scoring";
import { readJson } from "@/lib/storage";
import { TEAMS } from "@/lib/teams";
import type { DailyScore, LockState, Submission, StandingsData, Team } from "@/lib/types";
import PicksTabs from "./PicksTabs";

export default async function Home() {
  const [lockState, submissions, standings, scores, storedTeams] =
    await Promise.all([
      readLockState(),
      readPicks().catch((): Submission[] => []),
      readStandings(),
      readScores().catch((): DailyScore[] => []),
      readJson<Team[]>("teams.json"),
    ]);

  // Merge stored lines into the hardcoded TEAMS list
  const teams: Team[] = TEAMS.map((team) => {
    const stored = storedTeams?.find((t) => t.id === team.id);
    return stored ? { ...team, line: stored.line } : team;
  });

  return (
    <>
      <header className="bg-black px-4 sm:px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex items-end justify-between">
          <h1 className="text-[2.2rem] font-black leading-none tracking-[-0.05em] text-white">
            Over/Under
            <br />
            <em className="not-italic text-accent">Picks.</em>
          </h1>
          <div className="text-[0.75rem] font-bold tracking-[0.1em] text-[#555] uppercase pb-1">
            2026–27 Season
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full pb-16">
        <PicksTabs
          lockState={lockState as LockState}
          submissions={submissions as Submission[]}
          standings={standings as StandingsData | null}
          scores={scores as DailyScore[]}
          teams={teams}
        />
      </main>
    </>
  );
}
