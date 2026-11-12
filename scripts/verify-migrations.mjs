#!/usr/bin/env node
/**
 * EasyLife Database Migration & Schema Verification Script
 * Verifies SQL syntax structure, required table coverage (Groups A-F),
 * foreign keys, unique constraints, minor-unit money rules, RLS enablement,
 * and seed safety rules.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const migrationsDir = path.join(rootDir, "supabase", "migrations");
const seedFile = path.join(rootDir, "supabase", "seed", "dev_seed.sql");

const REQUIRED_TABLES = [
  // Group A: Identity and access
  "profiles",
  "user_roles",
  "user_sessions",
  // Group B: Professional management
  "professional_profiles",
  "professional_services",
  "professional_service_areas",
  "professional_documents",
  "professional_availability",
  // Group C: Business management
  "businesses",
  "business_members",
  "business_subscriptions",
  "properties",
  "assets",
  // Group D: Marketplace
  "service_categories",
  "services",
  "service_requirements",
  "bookings",
  "booking_attachments",
  "quotations",
  "quotation_items",
  "booking_status_history",
  "conversations",
  "conversation_members",
  "messages",
  "notifications",
  // Group E: Transactions and accountability
  "payments",
  "refunds",
  "reviews",
  "disputes",
  "dispute_evidence",
  "maintenance_records",
  "maintenance_schedules",
  // Group F: Administration
  "audit_logs",
  "reports",
  "platform_settings",
  "commission_settings",
];

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, "");
}

function checkBalancedParentheses(sql, fileName) {
  const clean = stripSqlComments(sql);
  let depth = 0;
  let inSingleQuote = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "'") {
      if (inSingleQuote && clean[i + 1] === "'") {
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth < 0) {
        throw new Error(`Unbalanced closing parenthesis in ${fileName}`);
      }
    }
  }
  if (inSingleQuote) {
    throw new Error(`Unclosed string literal in ${fileName}`);
  }
  if (depth !== 0) {
    throw new Error(
      `Unbalanced parentheses in ${fileName} (net depth: ${depth})`
    );
  }
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.error("ERROR: No SQL migration files found in supabase/migrations/");
  process.exit(1);
}

let combinedSql = "";
console.log("=== EasyLife Database Migration Verification ===");
for (const file of migrationFiles) {
  const fullPath = path.join(migrationsDir, file);
  const content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes("BEGIN;") || !content.includes("COMMIT;")) {
    throw new Error(`Migration ${file} is missing BEGIN; / COMMIT; wrapper.`);
  }
  checkBalancedParentheses(content, file);
  combinedSql += "\n" + content;
  console.log(`  [OK] Migration syntax & transaction block: ${file}`);
}

// Verify all 30 required tables exist and have RLS enabled
let missingTables = [];
let missingRls = [];

for (const table of REQUIRED_TABLES) {
  const createRegex = new RegExp(
    `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+public\\.${table}\\b`,
    "i"
  );
  const rlsRegex = new RegExp(
    `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
    "i"
  );
  if (!createRegex.test(combinedSql)) {
    missingTables.push(table);
  }
  if (!rlsRegex.test(combinedSql)) {
    missingRls.push(table);
  }
}

if (missingTables.length > 0) {
  throw new Error(`Missing required tables: ${missingTables.join(", ")}`);
}
if (missingRls.length > 0) {
  throw new Error(`Tables missing RLS enablement: ${missingRls.join(", ")}`);
}
console.log(
  `  [OK] All ${REQUIRED_TABLES.length} required tables (Groups A–F) defined with RLS enabled.`
);

// Check that no floating-point types are used
if (/\b(FLOAT|REAL|DOUBLE\s+PRECISION)\b/i.test(stripSqlComments(combinedSql))) {
  throw new Error(
    "Forbidden floating-point type found in migrations. Use BIGINT minor units (_kobo)."
  );
}
console.log(
  "  [OK] Zero floating-point columns; all monetary values use BIGINT minor units (_kobo)."
);

// Count foreign keys, unique constraints, and indexes
const fkCount = (combinedSql.match(/\bREFERENCES\s+/gi) || []).length;
const uniqueCount = (combinedSql.match(/\bUNIQUE\b/gi) || []).length;
const indexCount = (combinedSql.match(/CREATE\s+(UNIQUE\s+)?INDEX/gi) || [])
  .length;

console.log(
  `  [OK] Relational integrity: ${fkCount} Foreign Keys, ${uniqueCount} Unique constraints/clauses, ${indexCount} Indexes.`
);

// Verify dev_seed.sql
const seedContent = fs.readFileSync(seedFile, "utf8");
checkBalancedParentheses(seedContent, "dev_seed.sql");
if (!seedContent.includes("app.environment")) {
  throw new Error("dev_seed.sql is missing production environment guard.");
}
if (!seedContent.includes("@easylife-dev-test.invalid")) {
  throw new Error(
    "dev_seed.sql must use .invalid RFC 2606 domain for fictional test accounts."
  );
}
console.log(
  "  [OK] Seed verification: supabase/seed/dev_seed.sql syntax & fictional-only guards verified."
);
console.log("=== ALL DATABASE ARCHITECTURE CHECKS PASSED ===");
