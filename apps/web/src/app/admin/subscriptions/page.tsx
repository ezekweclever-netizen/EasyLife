import React from "react";
import type { Metadata } from "next";
import { fetchAdminSubscriptions } from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Business Subscription Management — EasyLife Administration",
  description: "Monitor corporate plans, multi-property tier quotas, and recurring subscription statuses.",
};

export default async function AdminSubscriptionsPage() {
  const subscriptions = await fetchAdminSubscriptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Recurring Revenue
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise SaaS Tiers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Subscription Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit business subscription tiers, asset management limits, billing cycles, and status.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Enterprise Subscriptions ({subscriptions.length})
          </div>
          <span className="text-2xs text-slate-400">
            SaaS facility tiers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2328]/80 border-b border-slate-200 dark:border-[#2E343B] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Business Client</th>
                <th className="py-3.5 px-4">Tier Plan</th>
                <th className="py-3.5 px-4">Asset / Property Limit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Current Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No active corporate subscription contracts recorded.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {sub.businesses?.name || "Business Enterprise"}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {sub.businesses?.contact_email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold bg-teal-100 text-teal-800 dark:text-[#F06A1F] uppercase tracking-wider">
                        {sub.tier_name || "Enterprise"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-medium">
                      {sub.max_properties ? `${sub.max_properties} Sites` : "Unlimited Sites"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 dark:text-emerald-300">
                        {sub.status || "active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : "Rolling monthly"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
