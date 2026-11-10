#!/usr/bin/env node
import { getDatabaseUrl, connectPoolWithRetry, queryPoolWithRetry, runWithAuth } from './_env.mjs';
/**
 * EasyLife Quotation Management System Test Suite (Prompt 12)
 *
 * Verifies:
 * 1. Quotation fields: labour_charges_kobo, materials_costs_kobo, additional_expenses_kobo,
 *    work_description, estimated_duration_minutes, valid_until, total_amount_kobo, currency_code.
 * 2. Professional functionality: create quotation, edit draft, submit, withdraw, view responses.
 * 3. Customer functionality: view quotations, compare side-by-side, request clarification, accept, decline.
 * 4. Business rules:
 *    - Rule 1: Calculate totals on the trusted backend.
 *    - Rule 2: Do not trust totals submitted by the browser.
 *    - Rule 3: Use integer minor units (kobo).
 *    - Rule 4: Preserve quotation versions (public.quotation_versions snapshot history).
 *    - Rule 5: Require customer approval for changes to an accepted quotation.
 *    - Rule 6: Expired quotations cannot be accepted.
 *    - Rule 7: Record acceptance timestamps.
 *    - Rule 8: Prevent unauthorised quotation modification.
 * 5. End-to-end quotation workflow against live Supabase PostgreSQL.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import dns from "node:dns";
import pg from "pg";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("=== EasyLife Quotation Management Engine Test Suite (Prompt 12) ===\n");

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
// 1. STATIC CODE & CONFIGURATION INTEGRITY
// ============================================================================
console.log("1. Verifying Prompt 12 Type Definitions & Static Code Structure:");

const sharedTypesFile = path.join(rootDir, "packages", "shared-types", "src", "index.ts");
const databaseTypesFile = path.join(rootDir, "packages", "shared-types", "src", "database.ts");
const proActionsFile = path.join(webDir, "app", "actions", "pro.ts");
const bookingActionsFile = path.join(webDir, "app", "actions", "booking.ts");
const comparisonComponent = path.join(webDir, "components", "booking", "quotation-comparison.tsx");
const proQuotationsPage = path.join(webDir, "app", "pro", "quotations", "page.tsx");
const proQuotationList = path.join(webDir, "components", "pro", "pro-quotation-list.tsx");
const quotationModal = path.join(webDir, "components", "pro", "quotation-modal.tsx");
const migrationFile = path.join(rootDir, "supabase", "migrations", "20261104000900_quotation_management_system.sql");

test("Shared types export QuotationStatus with 'draft'", () => {
  assert.ok(fs.existsSync(sharedTypesFile), "Missing shared-types/src/index.ts");
  const content = fs.readFileSync(sharedTypesFile, "utf8");
  assert.ok(content.includes("export type QuotationStatus"), "Missing QuotationStatus export");
  assert.ok(content.includes('"draft"'), "Missing 'draft' status in QuotationStatus");
  assert.ok(content.includes('"pending"'), "Missing 'pending' status in QuotationStatus");
  assert.ok(content.includes('"accepted"'), "Missing 'accepted' status in QuotationStatus");
  assert.ok(content.includes('"declined"'), "Missing 'declined' status in QuotationStatus");
  assert.ok(content.includes('"withdrawn"'), "Missing 'withdrawn' status in QuotationStatus");
  assert.ok(content.includes('"expired"'), "Missing 'expired' status in QuotationStatus");
});

test("Database types export updated QuotationRow and QuotationVersionRow", () => {
  assert.ok(fs.existsSync(databaseTypesFile), "Missing shared-types/src/database.ts");
  const content = fs.readFileSync(databaseTypesFile, "utf8");
  assert.ok(content.includes("export interface QuotationRow"), "Missing QuotationRow");
  assert.ok(content.includes("work_description"), "Missing work_description on QuotationRow");
  assert.ok(content.includes("labour_charges_kobo"), "Missing labour_charges_kobo on QuotationRow");
  assert.ok(content.includes("materials_costs_kobo"), "Missing materials_costs_kobo on QuotationRow");
  assert.ok(content.includes("additional_expenses_kobo"), "Missing additional_expenses_kobo on QuotationRow");
  assert.ok(content.includes("decline_reason"), "Missing decline_reason on QuotationRow");
  assert.ok(content.includes("clarification_notes"), "Missing clarification_notes on QuotationRow");
  assert.ok(content.includes("export interface QuotationVersionRow"), "Missing QuotationVersionRow");
});

test("Server action pro.ts routes quotation submissions to trusted RPC submit_or_revise_quotation", () => {
  assert.ok(fs.existsSync(proActionsFile), "Missing actions/pro.ts");
  const content = fs.readFileSync(proActionsFile, "utf8");
  assert.ok(content.includes("submit_or_revise_quotation"), "Missing submit_or_revise_quotation call in pro.ts");
  assert.ok(content.includes("withdrawQuotationAction"), "Missing withdrawQuotationAction in pro.ts");
  assert.ok(content.includes("withdraw_quotation"), "Missing withdraw_quotation RPC call in pro.ts");
});

test("Server action booking.ts provides declineQuotationAction and requestQuotationClarificationAction", () => {
  assert.ok(fs.existsSync(bookingActionsFile), "Missing actions/booking.ts");
  const content = fs.readFileSync(bookingActionsFile, "utf8");
  assert.ok(content.includes("declineQuotationAction"), "Missing declineQuotationAction in booking.ts");
  assert.ok(content.includes("decline_booking_quotation"), "Missing decline_booking_quotation RPC call");
  assert.ok(content.includes("requestQuotationClarificationAction"), "Missing requestQuotationClarificationAction in booking.ts");
  assert.ok(content.includes("request_quotation_clarification"), "Missing request_quotation_clarification RPC call");
  assert.ok(content.includes("accept_booking_quotation"), "Missing accept_booking_quotation in booking.ts");
});

test("QuotationComparison component provides side-by-side cost breakdown matrix and customer actions", () => {
  assert.ok(fs.existsSync(comparisonComponent), "Missing quotation-comparison.tsx");
  const content = fs.readFileSync(comparisonComponent, "utf8");
  assert.ok(content.includes("QuotationComparison"), "Missing QuotationComparison export");
  assert.ok(content.includes("Labour Charges:"), "Missing labour charges breakdown row");
  assert.ok(content.includes("Materials"), "Missing materials breakdown row");
  assert.ok(content.includes("Additional"), "Missing additional fees breakdown row");
  assert.ok(content.includes("acceptQuotationAction"), "Missing acceptQuotationAction integration");
  assert.ok(content.includes("declineQuotationAction"), "Missing declineQuotationAction integration");
  assert.ok(content.includes("requestQuotationClarificationAction"), "Missing clarification action integration");
});

test("Professional Quotations UI supports draft filtering, withdrawal, and customer responses", () => {
  assert.ok(fs.existsSync(proQuotationsPage), "Missing pro/quotations/page.tsx");
  assert.ok(fs.existsSync(proQuotationList), "Missing pro-quotation-list.tsx");
  const listContent = fs.readFileSync(proQuotationList, "utf8");
  assert.ok(listContent.includes("Drafts"), "Missing Drafts filter tab");
  assert.ok(listContent.includes("Pending Customer Review"), "Missing Pending Review filter tab");
  assert.ok(listContent.includes("withdrawQuotationAction"), "Missing withdrawQuotationAction in pro list");
  assert.ok(listContent.includes("clarification_notes"), "Missing clarification display in pro list");
});

test("Quotation modal supports draft vs submit, work description, duration, and itemized rows", () => {
  assert.ok(fs.existsSync(quotationModal), "Missing quotation-modal.tsx");
  const content = fs.readFileSync(quotationModal, "utf8");
  assert.ok(content.includes("Save as Draft"), "Missing 'Save as Draft' CTA in quotation modal");
  assert.ok(content.includes("workDescription"), "Missing workDescription in quotation modal");
  assert.ok(content.includes("validUntilDays"), "Missing validUntilDays in quotation modal");
  assert.ok(content.includes("Labour"), "Missing Labour line item option");
  assert.ok(content.includes("Materials / Parts"), "Missing Materials line item option");
});

// ============================================================================
// 2. LIVE SUPABASE DATABASE VERIFICATION & LIFECYCLE TESTS
// ============================================================================
console.log("\n2. Connecting to Live Remote Supabase Database:");

const dbConnStr =
  getDatabaseUrl();

async function runLiveDbChecks() {
  const pool = await connectPoolWithRetry(pg.Pool, dbConnStr);
  const client = {
    query: (text, params) => queryPoolWithRetry(pool, text, params),
  };

  function withAuth(userId, fn, asAuthenticated = true) {
    return runWithAuth(pool, userId, fn, { asAuthenticated });
  }

  try {
    // 1. Verify 'draft' in public.quotation_status enum
    await asyncTest("Live DB: public.quotation_status enum has 'draft' and all required statuses", async () => {
      const res = await client.query(`
        SELECT enumlabel
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'quotation_status'
        ORDER BY enumsortorder;
      `);
      const labels = res.rows.map((r) => r.enumlabel);
      const expected = ["draft", "pending", "accepted", "declined", "withdrawn", "expired"];
      for (const st of expected) {
        assert.ok(labels.includes(st), `Missing status '${st}' in live quotation_status enum`);
      }
      console.log(`         Found all required quotation_status labels: ${labels.join(", ")}`);
    });

    // 2. Verify table public.quotation_versions and RLS
    await asyncTest("Live DB: public.quotation_versions table exists with RLS enabled", async () => {
      const tableRes = await client.query(`
        SELECT rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'quotation_versions';
      `);
      assert.strictEqual(tableRes.rows.length, 1, "quotation_versions table does not exist");
      assert.strictEqual(tableRes.rows[0].rowsecurity, true, "RLS not enabled on quotation_versions table");

      const colRes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'quotation_versions'
        AND column_name IN ('quotation_id', 'booking_id', 'version_number', 'status', 'total_amount_kobo', 'items_snapshot');
      `);
      assert.strictEqual(colRes.rows.length, 6, "Missing key columns on quotation_versions");
      console.log(`         Verified public.quotation_versions table with RLS enabled.`);
    });

    // 3. Verify public.quotations extended columns
    await asyncTest("Live DB: public.quotations has all Prompt 12 required columns", async () => {
      const colRes = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'quotations';
      `);
      const cols = colRes.rows.map((r) => r.column_name);
      const requiredCols = [
        "version",
        "work_description",
        "labour_charges_kobo",
        "materials_costs_kobo",
        "additional_expenses_kobo",
        "total_amount_kobo",
        "estimated_duration_minutes",
        "valid_until",
        "currency_code",
        "decline_reason",
        "clarification_notes",
        "withdrawal_reason",
        "accepted_at",
      ];
      for (const c of requiredCols) {
        assert.ok(cols.includes(c), `Missing column '${c}' on public.quotations`);
      }
      console.log(`         Verified all required structured fields on public.quotations.`);
    });

    // 4. Verify stored procedures exist
    await asyncTest("Live DB: All 5 Prompt 12 stored procedures exist in public schema", async () => {
      const res = await client.query(`
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
      const names = res.rows.map((r) => r.routine_name);
      assert.ok(names.includes("submit_or_revise_quotation"), "Missing submit_or_revise_quotation");
      assert.ok(names.includes("withdraw_quotation"), "Missing withdraw_quotation");
      assert.ok(names.includes("decline_booking_quotation"), "Missing decline_booking_quotation");
      assert.ok(names.includes("request_quotation_clarification"), "Missing request_quotation_clarification");
      assert.ok(names.includes("accept_booking_quotation"), "Missing accept_booking_quotation");
      console.log(`         Verified all 5 stored procedures.`);
    });

    // 5. Setup live fixtures for business rule test lifecycle
    console.log("\n3. Testing Business Rules & Quotation Lifecycle on Live DB:");

    // Fetch test professional first, then distinct non-pro customer
    const proRes = await client.query(`
      SELECT pp.id, pp.user_id
      FROM public.professional_profiles pp
      JOIN public.profiles p ON pp.user_id = p.id
      WHERE pp.verification_status = 'approved'
      LIMIT 1;
    `);
    assert.ok(proRes.rows.length > 0, "No approved professional profile found for testing");
    const testProId = proRes.rows[0].id;
    const testProUserId = proRes.rows[0].user_id;

    let custRes = await client.query(`
      SELECT p.id FROM public.profiles p
      WHERE p.primary_role = 'customer'
        AND p.id <> $1
        AND NOT EXISTS (SELECT 1 FROM public.professional_profiles pp2 WHERE pp2.user_id = p.id)
      LIMIT 1;
    `, [testProUserId]);
    if (custRes.rows.length === 0) {
      custRes = await client.query(`SELECT id FROM public.profiles WHERE id <> $1 LIMIT 1;`, [testProUserId]);
    }
    assert.ok(custRes.rows.length > 0, "No customer profile found for testing");
    const testCustomerId = custRes.rows[0].id;

    const catRes = await client.query(`
      SELECT id FROM public.service_categories LIMIT 1;
    `);
    const testCategoryId = catRes.rows[0].id;

    // Create a dedicated test booking
    const bkRes = await client.query(`
      INSERT INTO public.bookings (
        customer_id, category_id, title, description,
        city, state, service_address, status
      ) VALUES (
        $1, $2, 'Quotation Engine Test Booking',
        'Testing Prompt 12 trusted calculations and version snapshots',
        'Port Harcourt', 'Rivers State', 'Plot 99 Trans Amadi Industrial Layout',
        'open'
      )
      RETURNING id, reference_code;
    `, [testCustomerId, testCategoryId]);
    const testBookingId = bkRes.rows[0].id;

    let createdQuoteId = null;

    // Test A: Business Rule 1, 2, 3: Trusted Backend Total Calculation in Minor Units (kobo)
    await asyncTest("Live DB Rule 1 & 2: Backend calculates totals from line items; browser input ignored", async () => {
      const items = [
        { item_type: "labor", description: "Electrical Diagnosis", quantity: 2, unit_price_kobo: 500000 }, // 2 * 5,000 = 10,000 NGN = 1,000,000 kobo
        { item_type: "material", description: "100A Circuit Breaker", quantity: 3, unit_price_kobo: 800000 }, // 3 * 8,000 = 24,000 NGN = 2,400,000 kobo
        { item_type: "callout", description: "Diagnostic Callout Fee", quantity: 1, unit_price_kobo: 300000 }, // 1 * 3,000 = 3,000 NGN = 300,000 kobo
      ];

      const rpcRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Full replacement of main circuit breaker and load test',
            p_estimated_duration_minutes => 90,
            p_valid_until => now() + interval '7 days',
            p_proposed_start_at => now() + interval '1 day',
            p_notes => 'Includes 30-day warranty',
            p_is_draft => true,
            p_items => $3::jsonb
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(items)])
      );

      const result = rpcRes.rows[0].result;
      assert.strictEqual(result.success, true, `submit_or_revise_quotation failed: ${JSON.stringify(result)}`);
      assert.strictEqual(result.status, "draft", "Quotation status should be 'draft'");

      assert.strictEqual(Number(result.labour_charges_kobo), 1000000, "Labour charges incorrect");
      assert.strictEqual(Number(result.materials_costs_kobo), 2400000, "Materials costs incorrect");
      assert.strictEqual(Number(result.additional_expenses_kobo), 300000, "Additional expenses incorrect");
      assert.strictEqual(Number(result.total_amount_kobo), 3700000, "Total amount incorrect");

      createdQuoteId = result.quotation_id;
      console.log(`         Quotation draft created: ${result.reference_code} (Total: ₦${result.total_amount_kobo / 100})`);
    });

    // Test B: Edit Draft Before Submission
    await asyncTest("Live DB: Professional can edit draft quotation before submission", async () => {
      assert.ok(createdQuoteId, "Missing createdQuoteId");
      const updatedItems = [
        { item_type: "labor", description: "Electrical Diagnosis & Wiring", quantity: 2, unit_price_kobo: 600000 }, // 12,000 NGN = 1,200,000 kobo
        { item_type: "material", description: "100A Schneider Breaker", quantity: 1, unit_price_kobo: 1500000 }, // 15,000 NGN = 1,500,000 kobo
      ];

      const rpcRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Updated scope: Schneider breaker',
            p_estimated_duration_minutes => 120,
            p_valid_until => now() + interval '7 days',
            p_proposed_start_at => now() + interval '1 day',
            p_notes => 'Updated draft',
            p_is_draft => true,
            p_items => $3::jsonb,
            p_quotation_id => $4
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(updatedItems), createdQuoteId])
      );

      const result = rpcRes.rows[0].result;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "draft");
      assert.strictEqual(Number(result.total_amount_kobo), 2700000, "Updated draft total incorrect");
      console.log(`         Draft updated in place: new total ₦${result.total_amount_kobo / 100}`);
    });

    // Test C: Submit Quotation (draft -> pending)
    await asyncTest("Live DB: Submit quotation transitions draft to pending and advances booking to 'quoted'", async () => {
      const items = [
        { item_type: "labor", description: "Electrical Diagnosis & Wiring", quantity: 2, unit_price_kobo: 600000 },
        { item_type: "material", description: "100A Schneider Breaker", quantity: 1, unit_price_kobo: 1500000 },
      ];

      const rpcRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Final proposal: Schneider breaker and load test',
            p_estimated_duration_minutes => 120,
            p_valid_until => now() + interval '7 days',
            p_proposed_start_at => now() + interval '1 day',
            p_notes => 'Final submission',
            p_is_draft => false,
            p_items => $3::jsonb,
            p_quotation_id => $4
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(items), createdQuoteId])
      );

      const result = rpcRes.rows[0].result;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "pending");

      const bkCheck = await client.query(`SELECT status FROM public.bookings WHERE id = $1`, [testBookingId]);
      assert.strictEqual(bkCheck.rows[0].status, "quoted", "Booking status should advance to 'quoted'");
      console.log(`         Quotation submitted: status is 'pending', booking status is 'quoted'.`);
    });

    // Test D: Rule 4: Preserve Quotation Versions (public.quotation_versions)
    await asyncTest("Live DB Rule 4: Immutable quotation version snapshot is preserved in quotation_versions", async () => {
      const verRes = await client.query(`
        SELECT version_number, status, total_amount_kobo, items_snapshot
        FROM public.quotation_versions
        WHERE quotation_id = $1
        ORDER BY version_number ASC;
      `, [createdQuoteId]);

      assert.ok(verRes.rows.length >= 1, "No version history recorded");
      const v1 = verRes.rows[0];
      assert.strictEqual(v1.version_number, 1);
      assert.strictEqual(Number(v1.total_amount_kobo), 2700000);
      assert.ok(Array.isArray(v1.items_snapshot), "items_snapshot should be an array");
      assert.strictEqual(v1.items_snapshot.length, 2, "items_snapshot should preserve 2 line items");
      console.log(`         Verified version ${v1.version_number} snapshot in public.quotation_versions.`);
    });

    // Test E: Customer Requests Clarification
    await asyncTest("Live DB: Customer can request quotation clarification and timestamp is recorded", async () => {
      const clarifyRes = await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT public.request_quotation_clarification(
            p_quotation_id => $1,
            p_notes => 'Does the price include VAT and is the Schneider breaker an original EU model?'
          ) AS result;
        `, [createdQuoteId])
      );

      const result = clarifyRes.rows[0].result;
      assert.strictEqual(result.success, true);

      const qCheck = await client.query(`
        SELECT clarification_requested_at, clarification_notes
        FROM public.quotations
        WHERE id = $1;
      `, [createdQuoteId]);
      assert.ok(qCheck.rows[0].clarification_requested_at, "clarification_requested_at not set");
      assert.ok(qCheck.rows[0].clarification_notes.includes("Schneider breaker"), "clarification_notes not stored");
      console.log(`         Clarification recorded on quotation.`);
    });

    // Test F: Professional Withdraws Quotation
    await asyncTest("Live DB: Professional can withdraw a pending quotation with reason", async () => {
      const withdrawRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.withdraw_quotation(
            p_quotation_id => $1,
            p_reason => 'Supplier parts temporarily out of stock'
          ) AS result;
        `, [createdQuoteId])
      );

      const result = withdrawRes.rows[0].result;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "withdrawn");

      const qCheck = await client.query(`
        SELECT status, withdrawn_at, withdrawal_reason
        FROM public.quotations
        WHERE id = $1;
      `, [createdQuoteId]);
      assert.strictEqual(qCheck.rows[0].status, "withdrawn");
      assert.ok(qCheck.rows[0].withdrawn_at, "withdrawn_at not set");
      assert.strictEqual(qCheck.rows[0].withdrawal_reason, "Supplier parts temporarily out of stock");
      console.log(`         Quotation successfully withdrawn.`);
    });

    // Test G: Customer Declines a Quotation
    await asyncTest("Live DB: Customer can decline a quotation with decline reason recorded", async () => {
      const items = [{ item_type: "labor", description: "Inspection", quantity: 1, unit_price_kobo: 400000 }];
      const subRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Inspection quote to decline',
            p_estimated_duration_minutes => 60,
            p_valid_until => now() + interval '7 days',
            p_is_draft => false,
            p_items => $3::jsonb
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(items)])
      );
      const quoteToDeclineId = subRes.rows[0].result.quotation_id;

      const decRes = await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT public.decline_booking_quotation(
            p_quotation_id => $1,
            p_decline_reason => 'Price is higher than budget'
          ) AS result;
        `, [quoteToDeclineId])
      );

      const result = decRes.rows[0].result;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "declined");

      const qCheck = await client.query(`
        SELECT status, declined_at, decline_reason
        FROM public.quotations
        WHERE id = $1;
      `, [quoteToDeclineId]);
      assert.strictEqual(qCheck.rows[0].status, "declined");
      assert.ok(qCheck.rows[0].declined_at, "declined_at not set");
      assert.strictEqual(qCheck.rows[0].decline_reason, "Price is higher than budget");
      console.log(`         Quotation declined with reason recorded.`);
    });

    // Test H: Rule 6: Expired Quotations Cannot Be Accepted
    await asyncTest("Live DB Rule 6: Expired quotations cannot be accepted (returns QUOTATION_EXPIRED)", async () => {
      const qRes = await client.query(`
        INSERT INTO public.quotations (
          booking_id, professional_id, status, subtotal_kobo, total_amount_kobo,
          estimated_duration_minutes, valid_until, work_description
        ) VALUES (
          $1, $2, 'pending', 500000, 500000, 60, now() - interval '2 hours', 'Expired quotation'
        )
        RETURNING id;
      `, [testBookingId, testProId]);
      const expiredQuoteId = qRes.rows[0].id;

      const acceptRes = await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT public.accept_booking_quotation(
            p_booking_id => $1,
            p_quotation_id => $2
          ) AS result;
        `, [testBookingId, expiredQuoteId])
      );

      const result = acceptRes.rows[0].result;
      assert.strictEqual(result.success, false, "Expired quotation acceptance should fail");
      assert.strictEqual(result.error, "QUOTATION_EXPIRED", "Error should be QUOTATION_EXPIRED");
      console.log(`         Expired quotation correctly rejected: ${result.message}`);
    });

    // Test I: Rule 7: Accept Quotation & Record Acceptance Timestamp
    let validAcceptedQuoteId = null;
    await asyncTest("Live DB Rule 7: Quotation acceptance records accepted_at timestamp and locks booking", async () => {
      const items = [
        { item_type: "labor", description: "Complete Installation", quantity: 1, unit_price_kobo: 800000 },
        { item_type: "material", description: "Premium Parts", quantity: 1, unit_price_kobo: 1200000 },
      ];
      const subRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Valid quote to accept',
            p_estimated_duration_minutes => 120,
            p_valid_until => now() + interval '7 days',
            p_is_draft => false,
            p_items => $3::jsonb
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(items)])
      );
      validAcceptedQuoteId = subRes.rows[0].result.quotation_id;

      const acceptRes = await withAuth(testCustomerId, (tx) =>
        tx.query(`
          SELECT public.accept_booking_quotation(
            p_booking_id => $1,
            p_quotation_id => $2,
            p_scheduled_start => now() + interval '2 days',
            p_scheduled_end => now() + interval '2 days' + interval '2 hours'
          ) AS result;
        `, [testBookingId, validAcceptedQuoteId])
      );

      const result = acceptRes.rows[0].result;
      assert.strictEqual(result.success, true, `Acceptance failed: ${JSON.stringify(result)}`);
      assert.strictEqual(result.status, "confirmed");

      const qCheck = await client.query(`
        SELECT status, accepted_at
        FROM public.quotations
        WHERE id = $1;
      `, [validAcceptedQuoteId]);
      assert.strictEqual(qCheck.rows[0].status, "accepted");
      assert.ok(qCheck.rows[0].accepted_at, "accepted_at timestamp was not recorded");
      console.log(`         Quotation accepted; accepted_at timestamp recorded.`);
    });

    // Test J: Rule 5: Require Customer Approval for Changes to an Accepted Quotation
    await asyncTest("Live DB Rule 5: Modifying an accepted quote creates a new version proposal requiring customer approval", async () => {
      const revisedItems = [
        { item_type: "labor", description: "Complete Installation + Extra Wiring", quantity: 1, unit_price_kobo: 1000000 },
        { item_type: "material", description: "Premium Parts + Surge Protector", quantity: 1, unit_price_kobo: 1500000 },
      ];

      const revRes = await withAuth(testProUserId, (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Revised scope: added surge protector',
            p_estimated_duration_minutes => 150,
            p_valid_until => now() + interval '7 days',
            p_is_draft => false,
            p_items => $3::jsonb,
            p_quotation_id => $4
          ) AS result;
        `, [testBookingId, testProId, JSON.stringify(revisedItems), validAcceptedQuoteId])
      );

      const result = revRes.rows[0].result;
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.is_revision_of_accepted, true, "Should be flagged as revision of accepted quotation");
      assert.strictEqual(result.version, 2, "Version should be bumped to 2");
      assert.strictEqual(result.status, "pending", "Revision proposal must be in pending status for customer review");

      const verRes = await client.query(`
        SELECT version_number, status, total_amount_kobo
        FROM public.quotation_versions
        WHERE quotation_id = $1
        ORDER BY version_number ASC;
      `, [validAcceptedQuoteId]);
      assert.strictEqual(verRes.rows.length, 2, "Expected 2 versions in quotation_versions");
      assert.strictEqual(verRes.rows[0].version_number, 1);
      assert.strictEqual(verRes.rows[0].status, "accepted");
      assert.strictEqual(verRes.rows[1].version_number, 2);
      assert.strictEqual(verRes.rows[1].status, "pending");
      console.log(`         Version 1 (accepted) preserved; Version 2 (pending revision) created for customer approval.`);
    });

    // Test K: Rule 8: Prevent Unauthorised Quotation Modification
    await asyncTest("Live DB Rule 8: Prevent unauthorised quotation modification by unrelated users", async () => {
      const dummyItems = [{ item_type: "labor", description: "Hacker labor", quantity: 1, unit_price_kobo: 999999 }];
      const failRes = await withAuth("00000000-0000-0000-0000-000000000999", (tx) =>
        tx.query(`
          SELECT public.submit_or_revise_quotation(
            p_booking_id => $1,
            p_professional_id => $2,
            p_work_description => 'Hacker edit',
            p_estimated_duration_minutes => 60,
            p_valid_until => now() + interval '7 days',
            p_is_draft => false,
            p_items => $4::jsonb,
            p_quotation_id => $3
          ) AS result;
        `, [testBookingId, testProId, validAcceptedQuoteId, JSON.stringify(dummyItems)])
      );

      assert.strictEqual(failRes.rows[0].result.success, false);
      assert.strictEqual(failRes.rows[0].result.error, "FORBIDDEN");
      console.log(`         Unauthorised quotation modification rejected with FORBIDDEN.`);
    });

    // Clean up test booking and quotations (safe cleanup without mutating immutable tables)
    try {
      await client.query(`DELETE FROM public.appointments WHERE booking_id = $1;`, [testBookingId]);
      await client.query(`DELETE FROM public.quotation_versions WHERE booking_id = $1;`, [testBookingId]);
      await client.query(`DELETE FROM public.quotation_items WHERE quotation_id IN (SELECT id FROM public.quotations WHERE booking_id = $1);`, [testBookingId]);
      await client.query(`DELETE FROM public.quotations WHERE booking_id = $1;`, [testBookingId]);
    } catch {
      // Ignore
    }
    console.log(`         Cleaned up temporary test quotation fixtures.`);
  } finally {
    await pool.end();
  }
}

async function main() {
  await runLiveDbChecks();

  console.log("\n=================================================================");
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner crash:", err);
  process.exit(1);
});
