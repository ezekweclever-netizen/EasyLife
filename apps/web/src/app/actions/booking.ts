"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface BookingFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  bookingId?: string;
  referenceCode?: string;
}

/**
 * Submit a new service request (Customer workflow step 6 & 7)
 * Enforces field validations, duplicate submission prevention, and records initial status.
 */
export async function createBookingAction(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "Please log in to your EasyLife customer account before submitting a service request.",
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Supabase configuration is missing. Unable to submit booking request.",
    };
  }

  const categoryId = String(formData.get("categoryId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const lgaOrDistrict = String(formData.get("lgaOrDistrict") || "").trim();
  const serviceAddress = String(formData.get("serviceAddress") || "").trim();
  const preferredDate = String(formData.get("preferredDate") || "").trim();
  const preferredTimeSlot = String(formData.get("preferredTimeSlot") || "").trim();
  const urgency = String(formData.get("urgency") || "normal").trim();
  const additionalInstructions = String(formData.get("additionalInstructions") || "").trim();
  const professionalId = String(formData.get("professionalId") || "").trim();

  // Field Validations
  const fieldErrors: Record<string, string> = {};

  if (!categoryId) {
    fieldErrors.categoryId = "Please select a service category.";
  }

  if (!title || title.length < 5) {
    fieldErrors.title = "Brief summary must be at least 5 characters.";
  }

  if (!description || description.length < 15) {
    fieldErrors.description = "Please provide at least 15 characters describing the problem or repair needed.";
  }

  if (!serviceAddress || serviceAddress.length < 5) {
    fieldErrors.serviceAddress = "Please enter the physical property or street address.";
  }

  if (!["Port Harcourt", "Lagos", "Abuja"].includes(city)) {
    fieldErrors.city = "Please select one of our supported pilot cities (Port Harcourt, Lagos, Abuja).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  // Duplicate Submission Prevention: Check if identical request was created within the last 3 minutes
  try {
    const dupCheckRes = await supabaseFetch<Array<{ is_duplicate: boolean; existing_booking_id: string; existing_reference_code: string }>>(
      config,
      "/rest/v1/rpc/check_duplicate_booking",
      {
        method: "POST",
        accessToken: auth.accessToken,
        body: {
          p_customer_id: auth.user.id,
          p_category_id: categoryId,
          p_service_address: serviceAddress,
          p_title: title,
          p_window_seconds: 180,
        },
      }
    );

    if (dupCheckRes.ok && Array.isArray(dupCheckRes.data) && dupCheckRes.data[0]?.is_duplicate) {
      const existing = dupCheckRes.data[0];
      return {
        status: "success",
        message: "An identical service request was already submitted recently.",
        bookingId: existing.existing_booking_id,
        referenceCode: existing.existing_reference_code,
      };
    }
  } catch (err) {
    console.warn("Duplicate check query bypassed:", err);
  }

  // Derive state based on Nigerian pilot city
  let state = "Rivers State";
  if (city === "Lagos") state = "Lagos State";
  if (city === "Abuja") state = "Federal Capital Territory";

  // Combine instructions into description if present
  const fullDescription = additionalInstructions
    ? `${description}\n\n[Additional Access & Site Instructions]: ${additionalInstructions}`
    : description;

  const payload: Record<string, unknown> = {
    customer_id: auth.user.id,
    category_id: categoryId,
    title,
    description: fullDescription,
    city,
    state,
    lga_or_district: lgaOrDistrict || null,
    service_address: serviceAddress,
    urgency: ["emergency", "high", "normal", "scheduled"].includes(urgency) ? urgency : "normal",
    status: "submitted",
    preferred_date: preferredDate || null,
    preferred_time_slot: preferredTimeSlot || null,
    currency_code: "NGN",
  };

  if (professionalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professionalId)) {
    payload.professional_id = professionalId;
  }

  // Call Supabase PostgREST with user's access token to enforce RLS
  const res = await supabaseFetch<Array<{ id: string; reference_code: string }>>(
    config,
    "/rest/v1/bookings?select=id,reference_code",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: {
        Prefer: "return=representation",
      },
      body: payload,
    }
  );

  if (!res.ok) {
    return {
      status: "error",
      message: res.message || "Failed to submit booking to database. Please check your network and try again.",
    };
  }

  if (!Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
    return {
      status: "error",
      message: "No confirmation received from database. Please check your bookings history.",
    };
  }

  const created = res.data[0];

  revalidatePath("/dashboard");
  revalidatePath("/bookings");

  return {
    status: "success",
    message: "Service request submitted successfully!",
    bookingId: created.id,
    referenceCode: created.reference_code,
  };
}

/**
 * Customer Workflow Step 10: Review & Accept a Quotation
 * Atomically accepts quotation, declines other quotes, assigns professional,
 * creates appointment, and advances booking to 'confirmed' (or 'accepted').
 */
export async function acceptQuotationAction(
  bookingId: string,
  quotationId: string,
  scheduledStart?: string,
  scheduledEnd?: string
): Promise<{ ok: boolean; message: string; data?: Record<string, unknown> }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to accept quotations." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/accept_booking_quotation",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_quotation_id: quotationId,
        p_scheduled_start: scheduledStart || null,
        p_scheduled_end: scheduledEnd || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to accept quotation." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Failed to accept quotation." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/jobs");
  revalidatePath("/pro/quotations");

  return {
    ok: true,
    message: "Quotation accepted and appointment confirmed!",
    data: rpcResult,
  };
}

/**
 * Customer Workflow Step 9: Decline a Quotation with optional reason.
 */
export async function declineQuotationAction(
  bookingId: string,
  quotationId: string,
  declineReason?: string
): Promise<{ ok: boolean; message: string; data?: Record<string, unknown> }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to decline quotations." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/decline_booking_quotation",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_quotation_id: quotationId,
        p_decline_reason: declineReason || "Declined by customer",
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to decline quotation." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Failed to decline quotation." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/quotations");

  return {
    ok: true,
    message: "Quotation has been declined.",
    data: rpcResult,
  };
}

/**
 * Customer Workflow Step 9: Request clarification on a quotation.
 */
export async function requestQuotationClarificationAction(
  bookingId: string,
  quotationId: string,
  notes: string
): Promise<{ ok: boolean; message: string; data?: Record<string, unknown> }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  if (!notes || notes.trim().length < 5) {
    return { ok: false, message: "Please provide a clear question or clarification note (at least 5 characters)." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/request_quotation_clarification",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_quotation_id: quotationId,
        p_notes: notes.trim(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to submit clarification request." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Failed to submit clarification request." };
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/quotations");

  return {
    ok: true,
    message: "Clarification request submitted to the professional.",
    data: rpcResult,
  };
}

/**
 * Customer / Professional Workflow Step 11 / 6: Confirm or Reschedule an Appointment
 * Validates quotation acceptance requirement and prevents conflicting appointments.
 */
export async function confirmAppointmentAction(
  bookingId: string,
  scheduledStart: string,
  scheduledEnd: string,
  notes?: string
): Promise<{ ok: boolean; message: string; data?: Record<string, unknown> }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to confirm appointment." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/confirm_booking_appointment",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_scheduled_start: scheduledStart,
        p_scheduled_end: scheduledEnd,
        p_notes: notes || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to confirm appointment." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Failed to confirm appointment." };
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/pro/jobs/${bookingId}`);

  return {
    ok: true,
    message: "Appointment details confirmed successfully!",
    data: rpcResult,
  };
}

/**
 * Cancel a booking adhering to platform cancellation policies and recording historical reasons.
 */
export async function cancelBookingAction(
  bookingId: string,
  reason: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to cancel a booking." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Configuration missing." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/cancel_booking_with_policy",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_reason: reason || "Cancelled by user",
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to cancel booking." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Cancellation not permitted by platform policy." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/jobs");

  return { ok: true, message: "Booking cancelled in accordance with platform policy." };
}

/**
 * Professional Workflow Step 7 & 8: Begin Job and Submit Completion Request
 * Secure server-side transition with database transaction and status history logging.
 */
export async function updateBookingJobExecutionAction(
  bookingId: string,
  action: "begin_job" | "submit_completion",
  completionNotes?: string
): Promise<{ ok: boolean; message: string; data?: Record<string, unknown> }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Configuration missing." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/update_booking_job_execution",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_action: action,
        p_completion_notes: completionNotes || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update job execution status." };
  }

  const rpcResult = res.data;
  if (rpcResult && rpcResult.success === false) {
    return { ok: false, message: rpcResult.message || "Failed to update job status." };
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}`);

  return { ok: true, message: "Job execution status updated successfully.", data: rpcResult };
}

