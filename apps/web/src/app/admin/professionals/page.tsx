import React from "react";
import type { Metadata } from "next";
import { fetchAdminProfessionals } from "@/app/actions/admin";
import { ProfessionalManagerClient } from "@/components/admin/professional-manager-client";

export const metadata: Metadata = {
  title: "Professional Service Providers — EasyLife Administration",
  description: "Manage accredited artisans, technicians, and trade professionals across regional markets.",
};

interface AdminProfessionalsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminProfessionalsPage({
  searchParams,
}: AdminProfessionalsPageProps) {
  const { status = "all" } = await searchParams;
  const normalizedStatus =
    status === "verified" ? "approved" : status || "all";

  const pros = await fetchAdminProfessionals({
    verificationStatus: normalizedStatus,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Provider Roster
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Accredited Marketplace Artisans
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Professional Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review service providers, inspect callout fee benchmarks, review ratings, and track verification statuses.
          </p>
        </div>
      </div>

      <ProfessionalManagerClient
        initialPros={pros as any}
        initialStatus={normalizedStatus}
      />
    </div>
  );
}
