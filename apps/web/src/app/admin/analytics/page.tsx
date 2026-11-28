import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminAnalytics } from "@/app/actions/admin";
import { AdminAnalyticsClient } from "@/components/admin/admin-analytics-client";
import type { AdminDashboardMetrics } from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Platform Analytics & Demand Management — EasyLife Administration",
  description:
    "Marketplace search demand, most booked services, category popularity, regional demand vs provider coverage, and supply-gap alerts.",
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

const TIMEFRAME_OPTIONS: Array<{ label: string; value: string; days: number }> = [
  { label: "Last 30 Days", value: "30", days: 30 },
  { label: "Last 90 Days", value: "90", days: 90 },
  { label: "All Time", value: "all", days: 0 },
];

interface AdminAnalyticsPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const { days = "90" } = await searchParams;
  const parsedDays =
    days === "all" || days === "0"
      ? 0
      : days === "30"
      ? 30
      : 90;

  const data = await fetchAdminAnalytics(parsedDays);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Intelligence &amp; Demand
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Marketplace Supply &amp; Search Insights
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Platform Analytics &amp; Demand Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor search trends, service requests, booking velocity, location demand, and provider supply gaps across Port Harcourt, Lagos, and Abuja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Analytics timeframe selector"
            className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-[#2E343B]"
          >
            {TIMEFRAME_OPTIONS.map((opt) => {
              const isActive = opt.days === parsedDays;
              return (
                <Link
                  key={opt.value}
                  href={opt.value === "90" ? "/admin/analytics" : `/admin/analytics?days=${opt.value}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:text-white"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/admin/services"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-white dark:bg-[#1F2328] hover:border-teal-500 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            Manage Services →
          </Link>
        </div>
      </div>

      <AdminAnalyticsClient
        metrics={data?.metrics || EMPTY_METRICS}
        categoriesCount={data?.categoriesCount || 0}
        bookingsSample={(data?.bookingsSample as Array<{ status: string; city: string; agreed_amount_kobo: number }>) || []}
        disputesSample={(data?.disputesSample as Array<{ status: string; category: string }>) || []}
        demandAnalytics={data?.demandAnalytics || null}
        activeDays={parsedDays}
      />
    </div>
  );
}
