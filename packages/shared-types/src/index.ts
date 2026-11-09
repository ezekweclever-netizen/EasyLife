/**
 * EasyLife Shared Domain Types, API Envelopes & Role Definitions
 * Used across the Next.js Web Application, Server Actions, and API Route Handlers.
 */

export type UserRole =
  | "customer"
  | "professional"
  | "business"
  | "property_manager"
  | "admin";

export type PilotCityName = "Port Harcourt" | "Lagos" | "Abuja";

export type VerificationStatus =
  | "unsubmitted"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type BookingStatus =
  | "draft"
  | "submitted"
  | "pending_pro_response"
  | "quoted"
  | "accepted"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"
  | "open"
  | "scheduled"
  | "pro_marked_complete";

export type ServiceRequestStatus = BookingStatus;

export type QuotationStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "in_progress"
  | "pro_marked_complete"
  | "disputed";

export type DisputeStatus =
  | "open"
  | "under_review"
  | "awaiting_information"
  | "resolved"
  | "rejected"
  | "closed"
  | "resolved_for_customer"
  | "resolved_for_professional";

export type DisputeCategory =
  | "incomplete_work"
  | "poor_workmanship"
  | "quality_issue"
  | "unapproved_charges"
  | "pricing_disagreement"
  | "missed_appointment"
  | "no_show"
  | "property_damage"
  | "safety_concern"
  | "other";

export type DisputeResolutionType =
  | "full_refund"
  | "partial_refund"
  | "release_to_professional"
  | "rework_required"
  | "rejected_unfounded"
  | "mutual_agreement";

export type ReviewModerationStatus = "approved" | "pending" | "flagged" | "rejected";

export type AssetCategory =
  | "air_conditioner"
  | "generator"
  | "inverter"
  | "solar_system"
  | "refrigeration"
  | "pump"
  | "electrical"
  | "other";

export type FaultSeverityLevel = "low" | "medium" | "high" | "critical";

export type MaintenanceRequestStatus =
  | "open"
  | "quote_requested"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface BusinessDashboardMetrics {
  total_properties: number;
  registered_assets: number;
  open_maintenance_requests: number;
  upcoming_maintenance: number;
  overdue_maintenance: number;
  total_expenditure_kobo: number;
  total_expenditure_naira: number;
  recent_activities: Array<{
    id: string;
    activity_type: "record" | "request";
    title: string;
    property_name: string;
    asset_name: string;
    cost_kobo: number;
    activity_date: string;
    status: string;
  }>;
}

export interface AdminDashboardMetrics {
  total_customers: number;
  total_professionals: number;
  verified_professionals: number;
  pending_verification_requests: number;
  total_businesses: number;
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  open_disputes: number;
  platform_revenue_kobo: number;
  platform_revenue_naira: number;
  recent_audit_logs: Array<{
    id: string;
    actor_user_id: string | null;
    actor_email?: string | null;
    actor_name?: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    new_values: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export type MaintenanceFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "annual";

export type ProviderType =
  | "trade_technician"
  | "dispatch_rider"
  | "property_agent"
  | "general_artisan";

export type HealthcareFacilityType = "hospital" | "clinic" | "pharmacy";

export type DirectoryReportReason =
  | "misrepresentation"
  | "suspicious_activity"
  | "unlicensed_practice"
  | "property_advertising_violation"
  | "inaccurate_contact_info"
  | "other";

export type DirectoryReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export type UrgencyLevel = "low" | "normal" | "high" | "emergency";

export type StorageBucketId =
  | "avatars"
  | "portfolio-media"
  | "verification-documents"
  | "service-request-media"
  | "message-attachments"
  | "maintenance-and-disputes"
  | "booking-attachments"
  | "maintenance-invoices"
  | "dispute-evidence";

export type NotificationChannel = "in_app" | "email" | "push" | "sms" | "whatsapp";

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read";

export type NotificationDeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "rejected";

export type NotificationEvent =
  | "new_service_request"
  | "professional_response"
  | "new_quotation"
  | "quotation_accepted"
  | "appointment_confirmed"
  | "appointment_reminder"
  | "booking_status_change"
  | "new_message"
  | "job_completion_request"
  | "customer_review"
  | "dispute_update"
  | "verification_status_change";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface ApiSuccessResult<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorResult {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
}

export type ApiResult<T> = ApiSuccessResult<T> | ApiErrorResult;

export interface AIProblemCategorizationResult {
  categorySlug: string;
  categoryName: string;
  urgency: UrgencyLevel;
  suggestedTitle: string;
  summary: string;
  safetyNotes: string[];
  confidence: number;
  source: "openai" | "fallback";
}

export interface ExperiencePortalInfo {
  role: UserRole;
  title: string;
  subtitle: string;
  routePrefix: string;
  capabilities: readonly string[];
}

export * from "./database";

export const EASYLIFE_EXPERIENCES: readonly ExperiencePortalInfo[] = [
  {
    role: "customer",
    title: "Customer Application",
    subtitle:
      "Household everyday service discovery, AI categorization, bookings & verified reviews",
    routePrefix: "/customer",
    capabilities: [
      "AI-assisted problem categorization",
      "Location-based professional discovery (Port Harcourt, Lagos, Abuja)",
      "Service requests, quotations & appointment tracking",
      "Real-time messaging, job sign-off & verified reviews",
    ],
  },
  {
    role: "professional",
    title: "Service Professional Application",
    subtitle:
      "Verified tradesperson & technician workflow, quotations & schedule management",
    routePrefix: "/professional",
    capabilities: [
      "Identity & credential verification onboarding",
      "Service coverage area & skill profile management",
      "Incoming service leads & itemized quotation builder",
      "Appointment scheduling & job completion records",
    ],
  },
  {
    role: "business",
    title: "Business & Property Maintenance Portal",
    subtitle:
      "Multi-property facility, equipment registry & preventive maintenance management",
    routePrefix: "/business",
    capabilities: [
      "Properties, units & commercial facility management",
      "Equipment & asset lifecycle records",
      "Preventive maintenance scheduling",
      "Complete asset maintenance history & audit trail",
    ],
  },
  {
    role: "admin",
    title: "Administrator Dashboard",
    subtitle:
      "Platform governance, professional verification, category & dispute arbitration",
    routePrefix: "/admin",
    capabilities: [
      "Professional verification document review & approval",
      "Customer, professional & business account oversight",
      "Service category & location management",
      "Dispute investigation & resolution workflow",
    ],
  },
] as const;

// ============================================================================
// AI Assistant Types (Prompt 17)
// ============================================================================

export interface AIAssistantMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  structuredData?: AIAssistantResponseData | null;
}

export interface AIAssistantCategoryRecommendation {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface AIAssistantProblemSummary {
  reportedSymptoms: string[];
  potentialCausesDisclaimer: string;
  suggestedProfessionalType: string;
  safetyNotice?: string;
}

export interface AIAssistantStructuredRequest {
  suggestedTitle: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  urgency: "normal" | "high" | "emergency";
  recommendedDescription: string;
}

export interface AIAssistantResponseData {
  understandingSummary: string;
  clarifyingQuestions: string[];
  suggestedQuickReplies: string[];
  categoryRecommendation: AIAssistantCategoryRecommendation | null;
  problemSummary: AIAssistantProblemSummary;
  structuredRequest: AIAssistantStructuredRequest | null;
  requiresClarification: boolean;
  rateLimitExceeded?: boolean;
  usage?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}
