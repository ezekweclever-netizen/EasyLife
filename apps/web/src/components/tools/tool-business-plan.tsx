"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolBusinessPlan() {
  const [bizName, setBizName] = useState("PrimeFlow Logistics");
  const [industry, setIndustry] = useState("Cold-Chain & Food Haulage");
  const [city, setCity] = useState("Port Harcourt");
  const [capital, setCapital] = useState("3500000");
  const [targetRev, setTargetRev] = useState("1200000");

  const [execSummary, setExecSummary] = useState(
    "To provide timely, temperature-controlled dispatch and intra-state goods delivery for food vendors, supermarkets, and pharmaceutical outlets across Port Harcourt and Rivers State."
  );
  const [targetMarket, setTargetMarket] = useState(
    "SME grocery vendors, seafood merchants in Creek Road / Borokiri, pharmacy wholesalers, and e-commerce meal delivery businesses requiring refrigerated or insulated transport."
  );
  const [operations, setOperations] = useState(
    "Operate an initial fleet of 2 insulated mini-vans and 3 dispatch bikes. Maintain a centralized booking desk in Trans-Amadi with GPS telematics tracking for fuel and route efficiency."
  );
  const [marketing, setMarketing] = useState(
    "Direct B2B retainers with food processors, merchant onboarding discounts (15% off first 5 trips), active WhatsApp Business status ordering, and EasyLife Pro verified directory listings."
  );
  const [risks, setRisks] = useState(
    "Diesel and PMS pump price volatility (mitigated by bulk weekly depot fuel purchasing), road traffic gridlock (addressed with GPS route optimization), and vehicle breakdown (covered by preventative scheduled servicing)."
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const cap = parseFloat(capital) || 0;
  const rev = parseFloat(targetRev) || 0;
  const cogs = rev * 0.42; // fuel, dispatch driver commissions
  const opex = rev * 0.28; // maintenance, garage rent, tracker subscriptions
  const grossProfit = rev - cogs;
  const netProfit = grossProfit - opex;
  const netMargin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#E8590C] dark:text-[#F06A1F] uppercase tracking-wider">
          Enterprise Strategy
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Executive Business Plan &amp; Feasibility Assistant
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Structure a comprehensive 6-part business plan with realistic operational models, 12-month financial projections, and risk mitigations.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#1F2328] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Industry Focus
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Headquarters City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Capital Expenditure (₦)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Monthly Turnover (₦)
            </label>
            <input
              type="number"
              value={targetRev}
              onChange={(e) => setTargetRev(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-medium"
            />
          </div>
        </div>

        {/* Financial Forecast Overview Card */}
        <div className="p-4 rounded-xl bg-[#FCEBDD]/70 dark:bg-[#1F2328] border border-[#E8590C]/30/90 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Target</span>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              ₦{rev.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated COGS</span>
            <div className="text-sm font-black text-rose-600 mt-0.5">
              ₦{Math.round(cogs).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Projected Net Profit</span>
            <div className="text-sm font-black text-[#E8590C] dark:text-[#F06A1F] mt-0.5">
              ₦{Math.round(netProfit).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Net Margin</span>
            <div className="text-sm font-black text-emerald-600 mt-0.5">
              {netMargin}%
            </div>
          </div>
        </div>

        {/* Editable Narrative Sections */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              1. Executive Summary &amp; Mission
            </label>
            <textarea
              value={execSummary}
              onChange={(e) => setExecSummary(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              2. Target Market &amp; Ideal Customers
            </label>
            <textarea
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              3. Operational &amp; Fleet Strategy
            </label>
            <textarea
              value={operations}
              onChange={(e) => setOperations(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              4. Marketing &amp; Sales Channels
            </label>
            <textarea
              value={marketing}
              onChange={(e) => setMarketing(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              5. Risk Management &amp; Contingencies
            </label>
            <textarea
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Formal Business Plan Document</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Business Plan — ${bizName}`}
        badge="Executive Feasibility Study"
        filename={`business-plan-${bizName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`EasyLife Executive Business Plan: ${bizName}\nIndustry: ${industry}\nLocation: ${city}\nInitial Capital: ₦${cap.toLocaleString()}\nProjected Monthly Revenue: ₦${rev.toLocaleString()}\nNet Profit: ₦${Math.round(netProfit).toLocaleString()} (${netMargin}% margin)`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#E8590C] uppercase tracking-wider">
              Confidential Business Plan &amp; Feasibility Study
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {bizName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sector: {industry} • Primary Operating Base: {city}, Nigeria
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              1. Executive Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              {execSummary}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              2. Target Market &amp; Customer Profile
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              {targetMarket}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              3. Operational Plan &amp; Logistics
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              {operations}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
              4. Pro-Forma Financial Summary (Monthly Operating Run-Rate)
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[11px] font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Financial Metric</th>
                    <th className="p-2.5 text-right">Monthly (₦)</th>
                    <th className="p-2.5 text-right">Annualized (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-medium">Initial Capital Investment</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">₦{cap.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-slate-500">Upfront</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Projected Gross Revenue</td>
                    <td className="p-2.5 text-right font-bold text-[#E8590C]">₦{rev.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-[#E8590C]">₦{(rev * 12).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Cost of Operations / Direct Fuel &amp; Drivers (42%)</td>
                    <td className="p-2.5 text-right text-rose-600">₦{Math.round(cogs).toLocaleString()}</td>
                    <td className="p-2.5 text-right text-rose-600">₦{Math.round(cogs * 12).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Overheads &amp; Maintenance (28%)</td>
                    <td className="p-2.5 text-right text-slate-600">₦{Math.round(opex).toLocaleString()}</td>
                    <td className="p-2.5 text-right text-slate-600">₦{Math.round(opex * 12).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-[#FCEBDD]/50 font-black">
                    <td className="p-2.5">Net Operating Profit ({netMargin}%)</td>
                    <td className="p-2.5 text-right text-emerald-700">₦{Math.round(netProfit).toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-700">₦{Math.round(netProfit * 12).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              5. Marketing &amp; Customer Acquisition
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              {marketing}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              6. Risk Assessment &amp; Mitigations
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              {risks}
            </p>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
