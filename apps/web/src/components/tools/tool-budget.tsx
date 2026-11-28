"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolBudget() {
  const [incomeSalary, setIncomeSalary] = useState("350000");
  const [incomeSide, setIncomeSide] = useState("120000");

  const [housing, setHousing] = useState("90000");
  const [powerFuel, setPowerFuel] = useState("45000");
  const [food, setFood] = useState("85000");
  const [transport, setTransport] = useState("40000");

  const [familySupport, setFamilySupport] = useState("30000");
  const [internetData, setInternetData] = useState("20000");
  const [entertainment, setEntertainment] = useState("25000");

  const [emergencySavings, setEmergencySavings] = useState("50000");
  const [cooperativeAjo, setCooperativeAjo] = useState("35000");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totalIncome = (parseFloat(incomeSalary) || 0) + (parseFloat(incomeSide) || 0);

  const needsTotal =
    (parseFloat(housing) || 0) +
    (parseFloat(powerFuel) || 0) +
    (parseFloat(food) || 0) +
    (parseFloat(transport) || 0);

  const wantsTotal =
    (parseFloat(familySupport) || 0) +
    (parseFloat(internetData) || 0) +
    (parseFloat(entertainment) || 0);

  const savingsTotal =
    (parseFloat(emergencySavings) || 0) +
    (parseFloat(cooperativeAjo) || 0);

  const totalExpenses = needsTotal + wantsTotal + savingsTotal;
  const netSurplus = totalIncome - totalExpenses;

  const needsPercent = totalIncome > 0 ? ((needsTotal / totalIncome) * 100).toFixed(1) : "0";
  const wantsPercent = totalIncome > 0 ? ((wantsTotal / totalIncome) * 100).toFixed(1) : "0";
  const savingsPercent = totalIncome > 0 ? ((savingsTotal / totalIncome) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#E8590C] dark:text-[#F06A1F] uppercase tracking-wider">
          Personal &amp; SME Cashflow
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Household &amp; SME Budget Planner
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Track monthly cashflow, monitor your savings rate, and audit against the 50/30/20 benchmark in Naira (₦).
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#1F2328] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Income Inputs */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="text-xs font-bold text-[#E8590C] uppercase tracking-wider block">
            1. Monthly Take-Home Cashflow (₦)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Primary Salary / Business Drawings</label>
              <input
                type="number"
                value={incomeSalary}
                onChange={(e) => setIncomeSalary(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Side Hustles / Trading Profits</label>
              <input
                type="number"
                value={incomeSide}
                onChange={(e) => setIncomeSide(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Expenses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs */}
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase">Essential Needs</span>
              <span className="text-[11px] font-bold text-[#E8590C]">{needsPercent}%</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Rent / Housing (₦)</label>
              <input
                type="number"
                value={housing}
                onChange={(e) => setHousing(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">NEPA &amp; Generator Fuel (₦)</label>
              <input
                type="number"
                value={powerFuel}
                onChange={(e) => setPowerFuel(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Food &amp; Groceries (₦)</label>
              <input
                type="number"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Transport &amp; Fuel (₦)</label>
              <input
                type="number"
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
          </div>

          {/* Wants */}
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase">Lifestyle / Wants</span>
              <span className="text-[11px] font-bold text-amber-600">{wantsPercent}%</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Family Support / Black Tax (₦)</label>
              <input
                type="number"
                value={familySupport}
                onChange={(e) => setFamilySupport(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Data, Calls &amp; Streaming (₦)</label>
              <input
                type="number"
                value={internetData}
                onChange={(e) => setInternetData(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Entertainment &amp; Dining (₦)</label>
              <input
                type="number"
                value={entertainment}
                onChange={(e) => setEntertainment(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
          </div>

          {/* Savings & Investments */}
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase">Savings &amp; Debt</span>
              <span className="text-[11px] font-bold text-emerald-600">{savingsPercent}%</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Emergency Fund (₦)</label>
              <input
                type="number"
                value={emergencySavings}
                onChange={(e) => setEmergencySavings(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Ajo / Esusu / Mutual Funds (₦)</label>
              <input
                type="number"
                value={cooperativeAjo}
                onChange={(e) => setCooperativeAjo(e.target.value)}
                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
          </div>
        </div>

        {/* 50/30/20 Benchmark Audit Summary Card */}
        <div className="p-6 rounded-2xl bg-[#FCEBDD]/70 dark:bg-[#1F2328] border border-[#E8590C]/30/90 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Income</span>
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              ₦{totalIncome.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Expenses</span>
            <div className="text-base sm:text-xl font-black text-rose-600 font-mono mt-0.5">
              ₦{totalExpenses.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Net Monthly Surplus</span>
            <div
              className={`text-base sm:text-xl font-black font-mono mt-0.5 ${
                netSurplus >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              ₦{netSurplus.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">50/30/20 Ratio</span>
            <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
              {needsPercent} / {wantsPercent} / {savingsPercent}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Comprehensive Budget Statement</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Monthly Cashflow & Budget Statement"
        badge="Financial Management"
        filename="monthly-budget-statement.pdf"
        summaryText={`EasyLife Budget Statement\nTotal Monthly Income: ₦${totalIncome.toLocaleString()}\nTotal Outflow: ₦${totalExpenses.toLocaleString()}\nNet Monthly Surplus: ₦${netSurplus.toLocaleString()}\nAllocation: Needs ${needsPercent}% | Wants ${wantsPercent}% | Savings ${savingsPercent}%`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#E8590C] uppercase tracking-wider">
              Household &amp; SME Financial Statement
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Monthly Cashflow &amp; Budget Audit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              50/30/20 Benchmark Analysis • Net Monthly Position: {netSurplus >= 0 ? "Surplus" : "Deficit"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-center">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Inflow</span>
              <span className="font-bold text-[#E8590C] font-mono text-sm">₦{totalIncome.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Outflow</span>
              <span className="font-bold text-rose-600 font-mono text-sm">₦{totalExpenses.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Balance</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">₦{netSurplus.toLocaleString()}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Component</th>
                  <th className="p-2.5 text-right">Amount (₦)</th>
                  <th className="p-2.5 text-right">% of Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-[#E8590C]">Essential Needs</td>
                  <td className="p-2 text-slate-600">Rent, NEPA, Food, Fuel &amp; Transport</td>
                  <td className="p-2 text-right font-mono font-bold">₦{needsTotal.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{needsPercent}% (Target: 50%)</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-amber-600">Lifestyle / Wants</td>
                  <td className="p-2 text-slate-600">Family Support, Internet &amp; Entertainment</td>
                  <td className="p-2 text-right font-mono font-bold">₦{wantsTotal.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{wantsPercent}% (Target: 30%)</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-emerald-600">Savings &amp; Esusu</td>
                  <td className="p-2 text-slate-600">Emergency Fund &amp; Cooperative Contributions</td>
                  <td className="p-2 text-right font-mono font-bold">₦{savingsTotal.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{savingsPercent}% (Target: 20%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
