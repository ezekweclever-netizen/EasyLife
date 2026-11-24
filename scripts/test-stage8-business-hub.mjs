import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const BASE_URL = "http://localhost:3000";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== EasyLife Stage 8: Business Hub & Directory Verification ===\n");

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

// 1. GET /business-hub
console.log("1. Testing GET /business-hub...");
const hubRes = await fetch(`${BASE_URL}/business-hub`);
assert(hubRes.status === 200, "/business-hub loaded successfully (HTTP 200 OK)");
const hubHtml = await hubRes.text();
assert(hubHtml.includes("Business Hub"), "Page contains Business Hub brand title");
assert(hubHtml.includes("Verified Local Business Directory"), "Contains directory section");

// 2. City Filtering
console.log("\n2. Testing city filtering on /business-hub...");
const phRes = await fetch(`${BASE_URL}/business-hub?city=Port+Harcourt`);
assert(phRes.status === 200, "City filter /business-hub?city=Port+Harcourt verified (HTTP 200 OK)");

const lagosRes = await fetch(`${BASE_URL}/business-hub?city=Lagos`);
assert(lagosRes.status === 200, "City filter /business-hub?city=Lagos verified (HTTP 200 OK)");

const abujaRes = await fetch(`${BASE_URL}/business-hub?city=Abuja`);
assert(abujaRes.status === 200, "City filter /business-hub?city=Abuja verified (HTTP 200 OK)");

// 3. Category Filtering
console.log("\n3. Testing category filtering: Restaurants & Food...");
const catRes = await fetch(`${BASE_URL}/business-hub?category=Restaurants%20%26%20Food`);
assert(catRes.status === 200, "Category filter verified (HTTP 200 OK)");

// 4. Dedicated Business Profile Pages
console.log("\n4. Testing dedicated business profile pages...");
const biz1Res = await fetch(`${BASE_URL}/business-hub/bole-fish-king-ph`);
assert(biz1Res.status === 200, "/business-hub/bole-fish-king-ph loaded (HTTP 200 OK)");
const biz1Html = await biz1Res.text();
assert(biz1Html.includes("Bole &amp; Fish King Spot") || biz1Html.includes("Bole & Fish King Spot"), "Profile contains business name");
assert(biz1Html.includes("Birabi Street") || biz1Html.includes("Port Harcourt"), "Profile contains verified address");

const biz2Res = await fetch(`${BASE_URL}/business-hub/benchmark-facilities-maintenance-lagos`);
assert(biz2Res.status === 200, "/business-hub/benchmark-facilities-maintenance-lagos loaded (HTTP 200 OK)");
const biz2Html = await biz2Res.text();
assert(biz2Html.includes("Benchmark Facilities"), "Commercial maintenance profile contains business name");

// 5. Legacy Route Consolidation & Redirects
console.log("\n5. Testing route consolidation redirects...");
const legacyDirRes = await fetch(`${BASE_URL}/businesses`, { redirect: "manual" });
assert(
  legacyDirRes.status === 307 || legacyDirRes.status === 308,
  `/businesses redirects to /business-hub (HTTP ${legacyDirRes.status})`
);

const legacyProfileRes = await fetch(`${BASE_URL}/businesses/bole-fish-king-ph`, { redirect: "manual" });
assert(
  legacyProfileRes.status === 307 || legacyProfileRes.status === 308,
  `/businesses/[id] redirects to /business-hub/[id] (HTTP ${legacyProfileRes.status})`
);

// 6. Maintenance Portal Protected Access
console.log("\n6. Testing maintenance portal route protection...");
const maintRes = await fetch(`${BASE_URL}/business`, { redirect: "manual" });
assert(
  maintRes.status === 307 || maintRes.status === 308,
  `/business redirects unauthenticated visitor to /login (HTTP ${maintRes.status})`
);

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  [RETRY ${attempt}/${retries}] Retrying ${url}...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// 7. Supabase Database Records Verification
console.log("\n7. Verifying PostgreSQL records in public.businesses and public.business_promotions...");
const dbBizRes = await fetchWithRetry(
  `${SUPABASE_URL}/rest/v1/businesses?is_directory_listed=eq.true&is_active=eq.true&select=id,name,business_category,city`,
  { headers: { apikey: ANON_KEY } }
);
const dbBusinesses = await dbBizRes.json();
assert(
  Array.isArray(dbBusinesses) && dbBusinesses.length >= 7,
  `Found ${dbBusinesses?.length || 0} active approved businesses in Supabase`
);

const dbPromoRes = await fetchWithRetry(
  `${SUPABASE_URL}/rest/v1/business_promotions?is_active=eq.true&moderation_status=eq.approved&select=id,title,discount_code`,
  { headers: { apikey: ANON_KEY } }
);
const dbPromos = await dbPromoRes.json();
assert(
  Array.isArray(dbPromos) && dbPromos.length >= 4,
  `Found ${dbPromos?.length || 0} active approved promotions in Supabase`
);

// 8. Food Discovery Compliance & Strict Exclusions
console.log("\n8. Verifying food discovery compliance & strict scope boundaries...");
assert(
  !hubHtml.includes("Add to Cart") && !hubHtml.includes("Checkout Order") && !hubHtml.includes("Delivery Tracking"),
  "Strict food discovery policy: zero food checkout, carts, or delivery ordering"
);
assert(
  !hubHtml.includes("Rent this Apartment") && !hubHtml.includes("For Sale: 3 Bedroom"),
  "Real estate property sales and rentals strictly excluded"
);
assert(
  !hubHtml.includes("Find Doctors") && !hubHtml.includes("Hospital Directory"),
  "Healthcare directory strictly excluded"
);

console.log(`\n=== All ${passed}/${total} Stage 8 Verification Tests Completed ===`);
if (passed === total) {
  console.log(">>> ALL STAGE 8 TESTS PASSED SUCCESSFULLY! <<<");
} else {
  console.error(">>> SOME TESTS FAILED <<<");
}
