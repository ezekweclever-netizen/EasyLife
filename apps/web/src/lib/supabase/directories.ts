import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { BusinessRow, BusinessPromotionRow } from "@easylife/shared-types";
import type { MatchedProfessionalItem } from "@/lib/supabase/matching";

export interface DirectoryBusinessItem extends BusinessRow {
  owner_name?: string;
}

export interface DirectoryBusinessDetail extends DirectoryBusinessItem {
  promotions?: BusinessPromotionRow[];
}

export interface BusinessFilterOptions {
  category?: string;
  city?: string;
  query?: string;
  limit?: number;
}

/**
 * Fetch approved local businesses participating in the local service directory.
 */
export async function getDirectoryBusinesses(
  options: BusinessFilterOptions = {}
): Promise<DirectoryBusinessItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParams = new URLSearchParams();
  queryParams.set("is_active", "eq.true");
  queryParams.set("is_directory_listed", "eq.true");
  queryParams.set("order", "name.asc");

  if (options.city && options.city !== "All Cities" && options.city !== "All") {
    queryParams.set("city", `ilike.*${options.city}*`);
  }

  if (options.category && options.category !== "All") {
    queryParams.set("business_category", `ilike.*${options.category}*`);
  }

  if (options.query?.trim()) {
    const q = options.query.trim();
    queryParams.set("or", `(name.ilike.*${q}*,description.ilike.*${q}*,industry.ilike.*${q}*,address.ilike.*${q}*)`);
  }

  queryParams.set("limit", String(options.limit ?? 50));

  const path = `/rest/v1/businesses?${queryParams.toString()}&select=*`;
  const res = await supabaseFetch<DirectoryBusinessItem[]>(config, path);

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch verified dispatch riders and courier professionals.
 */
export async function getDispatchRiders(
  city: string = "All Cities"
): Promise<MatchedProfessionalItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<MatchedProfessionalItem[]>(
    config,
    "/rest/v1/rpc/match_service_professionals",
    {
      method: "POST",
      body: {
        p_city: city === "All Cities" ? "All Cities" : city,
        p_provider_type: "dispatch_rider",
        p_limit: 30,
      },
    }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch verified property service agents and accommodation consultants.
 *
 * STRICT POLICY: These professionals offer consulting, rental assistance,
 * and property management services. NO PROPERTY LISTINGS ARE HOSTED.
 */
export async function getPropertyServiceAgents(
  city: string = "All Cities"
): Promise<MatchedProfessionalItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<MatchedProfessionalItem[]>(
    config,
    "/rest/v1/rpc/match_service_professionals",
    {
      method: "POST",
      body: {
        p_city: city === "All Cities" ? "All Cities" : city,
        p_provider_type: "property_agent",
        p_limit: 30,
      },
    }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch an approved local business by slug or UUID, including its active promotions.
 */
export async function getBusinessBySlugOrId(
  slugOrId: string
): Promise<DirectoryBusinessDetail | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slugOrId
    );

  const filter = isUuid
    ? `id=eq.${slugOrId}`
    : `slug=eq.${encodeURIComponent(slugOrId)}`;

  const res = await supabaseFetch<DirectoryBusinessItem[]>(
    config,
    `/rest/v1/businesses?${filter}&limit=1`
  );

  if (!res.ok || !Array.isArray(res.data) || !res.data[0]) {
    return null;
  }

  const business = res.data[0];

  // Fetch active promotions for this business
  const promoRes = await supabaseFetch<BusinessPromotionRow[]>(
    config,
    `/rest/v1/business_promotions?business_id=eq.${business.id}&is_active=eq.true&moderation_status=eq.approved&order=created_at.desc&limit=5`
  );

  const promotions =
    promoRes.ok && Array.isArray(promoRes.data) ? promoRes.data : [];

  return {
    ...business,
    promotions,
  };
}

/**
 * Fetch active, approved promotions from public.business_promotions.
 */
export async function getActiveBusinessPromotions(
  limit: number = 6
): Promise<
  Array<
    BusinessPromotionRow & {
      business?: { name: string; city: string; slug: string } | null;
    }
  >
> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<
    Array<
      BusinessPromotionRow & {
        business: { name: string; city: string; slug: string } | null;
      }
    >
  >(
    config,
    `/rest/v1/business_promotions?is_active=eq.true&moderation_status=eq.approved&select=*,business:businesses(name,city,slug)&order=created_at.desc&limit=${limit}`
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}
