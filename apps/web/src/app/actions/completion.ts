"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface CompletionActionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Professional submits job completion request with completion notes and optional proof photos.
 */
export async function proSubmitCompletionAction(
  formData: FormData
): Promise<CompletionActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to submit job completion." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const photosRaw = formData.getAll("photos");
  const photos: string[] = photosRaw
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/pro_submit_job_completion",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_notes: notes || "Work completed according to agreed quotation.",
        p_photos: photos,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to submit job completion request." };
  }

  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);

  return {
    ok: true,
    message: "Completion request submitted! The customer has been notified for inspection.",
    data: res.data,
  };
}

/**
 * Customer confirms job completion, unlocking escrow release and verified review submission.
 */
export async function customerConfirmCompletionAction(
  bookingId: string
): Promise<CompletionActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to confirm job completion." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  // Call the atomic confirm_booking_completion RPC
  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/confirm_booking_completion",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to confirm job completion." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);

  return {
    ok: true,
    message: "Job completion confirmed! You can now rate and review your specialist.",
    data: res.data,
  };
}

/**
 * Customer reports incomplete work or unaddressed tasks, returning the booking to in_progress with rework notes.
 */
export async function customerReportIncompleteWorkAction(
  formData: FormData
): Promise<CompletionActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to report incomplete work." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const photosRaw = formData.getAll("photos");
  const photos: string[] = photosRaw
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  if (!reason || reason.length < 5) {
    return { ok: false, message: "Please describe what work remains incomplete (minimum 5 characters)." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/customer_report_incomplete_work",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_reason: reason,
        p_photos: photos,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to report incomplete work." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/jobs");
  revalidatePath(`/pro/jobs/${bookingId}`);

  return {
    ok: true,
    message: "Incomplete work reported. The specialist has been notified to return and complete the job.",
    data: res.data,
  };
}
