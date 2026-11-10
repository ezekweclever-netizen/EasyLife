"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export interface AccountDeletionState {
  status: "idle" | "success" | "error";
  message: string;
  requestId?: string;
}

/**
 * Submit an official account deletion / data erasure request under the NDPA 2023.
 */
export async function submitAccountDeletionAction(
  _prevState: AccountDeletionState,
  formData: FormData
): Promise<AccountDeletionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "You must be signed in to submit an account deletion request.",
    };
  }

  const reason = String(formData.get("reason") || "").trim();
  if (!reason || reason.length < 5) {
    return {
      status: "error",
      message: "Please state a meaningful reason for your account deletion request (minimum 5 characters).",
    };
  }

  try {
    const uid = encodeURIComponent(auth.user.id);

    // Check if THIS user has an active dispute under review before queueing erasure
    const disputeRes = await supabaseAdminFetch<Array<{ id: string }>>(
      `/rest/v1/disputes?or=(opened_by_user_id.eq.${uid},against_user_id.eq.${uid})&status=in.(open,under_review,awaiting_information)&limit=1&select=id`
    );
    if (disputeRes.ok && Array.isArray(disputeRes.data) && disputeRes.data.length > 0) {
      return {
        status: "error",
        message:
          "You currently have an active dispute under review. Please allow dispute arbitration to conclude before requesting account erasure.",
      };
    }

    const profileRes = await supabaseAdminFetch<Array<{ primary_role?: string }>>(
      `/rest/v1/profiles?id=eq.${uid}&limit=1&select=primary_role`
    );
    const actorRole =
      profileRes.ok && profileRes.data?.[0]?.primary_role
        ? profileRes.data[0].primary_role
        : "customer";

    // Record the deletion request
    const insertRes = await supabaseAdminFetch<Array<{ id: string }>>(
      "/rest/v1/account_deletion_requests",
      {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: {
          user_id: auth.user.id,
          reason,
          status: "pending",
          requested_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (!insertRes.ok || !insertRes.data?.[0]) {
      const errMsg = !insertRes.ok ? insertRes.message : "Failed to record request.";
      return {
        status: "error",
        message: errMsg || "Failed to submit account deletion request. Please contact privacy@easylife.ng.",
      };
    }

    const requestId = insertRes.data[0].id;

    // Log the statutory privacy event
    await supabaseAdminFetch("/rest/v1/audit_logs", {
      method: "POST",
      body: {
        actor_user_id: auth.user.id,
        actor_role: actorRole,
        action: "privacy.account_deletion_requested",
        entity_type: "account_deletion_request",
        entity_id: requestId,
        new_values: {
          request_id: requestId,
          reason,
          statutory_law: "NDPA_2023_SEC_34",
          requested_at: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/profile");

    return {
      status: "success",
      message:
        "Your account deletion request has been registered under the Nigeria Data Protection Act 2023. Our Data Protection Officer will review and fulfill the request within statutory timeframes.",
      requestId,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "An unexpected error occurred while processing your request.",
    };
  }
}
