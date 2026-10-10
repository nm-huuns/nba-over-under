import { fetchAndSaveStandings } from "@/lib/standings";
import { readPicks } from "@/lib/picks";
import { readJson } from "@/lib/storage";
import { computeScores, appendDailyScore } from "@/lib/scoring";
import { TEAMS } from "@/lib/teams";
import type { Team } from "@/lib/types";

// GET is called by Vercel Cron (Authorization: Bearer CRON_SECRET)
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return run();
}

// POST is for manual admin triggers (Authorization: Bearer ADMIN_PASSWORD)
export async function POST(request: Request) {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${adminPw}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return run();
}

async function run() {
  try {
    const [standings, submissions, storedTeams] = await Promise.all([
      fetchAndSaveStandings(),
      readPicks(),
      readJson<Team[]>("teams.json"),
    ]);

    const teams: Team[] = TEAMS.map((team) => {
      const stored = storedTeams?.find((t) => t.id === team.id);
      return stored ?? team;
    });

    const totals = computeScores(submissions, standings, teams);
    const today = new Date().toISOString().split("T")[0];
    const scores = await appendDailyScore(today, totals);

    return Response.json({ ok: true, date: today, standings, scores });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
