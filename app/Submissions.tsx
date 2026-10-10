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
  const east = teams.filter((t) => t.conference === "East");
  const west = teams.filter((t) => t.conference === "West");

  if (latest.length === 0) {
    return (
      <p className="text-muted text-sm py-8">No submissions yet.</p>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-6">
        {latest.length} picker{latest.length !== 1 ? "s" : ""} submitted
        {!lockState.locked && " — picks hidden until submissions are locked"}.
      </p>

      <div className="space-y-4">
        {latest.map((sub) => {
          const subLocks = new Set(sub.locks ?? []);

          return (
            <div key={sub.name} className="border border-foreground/10 rounded-lg p-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-bold text-lg">{sub.name}</span>
                <span className="text-xs text-muted">
                  {subLocks.size > 0 && `${subLocks.size} lock${subLocks.size !== 1 ? "s" : ""} · `}
                  {new Date(sub.submittedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Picks hidden until locked */}
              {!lockState.locked ? (
                <p className="text-xs text-muted italic">Picks hidden until submissions close.</p>
              ) : (
                <>
                  {[
                    { label: "East", conf: east },
                    { label: "West", conf: west },
                  ].map(({ label, conf }) => (
                    <div key={label} className="mb-2">
                      <div className="text-[0.65rem] font-bold uppercase tracking-widest text-muted mb-1">
                        {label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {conf.map((team) => {
                          const pick = sub.picks[team.id];
                          const isLock = subLocks.has(team.id);
                          return (
                            <span
                              key={team.id}
                              className={`flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded ${
                                isLock ? "ring-1 ring-accent font-bold" : ""
                              } ${
                                pick === "over"
                                  ? "bg-over/15 text-over"
                                  : pick === "under"
                                  ? "bg-under/15 text-under"
                                  : "text-muted"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={teamLogoUrl(team.id)}
                                alt={team.id}
                                width={12}
                                height={12}
                                className="w-3 h-3 object-contain"
                              />
                              {isLock ? "🔒" : ""}
                              {pick === "over" ? "O" : pick === "under" ? "U" : "–"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
