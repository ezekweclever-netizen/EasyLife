"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolMoving() {
  const [homeSize, setHomeSize] = useState("2bed");
  const [distanceKm, setDistanceKm] = useState("18");
  const [floorLevel, setFloorLevel] = useState("stairs");
  const [city, setCity] = useState("Port Harcourt");

  const [includePacking, setIncludePacking] = useState(true);
  const [includeCrew, setIncludeCrew] = useState(true);
  const [includeAcTech, setIncludeAcTech] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sizing Base
  let baseTruck = 55000;
  let truckType = "Standard 5-Tonne Canter Truck";
  if (homeSize === "1bed") {
    baseTruck = 38000;
    truckType = "Mini Haulage Van / 3-Tonne Truck";
  } else if (homeSize === "4bed") {
    baseTruck = 95000;
    truckType = "Heavy 10-Tonne Freight Canter";
  } else if (homeSize === "office") {
    baseTruck = 110000;
    truckType = "Heavy Freight Truck & Trailer";
  }

  const dist = parseFloat(distanceKm) || 10;
  const distanceFee = Math.round(dist * 850);

  const floorSurcharge = floorLevel === "stairs" ? 12000 : 0;
  const packingCost = includePacking ? (homeSize === "4bed" ? 35000 : 20000) : 0;
  const crewCost = includeCrew ? (homeSize === "4bed" ? 30000 : 18000) : 0;
  const acCost = includeAcTech ? 25000 : 0;

  const total = baseTruck + distanceFee + floorSurcharge + packingCost + crewCost + acCost;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Logistics &amp; Relocation
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Relocation Manifest &amp; Haulage Estimator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Estimate truck sizing, moving crew labor, packing materials, and haulage pricing based on home size and transit distance.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Residence / Office Size</label>
            <select
              value={homeSize}
              onChange={(e) => setHomeSize(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-bold"
            >
              <option value="1bed">1-Bedroom Flat (Mini Move)</option>
              <option value="2bed">2-3 Bedroom Apartment</option>
              <option value="4bed">4+ Bedroom Duplex / House</option>
              <option value="office">Commercial Office Space</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">Transit Distance (Kilometers)</label>
            <input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Building Floor &amp; Access</label>
            <select
              value={floorLevel}
              onChange={(e) => setFloorLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            >
              <option value="ground">Ground Floor / Direct Access</option>
              <option value="stairs">1st — 3rd Floor (Staircase Carry)</option>
              <option value="elevator">Elevator / Service Lift Available</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">City Hub</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            >
              <option value="Port Harcourt">Port Harcourt, Rivers</option>
              <option value="Lagos">Lagos State</option>
              <option value="Abuja">Abuja, FCT</option>
            </select>
          </div>
        </div>

        {/* Add-ons Checkboxes */}
        <div className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Optional Relocation Support Services
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePacking}
                onChange={(e) => setIncludePacking(e.target.checked)}
              />
              <span>Packing Cartons &amp; Bubble Wrap (+₦{packingCost.toLocaleString()})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCrew}
                onChange={(e) => setIncludeCrew(e.target.checked)}
              />
              <span>Professional Loading Crew (+₦{crewCost.toLocaleString()})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAcTech}
                onChange={(e) => setIncludeAcTech(e.target.checked)}
              />
              <span>AC De-coupling &amp; Reinstallation (+₦25,000)</span>
            </label>
          </div>
        </div>

        {/* Results Card */}
        <div className="p-6 rounded-2xl bg-teal-50/70 dark:bg-[#0D223A] border border-teal-200/90 dark:border-slate-700 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Total Estimated Relocation &amp; Freight Cost
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0D9488] dark:text-[#5CD3D5] font-mono">
              ~₦{total.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              Assigned Vehicle: <span className="font-bold text-slate-800 dark:text-slate-200">{truckType}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Truck Haulage</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">₦{baseTruck.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Distance &amp; Fuel</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">₦{distanceFee.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Crew &amp; Stairs</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ₦{(crewCost + floorSurcharge).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Packing &amp; AC</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ₦{(packingCost + acCost).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#071526] p-4 rounded-xl border border-teal-200/50">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Need reliable movers and trucks in {city}?
              </span>
              <span className="text-[11px] text-slate-500">
                Post your relocation schedule on EasyLife to book vetted trucks and packing teams.
              </span>
            </div>
            <Link
              href={`/post-a-need?category=moving-relocation&city=${encodeURIComponent(city)}`}
              className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold text-center hover:bg-[#0B7A6F] transition shrink-0"
            >
              Book Moving Truck &rarr;
            </Link>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Relocation Manifest &amp; Haulage Estimate</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Relocation Manifest & Haulage Estimate Sheet"
        badge="Haulage Manifest"
        filename={`moving-manifest-${homeSize}-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`EasyLife Relocation Manifest\nLocation: ${city}\nScope: ${homeSize}\nDistance: ${distanceKm} km\nAssigned Vehicle: ${truckType}\nTotal Estimate: ₦${total.toLocaleString()}`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="border-b border-slate-900 pb-4">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Logistics, Moving &amp; Freight Manifest
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Relocation &amp; Transit Estimate Sheet
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating City: {city}, Nigeria • Transit Distance: {distanceKm} km
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Freight Vehicle</span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">{truckType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Estimated Outflow</span>
              <span className="text-xl font-black text-[#0D9488] font-mono mt-0.5 block">₦{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Manifest Component</th>
                  <th className="p-2.5 text-right">Amount (₦)</th>
                  <th className="p-2.5 text-right">Scope Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold font-sans">Base Truck Hire</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₦{baseTruck.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Dedicated haulage vehicle</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Distance &amp; Fuel Surcharge</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₦{distanceFee.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-sans text-slate-500">{distanceKm} km transit fee</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Loading &amp; Carrying Crew</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₦{(crewCost + floorSurcharge).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Includes staircase handling</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans">Packing Materials &amp; Spares</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₦{(packingCost + acCost).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-sans text-slate-500">Protective packaging supplies</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
