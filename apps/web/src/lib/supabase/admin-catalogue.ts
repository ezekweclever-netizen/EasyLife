import { revalidatePath, revalidateTag } from "next/cache";
import type {
  DocumentType,
  ProviderType,
  ServiceCategoryRow,
  ServiceRequirementRow,
  ServiceRow,
} from "@easylife/shared-types";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { storageService } from "@/lib/storage/storage-service";

export interface AdminCategoryRecord extends ServiceCategoryRow {
  subcategory_count: number;
  service_count: number;
  active_service_count: number;
  professional_service_count: number;
  booking_count: number;
}

export interface AdminServiceRecord extends ServiceRow {
  requirements: ServiceRequirementRow[];
  professional_service_count: number;
  booking_count: number;
}

export interface AdminCatalogueSnapshot {
  authorized: boolean;
  categories: AdminCategoryRecord[];
  services: AdminServiceRecord[];
}

export const ELIGIBLE_PROVIDER_TYPE_OPTIONS: Array<{
  value: ProviderType;
  label: string;
}> = [
  { value: "trade_technician", label: "Trade Technician" },
  { value: "general_artisan", label: "General Artisan" },
  { value: "dispatch_rider", label: "Dispatch & Moving Crew" },
  { value: "property_agent", label: "Property & Facility Agent" },
];

export const REQUIRED_DOCUMENT_TYPE_OPTIONS: Array<{
  value: DocumentType;
  label: string;
}> = [
  { value: "national_id_nin", label: "National ID (NIN)" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "international_passport", label: "International Passport" },
  { value: "trade_certificate", label: "Trade / Technical Certificate" },
  { value: "cac_certificate", label: "CAC Business Registration" },
  { value: "utility_bill", label: "Utility Bill / Proof of Address" },
  { value: "other", label: "Other Supporting Credential" },
];

export function slugifyCatalogueText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeServiceCode(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned;
}

export function generateDefaultServiceCode(slugOrName: string): string {
  const base = slugifyCatalogueText(slugOrName)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EL-${base || "SRV"}-${suffix}`;
}

export function parseKeywordsInput(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  const items = Array.isArray(raw) ? raw : raw.split(/[\n,]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const trimmed = String(item).trim().toLowerCase();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result.slice(0, 40);
}

export function sanitizeCatalogueImageUrl(raw: string | null | undefined): {
  valid: boolean;
  url: string | null;
  error?: string;
} {
  if (!raw) return { valid: true, url: null };
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true, url: null };

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.includes("..")) {
      return { valid: false, url: null, error: "Invalid relative image path." };
    }
    return { valid: true, url: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        valid: false,
        url: null,
        error: "Image URL must use http://, https://, or a site-relative path.",
      };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      url: null,
      error: "Please enter a valid image URL or upload an image file.",
    };
  }
}

export async function uploadCatalogueImageFile(params: {
  file: File;
  folder: "categories" | "subcategories" | "services";
  slug: string;
  adminUserId: string;
}): Promise<{ ok: true; url: string; path: string } | { ok: false; message: string }> {
  const { file, folder, slug, adminUserId } = params;

  const allowedMimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const normalizedMime = file.type === "image/jpg" ? "image/jpeg" : file.type.toLowerCase();
  const extFromMime = allowedMimeMap[file.type.toLowerCase()];
  if (!extFromMime) {
    return {
      ok: false,
      message: "Unsupported image format. Please upload a PNG, JPG, or WEBP image.",
    };
  }

  if (file.size <= 0) {
    return { ok: false, message: "Uploaded image file is empty." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Image file size must not exceed 5 MB." };
  }

  const safeSlug = slugifyCatalogueText(slug || "asset") || "asset";
  const uniqueStamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const storagePath = `${folder}/${safeSlug}-${uniqueStamp}.${extFromMime}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadRes = await storageService.uploadFile({
    bucketId: "catalogue-assets",
    path: storagePath,
    data: buffer,
    mimeType: normalizedMime,
    userId: adminUserId,
    uploaderRole: "admin",
    upsert: true,
  });

  if (!uploadRes.success || !uploadRes.url) {
    return {
      ok: false,
      message: uploadRes.error || "Failed to upload catalogue image to storage.",
    };
  }

  return {
    ok: true,
    url: uploadRes.url,
    path: uploadRes.path || storagePath,
  };
}

export async function recordCatalogueAuditLog(params: {
  actorUserId: string;
  action: string;
  entityType: "service_category" | "service" | "service_requirement";
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await supabaseAdminFetch("/rest/v1/audit_logs", {
    method: "POST",
    body: {
      actor_user_id: params.actorUserId,
      actor_role: "admin",
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      old_values: params.oldValues ?? null,
      new_values: params.newValues ?? null,
      metadata: params.metadata ?? {},
    },
  });
}

export function revalidateCataloguePaths(): void {
  revalidateTag("catalogue");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/explore-services");
  revalidatePath("/dashboard");
  revalidatePath("/book");
  revalidatePath("/");
}

/**
 * Fetches complete 3-tier catalogue data for the Administrator Dashboard.
 * Verifies admin session internally before using service-role queries.
 */
export async function fetchAdminCatalogueData(): Promise<AdminCatalogueSnapshot> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { authorized: false, categories: [], services: [] };
  }

  const [catRes, srvRes, reqRes, proSrvRes, bookingRes] = await Promise.all([
    supabaseAdminFetch<ServiceCategoryRow[]>(
      "/rest/v1/service_categories?select=*&order=display_order.asc,name.asc"
    ),
    supabaseAdminFetch<ServiceRow[]>(
      "/rest/v1/services?select=*&order=display_order.asc,name.asc"
    ),
    supabaseAdminFetch<ServiceRequirementRow[]>(
      "/rest/v1/service_requirements?select=*&order=display_order.asc,created_at.asc"
    ),
    supabaseAdminFetch<Array<{ category_id: string | null; service_id: string | null }>>(
      "/rest/v1/professional_services?deleted_at=is.null&select=category_id,service_id"
    ),
    supabaseAdminFetch<
      Array<{
        category_id: string | null;
        subcategory_id: string | null;
        service_id: string | null;
      }>
    >("/rest/v1/bookings?deleted_at=is.null&select=category_id,subcategory_id,service_id"),
  ]);

  const rawCategories = catRes.ok && Array.isArray(catRes.data) ? catRes.data : [];
  const rawServices = srvRes.ok && Array.isArray(srvRes.data) ? srvRes.data : [];
  const rawRequirements = reqRes.ok && Array.isArray(reqRes.data) ? reqRes.data : [];
  const rawProServices =
    proSrvRes.ok && Array.isArray(proSrvRes.data) ? proSrvRes.data : [];
  const rawBookings =
    bookingRes.ok && Array.isArray(bookingRes.data) ? bookingRes.data : [];

  // Aggregate counts
  const subCountByParent = new Map<string, number>();
  for (const cat of rawCategories) {
    if (cat.parent_id && !cat.deleted_at) {
      subCountByParent.set(cat.parent_id, (subCountByParent.get(cat.parent_id) ?? 0) + 1);
    }
  }

  const srvCountByCat = new Map<string, number>();
  const activeSrvCountByCat = new Map<string, number>();
  for (const srv of rawServices) {
    if (srv.deleted_at) continue;
    srvCountByCat.set(srv.category_id, (srvCountByCat.get(srv.category_id) ?? 0) + 1);
    if (srv.subcategory_id) {
      srvCountByCat.set(
        srv.subcategory_id,
        (srvCountByCat.get(srv.subcategory_id) ?? 0) + 1
      );
    }
    if (srv.is_active) {
      activeSrvCountByCat.set(
        srv.category_id,
        (activeSrvCountByCat.get(srv.category_id) ?? 0) + 1
      );
      if (srv.subcategory_id) {
        activeSrvCountByCat.set(
          srv.subcategory_id,
          (activeSrvCountByCat.get(srv.subcategory_id) ?? 0) + 1
        );
      }
    }
  }

  const proCountByCat = new Map<string, number>();
  const proCountBySrv = new Map<string, number>();
  for (const ps of rawProServices) {
    if (ps.category_id) {
      proCountByCat.set(ps.category_id, (proCountByCat.get(ps.category_id) ?? 0) + 1);
    }
    if (ps.service_id) {
      proCountBySrv.set(ps.service_id, (proCountBySrv.get(ps.service_id) ?? 0) + 1);
    }
  }

  const bookingCountByCat = new Map<string, number>();
  const bookingCountBySrv = new Map<string, number>();
  for (const bk of rawBookings) {
    if (bk.category_id) {
      bookingCountByCat.set(bk.category_id, (bookingCountByCat.get(bk.category_id) ?? 0) + 1);
    }
    if (bk.subcategory_id && bk.subcategory_id !== bk.category_id) {
      bookingCountByCat.set(
        bk.subcategory_id,
        (bookingCountByCat.get(bk.subcategory_id) ?? 0) + 1
      );
    }
    if (bk.service_id) {
      bookingCountBySrv.set(bk.service_id, (bookingCountBySrv.get(bk.service_id) ?? 0) + 1);
    }
  }

  const reqsByService = new Map<string, ServiceRequirementRow[]>();
  for (const req of rawRequirements) {
    const list = reqsByService.get(req.service_id) ?? [];
    list.push(req);
    reqsByService.set(req.service_id, list);
  }

  const categories: AdminCategoryRecord[] = rawCategories.map((cat) => ({
    ...cat,
    keywords: Array.isArray(cat.keywords) ? cat.keywords : [],
    subcategory_count: subCountByParent.get(cat.id) ?? 0,
    service_count: srvCountByCat.get(cat.id) ?? 0,
    active_service_count: activeSrvCountByCat.get(cat.id) ?? 0,
    professional_service_count: proCountByCat.get(cat.id) ?? 0,
    booking_count: bookingCountByCat.get(cat.id) ?? 0,
  }));

  const services: AdminServiceRecord[] = rawServices.map((srv) => ({
    ...srv,
    keywords: Array.isArray(srv.keywords) ? srv.keywords : [],
    eligible_provider_types: Array.isArray(srv.eligible_provider_types)
      ? srv.eligible_provider_types
      : ["trade_technician"],
    required_document_types: Array.isArray(srv.required_document_types)
      ? srv.required_document_types
      : ["national_id_nin"],
    requirements: reqsByService.get(srv.id) ?? [],
    professional_service_count: proCountBySrv.get(srv.id) ?? 0,
    booking_count: bookingCountBySrv.get(srv.id) ?? 0,
  }));

  return {
    authorized: true,
    categories,
    services,
  };
}
