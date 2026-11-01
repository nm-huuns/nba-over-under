"use client";

import { useState } from "react";
import type { DailyScore, LockState, Submission, StandingsData, Team } from "@/lib/types";
import SubmitForm from "./SubmitForm";
import Leaderboard from "./Leaderboard";
import Submissions from "./Submissions";

interface Props {
  lockState: LockState;
  submissions: Submission[];
  standings: StandingsData | null;
  scores: DailyScore[];
  teams: Team[];
}

const TABS = ["Leaderboard", "Submit Picks", "Picks"] as const;
type Tab = (typeof TABS)[number];

export default function PicksTabs({
  lockState,
  submissions,
  standings,
  scores,
  teams,
}: Props) {
  const [active, setActive] = useState<Tab>("Leaderboard");
  const visibleTabs = TABS.filter(
    (tab) => !(tab === "Submit Picks" && lockState.locked)
  );

  return (
    <div className="mt-6">
      <div className="flex gap-1 border-b border-foreground/10 mb-6">
        {visibleTabs.map((tab) => {
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                active === tab
                  ? "border-b-2 border-accent text-accent -mb-px"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {active === "Leaderboard" && <Leaderboard scores={scores} />}
      {active === "Submit Picks" && (
        <SubmitForm lockState={lockState} teams={teams} />
      )}
      {active === "Picks" && (
        <Submissions
          lockState={lockState}
          submissions={submissions}
          teams={teams}
          standings={standings}
        />
      )}
    </div>
  );
}
