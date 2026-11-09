import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { AdminReviewModerator, AdminReviewItem } from "@/components/admin/admin-review-moderator";

export const metadata: Metadata = {
  title: "Customer Review Moderation & Quality Oversight — Admin Portal | EasyLife",
  description: "Audit customer ratings and written reviews, filter fraudulent or abusive content, preserve edit histories, and maintain marketplace trust.",
};

export default async function AdminReviewsPage() {
  const reviewsRes = await supabaseAdminFetch<any[]>(
    "/rest/v1/reviews?select=*,bookings(reference_code,title),professional_profiles(business_name,headline)&order=created_at.desc&limit=100"
  );

  const rawReviews = reviewsRes.ok && Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

  const reviews: AdminReviewItem[] = rawReviews.map((r) => ({
    ...r,
    booking: r.bookings || null,
    professional: r.professional_profiles || null,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 text-[#0F172A]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Service Accountability</span>
              <span>/</span>
              <span className="text-teal-700 font-bold">Review Moderation</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Customer Review Moderation &amp; Trust Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Ensure authentic customer feedback, prevent fraudulent self-reviews, preserve historical submissions, and moderate inappropriate or abusive content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/disputes"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs"
            >
              ⚖ Dispute Arbitration
            </Link>
            <Link
              href="/admin/categories"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs"
            >
              Categories
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0D655E] transition shadow-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Review Moderator Client */}
        <AdminReviewModerator initialReviews={reviews} />
      </div>
    </div>
  );
}
