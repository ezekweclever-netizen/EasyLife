"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { storageService } from "@/lib/storage/storage-service";
import type { DocumentType } from "@/lib/supabase/pro";
import type {
  ProfessionalServiceEligibilityResult,
  ProviderType,
} from "@easylife/shared-types";

export interface ProFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  data?: Record<string, unknown>;
}

const VALID_PROVIDER_TYPES: ProviderType[] = [
  "trade_technician",
  "dispatch_rider",
  "property_agent",
  "general_artisan",
];

function resolvePilotCityState(city: string): string {
  if (city === "Lagos") return "Lagos State";
  if (city === "Abuja") return "Federal Capital Territory";
  return "Rivers State";
}

function isValidTimeRange(startTime: string, endTime: string): boolean {
  const s = startTime.slice(0, 5);
  const e = endTime.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(s) && /^\d{2}:\d{2}$/.test(e) && s < e;
}

async function verifyOwnedProfessional(
  config: NonNullable<ReturnType<typeof getSupabasePublicConfig>>,
  professionalId: string,
  userId: string,
  accessToken: string
): Promise<{ id: string; verification_status: string; primary_city: string; primary_state: string } | null> {
  if (!professionalId) return null;
  const res = await supabaseFetch<
    Array<{ id: string; verification_status: string; primary_city: string; primary_state: string }>
  >(
    config,
    `/rest/v1/professional_profiles?id=eq.${professionalId}&user_id=eq.${userId}&deleted_at=is.null&limit=1&select=id,verification_status,primary_city,primary_state`,
    { accessToken }
  );
  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
    return null;
  }
  return res.data[0];
}

async function evaluateServiceEligibility(
  config: NonNullable<ReturnType<typeof getSupabasePublicConfig>>,
  professionalId: string,
  serviceId: string,
  accessToken: string
): Promise<ProfessionalServiceEligibilityResult | null> {
  if (!serviceId) return null;
  const res = await supabaseFetch<ProfessionalServiceEligibilityResult>(
    config,
    "/rest/v1/rpc/check_professional_service_eligibility",
    {
      method: "POST",
      accessToken,
      body: {
        p_professional_id: professionalId,
        p_service_id: serviceId,
      },
    }
  );
  return res.ok && res.data ? res.data : null;
}

/**
 * Register a professional account and profile.
 */
export async function registerProfessionalAction(
  _prevState: ProFormState,
  formData: FormData
): Promise<ProFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "Please sign in or create an EasyLife user account before completing professional onboarding.",
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Database configuration is not available.",
    };
  }

  const businessName = String(formData.get("businessName") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const yearsExperience = parseInt(String(formData.get("yearsExperience") || "0"), 10);
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const lgaOrDistrict = String(formData.get("lgaOrDistrict") || "").trim();
  const baseCalloutFeeNaira = parseFloat(String(formData.get("baseCalloutFee") || "5000"));
  const categoryIds = Array.from(new Set(formData.getAll("categoryIds").map(String).filter(Boolean)));
  const serviceIds = Array.from(new Set(formData.getAll("serviceIds").map(String).filter(Boolean)));
  const neighbourhoodIds = Array.from(new Set(formData.getAll("neighbourhoodIds").map(String).filter(Boolean)));
  const workingDaysRaw = formData
    .getAll("workingDays")
    .map((v) => parseInt(String(v), 10))
    .filter((d) => !Number.isNaN(d) && d >= 0 && d <= 6);
  const workingDays = workingDaysRaw.length > 0 ? workingDaysRaw : [1, 2, 3, 4, 5, 6];
  const serviceQualificationsRaw = String(formData.get("serviceQualificationsJson") || "{}");
  const startTime = String(formData.get("startTime") || "08:00").trim();
  const endTime = String(formData.get("endTime") || "18:00").trim();
  const rawProviderType = String(formData.get("providerType") || "trade_technician").trim();
  const providerType: ProviderType = VALID_PROVIDER_TYPES.includes(rawProviderType as ProviderType)
    ? (rawProviderType as ProviderType)
    : "trade_technician";
  const agentDisclaimerAccepted =
    formData.get("agentDisclaimerAccepted") === "true" ||
    formData.get("agentDisclaimerAccepted") === "on";
  const agentServices = formData.getAll("agentServices").map(String).filter(Boolean);
  const vehicleType = String(formData.get("vehicleType") || "Motorcycle").trim();
  const dispatchDetails = providerType === "dispatch_rider" ? { vehicle_type: vehicleType } : {};

  let serviceQualifications: Record<
    string,
    {
      qualificationNotes?: string;
      certificationReference?: string;
      yearsExperienceInService?: number | null;
    }
  > = {};
  try {
    const parsed = JSON.parse(serviceQualificationsRaw);
    if (parsed && typeof parsed === "object") {
      serviceQualifications = parsed;
    }
  } catch {
    serviceQualifications = {};
  }

  // Field validations
  const fieldErrors: Record<string, string> = {};

  if (providerType === "property_agent" && !agentDisclaimerAccepted) {
    fieldErrors.agentDisclaimer = "You must agree to the platform policy prohibiting property listings and advertisements.";
  }

  if (!businessName || businessName.length < 3) {
    fieldErrors.businessName = "Business or trade name must be at least 3 characters.";
  }

  if (!bio || bio.length < 20) {
    fieldErrors.bio = "Please provide a description of your trade experience (at least 20 characters).";
  }

  if (Number.isNaN(yearsExperience) || yearsExperience < 0 || yearsExperience > 70) {
    fieldErrors.yearsExperience = "Please enter valid years of experience (0–70).";
  }

  if (!["Port Harcourt", "Lagos", "Abuja"].includes(city)) {
    fieldErrors.city = "Please select one of our supported pilot cities.";
  }

  if (serviceIds.length === 0 && categoryIds.length === 0) {
    fieldErrors.categoryIds = "Please select at least one individual service or trade category.";
  }

  if (!isValidTimeRange(startTime, endTime)) {
    fieldErrors.workingHours = "Closing time must be later than opening time.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const state = resolvePilotCityState(city);

  // Create slug from business name + random suffix
  const cleanSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;
  const calloutFeeKobo = Math.max(0, Math.round((Number.isNaN(baseCalloutFeeNaira) ? 5000 : baseCalloutFeeNaira) * 100));

  // 1. Check if professional profile already exists
  const existingRes = await supabaseFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/professional_profiles?user_id=eq.${auth.user.id}&deleted_at=is.null&limit=1&select=id`,
    { accessToken: auth.accessToken }
  );

  let proProfileId: string;

  if (existingRes.ok && Array.isArray(existingRes.data) && existingRes.data.length > 0 && existingRes.data[0]) {
    proProfileId = existingRes.data[0].id;
    const updateRes = await supabaseFetch(
      config,
      `/rest/v1/professional_profiles?id=eq.${proProfileId}`,
      {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: {
          business_name: businessName,
          headline: headline || `${yearsExperience} Years Experienced ${businessName}`,
          bio,
          years_of_experience: yearsExperience,
          base_callout_fee_kobo: calloutFeeKobo,
          primary_city: city,
          primary_state: state,
          provider_type: providerType,
          agent_services: agentServices,
          agent_disclaimer_accepted: agentDisclaimerAccepted,
          dispatch_details: dispatchDetails,
          updated_at: new Date().toISOString(),
        },
      }
    );
    if (!updateRes.ok) {
      return {
        status: "error",
        message: updateRes.message || "Failed to update professional profile.",
      };
    }
  } else {
    const insertRes = await supabaseFetch<Array<{ id: string }>>(
      config,
      "/rest/v1/professional_profiles?select=id",
      {
        method: "POST",
        accessToken: auth.accessToken,
        headers: { Prefer: "return=representation" },
        body: {
          user_id: auth.user.id,
          business_name: businessName,
          slug,
          headline: headline || `${yearsExperience} Years Experienced Professional`,
          bio,
          years_of_experience: yearsExperience,
          base_callout_fee_kobo: calloutFeeKobo,
          currency_code: "NGN",
          verification_status: "unsubmitted",
          primary_city: city,
          primary_state: state,
          is_available: true,
          provider_type: providerType,
          agent_services: agentServices,
          agent_disclaimer_accepted: agentDisclaimerAccepted,
          dispatch_details: dispatchDetails,
        },
      }
    );

    if (!insertRes.ok || !Array.isArray(insertRes.data) || !insertRes.data[0]) {
      const errMessage = !insertRes.ok ? insertRes.message : "Failed to register professional profile.";
      return {
        status: "error",
        message: errMessage || "Failed to register professional profile.",
      };
    }
    proProfileId = insertRes.data[0].id;
  }

  // 2. Insert selected individual catalogue services + qualification notes
  const existingServicesRes = await supabaseFetch<
    Array<{ id: string; service_id: string | null; category_id: string }>
  >(
    config,
    `/rest/v1/professional_services?professional_id=eq.${proProfileId}&deleted_at=is.null&select=id,service_id,category_id`,
    { accessToken: auth.accessToken }
  );
  const existingServiceIds = new Set(
    (existingServicesRes.ok && Array.isArray(existingServicesRes.data)
      ? existingServicesRes.data
      : []
    )
      .map((s) => s.service_id)
      .filter((v): v is string => Boolean(v))
  );
  const existingCategoryOnlyIds = new Set(
    (existingServicesRes.ok && Array.isArray(existingServicesRes.data)
      ? existingServicesRes.data
      : []
    )
      .filter((s) => !s.service_id)
      .map((s) => s.category_id)
  );

  const coveredCategoryIds = new Set<string>();
  let primaryAssigned = (existingServicesRes.ok && Array.isArray(existingServicesRes.data) && existingServicesRes.data.length > 0);

  if (serviceIds.length > 0) {
    const catalogueRes = await supabaseFetch<
      Array<{
        id: string;
        category_id: string;
        subcategory_id: string | null;
        name: string;
        base_price_min_kobo: number;
      }>
    >(
      config,
      `/rest/v1/services?id=in.(${serviceIds.join(",")})&is_active=eq.true&deleted_at=is.null&select=id,category_id,subcategory_id,name,base_price_min_kobo`,
      { accessToken: auth.accessToken }
    );

    const catalogueList = catalogueRes.ok && Array.isArray(catalogueRes.data) ? catalogueRes.data : [];
    for (const srv of catalogueList) {
      const resolvedCategoryId = srv.subcategory_id || srv.category_id;
      coveredCategoryIds.add(srv.category_id);
      if (srv.subcategory_id) coveredCategoryIds.add(srv.subcategory_id);

      if (existingServiceIds.has(srv.id)) continue;

      const qual = serviceQualifications[srv.id] || {};
      const qualYears =
        typeof qual.yearsExperienceInService === "number" && !Number.isNaN(qual.yearsExperienceInService)
          ? Math.min(70, Math.max(0, Math.round(qual.yearsExperienceInService)))
          : yearsExperience;

      const insertSrvRes = await supabaseFetch(config, "/rest/v1/professional_services", {
        method: "POST",
        accessToken: auth.accessToken,
        headers: { Prefer: "resolution=ignore-duplicates" },
        body: {
          professional_id: proProfileId,
          category_id: resolvedCategoryId,
          service_id: srv.id,
          service_title: srv.name,
          min_price_kobo: Math.max(calloutFeeKobo, srv.base_price_min_kobo || 0),
          currency_code: "NGN",
          qualification_notes: qual.qualificationNotes?.trim() || null,
          certification_reference: qual.certificationReference?.trim() || null,
          years_experience_in_service: qualYears,
          is_primary_skill: !primaryAssigned,
          is_active: true,
        },
      });
      if (insertSrvRes.ok) {
        primaryAssigned = true;
      }
    }
  }

  // Fallback / broad category selection for any chosen category without specific service selection
  for (const catId of categoryIds) {
    if (coveredCategoryIds.has(catId) || existingCategoryOnlyIds.has(catId)) continue;
    await supabaseFetch(config, "/rest/v1/professional_services", {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: {
        professional_id: proProfileId,
        category_id: catId,
        min_price_kobo: calloutFeeKobo,
        currency_code: "NGN",
        is_primary_skill: !primaryAssigned,
        is_active: true,
      },
    });
    primaryAssigned = true;
  }

  // 3. Insert approved operating locations / neighbourhoods
  const existingAreasRes = await supabaseFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/professional_service_areas?professional_id=eq.${proProfileId}&select=id`,
    { accessToken: auth.accessToken }
  );
  const hasExistingAreas =
    existingAreasRes.ok && Array.isArray(existingAreasRes.data) && existingAreasRes.data.length > 0;

  if (neighbourhoodIds.length > 0) {
    const nbRes = await supabaseFetch<
      Array<{
        id: string;
        city: string;
        state: string;
        lga: string;
        name: string;
        latitude: number;
        longitude: number;
      }>
    >(
      config,
      `/rest/v1/operating_neighbourhoods?id=in.(${neighbourhoodIds.join(",")})&is_active=eq.true&select=id,city,state,lga,name,latitude,longitude`,
      { accessToken: auth.accessToken }
    );

    const neighbourhoods = nbRes.ok && Array.isArray(nbRes.data) ? nbRes.data : [];
    for (let i = 0; i < neighbourhoods.length; i++) {
      const nb = neighbourhoods[i];
      if (!nb) continue;
      await supabaseFetch(config, "/rest/v1/professional_service_areas", {
        method: "POST",
        accessToken: auth.accessToken,
        headers: { Prefer: "resolution=ignore-duplicates" },
        body: {
          professional_id: proProfileId,
          city: nb.city,
          state: nb.state || resolvePilotCityState(nb.city),
          lga_or_district: nb.lga,
          neighbourhood: nb.name,
          latitude: nb.latitude,
          longitude: nb.longitude,
          service_radius_km: 25,
          is_primary: !hasExistingAreas && i === 0,
          is_active: true,
        },
      });
    }
  } else if (!hasExistingAreas) {
    await supabaseFetch(config, "/rest/v1/professional_service_areas", {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: {
        professional_id: proProfileId,
        city,
        state,
        lga_or_district: lgaOrDistrict || "All Districts",
        service_radius_km: 25,
        is_primary: true,
        is_active: true,
      },
    });
  }

  // 4. Upsert full 7-day weekly availability schedule without creating duplicates
  const selectedDaysSet = new Set(workingDays);
  const availPayload = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    professional_id: proProfileId,
    day_of_week: day,
    start_time: startTime || "08:00",
    end_time: endTime || "18:00",
    is_available: selectedDaysSet.has(day),
  }));

  await supabaseFetch(
    config,
    "/rest/v1/professional_availability?on_conflict=professional_id,day_of_week",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=merge-duplicates" },
      body: availPayload,
    }
  );

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/pro/jobs");
  revalidatePath("/explore-services");

  return {
    status: "success",
    message: "Professional registration completed successfully! Proceed to your profile to upload verification documents.",
    data: { professionalId: proProfileId },
  };
}

/**
 * Update professional core business details (never modifies verification_status).
 */
export async function updateProfessionalProfileAction(input: {
  professionalId: string;
  businessName: string;
  headline?: string;
  bio: string;
  yearsOfExperience: number;
  baseCalloutFeeNaira: number;
  primaryCity: string;
  providerType?: ProviderType;
}): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Please sign in to update your profile." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, input.professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  const businessName = input.businessName.trim();
  const bio = input.bio.trim();
  const years = Math.round(Number(input.yearsOfExperience) || 0);
  const calloutKobo = Math.max(0, Math.round((Number(input.baseCalloutFeeNaira) || 0) * 100));

  if (businessName.length < 3) {
    return { ok: false, message: "Business or trade name must be at least 3 characters." };
  }
  if (bio.length < 20) {
    return { ok: false, message: "Trade bio must be at least 20 characters." };
  }
  if (years < 0 || years > 70) {
    return { ok: false, message: "Years of experience must be between 0 and 70." };
  }
  if (!["Port Harcourt", "Lagos", "Abuja"].includes(input.primaryCity)) {
    return { ok: false, message: "Primary city must be Port Harcourt, Lagos, or Abuja." };
  }

  const patchBody: Record<string, unknown> = {
    business_name: businessName,
    headline: input.headline?.trim() || `${years} Years Experienced ${businessName}`,
    bio,
    years_of_experience: years,
    base_callout_fee_kobo: calloutKobo,
    primary_city: input.primaryCity,
    primary_state: resolvePilotCityState(input.primaryCity),
    updated_at: new Date().toISOString(),
  };

  if (input.providerType && VALID_PROVIDER_TYPES.includes(input.providerType)) {
    patchBody.provider_type = input.providerType;
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_profiles?id=eq.${owner.id}&user_id=eq.${auth.user.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: patchBody,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update professional details." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return { ok: true, message: "Business profile updated successfully." };
}

/**
 * Toggle global job availability status (is_available) on professional profile.
 */
export async function toggleProfessionalGlobalAvailabilityAction(
  professionalId: string,
  isAvailable: boolean
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_profiles?id=eq.${owner.id}&user_id=eq.${auth.user.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        is_available: Boolean(isAvailable),
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not update availability status." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return {
    ok: true,
    message: isAvailable
      ? "You are now marked Available for new booking requests."
      : "You are temporarily marked Unavailable for new bookings.",
  };
}

/**
 * Save weekly working schedule (Sun–Sat) without creating duplicate rows.
 */
export async function saveProfessionalWeeklyAvailabilityAction(input: {
  professionalId: string;
  schedule: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }>;
}): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, input.professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  if (!Array.isArray(input.schedule) || input.schedule.length === 0) {
    return { ok: false, message: "Schedule entries are required." };
  }

  const normalizedRows: Array<Record<string, unknown>> = [];
  for (const row of input.schedule) {
    const day = Number(row.dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return { ok: false, message: "Day of week must be between 0 (Sunday) and 6 (Saturday)." };
    }
    const start = (row.startTime || "08:00").slice(0, 5);
    const end = (row.endTime || "18:00").slice(0, 5);
    if (row.isAvailable && !isValidTimeRange(start, end)) {
      return { ok: false, message: "End time must be later than start time for all active days." };
    }
    normalizedRows.push({
      professional_id: owner.id,
      day_of_week: day,
      start_time: start,
      end_time: end,
      is_available: Boolean(row.isAvailable),
      updated_at: new Date().toISOString(),
    });
  }

  const res = await supabaseFetch(
    config,
    "/rest/v1/professional_availability?on_conflict=professional_id,day_of_week",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: normalizedRows,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not update weekly schedule." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return { ok: true, message: "Weekly working hours saved successfully." };
}

/**
 * Add an approved operating city/neighbourhood coverage area.
 */
export async function addProfessionalServiceAreaAction(input: {
  professionalId: string;
  city: string;
  neighbourhoodId?: string;
  lgaOrDistrict?: string;
  serviceRadiusKm?: number;
  isPrimary?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, input.professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  const radius = Math.min(200, Math.max(1, Math.round(Number(input.serviceRadiusKm) || 25)));
  let city = input.city.trim();
  let state = resolvePilotCityState(city);
  let lga = input.lgaOrDistrict?.trim() || "All Districts";
  let neighbourhood: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (input.neighbourhoodId) {
    const nbRes = await supabaseFetch<
      Array<{
        id: string;
        city: string;
        state: string;
        lga: string;
        name: string;
        latitude: number;
        longitude: number;
      }>
    >(
      config,
      `/rest/v1/operating_neighbourhoods?id=eq.${input.neighbourhoodId}&is_active=eq.true&limit=1&select=id,city,state,lga,name,latitude,longitude`,
      { accessToken: auth.accessToken }
    );

    if (!nbRes.ok || !Array.isArray(nbRes.data) || !nbRes.data[0]) {
      return { ok: false, message: "Selected operating neighbourhood is not active or does not exist." };
    }
    const nb = nbRes.data[0];
    city = nb.city;
    state = nb.state || resolvePilotCityState(nb.city);
    lga = nb.lga;
    neighbourhood = nb.name;
    latitude = nb.latitude;
    longitude = nb.longitude;
  }

  if (!["Port Harcourt", "Lagos", "Abuja"].includes(city)) {
    return { ok: false, message: "EasyLife currently operates in Port Harcourt, Lagos, and Abuja." };
  }

  if (input.isPrimary) {
    await supabaseFetch(
      config,
      `/rest/v1/professional_service_areas?professional_id=eq.${owner.id}`,
      {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: { is_primary: false },
      }
    );
  }

  const insertRes = await supabaseFetch(config, "/rest/v1/professional_service_areas", {
    method: "POST",
    accessToken: auth.accessToken,
    headers: { Prefer: "return=representation" },
    body: {
      professional_id: owner.id,
      city,
      state,
      lga_or_district: lga,
      neighbourhood,
      latitude,
      longitude,
      service_radius_km: radius,
      is_primary: Boolean(input.isPrimary),
      is_active: true,
    },
  });

  if (!insertRes.ok) {
    return { ok: false, message: insertRes.message || "Could not add operating area." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return {
    ok: true,
    message: neighbourhood
      ? `Added coverage area: ${neighbourhood} (${lga}, ${city}).`
      : `Added coverage area: ${lga}, ${city}.`,
  };
}

/**
 * Toggle active state of a professional operating area.
 */
export async function toggleProfessionalServiceAreaAction(
  areaId: string,
  professionalId: string,
  isActive: boolean
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, message: "Authentication required." };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: "Database configuration unavailable." };

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) return { ok: false, message: "Unauthorized profile." };

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_service_areas?id=eq.${areaId}&professional_id=eq.${owner.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: { is_active: Boolean(isActive), updated_at: new Date().toISOString() },
    }
  );

  if (!res.ok) return { ok: false, message: res.message || "Failed to update area status." };

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath("/explore-services");
  return { ok: true, message: isActive ? "Coverage area activated." : "Coverage area paused." };
}

/**
 * Set a coverage area as the primary hub.
 */
export async function setPrimaryServiceAreaAction(
  areaId: string,
  professionalId: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, message: "Authentication required." };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: "Database configuration unavailable." };

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) return { ok: false, message: "Unauthorized profile." };

  await supabaseFetch(
    config,
    `/rest/v1/professional_service_areas?professional_id=eq.${owner.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: { is_primary: false },
    }
  );

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_service_areas?id=eq.${areaId}&professional_id=eq.${owner.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: { is_primary: true, is_active: true, updated_at: new Date().toISOString() },
    }
  );

  if (!res.ok) return { ok: false, message: res.message || "Failed to set primary area." };

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  return { ok: true, message: "Primary operating location updated." };
}

/**
 * Remove a secondary service area while ensuring at least one coverage area remains.
 */
export async function removeProfessionalServiceAreaAction(
  areaId: string,
  professionalId: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, message: "Authentication required." };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: "Database configuration unavailable." };

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) return { ok: false, message: "Unauthorized profile." };

  const existingRes = await supabaseFetch<Array<{ id: string; is_primary: boolean }>>(
    config,
    `/rest/v1/professional_service_areas?professional_id=eq.${owner.id}&select=id,is_primary`,
    { accessToken: auth.accessToken }
  );

  const areas = existingRes.ok && Array.isArray(existingRes.data) ? existingRes.data : [];
  if (areas.length <= 1) {
    return {
      ok: false,
      message: "You must keep at least one active operating coverage area on your profile.",
    };
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_service_areas?id=eq.${areaId}&professional_id=eq.${owner.id}`,
    {
      method: "DELETE",
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) return { ok: false, message: res.message || "Could not remove operating area." };

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath("/explore-services");
  return { ok: true, message: "Operating area removed." };
}

/**
 * Upload & submit verification documents for admin review.
 * Only administrators can approve verification.
 */
export async function uploadVerificationDocumentAction(
  _prevState: ProFormState,
  formData: FormData
): Promise<ProFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { status: "error", message: "Please log in to submit verification documents." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { status: "error", message: "Database configuration is not available." };
  }

  const professionalId = String(formData.get("professionalId") || "").trim();
  const documentType = String(formData.get("documentType") || "") as DocumentType;
  const rawDocumentNumber = String(formData.get("documentNumber") || "").trim();
  const uploadedFile = formData.get("file");
  const hasRealFile =
    typeof File !== "undefined" && uploadedFile instanceof File && uploadedFile.size > 0;

  if (!hasRealFile) {
    return {
      status: "error",
      message: "Please attach a valid verification file (PDF, JPEG, PNG, or WebP) before submitting.",
    };
  }

  const fileName = uploadedFile.name.trim();

  const validDocTypes: DocumentType[] = [
    "national_id_nin",
    "voters_card",
    "drivers_license",
    "international_passport",
    "trade_certificate",
    "cac_certificate",
    "utility_bill",
    "other",
  ];

  if (!validDocTypes.includes(documentType)) {
    return { status: "error", message: "Please select a valid document type." };
  }

  if (!professionalId) {
    return { status: "error", message: "Professional profile ID is required." };
  }

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { status: "error", message: "Unauthorized: Professional profile not found." };
  }

  // Mask document number (store only last 4 digits for privacy)
  const maskedNumber = rawDocumentNumber.length > 4
    ? `•••• •••• ${rawDocumentNumber.slice(-4)}`
    : rawDocumentNumber || null;

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  let storagePath = `${auth.user.id}/${Date.now()}_${sanitizedName}`;
  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  const mimeType = uploadedFile.type || "application/octet-stream";
  const fileSizeBytes = uploadedFile.size;

  const uploadRes = await storageService.uploadFile({
    bucketId: "verification-documents",
    path: storagePath,
    data: buffer,
    mimeType,
    userId: auth.user.id,
  });
  if (!uploadRes.success) {
    return {
      status: "error",
      message: uploadRes.error || "Failed to upload verification document to secure storage.",
    };
  }
  if (uploadRes.path) {
    storagePath = uploadRes.path;
  }

  // 1. Insert record into professional_documents with status 'pending'
  const insertDocRes = await supabaseFetch<Array<{ id: string }>>(
    config,
    "/rest/v1/professional_documents?select=id",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "return=representation" },
      body: {
        professional_id: owner.id,
        document_type: documentType,
        storage_bucket: "verification-documents",
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        document_number_masked: maskedNumber,
        verification_status: "pending",
      },
    }
  );

  if (!insertDocRes.ok) {
    return {
      status: "error",
      message: insertDocRes.message || "Failed to submit document for verification.",
    };
  }

  // 2. Request review by transitioning 'unsubmitted' or 'rejected' -> 'pending'
  //    (Never alter an already 'approved' profile's verification status when adding supplemental trade certs)
  if (owner.verification_status === "unsubmitted" || owner.verification_status === "rejected") {
    await supabaseFetch(
      config,
      `/rest/v1/professional_profiles?id=eq.${owner.id}&user_id=eq.${auth.user.id}`,
      {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: {
          verification_status: "pending",
        },
      }
    );
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/admin/verifications");

  return {
    status: "success",
    message: "Document submitted successfully. Our vetting team will review your credential within 24-48 hours.",
  };
}

/**
 * Allow a provider to remove their own pending or rejected KYC document.
 */
export async function deleteVerificationDocumentAction(
  documentId: string,
  professionalId: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, message: "Authentication required." };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: "Database configuration unavailable." };

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) return { ok: false, message: "Unauthorized profile." };

  const docRes = await supabaseFetch<
    Array<{
      id: string;
      verification_status: string;
      storage_bucket: string;
      storage_path: string;
    }>
  >(
    config,
    `/rest/v1/professional_documents?id=eq.${documentId}&professional_id=eq.${owner.id}&deleted_at=is.null&limit=1&select=id,verification_status,storage_bucket,storage_path`,
    { accessToken: auth.accessToken }
  );

  if (!docRes.ok || !Array.isArray(docRes.data) || !docRes.data[0]) {
    return { ok: false, message: "Document record not found." };
  }

  const doc = docRes.data[0];
  if (doc.verification_status === "approved") {
    return {
      ok: false,
      message: "Verified documents cannot be deleted for audit compliance.",
    };
  }

  const delRes = await supabaseFetch(
    config,
    `/rest/v1/professional_documents?id=eq.${documentId}&professional_id=eq.${owner.id}`,
    {
      method: "DELETE",
      accessToken: auth.accessToken,
    }
  );

  if (!delRes.ok) {
    return { ok: false, message: delRes.message || "Could not remove document." };
  }

  if (doc.storage_path) {
    await storageService.deleteFile(
      (doc.storage_bucket || "verification-documents") as any,
      doc.storage_path
    );
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath("/admin/verifications");

  return { ok: true, message: "Document removed." };
}

/**
 * Submit or re-submit a provider's application for admin review.
 */
export async function resubmitVerificationAction(
  professionalId: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, message: "Authentication required." };

  const config = getSupabasePublicConfig();
  if (!config) return { ok: false, message: "Database configuration unavailable." };

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) return { ok: false, message: "Unauthorized profile." };

  if (owner.verification_status === "approved") {
    return { ok: true, message: "Your professional account is already verified." };
  }
  if (owner.verification_status === "suspended") {
    return {
      ok: false,
      message: "Suspended accounts cannot self-resubmit. Please contact EasyLife Operations.",
    };
  }

  const docsRes = await supabaseFetch<Array<{ id: string; verification_status: string }>>(
    config,
    `/rest/v1/professional_documents?professional_id=eq.${owner.id}&deleted_at=is.null&verification_status=in.(pending,approved)&select=id,verification_status`,
    { accessToken: auth.accessToken }
  );

  const reviewableDocs = docsRes.ok && Array.isArray(docsRes.data) ? docsRes.data : [];
  if (reviewableDocs.length === 0) {
    return {
      ok: false,
      message: "Please upload at least one valid identity or trade document before submitting for review.",
    };
  }

  if (owner.verification_status === "pending") {
    return {
      ok: true,
      message: "Your verification application is currently queued for admin review.",
    };
  }

  const patchRes = await supabaseFetch(
    config,
    `/rest/v1/professional_profiles?id=eq.${owner.id}&user_id=eq.${auth.user.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!patchRes.ok) {
    return { ok: false, message: patchRes.message || "Could not submit verification review." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath("/admin/verifications");

  return {
    ok: true,
    message: "Application submitted for EasyLife verification review.",
  };
}

/**
 * Prepare and submit an itemized quotation for a service request.
 */
export async function createQuotationAction(
  _prevState: ProFormState,
  formData: FormData
): Promise<ProFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { status: "error", message: "Authentication required to submit quotations." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { status: "error", message: "Database configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const professionalId = String(formData.get("professionalId") || "").trim();
  const quotationId = String(formData.get("quotationId") || "").trim() || null;
  const isDraft = formData.get("isDraft") === "true" || formData.get("saveDraft") === "true";
  const workDescription = String(formData.get("workDescription") || "").trim();
  const estimatedDurationMinutes = parseInt(String(formData.get("estimatedDurationMinutes") || "60"), 10);
  const proposedStartAt = String(formData.get("proposedStartAt") || "").trim();
  const validUntilDays = parseInt(String(formData.get("validUntilDays") || "7"), 10);
  const validUntil = new Date(Date.now() + validUntilDays * 24 * 60 * 60 * 1000).toISOString();
  const notes = String(formData.get("notes") || "").trim();
  const itemsJson = String(formData.get("itemsJson") || "[]");

  if (!bookingId || !professionalId) {
    return { status: "error", message: "Booking ID and Professional ID are required." };
  }

  let parsedItems: Array<{
    item_type: "labor" | "material" | "parts" | "callout" | "transport" | "other";
    description: string;
    quantity: number;
    unit_price_naira: number;
    unit_price_kobo?: number;
  }> = [];

  try {
    parsedItems = JSON.parse(itemsJson);
  } catch {
    return { status: "error", message: "Invalid quotation line items format." };
  }

  if (!isDraft && (!Array.isArray(parsedItems) || parsedItems.length === 0)) {
    return { status: "error", message: "Please include at least one itemized quote row (e.g. Labour or Materials)." };
  }

  // Map to payload with kobo units for trusted backend calculation
  const itemsPayload = (parsedItems || []).map((it) => {
    // Map 'parts' to canonical 'material'
    let mappedType = it.item_type as string;
    if (mappedType === "parts") mappedType = "material";

    const unitKobo = it.unit_price_kobo !== undefined
      ? Number(it.unit_price_kobo)
      : Math.round((Number(it.unit_price_naira) || 0) * 100);

    return {
      item_type: mappedType,
      description: it.description || "Service item",
      quantity: Number(it.quantity) || 1,
      unit_price_kobo: unitKobo,
    };
  });

  // Call trusted backend RPC
  const rpcRes = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/submit_or_revise_quotation",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_professional_id: professionalId,
        p_work_description: workDescription || null,
        p_estimated_duration_minutes: isNaN(estimatedDurationMinutes) ? 60 : estimatedDurationMinutes,
        p_valid_until: validUntil,
        p_proposed_start_at: proposedStartAt || null,
        p_notes: notes || null,
        p_is_draft: isDraft,
        p_items: itemsPayload,
        p_quotation_id: quotationId,
      },
    }
  );

  if (!rpcRes.ok) {
    return {
      status: "error",
      message: rpcRes.message || "Failed to process quotation.",
    };
  }

  const result = rpcRes.data;
  if (result && result.success === false) {
    return {
      status: "error",
      message: result.message || "Failed to process quotation.",
    };
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);
  revalidatePath("/pro/quotations");
  revalidatePath(`/bookings/${bookingId}`);

  const actionMsg = isDraft
    ? `Quotation saved as draft (${result?.reference_code || "Draft"}).`
    : `Quotation ${result?.reference_code || ""} submitted successfully to the customer!`;

  return {
    status: "success",
    message: actionMsg,
    data: result,
  };
}

/**
 * Withdraw a pending quotation (Professional action).
 */
export async function withdrawQuotationAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const quotationId = String(formData.get("quotationId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const bookingId = String(formData.get("bookingId") || "").trim();

  if (!quotationId) {
    return { ok: false, message: "Quotation ID is required." };
  }

  const rpcRes = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/withdraw_quotation",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_quotation_id: quotationId,
        p_reason: reason || "Withdrawn by professional",
      },
    }
  );

  if (!rpcRes.ok) {
    return { ok: false, message: rpcRes.message || "Failed to withdraw quotation." };
  }

  const result = rpcRes.data;
  if (result && result.success === false) {
    return { ok: false, message: result.message || "Failed to withdraw quotation." };
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/quotations");
  if (bookingId) {
    revalidatePath(`/pro/jobs/${bookingId}`);
    revalidatePath(`/bookings/${bookingId}`);
  }

  return { ok: true, message: "Quotation withdrawn successfully." };
}

/**
 * Update job execution status (Start Job, Submit Completion Request, or Update Appointment).
 */
export async function updateProJobStatusAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const actionType = String(formData.get("actionType") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const scheduledStartAt = String(formData.get("scheduledStartAt") || "").trim();

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  if (actionType === "start_job") {
    const rpcRes = await supabaseFetch<any>(
      config,
      "/rest/v1/rpc/update_booking_job_execution",
      {
        method: "POST",
        accessToken: auth.accessToken,
        body: {
          p_booking_id: bookingId,
          p_action: "begin_job",
        },
      }
    );

    if (!rpcRes.ok) {
      return { ok: false, message: rpcRes.message || "Failed to start job." };
    }
    const rpcData = rpcRes.data;
    if (rpcData && rpcData.success === false) {
      return { ok: false, message: rpcData.message || "Failed to start job." };
    }
  } else if (actionType === "submit_completion") {
    const rpcRes = await supabaseFetch<any>(
      config,
      "/rest/v1/rpc/update_booking_job_execution",
      {
        method: "POST",
        accessToken: auth.accessToken,
        body: {
          p_booking_id: bookingId,
          p_action: "submit_completion",
          p_completion_notes: notes || "Job completed as specified. Ready for customer sign-off.",
        },
      }
    );

    if (!rpcRes.ok) {
      return { ok: false, message: rpcRes.message || "Failed to submit completion." };
    }
    const rpcData = rpcRes.data;
    if (rpcData && rpcData.success === false) {
      return { ok: false, message: rpcData.message || "Failed to submit completion." };
    }
  } else if (actionType === "update_appointment") {
    if (!scheduledStartAt) {
      return { ok: false, message: "A valid appointment date and time is required." };
    }
    const parsedDate = new Date(scheduledStartAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, message: "Invalid appointment date/time format." };
    }

    const rpcRes = await supabaseFetch<any>(
      config,
      "/rest/v1/rpc/update_booking_appointment_schedule",
      {
        method: "POST",
        accessToken: auth.accessToken,
        body: {
          p_booking_id: bookingId,
          p_scheduled_start: parsedDate.toISOString(),
          p_notes: notes || null,
        },
      }
    );

    if (!rpcRes.ok) {
      return { ok: false, message: rpcRes.message || "Failed to update appointment schedule." };
    }
    const rpcData = rpcRes.data;
    if (rpcData && rpcData.success === false) {
      return { ok: false, message: rpcData.message || "Failed to update appointment schedule." };
    }
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}`);

  return { ok: true, message: "Job status updated successfully." };
}

/**
 * Add an additional distinct service to a professional's catalogue.
 * Supports selecting an individual catalogue service (with qualifications) or a custom trade title.
 */
export async function addProfessionalServiceAction(input: {
  professionalId: string;
  categoryId: string;
  serviceId?: string | null;
  serviceTitle: string;
  minPriceNaira: number;
  maxPriceNaira?: number | null;
  description?: string;
  isPrimary?: boolean;
  qualificationNotes?: string;
  certificationReference?: string;
  yearsExperienceInService?: number | null;
}): Promise<{
  ok: boolean;
  message: string;
  data?: { eligibility?: ProfessionalServiceEligibilityResult | null };
}> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Please sign in to manage your services." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, input.professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  let resolvedCategoryId = input.categoryId;
  let resolvedServiceTitle = input.serviceTitle.trim();
  const resolvedServiceId = input.serviceId?.trim() || null;

  if (resolvedServiceId) {
    const srvRes = await supabaseFetch<
      Array<{ id: string; category_id: string; subcategory_id: string | null; name: string }>
    >(
      config,
      `/rest/v1/services?id=eq.${resolvedServiceId}&is_active=eq.true&deleted_at=is.null&limit=1&select=id,category_id,subcategory_id,name`,
      { accessToken: auth.accessToken }
    );
    if (!srvRes.ok || !Array.isArray(srvRes.data) || !srvRes.data[0]) {
      return { ok: false, message: "Selected catalogue service is unavailable or inactive." };
    }
    const srv = srvRes.data[0];
    resolvedCategoryId = srv.subcategory_id || srv.category_id;
    if (!resolvedServiceTitle) {
      resolvedServiceTitle = srv.name;
    }

    const dupRes = await supabaseFetch<Array<{ id: string }>>(
      config,
      `/rest/v1/professional_services?professional_id=eq.${owner.id}&service_id=eq.${resolvedServiceId}&deleted_at=is.null&limit=1&select=id`,
      { accessToken: auth.accessToken }
    );
    if (dupRes.ok && Array.isArray(dupRes.data) && dupRes.data.length > 0) {
      return { ok: false, message: `You already offer "${resolvedServiceTitle}" in your catalogue.` };
    }
  }

  if (!resolvedServiceTitle || resolvedServiceTitle.length < 3) {
    return { ok: false, message: "Service title must be at least 3 characters." };
  }

  if (!resolvedCategoryId) {
    return { ok: false, message: "Please select a service category." };
  }

  const minKobo = Math.max(0, Math.round((input.minPriceNaira || 0) * 100));
  const maxKobo =
    input.maxPriceNaira && input.maxPriceNaira > 0
      ? Math.round(input.maxPriceNaira * 100)
      : null;

  if (maxKobo !== null && maxKobo < minKobo) {
    return { ok: false, message: "Upper price estimate must be greater than or equal to starting price." };
  }

  const expInService =
    input.yearsExperienceInService !== undefined &&
    input.yearsExperienceInService !== null &&
    !Number.isNaN(Number(input.yearsExperienceInService))
      ? Math.min(70, Math.max(0, Math.round(Number(input.yearsExperienceInService))))
      : null;

  if (input.isPrimary) {
    await supabaseFetch(
      config,
      `/rest/v1/professional_services?professional_id=eq.${owner.id}&deleted_at=is.null`,
      {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: { is_primary_skill: false },
      }
    );
  }

  const res = await supabaseFetch(config, "/rest/v1/professional_services", {
    method: "POST",
    accessToken: auth.accessToken,
    headers: { Prefer: "return=representation" },
    body: {
      professional_id: owner.id,
      category_id: resolvedCategoryId,
      service_id: resolvedServiceId,
      service_title: resolvedServiceTitle,
      min_price_kobo: minKobo,
      max_price_kobo: maxKobo,
      currency_code: "NGN",
      description: input.description?.trim() || null,
      qualification_notes: input.qualificationNotes?.trim() || null,
      certification_reference: input.certificationReference?.trim() || null,
      years_experience_in_service: expInService,
      is_primary_skill: Boolean(input.isPrimary),
      is_active: true,
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not add service." };
  }

  const eligibility = resolvedServiceId
    ? await evaluateServiceEligibility(config, owner.id, resolvedServiceId, auth.accessToken)
    : null;

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return {
    ok: true,
    message:
      eligibility && !eligibility.eligible
        ? `"${resolvedServiceTitle}" added. Review the missing credentials to activate full eligibility.`
        : `"${resolvedServiceTitle}" added to your service offerings.`,
    data: { eligibility },
  };
}

/**
 * Update an existing professional service offering (pricing, qualifications, primary skill, or active state).
 */
export async function updateProfessionalServiceAction(input: {
  offeringId: string;
  professionalId: string;
  serviceId?: string | null;
  serviceTitle?: string;
  minPriceNaira: number;
  maxPriceNaira?: number | null;
  description?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  qualificationNotes?: string;
  certificationReference?: string;
  yearsExperienceInService?: number | null;
}): Promise<{
  ok: boolean;
  message: string;
  data?: { eligibility?: ProfessionalServiceEligibilityResult | null };
}> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Please sign in to manage your services." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, input.professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  const minKobo = Math.max(0, Math.round((input.minPriceNaira || 0) * 100));
  const maxKobo =
    input.maxPriceNaira && input.maxPriceNaira > 0
      ? Math.round(input.maxPriceNaira * 100)
      : null;

  if (maxKobo !== null && maxKobo < minKobo) {
    return { ok: false, message: "Upper price estimate must be greater than or equal to starting price." };
  }

  const expInService =
    input.yearsExperienceInService !== undefined &&
    input.yearsExperienceInService !== null &&
    !Number.isNaN(Number(input.yearsExperienceInService))
      ? Math.min(70, Math.max(0, Math.round(Number(input.yearsExperienceInService))))
      : null;

  if (input.isPrimary) {
    await supabaseFetch(
      config,
      `/rest/v1/professional_services?professional_id=eq.${owner.id}&deleted_at=is.null`,
      {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: { is_primary_skill: false },
      }
    );
  }

  const patchBody: Record<string, unknown> = {
    min_price_kobo: minKobo,
    max_price_kobo: maxKobo,
    description: input.description?.trim() || null,
    qualification_notes: input.qualificationNotes?.trim() || null,
    certification_reference: input.certificationReference?.trim() || null,
    years_experience_in_service: expInService,
    updated_at: new Date().toISOString(),
  };

  if (input.serviceTitle && input.serviceTitle.trim().length >= 3) {
    patchBody.service_title = input.serviceTitle.trim();
  }
  if (typeof input.isPrimary === "boolean") {
    patchBody.is_primary_skill = input.isPrimary;
  }
  if (typeof input.isActive === "boolean") {
    patchBody.is_active = input.isActive;
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_services?id=eq.${input.offeringId}&professional_id=eq.${owner.id}&deleted_at=is.null`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: patchBody,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not update service offering." };
  }

  const eligibility = input.serviceId
    ? await evaluateServiceEligibility(config, owner.id, input.serviceId, auth.accessToken)
    : null;

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return {
    ok: true,
    message: "Service offering and qualifications updated.",
    data: { eligibility },
  };
}

/**
 * Soft-archive a specific service entry from a professional's active catalogue
 * while preserving historical database integrity.
 */
export async function deleteProfessionalServiceAction(
  offeringId: string,
  professionalId: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Please sign in to manage your services." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  const owner = await verifyOwnedProfessional(config, professionalId, auth.user.id, auth.accessToken);
  if (!owner) {
    return { ok: false, message: "Unauthorized: Professional profile not found." };
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_services?id=eq.${offeringId}&professional_id=eq.${owner.id}&deleted_at=is.null`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        is_active: false,
        deleted_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not remove service." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/professionals/${owner.id}`);
  revalidatePath("/explore-services");

  return { ok: true, message: "Service removed from your active catalogue." };
}
