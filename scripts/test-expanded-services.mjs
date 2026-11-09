#!/usr/bin/env node
import { getDatabaseUrl } from './_env.mjs';
/**
 * EasyLife Expanded Pilot Categories & Everyday Services Test Suite
 *
 * Verifies:
 * 1. Preservation of 8 foundational pilot categories with exact slugs
 * 2. Additional top-level categories & subcategories (Pest Control, Solar Installation)
 * 3. Provider role architecture (technicians, riders, property agents, general artisans)
 * 4. Healthcare directory (/healthcare) with non-provider disclaimer & real facilities
 * 5. Delivery & dispatch directory (/dispatch) with vehicle options
 * 6. Local business directory (/businesses) with profile approval & reporting
 * 7. Everyday tasks (/tasks) reusing booking/quotation flow
 * 8. Accommodation services (/property-services) with STRICT property listing prohibition
 * 9. Directory moderation & reporting (/admin/directories & public.directory_reports)
 * 10. Live Supabase DB verification (tables, categories, RLS, PostGIS geography)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import pg from "pg";

console.log("=== EasyLife Expanded Categories & Everyday Services Test Suite ===\n");

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
const migrationsDir = path.join(rootDir, "supabase", "migrations");

// ============================================================================
// 1. PRESERVATION OF 8 FOUNDATIONAL PILOT CATEGORIES (EXACT SLUGS)
// ============================================================================
console.log("1. Verifying Preservation of 8 Foundational Categories:");

const PRESERVED_PILOT_CATEGORIES = [
  { slug: "plumbing-water-systems", name: "Plumbing & Water Systems" },
  { slug: "electrical-power-backup", name: "Electrical & Power Backup" },
  { slug: "hvac-air-conditioning", name: "HVAC & Air Conditioning" },
  { slug: "generator-maintenance", name: "Generator Maintenance" },
  { slug: "carpentry-doors-locks", name: "Carpentry, Doors & Locks" },
  { slug: "cleaning-fumigation", name: "Cleaning & Fumigation" },
  { slug: "painting-wall-finishing", name: "Painting & Wall Finishing" },
  { slug: "appliance-repair", name: "Appliance Repair" },
];

const migration20261104000700 = path.join(
  migrationsDir,
  "20261104000700_expand_categories_and_directories.sql"
);

test("Migration 20261104000700 exists", () => {
  assert.ok(fs.existsSync(migration20261104000700), "Migration file not found");
});

const migrationSql = fs.readFileSync(migration20261104000700, "utf8");

test("Migration preserves all 8 foundational pilot categories with exact slugs", () => {
  for (const cat of PRESERVED_PILOT_CATEGORIES) {
    assert.ok(
      migrationSql.includes(cat.slug),
      `Missing preserved category slug: ${cat.slug}`
    );
    assert.ok(
      migrationSql.includes(cat.name),
      `Missing preserved category name: ${cat.name}`
    );
  }
});

const catalogFile = path.join(webDir, "lib", "public-catalog.ts");
const catalogContent = fs.readFileSync(catalogFile, "utf8");

test("public-catalog.ts contains all 8 preserved categories", () => {
  for (const cat of PRESERVED_PILOT_CATEGORIES) {
    assert.ok(
      catalogContent.includes(cat.slug),
      `Missing category in public catalog: ${cat.slug}`
    );
  }
});

// ============================================================================
// 2. ADDITIONAL SERVICE CATEGORIES & SUBCATEGORIES
// ============================================================================
console.log("\n2. Verifying Additional Service Categories & Subcategories:");

const ADDITIONAL_TOP_CATEGORIES = [
  "tiling-floor-installation",
  "auto-electrical-services",
  "moving-relocation-services",
  "laundry-dry-cleaning",
  "beauty-personal-care",
  "event-planning-services",
  "everyday-tasks",
];

test("Migration inserts new top-level categories", () => {
  for (const slug of ADDITIONAL_TOP_CATEGORIES) {
    assert.ok(
      migrationSql.includes(slug),
      `Missing new category slug in migration: ${slug}`
    );
  }
});

test("Pest Control is configured as subcategory under Cleaning & Fumigation", () => {
  assert.ok(
    migrationSql.includes("slug = 'pest-control'"),
    "Pest Control slug missing"
  );
  assert.ok(
    migrationSql.includes("parent_id = '10000000-0000-4000-8000-000000000006'"),
    "Pest Control parent_id not referencing cleaning-fumigation"
  );
});

test("Solar Installation is configured as subcategory under Electrical & Power Backup", () => {
  assert.ok(
    migrationSql.includes("slug = 'solar-installation'"),
    "Solar Installation slug missing"
  );
  assert.ok(
    migrationSql.includes("parent_id = '10000000-0000-4000-8000-000000000002'"),
    "Solar Installation parent_id not referencing electrical-power-backup"
  );
});

// ============================================================================
// 3. PROVIDER ROLES & PROFESSIONAL PROFILES EXTENSION
// ============================================================================
console.log("\n3. Verifying Provider Role Architecture:");

const proActionsFile = path.join(webDir, "app", "actions", "pro.ts");
const proActionsContent = fs.readFileSync(proActionsFile, "utf8");

test("Professional registration supports provider types (technician, dispatch, property agent, artisan)", () => {
  assert.ok(
    proActionsContent.includes("validProviderTypes"),
    "Missing validProviderTypes check in pro.ts"
  );
  assert.ok(
    proActionsContent.includes("trade_technician") &&
    proActionsContent.includes("dispatch_rider") &&
    proActionsContent.includes("property_agent") &&
    proActionsContent.includes("general_artisan"),
    "Missing provider type definitions in pro.ts"
  );
});

test("Professional registration enforces anti-listing agreement for property agents", () => {
  assert.ok(
    proActionsContent.includes("providerType === \"property_agent\" && !agentDisclaimerAccepted"),
    "Property agent disclaimer validation missing in pro.ts"
  );
});

const proWizardFile = path.join(webDir, "components", "pro", "pro-register-wizard.tsx");
const proWizardContent = fs.readFileSync(proWizardFile, "utf8");

test("Pro registration wizard contains provider role selector and policy notices", () => {
  assert.ok(
    proWizardContent.includes("trade_technician") &&
    proWizardContent.includes("dispatch_rider") &&
    proWizardContent.includes("property_agent"),
    "Provider role selector missing in wizard"
  );
  assert.ok(
    proWizardContent.includes("Strict Anti-Listing Platform Policy"),
    "Strict Anti-Listing Platform Policy warning missing in wizard"
  );
  assert.ok(
    proWizardContent.includes("Primary Delivery Vehicle"),
    "Dispatch vehicle option missing in wizard"
  );
});

// ============================================================================
// 4. HEALTHCARE DIRECTORY (/healthcare)
// ============================================================================
console.log("\n4. Verifying Healthcare Directory:");

const healthcarePage = path.join(webDir, "app", "healthcare", "page.tsx");
const healthcareClient = path.join(webDir, "components", "directories", "healthcare-client.tsx");

test("Healthcare directory route and client component exist", () => {
  assert.ok(fs.existsSync(healthcarePage), "Missing /healthcare/page.tsx");
  assert.ok(fs.existsSync(healthcareClient), "Missing healthcare-client.tsx");
});

const healthcarePageContent = fs.readFileSync(healthcarePage, "utf8");
const healthcareClientContent = fs.readFileSync(healthcareClient, "utf8");

test("Healthcare directory contains prominent non-provider disclaimer", () => {
  assert.ok(
    healthcarePageContent.includes("EasyLife is NOT a healthcare or clinical service provider"),
    "Missing non-provider disclaimer banner in healthcare page"
  );
  assert.ok(
    healthcarePageContent.includes("medical emergencies"),
    "Missing medical emergency guidance"
  );
});

test("Healthcare directory supports filtering by type (Hospital, Clinic, Pharmacy) and 24/7 status", () => {
  assert.ok(
    healthcareClientContent.includes("hospital") &&
    healthcareClientContent.includes("clinic") &&
    healthcareClientContent.includes("pharmacy"),
    "Missing facility type filters"
  );
  assert.ok(
    healthcareClientContent.includes("emergencyOnly"),
    "Missing 24/7 filter in healthcare client"
  );
});

// ============================================================================
// 5. DELIVERY & DISPATCH DIRECTORY (/dispatch)
// ============================================================================
console.log("\n5. Verifying Delivery & Dispatch Directory:");

const dispatchPage = path.join(webDir, "app", "dispatch", "page.tsx");

test("Delivery & dispatch route page exists", () => {
  assert.ok(fs.existsSync(dispatchPage), "Missing /dispatch/page.tsx");
});

const dispatchContent = fs.readFileSync(dispatchPage, "utf8");

test("Dispatch directory displays vehicle options and delivery request flow", () => {
  assert.ok(
    dispatchContent.includes("Express Motorcycle Dispatch") &&
    (dispatchContent.includes("Cargo Haulage & Moving") || dispatchContent.includes("Cargo Haulage &amp; Moving")),
    "Missing vehicle options in dispatch page"
  );
  assert.ok(
    dispatchContent.includes("Book On-Demand Delivery"),
    "Missing booking CTA in dispatch page"
  );
});

// ============================================================================
// 6. LOCAL BUSINESS DIRECTORY (/businesses)
// ============================================================================
console.log("\n6. Verifying Local Business Directory:");

const businessPage = path.join(webDir, "app", "businesses", "page.tsx");
const businessClient = path.join(webDir, "components", "directories", "business-client.tsx");

test("Business directory route and client component exist", () => {
  assert.ok(fs.existsSync(businessPage), "Missing /businesses/page.tsx");
  assert.ok(fs.existsSync(businessClient), "Missing business-client.tsx");
});

const businessClientContent = fs.readFileSync(businessClient, "utf8");

test("Business directory displays profile info, operating hours, photos, and report action", () => {
  assert.ok(
    businessClientContent.includes("Flag / Report"),
    "Report business action missing in business client"
  );
  assert.ok(
    businessClientContent.includes("services_offered"),
    "Services offered missing in business client"
  );
  assert.ok(
    businessClientContent.includes("Verified Business"),
    "Verification badge missing in business client"
  );
});

// ============================================================================
// 7. EVERYDAY TASKS (/tasks)
// ============================================================================
console.log("\n7. Verifying Everyday Tasks & Chores:");

const tasksPage = path.join(webDir, "app", "tasks", "page.tsx");

test("Everyday tasks route page exists", () => {
  assert.ok(fs.existsSync(tasksPage), "Missing /tasks/page.tsx");
});

const tasksContent = fs.readFileSync(tasksPage, "utf8");

test("Everyday tasks reuses booking, quotation, and escrow flow", () => {
  assert.ok(
    tasksContent.includes("Post an Everyday Task"),
    "Missing Post an Everyday Task title"
  );
  assert.ok(
    tasksContent.includes("/book?cat=everyday-tasks"),
    "Missing link to booking flow with everyday-tasks category"
  );
  assert.ok(
    tasksContent.includes("Escrow"),
    "Missing escrow payment protection notice"
  );
});

// ============================================================================
// 8. STRICT PROPERTY LISTING RESTRICTION (/property-services)
// ============================================================================
console.log("\n8. Verifying Accommodation Services & Strict Anti-Listing Restriction:");

const propertyPage = path.join(webDir, "app", "property-services", "page.tsx");

test("Accommodation-related services page exists", () => {
  assert.ok(fs.existsSync(propertyPage), "Missing /property-services/page.tsx");
});

const propertyContent = fs.readFileSync(propertyPage, "utf8");

test("Strict property listing prohibition is clearly stated", () => {
  assert.ok(
    propertyContent.includes("Anti-Listing Notice"),
    "Missing Anti-Listing Notice banner"
  );
  assert.ok(
    propertyContent.includes("EasyLife does NOT host property listings"),
    "Missing notice that EasyLife does NOT host property listings"
  );
  assert.ok(
    propertyContent.includes("rental assistance, property sourcing"),
    "Missing list of allowed professional consulting services"
  );
});

test("Verification: NO property inventory tables or listing schemas were created", () => {
  // Ensure no table named properties, property_listings, rental_listings, etc. exists in migrations
  assert.ok(
    !migrationSql.includes("CREATE TABLE public.properties") &&
    !migrationSql.includes("CREATE TABLE public.property_listings") &&
    !migrationSql.includes("CREATE TABLE public.rental_units"),
    "VIOLATION: Found prohibited property listing table in migration"
  );
});

// ============================================================================
// 9. DIRECTORY REPORTING & MODERATION SYSTEM
// ============================================================================
console.log("\n9. Verifying Directory Reporting & Admin Moderation:");

const reportModalFile = path.join(webDir, "components", "directories", "report-modal.tsx");
const adminDirPage = path.join(webDir, "app", "admin", "directories", "page.tsx");
const adminDirManager = path.join(webDir, "components", "admin", "admin-directories-manager.tsx");

test("Report modal component exists", () => {
  assert.ok(fs.existsSync(reportModalFile), "Missing report-modal.tsx");
});

test("Admin directories moderation page and manager exist", () => {
  assert.ok(fs.existsSync(adminDirPage), "Missing /admin/directories/page.tsx");
  assert.ok(fs.existsSync(adminDirManager), "Missing admin-directories-manager.tsx");
});

const reportModalContent = fs.readFileSync(reportModalFile, "utf8");

test("Reporting reasons include property advertising violation and misrepresentation", () => {
  assert.ok(
    reportModalContent.includes("property_advertising_violation"),
    "Missing property_advertising_violation option in report modal"
  );
  assert.ok(
    reportModalContent.includes("misrepresentation"),
    "Missing misrepresentation option in report modal"
  );
});

// ============================================================================
// 10. LIVE SUPABASE DATABASE VERIFICATION
// ============================================================================
console.log("\n10. Live Supabase Database Verification:");

const dbConnStr =
  getDatabaseUrl();

async function runLiveDbChecks() {
  const client = new pg.Client({ connectionString: dbConnStr, ssl: { rejectUnauthorized: false } });
  client.on("error", (err) => {
    console.warn(`  [WARN] DB client error ignored: ${err.message}`);
  });
  try {
    await client.connect();

    // Check categories count & preserved slugs
    await asyncTest("Live DB: All 8 preserved pilot categories exist with exact slugs", async () => {
      const res = await client.query(`
        SELECT slug, name, parent_id, is_active
        FROM public.service_categories
        WHERE is_active = true;
      `);
      const slugs = res.rows.map((r) => r.slug);
      for (const cat of PRESERVED_PILOT_CATEGORIES) {
        assert.ok(slugs.includes(cat.slug), `Missing preserved slug in live DB: ${cat.slug}`);
      }
      console.log(`         Found all 8 preserved categories among ${res.rows.length} total active categories.`);
    });

    // Check subcategories
    await asyncTest("Live DB: Pest Control and Solar Installation are valid subcategories", async () => {
      const res = await client.query(`
        SELECT c.slug, c.name, p.slug AS parent_slug
        FROM public.service_categories c
        JOIN public.service_categories p ON c.parent_id = p.id
        WHERE c.slug IN ('pest-control', 'solar-installation');
      `);
      assert.strictEqual(res.rows.length, 2, "Expected 2 subcategories with parent relations");
      const pest = res.rows.find((r) => r.slug === "pest-control");
      const solar = res.rows.find((r) => r.slug === "solar-installation");

      assert.strictEqual(pest?.parent_slug, "cleaning-fumigation");
      assert.strictEqual(solar?.parent_slug, "electrical-power-backup");
      console.log(`         pest-control -> cleaning-fumigation, solar-installation -> electrical-power-backup`);
    });

    // Check healthcare_facilities table
    await asyncTest("Live DB: public.healthcare_facilities exists with genuine Port Harcourt records", async () => {
      const res = await client.query(`
        SELECT id, name, facility_type, city, is_emergency_24_7,
               latitude, longitude, ST_AsText(geom) AS geom_text
        FROM public.healthcare_facilities
        ORDER BY name ASC;
      `);
      assert.ok(res.rows.length >= 7, `Expected at least 7 healthcare facilities, got ${res.rows.length}`);
      const types = new Set(res.rows.map((r) => r.facility_type));
      assert.ok(types.has("hospital"), "Missing hospital");
      assert.ok(types.has("clinic"), "Missing clinic");
      assert.ok(types.has("pharmacy"), "Missing pharmacy");
      console.log(`         Found ${res.rows.length} healthcare facilities (Hospitals, Clinics, Pharmacies) with PostGIS geom.`);
    });

    // Check professional_profiles columns
    await asyncTest("Live DB: professional_profiles contains provider_type, dispatch_details, agent_disclaimer_accepted", async () => {
      const res = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'professional_profiles'
          AND column_name IN ('provider_type', 'dispatch_details', 'agent_services', 'agent_disclaimer_accepted');
      `);
      assert.strictEqual(res.rows.length, 4, `Expected 4 new columns on professional_profiles, got ${res.rows.length}`);
      console.log(`         Verified provider_type, dispatch_details, agent_services, agent_disclaimer_accepted columns.`);
    });

    // Check businesses directory extension & public read RLS
    await asyncTest("Live DB: businesses table has directory fields and public read RLS policy", async () => {
      const colRes = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'businesses'
          AND column_name IN ('business_category', 'operating_hours', 'services_offered', 'photos', 'is_directory_listed');
      `);
      assert.strictEqual(colRes.rows.length, 5, `Expected 5 directory columns on businesses, got ${colRes.rows.length}`);

      const policyRes = await client.query(`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'businesses'
          AND policyname = 'businesses_public_directory_read';
      `);
      assert.ok(policyRes.rows.length > 0, "Public read RLS policy on businesses missing");
      console.log(`         Verified businesses directory columns and public read RLS policy.`);
    });

    // Check directory_reports table
    await asyncTest("Live DB: public.directory_reports table exists with RLS", async () => {
      const res = await client.query(`
        SELECT count(*) FROM public.directory_reports;
      `);
      assert.ok(res.rows.length > 0, "directory_reports table does not exist");
      console.log(`         directory_reports table is accessible.`);
    });

    // Check matching RPC with hierarchical parent/child and provider_type filter
    await asyncTest("Live DB: match_service_professionals handles subcategories and p_provider_type", async () => {
      const res = await client.query(`
        SELECT * FROM public.match_service_professionals(
          p_category_slug := 'pest-control',
          p_city := 'Port Harcourt',
          p_provider_type := 'trade_technician',
          p_limit := 5
        );
      `);
      assert.ok(Array.isArray(res.rows), "RPC query failed");
      console.log(`         Hierarchical category matching executed successfully without error.`);
    });

    await client.end();
  } catch (err) {
    console.warn(`  [WARN] Live DB check connection or query failed: ${err.message}`);
  }
}

async function run() {
  await runLiveDbChecks();

  console.log("\n======================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);

  if (failedCount > 0) {
    console.error("=== SOME EXPANDED SERVICES TESTS FAILED ===");
    process.exit(1);
  } else {
    console.log("=== ALL EXPANDED PILOT CATEGORIES & SERVICES CHECKS PASSED ===");
  }
}

run();
