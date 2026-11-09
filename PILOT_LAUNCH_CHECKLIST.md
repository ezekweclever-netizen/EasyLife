# EasyLife — Phase 1 Web Pilot Launch Checklist

**Scope:** Controlled Nigerian Web Pilot (`apps/web` + Central Supabase Backend)  
**Target Service Hubs:** Port Harcourt (Rivers State), Lagos State, Abuja (FCT)  
**Pilot Duration:** 10–14 Days Live Operation  
**Operational Targets:** 50–100 Professionals | 100–300 Customers | 50 Completed Bookings

---

## 1. Pre-Deployment Verification

- [x] Next.js workspace `typecheck` and `npm run build` pass with zero TypeScript or bundler errors.
- [x] All 18 database migrations verified against live Supabase PostgreSQL instance.
- [x] Recognized Nigerian neighbourhoods seeded across all 3 hubs (76 active districts across Port Harcourt, Lagos, and Abuja).
- [x] Multi-service schema enabled on `public.professional_services` (`service_title` + multiple offerings per category/across categories).
- [x] Administrator privileges assigned cleanly via `profiles` + `user_roles`; `/admin` routes strictly protected by `verifyAdminSession()` + `/admin/login`.
- [x] Mobile responsive hamburger navigation enforces background scroll lock, internal scrolling, backdrop dismiss, and Escape close.
- [x] No secrets exposed to client components (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `PAYSTACK_SECRET_KEY` server-only).

---

## 2. Production Environment & Backend Activation

- [ ] Production environment variables populated in Vercel Dashboard (`Production` scope).
- [ ] `NEXT_PUBLIC_APP_URL` updated to production URL.
- [ ] Supabase Auth Redirect URLs updated to production `/auth/callback` and `/auth/callback/session`.
- [ ] Google Cloud OAuth Client ID & Secret configured in Supabase Dashboard → Google Provider *(if omitted, email/password works seamlessly and Google button shows clean guidance)*.
- [ ] `RESEND_API_KEY` + verified domain DNS records configured for live transactional emails.
- [ ] `OPENAI_API_KEY` populated for live LLM problem diagnosis and quotation structuring *(rule-based safe fallback operates automatically if absent)*.
- [ ] Daily Supabase automated backup schedule verified.

---

## 3. Live Production Feature Smoke Tests (Phase 1 Mandatory Gate)

Execute directly against the live production URL after deployment:

1. **Health & Connectivity**
   - [ ] `GET /api/health` returns `200 OK` with `"database": "connected"`.
2. **Public Multi-City Experience**
   - [ ] Homepage (`/`) loads with updated brand lockup, clear value proposition, and neutral PH/Lagos/Abuja messaging.
   - [ ] Mobile viewport (`390x844`) hamburger drawer locks body scroll behind drawer and closes on backdrop click/link click.
   - [ ] `/explore-services` filters properly by Hub (`All Cities`, `Port Harcourt`, `Lagos`, `Abuja`), District/LGA, Category, Rating, and Verification.
   - [ ] `/businesses`, `/dispatch`, `/healthcare`, `/property-services` render cleanly without Port Harcourt-only bias.
3. **Authentication & Security**
   - [ ] Customer registration and email/password login succeed and route to `/dashboard`.
   - [ ] Google Sign-In button behaves cleanly (completes OAuth flow if enabled, or displays graceful notice if pending provider activation).
   - [ ] Unauthenticated request to `/admin` redirects cleanly to `/admin/login`.
   - [ ] Customer account attempting `/admin` is denied cleanly.
   - [ ] Authorized Admin login succeeds via `/admin/login` and loads `/admin` KPIs and governance console.
4. **Marketplace Core Flows**
   - [ ] Professional registers via `/pro/register`, adds multiple distinct services in `/pro/profile`, and uploads KYC document.
   - [ ] Admin approves KYC in `/admin/verifications`; Verified Pro badge and all offered services appear on `/professionals/[id]`.
   - [ ] Customer creates service request (`/book` or `/assistant`), receives professional quotation (`/pro/jobs/[id]`), accepts quotation, sends in-booking message, confirms completion, and submits review.
   - [ ] Business owner registers `/business`, adds property + maintainable equipment + maintenance task.
   - [ ] Dispute creation and admin resolution operate cleanly without breaking escrow states.

---

## 4. 10–14 Day Live Web Pilot Monitoring Plan

- **Daily Checks:** Review Vercel runtime error logs, Supabase Auth logs, Resend email bounce rate, and `/api/health` latency.
- **Weekly Reviews:** Track conversion funnel metrics against operational targets (registered pros vs verified pros, customer bookings vs quotations vs completions).
- **Security Checks:** Audit `/admin/audit-logs` and `/admin/risk-flags` every 48 hours for duplicate accounts or anomalous submissions.

---

## 5. Phase 2 Mobile Release Authorisation Gate (DO NOT SKIP)

**STOP CONDITION:** Do NOT build release AAB/IPA or submit to Google Play / Apple App Store until:
1. All live production website checks above pass over the 10–14 day web pilot window.
2. Critical bugs discovered during web pilot are resolved and verified in production.
3. Explicit stakeholder sign-off is given to commence Phase 2.
