import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

console.log("=== Verifying Stage 13 Corrections & End-to-End Workflows ===\n");

// Test 1: Public /jobs page
console.log("1. Testing GET /jobs...");
const resJobs = await fetch(`${BASE_URL}/jobs`);
assert.equal(resJobs.status, 200, `Expected 200, got ${resJobs.status}`);
const htmlJobs = await resJobs.text();
assert.ok(htmlJobs.includes("Available Opportunities"), "Missing opportunities heading");
assert.ok(
  htmlJobs.includes("Apex Solar") ||
    htmlJobs.includes("Benchmark Facilities") ||
    htmlJobs.includes("Niger Delta Corporate"),
  "Missing verified company names in job listings"
);
console.log("  [PASS] /jobs loaded with live database records & linked employers\n");

// Test 2: Dedicated job detail route
console.log("2. Testing GET /jobs/senior-solar-inverter-battery-technician-ph...");
const resJobDetail = await fetch(`${BASE_URL}/jobs/senior-solar-inverter-battery-technician-ph`);
assert.equal(resJobDetail.status, 200, `Expected 200, got ${resJobDetail.status}`);
const htmlDetail = await resJobDetail.text();
assert.ok(htmlDetail.includes("Senior Solar Inverter"), "Missing vacancy title");
assert.ok(htmlDetail.includes("Hiring Organization"), "Missing Hiring Organization banner");
assert.ok(htmlDetail.includes("Apply for This Role"), "Missing Apply CTA");
console.log("  [PASS] Dedicated job detail page loaded with linked hiring organization\n");

// Test 3: Session status API endpoint
console.log("3. Testing GET /api/auth/session-status...");
const resSession = await fetch(`${BASE_URL}/api/auth/session-status`);
assert.equal(resSession.status, 200, `Expected 200, got ${resSession.status}`);
const sessionData = await resSession.json();
assert.ok(Array.isArray(sessionData.availableDashboards), "Missing availableDashboards array");
console.log("  [PASS] /api/auth/session-status returns structured availableDashboards\n");

// Test 4: Business Solutions canonical redirect to /business-hub
console.log("4. Testing GET /business-solutions redirect...");
const resBizSol = await fetch(`${BASE_URL}/business-solutions`, { redirect: "manual" });
assert.equal(resBizSol.status, 307, `Expected 307 redirect, got ${resBizSol.status}`);
assert.equal(resBizSol.headers.get("location"), "/business-hub", "Redirect destination mismatch");
console.log("  [PASS] /business-solutions 307 redirects to /business-hub\n");

// Test 5: Business Hub page & valid slugs
console.log("5. Testing GET /business-hub...");
const resHub = await fetch(`${BASE_URL}/business-hub`);
assert.equal(resHub.status, 200, `Expected 200, got ${resHub.status}`);
const htmlHub = await resHub.text();
assert.ok(htmlHub.includes("Business Hub"), "Missing Business Hub heading");
assert.ok(!htmlHub.includes("trans-amadi-power"), "Found obsolete 404 slug trans-amadi-power");
assert.ok(!htmlHub.includes("lekki-cooltech"), "Found obsolete 404 slug lekki-cooltech");
assert.ok(!htmlHub.includes("abuja-benchmark"), "Found obsolete 404 slug abuja-benchmark");
console.log("  [PASS] /business-hub contains 0 broken promo slugs\n");

// Test 6: Employer Jobs route protection
console.log("6. Testing GET /business/jobs unauthenticated protection...");
const resEmpJobs = await fetch(`${BASE_URL}/business/jobs`, { redirect: "manual" });
assert.equal(resEmpJobs.status, 307, `Expected 307 redirect, got ${resEmpJobs.status}`);
assert.ok(resEmpJobs.headers.get("location")?.includes("/login"), "Expected redirect to login");
console.log("  [PASS] /business/jobs securely guarded against unauthenticated access\n");

// Test 7: Admin Jobs route protection
console.log("7. Testing GET /admin/jobs unauthenticated protection...");
const resAdminJobs = await fetch(`${BASE_URL}/admin/jobs`, { redirect: "manual" });
assert.equal(resAdminJobs.status, 307, `Expected 307 redirect, got ${resAdminJobs.status}`);
assert.ok(resAdminJobs.headers.get("location")?.includes("/login"), "Expected redirect to login");
console.log("  [PASS] /admin/jobs securely guarded against unauthenticated access\n");

console.log("ALL VERIFICATION SUITES PASSED! [7/7]\n");
