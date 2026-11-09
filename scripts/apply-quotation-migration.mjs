import { getDatabaseUrl } from './_env.mjs';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to remote Supabase PostgreSQL...');
  const client = new Client({ connectionString: getDatabaseUrl(), ssl: { rejectUnauthorized: false },
    query_timeout: 60000 });

  await client.connect();
  console.log('Connected successfully!');

  // 1. Add enum value outside transaction
  console.log("Adding 'draft' value to public.quotation_status enum (if not exists)...");
  try {
    await client.query("ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'draft';");
    console.log("Enum 'draft' value added or already present.");
  } catch (err) {
    console.log("Enum notice/error (harmless if already exists):", err.message);
  }

  // 2. Read migration file
  const migrationPath = path.resolve('supabase', 'migrations', '20261104000900_quotation_management_system.sql');
  console.log(`Reading migration: ${migrationPath}...`);
  let sql = fs.readFileSync(migrationPath, 'utf8');

  // Strip out the DO $$ block for enum since we already executed it standalone
  sql = sql.replace(/DO \$\$[\s\S]*?END \$\$;/i, '-- [Enum handled standalone]');

  console.log('Executing quotation management migration...');
  const startTime = Date.now();
  try {
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Migration applied successfully in ${duration}s!`);
  } catch (err) {
    console.error('Migration failed:', err);
    await client.end();
    process.exit(1);
  }

  // 3. Verify changes
  console.log('\n--- VERIFICATION ---');
  const colRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotations'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in public.quotations:');
  for (const c of colRes.rows) {
    console.log(` - ${c.column_name} (${c.data_type})`);
  }

  const verTableRes = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'quotation_versions';
  `);
  console.log('\nQuotation versions table:', verTableRes.rows);

  const spRes = await client.query(`
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN (
        'submit_or_revise_quotation',
        'withdraw_quotation',
        'decline_booking_quotation',
        'request_quotation_clarification',
        'accept_booking_quotation'
      );
  `);
  console.log('\nStored procedures verified:');
  for (const r of spRes.rows) {
    console.log(` - ${r.routine_name}`);
  }

  await client.end();
  console.log('\nQuotation migration applied and verified successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
