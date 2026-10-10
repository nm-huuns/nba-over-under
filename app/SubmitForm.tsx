"use client";

import { useState } from "react";
import type { LockState, Pick, Team } from "@/lib/types";
import { teamLogoUrl } from "@/lib/teams";

const MAX_LOCKS = 5;

interface Props {
  lockState: LockState;
  teams: Team[];
}

export default function SubmitForm({ lockState, teams }: Props) {
  const [name, setName] = useState("");
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [lockedPicks, setLockedPicks] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const linesSet = teams.every((t) => t.line !== null);
  const allPicked = teams.filter((t) => t.line !== null).every((t) => picks[t.id]);
  const canSubmit = name.trim() && allPicked && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          picks,
          locks: Array.from(lockedPicks),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Submission failed. Try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggle(teamId: string, value: Pick) {
    setPicks((prev) => ({ ...prev, [teamId]: value }));
  }

  function toggleLock(teamId: string) {
    if (!picks[teamId]) return; // must have a pick first
    setLockedPicks((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else if (next.size < MAX_LOCKS) {
        next.add(teamId);
      }
      return next;
    });
  }

  // ── Locked ─────────────────────────────────────────────────────────────────
  if (lockState.locked) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-bold mb-1">Submissions are closed.</p>
        <p className="text-sm text-muted">Check the Submissions tab to see everyone&apos;s picks.</p>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-xl font-bold mb-2">Picks submitted!</p>
        <p className="text-muted text-sm">Good luck, {name}.</p>
      </div>
    );
  }

  // ── Submission form ─────────────────────────────────────────────────────────
  if (!linesSet) {
    return (
      <p className="text-muted text-sm py-8">
        Lines haven&apos;t been set yet — check back soon.
      </p>
    );
  }

  const eastTeams = teams.filter((t) => t.conference === "East");
  const westTeams = teams.filter((t) => t.conference === "West");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block text-sm font-semibold mb-1.5" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full max-w-xs border border-foreground/20 rounded px-3 py-2 bg-background text-sm"
          required
        />
      </div>

      {/* Lock counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Locks:</span>
        <span
          className={`text-sm font-mono font-bold ${
            lockedPicks.size === MAX_LOCKS ? "text-accent" : "text-foreground"
          }`}
        >
          {lockedPicks.size} / {MAX_LOCKS}
        </span>
        <span className="text-xs text-muted">
          — pick a team first, then mark it 🔒 for double points
        </span>
      </div>

      {[
        { label: "Eastern Conference", teams: eastTeams },
        { label: "Western Conference", teams: westTeams },
      ].map(({ label, teams: conf }) => (
        <section key={label}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            {label}
          </h2>
          <div className="space-y-1">
            {conf.map((team) => {
              const hasPick = !!picks[team.id];
              const isLocked = lockedPicks.has(team.id);
              const canLock = hasPick && (isLocked || lockedPicks.size < MAX_LOCKS);

              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 py-2 border-b border-foreground/5 ${
                    isLocked ? "bg-accent/5 -mx-2 px-2 rounded" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={teamLogoUrl(team.id)}
                    alt={team.id}
                    width={24}
                    height={24}
                    className="w-6 h-6 shrink-0 object-contain"
                  />
                  <span className="flex-1 text-sm">{team.name}</span>
                  <span className="w-12 text-right text-sm font-mono text-muted shrink-0">
                    {team.line}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggle(team.id, "over")}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                        picks[team.id] === "over"
                          ? "bg-over text-white"
                          : "border border-foreground/20 text-muted hover:border-over hover:text-over"
                      }`}
                    >
                      O
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(team.id, "under")}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                        picks[team.id] === "under"
                          ? "bg-under text-white"
                          : "border border-foreground/20 text-muted hover:border-under hover:text-under"
                      }`}
                    >
                      U
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLock(team.id)}
                      disabled={!canLock}
                      title={
                        !hasPick
                          ? "Pick O or U first"
                          : !canLock
                          ? "5 locks already selected"
                          : isLocked
                          ? "Remove lock"
                          : "Mark as lock (2× points)"
                      }
                      className={`w-8 py-1 text-sm rounded transition-colors ${
                        isLocked
                          ? "bg-accent text-white"
                          : "border border-foreground/20 text-muted hover:border-accent hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed"
                      }`}
                    >
                      🔒
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && <p className="text-under text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="px-8 py-2.5 bg-accent text-white font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : "Submit Picks"}
      </button>

      {!allPicked && name && (
        <p className="text-xs text-muted">
          Pick Over or Under for every team to submit.
        </p>
      )}
    </form>
  );
}
