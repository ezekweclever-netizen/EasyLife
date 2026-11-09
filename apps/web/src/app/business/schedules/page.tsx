import React from "react";
import type { Metadata } from "next";
import {
  getActiveBusiness,
  fetchBusinessProperties,
  fetchBusinessAssets,
  fetchBusinessMaintenanceSchedules,
} from "@/app/actions/business";
import { getIntelligentMaintenanceReminders } from "@/lib/maintenance/maintenance-engine";
import { BusinessNav } from "@/components/business/business-nav";
import { ScheduleManagerClient } from "@/components/business/schedule-manager-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";
import { IntelligentMaintenanceWidget } from "@/components/business/intelligent-maintenance-widget";

export const metadata: Metadata = {
  title: "Maintenance Schedules & Reminders — EasyLife Business",
  description:
    "Manually configured routine maintenance schedules for generators, cooling, and critical infrastructure.",
};

interface SchedulesPageProps {
  searchParams?: Promise<{
    filter?: string;
  }>;
}

export default async function BusinessSchedulesPage({ searchParams }: SchedulesPageProps) {
  const business = await getActiveBusiness();

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RegisterBusinessClient />
      </div>
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const [rawProperties, rawAssets, rawSchedules, remindersSummary] = await Promise.all([
    fetchBusinessProperties(String(business.id)),
    fetchBusinessAssets(String(business.id)),
    fetchBusinessMaintenanceSchedules(String(business.id)),
    getIntelligentMaintenanceReminders(String(business.id)),
  ]);

  const properties = (rawProperties || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    code: String(p.code),
  }));

  const assets = (rawAssets || []).map((a: any) => ({
    id: String(a.id),
    name: String(a.name),
    asset_tag: String(a.asset_tag),
    property_id: String(a.property_id),
  }));

  const schedules = (rawSchedules || []).map((s: any) => ({
    id: String(s.id),
    business_id: String(s.business_id),
    property_id: String(s.property_id),
    asset_id: s.asset_id ? String(s.asset_id) : null,
    category_id: s.category_id,
    title: String(s.title),
    description: s.description,
    frequency: s.frequency,
    interval_days: Number(s.interval_days || 30),
    estimated_cost_kobo: Number(s.estimated_cost_kobo || 0),
    next_due_date: String(s.next_due_date),
    last_completed_at: s.last_completed_at ? String(s.last_completed_at) : null,
    is_active: Boolean(s.is_active),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <IntelligentMaintenanceWidget
          initialSummary={remindersSummary}
          businessId={String(business.id)}
        />

        <ScheduleManagerClient
          business={{
            id: String(business.id),
            name: String(business.name),
          }}
          properties={properties}
          assets={assets}
          schedules={schedules}
          initialFilter={resolvedParams?.filter || "all"}
        />
      </main>
    </div>
  );
}
