"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type {
  AssetCategory,
  BusinessDashboardMetrics,
  BusinessMemberRole,
  FaultSeverityLevel,
  PropertyType,
} from "@easylife/shared-types";

export interface BusinessActionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * 1. Register a new business account
 */
export async function createBusinessAccountAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to register a business." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const registrationNumber = String(formData.get("registrationNumber") || "").trim();
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const state = String(formData.get("state") || "Rivers State").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name || name.length < 2) {
    return { ok: false, message: "Business name must be at least 2 characters." };
  }
  if (!contactEmail || !contactEmail.includes("@")) {
    return { ok: false, message: "A valid business email address is required." };
  }

  const res = await supabaseFetch<Record<string, unknown>>(
    config,
    "/rest/v1/rpc/create_business_account",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_owner_id: auth.user.id,
        p_name: name,
        p_slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        p_contact_email: contactEmail,
        p_contact_phone: contactPhone || null,
        p_industry: industry || null,
        p_registration_number: registrationNumber || null,
        p_city: city,
        p_state: state,
        p_address: address || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to create business: ${res.message}` };
  }

  revalidatePath("/business");
  return { ok: true, message: "Business registered successfully!", data: res.data };
}

/**
 * 2. Manage (create or edit) a Property
 */
export async function managePropertyAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const propertyId = String(formData.get("propertyId") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const propertyType = (String(formData.get("propertyType") || "commercial") as PropertyType);
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const state = String(formData.get("state") || "Rivers State").trim();
  const lga = String(formData.get("lga") || "").trim();
  const unitsCount = parseInt(String(formData.get("unitsCount") || "1"), 10);
  const notes = String(formData.get("notes") || "").trim();

  if (!businessId || !name || !code || !address) {
    return { ok: false, message: "Business ID, Property Name, Code, and Address are required." };
  }

  const res = await supabaseFetch<Record<string, unknown>>(
    config,
    "/rest/v1/rpc/manage_business_property",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_property_id: propertyId,
        p_business_id: businessId,
        p_manager_user_id: auth.user.id,
        p_name: name,
        p_code: code,
        p_property_type: propertyType,
        p_address: address,
        p_city: city,
        p_state: state,
        p_lga_or_district: lga || null,
        p_units_count: isNaN(unitsCount) ? 1 : unitsCount,
        p_notes: notes || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to save property: ${res.message}` };
  }

  revalidatePath("/business/properties");
  revalidatePath("/business");
  return { ok: true, message: "Property saved successfully!", data: res.data };
}

/**
 * 3. Manage (create or edit) an Equipment Asset
 */
export async function manageAssetAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const assetId = String(formData.get("assetId") || "").trim() || null;
  const propertyId = String(formData.get("propertyId") || "").trim();
  const assetCategory = (String(formData.get("assetCategory") || "other") as AssetCategory);
  const name = String(formData.get("name") || "").trim();
  const assetTag = String(formData.get("assetTag") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const modelNumber = String(formData.get("modelNumber") || "").trim();
  const serialNumber = String(formData.get("serialNumber") || "").trim();
  const locationInProperty = String(formData.get("locationInProperty") || "").trim();
  const installationDate = String(formData.get("installationDate") || "").trim() || null;
  const intervalDays = parseInt(String(formData.get("maintenanceIntervalDays") || "90"), 10);
  const notes = String(formData.get("notes") || "").trim();
  const documentsJson = String(formData.get("documentsJson") || "[]");

  if (!businessId || !propertyId || !name || !assetTag) {
    return { ok: false, message: "Business, Property, Asset Name, and Asset Tag are required." };
  }

  let parsedDocuments: unknown[] = [];
  try {
    parsedDocuments = JSON.parse(documentsJson);
  } catch {
    parsedDocuments = [];
  }

  const res = await supabaseFetch<Record<string, unknown>>(
    config,
    "/rest/v1/rpc/manage_business_asset",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_asset_id: assetId,
        p_business_id: businessId,
        p_property_id: propertyId,
        p_category_id: null,
        p_asset_category: assetCategory,
        p_name: name,
        p_asset_tag: assetTag,
        p_brand: brand || null,
        p_model_number: modelNumber || null,
        p_serial_number: serialNumber || null,
        p_location_in_property: locationInProperty || null,
        p_status: "operational",
        p_installation_date: installationDate,
        p_maintenance_interval_days: isNaN(intervalDays) ? 90 : intervalDays,
        p_specifications: {},
        p_documents: parsedDocuments,
        p_notes: notes || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to save asset: ${res.message}` };
  }

  revalidatePath("/business/assets");
  revalidatePath("/business");
  return { ok: true, message: "Asset registered successfully!", data: res.data };
}

/**
 * 4. Report Fault & Create Maintenance Request
 */
export async function createMaintenanceRequestAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const propertyId = String(formData.get("propertyId") || "").trim();
  const assetId = String(formData.get("assetId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const faultSeverity = (String(formData.get("faultSeverity") || "medium") as FaultSeverityLevel);
  const scheduledDate = String(formData.get("scheduledDate") || "").trim() || null;
  const estimatedCostNaira = parseFloat(String(formData.get("estimatedCostNaira") || "0"));
  const photosJson = String(formData.get("photosJson") || "[]");

  if (!businessId || !propertyId || !title || !description) {
    return { ok: false, message: "Business, Property, Title, and Fault Description are required." };
  }

  let parsedPhotos: string[] = [];
  try {
    parsedPhotos = JSON.parse(photosJson);
  } catch {
    parsedPhotos = [];
  }

  const res = await supabaseFetch<Record<string, unknown>>(
    config,
    "/rest/v1/rpc/create_business_maintenance_request",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_business_id: businessId,
        p_property_id: propertyId,
        p_asset_id: assetId,
        p_category_id: null,
        p_requested_by: auth.user.id,
        p_title: title,
        p_description: description,
        p_fault_severity: faultSeverity,
        p_assigned_professional_id: null,
        p_scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        p_estimated_cost_kobo: Math.round(estimatedCostNaira * 100),
        p_photos: parsedPhotos,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to create maintenance request: ${res.message}` };
  }

  revalidatePath("/business/maintenance");
  revalidatePath("/business");
  return { ok: true, message: "Maintenance request created successfully!", data: res.data };
}

/**
 * 5. Record Completed Maintenance & Incurred Cost
 */
export async function recordMaintenanceCompletionAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const requestId = String(formData.get("requestId") || "").trim() || null;
  const propertyId = String(formData.get("propertyId") || "").trim();
  const assetId = String(formData.get("assetId") || "").trim() || null;
  const performedByName = String(formData.get("performedByName") || "EasyLife Verified Technician").trim();
  const summary = String(formData.get("summary") || "").trim();
  const workPerformed = String(formData.get("workPerformed") || "").trim();
  const partsReplaced = String(formData.get("partsReplaced") || "").trim() || null;
  const costNaira = parseFloat(String(formData.get("costNaira") || "0"));
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim() || null;
  const invoiceUrl = String(formData.get("invoiceUrl") || "").trim() || null;

  if (!businessId || !propertyId || !summary || !workPerformed) {
    return { ok: false, message: "Business, Property, Summary, and Work Details are required." };
  }

  const res = await supabaseFetch<Record<string, unknown>>(
    config,
    "/rest/v1/rpc/record_business_maintenance_completion",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_request_id: requestId,
        p_business_id: businessId,
        p_property_id: propertyId,
        p_asset_id: assetId,
        p_recorded_by_user_id: auth.user.id,
        p_performed_by_name: performedByName,
        p_summary: summary,
        p_work_performed: workPerformed,
        p_cost_kobo: Math.round(costNaira * 100),
        p_parts_replaced: partsReplaced,
        p_performed_by_professional_id: null,
        p_invoice_number: invoiceNumber,
        p_invoice_url: invoiceUrl,
        p_attachments: invoiceUrl ? [{ name: "Invoice", url: invoiceUrl }] : [],
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to record maintenance: ${res.message}` };
  }

  revalidatePath("/business/maintenance");
  revalidatePath("/business");
  return { ok: true, message: "Maintenance activity and costs recorded!", data: res.data };
}

/**
 * 6. Create Maintenance Schedule
 */
export async function createMaintenanceScheduleAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const propertyId = String(formData.get("propertyId") || "").trim();
  const assetId = String(formData.get("assetId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const frequency = String(formData.get("frequency") || "monthly");
  const nextDueDate = String(formData.get("nextDueDate") || "").trim();
  const estimatedCostNaira = parseFloat(String(formData.get("estimatedCostNaira") || "0"));

  if (!businessId || !propertyId || !title || !nextDueDate) {
    return { ok: false, message: "Business, Property, Title, and Next Due Date are required." };
  }

  // Get a fallback category ID if none specified
  const catRes = await supabaseFetch<Array<{ id: string }>>(
    config,
    "/rest/v1/service_categories?select=id&limit=1",
    { accessToken: auth.accessToken }
  );
  const categoryId = catRes.ok && catRes.data?.[0]?.id ? catRes.data[0].id : null;

  const intervalDaysMap: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
    biannual: 180,
    annual: 365,
  };

  const intervalDays = intervalDaysMap[frequency] || 30;

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    "/rest/v1/maintenance_schedules",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "return=representation" },
      body: {
        business_id: businessId,
        property_id: propertyId,
        asset_id: assetId,
        category_id: categoryId,
        created_by: auth.user.id,
        title,
        description: description || null,
        frequency,
        interval_days: intervalDays,
        estimated_cost_kobo: Math.round(estimatedCostNaira * 100),
        next_due_date: nextDueDate,
        is_active: true,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to create schedule: ${res.message}` };
  }

  revalidatePath("/business/schedules");
  revalidatePath("/business");
  return { ok: true, message: "Maintenance schedule created!", data: res.data?.[0] };
}

/**
 * 7. Invite a team member
 */
export async function inviteTeamMemberAction(
  formData: FormData
): Promise<BusinessActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const businessId = String(formData.get("businessId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = (String(formData.get("role") || "facility_manager") as BusinessMemberRole);
  const permissionsJson = String(formData.get("permissionsJson") || '["view", "create_requests"]');

  if (!businessId || !email || !email.includes("@")) {
    return { ok: false, message: "Valid Business ID and member Email address are required." };
  }

  let permissions = ["view", "create_requests"];
  try {
    permissions = JSON.parse(permissionsJson);
  } catch {
    permissions = ["view", "create_requests"];
  }

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    "/rest/v1/business_invitations",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "return=representation" },
      body: {
        business_id: businessId,
        email,
        role,
        permissions,
        invited_by: auth.user.id,
        status: "pending",
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: `Failed to invite team member: ${res.message}` };
  }

  revalidatePath("/business/team");
  return { ok: true, message: `Invitation sent to ${email}`, data: res.data?.[0] };
}

/**
 * 8. Fetch Dashboard Metrics
 */
export async function fetchBusinessDashboardMetrics(
  businessId: string
): Promise<BusinessDashboardMetrics | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const auth = await getAuthenticatedUser();
  const res = await supabaseFetch<BusinessDashboardMetrics>(
    config,
    "/rest/v1/rpc/get_business_dashboard_metrics",
    {
      method: "POST",
      accessToken: auth?.accessToken,
      body: { p_business_id: businessId },
    }
  );

  if (!res.ok) {
    return null;
  }

  return res.data;
}

/**
 * 9. Fetch user's accessible businesses
 */
export async function fetchUserBusinesses() {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  // Query businesses where owner_id = user.id
  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    `/rest/v1/businesses?select=*&order=created_at.desc`,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 10. Fetch properties for a business
 */
export async function fetchBusinessProperties(businessId: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    `/rest/v1/properties?business_id=eq.${businessId}&order=created_at.desc`,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 11. Fetch assets for a business
 */
export async function fetchBusinessAssets(businessId: string, propertyId?: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  let path = `/rest/v1/assets?business_id=eq.${businessId}&order=created_at.desc`;
  if (propertyId) {
    path += `&property_id=eq.${propertyId}`;
  }

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    path,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 12. Fetch maintenance requests for a business
 */
export async function fetchBusinessMaintenanceRequests(businessId: string, propertyId?: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  let path = `/rest/v1/maintenance_requests?business_id=eq.${businessId}&order=created_at.desc`;
  if (propertyId) {
    path += `&property_id=eq.${propertyId}`;
  }

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    path,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 13. Fetch maintenance schedules for a business
 */
export async function fetchBusinessMaintenanceSchedules(businessId: string, propertyId?: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  let path = `/rest/v1/maintenance_schedules?business_id=eq.${businessId}&order=next_due_date.asc`;
  if (propertyId) {
    path += `&property_id=eq.${propertyId}`;
  }

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    path,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 14. Fetch maintenance records (history) for a business
 */
export async function fetchBusinessMaintenanceRecords(businessId: string, propertyId?: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  let path = `/rest/v1/maintenance_records?business_id=eq.${businessId}&order=performed_at.desc`;
  if (propertyId) {
    path += `&property_id=eq.${propertyId}`;
  }

  const res = await supabaseFetch<Array<Record<string, unknown>>>(
    config,
    path,
    {
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return [];
  return res.data;
}

/**
 * 15. Fetch team members and invitations
 */
export async function fetchBusinessTeam(businessId: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) return { members: [], invitations: [] };

  const config = getSupabasePublicConfig();
  if (!config) return { members: [], invitations: [] };

  const [membersRes, invitationsRes] = await Promise.all([
    supabaseFetch<Array<Record<string, unknown>>>(
      config,
      `/rest/v1/business_members?business_id=eq.${businessId}&select=*,profiles:user_id(id,email,full_name)`,
      { accessToken: auth.accessToken }
    ),
    supabaseFetch<Array<Record<string, unknown>>>(
      config,
      `/rest/v1/business_invitations?business_id=eq.${businessId}&order=created_at.desc`,
      { accessToken: auth.accessToken }
    ),
  ]);

  return {
    members: membersRes.ok ? membersRes.data : [],
    invitations: invitationsRes.ok ? invitationsRes.data : [],
  };
}

/**
 * 16. Get or resolve active business for the current context
 */
export async function getActiveBusiness(): Promise<Record<string, any> | null> {
  const businesses = await fetchUserBusinesses();
  if (businesses && businesses.length > 0) {
    return businesses[0] ?? null;
  }

  const config = getSupabasePublicConfig();
  if (!config) return null;

  const res = await supabaseFetch<Array<Record<string, any>>>(
    config,
    "/rest/v1/businesses?select=*&limit=1&order=created_at.desc"
  );

  if (res.ok && res.data && res.data.length > 0) {
    return res.data[0] ?? null;
  }

  return null;
}

