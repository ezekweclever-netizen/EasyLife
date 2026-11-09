import { getDatabaseUrl } from './_env.mjs';
import pg from 'pg';
const { Client } = pg;
import { executeRuleBasedDiagnosticEngine } from '../apps/web/src/lib/ai/assistant-engine.ts';
import { sanitizeOutputForSafety, getStandardDiagnosisDisclaimer } from '../apps/web/src/lib/ai/safety-rules.ts';

const CONNECTION_STRING = getDatabaseUrl();

async function runAIAssistantTests() {
  console.log("==================================================================");
  console.log("      EASYLIFE PROMPT 17: AI ASSISTANT VERIFICATION SUITE         ");
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
    // 1. Fetch categories from live database
    console.log("\n[Test 1] Validating Service Categories from Database...");
    const catRes = await client.query(
      "SELECT id, name, slug, description, is_active FROM public.service_categories WHERE is_active = true ORDER BY display_order ASC"
    );
    const dbCategories = catRes.rows;
    assert(dbCategories.length >= 12, `Database has ${dbCategories.length} active service categories (>= 12 required)`);

    // 2. Test Prompt 17's Canonical Example: Generator Stalling
    console.log("\n[Test 2] Testing Prompt 17 Example: Generator starts normally then switches off...");
    const generatorQuery = "My generator starts normally but switches off after a few minutes.";
    const genResult = executeRuleBasedDiagnosticEngine(generatorQuery, dbCategories);

    assert(genResult.categoryRecommendation !== null, "Category recommendation produced");
    assert(genResult.categoryRecommendation.categorySlug === 'generator-maintenance', "Recommended category is generator-maintenance");
    assert(
      dbCategories.some((c) => c.id === genResult.categoryRecommendation.categoryId),
      "Recommended categoryId is verified against live public.service_categories"
    );
    assert(genResult.clarifyingQuestions.length >= 2, "Asks at least 2 relevant clarifying questions");
    assert(genResult.problemSummary.reportedSymptoms.length > 0, "Summarises reported symptoms");
    assert(
      genResult.problemSummary.suggestedProfessionalType.toLowerCase().includes("generator"),
      "Suggests appropriate professional type (Generator Mechanic)"
    );
    assert(genResult.structuredRequest !== null, "Generates structured service request");
    assert(genResult.structuredRequest.suggestedTitle.length > 5, "Structured request has a clear suggested title");
    assert(genResult.structuredRequest.recommendedDescription.length > 15, "Structured request has detailed description");
    assert(genResult.structuredRequest.urgency !== undefined, "Structured request assigns urgency");

    // 3. Test Inverter & Power Backup Issue
    console.log("\n[Test 3] Testing Inverter Beeping & Fault Diagnostic...");
    const inverterQuery = "My inverter is beeping continuously and the red fault light is on.";
    const inverterResult = executeRuleBasedDiagnosticEngine(inverterQuery, dbCategories);

    assert(inverterResult.categoryRecommendation.categorySlug === 'electrical-power-backup', "Recommended category is electrical-power-backup");
    assert(
      inverterResult.problemSummary.safetyNotice.toLowerCase().includes("voltage") ||
      inverterResult.problemSummary.safetyNotice.toLowerCase().includes("battery"),
      "Provides high-voltage electrical safety warning"
    );
    assert(inverterResult.clarifyingQuestions.length >= 2, "Asks inverter capacity and battery age clarifying questions");

    // 4. Test Plumbing Leak Issue
    console.log("\n[Test 4] Testing Plumbing Water Leak Diagnostic...");
    const plumbingQuery = "Water is leaking under my kitchen sink and flooding the cabinet.";
    const plumbingResult = executeRuleBasedDiagnosticEngine(plumbingQuery, dbCategories);

    assert(plumbingResult.categoryRecommendation.categorySlug === 'plumbing-water-systems', "Recommended category is plumbing-water-systems");
    assert(
      plumbingResult.problemSummary.safetyNotice.toLowerCase().includes("shut") ||
      plumbingResult.problemSummary.safetyNotice.toLowerCase().includes("stopcock") ||
      plumbingResult.problemSummary.safetyNotice.toLowerCase().includes("pump"),
      "Advises shutting off main stopcock or pump to prevent flooding"
    );

    // 5. Test Air Conditioning Cooling Loss
    console.log("\n[Test 5] Testing AC Cooling Loss Diagnostic...");
    const acQuery = "My split AC is blowing warm air and outdoor fan is not spinning.";
    const acResult = executeRuleBasedDiagnosticEngine(acQuery, dbCategories);

    assert(acResult.categoryRecommendation.categorySlug === 'hvac-air-conditioning', "Recommended category is hvac-air-conditioning");
    assert(acResult.clarifyingQuestions.some((q) => q.toLowerCase().includes("hp") || q.toLowerCase().includes("split")), "Asks unit HP capacity");

    // 6. Test Safety Rule: Distinguish Reported Symptoms from Confirmed Diagnosis
    console.log("\n[Test 6] Testing Diagnostic Uncertainty & Disclaimer Rule...");
    const disclaimer = getStandardDiagnosisDisclaimer();
    assert(
      disclaimer.includes("not a definitive technical diagnosis") &&
      disclaimer.includes("inspection"),
      "Mandatory disclaimer clearly states findings are reported symptoms and require on-site technical inspection"
    );

    // 7. Test Safety Rule: Zero Dangerous DIY Instructions
    console.log("\n[Test 7] Testing DIY Output Sanitization...");
    const dangerousSample = "You should disassemble the compressor and touch the live wire to bridge the fuse.";
    const sanitization = sanitizeOutputForSafety(dangerousSample);
    assert(sanitization.hasDangerousInstructions === true, "Detected dangerous DIY commands");
    assert(!sanitization.sanitized.includes("touch the live wire"), "Sanitized output removed live wire hazard");
    assert(!sanitization.sanitized.includes("bridge the fuse"), "Sanitized output removed bridge fuse hazard");

    // 8. Test Rate Limiting Function in Database
    console.log("\n[Test 8] Testing check_ai_rate_limit() RPC in PostgreSQL...");
    const testSession = `test-sess-${Date.now()}`;
    const rateRes = await client.query(
      "SELECT public.check_ai_rate_limit($1, NULL, 60, 5) AS allowed",
      [testSession]
    );
    assert(rateRes.rows[0].allowed === true, "Initial rate limit check allowed");

    // 9. Test Usage Logging & Cost Monitoring RPC
    console.log("\n[Test 9] Testing record_ai_assistant_log() and get_ai_assistant_metrics() RPCs...");
    const logIdRes = await client.query(
      `SELECT public.record_ai_assistant_log(
        $1, $2, $3, $4, 'high', 'gpt-4o-mini', 150, 80, 230, 0.000071, NULL
      ) AS log_id`,
      [
        testSession,
        generatorQuery,
        genResult.categoryRecommendation.categoryId,
        genResult.categoryRecommendation.categoryName,
      ]
    );
    const logId = logIdRes.rows[0].log_id;
    assert(typeof logId === 'string' && logId.length > 10, "Usage log recorded in public.ai_assistant_logs");

    const metricsRes = await client.query("SELECT public.get_ai_assistant_metrics() AS metrics");
    const metrics = metricsRes.rows[0].metrics;
    assert(metrics.total_queries >= 1, `Total logged queries tracked: ${metrics.total_queries}`);
    assert(metrics.total_tokens >= 230, `Total tokens tracked: ${metrics.total_tokens}`);
    assert(Number(metrics.total_cost_usd) >= 0.00007, `Estimated cost tracked: $${metrics.total_cost_usd}`);

    console.log("\n==================================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!                    `);
    console.log("==================================================================");

  } finally {
    await client.end();
  }
}

runAIAssistantTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
