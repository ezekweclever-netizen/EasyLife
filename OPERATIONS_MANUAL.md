# EasyLife — Marketplace Operations Manual (Admin Console & Incident Response)

**Console URL:** `/admin` (Authentication required via `/admin/login`)  
**Authorized Roles:** `admin` (`profiles.primary_role = 'admin'` & active `user_roles` entry)  
**Regional Coverage:** Port Harcourt (Rivers State), Lagos State, Abuja (FCT)

---

## 1. Daily Operations Cadence (Web Pilot Phase 1)

### Morning Check (09:00 WAT)
1. Check `GET /api/health` & Vercel deployment status -> confirm zero 5xx spikes and healthy Supabase connectivity.
2. Open `/admin` Dashboard Overview:
   - Inspect **Pending Verification Requests** -> clear queue within SLA (< 24 hours).
   - Inspect **Open Disputes** -> prioritize P1/P2 active job conflicts.
   - Check `/admin/risk-flags` -> review any automated duplicate-account, rapid cancellation, or suspicious booking alerts.

### Mid-Day Dispatch Audit (13:00 WAT)
1. Review `/admin/bookings` for unquoted `open` requests older than 4 hours across Port Harcourt, Lagos, or Abuja hubs.
2. Proactively alert verified specialists in matching service categories and hub areas.

### End-of-Day Reconciliation (17:30 WAT)
1. Inspect `/admin/audit-logs` to confirm all admin approvals, suspensions, commission updates, and dispute rulings are cleanly attributed.
2. Log pilot metrics toward Phase 1 goals (registered pros, verified pros, customer signups, completed jobs).

---

## 2. Administrative Console Modules (`/admin`)

| Module | Operational Purpose | Required Governance Rule |
| :--- | :--- | :--- |
| **Users (`/admin/users`)** | Search accounts, inspect metadata, suspend/reactivate abusive users | Suspensions **must** record an explicit written reason |
| **Professionals (`/admin/professionals`)** | View trades, ratings, completion rates, service hubs | Do not manually override ratings or falsify completed job counts |
| **Verifications (`/admin/verifications`)** | Inspect KYC uploads (`NIN`, CAC, utility bill), approve/reject | Follow 7-point checklist in `PROFESSIONAL_ONBOARDING.md` |
| **Businesses (`/admin/businesses`)** | Manage corporate/facility accounts and directory listings | Ensure business directory listings show verified services |
| **Categories (`/admin/categories`)** | Activate, configure, and set baseline commission bps per trade | Keep category slugs synchronized across web & mobile |
| **Bookings & Quotations** | Monitor end-to-end fulfillment across all 3 cities | Track time-to-first-quote and customer PIN completion |
| **Disputes (`/admin/disputes`)** | Case mediation, evidence inspection, binding status resolution | Document decision rationale for both parties |
| **Reviews (`/admin/reviews`)** | Moderate abusive/fraudulent text while preserving honest criticism | Never censor legitimate low ratings without policy violation proof |
| **Risk Flags (`/admin/risk-flags`)** | Triage rule-based anti-fraud signals | Escalate confirmed collusion or fake-account rings immediately |
| **Commissions & Settings** | Configure fee structure and platform policy switches | Log all financial rate changes cleanly |

---

## 3. Dispute Handling Procedure

1. **Freeze Status (`disputed`):** When a customer or professional raises a dispute on a booking, escrow release pauses automatically (`funds held pending arbitration`).
2. **Evidence Collection (Within 2 Hours):**
   - Review original booking scope, itemised quotation breakdown, in-app message thread, check-in timestamps, and uploaded before/after photos.
   - Contact both parties separately by phone/email if photo evidence is ambiguous.
3. **Mediation & Options:**
   - **Option A — Rework Directive:** Assign remediation deadline (24–48 hrs) for professional to fix minor defects at zero extra cost.
   - **Option B — Partial Adjustment / Split Settlement:** Approved when agreed materials were supplied cleanly but labour scope remained incomplete.
   - **Option C — Full Customer Refund & Account Strike:** Applied on confirmed no-show, misrepresentation, or gross negligence.
4. **Closure:** Record outcome notes in `/admin/disputes`, trigger status update notifications to both parties, and document irreversible action in `audit_logs`.

---

## 4. Incident Reporting & Severity Classification

| Severity | Definition | Response Protocol |
| :--- | :--- | :--- |
| **SEV-1 (Critical Outage / Security Breach)** | Site unreachable (`5xx`), database outage, unauthorized admin access, credential exposure | Immediate rollback via `vercel rollback`, rotate compromised keys immediately, notify leadership within 15 minutes |
| **SEV-2 (Major Degradation)** | Login/OAuth failing, booking submission error, email provider down | Diagnose via Vercel logs (`vercel logs`) + Supabase logs; deploy hotfix to preview, verify, then promote |
| **SEV-3 (Minor / Isolated Bug)** | Non-critical UI glitch, single directory filter edge case, typo | Log in bug tracker, batch into next tested release |
| **SEV-4 (Operational Inquiry)** | Non-technical support ticket or category addition request | Handle within normal 1-business-day SLA |

### Incident Post-Mortem Template
For every SEV-1 or SEV-2 incident, record in writing within 48 hours:
1. Summary & detection timestamp
2. Affected services/hubs
3. Root cause analysis
4. Remediation deployed
5. Preventive guardrails added to test suite
