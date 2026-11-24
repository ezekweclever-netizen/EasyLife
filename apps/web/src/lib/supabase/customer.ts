import { unstable_cache } from "next/cache";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type {
  CatalogueCategoryNode,
  CatalogueSearchResultItem,
  CatalogueServiceItem,
} from "@easylife/shared-types";

/**
 * Legacy and shorthand slug aliases mapped onto canonical live catalogue slugs.
 */
export const CANONICAL_SLUG_ALIASES: Record<string, string> = {
  plumbing: "plumbing-water-systems",
  plumber: "plumbing-water-systems",
  electrical: "electrical-power-backup",
  electrician: "electrical-power-backup",
  inverter: "electrical-power-backup",
  ac: "hvac-air-conditioning",
  "air-conditioning": "hvac-air-conditioning",
  hvac: "hvac-air-conditioning",
  generator: "generator-maintenance",
  "generator-repairs": "generator-maintenance",
  "generator-servicing": "generator-maintenance",
  carpentry: "carpentry-doors-locks",
  cleaning: "cleaning-fumigation",
  fumigation: "pest-control",
  painting: "painting-wall-finishing",
  appliances: "appliance-repair",
  tiling: "tiling-floor-installation",
  auto: "auto-electrical-services",
  moving: "moving-relocation-services",
  laundry: "laundry-dry-cleaning",
  beauty: "beauty-personal-care",
  barber: "mobile-barbering-hair-styling",
  events: "event-planning-services",
  errands: "everyday-tasks",
  solar: "solar-installation",
};

export function normalizeCatalogueSlugAlias(slug: string): string {
  const cleaned = slug.trim().toLowerCase();
  if (!cleaned) return "";
  return CANONICAL_SLUG_ALIASES[cleaned] || cleaned;
}

export interface ServiceCategoryItem {
  id: string;
  parent_id?: string | null;
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
  display_order: number;
  deleted_at?: string | null;
}

export interface PublicProfessionalItem {
  professional_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  business_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;
  verification_status: string;
  verified_at: string | null;
  base_callout_fee_kobo: number | null;
  hourly_rate_kobo?: number | null;
  currency_code: string;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  response_rate_pct: number;
  is_available: boolean;
  primary_city: string;
  primary_state: string;
  services?: Array<{
    id: string;
    service_title?: string | null;
    min_price_kobo: number;
    max_price_kobo: number | null;
    description: string | null;
    is_primary_skill: boolean;
    category?: { name: string; slug: string } | null;
  }>;
  service_areas?: Array<{
    id: string;
    city: string;
    state: string;
    lga_or_district: string;
    service_radius_km: number;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    professional_response: string | null;
    responded_at: string | null;
    created_at: string;
  }>;
}

export interface CustomerBookingItem {
  id: string;
  reference_code: string;
  customer_id: string;
  professional_id: string | null;
  category_id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
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
  pro_marked_complete_at?: string | null;
  pro_completion_notes: string | null;
  customer_confirmed_at?: string | null;
  completed_at?: string | null;
  rework_notes?: string | null;
  rework_requested_at?: string | null;
  rework_count?: number;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    slug: string;
    icon_name: string | null;
  } | null;
  assigned_pro?: {
    business_name: string;
    display_name: string | null;
    avatar_url: string | null;
    verification_status: string;
  } | null;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    storage_path: string;
    caption: string | null;
  }>;
  quotations?: Array<{
    id: string;
    reference_code: string;
    professional_id: string;
    status: string;
    version?: number;
    work_description?: string | null;
    labour_charges_kobo?: number;
    materials_costs_kobo?: number;
    additional_expenses_kobo?: number;
    subtotal_kobo: number;
    tax_kobo: number;
    total_amount_kobo: number;
    currency_code?: string;
    estimated_duration_minutes: number;
    proposed_start_at: string | null;
    valid_until: string | null;
    notes: string | null;
    decline_reason?: string | null;
    clarification_requested_at?: string | null;
    clarification_notes?: string | null;
    withdrawal_reason?: string | null;
    accepted_at: string | null;
    declined_at?: string | null;
    withdrawn_at?: string | null;
    created_at: string;
    quotation_items?: Array<{
      id: string;
      item_type: string;
      description: string;
      quantity: number;
      unit_price_kobo: number;
      line_total_kobo: number;
    }>;
    professional_profiles?: {
      id: string;
      business_name: string;
      headline: string | null;
      primary_city: string;
      verification_status: string;
      average_rating?: number;
      completed_jobs_count?: number;
    } | null;
  }>;
  appointments?: Array<{
    id: string;
    booking_id: string;
    quotation_id: string | null;
    professional_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    scheduled_start_at: string;
    scheduled_end_at: string;
    status: string;
    notes: string | null;
    confirmed_at: string;
  }>;
  status_history?: Array<{
    id: string;
    booking_id: string;
    from_status: string | null;
    to_status: string;
    reason: string | null;
    created_at: string;
  }>;
  review?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    photos?: string[];
    professional_response: string | null;
    responded_at: string | null;
    created_at: string;
  } | null;
  active_dispute?: {
    id: string;
    reference_code: string;
    category: string;
    description: string;
    disputed_amount_kobo: number;
    status: string;
    resolution_type?: string | null;
    resolution_summary?: string | null;
    created_at: string;
  } | null;
}

export interface CustomerNotificationItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CustomerProfileItem {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_role: string;
  city: string;
  state: string;
  address_line: string | null;
  preferred_currency: string;
  is_active: boolean;
  created_at: string;
}

export interface EnrichedCatalogueService extends CatalogueServiceItem {
  category_id: string;
  subcategory_id: string | null;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  category_image_url: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  show_on_homepage: boolean;
  available_provider_count?: number;
}

export interface HomepageCategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  image_url: string | null;
  keywords: string[];
  is_featured: boolean;
  is_popular: boolean;
  show_on_homepage: boolean;
  display_order: number;
  subcategory_count: number;
  service_count: number;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    service_count: number;
  }>;
}

export interface HomepageCatalogueData {
  tree: CatalogueCategoryNode[];
  mainCategories: HomepageCategorySummary[];
  featuredServices: EnrichedCatalogueService[];
  popularServices: EnrichedCatalogueService[];
  allServices: EnrichedCatalogueService[];
  totalServicesCount: number;
  hasError: boolean;
}

export interface CatalogueDiscoverySearchResult {
  categories: HomepageCategorySummary[];
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string;
    parent_name: string;
    parent_slug: string;
    service_count: number;
  }>;
  services: EnrichedCatalogueService[];
}

const fetchActiveServiceCategoriesCached = unstable_cache(
  async (): Promise<ServiceCategoryItem[]> => {
    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("SUPABASE_CONFIG_MISSING");
    }

    const res = await supabaseFetch<ServiceCategoryItem[]>(
      config,
      "/rest/v1/service_categories?is_active=eq.true&deleted_at=is.null&order=display_order.asc,name.asc&select=*"
    );

    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("SERVICE_CATEGORIES_FETCH_FAILED");
    }
    return res.data;
  },
  ["active-service-categories-v1"],
  { revalidate: 120, tags: ["catalogue"] }
);

const fetchPublicCatalogueTreeCached = unstable_cache(
  async (): Promise<CatalogueCategoryNode[]> => {
    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("SUPABASE_CONFIG_MISSING");
    }

    const res = await supabaseFetch<CatalogueCategoryNode[]>(
      config,
      "/rest/v1/rpc/get_service_catalogue_tree",
      {
        method: "POST",
        body: { p_include_inactive: false },
        retryOnNetworkError: true,
      }
    );

    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("CATALOGUE_TREE_FETCH_FAILED");
    }
    return res.data;
  },
  ["public-catalogue-tree-v2"],
  { revalidate: 120, tags: ["catalogue"] }
);

/**
 * Fetch active service categories from Supabase PostgREST (cached with "catalogue" tag).
 * Pass `{ topLevelOnly: true }` when only Main Categories (`parent_id IS NULL`) are desired.
 */
export async function getServiceCategories(
  options: { topLevelOnly?: boolean } = {}
): Promise<ServiceCategoryItem[]> {
  try {
    const all = await fetchActiveServiceCategoriesCached();
    return options.topLevelOnly ? all.filter((c) => !c.parent_id) : all;
  } catch {
    return [];
  }
}

/**
 * Fetch homepage and discovery catalogue summaries (Main Categories, Subcategories,
 * Featured/Popular Services) from the single cached 3-tier catalogue tree RPC
 * with explicit `hasError` state for UI fallback handling and zero truncation limit.
 */
export async function getHomepageCatalogueData(): Promise<HomepageCatalogueData> {
  const empty: HomepageCatalogueData = {
    tree: [],
    mainCategories: [],
    featuredServices: [],
    popularServices: [],
    allServices: [],
    totalServicesCount: 0,
    hasError: false,
  };

  let tree: CatalogueCategoryNode[];
  try {
    tree = await fetchPublicCatalogueTreeCached();
  } catch {
    return { ...empty, hasError: true };
  }

  const allServices: EnrichedCatalogueService[] = [];
  const mainCategories: HomepageCategorySummary[] = tree.map((cat) => {
    const subcategories = (cat.subcategories || []).map((sub) => {
      const subServices = sub.services || [];
      for (const srv of subServices) {
        allServices.push({
          ...srv,
          category_id: srv.category_id || cat.id,
          subcategory_id: srv.subcategory_id ?? sub.id,
          description: srv.description ?? null,
          show_on_homepage: Boolean(srv.show_on_homepage),
          display_order: srv.display_order ?? 999,
          category_name: cat.name,
          category_slug: cat.slug,
          category_icon: cat.icon_name,
          category_image_url: cat.image_url,
          subcategory_name: sub.name,
          subcategory_slug: sub.slug,
        });
      }
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        service_count: subServices.length,
      };
    });

    const directServices = cat.direct_services || [];
    for (const srv of directServices) {
      allServices.push({
        ...srv,
        category_id: srv.category_id || cat.id,
        subcategory_id: srv.subcategory_id ?? null,
        description: srv.description ?? null,
        show_on_homepage: Boolean(srv.show_on_homepage),
        display_order: srv.display_order ?? 999,
        category_name: cat.name,
        category_slug: cat.slug,
        category_icon: cat.icon_name,
        category_image_url: cat.image_url,
        subcategory_name: null,
        subcategory_slug: null,
      });
    }

    const nestedServiceCount = subcategories.reduce(
      (sum, sub) => sum + sub.service_count,
      0
    );

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon_name: cat.icon_name,
      image_url: cat.image_url,
      keywords: Array.isArray(cat.keywords) ? cat.keywords : [],
      is_featured: Boolean(cat.is_featured),
      is_popular: Boolean(cat.is_popular),
      show_on_homepage: Boolean(cat.show_on_homepage),
      display_order: cat.display_order,
      subcategory_count: subcategories.length,
      service_count: nestedServiceCount + directServices.length,
      subcategories,
    };
  });

  mainCategories.sort((a, b) => {
    if (a.show_on_homepage !== b.show_on_homepage) {
      return a.show_on_homepage ? -1 : 1;
    }
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.name.localeCompare(b.name);
  });

  const featuredServices = [...allServices]
    .filter((s) => Boolean(s.show_on_homepage) && (s.status ? s.status === "active" : s.is_active))
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
      return (a.display_order ?? 999) - (b.display_order ?? 999) || a.name.localeCompare(b.name);
    });

  const popularServices = [...allServices]
    .filter((s) => s.is_popular && Boolean(s.show_on_homepage) && (s.status ? s.status === "active" : s.is_active))
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return (a.display_order ?? 999) - (b.display_order ?? 999) || a.name.localeCompare(b.name);
    });

  return {
    tree,
    mainCategories,
    featuredServices,
    popularServices,
    allServices,
    totalServicesCount: allServices.length,
    hasError: false,
  };
}

export interface PaginatedCatalogueSearchResult {
  items: CatalogueSearchResultItem[];
  totalCount: number;
  limit: number;
  offset: number;
  hasError: boolean;
}

const fetchCatalogueSearchCached = unstable_cache(
  async (
    queryText: string,
    categorySlug: string,
    subcategorySlug: string,
    requiresCertFlag: string,
    limit: number,
    offset: number
  ): Promise<PaginatedCatalogueSearchResult> => {
    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("SUPABASE_CONFIG_MISSING");
    }

    const requiresCert =
      requiresCertFlag === "true"
        ? true
        : requiresCertFlag === "false"
          ? false
          : null;

    const res = await supabaseFetch<CatalogueSearchResultItem[]>(
      config,
      "/rest/v1/rpc/search_service_catalogue",
      {
        method: "POST",
        body: {
          p_query: queryText || null,
          p_category_slug: categorySlug || null,
          p_subcategory_slug: subcategorySlug || null,
          p_requires_certification: requiresCert,
          p_include_unavailable: false,
          p_limit: limit,
          p_offset: offset,
        },
        retryOnNetworkError: true,
      }
    );

    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("CATALOGUE_SEARCH_FAILED");
    }

    const totalCount =
      res.data.length > 0 && res.data[0]?.total_count !== undefined
        ? Number(res.data[0].total_count)
        : 0;

    return {
      items: res.data,
      totalCount: Number.isFinite(totalCount) ? totalCount : res.data.length,
      limit,
      offset,
      hasError: false,
    };
  },
  ["catalogue-search-paginated-v1"],
  { revalidate: 60, tags: ["catalogue"] }
);

/**
 * Server-paginated, FTS + keyword + trigram catalogue search backed by
 * PostgreSQL public.search_service_catalogue (cached 60s, tagged "catalogue").
 */
export async function searchServiceCataloguePaginated(params: {
  query?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  requiresCertification?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedCatalogueSearchResult> {
  const limit = Math.max(1, Math.min(params.limit ?? 12, 100));
  const offset = Math.max(0, params.offset ?? 0);
  const queryText = (params.query?.trim() || "").toLowerCase();
  const categorySlug = params.categorySlug
    ? normalizeCatalogueSlugAlias(params.categorySlug)
    : "";
  const subcategorySlug = params.subcategorySlug
    ? normalizeCatalogueSlugAlias(params.subcategorySlug)
    : "";
  const requiresCertFlag =
    typeof params.requiresCertification === "boolean"
      ? String(params.requiresCertification)
      : "";

  try {
    return await fetchCatalogueSearchCached(
      queryText,
      categorySlug,
      subcategorySlug,
      requiresCertFlag,
      limit,
      offset
    );
  } catch {
    return { items: [], totalCount: 0, limit, offset, hasError: true };
  }
}

/**
 * Search active Main Categories, Subcategories, and Individual Services for live
 * search suggestions using cached catalogue metadata + indexed PostgreSQL FTS search.
 */
export async function searchCatalogueDiscovery(
  query: string,
  limits: { categories?: number; subcategories?: number; services?: number } = {}
): Promise<CatalogueDiscoverySearchResult & { hasError: boolean; totalServicesCount?: number }> {
  const catLimit = limits.categories ?? 4;
  const subLimit = limits.subcategories ?? 4;
  const srvLimit = limits.services ?? 6;
  const q = query.trim().toLowerCase();

  // Reuse cached homepage catalogue summary (0ms when warm) instead of scanning services/categories every keystroke
  const [homepageSummary, srvSearchRes] = await Promise.all([
    getHomepageCatalogueData(),
    q
      ? searchServiceCataloguePaginated({
          query: q,
          limit: srvLimit,
          offset: 0,
        })
      : Promise.resolve(null),
  ]);

  if ((homepageSummary.hasError && srvSearchRes?.hasError) || (homepageSummary.hasError && !q)) {
    return {
      categories: [],
      subcategories: [],
      services: [],
      totalServicesCount: 0,
      hasError: true,
    };
  }

  const mainCategories = homepageSummary.mainCategories;
  const subCategories = homepageSummary.tree.flatMap((cat) =>
    (cat.subcategories || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description,
      keywords: Array.isArray(sub.keywords) ? sub.keywords : [],
      parent_id: cat.id,
      parent_name: cat.name,
      parent_slug: cat.slug,
      service_count: (sub.services || []).length,
      is_featured: Boolean(sub.is_featured),
      is_popular: Boolean(sub.is_popular),
    }))
  );

  if (!q) {
    const initialServices = (
      homepageSummary.featuredServices.length > 0
        ? homepageSummary.featuredServices
        : homepageSummary.allServices
    ).slice(0, srvLimit);

    return {
      categories: mainCategories.slice(0, catLimit),
      subcategories: subCategories
        .filter((s) => s.is_featured || s.is_popular)
        .slice(0, subLimit)
        .map(({ keywords: _k, is_featured: _f, is_popular: _p, ...rest }) => rest),
      services: initialServices,
      totalServicesCount: homepageSummary.totalServicesCount,
      hasError: false,
    };
  }

  const mappedServices: EnrichedCatalogueService[] = (srvSearchRes?.items || []).map((item) => ({
    id: item.id,
    category_id: item.category_id,
    subcategory_id: item.subcategory_id,
    service_code: item.service_code,
    name: item.name,
    slug: item.slug,
    short_description: item.short_description,
    description: item.description,
    image_url: item.image_url,
    icon_name: item.icon_name,
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    base_price_min_kobo: item.base_price_min_kobo,
    base_price_max_kobo: item.base_price_max_kobo,
    estimated_duration_minutes: item.estimated_duration_minutes,
    is_active: item.is_active,
    is_featured: item.is_featured,
    is_popular: item.is_popular,
    show_on_homepage: item.show_on_homepage,
    requires_verified_identity: true,
    requires_trade_certification: item.requires_trade_certification,
    requires_business_registration: item.requires_business_registration,
    requires_site_inspection: item.requires_site_inspection,
    min_years_experience: item.min_years_experience,
    eligible_provider_types: [],
    required_document_types: [],
    category_name: item.category_name,
    category_slug: item.category_slug,
    category_icon: item.category_icon,
    category_image_url: null,
    subcategory_name: item.subcategory_name,
    subcategory_slug: item.subcategory_slug,
    available_provider_count: item.available_provider_count,
  }));

  const terms = q.split(/\s+/).filter(Boolean);
  const aliasSlug = normalizeCatalogueSlugAlias(q);

  const scoreText = (fields: Array<{ text: string | null | undefined; weight: number }>): number => {
    let score = 0;
    for (const term of terms) {
      let termMatched = false;
      for (const f of fields) {
        const val = (f.text || "").toLowerCase();
        if (!val) continue;
        if (val === term) {
          score += f.weight * 2;
          termMatched = true;
        } else if (val.startsWith(term)) {
          score += f.weight * 1.5;
          termMatched = true;
        } else if (val.includes(term)) {
          score += f.weight;
          termMatched = true;
        }
      }
      if (!termMatched) return 0;
    }
    return score;
  };

  const matchedCategories = mainCategories
    .map((cat) => ({
      cat,
      score:
        (cat.slug === aliasSlug ? 25 : 0) +
        scoreText([
          { text: cat.name, weight: 10 },
          { text: cat.slug.replace(/-/g, " "), weight: 6 },
          { text: cat.description, weight: 4 },
          { text: cat.keywords.join(" "), weight: 8 },
        ]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, catLimit)
    .map((x) => x.cat);

  const matchedSubcategories = subCategories
    .map((sub) => ({
      sub,
      score:
        (sub.slug === aliasSlug ? 25 : 0) +
        scoreText([
          { text: sub.name, weight: 10 },
          { text: sub.parent_name, weight: 4 },
          { text: sub.description, weight: 4 },
          { text: sub.keywords.join(" "), weight: 8 },
        ]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, subLimit)
    .map(({ sub }) => {
      const { keywords: _k, is_featured: _f, is_popular: _p, ...rest } = sub;
      return rest;
    });

  return {
    categories: matchedCategories,
    subcategories: matchedSubcategories,
    services: mappedServices,
    totalServicesCount: srvSearchRes?.totalCount ?? mappedServices.length,
    hasError: Boolean(srvSearchRes?.hasError),
  };
}

/**
 * Fetch the full 3-tier service catalogue hierarchy (Main Category -> Subcategory -> Services -> Requirements).
 * Public active trees use cached reads (`catalogue` tag); admin/inactive reads always query live uncached DB.
 */
export async function getServiceCatalogueTree(
  includeInactive: boolean = false,
  accessToken?: string
): Promise<CatalogueCategoryNode[]> {
  if (!includeInactive && !accessToken) {
    try {
      return await fetchPublicCatalogueTreeCached();
    } catch {
      return [];
    }
  }

  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<CatalogueCategoryNode[]>(
    config,
    "/rest/v1/rpc/get_service_catalogue_tree",
    {
      method: "POST",
      accessToken,
      body: { p_include_inactive: includeInactive },
      retryOnNetworkError: true,
    }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch active individual services, optionally filtered by main category or subcategory.
 */
export async function getCatalogueServices(params: {
  categoryId?: string;
  subcategoryId?: string;
  featuredOnly?: boolean;
  limit?: number;
} = {}): Promise<CatalogueServiceItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const filters: string[] = [
    "is_active=eq.true",
    "deleted_at=is.null",
    "order=display_order.asc,name.asc",
    `limit=${params.limit ?? 200}`,
    "select=*,service_requirements(*)",
  ];
  if (params.categoryId) filters.push(`category_id=eq.${params.categoryId}`);
  if (params.subcategoryId) filters.push(`subcategory_id=eq.${params.subcategoryId}`);
  if (params.featuredOnly) filters.push("is_featured=eq.true");

  const res = await supabaseFetch<Array<CatalogueServiceItem & { service_requirements?: unknown[] }>>(
    config,
    `/rest/v1/services?${filters.join("&")}`
  );

  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data.map((row) => ({
    ...row,
    requirements: Array.isArray(row.service_requirements)
      ? (row.service_requirements as CatalogueServiceItem["requirements"])
      : [],
  }));
}

const fetchCatalogueServiceBySlugOrIdCached = unstable_cache(
  async (normalizedKey: string): Promise<CatalogueServiceItem | null> => {
    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("SUPABASE_CONFIG_MISSING");
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedKey);
    const filter = isUuid ? `id=eq.${normalizedKey}` : `slug=eq.${encodeURIComponent(normalizedKey)}`;

    const res = await supabaseFetch<Array<CatalogueServiceItem & { service_requirements?: unknown[] }>>(
      config,
      `/rest/v1/services?${filter}&is_active=eq.true&deleted_at=is.null&limit=1&select=*,service_requirements(*)`
    );

    if (!res.ok) {
      throw new Error("CATALOGUE_SERVICE_FETCH_FAILED");
    }
    if (!Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
      return null;
    }

    const row = res.data[0];
    return {
      ...row,
      requirements: Array.isArray(row.service_requirements)
        ? (row.service_requirements as CatalogueServiceItem["requirements"])
        : [],
    };
  },
  ["catalogue-service-by-slug-v1"],
  { revalidate: 120, tags: ["catalogue"] }
);

/**
 * Fetch a single active catalogue service by slug or ID, including requirements.
 */
export async function getCatalogueServiceBySlugOrId(
  slugOrId: string
): Promise<CatalogueServiceItem | null> {
  const normalized = slugOrId.trim().toLowerCase();
  if (!normalized) return null;
  try {
    return await fetchCatalogueServiceBySlugOrIdCached(normalized);
  } catch {
    return null;
  }
}

/**
 * Fetch recommended / discoverable professionals from Supabase view.
 */
export async function getDiscoverableProfessionals(params: {
  city?: string;
  categoryId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  limit?: number;
} = {}): Promise<PublicProfessionalItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParts: string[] = ["select=*"];

  if (params.city && params.city !== "All Cities") {
    queryParts.push(`primary_city=ilike.*${encodeURIComponent(params.city)}*`);
  }

  if (params.verifiedOnly) {
    queryParts.push("verification_status=eq.approved");
  }

  if (params.minRating && params.minRating > 0) {
    queryParts.push(`average_rating=gte.${params.minRating}`);
  }

  const limit = params.limit ?? 20;
  queryParts.push(`limit=${limit}`);
  queryParts.push("order=completed_jobs_count.desc,average_rating.desc");

  const path = `/rest/v1/public_professional_directory?${queryParts.join("&")}`;
  const res = await supabaseFetch<PublicProfessionalItem[]>(config, path);

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch single professional by id or slug.
 */
export async function getProfessionalById(
  idOrSlug: string
): Promise<PublicProfessionalItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const filter = isUuid
    ? `professional_id=eq.${idOrSlug}`
    : `slug=eq.${encodeURIComponent(idOrSlug)}`;

  const res = await supabaseFetch<PublicProfessionalItem[]>(
    config,
    `/rest/v1/public_professional_directory?${filter}&limit=1&select=*`
  );

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    const pro = res.data[0];

    const [servicesRes, areasRes, reviewsRes] = await Promise.all([
      supabaseFetch<any[]>(
        config,
        `/rest/v1/professional_services?professional_id=eq.${pro.professional_id}&is_active=eq.true&deleted_at=is.null&select=id,service_title,min_price_kobo,max_price_kobo,description,is_primary_skill,service_categories(name,slug)`
      ),
      supabaseFetch<any[]>(
        config,
        `/rest/v1/professional_service_areas?professional_id=eq.${pro.professional_id}&is_active=eq.true&select=id,city,state,lga_or_district,service_radius_km`
      ),
      supabaseFetch<any[]>(
        config,
        `/rest/v1/reviews?professional_id=eq.${pro.professional_id}&is_published=eq.true&moderation_status=eq.approved&select=id,rating,title,comment,professional_response,responded_at,created_at&order=created_at.desc&limit=10`
      ),
    ]);

    pro.services =
      servicesRes.ok && Array.isArray(servicesRes.data)
        ? servicesRes.data.map((s) => ({
            ...s,
            category: s.service_categories || null,
          }))
        : [];
    pro.service_areas =
      areasRes.ok && Array.isArray(areasRes.data) ? areasRes.data : [];
    pro.reviews =
      reviewsRes.ok && Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

    return pro;
  }
  return null;
}

export async function getCustomerBookingsPaginated(
  userId: string,
  accessToken: string,
  options: {
    statusFilter?: "active" | "completed" | "cancelled" | "all";
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: CustomerBookingItem[]; totalCount: number }> {
  const config = getSupabasePublicConfig();
  if (!config) return { items: [], totalCount: 0 };

  const limit = Math.max(1, Math.min(options.limit ?? 15, 100));
  const offset = Math.max(0, options.offset ?? 0);

  const queryParts = [
    `customer_id=eq.${userId}`,
    "deleted_at=is.null",
    "select=id,reference_code,customer_id,professional_id,category_id,title,description,urgency,status,city,state,lga_or_district,service_address,preferred_date,preferred_time_slot,scheduled_start_at,scheduled_end_at,accepted_quotation_id,agreed_amount_kobo,currency_code,pro_completion_notes,cancellation_reason,created_at,updated_at,service_categories!bookings_category_id_fkey(name,slug,icon_name)",
    "order=created_at.desc",
    `limit=${limit}`,
    `offset=${offset}`,
  ];

  if (options.statusFilter === "active") {
    queryParts.push("status=in.(submitted,open,pending_pro_response,matched,quoted,accepted,confirmed,scheduled,in_progress,pro_marked_complete)");
  } else if (options.statusFilter === "completed") {
    queryParts.push("status=eq.completed");
  } else if (options.statusFilter === "cancelled") {
    queryParts.push("status=eq.cancelled");
  }

  const path = `/rest/v1/bookings?${queryParts.join("&")}`;
  const res = await supabaseFetch<any[]>(config, path, {
    accessToken,
    headers: { Prefer: "count=exact" },
  });

  if (!res.ok || !Array.isArray(res.data)) {
    return { items: [], totalCount: 0 };
  }

  const items: CustomerBookingItem[] = res.data.map((row) => ({
    ...row,
    category: row.service_categories
      ? {
          name: row.service_categories.name,
          slug: row.service_categories.slug,
          icon_name: row.service_categories.icon_name,
        }
      : null,
  }));

  return {
    items,
    totalCount: typeof res.totalCount === "number" ? res.totalCount : items.length,
  };
}

/**
 * Fetch customer bookings for the authenticated user (bounded default projection).
 */
export async function getCustomerBookings(
  userId: string,
  accessToken: string,
  statusFilter?: "active" | "completed" | "cancelled" | "all",
  limit: number = 50
): Promise<CustomerBookingItem[]> {
  const res = await getCustomerBookingsPaginated(userId, accessToken, {
    statusFilter,
    limit,
    offset: 0,
  });
  return res.items;
}

/**
 * Fetch a single booking by ID with full details, attachments, quotations, appointments & history.
 */
export async function getCustomerBookingById(
  bookingId: string,
  userId: string,
  accessToken: string
): Promise<CustomerBookingItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const [bookingRes, quotesRes, appointmentsRes, historyRes, reviewRes, disputeRes] = await Promise.all([
    supabaseFetch<any[]>(
      config,
      `/rest/v1/bookings?id=eq.${bookingId}&customer_id=eq.${userId}&select=*,service_categories!bookings_category_id_fkey(name,slug,icon_name),booking_attachments(*),professional_profiles(id,business_name,headline,verification_status)&limit=1`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/quotations?booking_id=eq.${bookingId}&select=*,quotation_items(*),professional_profiles(id,business_name,headline,primary_city,verification_status)&order=created_at.desc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/appointments?booking_id=eq.${bookingId}&order=scheduled_start_at.desc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/booking_status_history?booking_id=eq.${bookingId}&order=created_at.asc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/reviews?booking_id=eq.${bookingId}&limit=1&select=*`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/disputes?booking_id=eq.${bookingId}&order=created_at.desc&limit=1&select=*`,
      { accessToken }
    ),
  ]);

  if (!bookingRes.ok || !Array.isArray(bookingRes.data) || bookingRes.data.length === 0) {
    return null;
  }

  const row = bookingRes.data[0];
  const review = reviewRes.ok && Array.isArray(reviewRes.data) && reviewRes.data.length > 0 ? reviewRes.data[0] : null;
  const dispute = disputeRes.ok && Array.isArray(disputeRes.data) && disputeRes.data.length > 0 ? disputeRes.data[0] : null;

  return {
    ...row,
    category: row.service_categories
      ? {
          name: row.service_categories.name,
          slug: row.service_categories.slug,
          icon_name: row.service_categories.icon_name,
        }
      : null,
    assigned_pro: row.professional_profiles
      ? {
          business_name: row.professional_profiles.business_name,
          display_name: row.professional_profiles.headline,
          avatar_url: null,
          verification_status: row.professional_profiles.verification_status,
        }
      : null,
    attachments: Array.isArray(row.booking_attachments) ? row.booking_attachments : [],
    quotations: quotesRes.ok && Array.isArray(quotesRes.data) ? quotesRes.data : [],
    appointments: appointmentsRes.ok && Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [],
    status_history: historyRes.ok && Array.isArray(historyRes.data) ? historyRes.data : [],
    review,
    active_dispute: dispute,
  };
}

/**
 * Fetch customer notifications from Supabase.
 */
export async function getCustomerNotifications(
  userId: string,
  accessToken: string
): Promise<CustomerNotificationItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const path = `/rest/v1/notifications?user_id=eq.${userId}&order=created_at.desc&limit=10&select=*`;
  const res = await supabaseFetch<CustomerNotificationItem[]>(config, path, { accessToken });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch customer profile.
 */
export async function getCustomerProfile(
  userId: string,
  accessToken: string
): Promise<CustomerProfileItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const path = `/rest/v1/profiles?id=eq.${userId}&limit=1&select=*`;
  const res = await supabaseFetch<CustomerProfileItem[]>(config, path, { accessToken });

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    return res.data[0];
  }
  return null;
}

/**
 * Privacy-first anonymized aggregate search counter recorder.
 * Never logs user_id, session_id, IPs, or email/phone-like queries.
 * Fails silently with a short timeout so customer search is never delayed.
 */
export async function recordCatalogueSearchSignal(params: {
  query: string;
  surface: "suggest" | "catalogue" | "explore";
  city?: string | null;
  resolvedCategoryId?: string | null;
  resolvedServiceId?: string | null;
  resultCount: number;
}): Promise<void> {
  const trimmed = params.query.trim().replace(/\s+/g, " ");
  const minLen = params.surface === "suggest" ? 3 : 2;
  if (trimmed.length < minLen) return;
  if (trimmed.includes("@") || /[0-9]{7,}/.test(trimmed)) return;

  const config = getSupabasePublicConfig();
  if (!config) return;

  try {
    await supabaseFetch<void>(
      config,
      "/rest/v1/rpc/record_catalogue_search_signal",
      {
        method: "POST",
        timeoutMs: 5000,
        retryOnNetworkError: true,
        body: {
          p_query: trimmed.slice(0, 80),
          p_surface: params.surface,
          p_city:
            params.city && params.city !== "All Cities"
              ? params.city.trim().slice(0, 60)
              : "",
          p_resolved_category_id: params.resolvedCategoryId || null,
          p_resolved_service_id: params.resolvedServiceId || null,
          p_result_count: Math.max(0, Math.floor(params.resultCount || 0)),
        },
      }
    );
  } catch {
    // Non-blocking telemetry: ignore transient failures
  }
}
