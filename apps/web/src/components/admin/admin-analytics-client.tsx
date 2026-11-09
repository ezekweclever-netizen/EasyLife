"use client";

import React from "react";
import type { AdminDashboardMetrics } from "@easylife/shared-types";

interface AdminAnalyticsClientProps {
  metrics: AdminDashboardMetrics;
  categoriesCount: number;
  bookingsSample: Array<{ status: string; city: string; agreed_amount_kobo: number }>;
  disputesSample: Array<{ status: string; category: string }>;
}

export function AdminAnalyticsClient({
  metrics,
  categoriesCount,
  bookingsSample,
  disputesSample,
}: AdminAnalyticsClientProps) {
  const formatNaira = (naira: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(naira);
  };

  // Group bookings by city
  const cityCounts: Record<string, number> = {};
  bookingsSample.forEach((b) => {
    const city = b.city || "Other";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  // Group bookings by status
  const statusCounts: Record<string, number> = {};
  bookingsSample.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  // Group disputes by category
  const disputeCounts: Record<string, number> = {};
  disputesSample.forEach((d) => {
    const cat = d.category ? d.category.replace(/_/g, " ") : "Other";
    disputeCounts[cat] = (disputeCounts[cat] || 0) + 1;
  });

  const avgOrderValueNaira =
    metrics.completed_bookings > 0
      ? Math.round(
          (metrics.platform_revenue_naira * 10) / metrics.completed_bookings
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* High-Level Financial & Conversion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Platform Net Commission
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700">
            {formatNaira(metrics.platform_revenue_naira)}
          </div>
          <div className="text-2xs text-teal-600 font-medium">
            10% baseline take rate
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Estimated Gross Marketplace Volume
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(metrics.platform_revenue_naira * 10)}
          </div>
          <div className="text-2xs text-slate-500 font-medium">
            Settled transacted volume
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Average Booking Ticket
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(avgOrderValueNaira)}
          </div>
          <div className="text-2xs text-slate-500 font-medium">
            Across fulfilled jobs
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Fulfillment Ratio
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {metrics.total_bookings > 0
              ? `${Math.round((metrics.completed_bookings / metrics.total_bookings) * 100)}%`
              : "0%"}
          </div>
          <div className="text-2xs text-emerald-600 font-medium">
            {metrics.completed_bookings} of {metrics.total_bookings} bookings
          </div>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Regional Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Regional Market Distribution
            </h3>
            <p className="text-2xs text-slate-500">
              Work volume across Nigeria pilot cities
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(cityCounts).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No regional booking data</div>
            ) : (
              Object.entries(cityCounts).map(([city, count]) => {
                const total = bookingsSample.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={city} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{city}</span>
                      <span className="text-slate-500 font-mono">{count} jobs ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Order Lifecycle Breakdown
            </h3>
            <p className="text-2xs text-slate-500">
              Marketplace booking states
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(statusCounts).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No lifecycle data</div>
            ) : (
              Object.entries(statusCounts).map(([status, count]) => {
                const total = bookingsSample.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 capitalize">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-500 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === "completed"
                            ? "bg-emerald-500"
                            : status === "disputed"
                            ? "bg-rose-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dispute Categories Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Dispute Category Patterns
            </h3>
            <p className="text-2xs text-slate-500">
              Reported quality &amp; billing complaints
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(disputeCounts).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No customer disputes recorded. Quality integrity optimal.
              </div>
            ) : (
              Object.entries(disputeCounts).map(([cat, count]) => {
                const total = disputesSample.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 capitalize">{cat}</span>
                      <span className="text-slate-500 font-mono">{count} cases ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
