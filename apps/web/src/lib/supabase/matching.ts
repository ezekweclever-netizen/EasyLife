import { unstable_cache } from "next/cache";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";
import type { ProfessionalDiscoverySort } from "@easylife/shared-types";

export interface OperatingNeighbourhood {
  id: string;
  state: string;
  city: string;
  lga: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  display_order: number;
}

export interface MatchedProfessionalItem {
  professional_id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;
  verification_status: string;
  is_verified: boolean;
  is_available: boolean;
  is_schedule_available: boolean;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  base_callout_fee_kobo: number;
  primary_city: string;
  primary_state: string;
  avatar_url: string | null;
  distance_km: number;
  coverage_match: boolean;
  category_name: string;
  category_slug: string;
  service_title?: string | null;
  provider_type?: string;
  match_score: number;
  matched_service_id?: string | null;
  matched_service_name?: string | null;
  total_count?: number;
}

export interface MatchSearchParams {
  categoryId?: string;
  categorySlug?: string;
  serviceId?: string;
  keyword?: string;
  city?: string;
  lga?: string;
  neighbourhood?: string;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  targetDate?: string; // YYYY-MM-DD
  targetTime?: string; // HH:MM
  minRating?: number;
  verifiedOnly?: boolean;
  availableOnly?: boolean;
  providerType?: string;
  sortBy?: ProfessionalDiscoverySort;
  limit?: number;
  offset?: number;
}

export interface PaginatedProfessionalMatchResult {
  items: MatchedProfessionalItem[];
  totalCount: number;
  limit: number;
  offset: number;
  hasError: boolean;
}

const fetchOperatingNeighbourhoodsCached = unstable_cache(
  async (): Promise<OperatingNeighbourhood[]> => {
    const config = getSupabasePublicConfig();
    if (!config) {
      throw new Error("SUPABASE_CONFIG_MISSING");
    }

    const res = await supabaseFetch<OperatingNeighbourhood[]>(
      config,
      "/rest/v1/operating_neighbourhoods?is_active=eq.true&order=city.asc,display_order.asc&select=*"
    );
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("NEIGHBOURHOODS_FETCH_FAILED");
    }
    return res.data;
  },
  ["operating-neighbourhoods-active-v1"],
  { revalidate: 300, tags: ["catalogue", "neighbourhoods"] }
);

/**
 * Fetch active operating neighbourhoods with GPS coordinates across EasyLife hubs
 * (Port Harcourt, Lagos, and Abuja). Cached cleanly across SSR & discovery routes.
 */
export async function getOperatingNeighbourhoods(city?: string): Promise<OperatingNeighbourhood[]> {
  try {
    const all = await fetchOperatingNeighbourhoodsCached();
    if (city && city !== "All Cities") {
      const needle = city.trim().toLowerCase();
      return all.filter((n) => n.city.toLowerCase().includes(needle));
    }
    return all;
  } catch {
    return [];
  }
}

/**
 * Find neighbourhood by slug or name to retrieve its reference latitude/longitude.
 */
export async function getNeighbourhoodCoordinates(
  nameOrSlug: string,
  city?: string
): Promise<{ latitude: number; longitude: number; name: string; lga: string } | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  let path = `/rest/v1/operating_neighbourhoods?or=(slug.eq.${encodeURIComponent(nameOrSlug)},name.ilike.*${encodeURIComponent(nameOrSlug)}*)&limit=1&select=latitude,longitude,name,lga`;
  if (city && city !== "All Cities") {
    path += `&city=ilike.*${encodeURIComponent(city)}*`;
  }
  const res = await supabaseFetch<Array<{ latitude: number; longitude: number; name: string; lga: string }>>(config, path);

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    return res.data[0];
  }
  return null;
}

/**
 * Execute the PostgreSQL location-based professional matching engine.
 *
 * Prioritises:
 * 1. Correct service category
 * 2. Service-area coverage & geographic distance
 * 3. Availability (only claimed if actual availability supports it)
 * 4. Relevant experience
 * 5. Customer rating
 * 6. Verification status (trust tier without automatically conflating with competence)
 */
export async function searchAndMatchProfessionalsPaginated(
  params: MatchSearchParams = {}
): Promise<PaginatedProfessionalMatchResult> {
  const limit = Math.max(1, Math.min(params.limit ?? 12, 100));
  const offset = Math.max(0, params.offset ?? 0);
  const config = getSupabasePublicConfig();
  if (!config) {
    return { items: [], totalCount: 0, limit, offset, hasError: true };
  }

  const rpcPayload: Record<string, unknown> = {
    p_category_id: params.categoryId || null,
    p_category_slug: params.categorySlug || null,
    p_keyword: params.keyword?.trim() || null,
    p_city: params.city === "all" || !params.city ? "All Cities" : params.city,
    p_lga: params.lga || null,
    p_neighbourhood: params.neighbourhood || null,
    p_latitude: params.latitude ?? null,
    p_longitude: params.longitude ?? null,
    p_max_distance_km: params.maxDistanceKm ?? null,
    p_target_date: params.targetDate || null,
    p_target_time: params.targetTime || null,
    p_min_rating: params.minRating ?? 0.0,
    p_verified_only: params.verifiedOnly ?? false,
    p_available_only: params.availableOnly ?? false,
    p_provider_type: params.providerType || null,
    p_limit: limit,
    p_offset: offset,
    p_service_id: params.serviceId || null,
    p_sort_by: params.sortBy || "relevance",
  };

  const res = await supabaseFetch<MatchedProfessionalItem[]>(
    config,
    "/rest/v1/rpc/search_professionals_paginated",
    {
      method: "POST",
      body: rpcPayload,
      retryOnNetworkError: true,
    }
  );

  if (!res.ok || !Array.isArray(res.data)) {
    return { items: [], totalCount: 0, limit, offset, hasError: !res.ok };
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
}

export async function searchAndMatchProfessionals(
  params: MatchSearchParams = {}
): Promise<MatchedProfessionalItem[]> {
  const result = await searchAndMatchProfessionalsPaginated({
    ...params,
    limit: params.limit ?? 30,
    offset: params.offset ?? 0,
  });
  return result.items;
}

/**
 * Admin: Fetch all categories (including inactive ones) with count of assigned pros.
 */
export async function getAllCategoriesAdmin(): Promise<ServiceCategoryItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<ServiceCategoryItem[]>(
    config,
    "/rest/v1/service_categories?deleted_at=is.null&order=display_order.asc&select=*"
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}
