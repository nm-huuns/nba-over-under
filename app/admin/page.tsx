"use client";

import { useState } from "react";
import { TEAMS, teamLogoUrl } from "@/lib/teams";
import type { Team } from "@/lib/types";

type Lines = Record<string, string>;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [lines, setLines] = useState<Lines>(() =>
    Object.fromEntries(TEAMS.map((t) => [t.id, ""]))
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchStatus(pw: string) {
    const [lockRes, teamsRes] = await Promise.all([
      fetch("/api/lock"),
      fetch("/api/teams"),
    ]);
    const lockData = await lockRes.json();
    const teamsData: Team[] = await teamsRes.json();
    setLocked(lockData.locked);
    const merged: Lines = Object.fromEntries(TEAMS.map((t) => [t.id, ""]));
    for (const team of teamsData) {
      if (team.line !== null && team.line !== undefined) {
        merged[team.id] = String(team.line);
      }
    }
    setLines(merged);
    void pw; // pw used by callers to gate; status is public
  }

  function authHeaders(pw: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${pw}` };
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetchStatus(password);
    setAuthed(true);
    setBusy(false);
  }

  async function toggleLock() {
    setBusy(true);
    const res = await fetch("/api/lock", {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify({ locked: !locked }),
    });
    if (res.ok) {
      setLocked((l) => !l);
      setMessage(`Submissions ${!locked ? "locked" : "unlocked"}.`);
    } else {
      setMessage("Error — wrong password?");
    }
    setBusy(false);
  }

  async function saveLines() {
    setBusy(true);
    const payload: Record<string, number | null> = {};
    for (const [id, val] of Object.entries(lines)) {
      payload[id] = val === "" ? null : parseFloat(val);
    }
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: authHeaders(password),
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? "Lines saved!" : "Error saving — wrong password?");
    setBusy(false);
  }

  async function triggerRefresh() {
    setBusy(true);
    setMessage("Refreshing…");
    const res = await fetch("/api/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${password}` },
    });
    setMessage(res.ok ? "Refresh complete!" : "Refresh failed — check logs.");
    setBusy(false);
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 px-6">
        <h1 className="text-2xl font-black mb-6">Admin</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-foreground/20 rounded px-3 py-2 bg-background text-sm"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-white font-bold py-2 rounded disabled:opacity-50"
          >
            {busy ? "Loading…" : "Enter"}
          </button>
        </form>
      </div>
    );
  }

  const east = TEAMS.filter((t) => t.conference === "East");
  const west = TEAMS.filter((t) => t.conference === "West");

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10 space-y-10">
      <h1 className="text-2xl font-black">Admin</h1>

      {message && (
        <div className="p-3 bg-accent/10 text-accent rounded text-sm font-medium">
          {message}
        </div>
      )}

      {/* Lock */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Submissions
        </h2>
        <div className="flex items-center gap-4">
          <span
            className={`text-sm font-bold ${
              locked ? "text-under" : "text-over"
            }`}
          >
            {locked === null ? "…" : locked ? "Locked" : "Open"}
          </span>
          <button
            onClick={toggleLock}
            disabled={busy || locked === null}
            className="px-4 py-1.5 border border-foreground/20 rounded text-sm font-semibold hover:bg-foreground/5 disabled:opacity-40"
          >
            {locked ? "Unlock" : "Lock"} submissions
          </button>
        </div>
      </section>

      {/* Lines */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
          Projected Win Lines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {[
            { label: "East", teams: east },
            { label: "West", teams: west },
          ].map(({ label, teams: conf }) => (
            <div key={label}>
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted mb-2">
                {label}
              </p>
              {conf.map((team) => (
                <div key={team.id} className="flex items-center gap-2 mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teamLogoUrl(team.id)} alt={team.id} width={20} height={20} className="w-5 h-5 shrink-0 object-contain" />
                  <span className="flex-1 text-sm truncate">{team.name}</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="82"
                    value={lines[team.id]}
                    onChange={(e) =>
                      setLines((prev) => ({ ...prev, [team.id]: e.target.value }))
                    }
                    placeholder="—"
                    className="w-16 border border-foreground/20 rounded px-2 py-0.5 text-sm bg-background text-right font-mono"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <button
          onClick={saveLines}
          disabled={busy}
          className="mt-5 px-6 py-2 bg-accent text-white font-bold rounded disabled:opacity-40"
        >
          Save lines
        </button>
      </section>

      {/* Refresh */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          Standings & Scores
        </h2>
        <button
          onClick={triggerRefresh}
          disabled={busy}
          className="px-4 py-2 border border-foreground/20 rounded text-sm font-semibold hover:bg-foreground/5 disabled:opacity-40"
        >
          Refresh now
        </button>
        <p className="text-xs text-muted mt-2">
          Fetches live standings, recomputes scores, appends today&apos;s entry.
          Cron runs daily at 08:00 UTC automatically.
        </p>
      </section>
    </div>
  );
}
