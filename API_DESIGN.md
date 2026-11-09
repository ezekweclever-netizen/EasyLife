# EasyLife — API & Database Access Design (`API_DESIGN.md`)

## 1. Execution Boundary Decision Matrix

To avoid unnecessary microservices while keeping secret keys and multi-step business rules strictly protected, every operation in EasyLife is assigned to one of **three explicit execution tiers**:

| Tier | Execution Mechanism | When to Use | Security Enforcement |
| :--- | :--- | :--- | :--- |
| **Tier 1: Direct Supabase Client (`PostgREST + RLS`)** | `@supabase/ssr` (Web) or `supabase_flutter` (Mobile) querying tables/views directly | Single-table reads, filtered catalog/location discovery, reading own records, or simple user-owned inserts/updates. | Enforced by PostgreSQL Row Level Security (RLS) policies + column constraints. |
| **Tier 2: Transactional Database RPC (`supabase.rpc(...)`)** | PostgreSQL functions executed within a single ACID transaction | Multi-table atomic state transitions where partial updates would corrupt business state (e.g., accepting a quotation and creating an appointment). | Function checks `auth.uid()`, participant ownership, and current state machine transitions atomically. |
| **Tier 3: Protected Server Endpoints (`/api/v1/*` / Server Actions)** | Next.js Route Handlers (for Web + Flutter) & Server Actions (for Web forms) | Operations requiring third-party secret keys (OpenAI, Resend, FCM, Paystack), admin verification actions with email dispatch, or cross-user orchestration. | Bearer JWT / Session verification + Zod schema validation + Server-only API keys. |

---

## 2. Operation-by-Operation Boundary Mapping

| Domain Feature | Operation | Execution Tier | Reason |
| :--- | :--- | :--- | :--- |
| **Auth & Profile** | Sign up, sign in, sign out, session refresh | **Tier 1 (Supabase Auth)** | Native JWT lifecycle & OTP handling. |
| **Auth & Profile** | Read/update own profile (`full_name`, `phone`, `city`) | **Tier 1 (Direct + RLS)** | Simple single-row update where `id = auth.uid()`; `role` column is locked by trigger/policy. |
| **Discovery** | List service categories, filter verified professionals by city (`Port Harcourt`, `Lagos`, `Abuja`) & category | **Tier 1 (Direct + RLS)** | Fast read-only queries against indexed views (`verified_professionals_directory`). |
| **AI Categorization** | Analyze natural-language problem description -> suggest category, urgency & summary | **Tier 3 (`POST /api/v1/ai/categorize-problem`)** | Requires server-only `OPENAI_API_KEY` + rate limiting + structured JSON schema output. |
| **Professional Onboarding** | Submit professional profile & upload KYC metadata | **Tier 1 / Tier 3** | File uploaded to private `verification-documents` bucket; submission sets status to `pending` and notifies admins via Tier 3. |
| **Admin Verification** | Approve or reject professional verification submission | **Tier 3 (`POST /api/v1/admin/verifications/[id]/decision`)** | Requires `admin` role verification, atomic update of `professional_profiles.verification_status`, audit log insert, and Resend/FCM notification to the professional. |
| **Service Requests** | Create service request (Customer or Business) | **Tier 3 (`POST /api/v1/service-requests`)** | Validates inputs with Zod, inserts request, logs audit event, and dispatches notifications to matching verified professionals in that city. |
| **Quotations** | Professional submits quotation for an open request | **Tier 3 (`POST /api/v1/quotations`)** | Verifies professional is `approved`, inserts quotation, updates request status to `quoted` if needed, and notifies customer via Email/Push. |
| **Quotation Acceptance** | Customer accepts a quotation | **Tier 2 (`rpc('accept_quotation_and_schedule')`) + Tier 3 Notification** | **Must be atomic:** marks chosen quotation `accepted`, declines competing pending quotations on that request, updates request to `scheduled`, and creates the `appointments` row in one transaction. |
| **Appointments** | Reschedule or update appointment status (`confirmed`, `in_progress`) | **Tier 2 (`rpc('transition_appointment_status')`)** | Enforces state machine rules and records timestamped transition history. |
| **Job Completion** | Professional marks job complete / Customer confirms completion | **Tier 2 (`rpc('confirm_job_completion')`) + Tier 3 Notification** | Atomically updates appointment & service request to `completed`, updates maintenance log if linked to business equipment, and unlocks review eligibility. |
| **Reviews** | Customer submits rating & review for a completed job | **Tier 2 (`rpc('submit_verified_review')`)** | Enforces Rule 18: verifies `service_request.status = 'completed'`, `customer_id = auth.uid()`, no duplicate review, inserts review, and recalculates professional's aggregate rating atomically. |
| **Messaging** | Load conversation history & send message | **Tier 1 (Direct + RLS + Supabase Realtime)** | Low-latency chat; RLS ensures only conversation participants can read or insert messages. |
| **Disputes** | Open dispute / Admin resolves dispute | **Tier 3 (`POST /api/v1/disputes` & `/resolve`)** | Transitions request to `disputed`, locks payout/completion state, writes audit log, and alerts admin & counterparty. |
| **Business Maintenance** | CRUD properties, equipment records, and preventive schedules | **Tier 1 (Direct + RLS) & Tier 2 (`rpc('log_maintenance_completion')`)** | Scoped strictly to `business_account_id` members via RLS; converting a due schedule into a service request uses an atomic RPC. |
| **Payments (Future/Hook)** | Initialize Paystack transaction & process webhook | **Tier 3 (`POST /api/v1/payments/initialize` & `/webhook`)** | Requires `PAYSTACK_SECRET_KEY` and HMAC SHA-512 signature verification (`x-paystack-signature`). |

---

## 3. Protected Server API Specification (`/api/v1/*`)

All `/api/v1/*` endpoints live in `apps/web/src/app/api/v1/` and are consumed by **both** the Next.js web application and the Flutter mobile app.

### 3.1 Authentication Header Contract
- **Web Clients:** Automatically send Supabase session cookies (or `Authorization: Bearer <access_token>`).
- **Flutter Mobile Clients:** Send `Authorization: Bearer <supabase_access_token>` on every `/api/v1/*` request.
- Server route middleware extracts the token and validates it via `supabase.auth.getUser(token)`—never trusting decoded unverified JWT payloads.

### 3.2 Standardized JSON Response Envelope
Every endpoint returns HTTP status codes paired with a strict JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01j9z...",
    "timestamp": "2026-11-04T00:15:00.000Z"
  }
}
```

On validation, authorization, or operational failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {
      "city": ["City must be one of Port Harcourt, Lagos, or Abuja"]
    },
    "requestId": "req_01j9z..."
  }
}
```

### 3.3 Core `/api/v1/*` Endpoint Catalog

| Method & Path | Allowed Roles | Purpose |
| :--- | :--- | :--- |
| `GET /api/v1/health` | Public | Health check & database connectivity readiness check. |
| `POST /api/v1/ai/categorize-problem` | `customer`, `business`, `property_manager` | Accepts `{ description, city }` and returns AI-inferred `{ categorySlug, urgency, suggestedTitle, safetyNotes, confidence }`. |
| `POST /api/v1/service-requests` | `customer`, `business`, `property_manager` | Creates a validated service request (optionally linked to a business property/equipment record) and notifies matching professionals. |
| `POST /api/v1/quotations` | `professional` (Verified only) | Submits an itemized quotation (`labor_cost`, `materials_cost`, `estimated_duration`, `notes`) for an open request. |
| `POST /api/v1/quotations/[id]/accept` | `customer`, `business`, `property_manager` | Invokes `accept_quotation_and_schedule` RPC and sends confirmation emails/push notifications. |
| `POST /api/v1/appointments/[id]/complete` | `professional`, `customer`, `business`, `property_manager` | Records professional completion or customer sign-off and triggers review/maintenance log updates. |
| `POST /api/v1/disputes` | `customer`, `professional`, `business`, `property_manager` | Opens a formal dispute against a scheduled/in-progress/completed job with evidence attachments. |
| `POST /api/v1/admin/verifications/[id]/decision` | `admin` | Approves or rejects a professional's KYC/verification application, logs audit trail, and emails the professional. |
| `POST /api/v1/admin/disputes/[id]/resolve` | `admin` | Records official dispute arbitration outcome, updates job status, and notifies both parties. |
| `POST /api/v1/notifications/register-device` | All authenticated roles | Registers or refreshes a Flutter/Web FCM device push token in `public.user_devices`. |
| `POST /api/v1/payments/paystack/webhook` | Paystack Server (HMAC Verified) | Future-ready webhook handler verifying `x-paystack-signature` before recording payment state. |

---

## 4. Database Query & Pagination Conventions

1. **Cursor & Range Pagination:** All list queries (service requests, professional directory, maintenance history, admin queues) enforce bounded page sizes (`DEFAULT 20`, `MAX 50`) using `.range(from, to)` or cursor timestamps (`created_at < cursor`).
2. **Explicit Column Selection:** Queries specify required columns rather than unbounded `SELECT *` on joined tables.
3. **Idempotency Keys:** Mutation requests (`POST /api/v1/service-requests`, `POST /api/v1/quotations`) accept an optional `Idempotency-Key` header (or client-generated UUID) to prevent duplicate bookings on flaky mobile networks in Nigeria.
