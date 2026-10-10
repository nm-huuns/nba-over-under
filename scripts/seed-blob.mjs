// One-time seed of the Vercel Blob store from local data/*.json files.
// Run after `vercel env pull .env.local` to get BLOB_READ_WRITE_TOKEN:
//   node scripts/seed-blob.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const ROOT = path.resolve(import.meta.dirname, "..");
const FILES = ["lock.json", "teams.json", "picks.json", "scores.json"];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set. Run `vercel env pull .env.local` first.");
    process.exit(1);
  }

  for (const file of FILES) {
    let body;
    try {
      body = await readFile(path.join(ROOT, "data", file), "utf8");
    } catch {
      console.log(`skip ${file} (not found locally)`);
      continue;
    }
    await put(file, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    console.log(`uploaded ${file} (${body.length} bytes)`);
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
