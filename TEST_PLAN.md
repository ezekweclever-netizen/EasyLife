# EasyLife Quality Assurance Master Test Plan (Prompt 21)

**Platform:** EasyLife On-Demand Home & Property Services  
**Version:** MVP 1.0.0  
**Pilot Geography:** Port Harcourt, Rivers State, Nigeria  
**Document Classification:** QA Master Plan & Traceability Matrix  
**Status:** Approved & Executed (100% Pass)

---

## 1. Executive Summary & Objective

The objective of this comprehensive quality assurance audit is to systematically verify, validate, and sign off on all MVP features and functional components of the EasyLife platform prior to public pilot deployment in Port Harcourt.

The test plan exercises all ten mandated testing areas:
- **A. Authentication & Identity**
- **B. User Roles & Permission Boundaries**
- **C. Marketplace & Transaction Lifecycle**
- **D. Communication & Multi-Channel Notifications**
- **E. Accountability, Escrow & Dispute Resolution**
- **F. Business & Property Maintenance Management**
- **G. AI Problem Diagnosis, Quotation & Customer Support**
- **H. Mobile Flutter Android & iOS Client Application**
- **I. Database Security, RLS & Anti-Tamper Controls**
- **J. System Reliability, Rate Limiting & Error Handling**

---

## 2. Test Environments & Infrastructure

### 2.1 Test Environments
1. **Live Remote Database Sandbox:**
   - Provider: Supabase Hosted PostgreSQL 15 + PostGIS 3.3.
   - Connection Pooling: Transaction pooler via `aws-0-eu-west-1.pooler.supabase.com:6543`.
   - Security Isolation: Row Level Security (RLS) active on all public schema tables.
2. **Web Application Runtime:**
   - Stack: Next.js 15 (App Router), React 19, TailwindCSS, TypeScript 5.
   - Server Actions: Executed with Next.js tsconfig paths (`apps/web/tsconfig.json`).
3. **Mobile Client Runtime:**
   - Framework: Flutter 3.x / Dart 3.x.
   - Target Device: Android Emulator (`emulator-5554`, Android 14 API 34).
   - State Architecture: Unified repository & provider pattern.

### 2.2 Test Tooling & Automation Frameworks
- **Automated Node.js / TypeScript Test Runners:** Dedicated assertion-driven CLI suites in `/scripts` testing business logic, database constraints, RPC procedures, and server actions.
- **Flutter Test Suite:** Unit, mock, and widget integration tests under `apps/mobile/test/`.
- **Database Test Context:** Session-level JWT mocking via `request.jwt.claim.sub` and `SET ROLE authenticated` to accurately simulate customer, professional, business, admin, and unauthenticated roles.

---

## 3. Test Data Strategy & Safety Guardrails

1. **Zero Production Data Mutation:**
   - All tests execute against dedicated test fixtures identified by random prefixes (e.g., `BK-TEST-*`, `BIZ-TEST-*`, `PROP-TEST-*`).
   - Automated cleanup routines safely purge transient test bookings, quotations, and properties without violating foreign key constraints or deleting audit logs.
2. **Role Isolation Matrix:**
   - **Customer Test Account:** Authenticated customer profile restricted to personal bookings and reviews.
   - **Professional Test Account:** Verified artisan with verified trade category, hourly rates, and portfolio.
   - **Business Test Account:** Registered commercial entity with multiple properties and asset records.
   - **Administrator Test Account:** Role `admin` in `public.user_roles` with access to moderation and system settings.
   - **Attacker / Unauthenticated Actor:** Anonymous caller attempting unauthorized modifications, impersonation, or IDOR traversal.

---

## 4. Test Areas & Verification Scope

### Area A: Authentication & Identity
- Registration validation for Customer, Professional, and Business Owner.
- Password hashing and session management.
- Nigerian phone number normalization (`+234` / `080...`).
- Email verification and password recovery workflows via transactional email templates.
- Session timeout and secure logout.

### Area B: User Permissions & Access Control (RBAC)
- Customer permissions: Browse catalog, submit booking requests, accept quotations, release completion PIN, review jobs.
- Professional permissions: Set availability, view assigned job details, submit structured quotations, request job completion.
- Business permissions: Register facilities, track maintainable equipment, schedule preventive maintenance, assign managers.
- Administrator permissions: User management, verification approval/rejection, commission configuration, review moderation, dispute arbitration.
- Privilege boundary testing: Ensuring customers cannot submit quotations, professionals cannot moderate disputes, and non-admins cannot invoke admin RPCs.

### Area C: Marketplace & Booking Engine
- Service discovery and category navigation across 17 Port Harcourt categories and subcategories.
- PostGIS spatial radius calculation and neighborhood matching (Woji, Old GRA, Peter Odili, Choba).
- Matching algorithm weighting: Category (35%), Distance (25%), Availability (15%), Rating (15%), Verification (5%), Experience (5%).
- Quotation workflow: Multi-version proposals, line-item breakdowns (labor, materials, callout fee), server-side total calculation in kobo minor units.
- Quotation acceptance and booking state transitions (`open` -> `quoted` -> `confirmed` -> `in_progress`).

### Area D: Communication & Notification Systems
- Real-time in-app messaging between customer and assigned professional.
- Push notification payload generation for Firebase Cloud Messaging (FCM).
- Transactional email dispatch via Resend (booking confirmed, quote received, dispute filed).
- Private attachment access for job photos and KYC documents.

### Area E: Accountability & Financial Integrity
- Dual-party completion handshake: Pro submits completion request -> Customer confirms via 4-digit job PIN.
- Dispute management lifecycle: Customer reports incomplete work -> Dispute filed -> Booking escrow locked -> Admin arbitration.
- Review and rating rules: Only customers with completed bookings can review; 1 review per booking; professional cannot review own job; review edit history log.
- Rule enforcement: Disputed jobs CANNOT automatically become completed transactions.

### Area F: Business & Property Maintenance
- Business organization registration and multi-branch management.
- Maintainable asset tracking (Air Conditioners, Generators, Inverters, Solar Systems, Pumps).
- Preventive maintenance scheduling (intervals, upcoming service alerts).
- Facility manager assignment and role-scoped dashboard metrics.

### Area G: Artificial Intelligence Capabilities
- AI Problem Assistant: Natural language diagnosis, category inference, clarifying questions, safety disclaimers, and structured draft generation.
- DIY sanitization: Preventing dangerous do-it-yourself instructions for high-voltage and gas lines.
- AI Quotation Assistant: Line-item scaffolding for professionals without price invention.
- AI Customer Support Assistant: Platform procedural knowledge, fallback, and human escalation.
- Rate limiting: PostgreSQL sliding window rate limiter (10 requests per 10 minutes).

### Area H: Mobile Application (Flutter)
- Cross-platform Android & iOS architecture.
- Role-switcher dialog and role-aware navigation bar.
- Responsive mobile layouts (screens, cards, buttons, input fields).
- End-to-end AI diagnosis and request generation flow.
- Hot reload verification on live Android Emulator (`emulator-5554`).

### Area I: Security & Row Level Security (RLS)
- SQL RLS policy enforcement on all tables.
- Function security: `is_admin()` evaluation verification in `SECURITY DEFINER` procedures.
- Anti-tamper triggers: Immutable `quotation_versions` and append-only `audit_logs`.
- Document privacy: Separate public vs private Supabase storage buckets.

### Area J: Reliability & Edge Cases
- Network timeout handling and retry policies.
- Decimal/kobo integer arithmetic rounding error prevention.
- Race condition mitigation on concurrent quotation acceptance.
- Form input sanitization and XSS prevention.

---

## 5. Traceability Matrix

| Test Suite Script | Scope / Prompt | Test Area | Assertions | Status |
| :--- | :--- | :--- | :---: | :---: |
| `scripts/test-security-policies.mjs` | Prompt 5 / 21 | Area I | 6 | **PASS** |
| `scripts/test-customer-flow.mjs` | Prompt 8 / 21 | Area A, B, C | 47 | **PASS** |
| `scripts/test-pro-flow.mjs` | Prompt 9 / 21 | Area A, B, C | 53 | **PASS** |
| `scripts/test-matching-engine.mjs` | Prompt 10 / 21 | Area C | 30 | **PASS** |
| `scripts/test-booking-engine.mjs` | Prompt 11 / 21 | Area C, J | 21 | **PASS** |
| `scripts/test-quotation-engine.mjs` | Prompt 12 / 21 | Area C, I, J | 22 | **PASS** |
| `scripts/test-expanded-services.mjs`| Prompt 13 / 21 | Area C | 31 | **PASS** |
| `scripts/test-accountability-system.mjs`| Prompt 14 / 21 | Area E | 24 | **PASS** |
| `scripts/test-business-portal.mjs` | Prompt 15 / 21 | Area B, F | 52 | **PASS** |
| `scripts/test-admin-portal.mjs` | Prompt 16 / 21 | Area B, I | 29 | **PASS** |
| `scripts/test-ai-assistant.mjs` | Prompt 17 / 21 | Area G, J | 27 | **PASS** |
| `scripts/test-prompt18-capabilities.mjs`| Prompt 18 / 21 | Area G | 39 | **PASS** |
| `scripts/test-prompt19-integrations.mjs`| Prompt 19 / 21 | Area D, J | 64 | **PASS** |
| `scripts/test-messaging-notifications.mjs`| Prompt 8, 9, 14 | Area D | 22 | **PASS** |
| `scripts/test-public-pages.mjs` | Prompt 7 / 21 | Area A, C | 18 | **PASS** |
| `apps/mobile/test/*` | Prompt 20 / 21 | Area H | 9 | **PASS** |
| `apps/mobile` (flutter analyze) | Prompt 20 / 21 | Area H | 44 (0 issues)| **PASS** |
| **TOTAL** | | | **495+** | **100% PASS** |

---

## 6. QA Sign-Off Criteria

1. Zero failing tests in automated regression suite.
2. Zero unresolved critical or high-severity vulnerabilities.
3. Mobile application renders cleanly and without UI overflow on Android Emulator.
4. Database RLS policies verified to prevent unauthorized data access across all user roles.
5. All 4 required QA documents published: `TEST_PLAN.md`, `TEST_RESULTS.md`, `SECURITY_TEST_REPORT.md`, `BUG_REPORT.md`.
