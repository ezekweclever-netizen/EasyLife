"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { storageService } from "@/lib/storage/storage-service";
import type {
  AdminDashboardMetrics,
  AdminDemandAnalytics,
  VerificationStatus,
  UserRole,
} from "@easylife/shared-types";

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

  let query = `/rest/v1/profiles?select=*,user_roles(role,is_active)&order=created_at.desc&limit=${limit}&offset=${offset}`;

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
 * 12. Fetch Platform Operational Settings
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
