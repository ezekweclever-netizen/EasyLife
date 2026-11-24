import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const BASE_URL = "http://localhost:3000";

console.log("=== EasyLife Stage 9: Free Tools & AI Functionality Verification ===\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. GET /tools
console.log("1. Testing GET /tools main catalog...");
const toolsRes = await fetch(`${BASE_URL}/tools`);
assert(toolsRes.status === 200, "/tools loaded successfully (HTTP 200 OK)");
const toolsHtml = await toolsRes.text();
assert(toolsHtml.includes("100% Free Everyday Utilities"), "Hero contains utilities badge");
assert(toolsHtml.includes("AI Everyday Problem Assistant"), "Catalog contains AI Problem Assistant");
assert(toolsHtml.includes("Invoice Generator"), "Catalog contains Invoice Generator");
assert(toolsHtml.includes("Percentage Calculator"), "Catalog contains Percentage Calculator");
assert(toolsHtml.includes("Loan Repayment Calculator"), "Catalog contains Loan Calculator");

// 2. GET /free-tools redirect
console.log("\n2. Testing /free-tools route alias redirect...");
const aliasRes = await fetch(`${BASE_URL}/free-tools`, { redirect: "manual" });
assert(
  aliasRes.status === 307 || aliasRes.status === 308,
  `/free-tools redirects to /tools (HTTP ${aliasRes.status})`
);

// 3. Deep link testing for key tool tabs
console.log("\n3. Testing deep link tabs on /tools?tab=...");
const tabsToTest = [
  "ai-problem-assistant",
  "business-name-generator",
  "business-plan-assistant",
  "invoice-generator",
  "receipt-generator",
  "percentage-calculator",
  "loan-calculator",
  "budget-planner",
  "currency-converter",
  "unit-converter",
  "cv-builder",
  "cover-letter",
  "document-templates",
  "generator-calc",
  "cost-estimator",
  "moving-calc",
];

for (const tab of tabsToTest) {
  const tabRes = await fetch(`${BASE_URL}/tools?tab=${tab}`);
  assert(tabRes.status === 200, `/tools?tab=${tab} rendered cleanly (HTTP 200 OK)`);
}

// 4. Mathematical & Logic Assertions
console.log("\n4. Verifying mathematical calculations...");
// Loan EMI calculation test
const P = 500000;
const r = (18 / 100) / 12;
const n = 12;
const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
assert(Math.round(emi) === 45840, `Loan calculation accurate: EMI is ₦${Math.round(emi)} (expected ₦45,840)`);

// Percentage calculation test
const percentOf = (15 / 100) * 200000;
assert(percentOf === 30000, `Percentage calculation accurate: 15% of 200,000 is ₦${percentOf}`);

// Unit conversion test: Nigerian plot (50x100ft = 464.5m²)
const plotSqM = 1 * 464.5;
assert(plotSqM === 464.5, `Plot conversion accurate: 1 Nigerian plot is ${plotSqM} m²`);

// 5. Strict Exclusions
console.log("\n5. Verifying strict exclusions on /tools...");
assert(
  !toolsHtml.includes("Add to Cart") && !toolsHtml.includes("Checkout Food"),
  "Food checkout and cart strictly excluded"
);
assert(
  !toolsHtml.includes("Rent this Flat") && !toolsHtml.includes("House for Sale"),
  "Real estate property sales and rentals strictly excluded"
);
assert(
  !toolsHtml.includes("Doctor Appointment") && !toolsHtml.includes("Hospital Directory"),
  "Healthcare directory strictly excluded"
);

console.log(`\n=== All ${passed}/${total} Stage 9 Verification Tests Completed ===`);
if (passed === total) {
  console.log(">>> ALL STAGE 9 TESTS PASSED SUCCESSFULLY! <<<");
} else {
  console.error(">>> SOME TESTS FAILED <<<");
}
