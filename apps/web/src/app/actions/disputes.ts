"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { DisputeStatus, DisputeCategory, DisputeResolutionType } from "@easylife/shared-types";

export interface DisputeActionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Customer (or authorized booking participant) files a formal dispute.
 * Categories:
 * - incomplete_work ("Incomplete work")
 * - poor_workmanship ("Poor workmanship")
 * - unapproved_charges ("Unapproved additional charges")
 * - missed_appointment ("Missed appointment")
 * - other ("Other service-related problems")
 *
 * Transitions the booking to 'disputed'. Disputed bookings cannot complete automatically.
 */
export async function submitDisputeAction(
  formData: FormData
): Promise<DisputeActionResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required to file a dispute." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const bookingId = String(formData.get("bookingId") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const disputedAmountNaira = parseFloat(String(formData.get("disputedAmountNaira") || "0"));
  const evidenceJson = String(formData.get("evidenceJson") || "[]");

  if (!bookingId) {
    return { ok: false, message: "Booking ID is required." };
  }

  if (!category) {
    return { ok: false, message: "Please select a dispute category." };
  }

  if (!description || description.length < 10) {
    return { ok: false, message: "Please provide a detailed dispute description (minimum 10 characters)." };
  }

  let evidenceList: any[] = [];
  try {
    evidenceList = JSON.parse(evidenceJson);
  } catch {
    evidenceList = [];
  }

  const disputedAmountKobo = Math.round((disputedAmountNaira || 0) * 100);

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/submit_booking_dispute",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
        p_category: category,
        p_description: description,
        p_disputed_amount_kobo: disputedAmountKobo,
        p_evidence: evidenceList,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to submit dispute." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/admin/disputes");

  return {
    ok: true,
    message: "Dispute opened successfully. An EasyLife administrator has been assigned to investigate.",
    data: res.data,
  };
}

/**
 * Administrator updates a dispute case status, internal notes, assigned admin, and resolution.
 * Statuses:
 * - open
 * - under_review
 * - awaiting_information
 * - resolved
 * - rejected
 * - closed
 */
export async function adminUpdateDisputeAction(
  formData: FormData
): Promise<DisputeActionResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  const disputeId = String(formData.get("disputeId") || "").trim();
  const status = String(formData.get("status") || "").trim() as DisputeStatus;
  const assignedAdminId = String(formData.get("assignedAdminId") || "").trim() || null;
  const internalNote = String(formData.get("internalNote") || "").trim() || null;
  const resolutionType = String(formData.get("resolutionType") || "").trim() || null;
  const resolutionSummary = String(formData.get("resolutionSummary") || "").trim() || null;
  const refundAmountNaira = parseFloat(String(formData.get("refundAmountNaira") || "0"));

  if (!disputeId) {
    return { ok: false, message: "Dispute ID is required." };
  }

  if (!status) {
    return { ok: false, message: "Case status is required." };
  }

  const refundAmountKobo = Math.round((refundAmountNaira || 0) * 100);

  const res = await supabaseFetch<any>(
    config,
    "/rest/v1/rpc/admin_update_dispute",
    {
      method: "POST",
      accessToken: adminCheck.accessToken,
      body: {
        p_dispute_id: disputeId,
        p_status: status,
        p_assigned_admin_id: assignedAdminId,
        p_internal_note: internalNote,
        p_resolution_type: resolutionType,
        p_resolution_summary: resolutionSummary,
        p_refund_amount_kobo: refundAmountKobo,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update dispute." };
  }

  revalidatePath("/admin/disputes");
  revalidatePath(`/admin/disputes/${disputeId}`);

  return {
    ok: true,
    message: "Dispute case successfully updated.",
    data: res.data,
  };
}

/**
 * Administrator adds an internal investigation note to a dispute.
 */
export async function adminAddDisputeNoteAction(
  disputeId: string,
  note: string
): Promise<DisputeActionResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return { ok: false, message: "Unauthorized: Administrator privileges required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Database configuration missing." };
  }

  if (!disputeId || !note.trim()) {
    return { ok: false, message: "Dispute ID and note text are required." };
  }

  const res = await supabaseFetch(
    config,
    "/rest/v1/dispute_internal_notes",
    {
      method: "POST",
      accessToken: adminCheck.accessToken,
      body: {
        dispute_id: disputeId,
        admin_user_id: adminCheck.user.id,
        note: note.trim(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to add internal note." };
  }

  revalidatePath(`/admin/disputes/${disputeId}`);

  return {
    ok: true,
    message: "Internal investigation note recorded.",
  };
}
