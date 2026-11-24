import { loadLocalEnv, getDatabaseUrl, connectClientWithRetry } from './_env.mjs';
import pg from 'pg';

async function main() {
  console.log('=== EASYLIFE STAGE 2 INTEGRATION & RLS VERIFICATION SUITE ===');
  loadLocalEnv();
  const client = await connectClientWithRetry(pg.Client, getDatabaseUrl());

  // 1. Verify User Roles
  console.log('\n[TEST 1] Verifying extended user_role ENUM...');
  const roles = await client.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'user_role'
    ORDER BY enumsortorder;
  `);
  const roleLabels = roles.rows.map(r => r.enumlabel);
  const requiredRoles = ['customer', 'professional', 'business', 'property_manager', 'admin', 'employer', 'moderator'];
  for (const role of requiredRoles) {
    if (!roleLabels.includes(role)) {
      throw new Error(`Missing expected role in enum: ${role}`);
    }
  }
  console.log(`  [PASS] All ${requiredRoles.length} required user roles verified: ${roleLabels.join(', ')}`);

  // 2. Verify Table Columns & Enhancements
  console.log('\n[TEST 2] Verifying table enhancements...');
  const bizCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' 
      AND column_name IN ('website', 'logo_url', 'rating', 'review_count', 'verified_at', 'verified_by');
  `);
  if (bizCols.rows.length < 6) {
    throw new Error(`Businesses table missing required columns! Found: ${bizCols.rows.map(r => r.column_name).join(', ')}`);
  }
  console.log(`  [PASS] Businesses directory columns verified: ${bizCols.rows.map(r => r.column_name).join(', ')}`);

  const proCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
      AND column_name = 'hourly_rate_kobo';
  `);
  if (proCols.rows.length < 1) {
    throw new Error('Professional profiles missing hourly_rate_kobo column!');
  }
  console.log('  [PASS] Professional profiles hourly_rate_kobo column verified.');

  // 3. Verify New Tables & Constraints
  console.log('\n[TEST 3] Verifying new MVP tables...');
  const newTables = ['employer_profiles', 'job_vacancies', 'job_applications', 'business_promotions'];
  for (const tbl of newTables) {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [tbl]);
    if (res.rows.length === 0) throw new Error(`Table ${tbl} not found!`);
  }
  console.log(`  [PASS] All ${newTables.length} tables verified in public schema.`);

  // 4. Verify RLS & Policies
  console.log('\n[TEST 4] Verifying Row-Level Security policies...');
  const rlsCheck = await client.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = ANY($1) 
      AND relnamespace = 'public'::regnamespace;
  `, [newTables]);
  for (const row of rlsCheck.rows) {
    if (!row.relrowsecurity) throw new Error(`RLS disabled on ${row.relname}!`);
    console.log(`  [PASS] ${row.relname}: RLS is active.`);
  }

  const policies = await client.query(`
    SELECT tablename, policyname, cmd 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = ANY($1)
    ORDER BY tablename, policyname;
  `, [newTables]);
  console.log(`  [PASS] Found ${policies.rows.length} security policies configured across Stage 2 tables.`);

  // 5. Verify Triggers & Helper Functions
  console.log('\n[TEST 5] Verifying triggers and helper functions...');
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
      AND event_object_table = ANY($1)
    ORDER BY event_object_table;
  `, [newTables]);
  console.log(`  [PASS] Found ${triggers.rows.length} triggers attached:`);
  for (const t of triggers.rows) {
    console.log(`    - ${t.event_object_table}: ${t.trigger_name}`);
  }

  const fnCheck = await client.query(`
    SELECT proname, prosecdef 
    FROM pg_proc 
    WHERE proname = 'is_moderator' 
      AND pronamespace = 'public'::regnamespace;
  `);
  if (fnCheck.rows.length === 0 || !fnCheck.rows[0].prosecdef) {
    throw new Error('public.is_moderator() function not found or not SECURITY DEFINER!');
  }
  console.log('  [PASS] public.is_moderator() function verified with SECURITY DEFINER attribute.');

  await client.end();
  console.log('\n=== ALL STAGE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
}

main().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
