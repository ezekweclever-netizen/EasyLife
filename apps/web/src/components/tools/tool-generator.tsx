"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface ApplianceSpec {
  id: string;
  name: string;
  runningWatts: number;
  surgeWatts: number;
  qty: number;
}

export function ToolGenerator() {
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "gas">("petrol");
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState("1050");
  const [dailyHours, setDailyHours] = useState("6");

  const [appliances, setAppliances] = useState<ApplianceSpec[]>([
    { id: "1", name: "1.5 HP Inverter Split AC", runningWatts: 1100, surgeWatts: 1400, qty: 1 },
    { id: "2", name: "Deep Freezer / Chest Refrigerator", runningWatts: 350, surgeWatts: 1200, qty: 1 },
    { id: "3", name: "1.0 HP Submersible Borehole Water Pump", runningWatts: 800, surgeWatts: 2400, qty: 1 },
    { id: "4", name: "55\" LED Smart TV & Soundbar", runningWatts: 150, surgeWatts: 180, qty: 1 },
    { id: "5", name: "Standing Fans (High Speed)", runningWatts: 70, surgeWatts: 120, qty: 3 },
    { id: "6", name: "LED House Lighting (Rooms & Security)", runningWatts: 15, surgeWatts: 15, qty: 8 },
    { id: "7", name: "Microwave Oven / Electric Kettle", runningWatts: 1200, surgeWatts: 1500, qty: 0 },
    { id: "8", name: "Electric Steam Iron", runningWatts: 1500, surgeWatts: 1500, qty: 0 },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const updateQty = (id: string, delta: number) => {
    setAppliances(
      appliances.map((app) => {
        if (app.id !== id) return app;
        const newQty = Math.max(0, app.qty + delta);
        return { ...app, qty: newQty };
      })
    );
  };

  const totalRunningWatts = appliances.reduce((sum, a) => sum + a.runningWatts * a.qty, 0);
  const totalSurgeWatts = appliances.reduce((sum, a) => sum + (a.surgeWatts || a.runningWatts) * a.qty, 0);

  // Recommended Generator in kVA with 25% safety overhead and 0.8 power factor
  const minKva = (totalSurgeWatts * 1.25) / (1000 * 0.8);
  const recommendedKva = Math.max(1.5, Math.ceil(minKva * 2) / 2); // rounded to nearest 0.5 kVA

  // Fuel consumption estimate
  // Typical petrol gens consume ~0.4L / kVA / hour at 75% load; diesel ~0.28L / kVA / hour
  const fuelFactor = fuelType === "diesel" ? 0.28 : 0.42;
  const litresPerHour = (recommendedKva * 0.7 * fuelFactor);
  const price = parseFloat(fuelPricePerLitre) || 1050;
  const hours = parseFloat(dailyHours) || 6;

  const costPerHour = litresPerHour * price;
  const dailyCost = costPerHour * hours;
  const monthlyCost = dailyCost * 30;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Energy &amp; Facilities
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Generator Load &amp; Fuel Sizing Calculator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Audit running watts, peak motor surge capacity, recommended kVA generator, and monthly fuel expense.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Fuel & Operating Variables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <label className="block font-bold mb-1">Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => {
                const ft = e.target.value as any;
                setFuelType(ft);
                if (ft === "diesel") setFuelPricePerLitre("1250");
                else setFuelPricePerLitre("1050");
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
            >
              <option value="petrol">Petrol (PMS)</option>
              <option value="diesel">Automotive Diesel (AGO)</option>
              <option value="gas">LPG / Dual-Fuel Gas</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Fuel Pump Price (₦ / Litre)</label>
            <input
              type="number"
              value={fuelPricePerLitre}
              onChange={(e) => setFuelPricePerLitre(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] font-mono"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Daily Runtime (Hours / Day)</label>
            <input
              type="number"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] font-mono"
            />
          </div>
        </div>

        {/* Appliances Load Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Select Connected Equipment &amp; Appliances
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {appliances.map((app) => (
              <div
                key={app.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  app.qty > 0
                    ? "bg-teal-50/70 dark:bg-teal-950/40 border-[#0D9488]"
                    : "bg-white dark:bg-[#0D223A] border-slate-200 dark:border-slate-700"
                }`}
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{app.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {app.runningWatts}W running • {app.surgeWatts}W surge
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(app.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold font-mono text-sm">{app.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(app.id, 1)}
                    className="w-7 h-7 rounded-lg bg-[#0D9488] text-white font-bold flex items-center justify-center hover:bg-[#0B7A6F] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Results Card */}
        <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-[#0D223A] border border-teal-200/90 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Running Load</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {totalRunningWatts.toLocaleString()} W
            </div>
            <span className="text-[10px] text-slate-400">Peak Surge: {totalSurgeWatts.toLocaleString()} W</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Recommended Generator</span>
            <div className="text-xl sm:text-2xl font-black text-[#0D9488] dark:text-[#5CD3D5] font-mono mt-0.5">
              {recommendedKva} kVA
            </div>
            <span className="text-[10px] text-slate-400">Includes 25% buffer</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hourly Fuel Cost</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              ~₦{Math.round(costPerHour).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">~{litresPerHour.toFixed(1)} L / hr</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Monthly Fuel Budget</span>
            <div className="text-lg sm:text-xl font-black text-rose-600 font-mono mt-0.5">
              ₦{Math.round(monthlyCost).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Based on {hours} hrs/day</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Power Audit &amp; Sizing Report</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Facility Power Audit & Generator Sizing Report"
        badge="Power Engineering Audit"
        filename="generator-power-audit-report.pdf"
        summaryText={`EasyLife Power Audit Report\nTotal Load: ${totalRunningWatts}W (Peak ${totalSurgeWatts}W)\nRecommended Generator: ${recommendedKva} kVA\nFuel Type: ${fuelType.toUpperCase()}\nEstimated Monthly Fuel Budget: ₦${Math.round(monthlyCost).toLocaleString()} (${hours} hrs/day)`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Electrical Facility Engineering &amp; Fuel Auditing
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Power Audit &amp; Generator Sizing Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Energy Assessment Protocol • Fuel Basis: {fuelType.toUpperCase()} @ ₦{price}/L
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-center">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Running Load</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{totalRunningWatts.toLocaleString()} W</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Genset</span>
              <span className="text-xl font-black text-[#0D9488] font-mono mt-0.5 block">{recommendedKva} kVA</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Projected Monthly Fuel</span>
              <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">₦{Math.round(monthlyCost).toLocaleString()}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Connected Appliance</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Running (W)</th>
                  <th className="p-2.5 text-right">Total (W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {appliances
                  .filter((a) => a.qty > 0)
                  .map((a) => (
                    <tr key={a.id}>
                      <td className="p-2 font-medium">{a.name}</td>
                      <td className="p-2 text-center font-mono">{a.qty}</td>
                      <td className="p-2 text-right font-mono text-slate-600">{a.runningWatts} W</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {(a.runningWatts * a.qty).toLocaleString()} W
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
