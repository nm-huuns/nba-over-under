export type Pick = "over" | "under";

export interface Team {
  id: string;
  name: string;
  conference: "East" | "West";
  line: number | null;
}

export interface Submission {
  name: string;
  picks: Record<string, Pick>;
  locks: string[];
  submittedAt: string;
}

export interface StandingEntry {
  id: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  projectedWins: number;
}

export interface StandingsData {
  fetchedAt: string;
  teams: StandingEntry[];
}

export interface DailyScore {
  date: string;
  totals: Record<string, number>;
}

export interface LockState {
  locked: boolean;
}
