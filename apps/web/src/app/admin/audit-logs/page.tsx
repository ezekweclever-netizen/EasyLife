import React from "react";
import type { Metadata } from "next";
import { fetchAdminAuditLogs } from "@/app/actions/admin";
import { AuditLogViewerClient } from "@/components/admin/audit-log-viewer-client";

export const metadata: Metadata = {
  title: "Immutable Privileged Audit Logs — EasyLife Administration",
  description: "Inspect cryptographically protected audit logs for all administrative operations and policy decisions.",
};

export default async function AdminAuditLogsPage() {
  const logs = await fetchAdminAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Security &amp; Compliance
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tamper-Proof Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Immutable Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete, non-deleteable chronological history of all privileged administrative events and system alterations.
          </p>
        </div>
      </div>

      <AuditLogViewerClient initialLogs={logs as any} />
    </div>
  );
}
