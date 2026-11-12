"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface ReviewActionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Customer submits a verified review for a completed service.
 * Enforces:
 * - Must be completed booking.
 * - Must be the customer of the booking.
 * - No duplicate review per booking.
 * - Professionals cannot review their own jobs.
 */
export async function submitReviewAction(
  formData: FormData
): Promise<ReviewActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to submit a review." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const ratingStr = String(formData.get("rating") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const comment = String(formData.get("comment") || "").trim();
  const photosRaw = formData.getAll("photos");
  const photos: string[] = photosRaw
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);

  const rating = parseInt(ratingStr, 10);

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Rating must be between 1 and 5 stars." };
  }

  if (!comment || comment.length < 5) {
    return { ok: false, message: "Please provide constructive feedback (minimum 5 characters)." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/submit_booking_review",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_rating: rating,
        p_title: title || null,
        p_comment: comment,
        p_photos: photos,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to submit review." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/pro/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/explore-services");

  return {
    ok: true,
    message: "Thank you! Your verified review has been published.",
    data: res.data,
  };
}

/**
 * Professional replies to a customer review.
 */
export async function replyToReviewAction(
  formData: FormData
): Promise<ReviewActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to reply to reviews." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const reviewId = String(formData.get("reviewId") || "").trim();
  const response = String(formData.get("response") || "").trim();

  if (!reviewId) {
    return { ok: false, message: "Review ID is required." };
  }

  if (!response || response.length < 5) {
    return { ok: false, message: "Please provide a constructive response (minimum 5 characters)." };
  }

  // Update review with professional response
  const patchRes = await supabaseFetch(
    config,
    `/rest/v1/reviews?id=eq.${reviewId}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        professional_response: response,
        responded_at: new Date().toISOString(),
      },
    }
  );

  if (!patchRes.ok) {
    return { ok: false, message: patchRes.message || "Failed to submit professional response." };
  }

  revalidatePath("/pro/profile");
  revalidatePath("/pro/jobs");

  return {
    ok: true,
    message: "Your response to the customer review has been posted.",
  };
}

/**
 * Administrator moderates a review (approve, flag, or reject).
 */
export async function adminModerateReviewAction(
  formData: FormData
): Promise<ReviewActionResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const reviewId = String(formData.get("reviewId") || "").trim();
  const action = String(formData.get("action") || "").trim(); // 'approve' | 'flag' | 'reject'
  const notes = String(formData.get("notes") || "").trim();

  if (!reviewId || !action) {
    return { ok: false, message: "Review ID and action are required." };
  }

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/admin_moderate_review",
    {
      method: "POST",
      accessToken: adminCheck.accessToken,
      body: {
        p_review_id: reviewId,
        p_action: action,
        p_moderation_notes: notes || null,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to moderate review." };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/explore-services");

  return {
    ok: true,
    message: `Review moderation action '${action}' applied successfully.`,
    data: res.data,
  };
}
