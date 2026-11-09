# EasyLife — Architecture Decision Records (`ARCHITECTURE_DECISIONS.md`)

This document records the key architectural decisions made for the EasyLife MVP to ensure maintainability, security, and low operating costs for the Nigerian market.

---

## ADR-001: Modular Monolith + Central Supabase BaaS over Microservices

- **Status:** Accepted
- **Context:** EasyLife must support four distinct user experiences (Customer, Professional, Business/Property Manager, and Administrator) across Web (Next.js) and Mobile (Flutter Android/iOS).
- **Decision:** Build a single central Supabase PostgreSQL backend paired with a unified Next.js App Router application (`apps/web`) that exposes `/api/v1/*` server endpoints for privileged operations consumed by both Web and Flutter (`apps/mobile`).
- **Consequences:**
  - **Positive:** Zero microservice network latency, single database transaction boundary, drastically lower cloud hosting costs (Vercel + Supabase), and rapid iteration.
  - **Negative:** Requires strict modular folder structure and database RLS discipline so domains remain cleanly separated.

---

## ADR-002: Hybrid Data Access Pattern (PostgREST + Transactional RPCs + `/api/v1/*`)

- **Status:** Accepted
- **Context:** Some operations are simple filtered reads or user-owned writes, some require multi-table ACID atomicity, and others require third-party secret keys (OpenAI, Resend, FCM, Paystack).
- **Decision:**
  1. Use **Direct Supabase Client + RLS** for reads, catalog browsing, and real-time chat.
  2. Use **PostgreSQL `SECURITY DEFINER` RPCs** (`supabase.rpc(...)`) for multi-table state transitions (`accept_quotation_and_schedule`, `confirm_job_completion`, `submit_verified_review`).
  3. Use **Next.js `/api/v1/*` Route Handlers** for third-party API calls and multi-channel notifications.
- **Consequences:**
  - **Positive:** Prevents partial updates (no race conditions when accepting quotations), keeps all third-party secrets on the server, and ensures identical behavior between Web and Flutter.

---

## ADR-003: Single Identity (`auth.users`) with Role-Based Profiles and Domain Extension Tables

- **Status:** Accepted
- **Context:** EasyLife serves households, service professionals, businesses/landlords, and platform admins.
- **Decision:** Every user authenticates via `auth.users` and has a 1:1 row in `public.profiles` containing their primary `role` (`customer`, `professional`, `business`, `property_manager`, `admin`). Role-specific attributes live in extension tables (`public.professional_profiles`, `public.business_accounts`).
- **Consequences:**
  - **Positive:** Enables unified authentication, messaging, and notifications across all user types while avoiding nullable column bloat on `public.profiles`.

---

## ADR-004: Decoupled Flutter Workspace (`apps/mobile`) Inside the Same Git Monorepo

- **Status:** Accepted
- **Context:** Combining Node.js (`package.json` workspaces) with Flutter/Dart (`pubspec.yaml`, Gradle, CocoaPods) can cause IDE indexing loops and `node_modules` conflicts if Flutter is added to npm workspaces.
- **Decision:** Keep `apps/mobile` in the same Git repository (`easylife/apps/mobile`) for unified version control, while restricting root `package.json` `workspaces` to `["apps/web", "packages/shared-types", "packages/shared-config"]`.
- **Consequences:**
  - **Positive:** Clean builds for both Next.js and Flutter without cross-ecosystem dependency conflicts.

---

## ADR-005: Database-Enforced Trust Signals (Verified Badges & Reviews)

- **Status:** Accepted
- **Context:** Development Rule 18 strictly forbids fake customer reviews, fake verified professionals, or fabricated transaction records.
- **Decision:**
  - `professional_profiles.verification_status` defaults to `'unsubmitted'` and can only transition to `'approved'` through an `admin`-authenticated server action/RPC that simultaneously writes an `audit_logs` record.
  - `public.reviews` has a `UNIQUE (service_request_id)` constraint and an RLS/RPC check requiring `service_requests.status = 'completed'` and `customer_id = auth.uid()`.
- **Consequences:**
  - **Positive:** Cryptographically and relationally impossible for an unverified professional to self-verify or for anyone to insert reviews without a completed job.

---

## ADR-006: Private Supabase Storage with Short-Lived Signed URLs for Sensitive Media

- **Status:** Accepted
- **Context:** Professionals upload government IDs and trade certificates; customers and businesses upload photos of inside their homes and facilities.
- **Decision:** Use private buckets (`verification-documents`, `service-request-media`, `maintenance-and-disputes`) where objects can only be viewed via time-limited signed URLs (`15 minutes`) generated for authorized participants. Only `avatars` and `portfolio-media` are public buckets.
- **Consequences:**
  - **Positive:** Protects Nigerian users' PII, KYC documents, and property photos from unauthorized scraping or URL guessing.

---

## ADR-007: Server-Side AI Problem Categorization with Deterministic Fallback

- **Status:** Accepted
- **Context:** EasyLife uses the OpenAI API for basic AI problem categorization when customers describe an everyday maintenance problem.
- **Decision:** Execute OpenAI classification exclusively in `POST /api/v1/ai/categorize-problem` with structured JSON output mapping to existing `service_categories` slugs and urgency levels (`low`, `normal`, `high`, `emergency`). If `OPENAI_API_KEY` is not configured or the upstream API is unreachable, fall back to a deterministic keyword classifier and allow manual category selection.
- **Consequences:**
  - **Positive:** Protects `OPENAI_API_KEY`, controls token costs (`gpt-4o-mini`), and guarantees 100% booking availability even during third-party AI outages.

---

## ADR-008: Linked Marketplace & Business Maintenance Architecture

- **Status:** Accepted
- **Context:** Businesses and property managers need both internal asset/equipment tracking (`properties`, `equipment_records`, `maintenance_schedules`, `maintenance_logs`) and the ability to hire verified marketplace professionals when maintenance is due.
- **Decision:** Allow `public.service_requests` to optionally reference `business_account_id`, `property_id`, `equipment_id`, and `maintenance_schedule_id`. When such a service request is marked `completed`, the completion RPC automatically records an entry in `public.maintenance_logs` and updates `equipment_records.last_serviced_at`.
- **Consequences:**
  - **Positive:** Connects the B2B maintenance management portal directly with the service professional marketplace without duplicating job workflows.
