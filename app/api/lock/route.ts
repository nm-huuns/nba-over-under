import { readLockState, writeLockState } from "@/lib/lock";

export async function GET() {
  const state = await readLockState();
  return Response.json(state);
}

export async function POST(request: Request) {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${adminPw}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { locked?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await writeLockState({ locked: Boolean(body.locked) });
  return Response.json({ ok: true });
}
