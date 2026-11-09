# EasyLife — System Data Flows & State Machines (`DATA_FLOW.md`)

This document defines the exact data flows and database state transitions for EasyLife's critical user journeys across Web, Android, iOS, and the Central Supabase Backend.

---

## 1. Service Request & Booking Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> draft: Customer/Business starts request
    draft --> open: Submitted & validated
    open --> quoted: Verified Professional submits quotation
    quoted --> quoted: Additional quotations received
    quoted --> scheduled: Customer accepts 1 quotation (Atomic RPC)
    open --> cancelled: Cancelled before acceptance
    quoted --> cancelled: Cancelled before acceptance
    scheduled --> in_progress: Professional starts job at appointment
    in_progress --> completed: Pro marks complete + Customer confirms
    scheduled --> disputed: Dispute raised
    in_progress --> disputed: Dispute raised
    completed --> disputed: Post-service dispute window
    disputed --> completed: Admin resolves in favor of completion
    disputed --> cancelled: Admin resolves as cancelled/void
    completed --> [*]
    cancelled --> [*]
```

---

## 2. Authentication & Role Onboarding Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Customer / Pro / Business)
    participant UI as Web or Flutter Client
    participant Auth as Supabase Auth
    participant DB as PostgreSQL (Triggers & RLS)
    participant Storage as Supabase Storage
    participant Admin as Admin Dashboard

    User->>UI: Register with Email, Password, Phone, City, Role
    UI->>Auth: signUp() with user_metadata
    Auth->>DB: Trigger on_auth_user_created()
    DB->>DB: Insert public.profiles (role validated, default status='active')
    opt Role is 'professional'
        DB->>DB: Insert public.professional_profiles (verification_status='unsubmitted')
        User->>UI: Complete Skills, City Coverage & Upload KYC Document
        UI->>Storage: Upload to private 'verification-documents/{uid}/...'
        UI->>DB: Update professional_profiles (verification_status='pending')
        Admin->>DB: Review KYC via Signed URL & Approve
        DB->>DB: Set verification_status='approved', verified_at=now(), insert audit_logs
    end
    opt Role is 'business' or 'property_manager'
        DB->>DB: Insert public.business_accounts (owner_id=auth.uid())
    end
```

---

## 3. Service Booking & AI Problem Categorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Business User
    participant Client as Web / Flutter App
    participant API as Next.js Server (/api/v1/*)
    participant OpenAI as OpenAI API
    participant DB as Supabase PostgreSQL
    participant Notif as Notification Dispatcher

    Customer->>Client: Enters problem description & selects city (e.g. Port Harcourt)
    Client->>API: POST /api/v1/ai/categorize-problem { description, city }
    alt OpenAI API Key Configured & Available
        API->>OpenAI: Structured classification request
        OpenAI-->>API: { categorySlug, urgency, suggestedTitle, summary }
    else Fallback Mode
        API-->>API: Keyword/rule-based fallback classification
    end
    API-->>Client: Returns suggested category & urgency (Customer can confirm/edit)
    Customer->>Client: Confirms details, attaches optional photos, submits request
    Client->>API: POST /api/v1/service-requests
    API->>DB: Validate with Zod -> INSERT into public.service_requests (status='open')
    DB-->>API: Returns created service_request row (id, reference_code)
    API->>Notif: Notify verified professionals in matching city & category
    API-->>Client: Return { success: true, data: serviceRequest }
    Client-->>Customer: Display confirmed Service Request screen
```

---

## 4. Quotation Acceptance & Atomic Scheduling Flow

```mermaid
sequenceDiagram
    autonumber
    actor Pro as Verified Professional
    actor Cust as Customer / Business
    participant Client as Web / Flutter App
    participant API as Next.js Server (/api/v1/*)
    participant RPC as PostgreSQL RPC (accept_quotation_and_schedule)
    participant DB as Supabase PostgreSQL
    participant Notif as Notification Service

    Pro->>API: POST /api/v1/quotations (request_id, amount_ngn, breakdown, proposed_time)
    API->>DB: Verify Pro is 'approved' -> INSERT public.quotations (status='pending')
    API->>DB: UPDATE service_requests SET status='quoted' WHERE id=request_id AND status='open'
    API->>Notif: Notify Customer of new quotation
    Cust->>Client: Reviews quotations & clicks "Accept Quotation"
    Client->>API: POST /api/v1/quotations/[id]/accept
    API->>RPC: SELECT public.accept_quotation_and_schedule(quotation_id, actor_id)
    Note over RPC,DB: Single ACID Transaction:<br/>1. Lock service_request row FOR UPDATE<br/>2. Verify actor_id = request.customer_id & status IN ('open','quoted')<br/>3. Mark accepted quotation status='accepted'<br/>4. Mark all other pending quotations on request status='declined'<br/>5. Update service_request status='scheduled', accepted_quotation_id=id<br/>6. Insert public.appointments row (status='scheduled')<br/>7. Insert public.audit_logs row
    RPC-->>API: Returns { appointment_id, service_request_id, professional_id }
    API->>Notif: Send appointment confirmation to Pro & Customer (In-App + Email + Push)
    API-->>Client: Return { success: true, data: appointment }
```

---

## 5. Job Completion & Verified Review Flow

```mermaid
sequenceDiagram
    autonumber
    actor Pro as Assigned Professional
    actor Cust as Customer / Business
    participant Client as Web / Flutter App
    participant API as Next.js Server / RPC
    participant DB as Supabase PostgreSQL
    participant Notif as Notification Service

    Pro->>Client: Marks job work finished (with completion notes)
    Client->>API: POST /api/v1/appointments/[id]/complete (stage: 'pro_marked_complete')
    API->>DB: Record pro_completed_at = now() on appointment
    API->>Notif: Prompt Customer to inspect & confirm completion
    Cust->>Client: Confirms job satisfactorily completed
    Client->>API: POST /api/v1/appointments/[id]/complete (stage: 'customer_confirmed')
    Note over API,DB: Atomic Completion RPC:<br/>1. Set appointments.status = 'completed', completed_at = now()<br/>2. Set service_requests.status = 'completed'<br/>3. Increment professional_profiles.completed_jobs_count<br/>4. If linked to business equipment/schedule, insert public.maintenance_logs & advance next_due_date<br/>5. Insert public.audit_logs
    API->>Notif: Notify Pro of confirmed completion & invite Customer to leave verified review
    Cust->>Client: Submits 1-5 Star Rating & Written Review
    Client->>DB: rpc('submit_verified_review', { request_id, rating, comment })
    Note over DB: Verifies request.status='completed' & customer_id=auth.uid()<br/>Inserts public.reviews (UNIQUE on service_request_id)<br/>Recalculates professional_profiles.average_rating & review_count
    DB-->>Client: Review published on Professional Profile
```

---

## 6. Business & Property Maintenance Flow

```mermaid
flowchart TD
    BizAccount["1. Business / Property Manager Account\n(public.business_accounts)"] --> Property["2. Register Property / Facility\n(Port Harcourt, Lagos, or Abuja)\n(public.properties)"]
    Property --> Equipment["3. Register Equipment Asset\n(Generator, HVAC, Pump, Electrical, Solar)\n(public.equipment_records)"]
    Equipment --> Schedule["4. Configure Preventive Maintenance Schedule\n(Frequency: Monthly / Quarterly / Custom)\n(public.maintenance_schedules)"]
    Schedule --> TriggerRequest["5. Convert Due Schedule or Breakdown\ninto Service Request\n(public.service_requests linked to property_id & equipment_id)"]
    TriggerRequest --> MarketplaceFlow["6. Quotation -> Appointment -> Job Execution\nby Verified Professional"]
    MarketplaceFlow --> MaintLog["7. Automatic Maintenance History Entry\n(public.maintenance_logs)\nUpdates equipment last_serviced_at & schedule next_due_date"]
```

---

## 7. Multi-Channel Notification Delivery Flow

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Server Action / API Route
    participant NotifSvc as Notification Dispatcher (Server-Only)
    participant DB as Supabase PostgreSQL
    participant Realtime as Supabase Realtime
    participant Resend as Resend Email API
    participant FCM as Firebase Cloud Messaging

    Caller->>NotifSvc: dispatchNotification({ userId, type, title, body, link, sendEmail, sendPush })
    NotifSvc->>DB: INSERT into public.notifications (is_read = false)
    DB-->>Realtime: Broadcast INSERT to subscribed Web & Flutter clients
    par Email Delivery (if sendEmail = true & RESEND_API_KEY configured)
        NotifSvc->>DB: Lookup user email from auth/profile
        NotifSvc->>Resend: POST /emails (Branded Navy/Teal HTML template)
        Resend-->>NotifSvc: Returns messageId or error
    and Push Delivery (if sendPush = true & Firebase configured)
        NotifSvc->>DB: SELECT active fcm_tokens FROM public.user_devices WHERE user_id = userId
        NotifSvc->>FCM: Send multicast push notification to Android/iOS devices
        FCM-->>NotifSvc: Returns delivery results (prune invalid tokens)
    end
    NotifSvc-->>Caller: Returns notification record (never fails parent DB transaction)
```
