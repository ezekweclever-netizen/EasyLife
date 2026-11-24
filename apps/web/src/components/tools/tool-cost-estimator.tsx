"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DocumentPreviewModal } from "./document-preview-modal";

interface TradePricing {
  trade: string;
  name: string;
  baseLaborMin: number;
  baseLaborMax: number;
  basePartsMin: number;
  basePartsMax: number;
  dispatchCategory: string;
}

const TRADES: Record<string, TradePricing> = {
  ac: {
    trade: "ac",
    name: "Air Conditioning (AC) Servicing & Repair",
    baseLaborMin: 12000,
    baseLaborMax: 25000,
    basePartsMin: 15000,
    basePartsMax: 45000,
    dispatchCategory: "ac-repairs",
  },
  generator: {
    trade: "generator",
    name: "Generator Servicing & Engine Maintenance",
    baseLaborMin: 15000,
    baseLaborMax: 35000,
    basePartsMin: 18000,
    basePartsMax: 65000,
    dispatchCategory: "generator-repairs",
  },
  plumbing: {
    trade: "plumbing",
    name: "Plumbing, Borehole & Water Pumps",
    baseLaborMin: 10000,
    baseLaborMax: 28000,
    basePartsMin: 12000,
    basePartsMax: 50000,
    dispatchCategory: "plumbing-services",
  },
  electrical: {
    trade: "electrical",
    name: "Electrical Wiring, Inverters & DB Boards",
    baseLaborMin: 12000,
    baseLaborMax: 32000,
    basePartsMin: 20000,
    basePartsMax: 80000,
    dispatchCategory: "electrical-repairs",
  },
  solar: {
    trade: "solar",
    name: "Solar PV & Battery System Installation",
    baseLaborMin: 35000,
    baseLaborMax: 95000,
    basePartsMin: 150000,
    basePartsMax: 650000,
    dispatchCategory: "solar-inverter-repairs",
  },
  painting: {
    trade: "painting",
    name: "Painting, Wall Screeding & Finishing",
    baseLaborMin: 25000,
    baseLaborMax: 65000,
    basePartsMin: 40000,
    basePartsMax: 120000,
    dispatchCategory: "home-repairs",
  },
};

export function ToolCostEstimator() {
  const [selectedTrade, setSelectedTrade] = useState("ac");
  const [city, setCity] = useState("Port Harcourt");
  const [complexity, setComplexity] = useState("standard");
  const [unitCount, setUnitCount] = useState("1");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const tConf = TRADES[selectedTrade] || TRADES["ac"]!;

  // City Multiplier
  let cityFactor = 1.0;
  if (city === "Lagos Island") cityFactor = 1.35;
  else if (city === "Lagos Mainland") cityFactor = 1.2;
  else if (city === "Abuja") cityFactor = 1.25;

  // Complexity Multiplier
  let compFactor = 1.0;
  if (complexity === "minor") compFactor = 0.65;
  else if (complexity === "major") compFactor = 2.2;

  const count = parseInt(unitCount, 10) || 1;

  const laborMin = Math.round((tConf.baseLaborMin * cityFactor * compFactor * count) / 500) * 500;
  const laborMax = Math.round((tConf.baseLaborMax * cityFactor * compFactor * count) / 500) * 500;

  const partsMin = Math.round((tConf.basePartsMin * compFactor * count) / 1000) * 1000;
  const partsMax = Math.round((tConf.basePartsMax * compFactor * count) / 1000) * 1000;

  const transportFee = city === "Lagos Island" ? 8000 : 5000;

  const totalMin = laborMin + partsMin + transportFee;
  const totalMax = laborMax + partsMax + transportFee;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Market Benchmarking
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Service Cost &amp; Workmanship Estimator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Benchmark expected labor, parts, and transport costs for technical trades across Port Harcourt, Lagos, and Abuja.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Service Trade</label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-bold"
            >
              {Object.keys(TRADES).map((k) => (
                <option key={k} value={k}>
                  {TRADES[k]?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">City / Jurisdiction</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            >
              <option value="Port Harcourt">Port Harcourt, Rivers</option>
              <option value="Lagos Island">Lagos (Island / Lekki / VI)</option>
              <option value="Lagos Mainland">Lagos (Mainland / Ikeja)</option>
              <option value="Abuja">Abuja, FCT</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">Complexity Level</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            >
              <option value="minor">Minor Routine Maintenance</option>
              <option value="standard">Standard Component Overhaul</option>
              <option value="major">Major Installation / Rebuilding</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">Scope Quantity / Units</label>
            <input
              type="number"
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value)}
              min={1}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-mono font-bold"
            />
          </div>
        </div>

        {/* Results Card */}
        <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-[#0D223A] border border-teal-200/90 dark:border-slate-700 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Total Estimated Project Investment ({city})
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0D9488] dark:text-[#5CD3D5] font-mono">
              ₦{totalMin.toLocaleString()} – ₦{totalMax.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              Covers verified artisan labor, standard replacement consumables, and transport logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Workmanship Labor</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₦{laborMin.toLocaleString()} – ₦{laborMax.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Spares &amp; Materials</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₦{partsMin.toLocaleString()} – ₦{partsMax.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Logistics Allowance</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₦{transportFee.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#071526] p-4 rounded-xl border border-teal-200/50">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Need competitive quotes from verified pros?
              </span>
              <span className="text-[11px] text-slate-500">
                Post this service need to receive direct proposals within your city.
              </span>
            </div>
            <Link
              href={`/post-a-need?category=${encodeURIComponent(tConf.dispatchCategory)}&city=${encodeURIComponent(city)}`}
              className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold text-center hover:bg-[#0B7A6F] transition shrink-0"
            >
              Post Need with This Estimate &rarr;
            </Link>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Cost Estimation Sheet</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Service Workmanship & Cost Estimation Sheet"
        badge="Cost Estimation Sheet"
        filename={`cost-estimate-${selectedTrade}-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`EasyLife Cost Estimation Sheet\nTrade: ${tConf.name}\nCity: ${city}\nComplexity: ${complexity}\nEstimated Project Range: ₦${totalMin.toLocaleString()} – ₦${totalMax.toLocaleString()}`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Technical Quantity Surveying &amp; Labor Benchmarking
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Service Workmanship &amp; Parts Estimate
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Trade: {tConf.name} • Location: {city}, Nigeria
            </p>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-bold text-teal-800 uppercase">Estimated Turnkey Budget</span>
            <div className="text-2xl font-black text-[#0D9488] font-mono">
              ₦{totalMin.toLocaleString()} – ₦{totalMax.toLocaleString()}
            </div>
            <p className="text-[11px] text-teal-700">Scope: {unitCount} unit(s) • {complexity} overhaul</p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Cost Component</th>
                  <th className="p-2.5 text-right">Estimated Range (₦)</th>
                  <th className="p-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold font-sans">Verified Professional Labor</td>
                  <td className="p-2.5 text-right text-slate-900 font-bold">
                    ₦{laborMin.toLocaleString()} – ₦{laborMax.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Benchmark artisan wage rate</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Materials, Spares &amp; Consumables</td>
                  <td className="p-2.5 text-right text-slate-900 font-bold">
                    ₦{partsMin.toLocaleString()} – ₦{partsMax.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Standard market parts replacement</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Site Logistics &amp; Transport</td>
                  <td className="p-2.5 text-right text-slate-900 font-bold">
                    ₦{transportFee.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Local transit allowance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
