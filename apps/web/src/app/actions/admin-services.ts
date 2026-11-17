"use server";

import type {
  DocumentType,
  ProviderType,
  ServiceLifecycleStatus,
  ServiceRequirementAppliesTo,
  ServiceRequirementRow,
  ServiceRequirementType,
  ServiceRow,
} from "@easylife/shared-types";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import {
  generateDefaultServiceCode,
  normalizeServiceCode,
  parseKeywordsInput,
  recordCatalogueAuditLog,
  revalidateCataloguePaths,
  sanitizeCatalogueImageUrl,
  slugifyCatalogueText,
  uploadCatalogueImageFile,
} from "@/lib/supabase/admin-catalogue";

export interface ServiceFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  data?: ServiceRow;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_PROVIDER_TYPES = new Set<ProviderType>([
  "trade_technician",
  "dispatch_rider",
  "property_agent",
  "general_artisan",
]);

const VALID_DOCUMENT_TYPES = new Set<DocumentType>([
  "national_id_nin",
  "voters_card",
  "drivers_license",
  "international_passport",
  "trade_certificate",
  "cac_certificate",
  "utility_bill",
  "other",
]);

const VALID_REQUIREMENT_TYPES = new Set<ServiceRequirementType>([
  "customer_input",
  "photo_evidence",
  "site_access",
  "provider_credential",
  "safety_compliance",
  "equipment_or_tools",
  "inspection",
]);

const VALID_APPLIES_TO = new Set<ServiceRequirementAppliesTo>([
  "customer",
  "professional",
  "both",
]);

function parseBoolFlag(value: FormDataEntryValue | null, defaultValue = false): boolean {
  if (value === null) return defaultValue;
  const str = String(value).trim().toLowerCase();
  return str === "true" || str === "1" || str === "on";
}

function parseNairaToKobo(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return Number.NaN;
  return Math.round(num * 100);
}

function mapServiceDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("hierarchy_error:")) {
    return message.replace(/^.*hierarchy_error:\s*/i, "");
  }
  if (lower.includes("services_slug_unique")) {
    return "A catalogue service with that URL slug already exists.";
  }
  if (lower.includes("services_code_unique")) {
    return "A catalogue service with that Service Code already exists.";
  }
  if (lower.includes("uq_services_active_name_per_parent")) {
    return "An active service with this exact name already exists in the selected category/subcategory.";
  }
  if (lower.includes("service_requirements_unique_key")) {
    return "A requirement with this requirement_key already exists for this service.";
  }
  return message || "Failed to save catalogue service.";
}

/**
 * Admin: Create a new individual service under a Main Category (and optional Subcategory).
 */
export async function createServiceAction(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      status: "error",
      message: "Unauthorized: Administrator privileges required.",
    };
  }

  const categoryId = String(formData.get("categoryId") || "").trim();
  const subcategoryId = String(formData.get("subcategoryId") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const rawCode = String(formData.get("serviceCode") || "").trim();
  const shortDescription = String(formData.get("shortDescription") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const iconName = String(formData.get("iconName") || "tool").trim() || "tool";
  const keywords = parseKeywordsInput(String(formData.get("keywords") || ""));
  const displayOrder = parseInt(String(formData.get("displayOrder") || "0"), 10);

  const minPriceKobo = parseNairaToKobo(String(formData.get("basePriceMinNaira") || "0"));
  const maxPriceKobo = parseNairaToKobo(String(formData.get("basePriceMaxNaira") || ""));
  const rawDuration = String(formData.get("estimatedDurationMinutes") || "").trim();
  const estimatedDuration = rawDuration ? parseInt(rawDuration, 10) : null;
  const rawCommBps = String(formData.get("defaultCommissionBps") || "").trim();
  const defaultCommissionBps = rawCommBps ? parseInt(rawCommBps, 10) : null;

  const isActive = parseBoolFlag(formData.get("isActive"), true);
  const isFeatured = parseBoolFlag(formData.get("isFeatured"), false);
  const isPopular = parseBoolFlag(formData.get("isPopular"), false);
  const showOnHomepage = parseBoolFlag(formData.get("showOnHomepage"), false);

  const requiresVerifiedIdentity = parseBoolFlag(
    formData.get("requiresVerifiedIdentity"),
    true
  );
  const requiresTradeCertification = parseBoolFlag(
    formData.get("requiresTradeCertification"),
    false
  );
  const requiresBusinessRegistration = parseBoolFlag(
    formData.get("requiresBusinessRegistration"),
    false
  );
  const requiresSiteInspection = parseBoolFlag(
    formData.get("requiresSiteInspection"),
    false
  );
  const minYearsExperience = parseInt(
    String(formData.get("minYearsExperience") || "0"),
    10
  );

  const eligibleProviderTypes = formData
    .getAll("eligibleProviderTypes")
    .map((v) => String(v).trim() as ProviderType)
    .filter((v) => VALID_PROVIDER_TYPES.has(v));

  const requiredDocumentTypes = formData
    .getAll("requiredDocumentTypes")
    .map((v) => String(v).trim() as DocumentType)
    .filter((v) => VALID_DOCUMENT_TYPES.has(v));

  const rawImageUrl = String(formData.get("imageUrl") || "").trim();
  const imageFileEntry = formData.get("imageFile");

  const fieldErrors: Record<string, string> = {};

  if (!categoryId || !UUID_REGEX.test(categoryId)) {
    fieldErrors.categoryId = "Please select a valid main category.";
  }
  if (subcategoryId && !UUID_REGEX.test(subcategoryId)) {
    fieldErrors.subcategoryId = "Invalid subcategory selected.";
  }
  if (!name || name.length < 2) {
    fieldErrors.name = "Service name must be at least 2 characters.";
  }

  const slug = slugifyCatalogueText(rawSlug || name);
  if (!slug || slug.length < 2) {
    fieldErrors.slug = "Please enter a valid URL slug.";
  }

  const serviceCode = rawCode
    ? normalizeServiceCode(rawCode)
    : generateDefaultServiceCode(slug || name);
  if (!serviceCode || serviceCode.length < 3) {
    fieldErrors.serviceCode = "Service code must be at least 3 characters.";
  }

  if (minPriceKobo === null || Number.isNaN(minPriceKobo) || minPriceKobo < 0) {
    fieldErrors.basePriceMinNaira = "Minimum base price must be 0 or higher.";
  }
  if (
    maxPriceKobo !== null &&
    (Number.isNaN(maxPriceKobo) ||
      (minPriceKobo !== null && !Number.isNaN(minPriceKobo) && maxPriceKobo < minPriceKobo))
  ) {
    fieldErrors.basePriceMaxNaira =
      "Maximum base price must be greater than or equal to minimum price.";
  }

  if (
    estimatedDuration !== null &&
    (Number.isNaN(estimatedDuration) || estimatedDuration <= 0)
  ) {
    fieldErrors.estimatedDurationMinutes =
      "Estimated duration must be a positive number of minutes.";
  }

  if (
    defaultCommissionBps !== null &&
    (Number.isNaN(defaultCommissionBps) ||
      defaultCommissionBps < 0 ||
      defaultCommissionBps > 5000)
  ) {
    fieldErrors.defaultCommissionBps =
      "Commission override must be between 0% (0 bps) and 50% (5000 bps).";
  }

  if (
    Number.isNaN(minYearsExperience) ||
    minYearsExperience < 0 ||
    minYearsExperience > 50
  ) {
    fieldErrors.minYearsExperience =
      "Minimum years of experience must be between 0 and 50.";
  }

  if (eligibleProviderTypes.length === 0) {
    fieldErrors.eligibleProviderTypes =
      "Select at least one eligible provider type.";
  }

  const imageCheck = sanitizeCatalogueImageUrl(rawImageUrl);
  if (!imageCheck.valid) {
    fieldErrors.imageUrl = imageCheck.error || "Invalid service image URL.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please review the highlighted fields.",
      fieldErrors,
    };
  }

  let resolvedImageUrl: string | null = imageCheck.url;
  if (imageFileEntry instanceof File && imageFileEntry.size > 0) {
    const upload = await uploadCatalogueImageFile({
      file: imageFileEntry,
      folder: "services",
      slug,
      adminUserId: adminCheck.user.id,
    });
    if (!upload.ok) {
      return { status: "error", message: upload.message };
    }
    resolvedImageUrl = upload.url;
  }

  const payload = {
    category_id: categoryId,
    subcategory_id: subcategoryId,
    service_code: serviceCode,
    name,
    slug,
    short_description: shortDescription,
    description,
    image_url: resolvedImageUrl,
    icon_name: iconName,
    keywords,
    display_order: Number.isNaN(displayOrder) ? 0 : Math.max(0, displayOrder),
    is_active: isActive,
    is_featured: isFeatured,
    is_popular: isPopular,
    show_on_homepage: showOnHomepage,
    base_price_min_kobo: minPriceKobo ?? 0,
    base_price_max_kobo: maxPriceKobo,
    estimated_duration_minutes: estimatedDuration,
    default_commission_bps: defaultCommissionBps,
    requires_verified_identity: requiresVerifiedIdentity,
    requires_trade_certification: requiresTradeCertification,
    requires_business_registration: requiresBusinessRegistration,
    requires_site_inspection: requiresSiteInspection,
    min_years_experience: minYearsExperience,
    eligible_provider_types: Array.from(new Set(eligibleProviderTypes)),
    required_document_types:
      requiredDocumentTypes.length > 0
        ? Array.from(new Set(requiredDocumentTypes))
        : (["national_id_nin"] as DocumentType[]),
    created_by: adminCheck.user.id,
    updated_by: adminCheck.user.id,
  };

  const res = await supabaseAdminFetch<ServiceRow[]>("/rest/v1/services", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: payload,
  });

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      status: "error",
      message: mapServiceDbError(res.ok ? "Creation returned empty row." : res.message),
    };
  }

  const created = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.created",
    entityType: "service",
    entityId: created.id,
    newValues: {
      service_code: created.service_code,
      name: created.name,
      category_id: created.category_id,
      subcategory_id: created.subcategory_id,
      is_active: created.is_active,
      requires_trade_certification: created.requires_trade_certification,
      min_years_experience: created.min_years_experience,
    },
  });

  revalidateCataloguePaths();

  return {
    status: "success",
    message: `Service "${created.name}" (${created.service_code}) created successfully.`,
    data: created,
  };
}

/**
 * Admin: Update an existing individual service, its pricing, hierarchy, media, or eligibility rules.
 */
export async function updateServiceAction(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      status: "error",
      message: "Unauthorized: Administrator privileges required.",
    };
  }

  const id = String(formData.get("id") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const subcategoryId = String(formData.get("subcategoryId") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const rawCode = String(formData.get("serviceCode") || "").trim();
  const shortDescription = String(formData.get("shortDescription") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const iconName = String(formData.get("iconName") || "tool").trim() || "tool";
  const keywords = parseKeywordsInput(String(formData.get("keywords") || ""));
  const displayOrder = parseInt(String(formData.get("displayOrder") || "0"), 10);

  const minPriceKobo = parseNairaToKobo(String(formData.get("basePriceMinNaira") || "0"));
  const maxPriceKobo = parseNairaToKobo(String(formData.get("basePriceMaxNaira") || ""));
  const rawDuration = String(formData.get("estimatedDurationMinutes") || "").trim();
  const estimatedDuration = rawDuration ? parseInt(rawDuration, 10) : null;
  const rawCommBps = String(formData.get("defaultCommissionBps") || "").trim();
  const defaultCommissionBps = rawCommBps ? parseInt(rawCommBps, 10) : null;

  const isActive = parseBoolFlag(formData.get("isActive"), true);
  const isFeatured = parseBoolFlag(formData.get("isFeatured"), false);
  const isPopular = parseBoolFlag(formData.get("isPopular"), false);
  const showOnHomepage = parseBoolFlag(formData.get("showOnHomepage"), false);

  const requiresVerifiedIdentity = parseBoolFlag(
    formData.get("requiresVerifiedIdentity"),
    true
  );
  const requiresTradeCertification = parseBoolFlag(
    formData.get("requiresTradeCertification"),
    false
  );
  const requiresBusinessRegistration = parseBoolFlag(
    formData.get("requiresBusinessRegistration"),
    false
  );
  const requiresSiteInspection = parseBoolFlag(
    formData.get("requiresSiteInspection"),
    false
  );
  const minYearsExperience = parseInt(
    String(formData.get("minYearsExperience") || "0"),
    10
  );

  const eligibleProviderTypes = formData
    .getAll("eligibleProviderTypes")
    .map((v) => String(v).trim() as ProviderType)
    .filter((v) => VALID_PROVIDER_TYPES.has(v));

  const requiredDocumentTypes = formData
    .getAll("requiredDocumentTypes")
    .map((v) => String(v).trim() as DocumentType)
    .filter((v) => VALID_DOCUMENT_TYPES.has(v));

  const removeImage = parseBoolFlag(formData.get("removeImage"), false);
  const rawImageUrl = formData.get("imageUrl");
  const imageFileEntry = formData.get("imageFile");

  if (!id || !UUID_REGEX.test(id)) {
    return { status: "error", message: "Valid Service ID is required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${id}&limit=1&select=*`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { status: "error", message: "Catalogue service record not found." };
  }

  const fieldErrors: Record<string, string> = {};

  if (!categoryId || !UUID_REGEX.test(categoryId)) {
    fieldErrors.categoryId = "Please select a valid main category.";
  }
  if (subcategoryId && !UUID_REGEX.test(subcategoryId)) {
    fieldErrors.subcategoryId = "Invalid subcategory selected.";
  }
  if (!name || name.length < 2) {
    fieldErrors.name = "Service name must be at least 2 characters.";
  }

  const slug = slugifyCatalogueText(rawSlug || existing.slug || name);
  if (!slug || slug.length < 2) {
    fieldErrors.slug = "Please provide a valid URL slug.";
  }

  const serviceCode = rawCode
    ? normalizeServiceCode(rawCode)
    : existing.service_code;
  if (!serviceCode || serviceCode.length < 3) {
    fieldErrors.serviceCode = "Service code must be at least 3 characters.";
  }

  if (minPriceKobo === null || Number.isNaN(minPriceKobo) || minPriceKobo < 0) {
    fieldErrors.basePriceMinNaira = "Minimum base price must be 0 or higher.";
  }
  if (
    maxPriceKobo !== null &&
    (Number.isNaN(maxPriceKobo) ||
      (minPriceKobo !== null && !Number.isNaN(minPriceKobo) && maxPriceKobo < minPriceKobo))
  ) {
    fieldErrors.basePriceMaxNaira =
      "Maximum base price must be greater than or equal to minimum price.";
  }
  if (
    estimatedDuration !== null &&
    (Number.isNaN(estimatedDuration) || estimatedDuration <= 0)
  ) {
    fieldErrors.estimatedDurationMinutes =
      "Estimated duration must be a positive number of minutes.";
  }
  if (
    defaultCommissionBps !== null &&
    (Number.isNaN(defaultCommissionBps) ||
      defaultCommissionBps < 0 ||
      defaultCommissionBps > 5000)
  ) {
    fieldErrors.defaultCommissionBps =
      "Commission override must be between 0% (0 bps) and 50% (5000 bps).";
  }
  if (
    Number.isNaN(minYearsExperience) ||
    minYearsExperience < 0 ||
    minYearsExperience > 50
  ) {
    fieldErrors.minYearsExperience =
      "Minimum years of experience must be between 0 and 50.";
  }
  if (eligibleProviderTypes.length === 0) {
    fieldErrors.eligibleProviderTypes =
      "Select at least one eligible provider type.";
  }

  let resolvedImageUrl: string | null = existing.image_url ?? null;
  if (removeImage) {
    resolvedImageUrl = null;
  } else if (rawImageUrl !== null) {
    const imgCheck = sanitizeCatalogueImageUrl(String(rawImageUrl));
    if (!imgCheck.valid) {
      fieldErrors.imageUrl = imgCheck.error || "Invalid service image URL.";
    } else {
      resolvedImageUrl = imgCheck.url;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please review the highlighted fields.",
      fieldErrors,
    };
  }

  if (imageFileEntry instanceof File && imageFileEntry.size > 0) {
    const upload = await uploadCatalogueImageFile({
      file: imageFileEntry,
      folder: "services",
      slug,
      adminUserId: adminCheck.user.id,
    });
    if (!upload.ok) {
      return { status: "error", message: upload.message };
    }
    resolvedImageUrl = upload.url;
  }

  const payload = {
    category_id: categoryId,
    subcategory_id: subcategoryId,
    service_code: serviceCode,
    name,
    slug,
    short_description: shortDescription,
    description,
    image_url: resolvedImageUrl,
    icon_name: iconName,
    keywords,
    display_order: Number.isNaN(displayOrder) ? existing.display_order : Math.max(0, displayOrder),
    is_active: isActive,
    is_featured: isFeatured,
    is_popular: isPopular,
    show_on_homepage: showOnHomepage,
    base_price_min_kobo: minPriceKobo ?? 0,
    base_price_max_kobo: maxPriceKobo,
    estimated_duration_minutes: estimatedDuration,
    default_commission_bps: defaultCommissionBps,
    requires_verified_identity: requiresVerifiedIdentity,
    requires_trade_certification: requiresTradeCertification,
    requires_business_registration: requiresBusinessRegistration,
    requires_site_inspection: requiresSiteInspection,
    min_years_experience: minYearsExperience,
    eligible_provider_types: Array.from(new Set(eligibleProviderTypes)),
    required_document_types:
      requiredDocumentTypes.length > 0
        ? Array.from(new Set(requiredDocumentTypes))
        : (["national_id_nin"] as DocumentType[]),
    updated_by: adminCheck.user.id,
    updated_at: new Date().toISOString(),
  };

  const res = await supabaseAdminFetch<ServiceRow[]>(`/rest/v1/services?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: payload,
  });

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      status: "error",
      message: mapServiceDbError(res.ok ? "Update returned empty row." : res.message),
    };
  }

  const updated = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.updated",
    entityType: "service",
    entityId: id,
    oldValues: {
      name: existing.name,
      category_id: existing.category_id,
      subcategory_id: existing.subcategory_id,
      is_active: existing.is_active,
      requires_trade_certification: existing.requires_trade_certification,
      min_years_experience: existing.min_years_experience,
    },
    newValues: {
      name: updated.name,
      category_id: updated.category_id,
      subcategory_id: updated.subcategory_id,
      is_active: updated.is_active,
      requires_trade_certification: updated.requires_trade_certification,
      min_years_experience: updated.min_years_experience,
    },
  });

  revalidateCataloguePaths();

  return {
    status: "success",
    message: `Service "${updated.name}" updated successfully.`,
    data: updated,
  };
}

/**
 * Admin: Quick-toggle service visibility/status flags.
 */
export async function toggleServiceFlagAction(
  serviceId: string,
  field: "is_active" | "is_featured" | "is_popular" | "show_on_homepage",
  value: boolean
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}&limit=1&select=id,name,deleted_at,is_active,is_featured,is_popular,show_on_homepage`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Service not found." };
  }
  if (existing.deleted_at) {
    return {
      ok: false,
      message: "Archived services must be restored before changing visibility flags.",
    };
  }

  const res = await supabaseAdminFetch(`/rest/v1/services?id=eq.${serviceId}`, {
    method: "PATCH",
    body: {
      [field]: value,
      updated_by: adminCheck.user.id,
      updated_at: new Date().toISOString(),
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update service flag." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.flag_toggled",
    entityType: "service",
    entityId: serviceId,
    oldValues: { [field]: existing[field] },
    newValues: { [field]: value },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `Service "${existing.name}" updated (${field.replace(/_/g, " ")}: ${value ? "enabled" : "disabled"}).`,
  };
}

/**
 * Admin: Explicit lifecycle status management ('active' | 'paused' | 'inactive').
 * Preserves independent homepage visibility (show_on_homepage) and records an audit log entry.
 */
export async function updateServiceStatusAction(
  serviceId: string,
  nextStatus: ServiceLifecycleStatus,
  reason?: string
): Promise<{
  ok: boolean;
  message: string;
  data?: {
    id: string;
    status: ServiceLifecycleStatus;
    is_active: boolean;
    show_on_homepage: boolean;
    paused_at: string | null;
    deactivated_at: string | null;
    updated_at: string;
  };
}> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  if (!["active", "paused", "inactive"].includes(nextStatus)) {
    return { ok: false, message: "Invalid service lifecycle status." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}&limit=1&select=id,name,status,is_active,show_on_homepage,deleted_at`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Service not found." };
  }
  if (existing.deleted_at) {
    return {
      ok: false,
      message: "Archived services must be restored before changing lifecycle status.",
    };
  }

  const nowIso = new Date().toISOString();
  const patchBody = {
    status: nextStatus,
    is_active: nextStatus === "active",
    paused_at: nextStatus === "paused" ? nowIso : null,
    deactivated_at: nextStatus === "inactive" ? nowIso : null,
    updated_by: adminCheck.user.id,
    updated_at: nowIso,
  };

  const res = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: patchBody,
    }
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      ok: false,
      message: res.ok
        ? "Failed to update service status."
        : res.message || "Failed to update service status.",
    };
  }

  const updated = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.status_changed",
    entityType: "service",
    entityId: serviceId,
    oldValues: {
      status: existing.status,
      is_active: existing.is_active,
      show_on_homepage: existing.show_on_homepage,
    },
    newValues: {
      status: updated.status,
      is_active: updated.is_active,
      show_on_homepage: updated.show_on_homepage,
      paused_at: updated.paused_at,
      deactivated_at: updated.deactivated_at,
      reason: reason?.trim() || null,
    },
  });

  revalidateCataloguePaths();

  const verbMap: Record<ServiceLifecycleStatus, string> = {
    active:
      existing.status === "paused"
        ? "resumed and is now active"
        : "activated and is now available to customers",
    paused:
      "paused. New booking and quotation requests for this service are temporarily disabled",
    inactive: "deactivated and hidden from customer discovery",
  };

  return {
    ok: true,
    message: `Service "${updated.name}" has been ${verbMap[nextStatus]}.`,
    data: {
      id: updated.id,
      status: updated.status,
      is_active: updated.is_active,
      show_on_homepage: updated.show_on_homepage,
      paused_at: updated.paused_at,
      deactivated_at: updated.deactivated_at,
      updated_at: updated.updated_at,
    },
  };
}

/**
 * Admin: Independent homepage visibility control (Show on Homepage / Hide from Homepage).
 * Does NOT deactivate, pause, or delete the service.
 */
export async function toggleServiceHomepageVisibilityAction(
  serviceId: string,
  showOnHomepage: boolean
): Promise<{
  ok: boolean;
  message: string;
  data?: { id: string; show_on_homepage: boolean; updated_at: string };
}> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}&limit=1&select=id,name,status,show_on_homepage,deleted_at`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Service not found." };
  }
  if (existing.deleted_at) {
    return {
      ok: false,
      message: "Archived services must be restored before changing homepage visibility.",
    };
  }

  const nowIso = new Date().toISOString();
  const res = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: {
        show_on_homepage: Boolean(showOnHomepage),
        updated_by: adminCheck.user.id,
        updated_at: nowIso,
      },
    }
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      ok: false,
      message: res.ok
        ? "Failed to update homepage visibility."
        : res.message || "Failed to update homepage visibility.",
    };
  }

  const updated = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.homepage_visibility_changed",
    entityType: "service",
    entityId: serviceId,
    oldValues: { show_on_homepage: existing.show_on_homepage, status: existing.status },
    newValues: { show_on_homepage: updated.show_on_homepage, status: updated.status },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: showOnHomepage
      ? `Service "${updated.name}" is now visible on the homepage.`
      : `Service "${updated.name}" has been hidden from the homepage (its ${updated.status} status remains unchanged).`,
    data: {
      id: updated.id,
      show_on_homepage: updated.show_on_homepage,
      updated_at: updated.updated_at,
    },
  };
}

/**
 * Admin: Delete a service (permanently removes unreferenced services when hardDelete=true,
 * otherwise soft-archives to preserve historical bookings and referential integrity).
 */
export async function deleteServiceAction(
  serviceId: string,
  hardDelete = true
): Promise<{ ok: boolean; message: string; mode?: "hard_deleted" | "soft_archived" }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  const res = await supabaseAdminFetch<{
    id: string;
    name: string;
    mode: "hard_deleted" | "soft_archived";
    booking_refs: number;
    provider_refs: number;
  }>("/rest/v1/rpc/admin_delete_service", {
    method: "POST",
    body: {
      p_service_id: serviceId,
      p_hard_delete: hardDelete,
    },
  });

  if (!res.ok || !res.data) {
    return {
      ok: false,
      message: res.ok ? "Failed to delete service." : res.message || "Failed to delete service.",
    };
  }

  revalidateCataloguePaths();

  const { name, mode } = res.data;
  return {
    ok: true,
    mode,
    message:
      mode === "hard_deleted"
        ? `Service "${name}" has been permanently deleted.`
        : `Service "${name}" was safely archived because it is linked to historical bookings or provider records.`,
  };
}

/**
 * Admin: Batch update service display ordering.
 */
export async function reorderServicesAction(
  serviceOrders: Array<{ id: string; display_order: number }>
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!Array.isArray(serviceOrders) || serviceOrders.length === 0) {
    return { ok: false, message: "No service ordering provided." };
  }

  const nowIso = new Date().toISOString();
  for (const item of serviceOrders) {
    if (!UUID_REGEX.test(item.id)) continue;
    const res = await supabaseAdminFetch(`/rest/v1/services?id=eq.${item.id}`, {
      method: "PATCH",
      body: {
        display_order: Math.max(0, Math.round(item.display_order)),
        updated_by: adminCheck.user.id,
        updated_at: nowIso,
      },
    });
    if (!res.ok) {
      return { ok: false, message: res.message || "Failed to reorder services." };
    }
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.reordered",
    entityType: "service",
    entityId: serviceOrders[0]?.id || "batch",
    newValues: { orders: serviceOrders },
  });

  revalidateCataloguePaths();

  return { ok: true, message: "Service ordering updated." };
}

/**
 * Admin: Soft-archive a service (preserves bookings, professional_services, and audit trail).
 */
export async function archiveServiceAction(
  serviceId: string
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}&limit=1&select=id,name,service_code,deleted_at`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Service not found." };
  }

  const nowIso = new Date().toISOString();
  const res = await supabaseAdminFetch(`/rest/v1/services?id=eq.${serviceId}`, {
    method: "PATCH",
    body: {
      is_active: false,
      show_on_homepage: false,
      deleted_at: nowIso,
      updated_by: adminCheck.user.id,
      updated_at: nowIso,
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to archive service." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.archived",
    entityType: "service",
    entityId: serviceId,
    oldValues: { deleted_at: null },
    newValues: { deleted_at: nowIso, is_active: false },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `Service "${existing.name}" archived safely without affecting existing bookings.`,
  };
}

/**
 * Admin: Restore a soft-archived service.
 */
export async function restoreServiceAction(
  serviceId: string
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return { ok: false, message: "Valid Service ID required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceRow[]>(
    `/rest/v1/services?id=eq.${serviceId}&limit=1&select=id,name,deleted_at`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Service not found." };
  }

  const res = await supabaseAdminFetch(`/rest/v1/services?id=eq.${serviceId}`, {
    method: "PATCH",
    body: {
      deleted_at: null,
      is_active: false,
      updated_by: adminCheck.user.id,
      updated_at: new Date().toISOString(),
    },
  });

  if (!res.ok) {
    return {
      ok: false,
      message: mapServiceDbError(res.message || "Failed to restore service."),
    };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service.restored",
    entityType: "service",
    entityId: serviceId,
    oldValues: { deleted_at: existing.deleted_at },
    newValues: { deleted_at: null, is_active: false },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `Service "${existing.name}" restored (inactive until enabled).`,
  };
}

export interface UpsertServiceRequirementInput {
  id?: string;
  serviceId: string;
  requirementKey: string;
  requirementType: ServiceRequirementType;
  title: string;
  description?: string;
  isRequired: boolean;
  appliesTo: ServiceRequirementAppliesTo;
  configJson?: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Admin: Create or update a configurable requirement rule on a specific service.
 */
export async function upsertServiceRequirementAction(
  input: UpsertServiceRequirementInput
): Promise<{ ok: boolean; message: string; data?: ServiceRequirementRow }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!input.serviceId || !UUID_REGEX.test(input.serviceId)) {
    return { ok: false, message: "Valid Service ID is required." };
  }
  if (input.id && !UUID_REGEX.test(input.id)) {
    return { ok: false, message: "Invalid Requirement ID." };
  }

  const title = input.title.trim();
  const requirementKey = input.requirementKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (title.length < 2) {
    return { ok: false, message: "Requirement title must be at least 2 characters." };
  }
  if (requirementKey.length < 2) {
    return {
      ok: false,
      message: "Requirement key must be at least 2 alphanumeric characters.",
    };
  }
  if (!VALID_REQUIREMENT_TYPES.has(input.requirementType)) {
    return { ok: false, message: "Invalid requirement type." };
  }
  if (!VALID_APPLIES_TO.has(input.appliesTo)) {
    return { ok: false, message: "Invalid applies_to target." };
  }

  let parsedConfig: Record<string, unknown> = {};
  if (input.configJson && input.configJson.trim()) {
    try {
      const candidate = JSON.parse(input.configJson);
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        return {
          ok: false,
          message: "Requirement config must be a valid JSON object (e.g. {}).",
        };
      }
      parsedConfig = candidate as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        message: "Invalid JSON syntax in requirement configuration.",
      };
    }
  }

  const payload = {
    service_id: input.serviceId,
    requirement_key: requirementKey,
    requirement_type: input.requirementType,
    title,
    description: input.description?.trim() || null,
    is_required: Boolean(input.isRequired),
    applies_to: input.appliesTo,
    config: parsedConfig,
    display_order: Math.max(0, Math.round(input.displayOrder || 0)),
    is_active: Boolean(input.isActive),
    deleted_at: null,
  };

  if (input.id) {
    const res = await supabaseAdminFetch<ServiceRequirementRow[]>(
      `/rest/v1/service_requirements?id=eq.${input.id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: payload,
      }
    );

    if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
      return {
        ok: false,
        message: mapServiceDbError(
          res.ok ? "Requirement update failed." : res.message
        ),
      };
    }

    const updated = res.data[0];
    await recordCatalogueAuditLog({
      actorUserId: adminCheck.user.id,
      action: "service_requirement.updated",
      entityType: "service_requirement",
      entityId: updated.id,
      newValues: {
        service_id: updated.service_id,
        requirement_key: updated.requirement_key,
        is_required: updated.is_required,
        is_active: updated.is_active,
      },
    });

    revalidateCataloguePaths();
    return {
      ok: true,
      message: `Requirement "${updated.title}" updated.`,
      data: updated,
    };
  }

  const res = await supabaseAdminFetch<ServiceRequirementRow[]>(
    "/rest/v1/service_requirements",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: payload,
    }
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      ok: false,
      message: mapServiceDbError(
        res.ok ? "Requirement creation failed." : res.message
      ),
    };
  }

  const created = res.data[0];
  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service_requirement.created",
    entityType: "service_requirement",
    entityId: created.id,
    newValues: {
      service_id: created.service_id,
      requirement_key: created.requirement_key,
      title: created.title,
    },
  });

  revalidateCataloguePaths();
  return {
    ok: true,
    message: `Requirement "${created.title}" added.`,
    data: created,
  };
}

/**
 * Admin: Quick-toggle requirement active/mandatory flags.
 */
export async function toggleServiceRequirementAction(
  requirementId: string,
  field: "is_active" | "is_required",
  value: boolean
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!requirementId || !UUID_REGEX.test(requirementId)) {
    return { ok: false, message: "Valid Requirement ID required." };
  }

  const res = await supabaseAdminFetch(
    `/rest/v1/service_requirements?id=eq.${requirementId}`,
    {
      method: "PATCH",
      body: { [field]: value, updated_at: new Date().toISOString() },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update requirement." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service_requirement.flag_toggled",
    entityType: "service_requirement",
    entityId: requirementId,
    newValues: { [field]: value },
  });

  revalidateCataloguePaths();
  return { ok: true, message: "Requirement rule updated." };
}

/**
 * Admin: Soft-archive a service requirement row.
 */
export async function archiveServiceRequirementAction(
  requirementId: string
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!requirementId || !UUID_REGEX.test(requirementId)) {
    return { ok: false, message: "Valid Requirement ID required." };
  }

  const nowIso = new Date().toISOString();
  const res = await supabaseAdminFetch(
    `/rest/v1/service_requirements?id=eq.${requirementId}`,
    {
      method: "PATCH",
      body: {
        is_active: false,
        deleted_at: nowIso,
        updated_at: nowIso,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to archive requirement." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "service_requirement.archived",
    entityType: "service_requirement",
    entityId: requirementId,
    newValues: { deleted_at: nowIso, is_active: false },
  });

  revalidateCataloguePaths();
  return { ok: true, message: "Service requirement archived." };
}
