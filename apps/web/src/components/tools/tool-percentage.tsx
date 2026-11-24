"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolPercentage() {
  // Mode 1: X% of Y
  const [valA, setValA] = useState("15");
  const [valB, setValB] = useState("250000");

  // Mode 2: % Change
  const [fromVal, setFromVal] = useState("45000");
  const [toVal, setToVal] = useState("62000");

  // Mode 3: Trade Markup & Gross Margin
  const [costPrice, setCostPrice] = useState("120000");
  const [markupPercent, setMarkupPercent] = useState("35");

  // Mode 4: 7.5% Nigerian VAT
  const [grossOrNet, setGrossOrNet] = useState<"add" | "remove">("add");
  const [vatAmountInput, setVatAmountInput] = useState("500000");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Calculations
  const percentOf = ((parseFloat(valA) || 0) / 100) * (parseFloat(valB) || 0);

  const numFrom = parseFloat(fromVal) || 0;
  const numTo = parseFloat(toVal) || 0;
  const percentChange = numFrom !== 0 ? (((numTo - numFrom) / numFrom) * 100).toFixed(2) : "0";

  const cost = parseFloat(costPrice) || 0;
  const markup = parseFloat(markupPercent) || 0;
  const sellingPrice = cost * (1 + markup / 100);
  const grossProfit = sellingPrice - cost;
  const grossMargin = sellingPrice > 0 ? ((grossProfit / sellingPrice) * 100).toFixed(1) : "0";

  const vatBase = parseFloat(vatAmountInput) || 0;
  let vatResultNet = 0;
  let vatResultVat = 0;
  let vatResultGross = 0;
  if (grossOrNet === "add") {
    vatResultNet = vatBase;
    vatResultVat = vatBase * 0.075;
    vatResultGross = vatBase + vatResultVat;
  } else {
    vatResultGross = vatBase;
    vatResultNet = vatBase / 1.075;
    vatResultVat = vatResultGross - vatResultNet;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Instant Commercial Math
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Percentage, Trade Markup &amp; VAT Calculator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Calculate trade discounts, profit margins, cost markups, and statutory 7.5% Nigerian VAT with zero mobile overflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: X% of Y */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              1. Percentage of an Amount
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">X% of Y</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={valA}
                onChange={(e) => setValA(e.target.value)}
                className="w-24 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs text-center font-mono"
              />
              <span className="text-xs font-bold">% of</span>
            </div>
            <input
              type="number"
              value={valB}
              onChange={(e) => setValB(e.target.value)}
              placeholder="Total Base (₦)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-teal-50/70 dark:bg-[#071526] rounded-xl border border-teal-500/30 flex justify-between items-center text-xs sm:text-sm">
            <span className="text-slate-500">Result:</span>
            <span className="font-black text-base text-[#0D9488] font-mono">
              ₦{Math.round(percentOf).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Module 2: % Change */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              2. Price Increase / Decrease
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Delta %</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
              placeholder="From (₦)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-mono"
            />
            <span className="text-xs font-bold self-center">to</span>
            <input
              type="number"
              value={toVal}
              onChange={(e) => setToVal(e.target.value)}
              placeholder="To (₦)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-teal-50/70 dark:bg-[#071526] rounded-xl border border-teal-500/30 flex justify-between items-center text-xs sm:text-sm">
            <span className="text-slate-500">Percentage Shift:</span>
            <span
              className={`font-black text-base font-mono ${
                parseFloat(percentChange) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {parseFloat(percentChange) >= 0 ? `+${percentChange}%` : `${percentChange}%`}
            </span>
          </div>
        </div>

        {/* Module 3: Trade Markup vs Gross Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              3. Trade Markup &amp; Gross Margin
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Pricing</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Cost Price (₦)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-mono"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">+</span>
              <input
                type="number"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                placeholder="Markup %"
                className="w-24 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs text-center font-mono"
              />
              <span className="text-xs font-bold">%</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 dark:bg-[#071526] rounded-xl border border-teal-500/30 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Selling Price</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ₦{Math.round(sellingPrice).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Gross Profit</span>
              <span className="font-bold text-[#0D9488] font-mono">
                ₦{Math.round(grossProfit).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Gross Margin</span>
              <span className="font-bold text-emerald-600 font-mono">
                {grossMargin}%
              </span>
            </div>
          </div>
        </div>

        {/* Module 4: 7.5% Nigerian VAT */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
              4. Statutory 7.5% Nigerian VAT
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">FIRS VAT</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setGrossOrNet("add")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                grossOrNet === "add"
                  ? "bg-[#0D9488] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Add 7.5% to Net Base
            </button>
            <button
              type="button"
              onClick={() => setGrossOrNet("remove")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                grossOrNet === "remove"
                  ? "bg-[#0D9488] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Extract VAT from Gross
            </button>
          </div>

          <div>
            <input
              type="number"
              value={vatAmountInput}
              onChange={(e) => setVatAmountInput(e.target.value)}
              placeholder="Enter Amount in Naira (₦)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-teal-50/70 dark:bg-[#071526] rounded-xl border border-teal-500/30 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Net Base</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ₦{Math.round(vatResultNet).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">7.5% VAT</span>
              <span className="font-bold text-amber-600 font-mono">
                ₦{Math.round(vatResultVat).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Gross Total</span>
              <span className="font-bold text-[#0D9488] font-mono">
                ₦{Math.round(vatResultGross).toLocaleString()}
              </span>
            </div>
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
          <span>👁️ View Pricing &amp; VAT Audit Sheet</span>
        </button>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Pricing, Trade Markup & VAT Audit Sheet"
        badge="Financial Computation"
        filename="pricing-markup-vat-audit.pdf"
        summaryText={`EasyLife Financial Pricing & VAT Audit\nMarkup Calculation: Cost ₦${cost.toLocaleString()} + ${markup}% = ₦${Math.round(sellingPrice).toLocaleString()} (Margin: ${grossMargin}%)\nVAT Analysis: Net ₦${Math.round(vatResultNet).toLocaleString()} + 7.5% VAT ₦${Math.round(vatResultVat).toLocaleString()} = Gross ₦${Math.round(vatResultGross).toLocaleString()}`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Financial Analysis &amp; Tax Computation
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Pricing, Margin &amp; Statutory VAT Audit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Calculations Compliant with Nigerian Tax Standards
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Trade Markup &amp; Margin Model
              </span>
              <div className="flex justify-between">
                <span>Unit Cost Price:</span>
                <span className="font-mono font-bold">₦{cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Applied Markup:</span>
                <span className="font-mono font-bold">{markup}%</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>Recommended Selling Price:</span>
                <span className="font-mono text-[#0D9488]">₦{Math.round(sellingPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Gross Margin:</span>
                <span className="font-mono font-bold">{grossMargin}%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                FIRS 7.5% VAT Schedule
              </span>
              <div className="flex justify-between">
                <span>Net Commercial Base:</span>
                <span className="font-mono font-bold">₦{Math.round(vatResultNet).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Output VAT Payable (7.5%):</span>
                <span className="font-mono">₦{Math.round(vatResultVat).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>Gross Customer Invoice:</span>
                <span className="font-mono text-[#0D9488]">₦{Math.round(vatResultGross).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-teal-900 block">Summary Computation Notes</span>
            <p className="text-teal-800 leading-relaxed">
              Calculations assume a standard commercial trading model with immediate VAT liability payable to the Federal Inland Revenue Service by the 21st day of the following calendar month.
            </p>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
