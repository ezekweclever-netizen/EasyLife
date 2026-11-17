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
  | "catalogue-assets"
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

// ============================================================================
// Service Catalogue Architecture Types (Phase 2)
// ============================================================================

export interface CatalogueServiceRequirementItem {
  id: string;
  requirement_key: string;
  requirement_type: string;
  title: string;
  description: string | null;
  is_required: boolean;
  applies_to: "customer" | "professional" | "both";
  config: Record<string, unknown>;
}

export type ServiceLifecycleStatus = "active" | "paused" | "inactive";

export interface CatalogueServiceItem {
  id: string;
  category_id?: string;
  subcategory_id?: string | null;
  service_code: string;
  name: string;
  slug: string;
  short_description: string | null;
  description?: string | null;
  image_url: string | null;
  icon_name: string | null;
  keywords: string[];
  base_price_min_kobo: number;
  base_price_max_kobo: number | null;
  estimated_duration_minutes: number | null;
  status?: ServiceLifecycleStatus;
  paused_at?: string | null;
  deactivated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  show_on_homepage?: boolean;
  display_order?: number;
  requires_verified_identity: boolean;
  requires_trade_certification: boolean;
  requires_business_registration: boolean;
  requires_site_inspection: boolean;
  min_years_experience: number;
  eligible_provider_types: string[];
  required_document_types: string[];
  requirements?: CatalogueServiceRequirementItem[];
}

export interface CatalogueSubcategoryNode {
  id: string;
  parent_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  image_url: string | null;
  keywords: string[];
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  services: CatalogueServiceItem[];
}

export interface CatalogueCategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  image_url: string | null;
  keywords: string[];
  default_commission_bps: number;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  show_on_homepage: boolean;
  direct_services: CatalogueServiceItem[];
  subcategories: CatalogueSubcategoryNode[];
}

export interface ProfessionalServiceEligibilityResult {
  eligible: boolean;
  professional_id: string;
  service_id: string;
  service_name?: string;
  missing_requirements: string[];
  checks?: {
    identity_verified: boolean;
    provider_type_eligible: boolean;
    experience_sufficient: boolean;
    trade_certification_present: boolean;
    business_registration_present: boolean;
    approved_document_types: string[];
  };
  error?: string;
}

// ============================================================================
// Phase 6 — Search, Filtering & Pagination Types
// ============================================================================

export type ProfessionalDiscoverySort =
  | "relevance"
  | "rating"
  | "distance"
  | "experience"
  | "jobs"
  | "price_asc";

export interface CatalogueSearchResultItem {
  id: string;
  service_code: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  icon_name: string | null;
  keywords: string[];
  base_price_min_kobo: number;
  base_price_max_kobo: number | null;
  estimated_duration_minutes: number | null;
  service_status?: ServiceLifecycleStatus;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  show_on_homepage: boolean;
  requires_trade_certification: boolean;
  requires_business_registration: boolean;
  requires_site_inspection: boolean;
  min_years_experience: number;
  category_id: string;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  category_is_active: boolean;
  subcategory_id: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  subcategory_is_active: boolean;
  is_currently_available: boolean;
  available_provider_count: number;
  relevance_score: number;
  total_count: number;
}

// ============================================================================
// Phase 7 — Analytics & Demand Management Types
// ============================================================================

export type SupplyGapSeverity =
  | "critical_no_providers"
  | "high_none_available"
  | "high_unmet_demand"
  | "moderate_thin_supply"
  | "healthy";

export interface AdminDemandAnalyticsSummary {
  total_searches: number;
  zero_result_searches: number;
  zero_result_rate_pct: number;
  active_services_count: number;
  services_with_zero_providers_count: number;
  services_none_available_count: number;
  insufficient_provider_services_count: number;
  total_bookings_in_window: number;
  direct_service_bookings_count: number;
  custom_task_requests_count: number;
  maintenance_requests_count: number;
  ai_queries_in_window: number;
  approved_available_pros_count: number;
  approved_total_pros_count: number;
}

export interface AdminSearchedServiceMetric {
  service_id: string;
  service_code: string;
  name: string;
  slug: string;
  category_name: string;
  subcategory_name: string | null;
  search_count: number;
  zero_result_hits: number;
  direct_bookings: number;
  available_pros: number;
  total_eligible_pros: number;
  gap_severity: SupplyGapSeverity;
}

export interface AdminSearchQueryMetric {
  normalized_query: string;
  search_surface: "suggest" | "catalogue" | "explore";
  city_filter: string;
  search_count: number;
  zero_result_count: number;
  last_result_count: number;
  resolved_service_name: string | null;
  resolved_service_slug: string | null;
  resolved_category_name: string | null;
  last_searched_at: string;
}

export interface AdminRequestedServiceMetric {
  service_id: string;
  service_code: string;
  name: string;
  slug: string;
  category_name: string;
  subcategory_name: string | null;
  direct_bookings: number;
  open_unmatched_bookings: number;
  custom_task_bookings: number;
  maintenance_requests_count: number;
  search_count: number;
  category_bookings_context: number;
  combined_demand_signals: number;
  available_pros: number;
  gap_severity: SupplyGapSeverity;
}

export interface AdminFrequentlyBookedServiceMetric {
  service_id: string;
  service_code: string;
  name: string;
  slug: string;
  category_name: string;
  subcategory_name: string | null;
  total_bookings: number;
  completed_bookings: number;
  active_bookings: number;
  cancelled_bookings: number;
  disputed_bookings: number;
  custom_task_bookings: number;
  gross_agreed_kobo: number;
  avg_agreed_kobo: number;
  completion_rate_pct: number;
  available_pros: number;
}

export interface AdminPopularCategoryMetric {
  category_id: string;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  slug: string;
  tier: "main" | "subcategory";
  total_bookings: number;
  completed_bookings: number;
  active_bookings: number;
  custom_task_bookings: number;
  gross_agreed_kobo: number;
  search_count: number;
  ai_assistant_hits: number;
  maintenance_requests_count: number;
  active_services_count: number;
  available_pros_count: number;
}

export interface AdminServiceSupplyGapMetric {
  service_id: string;
  service_code: string;
  name: string;
  slug: string;
  category_id?: string;
  category_name: string;
  subcategory_name: string | null;
  requires_trade_certification: boolean;
  direct_service_pros: number;
  total_eligible_pros: number;
  available_pros: number;
  offline_pros: number;
  ph_pros: number;
  lagos_pros: number;
  abuja_pros: number;
  missing_cities: string[];
  booking_demand: number;
  open_unmatched_bookings?: number;
  search_count: number;
  category_bookings_context?: number;
  gap_severity: SupplyGapSeverity;
}

export interface AdminZeroResultSearchMetric {
  normalized_query: string;
  search_surface: "suggest" | "catalogue" | "explore";
  city_filter: string;
  zero_result_count: number;
  search_count: number;
  last_result_count: number;
  last_searched_at: string;
}

export interface AdminCityDemandMetric {
  city: string;
  total_bookings: number;
  open_unmatched_bookings: number;
  completed_bookings: number;
  gross_agreed_kobo: number;
  search_count: number;
  approved_pros_count: number;
  available_pros_count: number;
  bookings_per_available_pro: number | null;
}

export interface AdminLocationDemandMetric {
  city: string;
  lga_or_district: string;
  total_bookings: number;
  open_unmatched_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  custom_task_bookings: number;
  gross_agreed_kobo: number;
  city_search_count: number;
  approved_pros_count: number;
  available_pros_count: number;
  bookings_per_available_pro: number | null;
}

export interface AdminDemandAnalytics {
  window_days: number;
  generated_at: string;
  summary: AdminDemandAnalyticsSummary;
  most_searched_services: AdminSearchedServiceMetric[];
  top_search_queries: AdminSearchQueryMetric[];
  most_requested_services: AdminRequestedServiceMetric[];
  most_frequently_booked_services: AdminFrequentlyBookedServiceMetric[];
  popular_categories: AdminPopularCategoryMetric[];
  insufficient_provider_services: AdminServiceSupplyGapMetric[];
  zero_result_searches: AdminZeroResultSearchMetric[];
  demand_by_city: AdminCityDemandMetric[];
  demand_by_location: AdminLocationDemandMetric[];
  provider_availability_by_service: AdminServiceSupplyGapMetric[];
}

// ============================================================================
// Structured Platform Settings Types (Admin Control Panel)
// ============================================================================

export type PlatformSettingsSectionKey =
  | "general"
  | "registration"
  | "marketplace"
  | "financial"
  | "notifications"
  | "security";

export interface GeneralPlatformSettings {
  platform_name: string;
  platform_description: string;
  platform_logo_url: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  business_address: string;
  default_currency: string;
  default_country: string;
  default_timezone: string;
  supported_cities: string[];
}

export interface RegistrationPlatformSettings {
  enable_customer_registration: boolean;
  enable_professional_registration: boolean;
  enable_business_registration: boolean;
  require_email_verification: boolean;
  require_phone_verification: boolean;
  require_professional_approval: boolean;
  require_business_approval: boolean;
  min_password_length: number;
  require_strong_password: boolean;
}

export interface MarketplacePlatformSettings {
  enable_service_bookings: boolean;
  enable_quotation_requests: boolean;
  enable_provider_applications: boolean;
  require_service_approval: boolean;
  show_paused_services_in_catalogue: boolean;
  default_quotation_expiry_hours: number;
  dispute_auto_escalate_hours: number;
  maintenance_mode_enabled: boolean;
  maintenance_mode_message: string;
}

export interface FinancialPlatformSettings {
  commission_enabled: boolean;
  default_commission_percent: number;
  minimum_callout_fee_naira: number;
  supported_currencies: string[];
  tax_enabled: boolean;
  tax_rate_percent: number;
  tax_label: string;
  payment_provider_enabled: boolean;
  payment_provider_name: string;
}

export interface NotificationPlatformSettings {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  booking_notifications_enabled: boolean;
  account_verification_notifications_enabled: boolean;
  admin_alert_notifications_enabled: boolean;
  admin_alert_email: string;
}

export interface SecurityPlatformSettings {
  enforce_admin_mfa: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  audit_logging_enabled: boolean;
  require_reason_for_suspension: boolean;
  restrict_admin_registration: boolean;
}

export interface PlatformIntegrationHealth {
  paystackConfigured: boolean;
  paystackKeyHint: string | null;
  emailProviderConfigured: boolean;
  pushProviderConfigured: boolean;
  smsProviderConfigured: boolean;
}

export interface StructuredPlatformSettingsBundle {
  general: GeneralPlatformSettings;
  registration: RegistrationPlatformSettings;
  marketplace: MarketplacePlatformSettings;
  financial: FinancialPlatformSettings;
  notifications: NotificationPlatformSettings;
  security: SecurityPlatformSettings;
  updatedAt: Partial<Record<PlatformSettingsSectionKey, string>>;
  integrations: PlatformIntegrationHealth;
}




