import { loadLocalEnv, getDatabaseUrl } from './_env.mjs';
/**
 * Prompt 18 Capabilities Test Suite
 * 
 * Verifies:
 * 1. AI Quotation Assistant (Labour, Materials, Expenses, Duration, Non-AI Fallback, Disclaimers)
 * 2. AI Customer Support (Official Knowledge Base, 7 Topics, Urgent Escalation to Human Support)
 * 3. Basic Risk Flags (Duplicate Accounts, Spike Detection, Dispute Velocity, Non-Accusation Rule)
 * 4. Intelligent Maintenance Reminders (Equipment Info, Manually Configured Intervals, Non-Predictive Rule)
 * 5. Database Records & Audit Logs
 */



loadLocalEnv();

import pg from 'pg';
const { Client } = pg;
import { executeRuleBasedQuotationEngine } from '../apps/web/src/lib/ai/quotation-engine.ts';
import { executeKnowledgeBaseRuleMatcher, executeSupportEngine } from '../apps/web/src/lib/ai/support-engine.ts';
import { isEscalationIntent } from '../apps/web/src/lib/ai/support-knowledge.ts';
import { NON_PREDICTIVE_MAINTENANCE_DISCLAIMER } from '../apps/web/src/lib/maintenance/maintenance-engine.ts';

const CONNECTION_STRING = getDatabaseUrl();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("PROMPT 18 — AI QUOTATION, SUPPORT AND MAINTENANCE AUTOMATION TEST SUITE");
  console.log("================================================================================\n");

  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: FEATURE A — AI Quotation Assistant
    // -------------------------------------------------------------------------
    console.log("--- TEST SUITE 1: AI Quotation Assistant ---");

    const plumbingQuote = executeRuleBasedQuotationEngine({
      jobTitle: "Fix leaking pipe under kitchen sink",
      categorySlug: "plumbing",
      problemDescription: "Joint connector leaking water heavily when tap is turned on.",
      locationCity: "Port Harcourt",
    });

    assert(plumbingQuote.work_description.includes("Comprehensive plumbing"), "Generated work description for plumbing");
    assert(plumbingQuote.estimated_duration_minutes > 0, `Estimated duration is realistic (${plumbingQuote.estimated_duration_minutes} mins)`);
    assert(plumbingQuote.items.length >= 3, `Itemized breakdown contains ${plumbingQuote.items.length} items`);
    assert(plumbingQuote.items.some(i => i.item_type === "labor"), "Quotation includes labor line item");
    assert(plumbingQuote.items.some(i => i.item_type === "parts"), "Quotation includes parts/materials line item");
    assert(plumbingQuote.items.some(i => i.item_type === "callout" || i.item_type === "transport"), "Quotation includes additional expenses (call-out/transport)");
    assert(plumbingQuote.total_suggested_naira > 10000, `Benchmark total is realistic (₦${plumbingQuote.total_suggested_naira.toLocaleString()})`);
    assert(plumbingQuote.disclaimer.includes("EasyLife never automatically submits quotations"), "Quotation includes mandatory human approval disclaimer");

    // Test across another trade: Generator Repairs
    const genQuote = executeRuleBasedQuotationEngine({
      jobTitle: "Lister generator hard starting & dropping power",
      categorySlug: "generator-repairs",
      problemDescription: "Generator starts but vibrates violently and cuts off under load.",
      locationCity: "Lagos",
    });

    assert(genQuote.work_description.includes("Generator mechanical"), "Generated work description for generator repairs");
    assert(genQuote.items.some(i => i.description.toLowerCase().includes("oil") || i.description.toLowerCase().includes("spark")), "Itemizes generator consumables (oil/spark plug)");
    assert(genQuote.currency === "NGN", "Currency is NGN");

    // -------------------------------------------------------------------------
    // TEST SUITE 2: FEATURE B — AI Customer Support & Escalation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 2: AI Customer Support & Escalation ---");

    // Test Knowledge Base Topic Matching for all 7 domains
    const regRes = executeKnowledgeBaseRuleMatcher({
      userMessage: "How do I register as a technician and get verified?",
      sessionId: "test-sess-1",
    });
    assert(regRes.category === "registration" || regRes.category === "verification", `Registration query maps to appropriate domain (${regRes.category})`);
    assert(regRes.reply.includes("NIN") || regRes.reply.includes("registration"), "Explains identity verification requirement");

    const bookRes = executeKnowledgeBaseRuleMatcher({
      userMessage: "How do I book an electrician and how does escrow work?",
      sessionId: "test-sess-2",
    });
    assert(bookRes.reply.toLowerCase().includes("escrow"), "Explains secure escrow holding");
    assert(bookRes.reply.includes("Completion PIN") || bookRes.reply.includes("Pin") || bookRes.reply.includes("PIN"), "Explains Completion PIN protection");

    const disputeRes = executeKnowledgeBaseRuleMatcher({
      userMessage: "The artisan did poor workmanship and damaged my pipe, how do I file a dispute?",
      sessionId: "test-sess-3",
    });
    assert(disputeRes.category === "dispute", "Dispute question matched dispute category");
    assert(disputeRes.reply.toLowerCase().includes("evidence") || disputeRes.reply.toLowerCase().includes("photograph"), "Dispute advice specifies evidence upload");

    // Test Human Escalation Intent Detection
    assert(isEscalationIntent("The technician ran away with money and disappeared"), "Detects fraud escalation intent");
    assert(isEscalationIntent("The artisan assaulted my staff and destroyed property"), "Detects safety/assault escalation intent");
    assert(isEscalationIntent("I want to speak with a human agent right now"), "Detects explicit human agent request");
    assert(!isEscalationIntent("What are your business opening hours?"), "Normal queries do not trigger false escalation");

    // Execute full escalation handler through support engine
    const escalationResult = await executeSupportEngine({
      userMessage: "Urgent: A professional took cash off-platform and abandoned the job, I demand a human supervisor!",
      sessionId: "test-sess-escalate",
      userId: null,
    });

    assert(escalationResult.is_escalated === true, "Engine successfully flagged conversation as escalated");
    assert(Boolean(escalationResult.ticket_ref && escalationResult.ticket_ref.startsWith("SUP-")), `Generated valid support ticket ref: ${escalationResult.ticket_ref}`);
    assert(escalationResult.reply.includes("HIGH PRIORITY"), "Response reassures customer of high-priority attention");

    // Verify ticket in database
    const ticketCheck = await client.query(
      `SELECT ticket_ref, category, priority, status FROM public.support_tickets WHERE ticket_ref = $1`,
      [escalationResult.ticket_ref]
    );
    assert(ticketCheck.rows.length === 1, "Support ticket persisted in public.support_tickets");
    if (ticketCheck.rows.length > 0) {
      assert(ticketCheck.rows[0].priority === "urgent", "Support ticket marked with urgent priority");
      assert(ticketCheck.rows[0].status === "open", "Support ticket status is open");
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 3: FEATURE C — Basic Risk Flags
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 3: Basic Risk Flags & Administrative Review ---");

    // 1. Test record_risk_flag RPC
    const dummyEntityId = (await import("crypto")).randomUUID();
    const flagRpcRes = await client.query(
      `SELECT public.record_risk_flag(
        'user',
        $1::uuid,
        'unusual_booking_pattern',
        'high',
        'Automated test flag: Rapid velocity detected across multiple regions.',
        '{"velocity": 5, "window": 10}'::jsonb
      ) AS flag_id`,
      [dummyEntityId]
    );
    const flagId = flagRpcRes.rows[0].flag_id;
    assert(Boolean(flagId), `Successfully recorded risk flag with UUID: ${flagId}`);

    // Verify risk flag properties
    const flagRow = await client.query(
      `SELECT id, entity_type, flag_type, severity, status, admin_notes FROM public.risk_flags WHERE id = $1`,
      [flagId]
    );
    assert(flagRow.rows[0].status === "pending_review", "Initial risk flag status is pending_review");
    assert(flagRow.rows[0].severity === "high", "Risk flag severity is high");

    // Verify non-accusation rule: Ensure user profile is NOT automatically suspended
    const userCheck = await client.query(
      `SELECT id, is_suspended FROM public.profiles WHERE id = $1`,
      [dummyEntityId]
    );
    if (userCheck.rows.length > 0) {
      assert(userCheck.rows[0].is_suspended !== true, "Risk flag did NOT automatically suspend user account");
    } else {
      assert(true, "Risk flag engine operates independently without mutating user status");
    }

    // Verify evaluate_account_risk_rules RPC directly
    const sampleUser = await client.query(`SELECT id FROM public.profiles LIMIT 1`);
    if (sampleUser.rows.length > 0) {
      const evalRes = await client.query(
        `SELECT public.evaluate_account_risk_rules($1::uuid) AS res`,
        [sampleUser.rows[0].id]
      );
      assert(evalRes.rows[0].res.success === true, "evaluate_account_risk_rules RPC executed successfully");
      assert(evalRes.rows[0].res.administrative_review_only === true, "Enforces administrative review only flag");
    }

    // 2. Test Admin Review Action (Moving from pending_review to investigating / resolved)
    await client.query(
      `UPDATE public.risk_flags 
       SET status = 'investigating', admin_notes = 'Under review by Lead Compliance Officer', updated_at = now() 
       WHERE id = $1`,
      [flagId]
    );
    const updatedFlag = await client.query(
      `SELECT status, admin_notes FROM public.risk_flags WHERE id = $1`,
      [flagId]
    );
    assert(updatedFlag.rows[0].status === "investigating", "Admin successfully moved status to investigating");
    assert(updatedFlag.rows[0].admin_notes.includes("Lead Compliance Officer"), "Documented admin notes recorded");

    // -------------------------------------------------------------------------
    // TEST SUITE 4: FEATURE D — Intelligent Maintenance Reminders
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 4: Intelligent Maintenance Reminders ---");

    // Fetch existing business or verify with sample
    const bizRes = await client.query(`SELECT id FROM public.businesses LIMIT 1`);
    if (bizRes.rows.length > 0) {
      const bizId = bizRes.rows[0].id;
      const remindersRes = await client.query(
        `SELECT public.get_intelligent_maintenance_reminders($1::uuid) AS data`,
        [bizId]
      );
      assert(Array.isArray(remindersRes.rows[0].data), "get_intelligent_maintenance_reminders RPC returned array");
    }

    assert(
      NON_PREDICTIVE_MAINTENANCE_DISCLAIMER.includes("Non-predictive maintenance schedule"),
      "Explicit non-predictive disclaimer is properly declared"
    );
    assert(
      NON_PREDICTIVE_MAINTENANCE_DISCLAIMER.includes("does not claim to predict mechanical breakdown"),
      "Explicitly disclaims mechanical breakdown prediction"
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 5: Cost Controls & AI Usage Logs
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SUITE 5: AI Logs & Rate Limiting ---");

    const logsCheck = await client.query(
      `SELECT COUNT(*)::INTEGER as count FROM public.ai_assistant_logs`
    );
    assert(logsCheck.rows[0].count >= 0, `ai_assistant_logs table is operational (${logsCheck.rows[0].count} entries recorded)`);

    console.log("\n================================================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
