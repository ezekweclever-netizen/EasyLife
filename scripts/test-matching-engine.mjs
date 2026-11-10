#!/usr/bin/env node
import { getDatabaseUrl, connectClientWithRetry } from './_env.mjs';
/**
 * EasyLife Prompt 10 — Service Discovery & Location-Based Matching Test Suite
 *
 * Verifies:
 * 1. Initial 10 service categories requirement
 * 2. Administrative category management (add, edit, disable, reorder, descriptions, icons)
 * 3. Search and multi-factor filtering (keyword, category, location, distance, availability, rating, verification)
 * 4. Location and geospatial architecture (State, City, LGA, Neighbourhood, Coordinates, Radius, PostGIS)
 * 5. Matching logic priority ordering and constraints
 * 6. Live Supabase DB verification (PostGIS, categories, neighbourhoods, matching RPC)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import pg from "pg";

console.log("=== EasyLife Prompt 10 — Service Discovery & Matching Engine Test Suite ===\n");

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

// 1. Initial 10 Service Categories Verification
console.log("1. Verifying Prompt 10 Initial Service Categories:");
const EXPECTED_CATEGORIES = [
  { slug: "plumbing", name: "Plumbing" },
  { slug: "electrical-services", name: "Electrical services" },
  { slug: "air-conditioning-and-refrigeration", name: "Air conditioning and refrigeration" },
  { slug: "generator-and-inverter-repairs", name: "Generator and inverter repairs" },
  { slug: "cleaning-services", name: "Cleaning services" },
  { slug: "painting", name: "Painting" },
  { slug: "carpentry", name: "Carpentry" },
  { slug: "pest-control", name: "Pest control" },
  { slug: "general-home-maintenance", name: "General home maintenance" },
  { slug: "solar-installation-and-maintenance", name: "Solar installation and maintenance" }
];

const migrationFile = path.join(migrationsDir, "20261104000600_service_discovery_and_location_matching.sql");
test("Migration 20261104000600 exists", () => {
  assert.ok(fs.existsSync(migrationFile), "Migration file 20261104000600 not found");
});

const migrationSql = fs.readFileSync(migrationFile, "utf8");

test("Migration seeds all 10 Prompt 10 categories", () => {
  for (const cat of EXPECTED_CATEGORIES) {
    assert.ok(
      migrationSql.includes(cat.slug),
      `Missing category slug in migration: ${cat.slug}`
    );
    assert.ok(
      migrationSql.includes(cat.name),
      `Missing category name in migration: ${cat.name}`
    );
  }
});

// 2. Administrative Category Requirements
console.log("\n2. Verifying Administrative Requirements:");
const adminCategoryPage = path.join(webDir, "app", "admin", "categories", "page.tsx");
const adminCategoryManager = path.join(webDir, "components", "admin", "admin-category-manager.tsx");
const adminCategoryActions = path.join(webDir, "app", "actions", "admin-categories.ts");

test("Admin categories route page exists (/admin/categories)", () => {
  assert.ok(fs.existsSync(adminCategoryPage), "Missing /admin/categories/page.tsx");
});

test("Admin categories manager component exists", () => {
  assert.ok(fs.existsSync(adminCategoryManager), "Missing admin-category-manager.tsx");
});

test("Admin categories server actions exist", () => {
  assert.ok(fs.existsSync(adminCategoryActions), "Missing admin-categories.ts");
});

const actionsContent = fs.readFileSync(adminCategoryActions, "utf8");
test("Admin actions support: Add, Edit, Disable/Enable, Reorder categories", () => {
  assert.ok(actionsContent.includes("createCategoryAction"), "Missing createCategoryAction (Add)");
  assert.ok(actionsContent.includes("updateCategoryAction"), "Missing updateCategoryAction (Edit)");
  assert.ok(actionsContent.includes("toggleCategoryActiveAction"), "Missing toggleCategoryActiveAction (Disable/Enable)");
  assert.ok(actionsContent.includes("reorderCategoriesAction"), "Missing reorderCategoriesAction (Reorganise)");
});

const managerContent = fs.readFileSync(adminCategoryManager, "utf8");
test("Admin UI supports descriptions and icon assignment", () => {
  assert.ok(managerContent.includes("icon_name"), "Missing category icon assignment in UI");
  assert.ok(managerContent.includes("description"), "Missing category description management in UI");
  assert.ok(managerContent.includes("display_order"), "Missing display order reorganization in UI");
});

// 3. Search and Multi-filter Functionality
console.log("\n3. Verifying Search Functionality & Filtering:");
const discoveryClient = path.join(webDir, "components", "discovery", "service-discovery-client.tsx");
test("Service discovery client component exists", () => {
  assert.ok(fs.existsSync(discoveryClient), "Missing service-discovery-client.tsx");
});

const discoveryContent = fs.readFileSync(discoveryClient, "utf8");
test("Implements Keyword search", () => {
  assert.ok(discoveryContent.includes("keyword") && discoveryContent.includes("q"), "Missing keyword search filter");
});

test("Implements Category filtering", () => {
  assert.ok(discoveryContent.includes("categorySlug") && discoveryContent.includes("cat"), "Missing category filter");
});

test("Implements Location filtering (City & Neighbourhood)", () => {
  assert.ok(discoveryContent.includes("city") && discoveryContent.includes("selectedNeighbourhood"), "Missing location filters");
});

test("Implements Distance filtering", () => {
  assert.ok(discoveryContent.includes("maxDistanceKm") && discoveryContent.includes("distance"), "Missing distance radius filter");
});

test("Implements Availability filtering", () => {
  assert.ok(discoveryContent.includes("availableOnly") && discoveryContent.includes("targetDate"), "Missing availability and calendar filters");
});

test("Implements Rating filtering", () => {
  assert.ok(discoveryContent.includes("minRating") && discoveryContent.includes("rating"), "Missing rating filter");
});

test("Implements Verification filtering", () => {
  assert.ok(discoveryContent.includes("verifiedOnly") && discoveryContent.includes("verified"), "Missing verification filter");
});

// 4. Location & Geospatial Architecture
console.log("\n4. Verifying Location Architecture & PostGIS Support:");
test("Migration activates postgis extension", () => {
  assert.ok(
    migrationSql.includes("CREATE EXTENSION IF NOT EXISTS postgis"),
    "PostGIS extension activation not found in migration"
  );
});

const allMigrationsSql = fs.readdirSync(migrationsDir)
  .map(f => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
  .join("\n");

test("Database schema supports State, City, LGA, Neighbourhood, Coordinates and Radius", () => {
  assert.ok(migrationSql.includes("operating_neighbourhoods"), "Missing operating_neighbourhoods table");
  assert.ok(migrationSql.includes("state text NOT NULL"), "Missing state column");
  assert.ok(migrationSql.includes("city text NOT NULL"), "Missing city column");
  assert.ok(migrationSql.includes("lga text NOT NULL"), "Missing lga column");
  assert.ok(migrationSql.includes("neighbourhood text"), "Missing neighbourhood column");
  assert.ok(migrationSql.includes("latitude"), "Missing latitude coordinate");
  assert.ok(migrationSql.includes("longitude"), "Missing longitude coordinate");
  assert.ok(allMigrationsSql.includes("service_radius_km"), "Missing service radius column");
  assert.ok(migrationSql.includes("geography(Point, 4326)"), "Missing PostGIS geography column");
});

test("Port Harcourt neighbourhoods seeded (Woji, Old GRA, New GRA, Peter Odili, Choba, etc.)", () => {
  const phKeyAreas = [
    "Woji",
    "Old GRA",
    "New GRA",
    "Peter Odili / Trans-Amadi",
    "D-Line",
    "Diobu",
    "Rumuola",
    "Rumuokoro",
    "Choba",
    "Aleto & Indorama Axis",
    "Onne Free Zone",
    "Omagwa (Airport Area)",
    "Igwuruta",
    "Oyigbo Town"
  ];
  for (const area of phKeyAreas) {
    assert.ok(
      migrationSql.includes(area),
      `Missing Port Harcourt operating neighbourhood: ${area}`
    );
  }
});

// 5. Matching Logic Priority & Constraints
console.log("\n5. Verifying Matching Logic Priorities & Constraints:");
test("Matching RPC enforces priority 1: Service Category (35%)", () => {
  assert.ok(
    migrationSql.includes("mp.cat_score * 0.35"),
    "Missing category priority weighting of 35%"
  );
});

test("Matching RPC enforces priority 2: Service-area coverage & distance (25%)", () => {
  assert.ok(
    migrationSql.includes("ST_Distance") && migrationSql.includes("* 0.25"),
    "Missing geographic proximity weighting of 25%"
  );
});

test("Matching RPC enforces priority 3: Availability (15%) with strict schedule proof", () => {
  assert.ok(
    migrationSql.includes("mp.sched_avail AND mp.pro_is_avail THEN 100.0 ELSE 0.0 END * 0.15"),
    "Availability must strictly check profile is_available and calendar schedule (15%)"
  );
});

test("Constraint check: Pro is NOT represented as available unless availability info supports it", () => {
  assert.ok(
    migrationSql.includes("(NOT p_available_only OR (mp.pro_is_avail = true AND mp.sched_avail = true))"),
    "Pro cannot claim availability without supporting schedule data"
  );
});

test("Matching RPC enforces priority 4: Relevant experience (5%)", () => {
  assert.ok(
    migrationSql.includes("mp.pro_exp") && migrationSql.includes("* 0.05"),
    "Missing experience weighting of 5%"
  );
});

test("Matching RPC enforces priority 5: Customer rating (15%)", () => {
  assert.ok(
    migrationSql.includes("mp.pro_rating") && migrationSql.includes("* 0.15"),
    "Missing customer rating weighting of 15%"
  );
});

test("Matching RPC enforces priority 6: Verification status (5%) without automatically implying competence", () => {
  assert.ok(
    migrationSql.includes("mp.pro_is_verified THEN 100.0 ELSE 20.0 END * 0.05"),
    "Verification status contributes only small trust boost (5%), does not dominate over rating or experience"
  );
});

// 6. Live Database Verification
console.log("\n6. Live Supabase PostgreSQL & PostGIS Verification:");

const dbConnStr = getDatabaseUrl();

async function runLiveDbChecks() {
  const client = await connectClientWithRetry(pg.Client, dbConnStr);
  try {

    await asyncTest("Live DB: PostGIS extension is installed and active", async () => {
      const res = await client.query("SELECT postgis_version();");
      assert.ok(res.rows.length > 0, "PostGIS extension not active");
      console.log(`         PostGIS version: ${res.rows[0].postgis_version}`);
    });

    await asyncTest("Live DB: Core service categories are active and properly ordered", async () => {
      const res = await client.query(`
        SELECT slug, name, display_order, is_active
        FROM public.service_categories
        WHERE is_active = true
        ORDER BY display_order ASC;
      `);
      assert.ok(res.rows.length >= 10, `Expected at least 10 active categories, got ${res.rows.length}`);
      console.log(`         Active categories in database: ${res.rows.length}`);
    });

    await asyncTest("Live DB: Port Harcourt operating neighbourhoods reference table is populated", async () => {
      const res = await client.query(`
        SELECT count(*) AS total, count(DISTINCT lga) AS lgas
        FROM public.operating_neighbourhoods
        WHERE city = 'Port Harcourt';
      `);
      const total = parseInt(res.rows[0].total, 10);
      assert.ok(total >= 10, `Expected at least 10 Port Harcourt neighbourhoods, got ${total}`);
      console.log(`         Found ${total} Port Harcourt neighbourhoods across LGAs`);
    });

    await asyncTest("Live DB: PostGIS calculates accurate distance between Port Harcourt localities", async () => {
      // Woji: (7.0583, 4.8188) to Old GRA: (7.0019, 4.8080)
      const res = await client.query(`
        SELECT round(
          (ST_Distance(
            ST_SetSRID(ST_MakePoint(7.0583, 4.8188), 4326)::geography,
            ST_SetSRID(ST_MakePoint(7.0019, 4.8080), 4326)::geography
          ) / 1000)::numeric, 1
        ) AS dist_km;
      `);
      const dist = parseFloat(res.rows[0].dist_km);
      assert.ok(dist >= 6.0 && dist <= 7.0, `Expected ~6.4km between Woji and Old GRA, got ${dist}km`);
      console.log(`         Woji to Old GRA calculated distance: ${dist} km`);
    });

    await asyncTest("Live DB: RPC public.match_service_professionals executes successfully", async () => {
      const res = await client.query(`
        SELECT * FROM public.match_service_professionals(
          p_city := 'Port Harcourt',
          p_limit := 5
        );
      `);
      assert.ok(Array.isArray(res.rows), "RPC did not return array");
      console.log(`         RPC returned ${res.rows.length} matched professionals for Port Harcourt`);
    });

    await client.end();
  } catch (err) {
    try { await client.end(); } catch {}
    failedCount++;
    console.error(`  [FAIL] Live DB check connection or query failed: ${err.message}`);
  }
}

async function run() {
  await runLiveDbChecks();

  console.log("\n======================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);

  if (failedCount > 0) {
    console.error("=== SOME PROMPT 10 TESTS FAILED ===");
    process.exit(1);
  } else {
    console.log("=== ALL PROMPT 10 SERVICE DISCOVERY & MATCHING CHECKS PASSED ===");
  }
}

run();
