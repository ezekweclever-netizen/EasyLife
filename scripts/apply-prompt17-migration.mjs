import { getDatabaseUrl } from './_env.mjs';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function applyMigration() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261104001400_ai_assistant_and_usage_logs.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log("Applying migration: 20261104001400_ai_assistant_and_usage_logs.sql ...");
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("✅ Migration 20261104001400 applied successfully!");
  } finally {
    await client.end();
  }
}

applyMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
