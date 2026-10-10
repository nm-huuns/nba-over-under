# CLAUDE.md

## What this is

NBA over/under win-total picks app for a friend group. Each person submits Over or Under for every team's projected win line before the season. Daily cron fetches standings, computes projected final wins, and scores picks. A line chart tracks each person's running total.

## Scoring

Per team:
- `projectedWins = (wins / gamesPlayed) × 82`
- `diff = round(|projectedWins - line|)`
- Correct pick: `+5 + diff`
- Wrong pick: `-5 - diff`
- Exact tie (projectedWins === line): 0 points

Scores are re-computed fresh each day from current standings (not accumulated). `scores.json` stores a daily snapshot history — the line chart plots these over time.

## Storage (`lib/storage.ts`)

Same pattern as financial-assets-ai: `data/` directory in dev, Vercel Blob (private) in prod, switched on `BLOB_READ_WRITE_TOKEN`.

Files:
- `teams.json` — 30 teams with lines (admin-seeded via `/admin`). Teams are hardcoded in `lib/teams.ts`; only lines are stored.
- `picks.json` — all submissions, append-only. `latestPerPerson()` returns each person's most recent pick for scoring.
- `standings.json` — daily cache from ESPN API.
- `scores.json` — sorted array of `{date, totals}` entries. Re-written daily by `/api/refresh`.
- `lock.json` — `{locked: boolean}`. Toggled from `/admin`.

## API routes

- `POST /api/picks` — append submission (rejects if locked)
- `GET /api/lock` / `POST /api/lock` — read/toggle lock state (POST requires `ADMIN_PASSWORD`)
- `GET /api/teams` / `POST /api/teams` — read/seed team lines (POST requires `ADMIN_PASSWORD`)
- `GET /api/refresh` — Vercel Cron entry point (requires `CRON_SECRET`)
- `POST /api/refresh` — manual admin trigger (requires `ADMIN_PASSWORD`)

## Teams

Hardcoded in `lib/teams.ts` as `TEAMS` constant. ESPN abbreviations may differ from ours — `lib/standings.ts` has an `ESPN_ID_MAP` to normalise them (NO→NOP, GS→GSW, SA→SAS, NY→NYK).

## Admin

`/admin` — password-protected UI for:
1. Lock/unlock submissions
2. Set projected win lines for all 30 teams
3. Manual standings + scores refresh

## Vercel deploy steps

1. `vercel link`
2. Create a Blob store in the Vercel dashboard → Storage → connect to project (injects `BLOB_READ_WRITE_TOKEN`)
3. `vercel env add ADMIN_PASSWORD` (Production + Preview)
4. `vercel env add CRON_SECRET` (Production)
5. `vercel env pull .env.local` then `node scripts/seed-blob.mjs`
6. `vercel deploy` (preview) → verify admin + picks form → `vercel deploy --prod`
7. Confirm cron at Project → Settings → Cron Jobs

## To do

- Unit tests for `computeScores` and `scoreTeam`
- Submission edit: allow resubmission before lock (currently supported — latest wins)
- Mobile: standings table scrolls horizontally on small screens (acceptable for now)
