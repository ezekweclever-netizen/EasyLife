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
  "20261104001200_business_and_property_maintenance.sql"
);

const connectionString =
  getDatabaseUrl();

async function run() {
  console.log("Applying Prompt 15 migration to live remote Supabase database...");
  const sql = fs.readFileSync(migrationFile, "utf8");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");
    await client.query("BEGIN;");
    await client.query(sql);
    await client.query("COMMIT;");
    console.log("Prompt 15 migration applied successfully!");
  } catch (err) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
