"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { storageService } from "@/lib/storage/storage-service";
import type {
  AdminDashboardMetrics,
  AdminDemandAnalytics,
  FinancialPlatformSettings,
  GeneralPlatformSettings,
  MarketplacePlatformSettings,
  NotificationPlatformSettings,
  PlatformSettingsSectionKey,
  RegistrationPlatformSettings,
  SecurityPlatformSettings,
  StructuredPlatformSettingsBundle,
  VerificationStatus,
  UserRole,
} from "@easylife/shared-types";
import {
  buildStructuredPlatformSettings,
  detectIntegrationHealthServer,
  PLATFORM_SETTING_SECTION_META,
} from "@/lib/platform-settings";

export interface AdminActionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Universal helper for admin REST calls.
 * SECURITY: Strictly verifies the caller has an authenticated admin session
 * before permitting any admin query or service-role operation.
 */
async function runAdminQuery<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    accessToken?: string;
  } = {}
) {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      ok: false as const,
      status: adminCheck.reason === "unauthenticated" ? 401 : 403,
      message: "Unauthorized: Administrator privileges are required.",
    };
  }

  const config = getSupabasePublicConfig();
  const token = options.accessToken || adminCheck.accessToken;
  if (!config || !token) {
    return {
      ok: false as const,
      status: 500,
      message: "Missing authenticated administrator Supabase context.",
    };
  }

  return supabaseFetch<T>(config, path, {
    method: options.method,
    body: options.body,
    headers: options.headers,
    accessToken: token,
  });
}

/**
 * 1. Fetch High-Level Admin Dashboard Overview Metrics
 */
export async function fetchAdminDashboardMetrics(): Promise<AdminDashboardMetrics | null> {
  const auth = await getAuthenticatedUser();
  const res = await runAdminQuery<AdminDashboardMetrics>(
    "/rest/v1/rpc/get_admin_dashboard_metrics",
    {
      method: "POST",
      accessToken: auth?.accessToken,
    }
  );

  if (!res.ok) {
    return null;
  }

  return res.data;
}

/**
 * 2. Fetch Users with Search, Filter & Pagination
 */
export async function fetchAdminUsers(params: {
  search?: string;
  isSuspended?: boolean;
  page?: number;
  limit?: number;
}) {
  const auth = await getAuthenticatedUser();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = `/rest/v1/profiles?select=*,user_roles:user_roles!user_roles_user_id_fkey(role,is_active)&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (params.search && params.search.trim()) {
    const s = encodeURIComponent(params.search.trim());
    query += `&or=(full_name.ilike.*${s}*,email.ilike.*${s}*,phone.ilike.*${s}*)`;
  }

  if (typeof params.isSuspended === "boolean") {
    query += `&is_suspended=eq.${params.isSuspended}`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
    headers: { Prefer: "count=exact" },
  });

  return {
    users: res.ok && Array.isArray(res.data) ? res.data : [],
    totalCount:
      res.ok && typeof res.totalCount === "number"
        ? res.totalCount
        : res.ok && Array.isArray(res.data)
          ? res.data.length
          : 0,
  };
}

/**
 * 3. Suspend User with Mandatory Reason & Audit Trail
 */
export async function adminSuspendUserAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const targetUserId = String(formData.get("targetUserId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!targetUserId) {
    return { ok: false, message: "Target user ID is required." };
  }

  if (!reason || reason.length < 5) {
    return { ok: false, message: "A documented suspension reason (min 5 chars) is mandatory." };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_set_user_suspension",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_target_user_id: targetUserId,
        p_suspend: true,
        p_reason: reason,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to suspend account." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: "Account has been suspended and audit log created.", data: res.data ?? undefined };
}

/**
 * 4. Reinstate User Account with Audit Trail
 */
export async function adminReinstateUserAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const targetUserId = String(formData.get("targetUserId") || "").trim();
  const reason = String(formData.get("reason") || "Reinstated by administrator after review.").trim();

  if (!targetUserId) {
    return { ok: false, message: "Target user ID is required." };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_set_user_suspension",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_target_user_id: targetUserId,
        p_suspend: false,
        p_reason: reason,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to reinstate account." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: "Account reinstated successfully.", data: res.data ?? undefined };
}

/**
 * 5. Fetch Professionals with Profile, Verification, Services, Areas & KYC Docs
 */
export async function fetchAdminProfessionals(params: {
  search?: string;
  verificationStatus?: string;
  page?: number;
  limit?: number;
}) {
  const auth = await getAuthenticatedUser();
  const page = params.page || 1;
  const limit = params.limit || 25;
  const offset = (page - 1) * limit;

  let query = `/rest/v1/professional_profiles?deleted_at=is.null&select=*,profiles:user_id(id,email,full_name,phone,city,state,is_suspended),professional_services(id,category_id,service_id,service_title,min_price_kobo,max_price_kobo,qualification_notes,certification_reference,years_experience_in_service,is_primary_skill,is_active,deleted_at,service_categories(name),services(id,name,service_code,requires_trade_certification,requires_business_registration,min_years_experience)),professional_service_areas(id,city,state,lga_or_district,neighbourhood,service_radius_km,is_primary,is_active),professional_documents(id,document_type,file_name,document_number_masked,verification_status,review_notes,created_at,deleted_at)&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (params.search && params.search.trim()) {
    const s = encodeURIComponent(params.search.trim());
    query += `&business_name=ilike.*${s}*`;
  }

  if (params.verificationStatus && params.verificationStatus !== "all") {
    query += `&verification_status=eq.${params.verificationStatus}`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
  });

  if (!res.ok || !Array.isArray(res.data)) {
    return [];
  }

  return res.data.map((pro) => ({
    ...pro,
    professional_services: Array.isArray(pro.professional_services)
      ? pro.professional_services.filter((s: any) => !s.deleted_at)
      : [],
    professional_documents: Array.isArray(pro.professional_documents)
      ? pro.professional_documents.filter((d: any) => !d.deleted_at)
      : [],
  }));
}

/**
 * 6. Review & Decide Professional Verification
 */
export async function adminReviewVerificationAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const professionalId = String(formData.get("professionalId") || "").trim();
  const decision = (String(formData.get("decision") || "approved") as VerificationStatus);
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!professionalId) {
    return { ok: false, message: "Professional ID is required." };
  }

  if (!["approved", "rejected", "suspended"].includes(decision)) {
    return { ok: false, message: "Invalid verification decision." };
  }

  if ((decision === "rejected" || decision === "suspended") && (!reason || reason.length < 5)) {
    return { ok: false, message: "A documented reason (min 5 chars) is required when rejecting or suspending." };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_review_professional_verification",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_professional_id: professionalId,
        p_decision: decision,
        p_reason: reason,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update verification status." };
  }

  revalidatePath("/admin/verifications");
  revalidatePath("/admin/professionals");
  revalidatePath("/admin");
  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/explore-services");
  revalidatePath(`/professionals/${professionalId}`);
  return { ok: true, message: `Professional verification ${decision}!`, data: res.data ?? undefined };
}

/**
 * 7. Fetch Verification Documents Queue with Service Qualifications & Eligibility Diagnostics
 */
export async function fetchAdminDocuments(status?: string) {
  const auth = await getAuthenticatedUser();
  let query = `/rest/v1/professional_documents?deleted_at=is.null&select=*,professional_profiles:professional_id(id,business_name,slug,user_id,provider_type,years_of_experience,verification_status,rejection_reason,primary_city,profiles:user_id(full_name,email,phone),professional_services(id,category_id,service_id,service_title,qualification_notes,certification_reference,years_experience_in_service,is_active,deleted_at,service_categories(name),services(id,name,service_code,requires_trade_certification,requires_business_registration,min_years_experience)),professional_service_areas(id,city,lga_or_district,neighbourhood,is_active))&order=created_at.desc&limit=50`;

  if (status && status !== "all") {
    query += `&verification_status=eq.${status}`;
  }

  const res = await runAdminQuery<Array<Record<string, any>>>(query, {
    accessToken: auth?.accessToken,
  });

  if (!res.ok || !Array.isArray(res.data)) {
    return [];
  }

  // Evaluate deduplicated per-(professional_id, service_id) eligibility diagnostics
  const pairMap = new Map<string, { professionalId: string; serviceId: string }>();
  for (const doc of res.data) {
    const pro = doc.professional_profiles;
    if (!pro?.id || !Array.isArray(pro.professional_services)) continue;
    for (const ps of pro.professional_services) {
      if (ps.deleted_at || !ps.service_id) continue;
      const key = `${pro.id}:${ps.service_id}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, { professionalId: pro.id, serviceId: ps.service_id });
      }
    }
  }

  const eligibilityCache = new Map<string, Record<string, unknown>>();
  await Promise.all(
    Array.from(pairMap.entries()).map(async ([key, pair]) => {
      const eligRes = await runAdminQuery<Record<string, unknown>>(
        "/rest/v1/rpc/check_professional_service_eligibility",
        {
          method: "POST",
          accessToken: auth?.accessToken,
          body: {
            p_professional_id: pair.professionalId,
            p_service_id: pair.serviceId,
          },
        }
      );
      if (eligRes.ok && eligRes.data) {
        eligibilityCache.set(key, eligRes.data);
      }
    })
  );

  return Promise.all(
    res.data.map(async (doc) => {
      const existingUrl = typeof doc.document_url === "string" ? doc.document_url : "";
      const storagePath = typeof doc.storage_path === "string" ? doc.storage_path : "";
      const storageBucket = (
        typeof doc.storage_bucket === "string" && doc.storage_bucket
          ? doc.storage_bucket
          : "verification-documents"
      ) as any;

      let signedDocumentUrl: string | null = existingUrl || null;
      if (!signedDocumentUrl && storagePath) {
        const signed = await storageService.createSignedUrl(storageBucket, storagePath, 3600);
        signedDocumentUrl = signed.signedUrl;
      }

      const pro = doc.professional_profiles;
      let enrichedPro = pro;
      if (pro) {
        const activeServices = Array.isArray(pro.professional_services)
          ? pro.professional_services.filter((s: any) => !s.deleted_at)
          : [];
        const serviceEligibilities: Record<string, Record<string, unknown>> = {};
        for (const ps of activeServices) {
          if (ps.service_id) {
            const cached = eligibilityCache.get(`${pro.id}:${ps.service_id}`);
            if (cached) serviceEligibilities[ps.service_id] = cached;
          }
        }
        enrichedPro = {
          ...pro,
          professional_services: activeServices,
          service_eligibilities: serviceEligibilities,
        };
      }

      return {
        ...doc,
        professional_profiles: enrichedPro,
        document_url: signedDocumentUrl,
      };
    })
  );
}

/**
 * 8. Review Individual Professional KYC Document
 */
export async function adminReviewDocumentAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const documentId = String(formData.get("documentId") || "").trim();
  const status = (String(formData.get("status") || "approved") as VerificationStatus);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!documentId) {
    return { ok: false, message: "Document ID is required." };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_review_professional_document",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_document_id: documentId,
        p_status: status,
        p_notes: notes,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to review document." };
  }

  revalidatePath("/admin/verifications");
  revalidatePath("/admin/professionals");
  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  return { ok: true, message: `Document marked as ${status}.`, data: res.data ?? undefined };
}

/**
 * 9. Fetch Businesses List
 */
export async function fetchAdminBusinesses(search?: string) {
  const auth = await getAuthenticatedUser();
  let query = `/rest/v1/businesses?select=*,business_locations(*),business_members(count),properties(count)&order=created_at.desc&limit=50`;

  if (search && search.trim()) {
    const s = encodeURIComponent(search.trim());
    query += `&name=ilike.*${s}*`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
  });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 10. Fetch Bookings for Monitoring
 */
export async function fetchAdminBookingsPaginated(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const auth = await getAuthenticatedUser();
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(params.limit || 25, 100));
  const offset = (page - 1) * limit;

  let query = `/rest/v1/bookings?deleted_at=is.null&select=*,profiles:customer_id(full_name,email,phone),professional_profiles:professional_id(business_name,slug)&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (params.search && params.search.trim()) {
    const s = encodeURIComponent(params.search.trim());
    query += `&or=(reference_code.ilike.*${s}*,title.ilike.*${s}*)`;
  }

  if (params.status === "active") {
    query += `&status=in.(open,matched,quoted,accepted,scheduled,in_progress,pro_marked_complete)`;
  } else if (params.status && params.status !== "all") {
    query += `&status=eq.${encodeURIComponent(params.status)}`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
    headers: { Prefer: "count=exact" },
  });

  const bookings = res.ok && Array.isArray(res.data) ? res.data : [];
  return {
    bookings,
    totalCount:
      res.ok && typeof res.totalCount === "number"
        ? res.totalCount
        : bookings.length,
  };
}

export async function fetchAdminBookings(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const result = await fetchAdminBookingsPaginated(params);
  return result.bookings;
}

/**
 * 11. Fetch Quotations Monitoring
 */
export async function fetchAdminQuotations(status?: string) {
  const auth = await getAuthenticatedUser();
  let query = `/rest/v1/quotations?select=*,bookings:booking_id(reference_code,title,city,state),professional_profiles:professional_id(business_name)&order=created_at.desc&limit=50`;

  if (status && status !== "all") {
    query += `&status=eq.${status}`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
  });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 12. Fetch Platform Operational Settings (Raw legacy helper preserved for compatibility)
 */
export async function fetchAdminPlatformSettings() {
  const auth = await getAuthenticatedUser();
  const res = await runAdminQuery<Array<Record<string, unknown>>>(
    "/rest/v1/platform_settings?order=key.asc",
    { accessToken: auth?.accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 12b. Fetch Structured Platform Settings (6 Organized Sections + Masked Integration Health)
 */
export async function fetchStructuredPlatformSettings(): Promise<StructuredPlatformSettingsBundle> {
  const rows = await fetchAdminPlatformSettings();
  const normalized = rows.map((row) => ({
    key: String(row.key || ""),
    value: row.value,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  }));
  return buildStructuredPlatformSettings(normalized);
}

type PlatformSettingsSectionPayloadMap = {
  general: GeneralPlatformSettings;
  registration: RegistrationPlatformSettings;
  marketplace: MarketplacePlatformSettings;
  financial: FinancialPlatformSettings;
  notifications: NotificationPlatformSettings;
  security: SecurityPlatformSettings;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSectionPayload<K extends PlatformSettingsSectionKey>(
  section: K,
  raw: PlatformSettingsSectionPayloadMap[K]
): { ok: true; clean: Record<string, unknown> } | { ok: false; message: string } {
  if (section === "general") {
    const g = raw as GeneralPlatformSettings;
    const platformName = String(g.platform_name || "").trim();
    const contactEmail = String(g.contact_email || "").trim();
    const websiteUrl = String(g.website_url || "").trim();
    const logoUrl = String(g.platform_logo_url || "").trim();
    if (platformName.length < 2 || platformName.length > 80) {
      return { ok: false, message: "Platform name must be between 2 and 80 characters." };
    }
    if (contactEmail && !EMAIL_RE.test(contactEmail)) {
      return { ok: false, message: "Please enter a valid contact email address." };
    }
    if (websiteUrl && !/^https?:\/\/.+/i.test(websiteUrl)) {
      return { ok: false, message: "Website URL must start with http:// or https://." };
    }
    if (logoUrl && !(logoUrl.startsWith("/") || /^https?:\/\/.+/i.test(logoUrl))) {
      return { ok: false, message: "Logo URL must be a relative path (/...) or valid http(s) URL." };
    }
    const cities = Array.isArray(g.supported_cities)
      ? Array.from(new Set(g.supported_cities.map((c) => String(c || "").trim()).filter(Boolean)))
      : [];
    if (cities.length === 0) {
      return { ok: false, message: "At least one supported city must be configured." };
    }
    return {
      ok: true,
      clean: {
        platform_name: platformName,
        platform_description: String(g.platform_description || "").trim().slice(0, 500),
        platform_logo_url: logoUrl || "/images/easylife-logo.png",
        contact_email: contactEmail,
        contact_phone: String(g.contact_phone || "").trim().slice(0, 40),
        website_url: websiteUrl,
        business_address: String(g.business_address || "").trim().slice(0, 300),
        default_currency: String(g.default_currency || "NGN").trim().toUpperCase().slice(0, 3),
        default_country: String(g.default_country || "Nigeria").trim().slice(0, 80),
        default_timezone: String(g.default_timezone || "Africa/Lagos").trim().slice(0, 80),
        supported_cities: cities,
      },
    };
  }

  if (section === "registration") {
    const r = raw as RegistrationPlatformSettings;
    const minLen = Math.round(Number(r.min_password_length));
    if (!Number.isFinite(minLen) || minLen < 8 || minLen > 64) {
      return { ok: false, message: "Minimum password length must be between 8 and 64 characters." };
    }
    return {
      ok: true,
      clean: {
        enable_customer_registration: Boolean(r.enable_customer_registration),
        enable_professional_registration: Boolean(r.enable_professional_registration),
        enable_business_registration: Boolean(r.enable_business_registration),
        require_email_verification: Boolean(r.require_email_verification),
        require_phone_verification: Boolean(r.require_phone_verification),
        require_professional_approval: Boolean(r.require_professional_approval),
        require_business_approval: Boolean(r.require_business_approval),
        min_password_length: minLen,
        require_strong_password: Boolean(r.require_strong_password),
      },
    };
  }

  if (section === "marketplace") {
    const m = raw as MarketplacePlatformSettings;
    const quoteHours = Math.round(Number(m.default_quotation_expiry_hours));
    const disputeHours = Math.round(Number(m.dispute_auto_escalate_hours));
    if (!Number.isFinite(quoteHours) || quoteHours < 1 || quoteHours > 720) {
      return { ok: false, message: "Quotation validity window must be between 1 and 720 hours." };
    }
    if (!Number.isFinite(disputeHours) || disputeHours < 1 || disputeHours > 720) {
      return { ok: false, message: "Dispute escalation window must be between 1 and 720 hours." };
    }
    return {
      ok: true,
      clean: {
        enable_service_bookings: Boolean(m.enable_service_bookings),
        enable_quotation_requests: Boolean(m.enable_quotation_requests),
        enable_provider_applications: Boolean(m.enable_provider_applications),
        require_service_approval: Boolean(m.require_service_approval),
        show_paused_services_in_catalogue: Boolean(m.show_paused_services_in_catalogue),
        default_quotation_expiry_hours: quoteHours,
        dispute_auto_escalate_hours: disputeHours,
        maintenance_mode_enabled: Boolean(m.maintenance_mode_enabled),
        maintenance_mode_message: String(m.maintenance_mode_message || "").trim().slice(0, 300),
      },
    };
  }

  if (section === "financial") {
    const f = raw as FinancialPlatformSettings;
    const commPct = Number(f.default_commission_percent);
    const calloutNaira = Number(f.minimum_callout_fee_naira);
    const taxPct = Number(f.tax_rate_percent);
    if (!Number.isFinite(commPct) || commPct < 0 || commPct > 50) {
      return { ok: false, message: "Platform commission percentage must be between 0% and 50%." };
    }
    if (!Number.isFinite(calloutNaira) || calloutNaira < 0 || calloutNaira > 10000000) {
      return { ok: false, message: "Minimum callout fee must be 0 or a valid non-negative amount." };
    }
    if (!Number.isFinite(taxPct) || taxPct < 0 || taxPct > 100) {
      return { ok: false, message: "Tax rate percentage must be between 0% and 100%." };
    }
    const health = detectIntegrationHealthServer();
    if (Boolean(f.payment_provider_enabled) && !health.paystackConfigured) {
      return {
        ok: false,
        message:
          "Cannot activate payment gateway because valid Paystack API credentials are not configured in server environment variables.",
      };
    }
    const currencies = Array.isArray(f.supported_currencies)
      ? Array.from(
          new Set(
            f.supported_currencies
              .map((c) => String(c || "").trim().toUpperCase())
              .filter((c) => /^[A-Z]{3}$/.test(c))
          )
        )
      : ["NGN"];
    if (currencies.length === 0) {
      return { ok: false, message: "Select at least one valid 3-letter currency code (e.g. NGN)." };
    }
    return {
      ok: true,
      clean: {
        commission_enabled: Boolean(f.commission_enabled),
        default_commission_percent: Math.round(commPct * 100) / 100,
        minimum_callout_fee_naira: Math.round(calloutNaira),
        supported_currencies: currencies,
        tax_enabled: Boolean(f.tax_enabled),
        tax_rate_percent: Math.round(taxPct * 100) / 100,
        tax_label: String(f.tax_label || "VAT").trim().slice(0, 30) || "VAT",
        payment_provider_enabled: Boolean(f.payment_provider_enabled) && health.paystackConfigured,
        payment_provider_name: String(f.payment_provider_name || "Paystack").trim().slice(0, 60),
      },
    };
  }

  if (section === "notifications") {
    const n = raw as NotificationPlatformSettings;
    const alertEmail = String(n.admin_alert_email || "").trim();
    if (alertEmail && !EMAIL_RE.test(alertEmail)) {
      return { ok: false, message: "Please enter a valid administrative alert email address." };
    }
    return {
      ok: true,
      clean: {
        email_notifications_enabled: Boolean(n.email_notifications_enabled),
        push_notifications_enabled: Boolean(n.push_notifications_enabled),
        sms_notifications_enabled: Boolean(n.sms_notifications_enabled),
        booking_notifications_enabled: Boolean(n.booking_notifications_enabled),
        account_verification_notifications_enabled: Boolean(
          n.account_verification_notifications_enabled
        ),
        admin_alert_notifications_enabled: Boolean(n.admin_alert_notifications_enabled),
        admin_alert_email: alertEmail,
      },
    };
  }

  // security
  const s = raw as SecurityPlatformSettings;
  const sessionMins = Math.round(Number(s.session_timeout_minutes));
  const maxAttempts = Math.round(Number(s.max_login_attempts));
  const lockoutMins = Math.round(Number(s.lockout_duration_minutes));
  if (!Number.isFinite(sessionMins) || sessionMins < 15 || sessionMins > 1440) {
    return { ok: false, message: "Session timeout must be between 15 and 1,440 minutes." };
  }
  if (!Number.isFinite(maxAttempts) || maxAttempts < 3 || maxAttempts > 20) {
    return { ok: false, message: "Maximum login attempts must be between 3 and 20." };
  }
  if (!Number.isFinite(lockoutMins) || lockoutMins < 1 || lockoutMins > 1440) {
    return { ok: false, message: "Lockout duration must be between 1 and 1,440 minutes." };
  }
  return {
    ok: true,
    clean: {
      enforce_admin_mfa: Boolean(s.enforce_admin_mfa),
      session_timeout_minutes: sessionMins,
      max_login_attempts: maxAttempts,
      lockout_duration_minutes: lockoutMins,
      audit_logging_enabled: Boolean(s.audit_logging_enabled),
      require_reason_for_suspension: Boolean(s.require_reason_for_suspension),
      restrict_admin_registration: Boolean(s.restrict_admin_registration),
    },
  };
}

/**
 * 13b. Save Structured Platform Settings Section (Validated + Audited + Legacy Sync)
 */
export async function adminSavePlatformSettingsSectionAction<
  K extends PlatformSettingsSectionKey,
>(
  section: K,
  values: PlatformSettingsSectionPayloadMap[K]
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const meta = PLATFORM_SETTING_SECTION_META[section];
  if (!meta) {
    return { ok: false, message: "Invalid settings section." };
  }

  const validated = validateSectionPayload(section, values);
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_set_platform_setting",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_key: meta.dbKey,
        p_value: validated.clean,
        p_description: meta.description,
        p_is_public: meta.isPublic,
      },
    }
  );

  if (!res.ok) {
    return {
      ok: false,
      message: res.message || `Failed to save ${meta.label}.`,
    };
  }

  // Synchronize corresponding legacy runtime keys so existing platform consumers stay consistent
  const syncTasks: Array<{ key: string; value: unknown; description: string; isPublic: boolean }> = [];
  if (section === "general") {
    const clean = validated.clean;
    syncTasks.push(
      {
        key: "pilot_cities",
        value: clean.supported_cities,
        description: "Active cities supported by EasyLife.",
        isPublic: true,
      },
      {
        key: "system.support_email",
        value: clean.contact_email,
        description: "Official Customer Operations Support Email",
        isPublic: true,
      },
      {
        key: "system.support_phone",
        value: clean.contact_phone,
        description: "Official Operations Support Phone",
        isPublic: true,
      }
    );
  } else if (section === "marketplace") {
    const clean = validated.clean;
    syncTasks.push(
      {
        key: "booking_quotation_expiry_hours",
        value: clean.default_quotation_expiry_hours,
        description: "Default validity window in hours for submitted quotations.",
        isPublic: true,
      },
      {
        key: "marketplace.dispute_auto_escalate_hours",
        value: clean.dispute_auto_escalate_hours,
        description: "Hours after submission before an unreviewed dispute alerts supervisor",
        isPublic: false,
      },
      {
        key: "maintenance_mode",
        value: {
          enabled: clean.maintenance_mode_enabled,
          message: clean.maintenance_mode_message,
        },
        description: "Global maintenance banner toggle.",
        isPublic: true,
      },
      {
        key: "marketplace.maintenance_mode",
        value: clean.maintenance_mode_enabled,
        description: "Platform-wide maintenance mode lock",
        isPublic: true,
      }
    );
  } else if (section === "financial") {
    const clean = validated.clean;
    const commissionBps = clean.commission_enabled
      ? Math.round(Number(clean.default_commission_percent) * 100)
      : 0;
    const calloutKobo = Math.round(Number(clean.minimum_callout_fee_naira) * 100);
    syncTasks.push(
      {
        key: "marketplace.default_commission_bps",
        value: commissionBps,
        description: "Platform commission rate in basis points.",
        isPublic: true,
      },
      {
        key: "marketplace.callout_fee_minimum_kobo",
        value: calloutKobo,
        description: "Minimum callout fee in kobo.",
        isPublic: true,
      }
    );
  }

  for (const task of syncTasks) {
    await runAdminQuery<Record<string, unknown>>("/rest/v1/rpc/admin_set_platform_setting", {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_key: task.key,
        p_value: task.value,
        p_description: task.description,
        p_is_public: task.isPublic,
      },
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `${meta.label} saved successfully.`,
    data: {
      section,
      updated_at: new Date().toISOString(),
      values: validated.clean,
    },
  };
}

/**
 * 13. Update Platform Setting
 */
export async function adminUpdatePlatformSettingAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const key = String(formData.get("key") || "").trim();
  const rawValue = String(formData.get("value") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const isPublic = formData.get("isPublic") === "true";

  if (!key) {
    return { ok: false, message: "Setting key is required." };
  }

  let parsedValue: unknown = rawValue;
  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    parsedValue = rawValue;
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_set_platform_setting",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_key: key,
        p_value: parsedValue,
        p_description: description,
        p_is_public: isPublic,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update platform setting." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, message: `Setting "${key}" updated and logged to audit trail.`, data: res.data ?? undefined };
}

/**
 * 14. Fetch Commission Configuration
 */
export async function fetchAdminCommissionSettings() {
  const auth = await getAuthenticatedUser();
  const res = await runAdminQuery<Array<Record<string, unknown>>>(
    "/rest/v1/commission_settings?order=created_at.desc",
    { accessToken: auth?.accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 15. Update Commission Setting
 */
export async function adminUpdateCommissionSettingAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const categoryId = String(formData.get("categoryId") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const commissionPercentage = parseFloat(String(formData.get("commissionPercentage") || "10"));
  const flatFeeNaira = parseFloat(String(formData.get("flatFeeNaira") || "0"));
  const isActive = formData.get("isActive") !== "false";

  const commissionBps = Math.round(commissionPercentage * 100);
  const flatFeeKobo = Math.round(flatFeeNaira * 100);

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_set_commission_setting",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_category_id: categoryId,
        p_city: city,
        p_commission_bps: commissionBps,
        p_flat_fee_kobo: flatFeeKobo,
        p_is_active: isActive,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to save commission setting." };
  }

  revalidatePath("/admin/commissions");
  return { ok: true, message: "Commission tier configured successfully.", data: res.data ?? undefined };
}

/**
 * 16. Fetch Business Subscriptions
 */
export async function fetchAdminSubscriptions() {
  const auth = await getAuthenticatedUser();
  const res = await runAdminQuery<Array<Record<string, unknown>>>(
    "/rest/v1/business_subscriptions?select=*,businesses:business_id(name,slug,contact_email)&order=created_at.desc&limit=50",
    { accessToken: auth?.accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 17. Fetch Immutable Audit Logs
 */
export async function fetchAdminAuditLogs(params: {
  search?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}) {
  const auth = await getAuthenticatedUser();
  const limit = params.limit || 50;
  let query = `/rest/v1/audit_logs?select=*,profiles:actor_user_id(full_name,email)&order=created_at.desc&limit=${limit}`;

  if (params.action && params.action !== "all") {
    query += `&action=eq.${encodeURIComponent(params.action)}`;
  }

  if (params.entityType && params.entityType !== "all") {
    query += `&entity_type=eq.${encodeURIComponent(params.entityType)}`;
  }

  if (params.search && params.search.trim()) {
    const s = encodeURIComponent(params.search.trim());
    query += `&or=(action.ilike.*${s}*,entity_id.ilike.*${s}*)`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
  });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 18. Dispatch System Notification
 */
export async function adminSendNotificationAction(
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await getAuthenticatedUser();
  const recipientUserId = String(formData.get("recipientUserId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const type = String(formData.get("type") || "system_alert").trim();

  if (!recipientUserId || !title || !content) {
    return { ok: false, message: "Recipient User ID, Title, and Message content are required." };
  }

  const res = await runAdminQuery<Record<string, unknown>>(
    "/rest/v1/rpc/admin_send_notification",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: {
        p_recipient_user_id: recipientUserId,
        p_title: title,
        p_content: content,
        p_notification_type: type,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to dispatch notification." };
  }

  revalidatePath("/admin/notifications");
  return { ok: true, message: "System notification dispatched and logged to audit trail.", data: res.data ?? undefined };
}

/**
 * 19. Fetch Notifications History Log
 */
export async function fetchAdminNotificationLogs() {
  const auth = await getAuthenticatedUser();
  const res = await runAdminQuery<Array<Record<string, unknown>>>(
    "/rest/v1/notifications?select=*,profiles:user_id(full_name,email)&order=created_at.desc&limit=50",
    { accessToken: auth?.accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * 20. Fetch Platform Analytics & Phase 7 Demand/Supply Insights
 */
export async function fetchAdminAnalytics(days: number = 90) {
  const auth = await getAuthenticatedUser();
  const safeDays =
    Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 3650) : 0;

  const [metricsRes, demandRes, categoriesRes, bookingsRes, disputesRes] =
    await Promise.all([
      runAdminQuery<AdminDashboardMetrics>(
        "/rest/v1/rpc/get_admin_dashboard_metrics",
        {
          method: "POST",
          accessToken: auth?.accessToken,
        }
      ),
      runAdminQuery<AdminDemandAnalytics>(
        "/rest/v1/rpc/get_admin_demand_analytics",
        {
          method: "POST",
          body: { p_days: safeDays },
          accessToken: auth?.accessToken,
        }
      ),
      runAdminQuery<Array<{ id: string; name: string }>>(
        "/rest/v1/service_categories?select=id,name&deleted_at=is.null",
        {
          accessToken: auth?.accessToken,
        }
      ),
      runAdminQuery<
        Array<{ status: string; city: string; agreed_amount_kobo: number }>
      >(
        "/rest/v1/bookings?select=status,city,agreed_amount_kobo&deleted_at=is.null&limit=200",
        { accessToken: auth?.accessToken }
      ),
      runAdminQuery<Array<{ status: string; category: string }>>(
        "/rest/v1/disputes?select=status,category&limit=100",
        { accessToken: auth?.accessToken }
      ),
    ]);

  return {
    metrics: metricsRes.ok ? metricsRes.data : null,
    demandAnalytics: demandRes.ok ? demandRes.data : null,
    categoriesCount:
      categoriesRes.ok && Array.isArray(categoriesRes.data)
        ? categoriesRes.data.length
        : 0,
    bookingsSample:
      bookingsRes.ok && Array.isArray(bookingsRes.data) ? bookingsRes.data : [],
    disputesSample:
      disputesRes.ok && Array.isArray(disputesRes.data) ? disputesRes.data : [],
  };
}

/**
 * 23. Fetch Job Vacancies for Admin Operations & Moderation
 */
export async function fetchAdminJobs(params: {
  status?: string;
  moderationStatus?: string;
  search?: string;
  city?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{
  vacancies: Array<Record<string, unknown>>;
  totalCount: number;
}> {
  const auth = await getAuthenticatedUser();
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const offset = Math.max(0, params.offset ?? 0);

  let query = `/rest/v1/job_vacancies?select=*,posted_by_profile:profiles!posted_by(id,full_name,email,phone),employer:employer_profiles(id,company_name,city),business:businesses(id,name,city)&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (params.moderationStatus && params.moderationStatus !== "all") {
    query += `&moderation_status=eq.${encodeURIComponent(params.moderationStatus)}`;
  }
  if (params.status && params.status !== "all") {
    query += `&status=eq.${encodeURIComponent(params.status)}`;
  }
  if (params.city && params.city !== "all") {
    query += `&city=ilike.*${encodeURIComponent(params.city)}*`;
  }
  if (params.search?.trim()) {
    const q = encodeURIComponent(params.search.trim());
    query += `&or=(title.ilike.*${q}*,description.ilike.*${q}*,city.ilike.*${q}*)`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
    headers: { Prefer: "count=exact" },
  });

  const vacancies = res.ok && Array.isArray(res.data) ? res.data : [];
  return {
    vacancies,
    totalCount:
      res.ok && res.totalCount !== undefined && res.totalCount !== null
        ? res.totalCount
        : vacancies.length,
  };
}

/**
 * 24. Moderate a Job Vacancy (Approve, Reject, Close)
 */
export async function moderateJobVacancyAction(
  vacancyId: string,
  decision: "approved" | "rejected" | "closed",
  reason?: string
): Promise<AdminActionResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized. Administrator privileges required." };
  }

  const updatePayload: Record<string, unknown> = {
    moderation_status: decision === "closed" ? "approved" : decision,
    moderated_at: new Date().toISOString(),
    moderated_by: adminCheck.user.id,
    updated_at: new Date().toISOString(),
  };

  if (decision === "closed") {
    updatePayload.status = "closed";
  } else if (decision === "approved") {
    updatePayload.status = "open";
    updatePayload.rejection_reason = null;
  } else if (decision === "rejected") {
    updatePayload.status = "closed";
    updatePayload.rejection_reason = reason?.trim() || "Does not meet platform trade standards.";
  }

  const res = await runAdminQuery(
    `/rest/v1/job_vacancies?id=eq.${vacancyId}`,
    {
      method: "PATCH",
      body: updatePayload,
      accessToken: adminCheck.accessToken,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update vacancy moderation status." };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${vacancyId}`);

  return {
    ok: true,
    message: `Job vacancy has been ${decision === "approved" ? "approved and published" : decision === "rejected" ? "rejected" : "closed"}.`,
  };
}

/**
 * 25. Delete a Job Vacancy (Permanent or Soft Delete)
 */
export async function deleteJobVacancyAction(
  vacancyId: string
): Promise<AdminActionResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized. Administrator privileges required." };
  }

  const res = await runAdminQuery(
    `/rest/v1/job_vacancies?id=eq.${vacancyId}`,
    {
      method: "PATCH",
      body: {
        deleted_at: new Date().toISOString(),
        status: "closed",
        updated_at: new Date().toISOString(),
      },
      accessToken: adminCheck.accessToken,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to remove vacancy." };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");

  return { ok: true, message: "Job vacancy has been removed." };
}

/**
 * 26. Fetch Job Applications for Admin Inspection
 */
export async function fetchAdminJobApplications(params: {
  vacancyId?: string;
  status?: string;
  limit?: number;
} = {}): Promise<Array<Record<string, unknown>>> {
  const auth = await getAuthenticatedUser();
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));

  let query = `/rest/v1/job_applications?select=*,vacancy:job_vacancies(id,title,city,status),applicant:profiles!applicant_id(id,full_name,email,phone)&order=created_at.desc&limit=${limit}`;

  if (params.vacancyId) {
    query += `&vacancy_id=eq.${params.vacancyId}`;
  }
  if (params.status && params.status !== "all") {
    query += `&status=eq.${encodeURIComponent(params.status)}`;
  }

  const res = await runAdminQuery<Array<Record<string, unknown>>>(query, {
    accessToken: auth?.accessToken,
  });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}
