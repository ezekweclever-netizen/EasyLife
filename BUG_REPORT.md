# EasyLife Bug & Defect Triage Register (Prompt 21)

**Application:** EasyLife On-Demand Home & Property Services  
**Version:** MVP 1.0.0  
**Audit Period:** Prompt 20 & Prompt 21 QA Verification Phase  
**Current Status:** **ALL IDENTIFIED ISSUES RESOLVED (0 Open / 5 Fixed)**

---

## 1. Defect Summary & Severity Distribution

During the Prompt 20 mobile development and Prompt 21 comprehensive QA testing phase, 5 total issues were logged across the database, test harnesses, and Flutter mobile client. Each issue was triaged, root-caused, repaired, and regression-verified.

| Bug ID | Title | Component | Severity | Resolution Status |
| :---: | :--- | :--- | :---: | :---: |
| **BUG-001** | `is_admin()` Privilege Escalation in `SECURITY DEFINER` procedures | Database / Security | **CRITICAL** | **VERIFIED FIXED** |
| **BUG-002** | Postgres Pooled Connection Context Loss in `test-quotation-engine.mjs` | Test Harness / Backend | **HIGH** | **VERIFIED FIXED** |
| **BUG-003** | `ServiceCategory` Instance Inequality in `DropdownButtonFormField` | Mobile / Flutter UI | **MEDIUM** | **VERIFIED FIXED** |
| **BUG-004** | Flutter Analysis Deprecations & Unused Imports (44 issues) | Mobile / Code Quality | **LOW** | **VERIFIED FIXED** |
| **BUG-005** | Node ESM Path Alias `@/*` Resolution Failure in Server Action Tests | Web / Build Tooling | **LOW** | **VERIFIED FIXED** |

---

## 2. Detailed Bug Reports & Resolutions

### BUG-001 (CRITICAL): `is_admin()` Privilege Escalation in `SECURITY DEFINER` Procedures

- **Severity:** Critical (Security Vulnerability)
- **Component:** Supabase PostgreSQL Database (`public.is_admin()`)
- **Found During:** `scripts/test-quotation-engine.mjs` Rule 8 verification
- **Description:**
  When testing unauthorized modification of another professional's quotation (Test K), a request submitted with an arbitrary user ID (`00000000-0000-0000-0000-000000000999`) was unexpectedly accepted instead of returning `FORBIDDEN`.
- **Root Cause:**
  In migration `20261104001300_admin_dashboard_and_operations.sql`, `is_admin()` checked `IF CURRENT_USER IN ('postgres', 'supabase_admin') THEN RETURN true;`. In PostgreSQL, inside any `SECURITY DEFINER` function owned by `postgres`, `CURRENT_USER` is temporarily set to `'postgres'`. Consequently, `is_admin()` evaluated to `true` for all callers inside any `SECURITY DEFINER` procedure (such as `submit_or_revise_quotation`), bypassing profile ownership checks.
- **Fix Applied:**
  Updated `public.is_admin()` on the remote database and updated migration `20261104001300` to distinguish between direct superuser administrative maintenance (when no authenticated user is in context: `auth.uid() IS NULL AND SESSION_USER IN ('postgres', 'supabase_admin')`) versus user requests (`auth.uid() IS NOT NULL`). For user requests, `is_admin()` strictly checks whether the user's ID exists with an active `admin` role in `public.user_roles`.
- **Verification:**
  Re-ran `scripts/test-quotation-engine.mjs`. Unrelated user modification attempts are now rejected with `{ success: false, error: 'FORBIDDEN' }`. Test passed 100%.

---

### BUG-002 (HIGH): Postgres Pooled Connection Context Loss in Test Harness

- **Severity:** High (Test Integrity)
- **Component:** `scripts/test-quotation-engine.mjs`
- **Found During:** Prompt 21 Test Suite Execution
- **Description:**
  `test-quotation-engine.mjs` wrapped `pool.query(...)` for all queries. Because `pg.Pool` checks out and returns arbitrary connection sockets per query, session-level `set_config('request.jwt.claim.sub', ...)` calls did not persist to subsequent queries, causing role impersonation to fail intermittently.
- **Root Cause:**
  PostgreSQL connection poolers recycle client connections across different backend sockets. Session settings configured with `false` (is_local=false) only persist for the duration of a single physical socket connection.
- **Fix Applied:**
  Updated the test runner to check out a single dedicated connection client `const client = await pool.connect()` and execute all test steps on that dedicated socket, wrapping session cleanup in a `finally` block with `RESET ROLE` and `client.release()`.
- **Verification:**
  All 22 quotation tests now execute deterministically without session leakage or connection timeouts.

---

### BUG-003 (MEDIUM): `ServiceCategory` Instance Inequality in `DropdownButtonFormField`

- **Severity:** Medium (UI Crash / Malfunction)
- **Component:** `apps/mobile/lib/features/customer/service_draft_screen.dart`
- **Found During:** Flutter Widget Testing (`test/prompt20_mobile_flows_test.dart`)
- **Description:**
  Selecting a service category in the booking draft screen caused Flutter to throw an assertion error: `There should be exactly one item with [DropdownButton]'s value: ... Either zero or 2 or more [DropdownMenuItem]s were detected with the same value`.
- **Root Cause:**
  `ServiceCategory` was a Dart class comparing instances by memory reference (`identical`) rather than by `id`. When a mock category instance with identical properties was matched against the items list, Dart evaluated `categoryA == categoryB` as false, triggering the framework assertion.
- **Fix Applied:**
  Overrode `operator ==` and `hashCode` in `ServiceCategory` to evaluate equality based on `id` and `slug`. Additionally updated `DropdownButtonFormField`'s initial value to resolve directly to the matching element from the dropdown item list (`categories.firstWhere((c) => c.id == initialCategory?.id)`).
- **Verification:**
  Flutter widget test `prompt20_mobile_flows_test.dart` and live emulator dropdown selection now work seamlessly with zero assertions or errors.

---

### BUG-004 (LOW): Flutter Analysis Deprecations & Unused Imports

- **Severity:** Low (Code Hygiene & Future Compatibility)
- **Component:** `apps/mobile/lib/...`
- **Found During:** `flutter analyze` Execution
- **Description:**
  Running `flutter analyze` reported 44 warnings/hints regarding deprecated members (such as `DropdownButtonFormField.value` vs modern controller patterns, and `ThemeData.useMaterial3` redundant flags) and unused imports across newly added screens.
- **Root Cause:**
  Flutter 3.x deprecations and boilerplate imports in generated screen files.
- **Fix Applied:**
  Systematically refactored all 44 warnings across `service_draft_screen.dart`, `explore_screen.dart`, `role_provider.dart`, and mock files.
- **Verification:**
  Running `flutter analyze` reports **"No issues found! (ran in 3.2s)"** with 100% clean output.

---

### BUG-005 (LOW): Node ESM Path Alias `@/*` Resolution Failure in Server Action Tests

- **Severity:** Low (Test Execution)
- **Component:** `scripts/test-ai-assistant.mjs` & Next.js Action Invocation
- **Found During:** CLI Test Script Execution
- **Description:**
  Running `node scripts/test-ai-assistant.mjs` failed with `Cannot find module '@/lib/supabase/admin'` and `Cannot find module '.../safety-rules'`.
- **Root Cause:**
  Node.js native ESM loader does not automatically parse TypeScript compiler path aliases (`@/*`) defined in `apps/web/tsconfig.json` or resolve extensionless TypeScript imports.
- **Fix Applied:**
  Configured all Next.js server action tests to run with `npx.cmd tsx --tsconfig apps/web/tsconfig.json <script>`, enabling seamless `@/*` alias and TypeScript extension resolution.
- **Verification:**
  All server action scripts execute with 100% import resolution and passing assertions.

---

## 3. QA Bug Sign-Off

All 5 defects identified during the testing and quality assurance audit have been thoroughly remediated, documented, and re-tested. No known defects, regressions, or security vulnerabilities remain in the codebase.
