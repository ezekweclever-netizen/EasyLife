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
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8590C]">
            Financial Wallet &amp; Escrow
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Earnings &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            All customer payments are locked into EasyLife Escrow before you begin work, guaranteeing timely payouts.
          </p>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] transition shadow-xs self-start sm:self-auto"
        >
          Withdraw to Nigerian Bank Account
        </button>
      </div>

      {/* Top 3 Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Available Wallet Balance
          </span>
          <span className="text-3xl font-black text-[#E8590C] block">
            {formatNaira(earnings.wallet_balance_kobo)}
          </span>
          <span className="text-xs text-slate-400 mt-2 block">
            Cleared from {earnings.completed_jobs_count} completed jobs
          </span>
        </div>

        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60/30 p-6 shadow-xs">
          <span className="text-xs font-semibold text-teal-800 dark:text-[#F06A1F] block mb-1">
            Protected Escrow Balance
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white block">
            {formatNaira(earnings.in_escrow_kobo)}
          </span>
          <span className="text-xs text-teal-700 dark:text-teal-400 mt-2 block">
            Locked from customers for active jobs in progress
          </span>
        </div>

        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Total Lifetime Earnings
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white block">
            {formatNaira(earnings.total_earned_kobo)}
          </span>
          <span className="text-xs text-slate-400 mt-2 block">
            Platform fee: 10% transparent commission
          </span>
        </div>
      </div>

      {/* Nigerian Bank Account Payout Destination */}
      <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Registered Nigerian Bank Account for Payouts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Escrow disbursements are automatically credited via NIBSS instant settlement within 2 hours of customer job sign-off.
            </p>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
          >
            Update Bank Details
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Bank Name</span>
            <span className="font-bold text-slate-900 dark:text-white">Access Bank Nigeria</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Number</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">•••• •••• 7821</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Name</span>
            <span className="font-bold text-slate-900 dark:text-white">{profile.business_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Verification Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold">
              ✓ NUBAN Verified
            </span>
          </div>
        </div>
      </div>

      {/* Transactions & Escrow Ledger */}
      <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Escrow Payouts &amp; Completed Jobs Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transparent itemized deductions showing gross customer fee, 10% platform commission, and net payout.
            </p>
          </div>
        </div>

        {earnings.transactions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328]">
            <span className="text-2xl block mb-2">💳</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              No transactions recorded yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              When you complete jobs and customers sign off, payouts will be detailed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#2E343B]">
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
              <tbody className="divide-y divide-slate-100 text-slate-800 dark:text-slate-100">
                {earnings.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(tx.date).toLocaleDateString("en-NG")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{tx.title}</div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tx.booking_reference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {tx.customer_location}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatNaira(tx.gross_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400">
                      -{formatNaira(tx.platform_fee_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#E8590C]">
                      {formatNaira(tx.net_kobo)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === "paid_to_wallet"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : tx.status === "in_escrow"
                            ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#F06A1F] border border-teal-200 dark:border-teal-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
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
