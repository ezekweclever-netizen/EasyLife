import React from "react";
import type { Metadata } from "next";
import { fetchStructuredPlatformSettings } from "@/app/actions/admin";
import { PlatformSettingsClient } from "@/components/admin/platform-settings-client";

export const metadata: Metadata = {
  title: "Platform Settings — EasyLife Administration",
  description:
    "Manage EasyLife general configuration, registration policies, service marketplace rules, financial settings, notifications, and security controls.",
};

export default async function AdminSettingsPage() {
  const initialBundle = await fetchStructuredPlatformSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Platform Administration
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Configuration &amp; Policies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure EasyLife&apos;s general identity, user registration rules, marketplace controls, financial policies, notifications, and security standards.
          </p>
        </div>
      </div>

      <PlatformSettingsClient initialBundle={initialBundle} />
    </div>
  );
}
