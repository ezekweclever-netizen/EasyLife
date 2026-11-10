"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export async function setBusinessVerificationStatusAction(
  businessId: string,
  status: "approved" | "rejected" | "suspended" | "pending"
) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const res = await supabaseAdminFetch(
      `/rest/v1/businesses?id=eq.${businessId}`,
      {
        method: "PATCH",
        body: {
          verification_status: status,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (!res.ok) return { success: false, error: res.message };

    revalidatePath("/admin/directories");
    revalidatePath("/businesses");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update business status";
    return { success: false, error: message };
  }
}

export async function setHealthcareFacilityStatusAction(
  facilityId: string,
  isActive: boolean,
  status?: "approved" | "suspended"
) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const payload: Record<string, unknown> = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    if (status) payload.verification_status = status;

    const res = await supabaseAdminFetch(
      `/rest/v1/healthcare_facilities?id=eq.${facilityId}`,
      {
        method: "PATCH",
        body: payload,
      }
    );

    if (!res.ok) return { success: false, error: res.message };

    revalidatePath("/admin/directories");
    revalidatePath("/healthcare");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update healthcare facility status";
    return { success: false, error: message };
  }
}

export async function resolveReportAction(
  reportId: string,
  status: "resolved" | "dismissed",
  adminNotes?: string
) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const res = await supabaseAdminFetch(
      `/rest/v1/directory_reports?id=eq.${reportId}`,
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
    const message = err instanceof Error ? err.message : "Failed to resolve report";
    return { success: false, error: message };
  }
}
