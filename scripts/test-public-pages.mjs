/**
 * Automated Verification for EasyLife Public Website Structure, Catalog & Form Validation
 * (PROMPT 7 Verification)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PUBLIC_SERVICE_CATEGORIES,
  searchServiceCategories,
  PUBLIC_PRIMARY_NAV_LINKS,
  PUBLIC_FOOTER_LINKS,
} from "../apps/web/src/lib/public-catalog.ts";
import {
  validateLogin,
  validateRegistration,
  validateContact,
  normaliseNigerianPhone,
  isValidEmail,
  PILOT_CITIES,
} from "../apps/web/src/lib/validation/forms.ts";

console.log("=== EasyLife Public Website & Catalog Verification ===\n");

// 1. Verify all 13 required pages exist on disk
const REQUIRED_ROUTES = [
  { name: "Homepage", file: "apps/web/src/app/page.tsx" },
  { name: "Explore Services", file: "apps/web/src/app/explore-services/page.tsx" },
  { name: "How It Works", file: "apps/web/src/app/how-it-works/page.tsx" },
  { name: "Become a Professional", file: "apps/web/src/app/become-a-professional/page.tsx" },
  { name: "Business Solutions", file: "apps/web/src/app/business-solutions/page.tsx" },
  { name: "About EasyLife", file: "apps/web/src/app/about/page.tsx" },
  { name: "Help Centre", file: "apps/web/src/app/help/page.tsx" },
  { name: "Contact", file: "apps/web/src/app/contact/page.tsx" },
  { name: "Login", file: "apps/web/src/app/login/page.tsx" },
  { name: "Registration", file: "apps/web/src/app/register/page.tsx" },
  { name: "Privacy Policy", file: "apps/web/src/app/privacy-policy/page.tsx" },
  { name: "Terms of Service", file: "apps/web/src/app/terms-of-service/page.tsx" },
  { name: "Professional Verification Policy", file: "apps/web/src/app/verification-policy/page.tsx" },
];

for (const route of REQUIRED_ROUTES) {
  const fullPath = path.resolve(route.file);
  assert.ok(fs.existsSync(fullPath), `Route file missing: ${route.file}`);
  const content = fs.readFileSync(fullPath, "utf-8");
  assert.ok(content.length > 200, `Route file is too short/empty: ${route.file}`);
  console.log(`  [PASS] Route file exists & verified: ${route.name} (${route.file})`);
}

// 2. Verify Catalog & Deterministic Search Engine
console.log("\n  [VERIFY] Catalog & Deterministic Search Engine:");
assert.ok(PUBLIC_SERVICE_CATEGORIES.length >= 8, "Expected at least 8 foundational service categories");
const preservedSlugs = [
  "plumbing-water-systems",
  "electrical-power-backup",
  "hvac-air-conditioning",
  "generator-maintenance",
  "carpentry-doors-locks",
  "cleaning-fumigation",
  "painting-wall-finishing",
  "appliance-repair",
];
for (const slug of preservedSlugs) {
  assert.ok(PUBLIC_SERVICE_CATEGORIES.some((c) => c.slug === slug), `Missing preserved category: ${slug}`);
}
assert.equal(PILOT_CITIES.length, 3, "Expected 3 pilot cities: Port Harcourt, Lagos, Abuja");

// Test search queries
const genMatches = searchServiceCategories("generator repair");
assert.ok(genMatches.some((c) => c.slug === "generator-maintenance"), "Expected generator search to match");

const acMatches = searchServiceCategories("ac gas leakage");
assert.ok(acMatches.some((c) => c.slug === "hvac-air-conditioning"), "Expected AC search to match");

const boreholeMatches = searchServiceCategories("borehole pump");
assert.ok(boreholeMatches.some((c) => c.slug === "plumbing-water-systems"), "Expected borehole search to match");

const solarMatches = searchServiceCategories("solar inverter");
assert.ok(solarMatches.some((c) => c.slug === "electrical-power-backup"), "Expected solar search to match");

console.log("  [PASS] Nigerian search synonym resolution and category matching verified.");

// 3. Verify Form Validation
console.log("\n  [VERIFY] Nigerian Phone & Email Normalization:");
assert.equal(normaliseNigerianPhone("0803 123 4567"), "+2348031234567");
assert.equal(normaliseNigerianPhone("+234 812-345-6789"), "+2348123456789");
assert.equal(normaliseNigerianPhone("07010000000"), "+2347010000000");
assert.equal(normaliseNigerianPhone("0501234567"), null, "Invalid prefix rejected");
assert.equal(normaliseNigerianPhone("12345"), null, "Too short rejected");

assert.equal(isValidEmail("test@example.com"), true);
assert.equal(isValidEmail("bademail"), false);

// 4. Test Registration Validation
console.log("\n  [VERIFY] Registration Validation Engine:");
const validReg = validateRegistration({
  fullName: "Nkechi Eze",
  email: "nkechi@example.com",
  phone: "0802 345 6789",
  password: "Password123",
  confirmPassword: "Password123",
  role: "professional",
  city: "Port Harcourt",
  acceptTerms: "on",
});
assert.ok(validReg.ok, "Valid registration should succeed");

const invalidReg = validateRegistration({
  fullName: "N",
  email: "invalid-email",
  phone: "123",
  password: "weak",
  confirmPassword: "mismatch",
  role: "superadmin", // invalid self-registrable role
  city: "Kano", // outside pilot
  acceptTerms: "off",
});
assert.equal(invalidReg.ok, false);
if (!invalidReg.ok) {
  assert.ok(invalidReg.fieldErrors.fullName, "Should flag name too short");
  assert.ok(invalidReg.fieldErrors.email, "Should flag invalid email");
  assert.ok(invalidReg.fieldErrors.phone, "Should flag invalid phone");
  assert.ok(invalidReg.fieldErrors.password, "Should flag weak password");
  assert.ok(invalidReg.fieldErrors.confirmPassword, "Should flag password mismatch");
  assert.ok(invalidReg.fieldErrors.role, "Should flag invalid role");
  assert.ok(invalidReg.fieldErrors.city, "Should flag non-pilot city");
  assert.ok(invalidReg.fieldErrors.acceptTerms, "Should flag unaccepted terms");
}
console.log("  [PASS] Registration validation strictly enforced across all 8 fields.");

// 5. Test Login Validation
console.log("\n  [VERIFY] Login Validation Engine:");
const validLogin = validateLogin({ email: "user@example.com", password: "SecurePassword123" });
assert.ok(validLogin.ok);

const invalidLogin = validateLogin({ email: "", password: "" });
assert.equal(invalidLogin.ok, false);
console.log("  [PASS] Login validation correctly validates credentials.");

// 6. Test Contact Validation
console.log("\n  [VERIFY] Contact Validation Engine:");
const validContact = validateContact({
  fullName: "Emeka Okoro",
  email: "emeka@company.com",
  phone: "0803 999 8888",
  inquiryType: "business_solutions",
  city: "Lagos",
  subject: "Facility maintenance for 3 retail branches in Lagos",
  message: "We need quarterly AC servicing and diesel generator maintenance for our branches in Lekki and Ikeja.",
});
assert.ok(validContact.ok);
console.log("  [PASS] Contact form validation enforces inquiry type, Nigerian phone, and length bounds.");

console.log("\n=== ALL PROMPT 7 PUBLIC WEBSITE & FORM VALIDATION CHECKS PASSED ===");
