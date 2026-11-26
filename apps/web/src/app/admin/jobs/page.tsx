import React from "react";
import type { Metadata } from "next";
import { fetchAdminJobs } from "@/app/actions/admin";
import { AdminJobsManager } from "@/components/admin/admin-jobs-manager";

export const metadata: Metadata = {
  title: "Jobs & Vacancies Moderation — EasyLife Administration",
  description:
    "Review trade vacancies, moderate employer postings, and govern technical employment across Port Harcourt, Lagos, and Abuja.",
};

export default async function AdminJobsPage() {
  const result = await fetchAdminJobs({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Employment Operations
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Vetted Trades &amp; Gigs Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Jobs &amp; Vacancies Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review employer postings, verify wage benchmarks, approve public listings, and monitor applicant submissions.
          </p>
        </div>
      </div>

      <AdminJobsManager
        initialVacancies={result.vacancies as any}
        totalCount={result.totalCount}
      />
    </div>
  );
}
