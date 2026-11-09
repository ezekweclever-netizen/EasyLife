# EasyLife — Incremental Development Roadmap

Every development stage follows the mandatory EasyLife workflow:
1. Inspect relevant existing code.
2. Explain the proposed implementation.
3. Make the changes.
4. Run relevant tests & typechecks.
5. Resolve errors.
6. Report completed functionality, remaining issues, and next-stage dependencies.

A feature is marked complete **only** when its frontend, backend, database permissions (RLS), input validation, and verification tests work end-to-end.

---

## Stage 0 — Project Inspection & Development Environment (Current — Completed)
- Audit repository, Git state, and local developer toolchains.
- Establish monorepo layout (`apps/web`, `apps/mobile`, `packages/shared-types`, `packages/shared-config`, `supabase/`, `docs/`, `scripts/`).
- Configure shared design tokens (Deep Navy, Teal, White, Light Grey) and shared TypeScript types.
- Verify local build and execution of the Next.js web foundation.

## Stage 1 — Database Schema, Row Level Security & Storage Architecture
- Design and write versioned PostgreSQL migrations in `supabase/migrations/`:
  - Core identity: `profiles`, user roles (`customer`, `professional`, `business`, `property_manager`, `admin`).
  - Service catalog & locations: `service_categories`, pilot cities (`Port Harcourt`, `Lagos`, `Abuja`), service areas.
  - Professional domain: `professional_profiles`, `professional_services`, `verification_documents`.
  - Marketplace workflows: `service_requests`, `quotations`, `appointments`, `job_completions`.
  - Trust & communication: `conversations`, `messages`, `notifications`, `reviews`, `disputes`.
  - Business & property maintenance: `business_accounts`, `properties`, `equipment_records`, `maintenance_schedules`, `maintenance_logs`.
- Configure strict Row Level Security (RLS) policies and Supabase Storage bucket policies.
- Provide development-only seed data (`supabase/seed/`) clearly isolated from production.

## Stage 2 — Authentication, Role-Based Access & Onboarding
- Supabase Auth integration (SSR cookie session management in Next.js + client auth guard).
- Registration, sign-in, password reset, and role selection flows.
- Role-based middleware and route protection for Customer, Professional, Business, and Admin portals.
- Professional onboarding and verification document upload workflow.

## Stage 3 — Service Discovery, Profiles & AI Problem Categorization
- Public & customer service catalog with category filtering and location-based search (Port Harcourt, Lagos, Abuja).
- Verified professional profile pages (skills, verification status, completed job metrics, authentic reviews).
- Server-side OpenAI integration for natural-language problem categorization (suggesting service category, urgency, and structured problem summary with graceful fallback if API key is not configured).

## Stage 4 — Service Requests, Quotations, Appointments & Job Completion
- Customer service request creation (with photos, location, preferred schedule, and AI categorization context).
- Professional quotation submission, customer acceptance/decline workflow.
- Appointment scheduling, status transitions, and job completion sign-off by both parties.

## Stage 5 — Messaging, Notifications, Reviews & Dispute Management
- Real-time in-app messaging between customers/businesses and professionals using Supabase Realtime.
- In-app notifications center + server-side Resend transactional email hooks and FCM push notification hooks.
- Post-completion verified customer review system.
- Dispute filing and evidence submission workflow.

## Stage 6 — Business & Property Maintenance Management Portal
- Business account and multi-property registration (for SMBs, landlords, and property managers).
- Equipment & asset registry per property (HVAC, generators, plumbing, electrical systems, etc.).
- Preventive maintenance schedule creation and automated/manual service request generation.
- Comprehensive maintenance history and cost/service log tracking.

## Stage 7 — Administrator Dashboard
- Professional verification review queue (inspect uploaded documents, approve/reject with reason).
- User, professional, and business account oversight.
- Service category management.
- Dispute resolution and arbitration console.

## Stage 8 — Flutter Mobile Application (`apps/mobile`)
- Connect Flutter app to central Supabase backend (`supabase_flutter`).
- Implement shared Deep Navy & Teal theme, authentication, Customer flow, and Professional flow for Android and iOS.
- Configure Firebase Cloud Messaging (FCM) client handlers.

## Stage 9 — End-to-End QA, Security Audit & Deployment Readiness
- Comprehensive verification of critical user journeys across all 4 roles.
- RLS security audit, accessibility review, mobile responsiveness verification, and Vercel/production deployment checklist.
