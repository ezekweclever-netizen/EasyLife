import React from "react";
import type { Metadata } from "next";
import { fetchAdminAnalytics } from "@/app/actions/admin";
import { AdminAnalyticsClient } from "@/components/admin/admin-analytics-client";
import type { AdminDashboardMetrics } from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Platform Analytics & Regional Trends — EasyLife Administration",
  description: "Marketplace performance metrics, regional order distribution, and dispute resolution trends.",
};

const EMPTY_METRICS: AdminDashboardMetrics = {
  total_customers: 0,
  total_professionals: 0,
  verified_professionals: 0,
  pending_verification_requests: 0,
  total_businesses: 0,
  total_bookings: 0,
  active_bookings: 0,
  completed_bookings: 0,
  open_disputes: 0,
  platform_revenue_kobo: 0,
  platform_revenue_naira: 0,
  recent_audit_logs: [],
};

export default async function AdminAnalyticsPage() {
  const data = await fetchAdminAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Intelligence &amp; Growth
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Marketplace Economics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Analytics &amp; Regional Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluate transaction velocities, ticket sizes, dispute resolution ratios, and regional performance.
          </p>
        </div>
      </div>

      <AdminAnalyticsClient
        metrics={data?.metrics || EMPTY_METRICS}
        categoriesCount={data?.categoriesCount || 0}
        bookingsSample={data?.bookingsSample as any || []}
        disputesSample={data?.disputesSample as any || []}
      />
    </div>
  );
}
