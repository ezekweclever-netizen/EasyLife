import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { AdminReviewModerator, AdminReviewItem } from "@/components/admin/admin-review-moderator";

export const metadata: Metadata = {
  title: "Customer Review Moderation & Quality Oversight — Admin Portal | EasyLife",
  description: "Audit customer ratings and written reviews, filter fraudulent or abusive content, preserve edit histories, and maintain marketplace trust.",
};

export default async function AdminReviewsPage() {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    redirect("/admin/login?next=%2Fadmin%2Freviews");
  }

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
    <div className="min-h-screen bg-[#FAF7F3] py-10 px-4 sm:px-6 lg:px-8 text-[#1F2328]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 dark:text-slate-100">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-100 font-semibold">Service Accountability</span>
              <span>/</span>
              <span className="text-teal-700 dark:text-teal-400 font-bold">Review Moderation</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Review Moderation &amp; Trust Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Ensure authentic customer feedback, prevent fraudulent self-reviews, preserve historical submissions, and moderate inappropriate or abusive content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/disputes"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1F2328] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition shadow-xs"
            >
              ⚖ Dispute Arbitration
            </Link>
            <Link
              href="/admin/categories"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1F2328] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition shadow-xs"
            >
              Categories
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#E8590C] text-white text-xs font-bold hover:bg-[#C84A06] transition shadow-xs"
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
