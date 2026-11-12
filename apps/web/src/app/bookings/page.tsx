import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerBookingsPaginated, getCustomerProfile } from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";

export const metadata: Metadata = {
  title: "My Bookings — EasyLife",
  description: "View and manage all your past and active service requests, quotations, and appointments.",
};

const BOOKINGS_PAGE_SIZE = 15;

interface BookingsPageProps {
  searchParams: Promise<{
    tab?: "all" | "active" | "completed" | "cancelled";
    page?: string;
  }>;
}

export default async function CustomerBookingsPage({ searchParams }: BookingsPageProps) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/bookings");
  }

  const { tab = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * BOOKINGS_PAGE_SIZE;

  const [bookingsResult, profile] = await Promise.all([
    getCustomerBookingsPaginated(auth.user.id, auth.accessToken, {
      statusFilter: tab,
      limit: BOOKINGS_PAGE_SIZE,
      offset,
    }),
    getCustomerProfile(auth.user.id, auth.accessToken),
  ]);

  const bookings = bookingsResult.items;
  const totalCount = bookingsResult.totalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / BOOKINGS_PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        selectedCity={profile?.city || "Port Harcourt"}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">My Bookings</h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Track and manage all your home & facility service requests
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request New Service
          </Link>
        </div>

        {/* Tab Filters: All, Active, Completed, Cancelled */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
          {[
            { id: "all", label: "All Bookings" },
            { id: "active", label: "Active Requests" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <Link
                key={t.id}
                href={`/bookings?tab=${t.id}`}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusColors: Record<string, string> = {
                open: "bg-blue-100 text-blue-800",
                matched: "bg-purple-100 text-purple-800",
                quoted: "bg-amber-100 text-amber-800",
                accepted: "bg-emerald-100 text-emerald-800",
                scheduled: "bg-teal-100 text-teal-800",
                in_progress: "bg-indigo-100 text-indigo-800",
                completed: "bg-green-100 text-green-800",
                cancelled: "bg-gray-100 text-gray-800",
              };

              const badgeClass = statusColors[booking.status] || "bg-gray-100 text-gray-800";

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-0.5 rounded-md border border-[#CCFBF1]">
                        {booking.reference_code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${badgeClass}`}>
                        {booking.status.replace(/_/g, " ")}
                      </span>
                      {booking.category && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium">
                          {booking.category.name}
                        </span>
                      )}
                      {booking.urgency === "emergency" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] animate-pulse">
                          🚨 Emergency
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                      {booking.title}
                    </h2>

                    <p className="text-xs text-[#64748B] line-clamp-2">
                      {booking.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                      <span>📍 {booking.service_address}, {booking.city}</span>
                      {booking.preferred_date && (
                        <span>📅 Preferred: {booking.preferred_date} ({booking.preferred_time_slot || "Anytime"})</span>
                      )}
                      <span>🕒 Submitted: {new Date(booking.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 text-xs text-[#64748B]">
                <span>
                  Showing <strong className="text-[#0F172A]">{offset + 1}</strong>–
                  <strong className="text-[#0F172A]">{Math.min(offset + bookings.length, totalCount)}</strong> of{" "}
                  <strong className="text-[#0F172A]">{totalCount}</strong> bookings (Page {currentPage} of {totalPages})
                </span>
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={`/bookings?tab=${encodeURIComponent(tab)}&page=${currentPage - 1}`}
                      className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8]">
                      ← Previous
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <Link
                      href={`/bookings?tab=${encodeURIComponent(tab)}&page=${currentPage + 1}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] font-semibold text-white hover:bg-[#0D655E] transition-colors"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8]">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#F0FDFA] text-[#0F766E] text-2xl mx-auto flex items-center justify-center font-bold">
              📋
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#0F172A]">No bookings in this tab</h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                {tab === "all"
                  ? "You haven't placed any service requests yet. When you request a repair, it will appear here with live dispatch updates."
                  : `You have no ${tab} service requests.`}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm"
              >
                Request a Service Now
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
