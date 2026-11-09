import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

let loaded = false;

export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;

  const candidates = [
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, "apps", "web", ".env.local"),
    path.join(repoRoot, ".env"),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

export function getDatabaseUrl() {
  loadLocalEnv();
  const dbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL)?.trim();
  if (!dbUrl) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Add DATABASE_URL to apps/web/.env.local or export it before running database scripts."
    );
  }
  return dbUrl;
}
