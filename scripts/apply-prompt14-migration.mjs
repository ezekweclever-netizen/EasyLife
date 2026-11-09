import { getDatabaseUrl } from './_env.mjs';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const migrationFile = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20261104001100_completion_reviews_and_disputes.sql"
);

const connectionString =
  getDatabaseUrl();

async function run() {
  console.log("Applying Prompt 14 migration to live remote Supabase database...");
  const sql = fs.readFileSync(migrationFile, "utf8");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL.");

  try {
    await client.query(sql);
    console.log("Migration 20261104001100 applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
