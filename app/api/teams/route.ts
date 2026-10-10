import { readJson, writeJson } from "@/lib/storage";
import { TEAMS } from "@/lib/teams";
import type { Team } from "@/lib/types";

export async function GET() {
  const stored = await readJson<Team[]>("teams.json");
  if (stored) return Response.json(stored);
  return Response.json(TEAMS);
}

export async function POST(request: Request) {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${adminPw}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let lines: Record<string, unknown>;
  try {
    lines = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teams: Team[] = TEAMS.map((t) => ({
    ...t,
    line: typeof lines[t.id] === "number" ? (lines[t.id] as number) : null,
  }));

  await writeJson("teams.json", teams);
  return Response.json({ ok: true });
}
