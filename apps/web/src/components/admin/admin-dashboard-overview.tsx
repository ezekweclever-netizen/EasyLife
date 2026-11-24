"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AdminDashboardMetrics } from "@easylife/shared-types";

interface AdminDashboardOverviewProps {
  metrics: AdminDashboardMetrics;
}

export function AdminDashboardOverview({ metrics }: AdminDashboardOverviewProps) {
  const [selectedAuditLog, setSelectedAuditLog] = useState<
    AdminDashboardMetrics["recent_audit_logs"][0] | null
  >(null);

  const formatNaira = (naira: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(naira);
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Operational Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Marketplace Command Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Operations &amp; Governance Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Real-time oversight over Port Harcourt, Lagos, and Abuja markets. Every administrative action is protected by strict role-based authorization and an immutable audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/admin/verifications"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <span>🛡️</span>
            <span>Review KYC Queue</span>
            {metrics.pending_verification_requests > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white dark:bg-[#0D223A] text-teal-800 dark:text-[#5CD3D5] text-2xs font-black">
                {metrics.pending_verification_requests}
              </span>
            )}
          </Link>
          <Link
            href="/admin/disputes"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <span>⚖️</span>
            <span>Arbitrate Disputes</span>
            {metrics.open_disputes > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 dark:text-white text-2xs font-black">
                {metrics.open_disputes}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 10 Core Marketplace KPIs */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Marketplace Performance &amp; Activity Overview</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#163654] whitespace-nowrap shrink-0">
              Live DB
            </span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            Updated just now
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Customers */}
          <Link
            href="/admin/users"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate min-w-0">
                Customers
              </span>
              <span className="text-lg shrink-0">👥</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total_customers}
            </div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              Registered customers
            </div>
          </Link>

          {/* 2. Professionals */}
          <Link
            href="/admin/professionals"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate min-w-0">
                Professionals
              </span>
              <span className="text-lg shrink-0">👷</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total_professionals}
            </div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              Service artisans &amp; providers
            </div>
          </Link>

          {/* 3. Verified Pros */}
          <Link
            href="/admin/professionals?status=verified"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 truncate min-w-0">
                Verified Pros
              </span>
              <span className="text-lg shrink-0">✅</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {metrics.verified_professionals}
            </div>
            <div className="text-2xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Badge accredited
            </div>
          </Link>

          {/* 4. Pending Verification */}
          <Link
            href="/admin/verifications"
            className={`group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border shadow-xs transition relative overflow-hidden ${
              metrics.pending_verification_requests > 0
                ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 hover:border-amber-500"
                : "border-slate-200 dark:border-[#163654]/80 hover:border-teal-500"
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 truncate min-w-0">
                Pending KYC
              </span>
              <span className="text-lg shrink-0">⏳</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${
              metrics.pending_verification_requests > 0 ? "text-amber-750" : "text-slate-900 dark:text-white"
            }`}>
              {metrics.pending_verification_requests}
            </div>
            <div className="text-2xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
              Requires admin decision
            </div>
          </Link>

          {/* 5. Businesses */}
          <Link
            href="/admin/businesses"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate min-w-0">
                Businesses
              </span>
              <span className="text-lg shrink-0">🏢</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total_businesses}
            </div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              Commercial facilities
            </div>
          </Link>

          {/* 6. Total Bookings */}
          <Link
            href="/admin/bookings"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate min-w-0">
                Total Bookings
              </span>
              <span className="text-lg shrink-0">📋</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.total_bookings}
            </div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              Marketplace orders
            </div>
          </Link>

          {/* 7. Active Bookings */}
          <Link
            href="/admin/bookings?status=active"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-blue-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 truncate min-w-0">
                Active Bookings
              </span>
              <span className="text-lg shrink-0">⚡</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
              {metrics.active_bookings}
            </div>
            <div className="text-2xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              In progress or dispatched
            </div>
          </Link>

          {/* 8. Completed Bookings */}
          <Link
            href="/admin/bookings?status=completed"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-slate-200 dark:border-[#163654]/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 truncate min-w-0">
                Completed
              </span>
              <span className="text-lg shrink-0">🏁</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300">
              {metrics.completed_bookings}
            </div>
            <div className="text-2xs text-teal-600 dark:text-teal-400 mt-1 font-medium">
              Successfully fulfilled
            </div>
          </Link>

          {/* 9. Open Disputes */}
          <Link
            href="/admin/disputes"
            className={`group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border shadow-xs transition relative overflow-hidden ${
              metrics.open_disputes > 0
                ? "border-rose-300 dark:border-rose-700 bg-rose-50/20 hover:border-rose-500"
                : "border-slate-200 dark:border-[#163654]/80 hover:border-teal-500"
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 truncate min-w-0">
                Open Disputes
              </span>
              <span className="text-lg shrink-0">⚖️</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${
              metrics.open_disputes > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-white"
            }`}>
              {metrics.open_disputes}
            </div>
            <div className="text-2xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {metrics.open_disputes > 0 ? "Blocked from completion" : "Zero open disputes"}
            </div>
          </Link>

          {/* 10. Platform Revenue */}
          <Link
            href="/admin/analytics"
            className="group bg-white dark:bg-[#0D223A] rounded-2xl p-4 border border-teal-200 dark:border-teal-800/80 shadow-xs hover:border-teal-500 hover:shadow-md transition relative overflow-hidden bg-gradient-to-br from-white via-teal-50/30 to-teal-100/20 dark:from-[#0D223A] dark:via-[#0D223A] dark:to-teal-950/40"
          >
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-teal-800 dark:text-[#5CD3D5] truncate min-w-0">
                Platform Revenue
              </span>
              <span className="text-lg shrink-0">💰</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-800 dark:text-[#5CD3D5] truncate">
              {formatNaira(metrics.platform_revenue_naira)}
            </div>
            <div className="text-2xs text-teal-700 dark:text-teal-400 mt-1 font-medium">
              From settled transactions
            </div>
          </Link>
        </div>
      </div>

      {/* Core Administrative Modules Hub */}
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Administrative Modules &amp; Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access specialized management consoles across the 15 operational verticals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              👥
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                User Management
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Search all accounts, view details, suspend with documented reasons, and reinstate.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/verifications"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              🛡️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                KYC &amp; Verification
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Inspect identity cards, trade certifications, address proofs, and approve/reject with notes.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              📁
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Service Categories
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Configure trade categories, subcategories, callout fee benchmarks, and display order.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/disputes"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              ⚖️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Dispute Arbitration
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Evaluate photographic evidence, assign arbitrating admins, and enforce binding resolution.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              ⭐
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Review Moderation
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Filter abuse, prevent fraudulent self-reviews, and preserve verified rating history.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/commissions"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              💰
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Commission Configuration
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Set category-specific basis points, regional flat fees, and default take rates.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              ⚙️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Platform Settings
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Manage operational toggles, maintenance mode, pilot cities, and payout thresholds.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              📜
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Immutable Audit Logs
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Inspect every privileged action. Row updates or deletions are cryptographically prohibited.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/notifications"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              🔔
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Notification Dispatch
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Send official alerts, compliance notices, and system-wide service announcements.
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-4 rounded-2xl border border-slate-200 dark:border-[#163654] hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:bg-teal-50 dark:bg-teal-950/60 group-hover:text-teal-600 shrink-0">
              📊
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:text-teal-400">
                Analytics &amp; Demand Management
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Inspect top searched &amp; booked services, zero-result searches, location demand, and provider supply gaps.
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Immutable Audit Logs Table */}
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#163654]/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Recent Privileged Operational Audit Trail</span>
              <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:text-emerald-300">
                Tamper-Proof
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated trigger-protected log of administrative operations, setting changes, and verification decisions.
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline self-start sm:self-auto"
          >
            View Full Audit History ({metrics.recent_audit_logs.length}) →
          </Link>
        </div>

        {metrics.recent_audit_logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No privileged administrative operations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-2xs font-extrabold uppercase text-slate-400">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity Type</th>
                  <th className="py-3 px-3">Entity ID</th>
                  <th className="py-3 px-3">Actor / Admin</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recent_audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/70 transition">
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-2xs">
                      {new Date(log.created_at).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-2xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-2xs truncate max-w-[120px]">
                      {log.entity_id}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-200">
                      {log.actor_email || log.actor_name || "System Admin"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedAuditLog(log)}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Audit Log Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-[#163654]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                Audit Record Inspector
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-[#071526] p-3 rounded-xl">
                <div>
                  <span className="text-2xs text-slate-400 block font-bold uppercase">Action</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedAuditLog.action}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block font-bold uppercase">Entity Type</span>
                  <span className="text-slate-800 dark:text-slate-100">{selectedAuditLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block font-bold uppercase">Entity ID</span>
                  <span className="font-mono text-2xs text-slate-600 dark:text-slate-300 truncate block">{selectedAuditLog.entity_id}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block font-bold uppercase">Recorded At</span>
                  <span className="text-slate-700 dark:text-slate-200 text-2xs font-mono">{new Date(selectedAuditLog.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  Recorded Payload &amp; New Values
                </span>
                <pre className="bg-slate-900 text-teal-300 p-3 rounded-xl text-2xs font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(selectedAuditLog.new_values, null, 2) || "{}"}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
