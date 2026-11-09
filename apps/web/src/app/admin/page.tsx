import React from "react";
import type { Metadata } from "next";
import { fetchAdminDashboardMetrics } from "@/app/actions/admin";
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview";
import type { AdminDashboardMetrics } from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Platform Administration Dashboard — EasyLife Operations",
  description: "Live marketplace overview, verified professionals, disputes, and operational governance.",
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

export default async function AdminDashboardPage() {
  const metrics = (await fetchAdminDashboardMetrics()) || EMPTY_METRICS;

  return <AdminDashboardOverview metrics={metrics} />;
}
