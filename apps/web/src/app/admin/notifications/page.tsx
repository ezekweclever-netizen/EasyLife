import React from "react";
import type { Metadata } from "next";
import { fetchAdminNotificationLogs } from "@/app/actions/admin";
import { NotificationDispatchClient } from "@/components/admin/notification-dispatch-client";

export const metadata: Metadata = {
  title: "Notification Management & Dispatch — EasyLife Administration",
  description: "Send official marketplace notifications and view transmission audit logs.",
};

export default async function AdminNotificationsPage() {
  const logs = await fetchAdminNotificationLogs();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Communication Center
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Direct &amp; System Alerts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Notification Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch urgent security advisories, policy updates, and compliance notices to marketplace actors.
          </p>
        </div>
      </div>

      <NotificationDispatchClient initialLogs={logs as any} />
    </div>
  );
}
