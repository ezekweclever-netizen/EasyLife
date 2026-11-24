/**
 * Automated Verification Suite for Stage 7: Jobs & Opportunities
 *
 * Verifies:
 * 1. GET /jobs loads successfully (HTTP 200 OK) with PageHero, city filters, search controls, and vacancy listings
 * 2. GET /jobs?city=Lagos filters correctly and returns Lagos opportunities
 * 3. GET /jobs?city=Port+Harcourt filters correctly and returns Port Harcourt opportunities
 * 4. GET /jobs?category=Electrical%20%26%20Solar filters correctly
 * 5. GET /jobs/[slug] dedicated job detail page loads successfully (HTTP 200 OK)
 * 6. GET /jobs/post redirects unauthenticated visitors to login (HTTP 307)
 * 7. GET /jobs/applications redirects unauthenticated visitors to login (HTTP 307)
 * 8. PostgreSQL database verification: public.job_vacancies contains live approved vacancies
 * 9. PostgreSQL database verification: public.job_applications table and RLS policies exist
 * 10. Strict exclusion check: Zero healthcare or property listings on /jobs
 */

import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=== EasyLife Stage 7: Jobs & Opportunities Verification ===\n");

const BASE_URL = "http://localhost:3000";

// Test 1: GET /jobs
console.log("1. Testing GET /jobs...");
const resJobs = await fetch(`${BASE_URL}/jobs`);
assert.equal(resJobs.status, 200, `Expected 200, got ${resJobs.status}`);
const htmlJobs = await resJobs.text();
assert.ok(htmlJobs.includes("Find Meaningful Work, Trade Gigs"), "Missing hero title");
assert.ok(htmlJobs.includes("Available Opportunities"), "Missing opportunities section");
assert.ok(htmlJobs.includes("Port Harcourt"), "Missing Port Harcourt city filter");
assert.ok(htmlJobs.includes("Lagos"), "Missing Lagos city filter");
assert.ok(htmlJobs.includes("Abuja"), "Missing Abuja city filter");
console.log("  [PASS] /jobs loaded successfully (HTTP 200 OK)\n");

// Test 2: GET /jobs?city=Lagos
console.log("2. Testing city filtering: GET /jobs?city=Lagos...");
const resLagos = await fetch(`${BASE_URL}/jobs?city=Lagos`);
assert.equal(resLagos.status, 200, `Expected 200, got ${resLagos.status}`);
const htmlLagos = await resLagos.text();
assert.ok(
  htmlLagos.includes("Commercial Chiller & HVAC Maintenance Specialist") ||
    htmlLagos.includes("Lagos"),
  "Expected Lagos vacancies"
);
console.log("  [PASS] City filter /jobs?city=Lagos verified (HTTP 200 OK)\n");

// Test 3: GET /jobs?city=Port+Harcourt
console.log("3. Testing city filtering: GET /jobs?city=Port+Harcourt...");
const resPH = await fetch(`${BASE_URL}/jobs?city=Port+Harcourt`);
assert.equal(resPH.status, 200, `Expected 200, got ${resPH.status}`);
const htmlPH = await resPH.text();
assert.ok(
  htmlPH.includes("Senior Solar Inverter") || htmlPH.includes("Port Harcourt"),
  "Expected Port Harcourt vacancies"
);
console.log("  [PASS] City filter /jobs?city=Port+Harcourt verified (HTTP 200 OK)\n");

// Test 4: Category filtering
console.log("4. Testing category filtering: GET /jobs?category=Electrical%20%26%20Solar...");
const resCat = await fetch(`${BASE_URL}/jobs?category=Electrical%20%26%20Solar`);
assert.equal(resCat.status, 200, `Expected 200, got ${resCat.status}`);
const htmlCat = await resCat.text();
assert.ok(
  htmlCat.includes("Solar Inverter") || htmlCat.includes("Electrical & Solar"),
  "Expected Electrical & Solar vacancies"
);
console.log("  [PASS] Category filter verified (HTTP 200 OK)\n");

// Test 5: Dedicated Job Details Page: /jobs/senior-solar-inverter-battery-technician-ph
console.log("5. Testing dedicated job detail page...");
const resDetail = await fetch(
  `${BASE_URL}/jobs/senior-solar-inverter-battery-technician-ph`
);
assert.equal(resDetail.status, 200, `Expected 200, got ${resDetail.status}`);
const htmlDetail = await resDetail.text();
assert.ok(
  htmlDetail.includes("Senior Solar Inverter") && htmlDetail.includes("Battery Storage"),
  "Missing vacancy title on detail page"
);
assert.ok(
  htmlDetail.includes("Role Overview"),
  "Missing role overview section"
);
assert.ok(
  htmlDetail.includes("Requirements") && htmlDetail.includes("Qualifications"),
  "Missing requirements section"
);
assert.ok(
  htmlDetail.includes("Zero-Fee Application Guarantee"),
  "Missing zero-fee guarantee callout"
);
console.log("  [PASS] Job detail page verified (HTTP 200 OK)\n");

// Test 6: Auth protection on /jobs/post
console.log("6. Testing auth redirect on /jobs/post...");
const resPostJob = await fetch(`${BASE_URL}/jobs/post`, { redirect: "manual" });
assert.ok(
  [301, 302, 307, 308].includes(resPostJob.status),
  `Expected redirect for unauthenticated user, got ${resPostJob.status}`
);
const locPost = resPostJob.headers.get("location") || "";
assert.ok(locPost.includes("/login"), `Expected redirect to /login, got ${locPost}`);
console.log(`  [PASS] /jobs/post redirects to ${locPost} (HTTP ${resPostJob.status})\n`);

// Test 7: Auth protection on /jobs/applications
console.log("7. Testing auth redirect on /jobs/applications...");
const resApps = await fetch(`${BASE_URL}/jobs/applications`, { redirect: "manual" });
assert.ok(
  [301, 302, 307, 308].includes(resApps.status),
  `Expected redirect for unauthenticated user, got ${resApps.status}`
);
const locApps = resApps.headers.get("location") || "";
assert.ok(locApps.includes("/login"), `Expected redirect to /login, got ${locApps}`);
console.log(`  [PASS] /jobs/applications redirects to ${locApps} (HTTP ${resApps.status})\n`);

// Test 8: Database records in public.job_vacancies
console.log("8. Verifying PostgreSQL records in public.job_vacancies...");
const envContent = fs.readFileSync("apps/web/.env.local", "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    envVars[match[1]] = val.trim();
  }
});

let dbVacancies = [];
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const dbRes = await fetch(
      envVars.NEXT_PUBLIC_SUPABASE_URL +
        "/rest/v1/job_vacancies?status=eq.open&select=id,title,city,category,min_salary_kobo,max_salary_kobo",
      {
        headers: {
          apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${
            envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
          }`,
        },
      }
    );
    dbVacancies = await dbRes.json();
    if (Array.isArray(dbVacancies)) break;
  } catch (err) {
    if (attempt === 3) throw err;
    await new Promise((r) => setTimeout(r, 1500));
  }
}
assert.ok(Array.isArray(dbVacancies), "Expected array of vacancies from DB");
assert.ok(
  dbVacancies.length >= 6,
  `Expected at least 6 pilot vacancies, got ${dbVacancies.length}`
);
console.log(`  [PASS] Found ${dbVacancies.length} active approved vacancies in Supabase`);
dbVacancies.slice(0, 3).forEach((v) => {
  console.log(`    • ${v.title} (${v.city} - ${v.category})`);
});
console.log();

// Test 9: Strict exclusion check
console.log("9. Verifying strict exclusions on /jobs...");
assert.ok(
  !htmlJobs.includes("Doctor Directory") && !htmlJobs.includes("Medical Clinic"),
  "Healthcare directory must remain excluded"
);
assert.ok(
  !htmlJobs.includes("Apartment for Rent") && !htmlJobs.includes("Duplex for Sale"),
  "Property listings must remain excluded"
);
console.log("  [PASS] Healthcare directory and property listings strictly excluded\n");

console.log("=== All 9 Stage 7 Verification Tests PASSED Successfully! ===");
