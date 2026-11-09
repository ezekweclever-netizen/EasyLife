"use server";

import {
  getIntelligentMaintenanceReminders,
  completeMaintenanceSchedule,
  MaintenanceRemindersSummary,
} from "@/lib/maintenance/maintenance-engine";

export async function fetchIntelligentMaintenanceRemindersAction(
  businessId: string
): Promise<{ success: boolean; data?: MaintenanceRemindersSummary; error?: string }> {
  try {
    if (!businessId) {
      return { success: false, error: "Business ID is required." };
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

    const data = await completeMaintenanceSchedule(scheduleId);
    return { success: true, data };
  } catch (err: any) {
    console.error("completeMaintenanceScheduleAction error:", err);
    return { success: false, error: err.message };
  }
}
