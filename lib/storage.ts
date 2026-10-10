import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function readJson<T>(key: string): Promise<T | null> {
  if (useBlob) {
    try {
      const res = await get(key, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200) return null;
      const text = await new Response(res.stream).text();
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  if (useBlob) {
    await put(key, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  await fs.writeFile(path.join(DATA_DIR, key), body);
}
