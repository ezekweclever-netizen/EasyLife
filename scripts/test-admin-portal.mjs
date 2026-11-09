import { getDatabaseUrl } from './_env.mjs';
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function runAdminPortalTests() {
  console.log("==================================================================");
  console.log("   EASYLIFE PROMPT 16: ADMIN DASHBOARD & GOVERNANCE TEST SUITE    ");
  console.log("==================================================================");

  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("✓ Connected to live PostgreSQL database.");

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

  try {
    // TEST 1: Dashboard Metrics RPC (10 Required KPIs)
    console.log("\n[Test 1] Verifying get_admin_dashboard_metrics() RPC...");
    const metricsRes = await client.query("SELECT public.get_admin_dashboard_metrics() AS metrics");
    const m = metricsRes.rows[0].metrics;
    console.log("  Live Metrics Snapshot:", JSON.stringify({
      total_customers: m.total_customers,
      total_professionals: m.total_professionals,
      verified_professionals: m.verified_professionals,
      pending_verification_requests: m.pending_verification_requests,
      total_businesses: m.total_businesses,
      total_bookings: m.total_bookings,
      active_bookings: m.active_bookings,
      completed_bookings: m.completed_bookings,
      open_disputes: m.open_disputes,
      platform_revenue_naira: m.platform_revenue_naira,
      platform_revenue_kobo: m.platform_revenue_kobo,
      recent_audit_logs_count: m.recent_audit_logs.length
    }, null, 2));

    assert(typeof m.total_customers === 'number', "total_customers is numeric");
    assert(typeof m.total_professionals === 'number', "total_professionals is numeric");
    assert(typeof m.verified_professionals === 'number', "verified_professionals is numeric");
    assert(typeof m.pending_verification_requests === 'number', "pending_verification_requests is numeric");
    assert(typeof m.total_businesses === 'number', "total_businesses is numeric");
    assert(typeof m.total_bookings === 'number', "total_bookings is numeric");
    assert(typeof m.active_bookings === 'number', "active_bookings is numeric");
    assert(typeof m.completed_bookings === 'number', "completed_bookings is numeric");
    assert(typeof m.open_disputes === 'number', "open_disputes is numeric");
    assert(typeof m.platform_revenue_naira === 'number', "platform_revenue_naira is numeric");
    assert(Array.isArray(m.recent_audit_logs), "recent_audit_logs is an array");

    // TEST 2: User Account Suspension with Mandatory Documented Reason
    console.log("\n[Test 2] Testing User Account Suspension & Mandatory Reason...");
    const sampleUserRes = await client.query(
      "SELECT id, full_name, email, is_suspended FROM public.profiles LIMIT 1"
    );
    assert(sampleUserRes.rows.length > 0, "Found a target user profile for suspension test");
    const testUserId = sampleUserRes.rows[0].id;

    // Execute suspension
    const suspendReason = "Automated test suspension for compliance audit.";
    await client.query(
      "SELECT public.admin_set_user_suspension($1, true, $2)",
      [testUserId, suspendReason]
    );

    const suspendedUserRes = await client.query(
      "SELECT is_suspended, suspension_reason FROM public.profiles WHERE id = $1",
      [testUserId]
    );
    assert(suspendedUserRes.rows[0].is_suspended === true, "User is marked is_suspended = true");
    assert(suspendedUserRes.rows[0].suspension_reason === suspendReason, "Suspension reason accurately recorded");

    // Check audit log for suspension
    const suspendAudit = await client.query(
      "SELECT action, entity_id, new_values FROM public.audit_logs WHERE action IN ('user.suspended', 'USER_SUSPENDED') AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
      [testUserId]
    );
    assert(suspendAudit.rows.length > 0, "Immutable audit log created for user.suspended");

    // TEST 3: User Account Reinstatement
    console.log("\n[Test 3] Testing User Account Reinstatement...");
    await client.query(
      "SELECT public.admin_set_user_suspension($1, false, $2)",
      [testUserId, "Compliance review cleared; reinstated."]
    );

    const reinstatedUserRes = await client.query(
      "SELECT is_suspended, suspension_reason FROM public.profiles WHERE id = $1",
      [testUserId]
    );
    assert(reinstatedUserRes.rows[0].is_suspended === false, "User is restored is_suspended = false");
    assert(reinstatedUserRes.rows[0].suspension_reason === null, "Suspension reason cleared on reinstatement");

    const reinstateAudit = await client.query(
      "SELECT action, entity_id FROM public.audit_logs WHERE action IN ('user.reinstated', 'USER_REINSTATED') AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
      [testUserId]
    );
    assert(reinstateAudit.rows.length > 0, "Immutable audit log created for user.reinstated");

    // TEST 4: Platform Operational Settings Configuration
    console.log("\n[Test 4] Testing Platform Operational Setting Updates...");
    const settingKey = "test_ops_threshold";
    const settingValue = { max_concurrent_dispatches: 15, auto_assign: true };
    await client.query(
      "SELECT public.admin_set_platform_setting($1, $2, $3, false)",
      [settingKey, JSON.stringify(settingValue), "Test Operational Threshold for E2E verification"]
    );

    const settingRes = await client.query(
      "SELECT key, value, description FROM public.platform_settings WHERE key = $1",
      [settingKey]
    );
    assert(settingRes.rows.length > 0, "Platform setting written successfully");
    assert(settingRes.rows[0].value.max_concurrent_dispatches === 15, "Setting JSON value correctly stored");

    const settingAudit = await client.query(
      "SELECT action, entity_id FROM public.audit_logs WHERE action IN ('platform_setting.updated', 'SETTING_UPDATED') AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
      [settingKey]
    );
    assert(settingAudit.rows.length > 0, "Immutable audit log created for platform_setting.updated");

    // TEST 5: Commission Rate Configuration
    console.log("\n[Test 5] Testing Commission Setting Overrides...");
    const testCity = "Port Harcourt";
    const commBps = 1250; // 12.5%
    const flatFee = 50000; // NGN 500
    await client.query(
      "SELECT public.admin_set_commission_setting(NULL, $1, $2, $3, true)",
      [testCity, commBps, flatFee]
    );

    const commRes = await client.query(
      "SELECT city, commission_bps, flat_fee_kobo, is_active FROM public.commission_settings WHERE city = $1 ORDER BY updated_at DESC LIMIT 1",
      [testCity]
    );
    assert(commRes.rows.length > 0, "Commission override record created");
    assert(commRes.rows[0].commission_bps === 1250, "Commission basis points recorded accurately (1250 bps = 12.5%)");

    const commAudit = await client.query(
      "SELECT action, new_values FROM public.audit_logs WHERE action IN ('commission_setting.configured', 'COMMISSION_UPDATED') ORDER BY created_at DESC LIMIT 1"
    );
    assert(commAudit.rows.length > 0, "Immutable audit log created for commission_setting.configured");

    // TEST 6: Official System Notification Dispatch
    console.log("\n[Test 6] Testing Admin Notification Dispatch...");
    const notifTitle = "Test Security Advisory";
    const notifContent = "Mandatory security protocol test broadcast.";
    await client.query(
      "SELECT public.admin_send_notification($1, $2, $3, 'security_advisory')",
      [testUserId, notifTitle, notifContent]
    );

    const notifRes = await client.query(
      "SELECT title, body, notification_type FROM public.notifications WHERE user_id = $1 AND title = $2 ORDER BY created_at DESC LIMIT 1",
      [testUserId, notifTitle]
    );
    assert(notifRes.rows.length > 0, "Notification row inserted in public.notifications");
    assert(notifRes.rows[0].notification_type === 'security_advisory', "Notification type correctly stored");

    const notifAudit = await client.query(
      "SELECT action, entity_id FROM public.audit_logs WHERE action IN ('notification.sent', 'NOTIFICATION_SENT') ORDER BY created_at DESC LIMIT 1"
    );
    assert(notifAudit.rows.length > 0, "Immutable audit log created for notification.sent");

    // TEST 7: IMMUTABILITY GUARANTEE — Verify that DELETE or UPDATE on audit_logs FAILS
    console.log("\n[Test 7] Verifying Immutability Trigger (trg_audit_logs_immutable)...");
    const anyAudit = await client.query("SELECT id FROM public.audit_logs LIMIT 1");
    const auditId = anyAudit.rows[0].id;

    let updateFailedAsExpected = false;
    try {
      await client.query(
        "UPDATE public.audit_logs SET action = 'HACKED' WHERE id = $1",
        [auditId]
      );
    } catch (err) {
      if (err.message.includes("immutable") || err.message.includes("append-only")) {
        updateFailedAsExpected = true;
      } else {
        throw err;
      }
    }
    assert(updateFailedAsExpected, "UPDATE on audit_logs was rejected by trg_audit_logs_immutable");

    let deleteFailedAsExpected = false;
    try {
      await client.query(
        "DELETE FROM public.audit_logs WHERE id = $1",
        [auditId]
      );
    } catch (err) {
      if (err.message.includes("immutable") || err.message.includes("append-only")) {
        deleteFailedAsExpected = true;
      } else {
        throw err;
      }
    }
    assert(deleteFailedAsExpected, "DELETE on audit_logs was rejected by trg_audit_logs_immutable");

    console.log("\n==================================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!                    `);
    console.log("==================================================================");

  } finally {
    await client.end();
  }
}

runAdminPortalTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
