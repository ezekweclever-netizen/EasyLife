import { loadLocalEnv, getDatabaseUrl, connectClientWithRetry } from './_env.mjs';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('=== EASYLIFE STAGE 2 MIGRATION RUNNER ===');
  loadLocalEnv();
  const dbUrl = getDatabaseUrl();
  console.log('Connecting to Supabase PostgreSQL...');
  const client = await connectClientWithRetry(pg.Client, dbUrl);
  console.log('Connected successfully!');

  // Step 1: Apply ENUM extensions outside of transactional block
  console.log('\n[1/4] Applying ENUM extensions for user_role...');
  try {
    await client.query("ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'employer'");
    console.log(' - Added enum value: employer');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(' - Enum value employer already present');
    } else {
      console.warn(' - Notice on employer enum:', err.message);
    }
  }

  try {
    await client.query("ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'moderator'");
    console.log(' - Added enum value: moderator');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(' - Enum value moderator already present');
    } else {
      console.warn(' - Notice on moderator enum:', err.message);
    }
  }

  // Step 2: Read and execute the full migration SQL script
  console.log('\n[2/4] Reading migration script 20261124000100_master_mvp_consolidation.sql...');
  const migrationPath = path.resolve('supabase', 'migrations', '20261124000100_master_mvp_consolidation.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('[3/4] Executing migration statements...');
  const startTime = Date.now();
  await client.query(sql);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Migration script executed successfully in ${duration}s!`);

  // Step 3: Verification
  console.log('\n[4/4] Verifying applied schema changes...');

  // A. Check user_role
  const rolesRes = await client.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'user_role'
    ORDER BY enumsortorder;
  `);
  console.log(' -> Current user_role values:', rolesRes.rows.map(r => r.enumlabel).join(', '));

  // B. Check new tables
  const expectedTables = ['employer_profiles', 'job_vacancies', 'job_applications', 'business_promotions'];
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY($1)
    ORDER BY table_name;
  `, [expectedTables]);
  console.log(' -> Verified new tables created:', tablesRes.rows.map(r => r.table_name).join(', '));
  if (tablesRes.rows.length !== expectedTables.length) {
    throw new Error(`Missing expected tables! Found ${tablesRes.rows.length} of ${expectedTables.length}`);
  }

  // C. Check RLS enabled
  const rlsRes = await client.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = ANY($1) 
      AND relnamespace = 'public'::regnamespace;
  `, [expectedTables]);
  console.log(' -> RLS status on new tables:');
  for (const row of rlsRes.rows) {
    console.log(`    * ${row.relname}: RLS=${row.relrowsecurity ? 'ENABLED (PASS)' : 'DISABLED (FAIL)'}`);
    if (!row.relrowsecurity) throw new Error(`RLS not enabled on ${row.relname}!`);
  }

  // D. Check policies count
  const polRes = await client.query(`
    SELECT schemaname, tablename, count(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY($1)
    GROUP BY schemaname, tablename
    ORDER BY tablename;
  `, [expectedTables]);
  console.log(' -> Policies installed per table:');
  for (const row of polRes.rows) {
    console.log(`    * ${row.tablename}: ${row.policy_count} policies active`);
  }

  // E. Check businesses new columns
  const bizCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' 
      AND column_name IN ('website', 'logo_url', 'rating', 'review_count', 'verified_at', 'verified_by')
    ORDER BY column_name;
  `);
  console.log(' -> Businesses enhanced columns:', bizCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  // F. Check professional_profiles new columns
  const proCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
      AND column_name = 'hourly_rate_kobo';
  `);
  console.log(' -> Professional profiles enhanced columns:', proCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  // G. Check helper function
  const fnRes = await client.query(`
    SELECT proname, prosecdef 
    FROM pg_proc 
    WHERE proname = 'is_moderator' 
      AND pronamespace = 'public'::regnamespace;
  `);
  console.log(' -> Function public.is_moderator() exists and is security definer:', fnRes.rows.length > 0 && fnRes.rows[0].prosecdef);

  await client.end();
  console.log('\n=== STAGE 2 DATABASE SCHEMA MIGRATION COMPLETED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('\nFatal error during Stage 2 migration:', err);
  process.exit(1);
});
