import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { HealthcareFacilityRow } from "@easylife/shared-types";

export interface HealthcareFilterOptions {
  facilityType?: "hospital" | "clinic" | "pharmacy" | "all";
  city?: string;
  lga?: string;
  query?: string;
  emergencyOnly?: boolean;
  limit?: number;
}

/**
 * Fetch verified healthcare facilities (Hospitals, Clinics, Pharmacies)
 *
 * NOTE: EasyLife is strictly an informational directory for facility discovery.
 * EasyLife does not provide clinical healthcare services or medical consultations.
 */
export async function getHealthcareFacilities(
  options: HealthcareFilterOptions = {}
): Promise<HealthcareFacilityRow[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParams = new URLSearchParams();
  queryParams.set("is_active", "eq.true");
  queryParams.set("order", "is_emergency_24_7.desc,name.asc");

  if (options.facilityType && options.facilityType !== "all") {
    queryParams.set("facility_type", `eq.${options.facilityType}`);
  }

  if (options.city && options.city !== "All Cities") {
    queryParams.set("city", `ilike.*${options.city}*`);
  }

  if (options.lga) {
    queryParams.set("lga", `ilike.*${options.lga}*`);
  }

  if (options.emergencyOnly) {
    queryParams.set("is_emergency_24_7", "eq.true");
  }

  if (options.query?.trim()) {
    const q = options.query.trim();
    queryParams.set("or", `(name.ilike.*${q}*,description.ilike.*${q}*,address.ilike.*${q}*,neighbourhood.ilike.*${q}*)`);
  }

  queryParams.set("limit", String(options.limit ?? 50));

  const path = `/rest/v1/healthcare_facilities?${queryParams.toString()}&select=*`;
  const res = await supabaseFetch<HealthcareFacilityRow[]>(config, path);

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch a single healthcare facility by unique slug.
 */
export async function getHealthcareFacilityBySlug(
  slug: string
): Promise<HealthcareFacilityRow | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const path = `/rest/v1/healthcare_facilities?slug=eq.${encodeURIComponent(slug)}&limit=1&select=*`;
  const res = await supabaseFetch<HealthcareFacilityRow[]>(config, path);

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    return res.data[0];
  }
  return null;
}
