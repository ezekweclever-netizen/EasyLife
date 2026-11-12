import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { CANONICAL_SLUG_ALIASES } from "@/lib/supabase/customer";

export interface CatalogueItemAvailabilityInfo {
  status: "active" | "unavailable" | "not_found";
  kind: "category" | "subcategory" | "service";
  requestedValue: string;
  resolvedAliasSlug?: string;
  id?: string;
  name?: string;
  slug?: string;
  serviceCode?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
  subcategorySlug?: string | null;
  reason?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Exact lookup (server-only) to distinguish between a service/category that is
 * temporarily paused (`is_active = false` or parent paused) vs genuinely missing.
 * Never lists or searches inactive drafts — operates strictly on exact slug/UUID.
 */
export async function checkCatalogueServiceAvailability(
  slugOrId: string
): Promise<CatalogueItemAvailabilityInfo> {
  const cleaned = slugOrId.trim();
  if (!cleaned) {
    return { status: "not_found", kind: "service", requestedValue: slugOrId };
  }

  const filter = UUID_REGEX.test(cleaned)
    ? `id=eq.${cleaned}`
    : `slug=eq.${encodeURIComponent(cleaned.toLowerCase())}`;

  const res = await supabaseAdminFetch<
    Array<{
      id: string;
      name: string;
      slug: string;
      service_code: string;
      is_active: boolean;
      deleted_at: string | null;
      category_id: string;
      subcategory_id: string | null;
    }>
  >(
    `/rest/v1/services?${filter}&deleted_at=is.null&limit=1&select=id,name,slug,service_code,is_active,deleted_at,category_id,subcategory_id`
  );

  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
    return { status: "not_found", kind: "service", requestedValue: cleaned };
  }

  const srv = res.data[0];
  const catIds = [srv.category_id, srv.subcategory_id].filter((x): x is string => Boolean(x));
  const catsRes =
    catIds.length > 0
      ? await supabaseAdminFetch<
          Array<{ id: string; name: string; slug: string; is_active: boolean; deleted_at: string | null }>
        >(
          `/rest/v1/service_categories?id=in.(${catIds.join(",")})&select=id,name,slug,is_active,deleted_at`
        )
      : { ok: true, data: [] as Array<{ id: string; name: string; slug: string; is_active: boolean; deleted_at: string | null }> };

  const catMap = new Map((catsRes.ok && Array.isArray(catsRes.data) ? catsRes.data : []).map((c) => [c.id, c]));
  const mainCat = catMap.get(srv.category_id);
  const subCat = srv.subcategory_id ? catMap.get(srv.subcategory_id) : undefined;

  const mainOk = Boolean(mainCat && mainCat.is_active && !mainCat.deleted_at);
  const subOk = !srv.subcategory_id || Boolean(subCat && subCat.is_active && !subCat.deleted_at);
  const serviceOk = Boolean(srv.is_active && !srv.deleted_at);

  const isAllActive = serviceOk && mainOk && subOk;

  let reason: string | undefined;
  if (!serviceOk) {
    reason = "This service is temporarily paused by EasyLife operations.";
  } else if (!mainOk && mainCat) {
    reason = `The parent category "${mainCat.name}" is currently paused.`;
  } else if (!subOk && subCat) {
    reason = `The subcategory "${subCat.name}" is currently paused.`;
  }

  return {
    status: isAllActive ? "active" : "unavailable",
    kind: "service",
    requestedValue: cleaned,
    id: srv.id,
    name: srv.name,
    slug: srv.slug,
    serviceCode: srv.service_code,
    categoryId: srv.category_id,
    categoryName: mainCat?.name,
    categorySlug: mainCat?.slug,
    subcategoryId: srv.subcategory_id,
    subcategoryName: subCat?.name ?? null,
    subcategorySlug: subCat?.slug ?? null,
    reason,
  };
}

export async function checkCatalogueCategoryAvailability(
  slugOrId: string
): Promise<CatalogueItemAvailabilityInfo> {
  const cleaned = slugOrId.trim();
  if (!cleaned) {
    return { status: "not_found", kind: "category", requestedValue: slugOrId };
  }

  const lower = cleaned.toLowerCase();
  const resolvedSlug = CANONICAL_SLUG_ALIASES[lower] || lower;

  const filter = UUID_REGEX.test(cleaned)
    ? `id=eq.${cleaned}`
    : `slug=eq.${encodeURIComponent(resolvedSlug)}`;

  const res = await supabaseAdminFetch<
    Array<{
      id: string;
      parent_id: string | null;
      name: string;
      slug: string;
      is_active: boolean;
      deleted_at: string | null;
    }>
  >(`/rest/v1/service_categories?${filter}&deleted_at=is.null&limit=1&select=id,parent_id,name,slug,is_active,deleted_at`);

  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
    return { status: "not_found", kind: "category", requestedValue: cleaned };
  }

  const cat = res.data[0];
  let parentCat:
    | { id: string; name: string; slug: string; is_active: boolean; deleted_at: string | null }
    | undefined;

  if (cat.parent_id) {
    const pRes = await supabaseAdminFetch<
      Array<{ id: string; name: string; slug: string; is_active: boolean; deleted_at: string | null }>
    >(`/rest/v1/service_categories?id=eq.${cat.parent_id}&limit=1&select=id,name,slug,is_active,deleted_at`);
    if (pRes.ok && Array.isArray(pRes.data) && pRes.data[0]) {
      parentCat = pRes.data[0];
    }
  }

  const parentOk = !cat.parent_id || Boolean(parentCat && parentCat.is_active && !parentCat.deleted_at);
  const selfOk = Boolean(cat.is_active && !cat.deleted_at);

  return {
    status: selfOk && parentOk ? "active" : "unavailable",
    kind: cat.parent_id ? "subcategory" : "category",
    requestedValue: cleaned,
    resolvedAliasSlug: resolvedSlug !== lower ? resolvedSlug : undefined,
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    categoryId: cat.parent_id || cat.id,
    categoryName: parentCat?.name || cat.name,
    categorySlug: parentCat?.slug || cat.slug,
    subcategoryId: cat.parent_id ? cat.id : null,
    subcategoryName: cat.parent_id ? cat.name : null,
    subcategorySlug: cat.parent_id ? cat.slug : null,
    reason: !selfOk
      ? `The ${cat.parent_id ? "subcategory" : "category"} "${cat.name}" is currently unavailable.`
      : !parentOk && parentCat
      ? `The parent category "${parentCat.name}" is currently unavailable.`
      : undefined,
  };
}
