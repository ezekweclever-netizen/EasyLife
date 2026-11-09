# EasyLife — Professional Onboarding & KYC Verification Standard Operating Procedure

**Applies To:** Trade Technicians, Independent Artisans, Dispatch Riders, Property Consultants, and Service Businesses  
**Service Hubs:** Port Harcourt, Lagos, Abuja

---

## 1. Professional & Business Onboarding Procedure

### Step 1: Account Creation & Role Selection
1. Candidate visits `/register?role=professional` (or `/become-a-professional`) using email/password or Google Sign-In.
2. Selects primary operating hub (`Port Harcourt`, `Lagos`, or `Abuja`).
3. Accepts the EasyLife Terms of Service, Privacy Policy, and **Verification Policy** (`/verification-policy`).

### Step 2: Trade & Coverage Setup (`/pro/register`)
1. Candidate selects Provider Type (`Trade Technician`, `Dispatch Rider`, `Property Consultant`, or `General Artisan`).
   - *Property Consultants* must accept the mandatory anti-listing compliance attestation confirming EasyLife hosts **no property rentals/sales advertisements**.
2. Enters Business/Trade Name, concise headline, years of field experience, detailed capabilities bio, and starting call-out diagnosis fee (₦ NGN).
3. Selects primary service category and operating Local Government Areas / Districts.
4. Sets weekly operating availability window.

### Step 3: Multi-Service Catalogue Setup (`/pro/profile`)
1. After onboarding, professionals can configure **multiple distinct service offerings** within one category or across categories (e.g., *Generator Minor Servicing — ₦15,000*, *Automatic Transfer Switch Installation — ₦35,000+*).
2. Each entry specifies a clear service title, category classification, starting Naira price (optional upper estimate), and included scope description so customers can discover specific capabilities in `/explore-services`.

### Step 4: KYC Document Submission (`/pro/profile`)
Upload clear, legible scans/photos (PDF, JPG, PNG; max 5MB per document) to private `verification-documents` storage:
1. **Mandatory Government Photo ID:** Nigerian NIN Slip / National e-ID Card, Valid Driver's Licence, Permanent Voter's Card (PVC), or International Passport.
2. **Proof of Physical Address:** Recent PHCN/electricity utility bill, bank statement, or tenancy document matching stated operating hub.
3. **Trade / Corporate Credentials:**
   - Trade certificate, guild membership, NABTEB/City & Guilds qualification, or past client reference for individuals.
   - CAC Certificate (BN/RC) for registered businesses.

---

## 2. Administrator Verification Checklist (`/admin/verifications`)

Before setting any professional's status to **`verified`** (which unlocks the **Verified Pro** badge and full marketplace prominence), operations reviewers MUST check:

| Check # | Inspection Criterion | Pass Standard |
| :---: | :--- | :--- |
| **1** | **Document Legibility** | Photo, full name, and identification number clearly readable; no cropped corners or blurry screenshots. |
| **2** | **Identity Consistency** | Full name on Government ID matches EasyLife `profiles.full_name` and bank/contact details. |
| **3** | **Hub & Address Alignment** | Proof of address falls within one of the declared operating hubs (Port Harcourt, Lagos, or Abuja) and matches service areas. |
| **4** | **Trade Scope Validity** | Declared service categories and titles align with real qualifications/experience; no prohibited or medical services listed. |
| **5** | **Anti-Listing Policy Check** | For property consultants, verify bio/service titles describe consulting/management only — zero "for rent / for sale" advertisements. |
| **6** | **Risk Flag Clearances** | Check `/admin/risk-flags` for duplicate accounts, flagged phone numbers, or suspicious pricing anomalies. |
| **7** | **Phone / Orientation Call** | Operations desk conducts brief 3-minute verification call confirming identity, hub coverage, transparent quoting etiquette, and 4-digit Completion PIN rules. |

### Review Outcomes
- **`approved` (`verified`):** Triggers welcome verification notification + email, enables **Verified Pro** badge, grants full search visibility.
- **`rejected`:** Requires explicit, actionable `rejection_reason` stored in `verification_requests` & audit logs (e.g. *"Uploaded NIN photo is blurred; please re-upload a clear copy under good lighting"*). Professional can re-submit immediately.
- **`suspended`:** Reserved for policy violations, identity fraud, or unresolved safety incidents. Documented in immutable `audit_logs`.
