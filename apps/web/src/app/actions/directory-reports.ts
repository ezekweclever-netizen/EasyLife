"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getAuthenticatedUser } from "@/lib/auth/session";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateReportInput {
  entityType: "professional" | "business" | "healthcare_facility" | "general_listing";
  entityId: string;
  entityName: string;
  reason: "misrepresentation" | "suspicious_activity" | "unlicensed_practice" | "property_advertising_violation" | "inaccurate_contact_info" | "other";
  details: string;
  reporterId?: string;
}

export async function submitDirectoryReportAction(input: CreateReportInput) {
  try {
    if (!input.entityId || !input.details || input.details.trim().length < 10) {
      return { success: false, error: "Please provide a detailed reason (at least 10 characters)." };
    }

    const auth = await getAuthenticatedUser();
    const verifiedReporterId = auth?.user.id || null;

    const res = await supabaseAdminFetch<Array<{ id: string }>>(
      "/rest/v1/directory_reports",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: {
          reporter_id: verifiedReporterId,
          entity_type: input.entityType,
          entity_id: input.entityId,
          entity_name: input.entityName,
          reason: input.reason,
          details: input.details.trim(),
          status: "pending",
        },
      }
    );

    if (!res.ok) {
      console.error("submitDirectoryReportAction error:", res.message);
      return { success: false, error: res.message };
    }

    const reportId = Array.isArray(res.data) && res.data[0]?.id ? res.data[0].id : undefined;
    revalidatePath("/admin/directories");
    return { success: true, reportId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit report";
    return { success: false, error: message };
  }
}

export async function resolveDirectoryReportAction(reportId: string, status: "resolved" | "dismissed", adminNotes?: string) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession.ok) {
      return { success: false, error: "Administrator authentication is required." };
    }

    if (!UUID_REGEX.test(reportId)) {
      return { success: false, error: "Invalid directory report ID." };
    }

    const res = await supabaseAdminFetch(
      `/rest/v1/directory_reports?id=eq.${encodeURIComponent(reportId)}`,
      {
        method: "PATCH",
        body: {
          status,
          admin_notes: adminNotes || null,
          resolved_at: new Date().toISOString(),
        },
      }
    );

    if (!res.ok) return { success: false, error: res.message };

    revalidatePath("/admin/directories");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve directory report";
    return { success: false, error: message };
  }
}
