#!/usr/bin/env node
/**
 * EasyLife Environment & Toolchain Check Script
 * Checks presence of environment files and required variable keys WITHOUT exposing any secret values.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const webEnvLocalPath = path.join(rootDir, "apps", "web", ".env.local");
const webEnvExamplePath = path.join(rootDir, "apps", "web", ".env.example");

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const OPTIONAL_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "PAYSTACK_SECRET_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

function parseEnvKeysOnly(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Map();
  }
  const content = fs.readFileSync(filePath, "utf8");
  const keyStatus = new Map();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const rawValue = line.slice(eqIndex + 1).trim();
    const hasNonPlaceholderValue =
      rawValue.length > 0 &&
      !rawValue.startsWith("your-") &&
      !rawValue.startsWith("<");
    keyStatus.set(key, hasNonPlaceholderValue ? "SET" : "EMPTY_OR_PLACEHOLDER");
  }
  return keyStatus;
}

console.log("=== EasyLife Environment Check (Values Masked) ===");
console.log(`Node.js Runtime : ${process.version}`);
console.log(`Workspace Root  : ${rootDir}`);
console.log(
  `.env.example    : ${fs.existsSync(webEnvExamplePath) ? "Present" : "Missing"}`
);
console.log(
  `.env.local      : ${fs.existsSync(webEnvLocalPath) ? "Present" : "Not created yet (copy from apps/web/.env.example)"}`
);

const envMap = parseEnvKeysOnly(webEnvLocalPath);

if (fs.existsSync(webEnvLocalPath)) {
  console.log("\nRequired Variables (apps/web/.env.local):");
  for (const key of REQUIRED_KEYS) {
    const status = envMap.get(key) ?? "MISSING";
    console.log(`  - ${key}: [${status}]`);
  }

  console.log("\nOptional Integration Variables (apps/web/.env.local):");
  for (const key of OPTIONAL_KEYS) {
    const status = envMap.get(key) ?? "NOT_CONFIGURED";
    console.log(`  - ${key}: [${status}]`);
  }
} else {
  console.log(
    "\nTip: Run `Copy-Item apps/web/.env.example apps/web/.env.local` and populate your real Supabase credentials when ready."
  );
}
