"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolUnit() {
  const [unitType, setUnitType] = useState<"land" | "length" | "weight" | "volume">("land");
  const [val, setVal] = useState("1");

  // Site Perimeter & Block Calculator
  const [plotLengthFt, setPlotLengthFt] = useState("100");
  const [plotWidthFt, setPlotWidthFt] = useState("50");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const num = parseFloat(val) || 0;

  // Land conversions (based on 1 Nigerian plot = 50 x 100 ft = 464.5 m²)
  const landPlots = num;
  const landSqM = num * 464.5;
  const landSqFt = num * 5000;
  const landHectares = num * 0.04645;
  const landAcres = num * 0.1148;

  // Length conversions (base metre)
  const lenM = num;
  const lenFt = num * 3.28084;
  const lenIn = num * 39.3701;
  const lenYd = num * 1.09361;

  // Weight conversions (base kg)
  const wtKg = num;
  const wtLbs = num * 2.20462;
  const wtTonnes = num * 0.001;
  const wtCementBags = num / 50; // 50kg standard Dangote/BUA bag

  // Volume conversions (base Litres)
  const volL = num;
  const volGal = num * 0.264172; // US Gallon
  const volKeg25L = num / 25;
  const volDrum200L = num / 200;

  // Fence calculation
  const lFt = parseFloat(plotLengthFt) || 0;
  const wFt = parseFloat(plotWidthFt) || 0;
  const perimeterFt = 2 * (lFt + wFt);
  const perimeterM = perimeterFt * 0.3048;
  // Standard 9-inch block is 0.45m long. 1 running meter is approx 2.22 blocks per course.
  // Standard 7-course boundary wall (approx 1.5m high): approx 15 blocks per running meter.
  const estBlocks = Math.round(perimeterM * 15);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Measurements &amp; Quantity Surveying
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Everyday, Trade &amp; Nigerian Land Unit Converter
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Convert technical units including standard Nigerian plots, construction weights, fuel volumes, and boundary wall blocks.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {(["land", "length", "weight", "volume"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setUnitType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                unitType === t
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "bg-white dark:bg-[#0D223A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {t === "land" ? "Nigerian Land Plots" : t === "weight" ? "Weight & Cement" : t === "volume" ? "Fuel & Volumes" : "Distance / Length"}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            Input Base Value ({unitType === "land" ? "Plots" : unitType === "length" ? "Metres" : unitType === "weight" ? "Kilograms" : "Litres"})
          </label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs sm:text-sm font-mono font-bold"
          />
        </div>

        {/* Dynamic Conversion Grids */}
        {unitType === "land" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Standard Plots (50 x 100 ft)</span>
              <span className="font-black text-slate-900 dark:text-white text-base mt-0.5 block font-mono">
                {landPlots} Plot(s)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Square Metres (m²)</span>
              <span className="font-black text-[#0D9488] text-base mt-0.5 block font-mono">
                {landSqM.toLocaleString()} m²
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Hectares (ha)</span>
              <span className="font-black text-slate-900 dark:text-white text-base mt-0.5 block font-mono">
                {landHectares.toFixed(4)} ha
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Acres (ac)</span>
              <span className="font-black text-slate-900 dark:text-white text-base mt-0.5 block font-mono">
                {landAcres.toFixed(4)} Acres
              </span>
            </div>
          </div>
        )}

        {unitType === "length" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Metres</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{lenM} m</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Feet</span>
              <span className="font-black text-[#0D9488] text-base font-mono">{lenFt.toFixed(2)} ft</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Inches</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{lenIn.toFixed(1)} in</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Yards</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{lenYd.toFixed(2)} yd</span>
            </div>
          </div>
        )}

        {unitType === "weight" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Kilograms</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{wtKg} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">50kg Cement Bags</span>
              <span className="font-black text-[#0D9488] text-base font-mono">{wtCementBags.toFixed(1)} Bags</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Pounds</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{wtLbs.toFixed(1)} lbs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Metric Tonnes</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{wtTonnes.toFixed(3)} t</span>
            </div>
          </div>
        )}

        {unitType === "volume" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Litres</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{volL} L</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">25L Yellow Jerrycans</span>
              <span className="font-black text-[#0D9488] text-base font-mono">{volKeg25L.toFixed(1)} Kegs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">200L Steel Drums</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{volDrum200L.toFixed(2)} Drums</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">US Gallons</span>
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">{volGal.toFixed(1)} gal</span>
            </div>
          </div>
        )}

        {/* Site Boundary Wall & Block Estimator */}
        <div className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
            Plot Boundary Fence &amp; Block Quantity Estimator
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Plot Length (Feet)</label>
              <input
                type="number"
                value={plotLengthFt}
                onChange={(e) => setPlotLengthFt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Plot Width (Feet)</label>
              <input
                type="number"
                value={plotWidthFt}
                onChange={(e) => setPlotWidthFt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 dark:bg-[#071526] rounded-xl border border-teal-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-500 block text-[10px]">Perimeter</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {perimeterFt} ft ({perimeterM.toFixed(1)} m)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Estimated 9-inch Blocks</span>
              <span className="font-black text-[#0D9488] font-mono text-sm">
                ~{estBlocks.toLocaleString()} Blocks
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Cement Needed (Est)</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ~{Math.round(estBlocks / 35)} Bags
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Technical Survey Certificate</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Technical Site Measurement & Land Survey Certificate"
        badge="Quantity Surveying Sheet"
        filename="technical-site-measurement-certificate.pdf"
        summaryText={`EasyLife Site Measurement & Quantity Survey\nLand Dimension: ${plotLengthFt} ft x ${plotWidthFt} ft (${landPlots} Plot / ${landSqM} m²)\nPerimeter: ${perimeterFt} ft (${perimeterM.toFixed(1)} m)\nEstimated 9-inch Blocks: ~${estBlocks.toLocaleString()} blocks`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Land Cadastral &amp; Quantity Surveying
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Site Measurement &amp; Survey Schedule
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard Nigerian Plot System (50ft x 100ft = 464.5 sq metres)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Surveyed Plot Area</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {landPlots} Standard Plot(s)
              </span>
              <p className="text-slate-500 mt-1">{landSqM.toLocaleString()} Square Metres (m²)</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Boundary Fence Requirement</span>
              <span className="text-xl font-black text-[#0D9488] font-mono mt-0.5 block">
                ~{estBlocks.toLocaleString()} Blocks
              </span>
              <p className="text-slate-500 mt-1">Based on {perimeterM.toFixed(1)}m perimeter wall</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Cadastral Unit</th>
                  <th className="p-2.5 text-right">Equivalent Quantity</th>
                  <th className="p-2.5 text-right">Standard Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold font-sans">Square Metres (m²)</td>
                  <td className="p-2.5 text-right font-bold text-[#0D9488]">{landSqM.toLocaleString()} m²</td>
                  <td className="p-2.5 text-right text-slate-500 font-sans">Standard metric cadastre</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Square Feet (sq ft)</td>
                  <td className="p-2.5 text-right">{landSqFt.toLocaleString()} sq ft</td>
                  <td className="p-2.5 text-right text-slate-500 font-sans">Imperial surveyor standard</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Hectares (ha)</td>
                  <td className="p-2.5 text-right">{landHectares.toFixed(4)} ha</td>
                  <td className="p-2.5 text-right text-slate-500 font-sans">10,000 m² agricultural unit</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Acres (ac)</td>
                  <td className="p-2.5 text-right">{landAcres.toFixed(4)} ac</td>
                  <td className="p-2.5 text-right text-slate-500 font-sans">Approx 6 standard plots</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
