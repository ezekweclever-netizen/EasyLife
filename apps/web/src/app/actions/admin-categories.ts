"use server";

import type { ServiceCategoryRow } from "@easylife/shared-types";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import {
  parseKeywordsInput,
  recordCatalogueAuditLog,
  revalidateCataloguePaths,
  sanitizeCatalogueImageUrl,
  slugifyCatalogueText,
  uploadCatalogueImageFile,
} from "@/lib/supabase/admin-catalogue";

export interface CategoryFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  data?: ServiceCategoryRow;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseBoolFlag(value: FormDataEntryValue | null, defaultValue = false): boolean {
  if (value === null) return defaultValue;
  const str = String(value).trim().toLowerCase();
  return str === "true" || str === "1" || str === "on";
}

function mapCategoryDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("hierarchy_error:")) {
    return message.replace(/^.*hierarchy_error:\s*/i, "");
  }
  if (lower.includes("service_categories_slug") || lower.includes("duplicate key")) {
    return "A category or subcategory with that URL slug already exists.";
  }
  return message || "Failed to save category.";
}

/**
 * Admin: Add a new main category or subcategory.
 */
export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      status: "error",
      message: "Unauthorized: Administrator privileges required.",
    };
  }

  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const iconName = String(formData.get("iconName") || "tool").trim() || "tool";
  const defaultCommissionBps = parseInt(
    String(formData.get("defaultCommissionBps") || "1000"),
    10
  );
  const displayOrder = parseInt(String(formData.get("displayOrder") || "99"), 10);
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const keywords = parseKeywordsInput(String(formData.get("keywords") || ""));
  const isActive = parseBoolFlag(formData.get("isActive"), true);
  const isFeatured = parseBoolFlag(formData.get("isFeatured"), false);
  const isPopular = parseBoolFlag(formData.get("isPopular"), false);
  const showOnHomepage = parseBoolFlag(formData.get("showOnHomepage"), false);
  const rawImageUrl = String(formData.get("imageUrl") || "").trim();
  const imageFileEntry = formData.get("imageFile");

  const fieldErrors: Record<string, string> = {};

  if (!name || name.length < 3) {
    fieldErrors.name = "Category name must be at least 3 characters.";
  }

  const slug = slugifyCatalogueText(rawSlug || name);
  if (!slug || slug.length < 2) {
    fieldErrors.slug = "Please provide a valid URL slug.";
  }

  if (!description || description.length < 10) {
    fieldErrors.description =
      "Please provide a clear description (at least 10 characters).";
  }

  if (parentId && !UUID_REGEX.test(parentId)) {
    fieldErrors.parentId = "Invalid parent category selected.";
  }

  if (
    Number.isNaN(defaultCommissionBps) ||
    defaultCommissionBps < 0 ||
    defaultCommissionBps > 5000
  ) {
    fieldErrors.defaultCommissionBps =
      "Commission fee must be between 0% (0 bps) and 50% (5000 bps).";
  }

  const imageCheck = sanitizeCatalogueImageUrl(rawImageUrl);
  if (!imageCheck.valid) {
    fieldErrors.imageUrl = imageCheck.error || "Invalid image URL.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  let resolvedImageUrl: string | null = imageCheck.url;
  if (imageFileEntry instanceof File && imageFileEntry.size > 0) {
    const upload = await uploadCatalogueImageFile({
      file: imageFileEntry,
      folder: parentId ? "subcategories" : "categories",
      slug,
      adminUserId: adminCheck.user.id,
    });
    if (!upload.ok) {
      return {
        status: "error",
        message: upload.message,
      };
    }
    resolvedImageUrl = upload.url;
  }

  const payload = {
    name,
    slug,
    description,
    icon_name: iconName,
    image_url: resolvedImageUrl,
    keywords,
    default_commission_bps: defaultCommissionBps,
    display_order: Number.isNaN(displayOrder) ? 99 : Math.max(0, displayOrder),
    parent_id: parentId,
    is_active: isActive,
    is_featured: isFeatured,
    is_popular: isPopular,
    show_on_homepage: parentId ? false : showOnHomepage,
    updated_by: adminCheck.user.id,
  };

  const res = await supabaseAdminFetch<ServiceCategoryRow[]>(
    "/rest/v1/service_categories",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: payload,
    }
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      status: "error",
      message: mapCategoryDbError(res.ok ? "Creation returned empty row." : res.message),
    };
  }

  const created = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: parentId ? "subcategory.created" : "category.created",
    entityType: "service_category",
    entityId: created.id,
    newValues: {
      name: created.name,
      slug: created.slug,
      parent_id: created.parent_id,
      is_active: created.is_active,
      is_featured: created.is_featured,
      is_popular: created.is_popular,
      show_on_homepage: created.show_on_homepage,
    },
  });

  revalidateCataloguePaths();

  return {
    status: "success",
    message: `${parentId ? "Subcategory" : "Category"} "${name}" created successfully.`,
    data: created,
  };
}

/**
 * Admin: Edit an existing category or subcategory.
 */
export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      status: "error",
      message: "Unauthorized: Administrator privileges required.",
    };
  }

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const iconName = String(formData.get("iconName") || "tool").trim() || "tool";
  const defaultCommissionBps = parseInt(
    String(formData.get("defaultCommissionBps") || "1000"),
    10
  );
  const displayOrder = parseInt(String(formData.get("displayOrder") || "0"), 10);
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const keywordsRaw = formData.get("keywords");
  const isActive = parseBoolFlag(formData.get("isActive"), true);
  const isFeatured = parseBoolFlag(formData.get("isFeatured"), false);
  const isPopular = parseBoolFlag(formData.get("isPopular"), false);
  const showOnHomepage = parseBoolFlag(formData.get("showOnHomepage"), false);
  const removeImage = parseBoolFlag(formData.get("removeImage"), false);
  const rawImageUrl = formData.get("imageUrl");
  const imageFileEntry = formData.get("imageFile");

  if (!id || !UUID_REGEX.test(id)) {
    return { status: "error", message: "Valid Category ID is required." };
  }

  if (!name || name.length < 3) {
    return { status: "error", message: "Category name must be at least 3 characters." };
  }

  if (parentId && (!UUID_REGEX.test(parentId) || parentId === id)) {
    return { status: "error", message: "Invalid parent category selected." };
  }

  if (
    Number.isNaN(defaultCommissionBps) ||
    defaultCommissionBps < 0 ||
    defaultCommissionBps > 5000
  ) {
    return {
      status: "error",
      message: "Commission fee must be between 0 bps and 5000 bps.",
    };
  }

  const existingRes = await supabaseAdminFetch<ServiceCategoryRow[]>(
    `/rest/v1/service_categories?id=eq.${id}&limit=1&select=*`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { status: "error", message: "Category record not found." };
  }

  const resolvedSlug = slugifyCatalogueText(rawSlug || existing.slug || name);
  if (!resolvedSlug) {
    return { status: "error", message: "Please provide a valid URL slug." };
  }

  let resolvedImageUrl: string | null = existing.image_url ?? null;
  if (removeImage) {
    resolvedImageUrl = null;
  } else if (rawImageUrl !== null) {
    const imgCheck = sanitizeCatalogueImageUrl(String(rawImageUrl));
    if (!imgCheck.valid) {
      return {
        status: "error",
        message: imgCheck.error || "Invalid category image URL.",
      };
    }
    resolvedImageUrl = imgCheck.url;
  }

  if (imageFileEntry instanceof File && imageFileEntry.size > 0) {
    const upload = await uploadCatalogueImageFile({
      file: imageFileEntry,
      folder: parentId ? "subcategories" : "categories",
      slug: resolvedSlug,
      adminUserId: adminCheck.user.id,
    });
    if (!upload.ok) {
      return { status: "error", message: upload.message };
    }
    resolvedImageUrl = upload.url;
  }

  const payload: Record<string, unknown> = {
    name,
    slug: resolvedSlug,
    description,
    icon_name: iconName,
    image_url: resolvedImageUrl,
    default_commission_bps: defaultCommissionBps,
    display_order: Number.isNaN(displayOrder) ? 0 : Math.max(0, displayOrder),
    parent_id: parentId,
    is_active: isActive,
    is_featured: formData.has("isFeatured") ? isFeatured : Boolean(existing.is_featured),
    is_popular: formData.has("isPopular") ? isPopular : Boolean(existing.is_popular),
    show_on_homepage: parentId
      ? false
      : formData.has("showOnHomepage")
        ? showOnHomepage
        : Boolean(existing.show_on_homepage),
    updated_by: adminCheck.user.id,
    updated_at: new Date().toISOString(),
  };

  if (keywordsRaw !== null) {
    payload.keywords = parseKeywordsInput(String(keywordsRaw));
  }

  const res = await supabaseAdminFetch<ServiceCategoryRow[]>(
    `/rest/v1/service_categories?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: payload,
    }
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return {
      status: "error",
      message: mapCategoryDbError(res.ok ? "Update returned empty row." : res.message),
    };
  }

  const updated = res.data[0];

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: updated.parent_id ? "subcategory.updated" : "category.updated",
    entityType: "service_category",
    entityId: id,
    oldValues: {
      name: existing.name,
      slug: existing.slug,
      parent_id: existing.parent_id,
      is_active: existing.is_active,
      is_featured: existing.is_featured,
      is_popular: existing.is_popular,
      show_on_homepage: existing.show_on_homepage,
    },
    newValues: {
      name: updated.name,
      slug: updated.slug,
      parent_id: updated.parent_id,
      is_active: updated.is_active,
      is_featured: updated.is_featured,
      is_popular: updated.is_popular,
      show_on_homepage: updated.show_on_homepage,
    },
  });

  revalidateCataloguePaths();

  return {
    status: "success",
    message: `${updated.parent_id ? "Subcategory" : "Category"} "${name}" updated successfully.`,
    data: updated,
  };
}

/**
 * Admin: Toggle active, featured, popular, or homepage visibility flag on a category/subcategory.
 */
export async function toggleCategoryFlagAction(
  categoryId: string,
  field: "is_active" | "is_featured" | "is_popular" | "show_on_homepage",
  value: boolean
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!categoryId || !UUID_REGEX.test(categoryId)) {
    return { ok: false, message: "Valid Category ID required." };
  }

  const existingRes = await supabaseAdminFetch<ServiceCategoryRow[]>(
    `/rest/v1/service_categories?id=eq.${categoryId}&limit=1&select=id,name,parent_id,deleted_at,is_active,is_featured,is_popular,show_on_homepage`
  );
  const existing =
    existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Category not found." };
  }
  if (existing.deleted_at) {
    return {
      ok: false,
      message: "Archived categories must be restored before changing visibility flags.",
    };
  }
  if (field === "show_on_homepage" && existing.parent_id && value) {
    return {
      ok: false,
      message: "Only top-level main categories can be pinned directly to homepage cards.",
    };
  }

  const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${categoryId}`, {
    method: "PATCH",
    body: {
      [field]: value,
      updated_by: adminCheck.user.id,
      updated_at: new Date().toISOString(),
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update category flag." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "category.flag_toggled",
    entityType: "service_category",
    entityId: categoryId,
    oldValues: { [field]: existing[field] },
    newValues: { [field]: value },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `"${existing.name}" updated (${field.replace(/_/g, " ")}: ${value ? "enabled" : "disabled"}).`,
  };
}

/**
 * Admin: Backwards-compatible wrapper for disabling or enabling a category.
 */
export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean
): Promise<{ ok: boolean; message: string }> {
  return toggleCategoryFlagAction(categoryId, "is_active", isActive);
}

/**
 * Admin: Reorder categories or subcategories.
 */
export async function reorderCategoriesAction(
  categoryOrders: Array<{ id: string; display_order: number }>
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
    return { ok: false, message: "No category ordering provided." };
  }

  const nowIso = new Date().toISOString();
  for (const item of categoryOrders) {
    if (!UUID_REGEX.test(item.id)) continue;
    const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${item.id}`, {
      method: "PATCH",
      body: {
        display_order: Math.max(0, Math.round(item.display_order)),
        updated_by: adminCheck.user.id,
        updated_at: nowIso,
      },
    });
    if (!res.ok) {
      return { ok: false, message: res.message || "Failed to persist category order." };
    }
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: "category.reordered",
    entityType: "service_category",
    entityId: categoryOrders[0]?.id || "batch",
    newValues: { orders: categoryOrders },
  });

  revalidateCataloguePaths();

  return { ok: true, message: "Category order updated successfully." };
}

/**
 * Admin: Soft-archive a category or subcategory without breaking historical bookings.
 */
export async function archiveCategoryAction(
  categoryId: string
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!categoryId || !UUID_REGEX.test(categoryId)) {
    return { ok: false, message: "Valid Category ID is required." };
  }

  const [catRes, childRes, srvRes] = await Promise.all([
    supabaseAdminFetch<ServiceCategoryRow[]>(
      `/rest/v1/service_categories?id=eq.${categoryId}&limit=1&select=id,name,parent_id,deleted_at`
    ),
    supabaseAdminFetch<Array<{ id: string }>>(
      `/rest/v1/service_categories?parent_id=eq.${categoryId}&deleted_at=is.null&limit=1&select=id`
    ),
    supabaseAdminFetch<Array<{ id: string }>>(
      `/rest/v1/services?or=(category_id.eq.${categoryId},subcategory_id.eq.${categoryId})&deleted_at=is.null&limit=1&select=id`
    ),
  ]);

  const existing =
    catRes.ok && Array.isArray(catRes.data) ? catRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Category not found." };
  }

  if (childRes.ok && Array.isArray(childRes.data) && childRes.data.length > 0) {
    return {
      ok: false,
      message:
        "Cannot archive a main category while it still has active subcategories. Archive or reassign its subcategories first.",
    };
  }

  if (srvRes.ok && Array.isArray(srvRes.data) && srvRes.data.length > 0) {
    return {
      ok: false,
      message:
        "Cannot archive this category while active catalogue services are linked to it. Archive or reassign those services first.",
    };
  }

  const nowIso = new Date().toISOString();
  const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${categoryId}`, {
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
    return { ok: false, message: res.message || "Failed to archive category." };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: existing.parent_id ? "subcategory.archived" : "category.archived",
    entityType: "service_category",
    entityId: categoryId,
    oldValues: { deleted_at: null },
    newValues: { deleted_at: nowIso, is_active: false },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `"${existing.name}" archived safely. Historical bookings and records remain preserved.`,
  };
}

/**
 * Admin: Restore a previously soft-archived category or subcategory (kept inactive until re-enabled).
 */
export async function restoreCategoryAction(
  categoryId: string
): Promise<{ ok: boolean; message: string }> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  if (!categoryId || !UUID_REGEX.test(categoryId)) {
    return { ok: false, message: "Valid Category ID is required." };
  }

  const catRes = await supabaseAdminFetch<ServiceCategoryRow[]>(
    `/rest/v1/service_categories?id=eq.${categoryId}&limit=1&select=id,name,parent_id,deleted_at`
  );
  const existing = catRes.ok && Array.isArray(catRes.data) ? catRes.data[0] : null;
  if (!existing) {
    return { ok: false, message: "Category not found." };
  }

  const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${categoryId}`, {
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
      message: mapCategoryDbError(res.message || "Failed to restore category."),
    };
  }

  await recordCatalogueAuditLog({
    actorUserId: adminCheck.user.id,
    action: existing.parent_id ? "subcategory.restored" : "category.restored",
    entityType: "service_category",
    entityId: categoryId,
    oldValues: { deleted_at: existing.deleted_at },
    newValues: { deleted_at: null, is_active: false },
  });

  revalidateCataloguePaths();

  return {
    ok: true,
    message: `"${existing.name}" restored (inactive by default until enabled).`,
  };
}
