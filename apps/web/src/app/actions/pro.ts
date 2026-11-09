"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { DocumentType } from "@/lib/supabase/pro";

export interface ProFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  data?: Record<string, unknown>;
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
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  const startTime = String(formData.get("startTime") || "08:00").trim();
  const endTime = String(formData.get("endTime") || "18:00").trim();
  const rawProviderType = String(formData.get("providerType") || "trade_technician").trim();
  const validProviderTypes = ["trade_technician", "dispatch_rider", "property_agent", "general_artisan"];
  const providerType = validProviderTypes.includes(rawProviderType) ? rawProviderType : "trade_technician";
  const agentDisclaimerAccepted = formData.get("agentDisclaimerAccepted") === "true" || formData.get("agentDisclaimerAccepted") === "on";
  const agentServices = formData.getAll("agentServices").map(String).filter(Boolean);
  const vehicleType = String(formData.get("vehicleType") || "Motorcycle").trim();
  const dispatchDetails = providerType === "dispatch_rider" ? { vehicle_type: vehicleType } : {};

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

  if (isNaN(yearsExperience) || yearsExperience < 0) {
    fieldErrors.yearsExperience = "Please enter valid years of experience.";
  }

  if (!["Port Harcourt", "Lagos", "Abuja"].includes(city)) {
    fieldErrors.city = "Please select one of our supported pilot cities.";
  }

  if (categoryIds.length === 0) {
    fieldErrors.categoryIds = "Please select at least one primary service category.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  let state = "Rivers State";
  if (city === "Lagos") state = "Lagos State";
  if (city === "Abuja") state = "Federal Capital Territory";

  // Create slug from business name + random suffix
  const cleanSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const calloutFeeKobo = Math.round(baseCalloutFeeNaira * 100);

  // 1. Check if professional profile already exists
  const existingRes = await supabaseFetch<any[]>(
    config,
    `/rest/v1/professional_profiles?user_id=eq.${auth.user.id}&limit=1&select=id`,
    { accessToken: auth.accessToken }
  );

  let proProfileId: string;

  if (existingRes.ok && Array.isArray(existingRes.data) && existingRes.data.length > 0) {
    // Update existing profile
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
    // Insert new professional profile (defaults to 'unsubmitted' per security trigger)
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

  // 2. Insert service categories
  for (let i = 0; i < categoryIds.length; i++) {
    const catId = categoryIds[i];
    await supabaseFetch(config, "/rest/v1/professional_services", {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: {
        professional_id: proProfileId,
        category_id: catId,
        min_price_kobo: calloutFeeKobo,
        currency_code: "NGN",
        is_primary_skill: i === 0,
        is_active: true,
      },
    });
  }

  // 3. Insert primary service area
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

  // 4. Insert default working hours (Monday to Saturday)
  for (let day = 1; day <= 6; day++) {
    await supabaseFetch(config, "/rest/v1/professional_availability", {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: {
        professional_id: proProfileId,
        day_of_week: day,
        start_time: startTime || "08:00",
        end_time: endTime || "18:00",
        is_available: true,
      },
    });
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/pro/jobs");

  return {
    status: "success",
    message: "Professional registration completed successfully! You can now submit verification documents.",
    data: { professionalId: proProfileId },
  };
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
  const fileName = String(formData.get("fileName") || "document_upload.pdf").trim();

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

  // Mask document number (store only last 4 digits for privacy)
  const maskedNumber = rawDocumentNumber.length > 4
    ? `•••• •••• ${rawDocumentNumber.slice(-4)}`
    : rawDocumentNumber || null;

  const storagePath = `pro_${professionalId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // 1. Insert record into professional_documents with status 'pending'
  const insertDocRes = await supabaseFetch<Array<{ id: string }>>(
    config,
    "/rest/v1/professional_documents?select=id",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: { Prefer: "return=representation" },
      body: {
        professional_id: professionalId,
        document_type: documentType,
        storage_bucket: "verification-documents",
        storage_path: storagePath,
        file_name: fileName,
        mime_type: "application/pdf",
        file_size_bytes: 1024 * 512, // Standard representation
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

  // 2. Request review by updating pro profile verification status to 'pending'
  // (The DB trigger specifically permits 'unsubmitted' -> 'pending' or 'rejected' -> 'pending')
  await supabaseFetch(
    config,
    `/rest/v1/professional_profiles?id=eq.${professionalId}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        verification_status: "pending",
      },
    }
  );

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");

  return {
    status: "success",
    message: "Document submitted successfully. Our vetting team will review your application within 24-48 hours.",
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
    if (scheduledStartAt) {
      const payload = {
        scheduled_start_at: scheduledStartAt,
        updated_at: new Date().toISOString(),
      };
      const res = await supabaseFetch(
        config,
        `/rest/v1/bookings?id=eq.${bookingId}`,
        {
          method: "PATCH",
          accessToken: auth.accessToken,
          body: payload,
        }
      );
      if (!res.ok) {
        return { ok: false, message: res.message || "Failed to update appointment schedule." };
      }
    }
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);

  return { ok: true, message: "Job status updated successfully." };
}

/**
 * Add an additional distinct service to a professional's catalogue.
 * Supports multiple services within the same category or across different categories.
 */
export async function addProfessionalServiceAction(input: {
  professionalId: string;
  categoryId: string;
  serviceTitle: string;
  minPriceNaira: number;
  maxPriceNaira?: number | null;
  description?: string;
  isPrimary?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Please sign in to manage your services." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration unavailable." };
  }

  if (!input.serviceTitle.trim() || input.serviceTitle.trim().length < 3) {
    return { ok: false, message: "Service title must be at least 3 characters." };
  }

  if (!input.categoryId) {
    return { ok: false, message: "Please select a service category." };
  }

  const minKobo = Math.max(0, Math.round((input.minPriceNaira || 0) * 100));
  const maxKobo =
    input.maxPriceNaira && input.maxPriceNaira > 0
      ? Math.round(input.maxPriceNaira * 100)
      : null;

  const res = await supabaseFetch(config, "/rest/v1/professional_services", {
    method: "POST",
    accessToken: auth.accessToken,
    headers: { Prefer: "return=representation" },
    body: {
      professional_id: input.professionalId,
      category_id: input.categoryId,
      service_title: input.serviceTitle.trim(),
      min_price_kobo: minKobo,
      max_price_kobo: maxKobo,
      currency_code: "NGN",
      description: input.description?.trim() || null,
      is_primary_skill: Boolean(input.isPrimary),
      is_active: true,
    },
  });

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not add service." };
  }

  revalidatePath("/pro/profile");
  revalidatePath(`/professionals/${input.professionalId}`);
  revalidatePath("/explore-services");

  return { ok: true, message: "Service added to your catalogue." };
}

/**
 * Remove a specific service entry from a professional's catalogue.
 */
export async function deleteProfessionalServiceAction(
  serviceId: string,
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

  const res = await supabaseFetch(
    config,
    `/rest/v1/professional_services?id=eq.${serviceId}&professional_id=eq.${professionalId}`,
    {
      method: "DELETE",
      accessToken: auth.accessToken,
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Could not delete service." };
  }

  revalidatePath("/pro/profile");
  revalidatePath(`/professionals/${professionalId}`);
  revalidatePath("/explore-services");

  return { ok: true, message: "Service removed." };
}
