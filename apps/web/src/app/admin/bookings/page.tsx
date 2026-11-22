import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminBookingsPaginated } from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Service Bookings Oversight — EasyLife Administration",
  description: "Monitor real-time customer service orders, fulfillment milestones, and financial totals.",
};

const ADMIN_BOOKINGS_PAGE_SIZE = 25;

interface AdminBookingsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const { status = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const { bookings, totalCount } = await fetchAdminBookingsPaginated({
    status,
    page: currentPage,
    limit: ADMIN_BOOKINGS_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_BOOKINGS_PAGE_SIZE));
  const offset = (currentPage - 1) * ADMIN_BOOKINGS_PAGE_SIZE;

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round((kobo || 0) / 100));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in_progress":
      case "confirmed":
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "disputed":
        return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      case "cancelled":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Operations Monitor
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Marketplace Work Orders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Service Booking Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit customer work requests, assigned service artisans, dispatch status, and settled financial amounts.
          </p>
        </div>

        <Link
          href="/admin/disputes"
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 hover:underline self-start sm:self-auto"
        >
          Check Active Disputes →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All Orders" },
          { id: "active", label: "Active Pipeline" },
          { id: "completed", label: "Completed" },
          { id: "disputed", label: "Disputed" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => {
          const isActive = status === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/bookings?status=${encodeURIComponent(tab.id)}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654]/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Service Bookings ({totalCount})
          </div>
          <span className="text-2xs text-slate-400">
            Ordered by newest first • Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#071526]/80 border-b border-slate-200 dark:border-[#163654] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Reference &amp; Task</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Assigned Professional</th>
                <th className="py-3.5 px-4">City / Region</th>
                <th className="py-3.5 px-4">Agreed Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Booked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No booking records found in the database.
                  </td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-2xs font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                        {b.reference_code || b.id.slice(0, 8)}
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {b.title || "Standard Service Booking"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-100 font-semibold">
                        {b.profiles?.full_name || "Customer"}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {b.profiles?.email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-100 font-semibold">
                        {b.professional_profiles?.business_name || "Unassigned"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {b.city || "Nigeria"}
                      {b.state ? `, ${b.state}` : ""}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatNaira(b.agreed_amount_kobo || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#071526]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{offset + 1}</strong>–
              <strong className="text-slate-900 dark:text-white">{Math.min(offset + bookings.length, totalCount)}</strong> of{" "}
              <strong className="text-slate-900 dark:text-white">{totalCount}</strong> bookings
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/bookings?status=${encodeURIComponent(status)}&page=${currentPage - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] text-slate-400">
                  ← Previous
                </span>
              )}
              {currentPage < totalPages ? (
                <Link
                  href={`/admin/bookings?status=${encodeURIComponent(status)}&page=${currentPage + 1}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Next →
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] text-slate-400">
                  Next →
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
