"use client";

import type { LockState, Submission, Team } from "@/lib/types";
import { teamLogoUrl } from "@/lib/teams";

interface Props {
  lockState: LockState;
  submissions: Submission[];
  teams: Team[];
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
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function Submissions({ lockState, submissions, teams }: Props) {
  const latest = latestPerPerson(submissions);

  if (latest.length === 0) {
    return <p className="text-muted text-sm py-8">No submissions yet.</p>;
  }

  // ── Pre-lock: just show who has submitted ───────────────────────────────────
  if (!lockState.locked) {
    return (
      <div>
        <p className="text-sm text-muted mb-4">
          {latest.length} picker{latest.length !== 1 ? "s" : ""} submitted — picks hidden until submissions are locked.
        </p>
        <div className="space-y-2">
          {latest.map((sub) => (
            <div key={sub.name} className="flex items-center justify-between py-2 border-b border-foreground/5">
              <span className="font-semibold">{sub.name}</span>
              <span className="text-xs text-muted">
                {new Date(sub.submittedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Post-lock: team-by-team view ────────────────────────────────────────────
  const east = teams.filter((t) => t.conference === "East");
  const west = teams.filter((t) => t.conference === "West");

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {latest.length} picker{latest.length !== 1 ? "s" : ""} · submissions locked
      </p>

      {[
        { label: "Eastern Conference", conf: east },
        { label: "Western Conference", conf: west },
      ].map(({ label, conf }) => (
        <section key={label}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            {label}
          </h2>
          <div className="space-y-px">
            {conf.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 py-2.5 border-b border-foreground/5"
              >
                {/* Team */}
                <div className="flex items-center gap-2 w-44 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={teamLogoUrl(team.id)}
                    alt={team.id}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  <span className="text-sm truncate">{team.name}</span>
                </div>

                {/* Line */}
                <span className="w-10 text-xs font-mono text-muted shrink-0 text-right">
                  {team.line ?? "–"}
                </span>

                {/* Each picker's choice */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {latest.map((sub) => {
                    const pick = sub.picks[team.id];
                    const isLock = (sub.locks ?? []).includes(team.id);
                    return (
                      <span
                        key={sub.name}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                          isLock ? "ring-1 ring-accent" : ""
                        } ${
                          pick === "over"
                            ? "bg-over/15 text-over font-semibold"
                            : pick === "under"
                            ? "bg-under/15 text-under font-semibold"
                            : "bg-foreground/5 text-muted"
                        }`}
                      >
                        {isLock && "🔒"}
                        <span>{sub.name}</span>
                        <span className="font-bold font-mono">
                          {pick === "over" ? "O" : pick === "under" ? "U" : "–"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
