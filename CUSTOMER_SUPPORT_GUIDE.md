# EasyLife — Customer Support & Issue Escalation Guide

**Channels:** In-App AI Support Assistant, Platform Contact Desk (`/contact`), Support Email (`support@easylife.ng`), Urgent Dispute Queue (`/admin/disputes`)  
**Supported Pilot Hubs:** Port Harcourt • Lagos • Abuja

---

## 1. Support Triage Tiers & SLA Targets

| Priority Tier | Examples | Initial Response SLA | Target Resolution SLA |
| :--- | :--- | :--- | :--- |
| **P1 — Urgent Safety / Active Payment Dispute** | Property damage claim, physical safety concern, premature PIN dispute, suspected fraud | **Under 30 minutes** (business hours) | **Same day / 24 hours** |
| **P2 — Active Booking Disruption** | Technician no-show at confirmed slot, mid-job disagreement, urgent cancellation | **Under 2 hours** | **Within 24 hours** |
| **P3 — Account, Quotation & Technical Help** | Login/Google OAuth guidance, upload errors, quotation clarification, verification updates | **Within 4 hours** | **1–2 business days** |
| **P4 — Feedback, Privacy & General Inquiries** | Feature suggestions, NDPA account deletion requests, partnership inquiries | **Within 24 hours** | **Within 3–5 business days** (NDPA statutory max 30 days) |

---

## 2. Standard Customer Support Procedures

### A. Registration, Login & Google OAuth Issues
1. Verify account email exists in `/admin/users`.
2. Check suspension status (`is_suspended`): if suspended, check `suspension_reason` before advising customer.
3. For password recovery, guide user to password reset link; confirm Resend delivery status if user did not receive email.
4. If Google OAuth returns pending configuration notice, advise using email/password credentials registered to the same address.

### B. Booking & Quotation Guidance
1. Explain to customers that submitting a service request (`/book` or `/assistant`) is **free** and collects itemised quotations splitting **Labour**, **Materials**, and **Additional Expenses**.
2. Remind customers: **never pay cash directly to unverified personal accounts for platform bookings**. All escrow-protected bookings require completion confirmation via the customer's **4-digit Job Completion PIN**.

### C. AI Support Assistant Escalation Protocol
- The AI Customer Support Assistant (`Feature B`) answers verified questions strictly from approved EasyLife documentation (registration, verification, quotes, appointments, PIN sign-off, disputes).
- Automatic human escalation triggers when:
  - Customer reports active physical damage, theft, safety threats, or financial fraud.
  - Customer expresses dissatisfaction with an open booking or demands a refund.
  - Conversation exceeds 3 unresolved turns or references specific booking reference codes (`EL-...`) requiring live database action.
- Escalated tickets route straight to Operations Support with conversation summary and booking reference attached.

### D. Privacy & Account Deletion Requests (NDPA 2023)
1. Users may request account deletion from `/profile` (web) or Settings (mobile).
2. Records create a statutory entry in `account_deletion_requests`.
3. Verify no active in-progress bookings or open disputes remain before executing irreversible anonymisation/deletion within the statutory window.

---

## 3. Feedback Collection Process

1. **Automated Post-Job Survey:** Every customer completing a job receives an in-app review prompt (1–5 star rating + written feedback on punctuality, workmanship, and pricing accuracy).
2. **Pilot Bi-Daily Outreach:** During the 10–14 day Phase 1 pilot, Operations calls or emails 100% of customers after their first booking to capture qualitative friction points (menu usability, search clarity, quotation turnaround time).
3. **Central Defect & Feedback Log:** All feedback items are logged as **UX Friction**, **Bug**, or **Feature Request**, triaged weekly before Phase 2 mobile release readiness.
