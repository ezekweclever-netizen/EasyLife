# EasyLife — Production Deployment Guide (Staged Rollout)

**Platform:** EasyLife (`apps/web` Next.js 15 + Supabase PostgreSQL/Auth/Storage)  
**Target Operating Hubs:** Port Harcourt (Rivers State), Lagos State, Abuja (FCT)  
**Deployment Model:** Two-Phase Controlled Rollout (Web Pilot First -> Mobile After Approval)

---

## 1. Staged Rollout Policy

1. **Phase 1 — Web Deployment & Live Pilot Testing (Active)**
   - Deploy `apps/web` to Vercel Production connected to the central production Supabase project.
   - Operate a live web pilot across **Port Harcourt, Lagos, and Abuja** for 10–14 days.
   - Monitor stability, authentication, bookings, quotations, notifications, and admin operations.
2. **Phase 2 — Android & iOS Store Distribution (On Hold Until Approval)**
   - **Must remain paused** until Phase 1 testing passes and explicit stakeholder authorisation is granted.
   - Mobile builds will connect to the exact same production Supabase backend (`ng.easylife.app://login-callback`).

---

## 2. Repository & Vercel Project Configuration

### Build Settings (Monorepo Root)
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (`npm --workspace=@easylife/web run build`)
- **Install Command:** `npm install`
- **Output Directory:** `apps/web/.next`
- **Node.js Runtime:** `20.x` or `24.x` (`>=20.0.0`)

### Production Security Headers (`apps/web/vercel.json`)
The repository includes [`apps/web/vercel.json`](file:///c:/Users/HP/Documents/EasyLife/apps/web/vercel.json) enforcing:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### GitHub Integration Steps
1. Push repository branch `main` (or `master`) to GitHub.
2. Link repository in Vercel Dashboard -> **Settings → Git → Connect Git Repository**.
3. Set **Production Branch** to `main` (or `master` matching repository default).
4. Preview deployments automatically generate per pull request and non-production branch push.

---

## 3. Production Environment Variables (Vercel)

Configure these in **Vercel Project → Settings → Environment Variables** scoped per environment (`Production`, `Preview`):

| Variable | Scope | Required | Notes |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public / Client & Server | **Yes** | Set to production origin (e.g. `https://easylife.ng` or assigned Vercel URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client & Server | **Yes** | Central Supabase project HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | **Yes** | Supabase public anonymous key (governed strictly by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** (Sensitive) | **Yes** | Server-side admin operations only. Never prefix with `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | **Server Only** (Sensitive) | Recommended | Powers AI Diagnostic & Quotation Assistants via Server Actions |
| `OPENAI_MODEL` | **Server Only** | Optional | Defaults to `gpt-4o-mini` |
| `RESEND_API_KEY` | **Server Only** (Sensitive) | Recommended | Transactional emails (verification, bookings, quotations, disputes) |
| `RESEND_FROM_EMAIL` | **Server Only** | Recommended | Verified sender domain address (e.g. `EasyLife <no-reply@easylife.ng>`) |
| `PAYSTACK_SECRET_KEY` | **Server Only** (Sensitive) | Future / Pilot Hold | Required only when online checkout escrow is activated |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Future / Pilot Hold | Public Paystack checkout key |
| `PAYMENTS_ENABLED` | **Server Only** | Optional | Keep `false` during initial escrow pilot until Paystack merchant KYC finishes |
| `MAPS_PROVIDER` | **Server Only** | Optional | `osm` (OpenStreetMap default), `google`, or `local` |
| `GOOGLE_MAPS_API_KEY` | **Server Only** (Sensitive) | Optional | Used only when `MAPS_PROVIDER=google` |

---

## 4. Production Supabase Backend Verification

1. **Database Migrations:** Ensure all 18 numbered SQL migrations (`supabase/migrations/20261104000100` through `20261104001800`) are applied cleanly.
2. **Storage Buckets & Access Policies:**
   - `verification-documents` (Private, RLS scoped to owning professional + verified admins)
   - `booking-attachments` (Private, RLS scoped to booking participants + admins)
   - `avatars` (Public read, authenticated owner write)
3. **Administrator Access Provisioning:**
   - Authorized platform administrator (`ezekweclever@gmail.com`) is assigned `primary_role = 'admin'` in `public.profiles` and active `'admin'` record in `public.user_roles`.
   - Protected `/admin/*` console uses dedicated sign-in at `/admin/login` enforced by `verifyAdminSession()`.
4. **Authentication Redirect URLs (Supabase Dashboard → Authentication → URL Configuration):**
   - **Site URL:** `https://<production-domain>`
   - **Redirect URLs allowlist:**
     - `https://<production-domain>/auth/callback`
     - `https://<production-domain>/auth/callback/session`
     - `http://localhost:3005/auth/callback` (development)
     - `ng.easylife.app://login-callback` (Phase 2 Flutter mobile)
5. **Backups:** Verify Supabase daily automated snapshots (and Point-in-Time Recovery if on Pro plan) are active per `BACKUP_AND_RECOVERY.md`.

---

## 5. Google OAuth Configuration Guide

To enable "Continue with Google" across Web and Mobile:
1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → OAuth consent screen**:
   - Select **External**, fill **EasyLife Nigeria**, add support email, authorized domains (`supabase.co` and production domain), and privacy/terms links (`/privacy-policy`, `/terms-of-service`).
2. Navigate to **Credentials → Create Credentials → OAuth Client ID → Web application**:
   - **Authorized JavaScript origins:** Production domain (`https://<domain>`) and Supabase URL.
   - **Authorized redirect URIs:** `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy **Client ID** and **Client Secret** into **Supabase Dashboard → Authentication → Providers → Google**, toggle **Enable Sign in with Google**, and click **Save**.
4. **Resilience Behaviour:** Until Google credentials are activated in Supabase Dashboard, EasyLife checks `/auth/v1/settings` cleanly and shows an informative notice instructing users to sign in with email and password rather than failing with a raw HTTP error.

---

## 6. Custom Domain & DNS Setup

1. Add custom domain (`easylife.ng`, `www.easylife.ng`) in **Vercel → Project Settings → Domains**.
2. Point DNS records at registrar:
   - Apex (`@`): `A` record to Vercel IP (`76.76.21.21` or Vercel-assigned anycast record).
   - Subdomain (`www`): `CNAME` to `cname.vercel-dns.com`.
3. Confirm automatic Let's Encrypt TLS certificate issuance and HTTPS redirect.
4. For Resend transactional email deliverability, add SPF (`TXT`), DKIM (`CNAME`/`TXT`), and DMARC (`TXT`) records from the Resend dashboard for `@easylife.ng`.

---

## 7. Health & Smoke Verification

After each deployment:
- Verify `GET /api/health` returns HTTP `200` with `"database": "connected"` and `"hubs": ["Port Harcourt", "Lagos", "Abuja"]`.
- Verify `/explore-services` returns verified professionals across Port Harcourt, Lagos, and Abuja.
- Verify `/admin` redirects unauthenticated visitors to `/admin/login`.
