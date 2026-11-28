import React from "react";
import type { Metadata } from "next";
import { fetchAdminQuotations } from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Service Quotations & Price Monitoring — EasyLife Administration",
  description: "Track quotes issued by professionals, price variations, and customer acceptance rates.",
};

export default async function AdminQuotationsPage() {
  const quotations = await fetchAdminQuotations();

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round((kobo || 0) / 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Pricing Oversight
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Quotation Benchmarking
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Quotation Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit professional bids, examine materials vs labor breakdown, and detect price inflation across regions.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Recorded Service Quotations ({quotations.length})
          </div>
          <span className="text-2xs text-slate-400">
            Real-time trade proposals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2328]/80 border-b border-slate-200 dark:border-[#2E343B] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Booking Ref &amp; Job</th>
                <th className="py-3.5 px-4">Quoting Professional</th>
                <th className="py-3.5 px-4">Total Quote</th>
                <th className="py-3.5 px-4">Breakdown (Labor / Materials)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issued At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No quotation records submitted yet.
                  </td>
                </tr>
              ) : (
                quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-2xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {q.bookings?.reference_code || "JOB-REF"}
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white mt-1">
                        {q.bookings?.title || "Maintenance Service"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-100 font-semibold">
                      {q.professional_profiles?.business_name || "Service Provider"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatNaira(q.total_amount_kobo || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-2xs text-slate-600 dark:text-slate-300">
                      <div>Labor: <strong className="font-mono">{formatNaira(q.labor_amount_kobo || 0)}</strong></div>
                      <div>Materials: <strong className="font-mono">{formatNaira(q.materials_amount_kobo || 0)}</strong></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider border ${
                          q.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : q.status === "declined"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(q.created_at).toLocaleDateString()}
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
