import React from "react";
import type { Metadata } from "next";
import { fetchAdminCommissionSettings } from "@/app/actions/admin";
import { CommissionConfigClient } from "@/components/admin/commission-config-client";

export const metadata: Metadata = {
  title: "Marketplace Commission Rates & Take-Rate Configuration — EasyLife Administration",
  description: "Configure regional and category-level platform take rates, flat booking fees, and commission basis points.",
};

export default async function AdminCommissionsPage() {
  const settings = await fetchAdminCommissionSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Revenue Model
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Take-Rate Controls
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Commission Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define commission basis points and booking fees for Port Harcourt, Lagos, and Abuja transactions.
          </p>
        </div>
      </div>

      <CommissionConfigClient initialSettings={settings as any} />
    </div>
  );
}
