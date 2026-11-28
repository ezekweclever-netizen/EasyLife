import React from "react";
import type { Metadata } from "next";
import { getActiveBusiness, fetchBusinessDashboardMetrics } from "@/app/actions/business";
import { BusinessNav } from "@/components/business/business-nav";
import { BusinessDashboardClient } from "@/components/business/business-dashboard-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";
import type { BusinessDashboardMetrics } from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Business Facility Management Portal — EasyLife",
  description:
    "Centralised platform for corporate property managers: equipment inventory, fault reporting, maintenance schedules, and expense audits.",
};

export default async function BusinessDashboardPage() {
  const business = await getActiveBusiness();

  if (!business) {
    return <RegisterBusinessClient />;
  }

  const rawMetrics = await fetchBusinessDashboardMetrics(business.id as string);
  const metrics: BusinessDashboardMetrics = rawMetrics || {
    total_properties: 0,
    registered_assets: 0,
    open_maintenance_requests: 0,
    upcoming_maintenance: 0,
    overdue_maintenance: 0,
    total_expenditure_kobo: 0,
    total_expenditure_naira: 0,
    recent_activities: [],
  };

  return (
    <div className="min-h-screen bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-900 dark:text-slate-100">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BusinessDashboardClient
          business={{
            id: String(business.id),
            name: String(business.name),
            city: String(business.city || "Port Harcourt"),
            state: String(business.state || "Rivers State"),
          }}
          metrics={metrics}
        />
      </main>
    </div>
  );
}
