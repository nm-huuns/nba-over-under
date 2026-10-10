import { readJson, writeJson } from "./storage";
import type { LockState } from "./types";

export async function readLockState(): Promise<LockState> {
  return (await readJson<LockState>("lock.json")) ?? { locked: false };
}

export async function writeLockState(state: LockState): Promise<void> {
  await writeJson("lock.json", state);
}
