# EasyLife — Project Status & Repository Inspection Report

**Last Updated:** 2026-11-04  
**Current Stage:** Prompt 10 — Service Discovery and Location-Based Matching (Completed)

---

## 1. Initial Repository Audit (Pre-Setup Inspection)

Before creating any files, the workspace at `c:\Users\HP\Documents\EasyLife` was thoroughly inspected:

| Inspection Area | Finding | Status |
| :--- | :--- | :--- |
| **Directory Contents** | Directory was completely empty (`0` files, `0` directories). | Clean slate |
| **Existing Source Files** | None present. No legacy or conflicting code. | Verified |
| **Supabase Configurations** | No existing `supabase/` directory or migration files found. | Initialized |
| **Environment Variables** | No `.env` or `.env.local` files existed in the workspace. | Safe (`.env.example` created) |
| **Auth, DB & Storage Integrations** | None pre-existing. | Ready for Stage 1 |
| **Git Repository** | Not initialized (`fatal: not a git repository`). Git `2.50.1.windows.1` installed on host. | Initialized in Stage 0 |
| **Node.js Runtime** | Node.js `v24.15.0` installed and available in `PATH`. | Ready |
| **PowerShell Execution Policy** | Windows PowerShell restricts `.ps1` shims (`npm.ps1` blocked by default ExecutionPolicy). Invoking `npm.cmd` / `npx.cmd` or setting process-level bypass resolves this cleanly. | Documented & mitigated |
| **Flutter SDK** | `flutter` CLI not currently in system `PATH`. `apps/mobile` scaffold is structured to run immediately once Flutter SDK is added to `PATH`. | Documented in `ENVIRONMENT_SETUP.md` |
| **Supabase CLI** | Not installed globally; available on demand via `npx.cmd supabase`. | Documented in `ENVIRONMENT_SETUP.md` |

---

## 2. Identified Technical Risks & Mitigations

1. **Windows PowerShell ExecutionPolicy (`PSSecurityException` on `npm.ps1`)**
   - **Cause:** Default Windows PowerShell execution policy blocks `.ps1` wrapper scripts such as `C:\Program Files\nodejs\npm.ps1`.
   - **Mitigation:** Use `npm.cmd` and `npx.cmd` in PowerShell, or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the active terminal session. Documented in `ENVIRONMENT_SETUP.md`.
2. **Next.js + Flutter Monorepo Coupling**
   - **Cause:** Forcing a Flutter project into a Node.js workspace tool can cause unnecessary `node_modules` scanning inside Flutter/Android/iOS folders and break IDE indexing.
   - **Mitigation:** Root `package.json` explicitly scopes `"workspaces"` to `["apps/web", "packages/*"]`. `apps/mobile` resides in the same Git repository for cohesive version control and shared documentation while remaining a pure Dart/Flutter project.
3. **Secret Key Exposure Prevention**
   - **Cause:** Misconfigured environment variables can leak `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `PAYSTACK_SECRET_KEY`, or `RESEND_API_KEY` to the client bundle.
   - **Mitigation:** Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` use the `NEXT_PUBLIC_` prefix. Server-only secrets are validated exclusively on the server and checked via `scripts/check-env.mjs`.

---

## 3. Completed Environment Deliverables (Prompt 2)

- [x] Inspected existing workspace, Git status, and host toolchains.
- [x] Initialized Git repository with comprehensive `.gitignore` (Node, Next.js, Supabase, Flutter, env secrets).
- [x] Established the monorepo directory structure (`apps/web`, `apps/mobile`, `packages/shared-types`, `packages/shared-config`, `supabase/{migrations,functions,seed}`, `docs`, `scripts`).
- [x] Created `@easylife/shared-types` with core domain roles, pilot cities (`Port Harcourt`, `Lagos`, `Abuja`), and status types.
- [x] Created `@easylife/shared-config` with brand design tokens (Deep Navy, Teal, White, Light Grey) and base TypeScript configuration.
- [x] Initialized `apps/web` (Next.js App Router + TypeScript + Tailwind CSS) wired to `@easylife/shared-types` and `@easylife/shared-config`.
- [x] Initialized `apps/mobile` Flutter project structure (`pubspec.yaml`, `lib/main.dart`, `analysis_options.yaml`).
- [x] Initialized `supabase/config.toml` and directories (`migrations/`, `functions/`, `seed/`).
- [x] Created environment check script (`scripts/check-env.mjs`) that validates variable presence without printing secret values.
- [x] Created `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `DEVELOPMENT_ROADMAP.md`, and `ENVIRONMENT_SETUP.md`.

---

## 4. Completed Technical Architecture Deliverables (Prompt 3)

- [x] [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) — Modular monolith + central Supabase BaaS architecture, component boundaries, file storage buckets (`avatars`, `portfolio-media`, `verification-documents`, `service-request-media`, `maintenance-and-disputes`), messaging/notification architecture, error handling, logging/monitoring, and deployment topology.
- [x] [`API_DESIGN.md`](./API_DESIGN.md) — Explicit 3-tier execution boundary matrix (Direct Supabase Client + RLS vs. Transactional PostgreSQL RPCs vs. Protected `/api/v1/*` Server Endpoints), standardized `ApiResult<T>` envelope, and endpoint specifications for Web and Flutter.
- [x] [`SECURITY_ARCHITECTURE.md`](./SECURITY_ARCHITECTURE.md) — Authentication sequence flows, 5-role RBAC matrix (`customer`, `professional`, `business`, `property_manager`, `admin`), RLS helper functions, anti-tampering triggers, storage policies, and secret isolation rules.
- [x] [`DATA_FLOW.md`](./DATA_FLOW.md) — Complete Mermaid state machines and sequence diagrams for authentication, service booking & AI categorization, atomic quotation acceptance, job completion & verified review unlocking, business maintenance scheduling, and multi-channel notifications.
- [x] [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) — Formal Architecture Decision Records (ADR-001 through ADR-008).
- [x] Updated [`packages/shared-types/src/index.ts`](./packages/shared-types/src/index.ts) with `ApiResult<T>`, `ApiErrorCode`, `StorageBucketId`, `AppointmentStatus`, `DisputeStatus`, and `AIProblemCategorizationResult`.

---

## 5. Completed Supabase Database Architecture Deliverables (Prompt 4)

- [x] [`supabase/migrations/20261104000100_extensions_enums_and_helpers.sql`](./supabase/migrations/20261104000100_extensions_enums_and_helpers.sql) — `pgcrypto`, 16 PostgreSQL ENUM types, `set_updated_at()`, `prevent_row_modification()`, and `generate_reference_code()`.
- [x] [`supabase/migrations/20261104000200_identity_and_professionals.sql`](./supabase/migrations/20261104000200_identity_and_professionals.sql) — Group A (`profiles`, `user_roles`, `user_sessions`), `service_categories`, Group B (`professional_profiles`, `professional_services`, `professional_service_areas`, `professional_documents`, `professional_availability`), and `public_professional_directory` view separating public from confidential data.
- [x] [`supabase/migrations/20261104000300_business_and_marketplace.sql`](./supabase/migrations/20261104000300_business_and_marketplace.sql) — Group C (`businesses`, `business_members`, `business_subscriptions`, `properties`, `assets`), `maintenance_schedules`, and Group D (`bookings`, `booking_attachments`, `quotations`, `quotation_items`, `booking_status_history`, `conversations`, `conversation_members`, `messages`, `notifications`).
- [x] [`supabase/migrations/20261104000400_transactions_admin_and_rls.sql`](./supabase/migrations/20261104000400_transactions_admin_and_rls.sql) — Group E (`payments`, `refunds`, `reviews`, `disputes`, `dispute_evidence`, `maintenance_records`), Group F (`audit_logs`, `reports`, `platform_settings`, `commission_settings`), atomic RPCs (`accept_quotation_and_schedule`, `confirm_booking_completion`), Storage buckets, and baseline RLS across all 30 tables.
- [x] [`supabase/seed/dev_seed.sql`](./supabase/seed/dev_seed.sql) — Foundational categories, platform/commission settings, and clearly labelled `[FICTIONAL TEST]` development records (`@easylife-dev-test.invalid`) with production guard.
- [x] [`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md) — ER diagram, 30-table reference catalog, minor-unit monetary rules, and rollback/recovery guide.
- [x] [`packages/shared-types/src/database.ts`](./packages/shared-types/src/database.ts) — TypeScript row types for all 30 database tables plus `formatMinorUnits()` helper.

---

## 6. Completed Row Level Security & Backend Security Deliverables (Prompt 5)

- [x] [`supabase/migrations/20261104000500_comprehensive_rls_storage_and_admin_security.sql`](./supabase/migrations/20261104000500_comprehensive_rls_storage_and_admin_security.sql) — Fine-grained RLS helper functions, anti-privilege-escalation triggers (`enforce_profile_security_constraints`, `enforce_user_roles_security`, `enforce_professional_profile_security`), business owner vs. manager vs. viewer policies, private storage object policies, file metadata validator, and admin RPCs (`admin_review_professional_verification`, `admin_set_user_suspension`, `admin_resolve_dispute`).
- [x] [`apps/web/src/lib/security/file-validation.ts`](./apps/web/src/lib/security/file-validation.ts) — Bucket-specific MIME type, extension, size limit, and path-ownership validator.
- [x] [`apps/web/src/lib/security/rate-limit.ts`](./apps/web/src/lib/security/rate-limit.ts) — Sliding-window rate limiter for auth, AI categorization, quotation submission, dispute creation, and admin endpoints.
- [x] [`apps/web/src/lib/security/rbac-policy-engine.ts`](./apps/web/src/lib/security/rbac-policy-engine.ts) — Server-side authorization guard matching PostgreSQL RLS rules.
- [x] [`scripts/test-security-policies.mjs`](./scripts/test-security-policies.mjs) — Automated security & unauthorized access test suite (`npm.cmd run test:security`).

---

## 7. Completed Brand Identity & Design System Deliverables (Prompt 6)

- [x] [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Official brand specification covering colour palette, WCAG 2.1 AA/AAA contrast pairs, typography scale, spacing/radius grid, responsive breakpoints, and differentiated layouts for Customer, Professional, Business, and Admin experiences.
- [x] [`packages/shared-config/src/design-tokens.ts`](./packages/shared-config/src/design-tokens.ts) — Shared TypeScript design tokens (`EASYLIFE_COLOR_PALETTE`, `EASYLIFE_TYPOGRAPHY`, `EASYLIFE_SPACING`, `EASYLIFE_BREAKPOINTS`, `EASYLIFE_EXPERIENCE_DESIGN_PROFILES`, `ACCESSIBLE_COLOR_COMBINATIONS`).
- [x] Official SVG Brand Assets in `apps/web/public/brand/`: [`easylife-mark.svg`](./apps/web/public/brand/easylife-mark.svg), [`easylife-logo-light.svg`](./apps/web/public/brand/easylife-logo-light.svg), and [`easylife-logo-dark.svg`](./apps/web/public/brand/easylife-logo-dark.svg).
- [x] Reusable Next.js UI Component Library in `apps/web/src/components/ui/`: `EasyLifeLogo`, `Button`, `Input`, `Select`, `Textarea`, `Badge` + domain status badges, `Card`, `StatCard`, `DataTable`, `AlertBanner`, `EmptyState`, `LoadingState`, `ErrorState`, `Skeleton`, and `ExperienceShell`.
- [x] Interactive Design System Showcase Route at [`apps/web/src/app/design-system/page.tsx`](./apps/web/src/app/design-system/page.tsx).
- [x] Matching Flutter Theme & Colour Tokens at [`apps/mobile/lib/theme/easylife_theme.dart`](./apps/mobile/lib/theme/easylife_theme.dart).

---

## 8. Completed Website Structure & Public Pages Deliverables (Prompt 7)

- [x] [`apps/web/src/app/page.tsx`](./apps/web/src/app/page.tsx) — Production Homepage with all 12 required sections:
  1. Sticky navigation header (`PublicShell` / `SiteHeader`)
  2. Hero section with pilot cities badge (Port Harcourt, Lagos, Abuja)
  3. Main service search bar (`ServiceSearchForm` routing to `/explore-services?q=...`)
  4. Popular service categories (8 foundational categories from database seed)
  5. How EasyLife works (4-step customer progression)
  6. Why customers use EasyLife (Grounded benefits: vetting, escrow, transparency)
  7. Benefits for professionals (Steady jobs, guaranteed payouts, digital quotes)
  8. Business maintenance solutions (Multi-property asset oversight, preventive scheduling)
  9. Trust and verification explanation (3-tier KYC and trade vetting)
  10. Frequently asked questions (Native accessible accordion)
  11. Call-to-action banner (Dual action for booking and professional registration)
  12. Comprehensive 4-column footer (`SiteFooter`)
- [x] [`apps/web/src/app/explore-services/page.tsx`](./apps/web/src/app/explore-services/page.tsx) — Full catalog discovery with instant server-rendered search (`?q=`) and category filtering (`?cat=`), common tasks per trade, and pilot city availability.
- [x] [`apps/web/src/app/how-it-works/page.tsx`](./apps/web/src/app/how-it-works/page.tsx) — Complete multi-audience operational guide covering Customer, Professional, and Business workflows with escrow protection details.
- [x] [`apps/web/src/app/become-a-professional/page.tsx`](./apps/web/src/app/become-a-professional/page.tsx) — Value proposition, 4-step onboarding roadmap, 3-tier document requirements, and technician FAQ for Nigerian artisans and trade contractors.
- [x] [`apps/web/src/app/business-solutions/page.tsx`](./apps/web/src/app/business-solutions/page.tsx) — Commercial facility maintenance, equipment asset tracking (diesel generators, central HVAC, water treatment), scheduled preventive maintenance, and consolidated tax invoicing.
- [x] [`apps/web/src/app/about/page.tsx`](./apps/web/src/app/about/page.tsx) — Brand identity, mission, urban infrastructure context in Nigeria, core operating values, and pilot footprints (Port Harcourt, Lagos, Abuja).
- [x] [`apps/web/src/app/help/page.tsx`](./apps/web/src/app/help/page.tsx) — Categorized help centre covering customer booking, technician payouts, business multi-branch setups, and dispute escalation.
- [x] [`apps/web/src/app/contact/page.tsx`](./apps/web/src/app/contact/page.tsx) — Operating hub addresses, support hours (Mon-Sat 8am-6pm WAT), and validated contact inquiry form (`ContactForm`).
- [x] [`apps/web/src/app/login/page.tsx`](./apps/web/src/app/login/page.tsx) — Secure login interface (`LoginForm`) with password visibility toggle, client validation, rate limiting, and Supabase Auth integration.
- [x] [`apps/web/src/app/register/page.tsx`](./apps/web/src/app/register/page.tsx) — Multi-role registration (`RegisterForm`) supporting Customer, Professional, Business, and Property Manager accounts with pilot city selector, Nigerian phone validation, and password strength checks.
- [x] [`apps/web/src/app/privacy-policy/page.tsx`](./apps/web/src/app/privacy-policy/page.tsx) — Comprehensive privacy policy compliant with the Nigeria Data Protection Act (NDPA) 2023 and NDPR.
- [x] [`apps/web/src/app/terms-of-service/page.tsx`](./apps/web/src/app/terms-of-service/page.tsx) — Marketplace terms, quotation rules, escrow protection clauses, cancellation standards, and Nigerian arbitration provisions.
- [x] [`apps/web/src/app/verification-policy/page.tsx`](./apps/web/src/app/verification-policy/page.tsx) — Three-tier professional vetting architecture (Identity/NIN, Trade credentials/Apprenticeship, Guarantor accountability) and continuous quality monitoring.
- [x] [`apps/web/src/lib/public-catalog.ts`](./apps/web/src/lib/public-catalog.ts) — Deterministic keyword search engine and Nigerian terminology synonym mapping (generator, borehole, AC, wiring, inverter).
- [x] [`apps/web/src/lib/validation/forms.ts`](./apps/web/src/lib/validation/forms.ts) — Type-safe, dependency-free validation engine for Login, Registration, and Contact forms with E.164 Nigerian phone formatting.
- [x] [`apps/web/src/app/actions/auth.ts`](./apps/web/src/app/actions/auth.ts) — Secure Next.js Server Actions with sliding-window rate limiting, input validation, and Supabase Auth session persistence.
- [x] [`scripts/test-public-pages.mjs`](./scripts/test-public-pages.mjs) — Automated test suite verifying all 13 routes, search keywords, and form validation logic (`npm.cmd test`).
- [x] Fully compiled and verified with `npm.cmd run typecheck` and `npm.cmd run build` (all 13 pages generated cleanly).

---

## 9. Completed Customer Application Interface Deliverables (Prompt 8)

- [x] Production Customer Experience at [`apps/web/src/app/dashboard/page.tsx`](./apps/web/src/app/dashboard/page.tsx) with dynamic welcome greeting, Nigerian city selector, search bar, live Supabase service categories, recommended professionals, active service requests tracking, recent bookings history, unread notifications counter, and direct customer support (WhatsApp, Help Centre, Operations).
- [x] Standard 5-Item Customer Navigation header ([`apps/web/src/components/customer/customer-header.tsx`](./apps/web/src/components/customer/customer-header.tsx)): Home (`/dashboard`), Explore Services (`/explore-services`), My Bookings (`/bookings`), Messages (`/messages`), Profile (`/profile`).
- [x] My Bookings Management suite at [`apps/web/src/app/bookings/page.tsx`](./apps/web/src/app/bookings/page.tsx) and detail inspection at [`apps/web/src/app/bookings/[id]/page.tsx`](./apps/web/src/app/bookings/[id]/page.tsx) with booking reference codes (`BK-...`), live status tracking badges, itemized quotation breakdowns, appointment schedules, and status progression logs.
- [x] Professional Profile View at [`apps/web/src/app/professionals/[id]/page.tsx`](./apps/web/src/app/professionals/[id]/page.tsx) displaying professional/business name, profile photo, verified badge, description bio, service categories, operating service areas, years of experience, working hours & availability schedule, portfolio gallery, completed jobs count, and customer ratings/reviews breakdown.
- [x] Customer Booking Form Wizard at [`apps/web/src/components/booking/booking-wizard.tsx`](./apps/web/src/components/booking/booking-wizard.tsx) and route [`apps/web/src/app/book/page.tsx`](./apps/web/src/app/book/page.tsx) featuring multi-step progress, service category selector, problem description, photograph/video attachment validation, service location & landmark, preferred date & time slot, additional instructions, and immediate booking confirmation with reference codes.
- [x] Customer Messages route at [`apps/web/src/app/messages/page.tsx`](./apps/web/src/app/messages/page.tsx) and Profile Settings route at [`apps/web/src/app/profile/page.tsx`](./apps/web/src/app/profile/page.tsx).
- [x] Automated test suite at [`scripts/test-customer-flow.mjs`](./scripts/test-customer-flow.mjs) passing all checks.

---

## 10. Completed Professional Registration & Dashboard Deliverables (Prompt 9)

- [x] Multi-step Professional Registration Wizard at [`apps/web/src/app/pro/register/page.tsx`](./apps/web/src/app/pro/register/page.tsx) and [`apps/web/src/components/pro/pro-register-wizard.tsx`](./apps/web/src/components/pro/pro-register-wizard.tsx) collecting: full name, Nigerian phone, email, business name, avatar/logo upload, business/residential location, service categories, coverage areas, experience, working hours, and description bio.
- [x] Secure KYC & Trade Document Submission Process supporting Identity (NIN, Voter's Card, Driver's License, International Passport), Business registration (CAC certificate), Professional qualifications (NABTEB, Trade test), and supporting evidence, with masked document numbers for NDPA compliance and full lifecycle statuses (`unsubmitted`, `pending`, `approved`, `rejected`, `suspended`).
- [x] Professional Dashboard at [`apps/web/src/app/pro/dashboard/page.tsx`](./apps/web/src/app/pro/dashboard/page.tsx) displaying new service requests, pending quotations, active jobs, upcoming appointments, completed jobs, customer messages, performance metrics, profile completion meter, and verification status banner.
- [x] Professional Navigation Header ([`apps/web/src/components/pro/pro-header.tsx`](./apps/web/src/components/pro/pro-header.tsx)): Dashboard (`/pro/dashboard`), Job Requests (`/pro/jobs`), Quotations (`/pro/quotations`), Messages (`/pro/messages`), Earnings (`/pro/earnings`), Profile (`/pro/profile`).
- [x] Job Management Suite at [`apps/web/src/app/pro/jobs/page.tsx`](./apps/web/src/app/pro/jobs/page.tsx) and [`apps/web/src/app/pro/jobs/[id]/page.tsx`](./apps/web/src/app/pro/jobs/[id]/page.tsx) with interactive status actions ([`job-status-actions.tsx`](./apps/web/src/components/pro/job-status-actions.tsx)) allowing pros to start accepted jobs (`in_progress`), submit completion requests with notes (`pro_marked_complete`), update appointment schedules, and view job history.
- [x] Quotation Management at [`apps/web/src/app/pro/quotations/page.tsx`](./apps/web/src/app/pro/quotations/page.tsx) with modal preparation ([`pro-quotation-modal.tsx`](./apps/web/src/components/pro/pro-quotation-modal.tsx)) itemizing labor, materials, callout fee, and transport costs with real-time minor-unit Naira calculation and job duration estimation.
- [x] Customer Privacy & Anti-Tamper Enforcement: customer phone numbers and street addresses remain strictly masked from unrelated or unassigned professionals; database security trigger (`trg_professional_profiles_security_guard`) blocks professionals from claiming verified status without administrator approval.
- [x] Automated test suite at [`scripts/test-pro-flow.mjs`](./scripts/test-pro-flow.mjs) passing all 53 checks.

---

## 11. Completed Service Discovery & Location-Based Matching Deliverables (Prompt 10)

- [x] **Initial 10 Service Categories** seeded and verified in live Supabase PostgreSQL database:
  1. `plumbing` — Plumbing
  2. `electrical-services` — Electrical services
  3. `air-conditioning-and-refrigeration` — Air conditioning and refrigeration
  4. `generator-and-inverter-repairs` — Generator and inverter repairs
  5. `cleaning-services` — Cleaning services
  6. `painting` — Painting
  7. `carpentry` — Carpentry
  8. `pest-control` — Pest control
  9. `general-home-maintenance` — General home maintenance
  10. `solar-installation-and-maintenance` — Solar installation and maintenance
- [x] **Administrative Category Management**:
  - Administrative portal route at [`apps/web/src/app/admin/categories/page.tsx`](./apps/web/src/app/admin/categories/page.tsx)
  - Interactive management component at [`apps/web/src/components/admin/admin-category-manager.tsx`](./apps/web/src/components/admin/admin-category-manager.tsx)
  - Secure Server Actions at [`apps/web/src/app/actions/admin-categories.ts`](./apps/web/src/app/actions/admin-categories.ts) supporting adding categories, editing names/descriptions/slugs/commissions, toggling active/disabled status, assigning category icons, and reorganizing display orders.
- [x] **Geospatial & Location Support (Port Harcourt Pilot)**:
  - Enabled **PostGIS** extension (`v3.3.7`) on Supabase PostgreSQL.
  - Added spatial geography columns (`geom geography(Point, 4326)`) and GIST spatial indexes on `professional_service_areas` and `bookings`.
  - Created and seeded `public.operating_neighbourhoods` reference table covering 15 Port Harcourt localities and surrounding areas with accurate GPS coordinates:
    * Woji (`Obio/Akpor`)
    * Peter Odili / Trans-Amadi (`Port Harcourt City`)
    * Old GRA (`Port Harcourt City`)
    * New GRA Phases 1-3 (`Port Harcourt City`)
    * D-Line (`Port Harcourt City`)
    * Diobu Mile 1-3 (`Port Harcourt City`)
    * Rumuola (`Obio/Akpor`)
    * Rumuokoro & Eliozu (`Obio/Akpor`)
    * Choba & Alakahia (`Obio/Akpor` — UniPort axis)
    * Ada George & Mgbuoba (`Obio/Akpor`)
    * Aleto & Indorama Axis (`Eleme`)
    * Onne Free Zone (`Eleme`)
    * Omagwa Airport Area (`Ikwerre`)
    * Igwuruta (`Ikwerre`)
    * Oyigbo Town (`Oyigbo`)
- [x] **Matching Logic & Ranking RPC (`public.match_service_professionals`)**:
  - Implements multi-factor weighted matching:
    1. **Service Category Relevance (35%)**: Exact category match prioritised.
    2. **Service Area Coverage & Proximity (25%)**: Real-time geodesic distance via PostGIS `ST_Distance`.
    3. **Availability (15%)**: Strict verification against profile `is_available` and calendar day-of-week / operating hours in `professional_availability`. A professional is *never* represented as available unless schedule and profile data support the claim.
    4. **Relevant Experience (5%)**: Years of experience in the specific trade.
    5. **Customer Rating & History (15%)**: Real verified customer review average and completed jobs count.
    6. **Verification Trust Tier (5%)**: Identity and credential badge boost; does *not* automatically interpret verification as technical competence or allow it to eclipse customer ratings.
- [x] **Interactive Customer Service Discovery**:
  - Client component at [`apps/web/src/components/discovery/service-discovery-client.tsx`](./apps/web/src/components/discovery/service-discovery-client.tsx) and page [`apps/web/src/app/explore-services/page.tsx`](./apps/web/src/app/explore-services/page.tsx) supporting all 7 filter axes: Keyword, Category, Pilot City, Neighbourhood/LGA, Distance Radius, Appointment Schedule, Customer Rating, and Verified-only badge toggle.
- [x] **Automated Test Suite (`scripts/test-matching-engine.mjs`)**:
  - 30 comprehensive checks verifying 10 categories, admin actions, multi-axis search filters, PostGIS geography calculations (e.g. Woji to Old GRA = 6.4 km), schedule availability constraints, ranking weights, and live RPC execution.
  - Fully integrated into `npm.cmd test` (All 6 test suites passing with 0 failures).
