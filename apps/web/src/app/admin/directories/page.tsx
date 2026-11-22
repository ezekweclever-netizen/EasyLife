import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import type { HealthcareFacilityRow, DirectoryReportRow, BusinessRow } from "@easylife/shared-types";
import { AdminDirectoriesManager } from "@/components/admin/admin-directories-manager";

export const metadata: Metadata = {
  title: "Directory & Verification Management — Administrator Portal | EasyLife",
  description:
    "Review local business profiles, healthcare facilities, dispatch riders, property service agents, and community policy violation reports.",
};

export default async function AdminDirectoriesPage() {
  const [reportsRes, businessesRes, facilitiesRes] = await Promise.all([
    supabaseAdminFetch<DirectoryReportRow[]>("/rest/v1/directory_reports?select=*&order=created_at.desc&limit=50"),
    supabaseAdminFetch<BusinessRow[]>("/rest/v1/businesses?select=*&order=created_at.desc&limit=50"),
    supabaseAdminFetch<HealthcareFacilityRow[]>("/rest/v1/healthcare_facilities?select=*&order=name.asc&limit=50"),
  ]);

  const reports: DirectoryReportRow[] = reportsRes.ok && Array.isArray(reportsRes.data) ? reportsRes.data : [];
  const businesses: BusinessRow[] = businessesRes.ok && Array.isArray(businessesRes.data) ? businessesRes.data : [];
  const facilities: HealthcareFacilityRow[] = facilitiesRes.ok && Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071526] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/admin/categories" className="hover:text-slate-800 dark:text-slate-100">
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-100 font-semibold">Directories &amp; Verification</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Directories, Verification &amp; Compliance Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Approve businesses, review suspicious listing reports, manage healthcare facilities, and enforce anti-listing property rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/categories"
              className="px-4 py-2 rounded-lg bg-white dark:bg-[#0D223A] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526] transition"
            >
              Categories Manager
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Dynamic Client Management Workspace */}
        <AdminDirectoriesManager
          reports={reports}
          businesses={businesses}
          facilities={facilities}
        />
      </div>
    </div>
  );
}
