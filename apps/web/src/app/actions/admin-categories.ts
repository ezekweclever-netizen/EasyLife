"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export interface CategoryFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Admin: Add a new service category.
 */
export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const iconName = String(formData.get("iconName") || "tool").trim();
  const defaultCommissionBps = parseInt(String(formData.get("defaultCommissionBps") || "1000"), 10);
  const displayOrder = parseInt(String(formData.get("displayOrder") || "99"), 10);
  const parentId = String(formData.get("parentId") || "").trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!name || name.length < 3) {
    fieldErrors.name = "Category name must be at least 3 characters.";
  }

  const slug = rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) {
    fieldErrors.slug = "Please provide a valid URL slug.";
  }

  if (!description || description.length < 10) {
    fieldErrors.description = "Please provide a clear category description (at least 10 characters).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const payload = {
    name,
    slug,
    description,
    icon_name: iconName,
    default_commission_bps: isNaN(defaultCommissionBps) ? 1000 : defaultCommissionBps,
    display_order: isNaN(displayOrder) ? 99 : displayOrder,
    parent_id: parentId,
    is_active: true,
  };

  const res = await supabaseAdminFetch("/rest/v1/service_categories", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: payload,
  });

  if (!res.ok) {
    return {
      status: "error",
      message: res.message || "Failed to add service category.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/explore-services");
  revalidatePath("/dashboard");
  revalidatePath("/book");

  return {
    status: "success",
    message: `Category "${name}" created successfully.`,
  };
}

/**
 * Admin: Edit an existing category (name, description, icon, commission, display order).
 */
export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const iconName = String(formData.get("iconName") || "tool").trim();
  const defaultCommissionBps = parseInt(String(formData.get("defaultCommissionBps") || "1000"), 10);
  const displayOrder = parseInt(String(formData.get("displayOrder") || "0"), 10);
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { status: "error", message: "Category ID is missing." };
  }

  if (!name || name.length < 3) {
    return { status: "error", message: "Category name must be at least 3 characters." };
  }

  const payload: Record<string, unknown> = {
    name,
    description,
    icon_name: iconName,
    default_commission_bps: isNaN(defaultCommissionBps) ? 1000 : defaultCommissionBps,
    display_order: isNaN(displayOrder) ? 0 : displayOrder,
    parent_id: parentId,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (slug) {
    payload.slug = slug;
  }

  const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${id}`, {
    method: "PATCH",
    body: payload,
  });

  if (!res.ok) {
    return {
      status: "error",
      message: res.message || "Failed to update category.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/explore-services");
  revalidatePath("/dashboard");
  revalidatePath("/book");

  return {
    status: "success",
    message: `Category "${name}" updated successfully.`,
  };
}

/**
 * Admin: Disable or enable category.
 */
export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean
): Promise<{ ok: boolean; message: string }> {
  if (!categoryId) {
    return { ok: false, message: "Category ID required." };
  }

  const res = await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${categoryId}`, {
    method: "PATCH",
    body: {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to toggle category status." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/explore-services");
  revalidatePath("/dashboard");
  revalidatePath("/book");

  return {
    ok: true,
    message: `Category ${isActive ? "enabled" : "disabled"} successfully.`,
  };
}

/**
 * Admin: Reorganise display orders of categories.
 */
export async function reorderCategoriesAction(
  categoryOrders: Array<{ id: string; display_order: number }>
): Promise<{ ok: boolean; message: string }> {
  if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
    return { ok: false, message: "No category ordering provided." };
  }

  for (const item of categoryOrders) {
    await supabaseAdminFetch(`/rest/v1/service_categories?id=eq.${item.id}`, {
      method: "PATCH",
      body: {
        display_order: item.display_order,
        updated_at: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/explore-services");
  revalidatePath("/dashboard");
  revalidatePath("/book");

  return { ok: true, message: "Category order updated successfully." };
}
