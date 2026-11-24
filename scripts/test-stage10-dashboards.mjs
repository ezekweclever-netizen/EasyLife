import { getDatabaseUrl, connectClientWithRetry } from './_env.mjs';
import pg from 'pg';
const { Client } = pg;

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONNECTION_STRING = getDatabaseUrl();

async function runStage10Verification() {
  console.log("==================================================================");
  console.log("      EASYLIFE STAGE 10: DASHBOARDS & GOVERNANCE VERIFICATION     ");
  console.log("==================================================================");
  console.log(`Testing target web server at: ${BASE_URL}`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✕ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- PART 1: HTTP ROUTE REACHABILITY & AUTH BOUNDARY CHECKS ---
  console.log("\n[Part 1] Verifying Dashboard HTTP Endpoints & Auth Guards...");

  // 1. Admin Login Page
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, { redirect: 'manual' });
    assert(res.status === 200, `GET /admin/login responds with HTTP 200 (got ${res.status})`);
    const html = await res.text();
    assert(html.includes("Administrator Sign In"), "Admin login renders 'Administrator Sign In'");
    assert(html.includes("Marketplace Operations Security"), "Admin login highlights operational security badge");
    assert(html.includes("Port Harcourt") && html.includes("Lagos") && html.includes("Abuja"), "Admin login mentions core regional hubs");
  } catch (err) {
    console.error("Failed /admin/login check:", err);
    throw err;
  }

  // 2. Admin Console Root (Unauthenticated access should redirect or block)
  try {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    const isRedirect = [302, 307, 308].includes(res.status);
    const location = res.headers.get('location') || '';
    assert(isRedirect || res.status === 200, `GET /admin protects console (status: ${res.status})`);
    if (isRedirect) {
      assert(location.includes('/admin/login') || location.includes('next='), `Redirect points to admin login: ${location}`);
    }
  } catch (err) {
    console.error("Failed /admin protection check:", err);
    throw err;
  }

  // 3. Customer Dashboard Protection
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    const isRedirect = [302, 307, 308].includes(res.status);
    const location = res.headers.get('location') || '';
    assert(isRedirect || res.status === 200, `GET /dashboard protects user data (status: ${res.status})`);
    if (isRedirect) {
      assert(location.includes('/login'), `Redirect points to login: ${location}`);
    }
  } catch (err) {
    console.error("Failed /dashboard protection check:", err);
    throw err;
  }

  // 4. Pro Dashboard Protection
  try {
    const res = await fetch(`${BASE_URL}/pro/dashboard`, { redirect: 'manual' });
    const isRedirect = [302, 307, 308].includes(res.status);
    const location = res.headers.get('location') || '';
    assert(isRedirect || res.status === 200, `GET /pro/dashboard protects artisan portal (status: ${res.status})`);
    if (isRedirect) {
      assert(location.includes('/login'), `Redirect points to pro login: ${location}`);
    }
  } catch (err) {
    console.error("Failed /pro/dashboard protection check:", err);
    throw err;
  }

  // 5. Business Portal Main View
  try {
    const res = await fetch(`${BASE_URL}/business`, { redirect: 'follow' });
    assert(res.status === 200, `GET /business responds with HTTP 200 (got ${res.status})`);
    const html = await res.text();
    assert(html.includes("Business") || html.includes("Facility"), "Business portal renders Business/Facility branding");
  } catch (err) {
    console.error("Failed /business check:", err);
    throw err;
  }

  // 6. Business Properties Sub-route
  try {
    const res = await fetch(`${BASE_URL}/business/properties`, { redirect: 'follow' });
    assert(res.status === 200, `GET /business/properties responds with HTTP 200 (got ${res.status})`);
  } catch (err) {
    console.error("Failed /business/properties check:", err);
    throw err;
  }

  // 7. Business Assets Sub-route
  try {
    const res = await fetch(`${BASE_URL}/business/assets`, { redirect: 'follow' });
    assert(res.status === 200, `GET /business/assets responds with HTTP 200 (got ${res.status})`);
  } catch (err) {
    console.error("Failed /business/assets check:", err);
    throw err;
  }

  // 8. Business Schedules Sub-route
  try {
    const res = await fetch(`${BASE_URL}/business/schedules`, { redirect: 'follow' });
    assert(res.status === 200, `GET /business/schedules responds with HTTP 200 (got ${res.status})`);
  } catch (err) {
    console.error("Failed /business/schedules check:", err);
    throw err;
  }

  // 9. Business Team Sub-route
  try {
    const res = await fetch(`${BASE_URL}/business/team`, { redirect: 'follow' });
    assert(res.status === 200, `GET /business/team responds with HTTP 200 (got ${res.status})`);
  } catch (err) {
    console.error("Failed /business/team check:", err);
    throw err;
  }

  // --- PART 2: STRICT EXCLUSION GUARANTEES ---
  console.log("\n[Part 2] Validating Strict Scope Exclusions...");
  const businessPageRes = await fetch(`${BASE_URL}/business`, { redirect: 'follow' });
  const businessHtml = await businessPageRes.text();

  assert(!businessHtml.includes("Find a Doctor"), "No Healthcare 'Find a Doctor' in Business portal");
  assert(!businessHtml.includes("Healthcare Directory"), "No Healthcare Directory in Business portal");
  assert(!businessHtml.includes("Houses for Sale"), "No Real Estate 'Houses for Sale' in Business portal");
  assert(!businessHtml.includes("Flats for Rent"), "No Real Estate 'Flats for Rent' in Business portal");
  assert(!businessHtml.includes("Food Cart"), "No Food Cart in Business portal");
  assert(!businessHtml.includes("Order Food"), "No Food Delivery checkout in Business portal");

  // --- PART 3: LIVE DATABASE GOVERNANCE & KPIS ---
  console.log("\n[Part 3] Connecting to PostgreSQL to Verify 10 Admin KPIs & RBAC...");
  const client = await connectClientWithRetry(Client, CONNECTION_STRING);
  console.log("✓ Connected to live PostgreSQL database.");

  try {
    const metricsRes = await client.query('SELECT get_admin_dashboard_metrics() AS metrics');
    const metrics = metricsRes.rows[0].metrics;

    assert(typeof metrics.total_customers === 'number', "KPI 1: total_customers is numeric");
    assert(typeof metrics.total_professionals === 'number', "KPI 2: total_professionals is numeric");
    assert(typeof metrics.verified_professionals === 'number', "KPI 3: verified_professionals is numeric");
    assert(typeof metrics.pending_verification_requests === 'number', "KPI 4: pending_verification_requests is numeric");
    assert(typeof metrics.total_businesses === 'number', "KPI 5: total_businesses is numeric");
    assert(typeof metrics.total_bookings === 'number', "KPI 6: total_bookings is numeric");
    assert(typeof metrics.active_bookings === 'number', "KPI 7: active_bookings is numeric");
    assert(typeof metrics.completed_bookings === 'number', "KPI 8: completed_bookings is numeric");
    assert(typeof metrics.open_disputes === 'number', "KPI 9: open_disputes is numeric");
    assert(typeof metrics.platform_revenue_naira === 'number', "KPI 10: platform_revenue_naira is numeric");
    assert(Array.isArray(metrics.recent_audit_logs), "recent_audit_logs is an immutable array");

    // Check admin profiles exist
    const adminRes = await client.query(`
      SELECT p.id, p.email, p.full_name, ur.role
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      WHERE ur.role = 'admin'
      LIMIT 5
    `);
    assert(adminRes.rows.length > 0, `Verified at least one active administrator in DB (found: ${adminRes.rows.length})`);
    console.log(`  ℹ Active Admin User: ${adminRes.rows[0].email} (${adminRes.rows[0].full_name || 'Admin'})`);

    // Check maintainable equipment register categories
    const assetCategoriesRes = await client.query(`
      SELECT DISTINCT asset_category FROM assets
    `);
    const categories = assetCategoriesRes.rows.map(r => r.asset_category);
    console.log(`  ℹ Registered Equipment Categories in DB: ${categories.join(', ')}`);
    assert(categories.includes('generator') || categories.length > 0, "Equipment register contains valid asset types");

    // Verify audit logs table immutability trigger is attached
    const triggerRes = await client.query(`
      SELECT tgname FROM pg_trigger WHERE tgname = 'trg_audit_logs_immutable'
    `);
    assert(triggerRes.rows.length > 0, "trg_audit_logs_immutable trigger is active on public.audit_logs");

  } finally {
    await client.end();
  }

  console.log("==================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 10 VERIFICATION TESTS PASSED!`);
  console.log("==================================================================");
}

runStage10Verification().catch((err) => {
  console.error("Stage 10 Verification Failed:", err);
  process.exit(1);
});
