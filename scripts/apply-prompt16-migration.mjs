import pg from 'pg';
import fs from 'fs';
import { getDatabaseUrl } from './_env.mjs';
const { Pool } = pg;

const CONNECTION_STRING = getDatabaseUrl();

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Applying migration: 20261104001300_admin_dashboard_and_operations.sql ...');
  const sql = fs.readFileSync(
    'supabase/migrations/20261104001300_admin_dashboard_and_operations.sql',
    'utf-8'
  );

  try {
    await pool.query(sql);
    console.log('✅ Migration 20261104001300 applied successfully!');
  } catch (err) {
    console.error('❌ Failed to apply migration:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
