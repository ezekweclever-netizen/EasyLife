import React from "react";
import type { Metadata } from "next";
import { fetchAdminPlatformSettings } from "@/app/actions/admin";
import { PlatformSettingsClient } from "@/components/admin/platform-settings-client";

export const metadata: Metadata = {
  title: "Platform Operational Settings — EasyLife Administration",
  description: "Configure runtime parameters, maintenance flags, pilot cities, and marketplace switches.",
};

export default async function AdminSettingsPage() {
  const settings = await fetchAdminPlatformSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              System Control
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Operational Switches &amp; Flags
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Settings &amp; Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tune runtime behaviors, city launch lists, maintenance triggers, and global financial configurations.
          </p>
        </div>
      </div>

      <PlatformSettingsClient initialSettings={settings as any} />
    </div>
  );
}
