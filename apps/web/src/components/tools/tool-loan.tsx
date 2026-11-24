"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface AmortizationRow {
  month: number;
  opening: number;
  principal: number;
  interest: number;
  total: number;
  closing: number;
}

export function ToolLoan() {
  const [principal, setPrincipal] = useState("1000000");
  const [annualRate, setAnnualRate] = useState("18");
  const [months, setMonths] = useState("12");
  const [calcMethod, setCalcMethod] = useState<"reducing" | "flat">("reducing");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const P = parseFloat(principal) || 0;
  const rate = parseFloat(annualRate) || 0;
  const n = parseInt(months, 10) || 1;

  let monthlyPayment = 0;
  let totalInterest = 0;
  let totalRepayment = 0;

  const schedule: AmortizationRow[] = [];

  if (calcMethod === "reducing") {
    const r = (rate / 100) / 12;
    if (P > 0 && r > 0 && n > 0) {
      monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else if (P > 0 && n > 0) {
      monthlyPayment = P / n;
    }
    totalRepayment = monthlyPayment * n;
    totalInterest = Math.max(0, totalRepayment - P);

    let curBalance = P;
    for (let i = 1; i <= n; i++) {
      const interestPart = curBalance * r;
      const principalPart = monthlyPayment - interestPart;
      const closing = Math.max(0, curBalance - principalPart);
      schedule.push({
        month: i,
        opening: curBalance,
        principal: principalPart,
        interest: interestPart,
        total: monthlyPayment,
        closing,
      });
      curBalance = closing;
    }
  } else {
    // Flat Rate
    totalInterest = P * (rate / 100) * (n / 12);
    totalRepayment = P + totalInterest;
    monthlyPayment = totalRepayment / n;
    const monthlyPrincipal = P / n;
    const monthlyInt = totalInterest / n;

    let curBalance = P;
    for (let i = 1; i <= n; i++) {
      const closing = Math.max(0, curBalance - monthlyPrincipal);
      schedule.push({
        month: i,
        opening: curBalance,
        principal: monthlyPrincipal,
        interest: monthlyInt,
        total: monthlyPayment,
        closing,
      });
      curBalance = closing;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Credit &amp; Amortization
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Loan Repayment &amp; Amortization Calculator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Calculate monthly installments (EMI), total interest, and full repayment schedules in Naira (₦) for micro-loans and SME credit.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Principal Loan Amount (₦)
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tenure (Months)
            </label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Calculation Type
            </label>
            <select
              value={calcMethod}
              onChange={(e) => setCalcMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="reducing">Reducing Balance (Standard EMI)</option>
              <option value="flat">Flat Interest Rate</option>
            </select>
          </div>
        </div>

        {/* Results Card */}
        <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-[#0D223A] border border-teal-200/90 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Monthly Repayment (EMI)</span>
            <div className="text-xl sm:text-2xl font-black text-[#0D9488] dark:text-[#5CD3D5] mt-1 font-mono">
              ₦{Math.round(monthlyPayment).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Interest Payable</span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono">
              ₦{Math.round(totalInterest).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Repayment Amount</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₦{Math.round(totalRepayment).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Complete Amortization Schedule</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Loan Amortization Schedule & Financial Statement"
        badge="Credit Facility Schedule"
        filename="loan-amortization-schedule.pdf"
        summaryText={`EasyLife Loan Amortization Statement\nPrincipal: ₦${P.toLocaleString()}\nRate: ${rate}% p.a. (${calcMethod})\nTenure: ${n} Months\nMonthly EMI: ₦${Math.round(monthlyPayment).toLocaleString()}\nTotal Interest: ₦${Math.round(totalInterest).toLocaleString()}`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Amortization &amp; Debt Service Schedule
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Loan Repayment Statement
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Computation: {calcMethod === "reducing" ? "Reducing Balance (Standard EMI)" : "Flat Rate Calculation"}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-center">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Principal</span>
              <span className="font-bold text-slate-900 font-mono">₦{P.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Rate</span>
              <span className="font-bold text-slate-900">{rate}% p.a.</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenure</span>
              <span className="font-bold text-slate-900">{n} Months</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Installment</span>
              <span className="font-bold text-[#0D9488] font-mono">₦{Math.round(monthlyPayment).toLocaleString()}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5 text-center">Mo</th>
                  <th className="p-2.5 text-right">Opening (₦)</th>
                  <th className="p-2.5 text-right">Principal (₦)</th>
                  <th className="p-2.5 text-right">Interest (₦)</th>
                  <th className="p-2.5 text-right">EMI (₦)</th>
                  <th className="p-2.5 text-right">Closing (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {schedule.map((row) => (
                  <tr key={row.month} className={row.month % 2 === 0 ? "bg-slate-50/50" : ""}>
                    <td className="p-2 text-center font-bold">{row.month}</td>
                    <td className="p-2 text-right text-slate-600">{Math.round(row.opening).toLocaleString()}</td>
                    <td className="p-2 text-right text-slate-900">{Math.round(row.principal).toLocaleString()}</td>
                    <td className="p-2 text-right text-rose-600">{Math.round(row.interest).toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-[#0D9488]">{Math.round(row.total).toLocaleString()}</td>
                    <td className="p-2 text-right font-semibold text-slate-800">{Math.round(row.closing).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="p-2.5 uppercase text-slate-700">Total Payments</td>
                  <td className="p-2.5 text-right font-mono">₦{P.toLocaleString()}</td>
                  <td className="p-2.5 text-right text-rose-600 font-mono">₦{Math.round(totalInterest).toLocaleString()}</td>
                  <td className="p-2.5 text-right text-[#0D9488] font-mono">₦{Math.round(totalRepayment).toLocaleString()}</td>
                  <td className="p-2.5 text-right text-emerald-700 font-mono">₦0</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
