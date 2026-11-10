"use server";

import {
  getIntelligentMaintenanceReminders,
  completeMaintenanceSchedule,
  MaintenanceRemindersSummary,
} from "@/lib/maintenance/maintenance-engine";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

async function canAccessBusiness(businessId: string): Promise<boolean> {
  const auth = await getAuthenticatedUser();
  if (!auth?.user) return false;
  const adminCheck = await verifyAdminSession();
  if (adminCheck.ok) return true;
  const config = getSupabasePublicConfig();
  if (!config) return false;
  const res = await supabaseFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/businesses?select=id&id=eq.${encodeURIComponent(businessId)}&limit=1`,
    { accessToken: auth.accessToken }
  );
  return res.ok && Array.isArray(res.data) && res.data.length > 0;
}

async function canAccessSchedule(scheduleId: string): Promise<boolean> {
  const auth = await getAuthenticatedUser();
  if (!auth?.user) return false;
  const adminCheck = await verifyAdminSession();
  if (adminCheck.ok) return true;
  const config = getSupabasePublicConfig();
  if (!config) return false;
  const res = await supabaseFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/maintenance_schedules?select=id&id=eq.${encodeURIComponent(scheduleId)}&limit=1`,
    { accessToken: auth.accessToken }
  );
  return res.ok && Array.isArray(res.data) && res.data.length > 0;
}

export async function fetchIntelligentMaintenanceRemindersAction(
  businessId: string
): Promise<{ success: boolean; data?: MaintenanceRemindersSummary; error?: string }> {
  try {
    if (!businessId) {
      return { success: false, error: "Business ID is required." };
    }

    if (!(await canAccessBusiness(businessId))) {
      return { success: false, error: "Unauthorized: Business access required." };
    }

    const summary = await getIntelligentMaintenanceReminders(businessId);
    return { success: true, data: summary };
  } catch (err: any) {
    console.error("fetchIntelligentMaintenanceRemindersAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function completeMaintenanceScheduleAction(
  scheduleId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!scheduleId) {
      return { success: false, error: "Schedule ID is required." };
    }

    if (!(await canAccessSchedule(scheduleId))) {
      return { success: false, error: "Unauthorized: Maintenance schedule access denied." };
    }

    const data = await completeMaintenanceSchedule(scheduleId);
    return { success: true, data };
  } catch (err: any) {
    console.error("completeMaintenanceScheduleAction error:", err);
    return { success: false, error: err.message };
  }
}
