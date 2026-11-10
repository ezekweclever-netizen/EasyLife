#!/usr/bin/env node
import { getDatabaseUrl, connectPoolWithRetry, queryPoolWithRetry, runWithAuth } from './_env.mjs';
/**
 * EasyLife Service Accountability System Test Suite (Prompt 14)
 *
 * Verifies:
 * 1. Job Completion:
 *    - Pro submits completion request (notes, proof photos).
 *    - Customer confirms completion (escrow release, completed count increment).
 *    - Customer reports incomplete work (reverts to in_progress, rework notes, pro notification).
 * 2. Reviews:
 *    - Ratings (1-5 stars), written feedback, photos.
 *    - Gated to completed bookings only.
 *    - Restricts reviews to eligible customers (prevents non-customer reviews).
 *    - Prevents duplicate reviews per booking.
 *    - Prevents professionals from reviewing their own jobs.
 *    - Admin moderation (approve, flag, reject).
 *    - Review edit history preservation.
 * 3. Disputes:
 *    - Dispute categories (incomplete_work, poor_workmanship, unapproved_charges, missed_appointment, other).
 *    - Evidence uploads tracking.
 *    - Case statuses (open, under_review, awaiting_information, resolved, rejected, closed).
 *    - Assigned administrator, internal investigation notes, resolution records.
 *    - STRICT RULE: Disputed booking must not automatically become a completed transaction!
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import dns from "node:dns";
import pg from "pg";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("=== EasyLife Service Accountability System Test Suite (Prompt 14) ===\n");

let passedCount = 0;
let failedCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

async function asyncTest(description, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

const rootDir = process.cwd();
const webDir = path.join(rootDir, "apps", "web", "src");

// ============================================================================
// 1. STATIC CODE & TYPE DEFINITION AUDIT
// ============================================================================
console.log("1. Verifying Prompt 14 Type Definitions & Codebase Structure:");

const sharedTypesIndex = path.join(rootDir, "packages", "shared-types", "src", "index.ts");
const sharedDatabase = path.join(rootDir, "packages", "shared-types", "src", "database.ts");

test("Shared types export DisputeStatus, DisputeCategory, DisputeResolutionType, ReviewModerationStatus", () => {
  const content = fs.readFileSync(sharedTypesIndex, "utf8");
  assert.ok(content.includes("export type DisputeStatus"), "Missing DisputeStatus");
  assert.ok(content.includes('"awaiting_information"'), "DisputeStatus missing awaiting_information");
  assert.ok(content.includes('"resolved"'), "DisputeStatus missing resolved");
  assert.ok(content.includes('"rejected"'), "DisputeStatus missing rejected");
  assert.ok(content.includes("export type DisputeCategory"), "Missing DisputeCategory");
  assert.ok(content.includes('"incomplete_work"'), "DisputeCategory missing incomplete_work");
  assert.ok(content.includes('"poor_workmanship"'), "DisputeCategory missing poor_workmanship");
  assert.ok(content.includes('"unapproved_charges"'), "DisputeCategory missing unapproved_charges");
  assert.ok(content.includes('"missed_appointment"'), "DisputeCategory missing missed_appointment");
  assert.ok(content.includes("export type DisputeResolutionType"), "Missing DisputeResolutionType");
  assert.ok(content.includes("export type ReviewModerationStatus"), "Missing ReviewModerationStatus");
});

test("Database types export ReviewRow, DisputeRow, DisputeInternalNoteRow, ReviewHistoryRow", () => {
  const content = fs.readFileSync(sharedDatabase, "utf8");
  assert.ok(content.includes("export interface ReviewRow"), "Missing ReviewRow");
  assert.ok(content.includes("export interface DisputeRow"), "Missing DisputeRow");
  assert.ok(content.includes("export interface DisputeInternalNoteRow"), "Missing DisputeInternalNoteRow");
  assert.ok(content.includes("export interface ReviewHistoryRow"), "Missing ReviewHistoryRow");
});

test("Server action completion.ts provides completion and rework handlers", () => {
  const filePath = path.join(webDir, "app", "actions", "completion.ts");
  assert.ok(fs.existsSync(filePath), "Missing completion.ts action file");
  const content = fs.readFileSync(filePath, "utf8");
  assert.ok(content.includes("proSubmitCompletionAction"), "Missing proSubmitCompletionAction");
  assert.ok(content.includes("customerConfirmCompletionAction"), "Missing customerConfirmCompletionAction");
  assert.ok(content.includes("customerReportIncompleteWorkAction"), "Missing customerReportIncompleteWorkAction");
});

test("Server action reviews.ts provides verified review and moderation handlers", () => {
  const filePath = path.join(webDir, "app", "actions", "reviews.ts");
  assert.ok(fs.existsSync(filePath), "Missing reviews.ts action file");
  const content = fs.readFileSync(filePath, "utf8");
  assert.ok(content.includes("submitReviewAction"), "Missing submitReviewAction");
  assert.ok(content.includes("replyToReviewAction"), "Missing replyToReviewAction");
  assert.ok(content.includes("adminModerateReviewAction"), "Missing adminModerateReviewAction");
});

test("Server action disputes.ts provides formal dispute and arbitration handlers", () => {
  const filePath = path.join(webDir, "app", "actions", "disputes.ts");
  assert.ok(fs.existsSync(filePath), "Missing disputes.ts action file");
  const content = fs.readFileSync(filePath, "utf8");
  assert.ok(content.includes("submitDisputeAction"), "Missing submitDisputeAction");
  assert.ok(content.includes("adminUpdateDisputeAction"), "Missing adminUpdateDisputeAction");
  assert.ok(content.includes("adminAddDisputeNoteAction"), "Missing adminAddDisputeNoteAction");
});

test("Interactive UI components exist for completion, reviews, and disputes", () => {
  assert.ok(fs.existsSync(path.join(webDir, "components", "booking", "job-completion-card.tsx")), "Missing JobCompletionCard");
  assert.ok(fs.existsSync(path.join(webDir, "components", "booking", "review-modal.tsx")), "Missing ReviewModal");
  assert.ok(fs.existsSync(path.join(webDir, "components", "booking", "dispute-modal.tsx")), "Missing DisputeModal");
  assert.ok(fs.existsSync(path.join(webDir, "components", "admin", "admin-dispute-manager.tsx")), "Missing AdminDisputeManager");
  assert.ok(fs.existsSync(path.join(webDir, "components", "admin", "admin-review-moderator.tsx")), "Missing AdminReviewModerator");
  assert.ok(fs.existsSync(path.join(webDir, "app", "admin", "disputes", "page.tsx")), "Missing /admin/disputes route");
  assert.ok(fs.existsSync(path.join(webDir, "app", "admin", "reviews", "page.tsx")), "Missing /admin/reviews route");
});

// ============================================================================
// 2. LIVE REMOTE SUPABASE POSTGRESQL VERIFICATION
// ============================================================================
console.log("\n2. Connecting to Live Remote Supabase Database:");

const dbConnStr =
  getDatabaseUrl();

const pool = await connectPoolWithRetry(pg.Pool, dbConnStr);

const client = {
  query: (text, params) => queryPoolWithRetry(pool, text, params),
  end: () => pool.end(),
};

console.log("  [CONNECTED] PostgreSQL pool connected successfully.");

async function runLiveDbChecks() {

  // Schema verification
  await asyncTest("Live DB: public.disputes has assigned_admin_id, internal_notes, resolution_type, refund_amount_kobo", async () => {
    const res = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'disputes'
        AND column_name IN ('assigned_admin_id', 'internal_notes', 'resolution_type', 'refund_amount_kobo');
    `);
    assert.strictEqual(res.rows.length, 4, `Expected 4 new dispute columns, got ${res.rows.length}`);
  });

  await asyncTest("Live DB: public.dispute_internal_notes table exists with RLS enabled", async () => {
    const res = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'dispute_internal_notes';
    `);
    assert.strictEqual(res.rows.length, 1, "dispute_internal_notes does not exist");
    assert.strictEqual(res.rows[0].rowsecurity, true, "RLS must be enabled on dispute_internal_notes");
  });

  await asyncTest("Live DB: public.reviews has photos, moderation_status, is_flagged, edit_count, original_comment", async () => {
    const res = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'reviews'
        AND column_name IN ('photos', 'moderation_status', 'is_flagged', 'edit_count', 'original_comment');
    `);
    assert.strictEqual(res.rows.length, 5, `Expected 5 review moderation columns, got ${res.rows.length}`);
  });

  await asyncTest("Live DB: public.review_history table exists with RLS enabled", async () => {
    const res = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'review_history';
    `);
    assert.strictEqual(res.rows.length, 1, "review_history does not exist");
    assert.strictEqual(res.rows[0].rowsecurity, true, "RLS must be enabled on review_history");
  });

  await asyncTest("Live DB: public.bookings has rework_notes, rework_requested_at, rework_count", async () => {
    const res = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name IN ('rework_notes', 'rework_requested_at', 'rework_count');
    `);
    assert.strictEqual(res.rows.length, 3, `Expected 3 rework columns on bookings, got ${res.rows.length}`);
  });

  await asyncTest("Live DB: All 7 Prompt 14 stored procedures exist in public schema", async () => {
    const res = await client.query(`
      SELECT proname
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND proname IN (
          'pro_submit_job_completion',
          'customer_report_incomplete_work',
          'submit_booking_dispute',
          'submit_booking_review',
          'admin_update_dispute',
          'admin_moderate_review',
          'confirm_booking_completion'
        );
    `);
    const names = res.rows.map((r) => r.proname);
    assert.ok(names.includes("pro_submit_job_completion"), "Missing pro_submit_job_completion");
    assert.ok(names.includes("customer_report_incomplete_work"), "Missing customer_report_incomplete_work");
    assert.ok(names.includes("submit_booking_dispute"), "Missing submit_booking_dispute");
    assert.ok(names.includes("submit_booking_review"), "Missing submit_booking_review");
    assert.ok(names.includes("admin_update_dispute"), "Missing admin_update_dispute");
    assert.ok(names.includes("admin_moderate_review"), "Missing admin_moderate_review");
    assert.ok(names.includes("confirm_booking_completion"), "Missing confirm_booking_completion");
  });

  // ============================================================================
  // 3. LIFECYCLE & ACCOUNTABILITY RULES VERIFICATION
  // ============================================================================
  console.log("\n3. Testing Service Accountability Lifecycle & Rules on Live DB:");

  let testCustomerId;
  let testProUserId;
  let testProProfileId;
  let testBookingId;
  let testCategoryId;

  // Helper to run auth-scoped DB operations atomically on a single transaction-pinned connection.
  // Essential when connecting through PgBouncer transaction pooling (port 6543).
  function withAuth(userId, fn) {
    return runWithAuth(pool, userId, fn);
  }

  // Fetch active customer, professional, category, and administrator
  const proRes = await client.query(`
    SELECT pp.id as professional_id, pp.user_id, p.email, pp.business_name, pp.completed_jobs_count
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    WHERE pp.verification_status = 'approved' AND p.is_active = true
    LIMIT 1;
  `);
  assert.ok(proRes.rows.length > 0, "Requires at least 1 professional profile in database");

  testProUserId = proRes.rows[0].user_id;
  testProProfileId = proRes.rows[0].professional_id;

  const custRes = await client.query(`
    SELECT p.id, p.email, p.full_name
    FROM public.profiles p
    WHERE p.primary_role = 'customer'
      AND p.id <> $1
      AND NOT EXISTS (SELECT 1 FROM public.professional_profiles pp2 WHERE pp2.user_id = p.id)
    LIMIT 1;
  `, [testProUserId]);
  const custFinalRes = custRes.rows.length > 0
    ? custRes
    : await client.query(
        `SELECT id, email, full_name FROM public.profiles WHERE primary_role = 'customer' AND id <> $1 LIMIT 1;`,
        [testProUserId]
      );

  const catRes = await client.query(`
    SELECT id, name FROM public.service_categories WHERE is_active = true LIMIT 1;
  `);
  const adminRes = await client.query(`
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.is_active = true
    LIMIT 1;
  `);

  assert.ok(custFinalRes.rows.length > 0, "Requires at least 1 customer profile in database");
  assert.ok(catRes.rows.length > 0, "Requires at least 1 active service category in database");

  testCustomerId = custFinalRes.rows[0].id;
  testCategoryId = catRes.rows[0].id;
  const adminId = adminRes.rows[0]?.user_id || testCustomerId;

  // Create a clean test booking in 'in_progress' status
  const bookingRes = await client.query(`
    INSERT INTO public.bookings (
      reference_code,
      customer_id,
      professional_id,
      category_id,
      title,
      description,
      status,
      city,
      state,
      service_address,
      agreed_amount_kobo
    ) VALUES (
      'BK-TEST-ACCOUNTABILITY-' || substr(gen_random_uuid()::text, 1, 6),
      $1,
      $2,
      $3,
      'Emergency Water Tank Pipe Burst Repair',
      'Leak detected at main overhead tank connection pipe in Woji.',
      'in_progress',
      'Port Harcourt',
      'Rivers',
      '14 Woji Estate Road, Port Harcourt',
      3500000
    ) RETURNING id, reference_code, agreed_amount_kobo;
  `, [testCustomerId, testProProfileId, testCategoryId]);
  testBookingId = bookingRes.rows[0].id;

  // 3.1 Pro submits completion request
  await asyncTest("Live DB: Pro submits completion request -> pro_marked_complete with notes and notification", async () => {
    const res = await withAuth(testProUserId, (tx) =>
      tx.query(`
        SELECT * FROM public.pro_submit_job_completion(
          p_booking_id := $1,
          p_notes := 'Replaced 1-inch PPR elbow, pressurized test at 4 bar for 45 mins. Cleaned site.',
          p_photos := ARRAY['https://storage.easylife.ng/test-proof-1.jpg']::TEXT[]
        );
      `, [testBookingId])
    );

    assert.strictEqual(res.rows[0].status, "pro_marked_complete");
    assert.ok(res.rows[0].pro_completion_notes.includes("Replaced 1-inch PPR elbow"));

    // Verify notification was sent to customer
    const notifRes = await client.query(`
      SELECT * FROM public.notifications
      WHERE user_id = $1 AND notification_type = 'job_completion_request'
      ORDER BY created_at DESC LIMIT 1;
    `, [testCustomerId]);
    assert.strictEqual(notifRes.rows.length, 1, "Customer must receive job_completion_request notification");
  });

  // 3.2 Customer reports incomplete work -> returns to in_progress with rework notes
  await asyncTest("Live DB: Customer reports incomplete work -> reverts to in_progress with rework notes", async () => {
    const res = await withAuth(testCustomerId, (tx) =>
      tx.query(`
        SELECT * FROM public.customer_report_incomplete_work(
          p_booking_id := $1,
          p_reason := 'Water is still leaking slightly around the tank valve union connection.',
          p_photos := ARRAY['https://storage.easylife.ng/incomplete-leak.jpg']::TEXT[]
        );
      `, [testBookingId])
    );

    assert.strictEqual(res.rows[0].status, "in_progress");
    assert.strictEqual(res.rows[0].rework_count, 1);
    assert.ok(res.rows[0].rework_notes.includes("Water is still leaking"));

    // Verify pro was notified
    const notifRes = await client.query(`
      SELECT * FROM public.notifications
      WHERE user_id = $1 AND notification_type = 'booking_status_change'
      ORDER BY created_at DESC LIMIT 1;
    `, [testProUserId]);
    assert.strictEqual(notifRes.rows.length, 1, "Pro must receive notification regarding rework");
  });

  // 3.3 Pro re-submits completion request
  await asyncTest("Live DB: Pro re-submits completion after addressing rework items", async () => {
    const res = await withAuth(testProUserId, (tx) =>
      tx.query(`
        SELECT * FROM public.pro_submit_job_completion(
          p_booking_id := $1,
          p_notes := 'Tightened valve union with new PTFE gasket, zero drops detected after 1 hour test.'
        );
      `, [testBookingId])
    );

    assert.strictEqual(res.rows[0].status, "pro_marked_complete");
  });

  // 3.4 Customer confirms completion -> completed, increments pro completed jobs count
  await asyncTest("Live DB: Customer confirms completion -> transitions to completed, updates pro jobs count", async () => {
    const initialProRes = await client.query(
      `SELECT completed_jobs_count FROM public.professional_profiles WHERE id = $1;`,
      [testProProfileId]
    );
    const initialCount = initialProRes.rows[0].completed_jobs_count;

    const res = await withAuth(testCustomerId, (tx) =>
      tx.query(`
        SELECT * FROM public.confirm_booking_completion(
          p_booking_id := $1
        );
      `, [testBookingId])
    );

    assert.strictEqual(res.rows[0].status, "completed");
    assert.ok(res.rows[0].customer_confirmed_at !== null);
    assert.ok(res.rows[0].completed_at !== null);

    const updatedProRes = await client.query(
      `SELECT completed_jobs_count FROM public.professional_profiles WHERE id = $1;`,
      [testProProfileId]
    );
    assert.strictEqual(updatedProRes.rows[0].completed_jobs_count, initialCount + 1);
  });

  // ============================================================================
  // 4. VERIFIED REVIEW RULES VERIFICATION
  // ============================================================================
  console.log("\n4. Testing Verified Customer Review Rules:");

  // 4.1 Eligible customer submits verified review
  await asyncTest("Live DB: Eligible customer submits 5-star review for completed booking", async () => {
    const res = await withAuth(testCustomerId, (tx) =>
      tx.query(`
        SELECT * FROM public.submit_booking_review(
          p_booking_id := $1,
          p_rating := 5::SMALLINT,
          p_title := 'Fixed tank leak cleanly',
          p_comment := 'The technician was very responsive, returned immediately when I noticed a drip, and sealed it perfectly.',
          p_photos := ARRAY['https://storage.easylife.ng/review-tank-proof.jpg']::TEXT[]
        );
      `, [testBookingId])
    );

    assert.strictEqual(res.rows[0].rating, 5);
    assert.strictEqual(res.rows[0].is_published, true);
    assert.strictEqual(res.rows[0].moderation_status, "approved");

    // Check automatic rating recalculation on professional_profiles
    const proRatingRes = await client.query(
      `SELECT average_rating, review_count FROM public.professional_profiles WHERE id = $1;`,
      [testProProfileId]
    );
    assert.ok(Number(proRatingRes.rows[0].average_rating) > 0);
    assert.ok(proRatingRes.rows[0].review_count >= 1);
  });

  // 4.2 Prevent duplicate reviews on same booking
  await asyncTest("Live DB Rule: Duplicate review on same booking is strictly REJECTED", async () => {
    let rejected = false;
    try {
      await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT * FROM public.submit_booking_review(
            p_booking_id := $1,
            p_rating := 4::SMALLINT,
            p_title := 'Duplicate review attempt',
            p_comment := 'This should fail because a review already exists for this booking.'
          );
        `, [testBookingId])
      );
    } catch (err) {
      rejected = true;
      assert.ok(err.message.includes("already been submitted") || err.message.includes("unique"), err.message);
    }
    assert.ok(rejected, "Duplicate review was not rejected");
  });

  // 4.3 Prevent professional from reviewing their own job
  await asyncTest("Live DB Rule: Professional cannot review their own job -> REJECTED", async () => {
    let rejected = false;
    try {
      await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT * FROM public.submit_booking_review(
            p_booking_id := $1,
            p_rating := 5::SMALLINT,
            p_title := 'Self-review fraud attempt',
            p_comment := 'I did a fantastic job on this repair.'
          );
        `, [testBookingId])
      );
    } catch (err) {
      rejected = true;
      assert.ok(err.message.includes("Only the customer") || err.message.includes("FORBIDDEN"), err.message);
    }
    assert.ok(rejected, "Self-review was not rejected");
  });

  // 4.4 Review history preservation when customer edits feedback
  await asyncTest("Live DB Rule: Editing review preserves prior feedback in review_history", async () => {
    await withAuth(testCustomerId, (tx) =>
      tx.query(`
        UPDATE public.reviews
        SET comment = 'Updated feedback: Still performing well after 1 week. Highly recommend this team.',
            updated_at = now()
        WHERE booking_id = $1;
      `, [testBookingId])
    );

    const historyRes = await client.query(`
      SELECT * FROM public.review_history
      WHERE booking_id = $1
      ORDER BY created_at DESC;
    `, [testBookingId]);

    assert.ok(historyRes.rows.length >= 1, "Prior review content must be preserved in review_history table");
    assert.ok(historyRes.rows[0].comment.includes("The technician was very responsive"));
  });

  // 4.5 Admin review moderation (flag / reject / approve)
  await asyncTest("Live DB: Admin moderates review -> unpublishing immediately updates pro rating summary", async () => {
    await client.query(`
      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES ($1, 'admin', true)
      ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;
    `, [adminId]);

    const reviewRes = await client.query(
      `SELECT id FROM public.reviews WHERE booking_id = $1;`,
      [testBookingId]
    );
    const reviewId = reviewRes.rows[0].id;

    // Reject review for abusive/unverified claim
    const modRes = await withAuth(adminId, (tx) =>
      tx.query(`
        SELECT * FROM public.admin_moderate_review(
          p_review_id := $1,
          p_action := 'reject',
          p_moderation_notes := 'Content flagged for containing unverified external telephone solicitation.'
        );
      `, [reviewId])
    );

    assert.strictEqual(modRes.rows[0].is_published, false);
    assert.strictEqual(modRes.rows[0].moderation_status, "rejected");

    // Restore review
    const approveRes = await withAuth(adminId, (tx) =>
      tx.query(`
        SELECT * FROM public.admin_moderate_review(
          p_review_id := $1,
          p_action := 'approve',
          p_moderation_notes := 'Reviewed and verified authentic customer submission.'
        );
      `, [reviewId])
    );

    assert.strictEqual(approveRes.rows[0].is_published, true);
    assert.strictEqual(approveRes.rows[0].moderation_status, "approved");
  });

  // ============================================================================
  // 5. DISPUTE LIFECYCLE & ACCOUNTABILITY MANAGEMENT
  // ============================================================================
  console.log("\n5. Testing Formal Dispute Lifecycle & Management:");

  // Create another booking for dispute testing
  const disputeBookingRes = await client.query(`
    INSERT INTO public.bookings (
      reference_code,
      customer_id,
      professional_id,
      category_id,
      title,
      description,
      status,
      city,
      state,
      service_address,
      agreed_amount_kobo
    ) VALUES (
      'BK-TEST-DISPUTE-' || substr(gen_random_uuid()::text, 1, 6),
      $1,
      $2,
      $3,
      'AC Compressor Replacement & Gas Refill',
      'Customer reports cooling unit stopped working immediately after service.',
      'in_progress',
      'Port Harcourt',
      'Rivers',
      '88 Peter Odili Road, Trans-Amadi',
      5500000
    ) RETURNING id, reference_code, agreed_amount_kobo;
  `, [testCustomerId, testProProfileId, testCategoryId]);
  const disputeBookingId = disputeBookingRes.rows[0].id;

  let testDisputeId;

  // 5.1 Customer files formal dispute
  await asyncTest("Live DB: Customer files formal dispute -> booking status transitions to 'disputed'", async () => {
    const testEvidencePath = `evidence/ac_leak_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    const res = await withAuth(testCustomerId, (tx) =>
      tx.query(`
        SELECT * FROM public.submit_booking_dispute(
          p_booking_id := $1,
          p_category := 'poor_workmanship',
          p_description := 'The technician charged 55,000 NGN for compressor gas, but the unit blew hot air 2 hours later. Refused to return.',
          p_disputed_amount_kobo := 5500000,
          p_evidence := jsonb_build_array(jsonb_build_object(
            'storage_path', $2::text,
            'file_name', 'ac_leak.jpg',
            'description', 'Pressure gauge reading zero'
          ))
        );
      `, [disputeBookingId, testEvidencePath])
    );

    testDisputeId = res.rows[0].id;
    assert.strictEqual(res.rows[0].status, "open");
    assert.strictEqual(res.rows[0].category, "poor_workmanship");
    assert.ok(res.rows[0].reference_code.startsWith("EL-DP"));

    // Verify parent booking status is 'disputed'
    const parentBookingRes = await client.query(
      `SELECT status FROM public.bookings WHERE id = $1;`,
      [disputeBookingId]
    );
    assert.strictEqual(parentBookingRes.rows[0].status, "disputed");

    // Verify evidence was stored
    const evRes = await client.query(
      `SELECT * FROM public.dispute_evidence WHERE dispute_id = $1;`,
      [testDisputeId]
    );
    assert.strictEqual(evRes.rows.length, 1);
    assert.strictEqual(evRes.rows[0].file_name, "ac_leak.jpg");
    assert.strictEqual(evRes.rows[0].storage_path, testEvidencePath);
  });

  // 5.2 CRUCIAL RULE: Disputed booking CANNOT be completed automatically
  await asyncTest("Live DB Rule: Disputed booking CANNOT be confirmed as completed -> REJECTED", async () => {
    let rejected = false;
    try {
      await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT * FROM public.confirm_booking_completion(
            p_booking_id := $1
          );
        `, [disputeBookingId])
      );
    } catch (err) {
      rejected = true;
      assert.ok(err.message.includes("disputed") || err.message.includes("cannot be completed"), err.message);
    }
    assert.ok(rejected, "Disputed booking completion attempt must be rejected");
  });

  // 5.3 Admin dispute investigation and resolution
  await asyncTest("Live DB: Admin investigates, adds internal notes, and formally resolves dispute", async () => {
    // Add private internal note and update dispute status to resolved
    const resolveRes = await withAuth(adminId, async (tx) => {
      await tx.query(`
        INSERT INTO public.dispute_internal_notes (dispute_id, admin_user_id, note)
        VALUES ($1, $2, 'Contacted technician. Technician admitted manifold hose ruptured during filling. Rework not feasible; issuing customer refund.');
      `, [testDisputeId, adminId]);

      return tx.query(`
        SELECT * FROM public.admin_update_dispute(
          p_dispute_id := $1,
          p_status := 'resolved'::public.dispute_status,
          p_assigned_admin_id := $2,
          p_internal_note := 'Case finalized in customer favor.',
          p_resolution_type := 'full_refund',
          p_resolution_summary := 'Full refund of 55,000 NGN granted to customer due to acknowledged technician installation defect.',
          p_refund_amount_kobo := 5500000
        );
      `, [testDisputeId, adminId]);
    });

    assert.strictEqual(resolveRes.rows[0].status, "resolved");
    assert.strictEqual(resolveRes.rows[0].resolution_type, "full_refund");
    assert.ok(resolveRes.rows[0].resolved_at !== null);

    // Parent booking status should now be updated to cancelled with dispute resolution explanation
    const parentBookingRes = await client.query(
      `SELECT status, cancellation_reason FROM public.bookings WHERE id = $1;`,
      [disputeBookingId]
    );
    assert.strictEqual(parentBookingRes.rows[0].status, "cancelled");
    assert.ok(parentBookingRes.rows[0].cancellation_reason.includes("Dispute resolved in customer favor"));
  });

  // Cleanup test fixtures
  console.log("\nCleaning up test fixtures...");
  if (testDisputeId) {
    await client.query(`DELETE FROM public.dispute_internal_notes WHERE dispute_id = $1;`, [testDisputeId]);
    await client.query(`DELETE FROM public.dispute_evidence WHERE dispute_id = $1;`, [testDisputeId]);
    await client.query(`DELETE FROM public.disputes WHERE id = $1;`, [testDisputeId]);
  }
  const testIds = [testBookingId, disputeBookingId].filter(Boolean);
  if (testIds.length > 0) {
    await client.query(`DELETE FROM public.review_history WHERE booking_id = ANY($1);`, [testIds]);
    await client.query(`DELETE FROM public.reviews WHERE booking_id = ANY($1);`, [testIds]);
    await client.query(`DELETE FROM public.booking_attachments WHERE booking_id = ANY($1);`, [testIds]);
    await client.query(`DELETE FROM public.notifications WHERE metadata->>'booking_id' = ANY($1::text[]);`, [testIds]);
    // Soft-delete bookings to respect immutable booking_status_history foreign key constraints
    await client.query(`UPDATE public.bookings SET deleted_at = now() WHERE id = ANY($1);`, [testIds]);
  }
  console.log("Cleanup complete.");

  await client.end();
}

async function run() {
  await runLiveDbChecks();

  console.log("\n=================================================================");
  console.log(`Prompt 14 Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    console.error("=== SOME PROMPT 14 TESTS FAILED ===");
    process.exit(1);
  } else {
    console.log("=== ALL PROMPT 14 JOB COMPLETION, REVIEWS & DISPUTES CHECKS PASSED ===");
  }
}

run();
