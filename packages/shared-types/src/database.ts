/**
 * EasyLife Database Schema Row Types
 * Mirrors the 30 PostgreSQL tables in `supabase/migrations/`.
 * All monetary columns are stored in minor units (`_kobo`, where 100 kobo = 1.00 NGN).
 */

import type {
  AppointmentStatus,
  AssetCategory,
  BookingStatus,
  ContentModerationStatus,
  DirectoryReportReason,
  DirectoryReportStatus,
  DisputeCategory,
  DisputeResolutionType,
  DisputeStatus,
  FaultSeverityLevel,
  HealthcareFacilityType,
  InvitationStatus,
  JobApplicationStatus,
  JobEmploymentType,
  JobSalaryPeriod,
  JobVacancyStatus,
  JobWorkplaceType,
  MaintenanceFrequency,
  MaintenanceRequestStatus,
  MessageDeliveryStatus,
  NotificationDeliveryStatus,
  ProviderType,
  QuotationStatus,
  ReviewModerationStatus,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
} from "./index";

export type DevicePlatform = "web" | "android" | "ios";

export type DocumentType =
  | "national_id_nin"
  | "voters_card"
  | "drivers_license"
  | "international_passport"
  | "trade_certificate"
  | "cac_certificate"
  | "utility_bill"
  | "other";

export type BusinessMemberRole =
  | "owner"
  | "admin"
  | "facility_manager"
  | "viewer";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type PropertyType =
  | "residential"
  | "commercial"
  | "industrial"
  | "mixed_use";

export type AssetStatus =
  | "operational"
  | "needs_maintenance"
  | "under_repair"
  | "decommissioned";

export type QuotationItemType =
  | "labor"
  | "material"
  | "callout"
  | "transport"
  | "other";

export type PaymentStatus =
  | "initiated"
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type RefundStatus = "pending" | "processed" | "failed" | "rejected";

export type MaintenanceType =
  | "preventive"
  | "corrective"
  | "inspection"
  | "emergency";

export type ReportStatus =
  | "open"
  | "investigating"
  | "action_taken"
  | "dismissed";

export interface ProfileRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_role: UserRole;
  city: string;
  state: string;
  address_line: string | null;
  preferred_currency: string;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

export interface UserSessionRow {
  id: string;
  user_id: string;
  device_id: string;
  platform: DevicePlatform;
  device_name: string | null;
  fcm_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_push_enabled: boolean;
  last_active_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  image_url?: string | null;
  keywords?: string[];
  default_commission_bps: number;
  is_active: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  show_on_homepage?: boolean;
  metadata?: Record<string, unknown>;
  display_order: number;
  updated_by?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceRequirementType =
  | "customer_input"
  | "photo_evidence"
  | "site_access"
  | "provider_credential"
  | "safety_compliance"
  | "equipment_or_tools"
  | "inspection";

export type ServiceRequirementAppliesTo = "customer" | "professional" | "both";

export interface ServiceRow {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  service_code: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  icon_name: string | null;
  keywords: string[];
  display_order: number;
  status: "active" | "paused" | "inactive";
  paused_at: string | null;
  deactivated_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  show_on_homepage: boolean;
  base_price_min_kobo: number;
  base_price_max_kobo: number | null;
  estimated_duration_minutes: number | null;
  currency_code: string;
  default_commission_bps: number | null;
  requires_verified_identity: boolean;
  requires_trade_certification: boolean;
  requires_business_registration: boolean;
  requires_site_inspection: boolean;
  min_years_experience: number;
  eligible_provider_types: ProviderType[];
  required_document_types: DocumentType[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ServiceRequirementRow {
  id: string;
  service_id: string;
  requirement_key: string;
  requirement_type: ServiceRequirementType;
  title: string;
  description: string | null;
  is_required: boolean;
  applies_to: ServiceRequirementAppliesTo;
  config: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfessionalProfileRow {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;
  verification_status: VerificationStatus;
  submitted_for_verification_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  base_callout_fee_kobo: number;
  hourly_rate_kobo?: number | null;
  currency_code: string;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  response_rate_pct: number;
  is_available: boolean;
  primary_city: string;
  primary_state: string;
  provider_type?: ProviderType;
  dispatch_details?: Record<string, unknown> | null;
  agent_services?: string[] | null;
  agent_disclaimer_accepted?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfessionalServiceRow {
  id: string;
  professional_id: string;
  category_id: string;
  service_id?: string | null;
  service_title?: string | null;
  min_price_kobo: number;
  max_price_kobo: number | null;
  currency_code: string;
  description: string | null;
  qualification_notes?: string | null;
  certification_reference?: string | null;
  years_experience_in_service?: number | null;
  qualifications?: Record<string, unknown>;
  is_primary_skill: boolean;
  is_active: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalServiceAreaRow {
  id: string;
  professional_id: string;
  city: string;
  state: string;
  lga_or_district: string;
  neighbourhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalDocumentRow {
  id: string;
  professional_id: string;
  document_type: DocumentType;
  storage_bucket: "verification-documents";
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  document_number_masked: string | null;
  verification_status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfessionalAvailabilityRow {
  id: string;
  professional_id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  registration_number: string | null;
  tax_id_masked: string | null;
  industry: string | null;
  contact_email: string;
  contact_phone: string | null;
  city: string;
  state: string;
  address: string | null;
  description?: string | null;
  business_category?: string | null;
  operating_hours?: Record<string, unknown> | null;
  services_offered?: string[] | null;
  photos?: string[] | null;
  website?: string | null;
  logo_url?: string | null;
  rating?: number;
  review_count?: number;
  is_directory_listed?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BusinessMemberRow {
  id: string;
  business_id: string;
  user_id: string;
  member_role: BusinessMemberRole;
  permissions?: string[];
  invited_by: string | null;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocationRow {
  id: string;
  business_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lga: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  is_headquarters: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessInvitationRow {
  id: string;
  business_id: string;
  email: string;
  role: BusinessMemberRole;
  permissions: string[];
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSubscriptionRow {
  id: string;
  business_id: string;
  plan_code: string;
  plan_name: string;
  status: SubscriptionStatus;
  price_kobo: number;
  currency_code: string;
  billing_interval: "monthly" | "quarterly" | "annual";
  max_properties: number;
  max_assets: number;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  provider_subscription_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  business_id: string;
  manager_user_id: string | null;
  name: string;
  code: string;
  property_type: PropertyType;
  city: string;
  state: string;
  lga_or_district: string | null;
  address: string;
  units_count: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AssetRow {
  id: string;
  business_id: string;
  property_id: string;
  category_id: string | null;
  asset_category: AssetCategory;
  name: string;
  asset_tag: string;
  brand: string | null;
  model_number: string | null;
  serial_number: string | null;
  location_in_property: string | null;
  status: AssetStatus;
  installation_date: string | null;
  maintenance_interval_days: number;
  purchase_date: string | null;
  purchase_cost_kobo: number | null;
  currency_code: string;
  warranty_expires_at: string | null;
  last_serviced_at: string | null;
  next_service_due_at: string | null;
  specifications: Record<string, unknown>;
  documents: Array<{ name: string; url: string; type?: string }>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceRequestRow {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  category_id: string | null;
  service_id?: string | null;
  requested_by: string;
  assigned_professional_id: string | null;
  booking_id: string | null;
  title: string;
  description: string;
  fault_severity: FaultSeverityLevel;
  status: MaintenanceRequestStatus;
  scheduled_date: string | null;
  estimated_cost_kobo: number;
  actual_cost_kobo: number;
  currency_code: string;
  invoice_url: string | null;
  invoice_number: string | null;
  photos: string[];
  documents: Array<{ name: string; url: string }>;
  resolution_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  reference_code: string;
  customer_id: string;
  professional_id: string | null;
  business_id: string | null;
  property_id: string | null;
  asset_id: string | null;
  maintenance_schedule_id: string | null;
  category_id: string;
  subcategory_id?: string | null;
  service_id?: string | null;
  ai_suggested_category_id: string | null;
  ai_urgency: UrgencyLevel | null;
  ai_categorization_meta: Record<string, unknown>;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  status: BookingStatus;
  city: string;
  state: string;
  lga_or_district: string | null;
  service_address: string;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  accepted_quotation_id: string | null;
  agreed_amount_kobo: number | null;
  currency_code: string;
  pro_marked_complete_at: string | null;
  pro_completion_notes: string | null;
  rework_notes: string | null;
  rework_requested_at: string | null;
  rework_count: number;
  customer_confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookingAttachmentRow {
  id: string;
  booking_id: string;
  uploaded_by: string;
  storage_bucket: "service-request-media";
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  attachment_stage: "request" | "in_progress" | "completion";
  caption: string | null;
  created_at: string;
}

export interface QuotationRow {
  id: string;
  reference_code: string;
  booking_id: string;
  professional_id: string;
  status: QuotationStatus;
  version: number;
  work_description: string | null;
  labour_charges_kobo: number;
  materials_costs_kobo: number;
  additional_expenses_kobo: number;
  subtotal_kobo: number;
  tax_kobo: number;
  total_amount_kobo: number;
  currency_code: string;
  estimated_duration_minutes: number;
  proposed_start_at: string | null;
  valid_until: string | null;
  notes: string | null;
  decline_reason: string | null;
  clarification_requested_at: string | null;
  clarification_notes: string | null;
  clarification_responded_at: string | null;
  clarification_response: string | null;
  withdrawal_reason: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationVersionRow {
  id: string;
  quotation_id: string;
  booking_id: string;
  professional_id: string;
  version_number: number;
  status: QuotationStatus;
  subtotal_kobo: number;
  labour_charges_kobo: number;
  materials_costs_kobo: number;
  additional_expenses_kobo: number;
  tax_kobo: number;
  total_amount_kobo: number;
  currency_code: string;
  estimated_duration_minutes: number;
  proposed_start_at: string | null;
  valid_until: string | null;
  work_description: string | null;
  notes: string | null;
  items_snapshot: Record<string, unknown>[];
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QuotationItemRow {
  id: string;
  quotation_id: string;
  item_type: QuotationItemType;
  description: string;
  quantity: number;
  unit_price_kobo: number;
  line_total_kobo: number;
  currency_code: string;
  sort_order: number;
  created_at: string;
}

export interface BookingStatusHistoryRow {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  booking_id: string;
  quotation_id: string | null;
  professional_id: string;
  customer_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  status: AppointmentStatus;
  notes: string | null;
  reschedule_count: number;
  confirmed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  booking_id: string;
  subject: string | null;
  status: "open" | "archived" | "locked";
  last_message_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConversationMemberRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role_in_conversation: UserRole;
  last_read_at: string | null;
  is_muted: boolean;
  unread_count: number;
  joined_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: "text" | "system" | "attachment";
  body: string;
  attachment_storage_path: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  attachment_size_bytes: number | null;
  delivery_status: MessageDeliveryStatus;
  delivered_at: string | null;
  read_at: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  channels: string[];
  is_read: boolean;
  read_at: string | null;
  delivery_status: NotificationDeliveryStatus;
  email_sent_at: string | null;
  push_sent_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationDeliveryRow {
  id: string;
  notification_id: string;
  channel: "in_app" | "email" | "push" | "sms" | "whatsapp";
  recipient_destination: string;
  provider: string;
  status: NotificationDeliveryStatus;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  reference: string;
  booking_id: string;
  quotation_id: string | null;
  payer_user_id: string;
  business_id: string | null;
  professional_id: string;
  gross_amount_kobo: number;
  platform_commission_kobo: number;
  professional_payout_kobo: number;
  currency_code: string;
  provider: "paystack" | "manual_transfer";
  provider_reference: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  provider_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RefundRow {
  id: string;
  reference: string;
  payment_id: string;
  booking_id: string;
  dispute_id: string | null;
  amount_kobo: number;
  currency_code: string;
  reason: string;
  status: RefundStatus;
  initiated_by: string;
  processed_at: string | null;
  provider_refund_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  booking_id: string;
  reviewer_user_id: string;
  professional_id: string;
  rating: number;
  title: string | null;
  comment: string;
  photos: string[];
  professional_response: string | null;
  responded_at: string | null;
  is_published: boolean;
  moderation_status: ReviewModerationStatus;
  is_flagged: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_notes: string | null;
  original_comment: string | null;
  edit_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewHistoryRow {
  id: string;
  review_id: string;
  booking_id: string;
  rating: number;
  title: string | null;
  comment: string;
  photos: string[];
  changed_by: string;
  change_reason: string | null;
  created_at: string;
}

export interface DisputeRow {
  id: string;
  reference_code: string;
  booking_id: string;
  opened_by_user_id: string;
  against_user_id: string;
  category: DisputeCategory;
  description: string;
  disputed_amount_kobo: number;
  currency_code: string;
  status: DisputeStatus;
  assigned_admin_id: string | null;
  internal_notes: string | null;
  resolution_type: DisputeResolutionType | null;
  resolution_summary: string | null;
  refund_amount_kobo: number;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeInternalNoteRow {
  id: string;
  dispute_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
}

export interface DisputeEvidenceRow {
  id: string;
  dispute_id: string;
  submitted_by_user_id: string;
  storage_bucket: "maintenance-and-disputes";
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  description: string | null;
  created_at: string;
}

export interface MaintenanceScheduleRow {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  category_id: string;
  assigned_professional_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  frequency: MaintenanceFrequency;
  interval_days: number;
  estimated_cost_kobo: number;
  currency_code: string;
  next_due_date: string;
  last_completed_at: string | null;
  auto_create_booking: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaintenanceRecordRow {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  maintenance_schedule_id: string | null;
  booking_id: string | null;
  performed_by_professional_id: string | null;
  performed_by_name: string;
  recorded_by_user_id: string;
  maintenance_type: MaintenanceType;
  summary: string;
  work_performed: string;
  parts_replaced: string | null;
  cost_kobo: number;
  currency_code: string;
  performed_at: string;
  next_recommended_service_date: string | null;
  attachments: unknown[];
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_user_id: string;
  target_type:
    | "profile"
    | "professional_profile"
    | "booking"
    | "review"
    | "message";
  target_id: string;
  reason_category: string;
  details: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingRow {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionSettingRow {
  id: string;
  category_id: string | null;
  service_id?: string | null;
  city: string | null;
  commission_bps: number;
  flat_fee_kobo: number;
  currency_code: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthcareFacilityRow {
  id: string;
  name: string;
  slug: string;
  facility_type: "hospital" | "clinic" | "pharmacy";
  description: string | null;
  address: string;
  city: string;
  state: string;
  lga: string;
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string;
  contact_email: string | null;
  website: string | null;
  operating_hours: string;
  is_emergency_24_7: boolean;
  services_offered: string[];
  verification_status: VerificationStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DirectoryReportRow {
  id: string;
  reporter_id: string | null;
  entity_type: "professional" | "business" | "healthcare_facility" | "general_listing";
  entity_name: string;
  reason: "misrepresentation" | "suspicious_activity" | "unlicensed_practice" | "property_advertising_violation" | "inaccurate_contact_info" | "other";
  details: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployerProfileRow {
  id: string;
  user_id: string;
  company_name: string;
  slug: string;
  company_description: string | null;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string;
  state: string;
  address: string | null;
  verification_status: VerificationStatus;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JobVacancyRow {
  id: string;
  reference_code: string;
  employer_id: string | null;
  business_id: string | null;
  posted_by: string;
  title: string;
  slug: string;
  category: string;
  employment_type: JobEmploymentType;
  workplace_type: JobWorkplaceType;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  city: string;
  state: string;
  address: string | null;
  min_salary_kobo: number | null;
  max_salary_kobo: number | null;
  salary_period: JobSalaryPeriod;
  currency_code: string;
  is_negotiable: boolean;
  benefits: string[];
  application_deadline: string | null;
  positions_available: number;
  status: JobVacancyStatus;
  moderation_status: ContentModerationStatus;
  moderated_at: string | null;
  moderated_by: string | null;
  rejection_reason: string | null;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JobApplicationRow {
  id: string;
  reference_code: string;
  vacancy_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  resume_url: string | null;
  cover_letter: string | null;
  portfolio_links: string[];
  status: JobApplicationStatus;
  employer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessPromotionRow {
  id: string;
  business_id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string;
  discount_percentage: number | null;
  discount_amount_kobo: number | null;
  discount_code: string | null;
  conditions: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  moderation_status: ContentModerationStatus;
  moderated_at: string | null;
  moderated_by: string | null;
  views_count: number;
  redemption_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Helper to format minor-unit kobo into display currency (e.g., 500000 -> "₦5,000.00")
 */
export function formatMinorUnits(
  amountMinor: number,
  currencyCode: string = "NGN",
  locale: string = "en-NG"
): string {
  const majorAmount = amountMinor / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(majorAmount);
}
