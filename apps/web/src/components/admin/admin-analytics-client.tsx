"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type {
  AdminDashboardMetrics,
  AdminDemandAnalytics,
  SupplyGapSeverity,
} from "@easylife/shared-types";

interface AdminAnalyticsClientProps {
  metrics: AdminDashboardMetrics;
  categoriesCount: number;
  bookingsSample: Array<{ status: string; city: string; agreed_amount_kobo: number }>;
  disputesSample: Array<{ status: string; category: string }>;
  demandAnalytics: AdminDemandAnalytics | null;
  activeDays: number;
}

type SectionFocus =
  | "all"
  | "demand"
  | "categories"
  | "supply"
  | "locations";

const SEVERITY_BADGES: Record<
  SupplyGapSeverity,
  { label: string; className: string }
> = {
  critical_no_providers: {
    label: "No Providers",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  high_none_available: {
    label: "All Pros Offline",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  high_unmet_demand: {
    label: "Demand > Supply",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  moderate_thin_supply: {
    label: "Thin / Missing City",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  healthy: {
    label: "Healthy Supply",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export function AdminAnalyticsClient({
  metrics,
  categoriesCount,
  bookingsSample,
  disputesSample,
  demandAnalytics,
  activeDays,
}: AdminAnalyticsClientProps) {
  const [sectionFocus, setSectionFocus] = useState<SectionFocus>("all");
  const [categoryTierTab, setCategoryTierTab] = useState<"main" | "subcategory">(
    "main"
  );
  const [gapFilter, setGapFilter] = useState<"all" | SupplyGapSeverity>("all");
  const [serviceSupplyQuery, setServiceSupplyQuery] = useState("");
  const [showZeroOnlyInQueries, setShowZeroOnlyInQueries] = useState(false);

  const formatNaira = (naira: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(naira);
  };

  const formatKoboAsNaira = (kobo: number) =>
    formatNaira(Math.round((kobo || 0) / 100));

  const windowLabel =
    activeDays === 0 ? "All Time" : `Last ${activeDays} Days`;

  // Group bookings by city (legacy overview chart preserved)
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

  const summary = demandAnalytics?.summary;

  const filteredCategories = useMemo(() => {
    const list = demandAnalytics?.popular_categories || [];
    return list.filter((c) => c.tier === categoryTierTab);
  }, [demandAnalytics?.popular_categories, categoryTierTab]);

  const filteredGaps = useMemo(() => {
    const list = demandAnalytics?.insufficient_provider_services || [];
    if (gapFilter === "all") return list;
    return list.filter((item) => item.gap_severity === gapFilter);
  }, [demandAnalytics?.insufficient_provider_services, gapFilter]);

  const filteredAvailability = useMemo(() => {
    const list = demandAnalytics?.provider_availability_by_service || [];
    const q = serviceSupplyQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (srv) =>
        srv.name.toLowerCase().includes(q) ||
        srv.service_code.toLowerCase().includes(q) ||
        srv.category_name.toLowerCase().includes(q) ||
        (srv.subcategory_name || "").toLowerCase().includes(q)
    );
  }, [demandAnalytics?.provider_availability_by_service, serviceSupplyQuery]);

  const displayedSearchQueries = useMemo(() => {
    if (showZeroOnlyInQueries) {
      return (demandAnalytics?.zero_result_searches || []).map((z) => ({
        ...z,
        resolved_service_name: null,
        resolved_category_name: null,
      }));
    }
    return demandAnalytics?.top_search_queries || [];
  }, [demandAnalytics, showZeroOnlyInQueries]);

  const showDemand = sectionFocus === "all" || sectionFocus === "demand";
  const showCategories =
    sectionFocus === "all" || sectionFocus === "categories";
  const showSupply = sectionFocus === "all" || sectionFocus === "supply";
  const showLocations =
    sectionFocus === "all" || sectionFocus === "locations";

  return (
    <div className="space-y-8">
      {/* Financial & Marketplace Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Platform Net Commission
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400">
            {formatNaira(metrics.platform_revenue_naira)}
          </div>
          <div className="text-2xs text-teal-600 font-medium">
            10% baseline take rate
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Estimated Gross Marketplace Volume
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNaira(metrics.platform_revenue_naira * 10)}
          </div>
          <div className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
            Settled transacted volume
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Average Booking Ticket
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatNaira(avgOrderValueNaira)}
          </div>
          <div className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
            Across fulfilled jobs
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Fulfillment Ratio
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {metrics.total_bookings > 0
              ? `${Math.round((metrics.completed_bookings / metrics.total_bookings) * 100)}%`
              : "0%"}
          </div>
          <div className="text-2xs text-emerald-600 font-medium">
            {metrics.completed_bookings} of {metrics.total_bookings} bookings
          </div>
        </div>
      </div>

      {/* Phase 7 Demand, Search & Supply-Gap Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-5 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-slate-400">
              <span>Catalogue Searches</span>
              <span className="text-slate-500 dark:text-slate-400">{windowLabel}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.total_searches}
            </div>
            <div className="text-2xs font-medium text-slate-600 dark:text-slate-300">
              {summary.zero_result_searches} zero-result ({summary.zero_result_rate_pct}%)
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-5 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-slate-400">
              <span>Service Orders &amp; Requests</span>
              <span className="text-slate-500 dark:text-slate-400">{windowLabel}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.total_bookings_in_window + summary.maintenance_requests_count}
            </div>
            <div className="text-2xs font-medium text-slate-600 dark:text-slate-300">
              {summary.total_bookings_in_window} bookings • {summary.maintenance_requests_count} B2B • {summary.ai_queries_in_window} AI
            </div>
          </div>

          <div
            className={`rounded-3xl p-5 border shadow-xs space-y-1 ${
              summary.insufficient_provider_services_count > 0
                ? "bg-amber-50 dark:bg-amber-950/60/40 border-amber-200 dark:border-amber-800"
                : "bg-white dark:bg-[#0D223A] border-slate-200 dark:border-[#163654]/80"
            }`}
          >
            <div className="text-2xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Services With Supply Gaps
            </div>
            <div className="text-2xl font-black text-amber-900">
              {summary.insufficient_provider_services_count}
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 ml-1">
                / {summary.active_services_count} active
              </span>
            </div>
            <div className="text-2xs font-medium text-amber-800 dark:text-amber-300">
              {summary.services_with_zero_providers_count} zero-pro • {summary.services_none_available_count} offline-only
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-5 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-1">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Available Verified Pros
            </div>
            <div className="text-2xl font-black text-teal-700 dark:text-teal-400">
              {summary.approved_available_pros_count}
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">
                / {summary.approved_total_pros_count} approved
              </span>
            </div>
            <div className="text-2xs font-medium text-slate-600 dark:text-slate-300">
              Across {categoriesCount} active categories &amp; subcategories
            </div>
          </div>
        </div>
      )}

      {/* Focus Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0D223A] rounded-2xl p-3 border border-slate-200 dark:border-[#163654]/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Analytics sections">
          {(
            [
              { id: "all", label: "All Insights" },
              { id: "demand", label: "Search & Service Demand" },
              { id: "categories", label: "Popular Categories" },
              { id: "supply", label: "Supply Gaps & Availability" },
              { id: "locations", label: "Demand by Location" },
            ] as Array<{ id: SectionFocus; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={sectionFocus === tab.id}
              onClick={() => setSectionFocus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                sectionFocus === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {demandAnalytics && (
          <span className="text-2xs text-slate-400 font-mono px-2">
            Snapshot: {new Date(demandAnalytics.generated_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
          </span>
        )}
      </div>

      {/* SECTION 1: Search & Service Demand (Most Searched, Zero-Result Searches, Most Requested, Most Frequently Booked) */}
      {showDemand && demandAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Most Searched Services */}
            <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Most Searched Services
                  </h2>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Anonymized search volume resolved to active Tier-3 services ({windowLabel})
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-2xs font-bold">
                  {demandAnalytics.most_searched_services.length} services
                </span>
              </div>

              {demandAnalytics.most_searched_services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No anonymized catalogue search signals recorded yet for {windowLabel}. Customer queries on the homepage suggest bar, catalogue index, and discovery page appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                        <th className="py-2 pr-3">Service</th>
                        <th className="py-2 px-2 text-right">Searches</th>
                        <th className="py-2 px-2 text-right">Booked</th>
                        <th className="py-2 pl-2 text-right">Avail. Pros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demandAnalytics.most_searched_services.map((srv) => (
                        <tr key={srv.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                          <td className="py-2.5 pr-3">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-teal-700 dark:text-teal-400 block"
                            >
                              {srv.name}
                            </Link>
                            <span className="text-2xs text-slate-500 dark:text-slate-400">
                              {srv.service_code} • {srv.category_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {srv.search_count}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            {srv.direct_bookings}
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-2xs font-bold ${
                                srv.available_pros === 0
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5]"
                              }`}
                            >
                              {srv.available_pros}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 6. Searches Returning No Results & Top Queries */}
            <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Searches Returning No Results
                  </h2>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Unmet customer search terms ({demandAnalytics.zero_result_searches.length} zero-result queries tracked)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowZeroOnlyInQueries((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#163654] text-2xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526] cursor-pointer"
                >
                  {showZeroOnlyInQueries ? "Show All Queries" : "Zero-Result Only"}
                </button>
              </div>

              {(showZeroOnlyInQueries
                ? displayedSearchQueries
                : demandAnalytics.zero_result_searches.length > 0
                ? demandAnalytics.zero_result_searches
                : demandAnalytics.top_search_queries
              ).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Zero-result search tracking is active with zero unmet search terms recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {demandAnalytics.zero_result_searches.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-rose-500">
                            <th className="py-2 pr-3">Zero-Result Query</th>
                            <th className="py-2 px-2">Surface / City</th>
                            <th className="py-2 px-2 text-right">Zero Hits</th>
                            <th className="py-2 pl-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {demandAnalytics.zero_result_searches.map((z) => (
                            <tr
                              key={`${z.normalized_query}-${z.search_surface}-${z.city_filter}`}
                              className="hover:bg-rose-50/30"
                            >
                              <td className="py-2 pr-3 font-bold text-slate-900 dark:text-white">
                                &ldquo;{z.normalized_query}&rdquo;
                              </td>
                              <td className="py-2 px-2 text-2xs text-slate-500 dark:text-slate-400 capitalize">
                                {z.search_surface}
                                {z.city_filter ? ` • ${z.city_filter}` : ""}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-rose-700">
                                {z.zero_result_count}
                              </td>
                              <td className="py-2 pl-2 text-right font-mono text-slate-600 dark:text-slate-300">
                                {z.search_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!showZeroOnlyInQueries &&
                    demandAnalytics.top_search_queries.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Top Search Terms Across Discovery Surfaces
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {demandAnalytics.top_search_queries.slice(0, 12).map((qRow) => (
                            <span
                              key={`${qRow.normalized_query}-${qRow.search_surface}-${qRow.city_filter}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526] px-3 py-1 text-2xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                              <span>&ldquo;{qRow.normalized_query}&rdquo;</span>
                              <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                                {qRow.search_count}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. Most Requested Services */}
            <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Most Requested Services
                  </h2>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Direct bookings, open/custom requests, B2B maintenance requests, searches &amp; category context
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-2xs font-bold">
                  Top {demandAnalytics.most_requested_services.length}
                </span>
              </div>

              {demandAnalytics.most_requested_services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No service request activity recorded in {windowLabel}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                        <th className="py-2 pr-3">Service</th>
                        <th className="py-2 px-2 text-right">Direct</th>
                        <th className="py-2 px-2 text-right">B2B / Search</th>
                        <th className="py-2 px-2 text-right">Cat. Vol</th>
                        <th className="py-2 pl-2 text-right">Pros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demandAnalytics.most_requested_services.slice(0, 12).map((srv) => (
                        <tr key={srv.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                          <td className="py-2.5 pr-3">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-teal-700 dark:text-teal-400 block"
                            >
                              {srv.name}
                            </Link>
                            <span className="text-2xs text-slate-500 dark:text-slate-400">
                              {srv.category_name}
                              {srv.open_unmatched_bookings > 0
                                ? ` • ${srv.open_unmatched_bookings} open`
                                : ""}
                              {srv.custom_task_bookings > 0
                                ? ` • ${srv.custom_task_bookings} custom`
                                : ""}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {srv.direct_bookings}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                            {srv.maintenance_requests_count} / {srv.search_count}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400">
                            {srv.category_bookings_context}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                            {srv.available_pros}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 3. Most Frequently Booked Services */}
            <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Most Frequently Booked Services
                  </h2>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Individual Tier-3 services ranked by total &amp; completed bookings ({windowLabel})
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5] text-2xs font-bold">
                  {summary?.direct_service_bookings_count ?? 0} tagged bookings
                </span>
              </div>

              {demandAnalytics.most_frequently_booked_services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 p-6 space-y-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    No bookings in {windowLabel} are tagged with a Tier-3 service ID yet.
                  </p>
                  <p>
                    Existing {summary?.total_bookings_in_window ?? 0} category-level bookings are fully aggregated in{" "}
                    <button
                      type="button"
                      onClick={() => setSectionFocus("categories")}
                      className="font-bold text-teal-700 dark:text-teal-400 underline cursor-pointer"
                    >
                      Popular Categories
                    </button>{" "}
                    below. New Tier-3 service bookings appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                        <th className="py-2 pr-3">Service</th>
                        <th className="py-2 px-2 text-right">Bookings</th>
                        <th className="py-2 px-2 text-right">Completed</th>
                        <th className="py-2 pl-2 text-right">Settled GMV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demandAnalytics.most_frequently_booked_services.map((srv) => (
                        <tr key={srv.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                          <td className="py-2.5 pr-3">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-teal-700 dark:text-teal-400 block"
                            >
                              {srv.name}
                            </Link>
                            <span className="text-2xs text-slate-500 dark:text-slate-400">
                              {srv.service_code} • {srv.category_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {srv.total_bookings}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-emerald-700 dark:text-emerald-300">
                            {srv.completed_bookings} ({srv.completion_rate_pct}%)
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {formatKoboAsNaira(srv.gross_agreed_kobo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* SECTION 2: 4. Popular Categories (Main & Subcategories) */}
      {showCategories && demandAnalytics && (
        <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Popular Categories &amp; Subcategories
              </h2>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Bookings, AI problem-triage interest, searches, settled volume, and active provider counts ({windowLabel})
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-[#163654]">
              <button
                type="button"
                onClick={() => setCategoryTierTab("main")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  categoryTierTab === "main"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:text-white"
                }`}
              >
                Main Categories
              </button>
              <button
                type="button"
                onClick={() => setCategoryTierTab("subcategory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  categoryTierTab === "subcategory"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:text-white"
                }`}
              >
                Subcategories
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 px-2 text-right">Services</th>
                  <th className="py-2 px-2 text-right">Bookings</th>
                  <th className="py-2 px-2 text-right">AI Triage</th>
                  <th className="py-2 px-2 text-right">Searches</th>
                  <th className="py-2 px-2 text-right">B2B</th>
                  <th className="py-2 px-2 text-right">Settled GMV</th>
                  <th className="py-2 pl-2 text-right">Avail. Pros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                    <td className="py-2.5 pr-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {cat.name}
                      </span>
                      {cat.parent_name && (
                        <span className="text-2xs text-slate-500 dark:text-slate-400">
                          Under {cat.parent_name}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                      {cat.active_services_count}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {cat.total_bookings}
                      {cat.completed_bookings > 0 && (
                        <span className="text-2xs text-emerald-700 dark:text-emerald-300 font-normal ml-1">
                          ({cat.completed_bookings} done)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-indigo-700">
                      {cat.ai_assistant_hits}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-200">
                      {cat.search_count}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                      {cat.maintenance_requests_count}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-800 dark:text-slate-100">
                      {formatKoboAsNaira(cat.gross_agreed_kobo)}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-2xs font-bold ${
                          cat.available_pros_count === 0
                            ? "bg-rose-100 text-rose-800"
                            : "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5]"
                        }`}
                      >
                        {cat.available_pros_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: 5. Services with Insufficient Providers & 8. Provider Availability by Service */}
      {showSupply && demandAnalytics && (
        <div className="space-y-6">
          {/* 5. Services with Insufficient Providers */}
          <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Services With Insufficient Providers
                </h2>
                <p className="text-2xs text-slate-500 dark:text-slate-400">
                  Services with zero linked providers, offline-only pros, unmet demand, or missing coverage in Port Harcourt, Lagos, or Abuja
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all", label: `All Gaps (${demandAnalytics.insufficient_provider_services.length})` },
                    { id: "critical_no_providers", label: "No Providers" },
                    { id: "high_none_available", label: "All Offline" },
                    { id: "high_unmet_demand", label: "Unmet Demand" },
                    { id: "moderate_thin_supply", label: "Thin / Missing City" },
                  ] as Array<{ id: "all" | SupplyGapSeverity; label: string }>
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setGapFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-2xs font-bold border cursor-pointer ${
                      gapFilter === f.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 dark:bg-[#071526] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#163654] hover:bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredGaps.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60/40 p-6 text-center text-xs font-medium text-emerald-800 dark:text-emerald-300">
                No active services match this supply-gap severity filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                      <th className="py-2 pr-3">Service</th>
                      <th className="py-2 px-2">Severity</th>
                      <th className="py-2 px-2 text-right">Avail / Eligible</th>
                      <th className="py-2 px-2 text-right">PH</th>
                      <th className="py-2 px-2 text-right">Lagos</th>
                      <th className="py-2 px-2 text-right">Abuja</th>
                      <th className="py-2 px-2">Missing Cities</th>
                      <th className="py-2 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGaps.map((gap) => {
                      const badge = SEVERITY_BADGES[gap.gap_severity];
                      return (
                        <tr key={gap.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                          <td className="py-2.5 pr-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {gap.name}
                            </span>
                            <span className="text-2xs text-slate-500 dark:text-slate-400">
                              {gap.service_code} • {gap.category_name}
                              {gap.requires_trade_certification ? " • Trade Cert Required" : ""}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full border text-2xs font-bold whitespace-nowrap ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {gap.available_pros} / {gap.total_eligible_pros}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <span className={gap.ph_pros === 0 ? "text-rose-600 font-bold" : "text-slate-700"}>
                              {gap.ph_pros}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <span className={gap.lagos_pros === 0 ? "text-rose-600 font-bold" : "text-slate-700"}>
                              {gap.lagos_pros}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <span className={gap.abuja_pros === 0 ? "text-rose-600 font-bold" : "text-slate-700"}>
                              {gap.abuja_pros}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex flex-wrap gap-1">
                              {(gap.missing_cities || []).map((c) => (
                                <span
                                  key={c}
                                  className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-semibold"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                            <Link
                              href="/admin/professionals"
                              className="text-teal-700 dark:text-teal-400 hover:underline font-bold"
                            >
                              Recruit / Review →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 8. Provider Availability by Service */}
          <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Provider Availability by Service
                </h2>
                <p className="text-2xs text-slate-500 dark:text-slate-400">
                  Full supply roster across all {demandAnalytics.provider_availability_by_service.length} active Tier-3 services (direct service links, eligible pros, online availability, city split)
                </p>
              </div>
              <input
                type="search"
                value={serviceSupplyQuery}
                onChange={(e) => setServiceSupplyQuery(e.target.value)}
                placeholder="Filter service or code..."
                className="w-full sm:w-64 h-9 px-3 rounded-xl border border-slate-200 dark:border-[#163654] text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white dark:bg-[#0D223A] z-10">
                  <tr className="border-b border-slate-200 dark:border-[#163654] text-2xs font-extrabold uppercase text-slate-400">
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 px-2 text-right">Direct Links</th>
                    <th className="py-2 px-2 text-right">Eligible</th>
                    <th className="py-2 px-2 text-right">Online</th>
                    <th className="py-2 px-2 text-right">Offline</th>
                    <th className="py-2 px-2 text-right">PH / LAG / ABJ</th>
                    <th className="py-2 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAvailability.map((srv) => {
                    const badge = SEVERITY_BADGES[srv.gap_severity];
                    return (
                      <tr key={srv.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70">
                        <td className="py-2.5 pr-3">
                          <Link
                            href={`/services/${srv.slug}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-teal-700 dark:text-teal-400 block"
                          >
                            {srv.name}
                          </Link>
                          <span className="text-2xs text-slate-500 dark:text-slate-400">
                            {srv.service_code} • {srv.category_name}
                            {srv.subcategory_name ? ` / ${srv.subcategory_name}` : ""}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                          {srv.direct_service_pros}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800 dark:text-slate-100">
                          {srv.total_eligible_pros}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {srv.available_pros}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400">
                          {srv.offline_pros}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {srv.ph_pros} / {srv.lagos_pros} / {srv.abuja_pros}
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full border text-2xs font-bold whitespace-nowrap ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SECTION 4: 7. Demand by Location (City Summary + City/LGA Hub Table) */}
      {showLocations && demandAnalytics && (
        <section className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Demand by Location vs. Active Provider Supply
            </h2>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
              Booking demand, unmatched orders, and city search volume compared against available verified technicians ({windowLabel})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demandAnalytics.demand_by_city.slice(0, 6).map((hub) => (
              <div
                key={hub.city}
                className="rounded-2xl border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {hub.city}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] text-2xs font-bold text-slate-700 dark:text-slate-200">
                    {hub.available_pros_count} online pros
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white dark:bg-[#0D223A] rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {hub.total_bookings}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      Bookings
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0D223A] rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-black text-teal-700 dark:text-teal-400">
                      {hub.search_count}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      Searches
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0D223A] rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                      {hub.bookings_per_available_pro ?? "—"}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      Jobs / Pro
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                  <th className="py-2 pr-3">City / District (LGA)</th>
                  <th className="py-2 px-2 text-right">Bookings</th>
                  <th className="py-2 px-2 text-right">Open / Unmatched</th>
                  <th className="py-2 px-2 text-right">Completed</th>
                  <th className="py-2 px-2 text-right">City Searches</th>
                  <th className="py-2 px-2 text-right">Settled GMV</th>
                  <th className="py-2 pl-2 text-right">Avail. Pros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demandAnalytics.demand_by_location.map((loc) => (
                  <tr
                    key={`${loc.city}-${loc.lga_or_district}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-bold text-slate-900 dark:text-white">{loc.city}</span>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 block">
                        {loc.lga_or_district}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {loc.total_bookings}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-700 dark:text-amber-300">
                      {loc.open_unmatched_bookings}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-700 dark:text-emerald-300">
                      {loc.completed_bookings}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                      {loc.city_search_count}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-800 dark:text-slate-100">
                      {formatKoboAsNaira(loc.gross_agreed_kobo)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                      {loc.available_pros_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Existing Breakdown Charts Grid (Preserved) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Regional Distribution */}
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Regional Market Distribution
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
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
                      <span className="font-bold text-slate-800 dark:text-slate-100">{city}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} jobs ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Order Lifecycle Breakdown
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
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
                      <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Dispute Category Patterns
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
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
                      <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">{cat}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} cases ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
