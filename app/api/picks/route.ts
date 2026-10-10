import { readLockState } from "@/lib/lock";
import { appendPick } from "@/lib/picks";
import type { Pick, Submission } from "@/lib/types";

export async function POST(request: Request) {
  const lockState = await readLockState();
  if (lockState.locked) {
    return Response.json({ error: "Submissions are locked" }, { status: 423 });
  }

  let body: { name?: unknown; picks?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (!body.picks || typeof body.picks !== "object" || Array.isArray(body.picks)) {
    return Response.json({ error: "Picks are required" }, { status: 400 });
  }

  const validPicks: Record<string, Pick> = {};
  for (const [teamId, pick] of Object.entries(body.picks as Record<string, unknown>)) {
    if (pick === "over" || pick === "under") {
      validPicks[teamId] = pick;
    }
  }

  const rawLocks = (body as { locks?: unknown }).locks;
  const validLocks: string[] = [];
  if (Array.isArray(rawLocks)) {
    for (const id of rawLocks) {
      if (typeof id === "string" && validPicks[id]) {
        validLocks.push(id);
      }
    }
    if (validLocks.length > 5) {
      return Response.json({ error: "Maximum 5 locks allowed" }, { status: 400 });
    }
  }

  const submission: Submission = {
    name,
    picks: validPicks,
    locks: validLocks,
    submittedAt: new Date().toISOString(),
  };

  await appendPick(submission);
  return Response.json({ ok: true });
}
