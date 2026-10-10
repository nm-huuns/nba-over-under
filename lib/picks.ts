import { readJson, writeJson } from "./storage";
import type { Submission } from "./types";

export async function readPicks(): Promise<Submission[]> {
  return (await readJson<Submission[]>("picks.json")) ?? [];
}

export async function appendPick(submission: Submission): Promise<void> {
  const existing = await readPicks();
  await writeJson("picks.json", [...existing, submission]);
}

// Returns the latest submission per person, keyed by lowercased trimmed name.
export function latestPerPerson(submissions: Submission[]): Map<string, Submission> {
  const map = new Map<string, Submission>();
  for (const sub of submissions) {
    const key = sub.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing || sub.submittedAt > existing.submittedAt) {
      map.set(key, sub);
    }
  }
  return map;
}
