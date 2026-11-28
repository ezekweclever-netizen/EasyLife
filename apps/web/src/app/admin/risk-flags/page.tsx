import React from "react";
import type { Metadata } from "next";
import { fetchRiskFlags, getRiskFlagsSummary } from "@/lib/risk/risk-engine";
import { RiskFlagsClient } from "./risk-flags-client";

export const metadata: Metadata = {
  title: "Risk Flags & Activity Audit — Admin Portal | EasyLife",
  description:
    "Review rules-based risk indicators for duplicate accounts, suspicious booking patterns, high complaint rates, and anomalous reviews.",
};

export default async function AdminRiskFlagsPage() {
  const [flagsData, summary] = await Promise.all([
    fetchRiskFlags({ limit: 50 }),
    getRiskFlagsSummary(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Marketplace Integrity &amp; Risk Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Risk Flags &amp; Activity Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Rules-based anomaly detection for duplicate accounts, abnormal velocity, repeated disputes, and circular reviews. Flags trigger administrative oversight and require documented human review.
          </p>
        </div>

        {/* Security Policy Reminder */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 max-w-sm">
          <strong className="font-bold block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
            ⚖️ Non-Accusatory Human Review Policy
          </strong>
          Risk flags are informational alerts. EasyLife strictly prohibits automatic account suspension or accusation without independent human investigation.
        </div>
      </div>

      <RiskFlagsClient initialData={flagsData} initialSummary={summary} />
    </div>
  );
}
