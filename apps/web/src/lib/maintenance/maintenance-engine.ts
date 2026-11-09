/**
 * EasyLife Intelligent Maintenance Reminders Engine
 * 
 * Uses recorded equipment information (brand, model, serial, category) and
 * manually configured maintenance intervals (e.g. 30, 90, 180 days) to generate
 * deterministic, timely service reminders.
 * 
 * STRICT COMPLIANCE:
 * - Does not claim to predict equipment failures.
 * - Categorizes reminders into:
 *   - Overdue maintenance
 *   - Upcoming maintenance
 *   - Completed maintenance
 * - Includes explicit non-predictive disclaimers on all outputs.
 */

import { supabaseAdminFetch } from "@/lib/supabase/admin";

export interface IntelligentMaintenanceReminder {
  schedule_id: string;
  title: string;
  description: string | null;
  frequency: string;
  interval_days: number;
  next_due_date: string;
  last_completed_at: string | null;
  status: "overdue" | "due_today" | "upcoming" | "completed" | "scheduled";
  days_remaining: number;
  property_id: string;
  property_name: string;
  property_address: string;
  asset_id: string | null;
  asset_name: string | null;
  asset_category: string | null;
  asset_brand: string | null;
  asset_model: string | null;
  category_name: string;
  category_slug: string;
  reminder_basis: string;
  non_predictive_disclaimer: string;
  recommended_action: string;
}

export interface MaintenanceRemindersSummary {
  business_id: string;
  total_assets_tracked: number;
  total_schedules: number;
  overdue_count: number;
  due_today_count: number;
  upcoming_count: number;
  completed_count: number;
  reminders: IntelligentMaintenanceReminder[];
  disclaimer: string;
}

export const NON_PREDICTIVE_MAINTENANCE_DISCLAIMER =
  "Non-predictive maintenance schedule generated strictly from recorded equipment parameters and your manually configured maintenance interval. EasyLife does not claim to predict mechanical breakdown or component failures.";

/**
 * Fetch Intelligent Maintenance Reminders for a Business
 */
export async function getIntelligentMaintenanceReminders(
  businessId: string
): Promise<MaintenanceRemindersSummary> {
  // 1. Try PostgreSQL RPC first
  try {
    const rpcRes = await supabaseAdminFetch<any[]>(
      "/rest/v1/rpc/get_intelligent_maintenance_reminders",
      {
        method: "POST",
        body: { p_business_id: businessId },
      }
    );

    if (rpcRes.ok && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
      return formatRemindersSummary(businessId, rpcRes.data);
    }
  } catch (err) {
    console.warn("RPC get_intelligent_maintenance_reminders failed, using query fallback:", err);
  }

  // 2. Fallback direct PostgREST query
  const queryRes = await supabaseAdminFetch<any[]>(
    `/rest/v1/maintenance_schedules?select=id,title,description,frequency,interval_days,next_due_date,last_completed_at,is_active,property_id,asset_id,properties:property_id(id,name,address),assets:asset_id(id,name,asset_category,brand,model_number),service_categories:category_id(id,name,slug)&business_id=eq.${encodeURIComponent(
      businessId
    )}&deleted_at=is.null&order=next_due_date.asc`
  );

  const data = queryRes.ok && Array.isArray(queryRes.data) ? queryRes.data : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formattedReminders: IntelligentMaintenanceReminder[] = data.map((row: any) => {
    const dueDate = new Date(row.next_due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: IntelligentMaintenanceReminder["status"] = "scheduled";
    if (!row.is_active || row.last_completed_at) {
      status = "completed";
    } else if (daysRemaining < 0) {
      status = "overdue";
    } else if (daysRemaining === 0) {
      status = "due_today";
    } else if (daysRemaining <= 14) {
      status = "upcoming";
    }

    const prop = row.properties || { id: row.property_id, name: "Primary Facility", address: "Nigeria" };
    const asset = row.assets || {};
    const cat = row.service_categories || { name: "General Maintenance", slug: "everyday-tasks" };

    return {
      schedule_id: row.id,
      title: row.title,
      description: row.description,
      frequency: row.frequency,
      interval_days: row.interval_days || 30,
      next_due_date: row.next_due_date,
      last_completed_at: row.last_completed_at,
      status,
      days_remaining: daysRemaining,
      property_id: prop.id,
      property_name: prop.name,
      property_address: prop.address,
      asset_id: asset.id || null,
      asset_name: asset.name || null,
      asset_category: asset.asset_category || null,
      asset_brand: asset.brand || null,
      asset_model: asset.model_number || null,
      category_name: cat.name,
      category_slug: cat.slug,
      reminder_basis: `Configured interval: Every ${row.interval_days || 30} days (Manual schedule)`,
      non_predictive_disclaimer: NON_PREDICTIVE_MAINTENANCE_DISCLAIMER,
      recommended_action: `Request service quotation from accredited ${cat.name} professional`,
    };
  });

  return formatRemindersSummary(businessId, formattedReminders);
}

function formatRemindersSummary(
  businessId: string,
  reminders: any[]
): MaintenanceRemindersSummary {
  let overdue = 0;
  let dueToday = 0;
  let upcoming = 0;
  let completed = 0;

  const typedReminders: IntelligentMaintenanceReminder[] = reminders.map((r) => {
    if (r.status === "overdue") overdue++;
    else if (r.status === "due_today") dueToday++;
    else if (r.status === "upcoming") upcoming++;
    else if (r.status === "completed") completed++;

    return {
      ...r,
      non_predictive_disclaimer: NON_PREDICTIVE_MAINTENANCE_DISCLAIMER,
    };
  });

  return {
    business_id: businessId,
    total_assets_tracked: new Set(typedReminders.map((r) => r.asset_id).filter(Boolean)).size,
    total_schedules: typedReminders.length,
    overdue_count: overdue,
    due_today_count: dueToday,
    upcoming_count: upcoming,
    completed_count: completed,
    reminders: typedReminders,
    disclaimer: NON_PREDICTIVE_MAINTENANCE_DISCLAIMER,
  };
}

/**
 * Mark a maintenance schedule as completed and compute next due date
 */
export async function completeMaintenanceSchedule(scheduleId: string) {
  const fetchRes = await supabaseAdminFetch<Array<{ interval_days: number }>>(
    `/rest/v1/maintenance_schedules?select=interval_days&id=eq.${encodeURIComponent(scheduleId)}`
  );

  if (!fetchRes.ok || !fetchRes.data || fetchRes.data.length === 0) {
    throw new Error("Schedule not found");
  }

  const intervalDays = fetchRes.data[0]!.interval_days || 30;
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + intervalDays);

  const updateRes = await supabaseAdminFetch<any[]>(
    `/rest/v1/maintenance_schedules?id=eq.${encodeURIComponent(scheduleId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        last_completed_at: new Date().toISOString(),
        next_due_date: nextDueDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!updateRes.ok) {
    throw new Error(updateRes.message || "Failed to update schedule.");
  }

  return updateRes.data?.[0] || null;
}
