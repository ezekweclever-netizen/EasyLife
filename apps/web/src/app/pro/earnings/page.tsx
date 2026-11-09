import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
  getProEarningsSummary,
} from "@/lib/supabase/pro";

export const metadata: Metadata = {
  title: "Earnings & Escrow Payouts — EasyLife Pro",
  description: "Track completed job earnings, escrow protections, and Nigerian bank transfers.",
};

export default async function ProEarningsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/earnings");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);
  if (!profile) {
    redirect("/pro/register");
  }

  const earnings = await getProEarningsSummary(profile.id, auth.accessToken);

  const formatNaira = (kobo: number) => {
    const naira = kobo / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(naira);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Financial Wallet &amp; Escrow
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Earnings &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            All customer payments are locked into EasyLife Escrow before you begin work, guaranteeing timely payouts.
          </p>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs self-start sm:self-auto"
        >
          Withdraw to Nigerian Bank Account
        </button>
      </div>

      {/* Top 3 Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Available Wallet Balance
          </span>
          <span className="text-3xl font-black text-[#0D9488] block">
            {formatNaira(earnings.wallet_balance_kobo)}
          </span>
          <span className="text-xs text-slate-400 mt-2 block">
            Cleared from {earnings.completed_jobs_count} completed jobs
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-teal-200 bg-teal-50/30 p-6 shadow-xs">
          <span className="text-xs font-semibold text-teal-800 block mb-1">
            Protected Escrow Balance
          </span>
          <span className="text-3xl font-black text-slate-900 block">
            {formatNaira(earnings.in_escrow_kobo)}
          </span>
          <span className="text-xs text-teal-700 mt-2 block">
            Locked from customers for active jobs in progress
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Lifetime Earnings
          </span>
          <span className="text-3xl font-black text-slate-900 block">
            {formatNaira(earnings.total_earned_kobo)}
          </span>
          <span className="text-xs text-slate-400 mt-2 block">
            Platform fee: 10% transparent commission
          </span>
        </div>
      </div>

      {/* Nigerian Bank Account Payout Destination */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registered Nigerian Bank Account for Payouts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escrow disbursements are automatically credited via NIBSS instant settlement within 2 hours of customer job sign-off.
            </p>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Update Bank Details
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Bank Name</span>
            <span className="font-bold text-slate-900">Access Bank Nigeria</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Number</span>
            <span className="font-bold text-slate-900 font-mono">•••• •••• 7821</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Name</span>
            <span className="font-bold text-slate-900">{profile.business_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Verification Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              ✓ NUBAN Verified
            </span>
          </div>
        </div>
      </div>

      {/* Transactions & Escrow Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Escrow Payouts &amp; Completed Jobs Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent itemized deductions showing gross customer fee, 10% platform commission, and net payout.
            </p>
          </div>
        </div>

        {earnings.transactions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <span className="text-2xl block mb-2">💳</span>
            <p className="text-xs font-semibold text-slate-700">
              No transactions recorded yet
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              When you complete jobs and customers sign off, payouts will be detailed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Job Reference</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Gross Agreed</th>
                  <th className="py-3 px-4 text-right">EasyLife Fee (10%)</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {earnings.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(tx.date).toLocaleDateString("en-NG")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{tx.title}</div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tx.booking_reference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {tx.customer_location}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatNaira(tx.gross_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      -{formatNaira(tx.platform_fee_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#0D9488]">
                      {formatNaira(tx.net_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === "paid_to_wallet"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : tx.status === "in_escrow"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {tx.status === "paid_to_wallet"
                          ? "Paid to Wallet"
                          : tx.status === "in_escrow"
                          ? "Locked in Escrow"
                          : "Awaiting Sign-off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
