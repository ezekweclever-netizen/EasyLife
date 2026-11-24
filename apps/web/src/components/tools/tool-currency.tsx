"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface RateData {
  code: string;
  name: string;
  symbol: string;
  rateToNgn: number; // 1 unit in NGN
}

const CURRENCIES: Record<string, RateData> = {
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", rateToNgn: 1 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", rateToNgn: 1490 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", rateToNgn: 1910 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", rateToNgn: 1610 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", rateToNgn: 1080 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", rateToNgn: 98 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", rateToNgn: 206 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateToNgn: 11.5 },
};

export function ToolCurrency() {
  const [amount, setAmount] = useState("1000");
  const [fromCurr, setFromCurr] = useState("USD");
  const [toCurr, setToCurr] = useState("NGN");
  const [rateTier, setRateTier] = useState<"market" | "cbn">("market");
  const [cardSpreadPercent, setCardSpreadPercent] = useState("2.5");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const amt = parseFloat(amount) || 0;
  const cbnDiscount = rateTier === "cbn" ? 0.94 : 1.0;

  const fromRate = (CURRENCIES[fromCurr]?.rateToNgn || 1) * cbnDiscount;
  const toRate = (CURRENCIES[toCurr]?.rateToNgn || 1) * cbnDiscount;

  // Convert from -> NGN -> to
  const amountInNgn = amt * fromRate;
  const convertedAmount = toRate > 0 ? amountInNgn / toRate : 0;
  const spread = parseFloat(cardSpreadPercent) || 0;
  const bankSpreadCost = convertedAmount * (spread / 100);
  const netAfterSpread = convertedAmount - bankSpreadCost;

  const handleSwap = () => {
    const temp = fromCurr;
    setFromCurr(toCurr);
    setToCurr(temp);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Foreign Exchange Intelligence
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Multi-Currency Foreign Exchange Converter
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Convert between Naira (NGN), USD, GBP, EUR, CAD, GHS, CNY, and KES with official and parallel reference rate benchmarks.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Benchmark Mode:</span>
            <button
              type="button"
              onClick={() => setRateTier("market")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                rateTier === "market"
                  ? "bg-[#0D9488] text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              Open Market / FX Bureau
            </button>
            <button
              type="button"
              onClick={() => setRateTier("cbn")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                rateTier === "cbn"
                  ? "bg-[#0D9488] text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              Official CBN Reference
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Updated Daily for Nigerian Trade &amp; SME Remittances
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-mono font-bold"
              />
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value)}
                className="w-32 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-bold"
              >
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCIES[c]?.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-[#0D9488] hover:text-white transition cursor-pointer text-xs font-bold"
              title="Swap currencies"
            >
              ⇄
            </button>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Currency
            </label>
            <select
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-bold"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCIES[c]?.name} ({CURRENCIES[c]?.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Conversion Card */}
        <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-[#0D223A] border border-teal-200/90 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">
              {amt.toLocaleString()} {fromCurr} =
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0D9488] dark:text-[#5CD3D5] font-mono mt-0.5">
              {CURRENCIES[toCurr]?.symbol}
              {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              <span className="text-base text-slate-600 dark:text-slate-400 font-sans">{toCurr}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              1 {fromCurr} = {(fromRate / toRate).toFixed(4)} {toCurr}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Bank Card / Fintech Fee ({cardSpreadPercent}%):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={cardSpreadPercent}
                onChange={(e) => setCardSpreadPercent(e.target.value)}
                className="w-16 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono"
              />
              <span className="text-slate-500 font-mono">
                ~ {CURRENCIES[toCurr]?.symbol}
                {bankSpreadCost.toFixed(2)} {toCurr}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Estimated Net Value: {CURRENCIES[toCurr]?.symbol}
              {netAfterSpread.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Multi-Currency Matrix Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Simultaneous Value Across Major Currencies
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.keys(CURRENCIES).map((c) => {
              if (c === fromCurr) return null;
              const curRate = (CURRENCIES[c]?.rateToNgn || 1) * cbnDiscount;
              const converted = curRate > 0 ? amountInNgn / curRate : 0;
              return (
                <div
                  key={c}
                  className="p-2.5 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center"
                >
                  <span className="font-bold text-slate-500">{c}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {CURRENCIES[c]?.symbol}
                    {converted.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Foreign Exchange Valuation Slip</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Foreign Exchange Quotation & Trade Valuation Slip"
        badge="FX Valuation Slip"
        filename={`fx-valuation-${fromCurr.toLowerCase()}-to-${toCurr.toLowerCase()}.pdf`}
        summaryText={`EasyLife Foreign Exchange Quotation\nBase Amount: ${amt.toLocaleString()} ${fromCurr}\nConverted: ${CURRENCIES[toCurr]?.symbol}${convertedAmount.toFixed(2)} ${toCurr}\nBenchmark Rate: 1 ${fromCurr} = ${(fromRate / toRate).toFixed(4)} ${toCurr}\nCard Spread (${cardSpreadPercent}%): ${bankSpreadCost.toFixed(2)}`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              International Trade &amp; Remittance Valuation
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Foreign Exchange Quotation Slip
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Valuation Benchmark: {rateTier === "market" ? "Parallel Market / BDC Benchmark" : "Official CBN Reference"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Tender</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {amt.toLocaleString()} {fromCurr}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Converted Target Tender</span>
              <span className="text-xl font-black text-[#0D9488] font-mono mt-0.5 block">
                {CURRENCIES[toCurr]?.symbol}
                {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                {toCurr}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Currency</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5 text-right">Reference Rate to NGN</th>
                  <th className="p-2.5 text-right">Equivalent Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {Object.keys(CURRENCIES).map((c) => {
                  const curRate = (CURRENCIES[c]?.rateToNgn || 1) * cbnDiscount;
                  const converted = curRate > 0 ? amountInNgn / curRate : 0;
                  return (
                    <tr key={c}>
                      <td className="p-2 font-bold">{c}</td>
                      <td className="p-2 font-sans text-slate-600">{CURRENCIES[c]?.name}</td>
                      <td className="p-2 text-right">₦{curRate.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {CURRENCIES[c]?.symbol}
                        {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
