"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DocumentPreviewModal } from "./document-preview-modal";

interface DiagnosticOutput {
  reportId: string;
  category: string;
  issue: string;
  urgency: string;
  city: string;
  diagnosis: string;
  safetyChecks: string[];
  partsNeeded: string[];
  laborEstimate: string;
  tradeSpecialist: string;
  dispatchCategory: string;
}

export function ToolAiAssistant() {
  const [problemText, setProblemText] = useState("");
  const [category, setCategory] = useState("generator");
  const [urgency, setUrgency] = useState("urgent");
  const [city, setCity] = useState("Port Harcourt");
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticOutput | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const PRESETS = [
    {
      label: "Generator cranking but won't start",
      category: "generator",
      text: "My Sumec Firman generator cranks vigorously when pulling the recoil rope, but the engine won't catch or ignite. Fuel tank is full.",
    },
    {
      label: "Inverter battery draining in 1 hour",
      category: "solar",
      text: "Our 2.5kVA tubular battery inverter setup drops from 100% to 20% within 45 minutes of NEPA outage with just 2 fans and TV running.",
    },
    {
      label: "AC indoor unit blowing warm air",
      category: "ac",
      text: "The Panasonic 1.5HP split unit turns on and fan runs, but outdoor compressor clicks once and does not spin. Air coming out is room temperature.",
    },
    {
      label: "Borehole pump tripping breaker",
      category: "plumbing",
      text: "Whenever we switch on the submersible borehole pump control box, the 32A distribution board breaker immediately trips with a burning smell.",
    },
  ];

  const handleDiagnose = async () => {
    if (!problemText.trim()) return;
    setIsLoading(true);

    try {
      // Heuristic intelligent domestic diagnosis engine
      const p = problemText.toLowerCase();
      let diag = "Electrical/mechanical fault detected requiring component isolation.";
      let safety = [
        "Disconnect power from main distribution board before touching any exposed terminals.",
        "Check for burning smells or melted insulation; do not force-reset tripped circuit breakers.",
        "Keep children and pets away from the equipment enclosure.",
      ];
      let parts = ["Multimeter diagnostic check", "Replacement fuse / capacitor", "Terminal wiring harness"];
      let labor = "₦12,000 – ₦25,000";
      let specialist = "Certified Electrical & Electronics Technician";
      let dispatch = "electrical-repairs";

      if (category === "generator" || p.includes("gen") || p.includes("crank") || p.includes("plug")) {
        diag = "Suspected carburetor fuel jet blockage, fouled spark plug, or low oil safety shutdown sensor trigger.";
        safety = [
          "Do not smoke or use open flames near the carburetor fuel line.",
          "Check engine oil dipstick — many modern generators will cut off spark if oil level is below minimum.",
          "Inspect spark plug boot for carbon fouling or loose terminal contact.",
        ];
        parts = ["Spark Plug (F7TC or champion equivalent)", "Carburetor overhaul kit / cleaner", "Engine oil (SAE 20W-50)"];
        labor = "₦8,000 – ₦18,000";
        specialist = "Certified Small Engine & Generator Mechanic";
        dispatch = "generator-repairs";
      } else if (category === "solar" || p.includes("inverter") || p.includes("battery")) {
        diag = "Battery cell sulfation, unequal series string voltage, or charging cut-off voltage mismatch in inverter controller.";
        safety = [
          "Do not short battery terminals with metallic spanners; severe spark hazard.",
          "Ensure inverter room has adequate ventilation to vent lead-acid battery gases.",
          "Check battery terminal posts for white/green acidic corrosion.",
        ];
        parts = ["High-rate discharge battery load test", "Terminal lugs & heavy-gauge 25mm cable", "Distilled deionized water topping (if tubular)"];
        labor = "₦15,000 – ₦35,000";
        specialist = "Solar PV & Inverter Systems Engineer";
        dispatch = "solar-inverter-repairs";
      } else if (category === "ac" || p.includes("ac") || p.includes("cooling") || p.includes("compressor")) {
        diag = "Defective outdoor compressor dual run capacitor (35-45uF), low R410A/R22 refrigerant pressure, or clogged condenser coil.";
        safety = [
          "Switch off the dedicated AC wall isolator switch before inspecting the outdoor unit.",
          "Never attempt to recharge gas without checking copper flare nuts for oily leaks.",
          "Do not touch capacitor terminals; capacitors store high residual voltage even when unplugged.",
        ];
        parts = ["Dual Run Capacitor (35uF/45uF + 5uF)", "Refrigerant pressure gauge check", "Contact cleaner & coil foam wash"];
        labor = "₦10,000 – ₦25,000";
        specialist = "HVAC & Air Conditioning Technician";
        dispatch = "ac-repairs";
      } else if (category === "plumbing" || p.includes("pump") || p.includes("water") || p.includes("borehole")) {
        diag = "Submersible motor winding insulation breakdown to earth, seized impeller, or defective start capacitor in control box.";
        safety = [
          "Immediately turn off main power to the control box; water conduct electricity.",
          "Do not attempt to pull downhole pipes without an anchor tripod and safety clamp.",
          "Inspect control box capacitors for bulging or electrolyte leakage.",
        ];
        parts = ["Submersible motor start/run capacitor (50-70uF)", "Overload thermal trip relay", "Megger winding resistance insulation test"];
        labor = "₦15,000 – ₦30,000";
        specialist = "Plumbing & Borehole Systems Specialist";
        dispatch = "plumbing-services";
      }

      const report: DiagnosticOutput = {
        reportId: `EL-DX-${Math.floor(100000 + Math.random() * 900000)}`,
        category,
        issue: problemText,
        urgency,
        city,
        diagnosis: diag,
        safetyChecks: safety,
        partsNeeded: parts,
        laborEstimate: labor,
        tradeSpecialist: specialist,
        dispatchCategory: dispatch,
      };

      setDiagnosticResult(report);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          AI Diagnostic Intelligence
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Everyday Problem &amp; Maintenance Assistant
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Describe any domestic breakdown or equipment issue in plain words to generate safety checks, cost ranges, and verified repair specs.
        </p>
      </div>

      {/* Preset Problem Buttons */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Common Nigerian Domestic Breakdowns:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCategory(preset.category);
                setProblemText(preset.text);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0D9488] hover:text-[#0D9488] transition text-left cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="generator">Generator &amp; Small Engine</option>
              <option value="solar">Solar, Inverter &amp; Batteries</option>
              <option value="ac">Air Conditioning &amp; Cooling</option>
              <option value="plumbing">Borehole, Pump &amp; Plumbing</option>
              <option value="electrical">Home Electrical &amp; DB Board</option>
              <option value="appliances">Major Home Appliances</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="normal">Standard Routine Check</option>
              <option value="urgent">Urgent (Needed within 24h)</option>
              <option value="emergency">Emergency / Safety Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="Port Harcourt">Port Harcourt, Rivers</option>
              <option value="Lagos">Lagos State</option>
              <option value="Abuja">Abuja, FCT</option>
              <option value="Ibadan">Ibadan, Oyo</option>
              <option value="Benin City">Benin City, Edo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Describe the symptoms, sounds, or errors
          </label>
          <textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            rows={3}
            placeholder="e.g. Generator is vibrating abnormally, producing black smoke, and losing power under load..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs sm:text-sm text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={handleDiagnose}
          disabled={isLoading || !problemText.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span>Analyzing Issue...</span>
          ) : (
            <>
              <span>⚡ Generate Professional Diagnostic</span>
            </>
          )}
        </button>
      </div>

      {/* Output Results & Action Bar */}
      {diagnosticResult && (
        <div className="bg-white dark:bg-[#0D223A] p-6 rounded-2xl border border-teal-500/30 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
                Report #{diagnosticResult.reportId}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Technical Diagnostic Summary
              </h3>
            </div>

            {/* Three Actions Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-bold hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>👁️ View Document</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Primary Diagnosis:
              </span>
              <p>{diagnosticResult.diagnosis}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                ⚠️ Critical Safety Checks:
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200 text-xs">
                {diagnosticResult.safetyChecks.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Parts &amp; Tooling Required:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  {diagnosticResult.partsNeeded.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Expected Labor Range ({diagnosticResult.city}):
                </span>
                <span className="text-base font-black text-[#0D9488] block">
                  {diagnosticResult.laborEstimate}
                </span>
                <span className="text-[11px] text-slate-400">
                  Recommended Specialist: {diagnosticResult.tradeSpecialist}
                </span>
              </div>
            </div>

            {/* Direct Booking Dispatch Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-200/50">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  Ready to fix this with a verified artisan?
                </span>
                <span className="text-[11px] text-slate-500">
                  Post this pre-filled request to receive competitive bids from nearby technicians.
                </span>
              </div>
              <Link
                href={`/post-a-need?category=${encodeURIComponent(diagnosticResult.dispatchCategory)}&city=${encodeURIComponent(diagnosticResult.city)}`}
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold text-center hover:bg-[#0B7A6F] transition shrink-0"
              >
                Post Need with This Diagnostic &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Document Preview Modal */}
      {diagnosticResult && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Diagnostic Report — ${diagnosticResult.reportId}`}
          badge="Technical Incident Report"
          filename={`easylife-diagnostic-${diagnosticResult.reportId.toLowerCase()}.pdf`}
          summaryText={`EasyLife Technical Diagnostic Report #${diagnosticResult.reportId}\nCategory: ${diagnosticResult.category}\nCity: ${diagnosticResult.city}\nDiagnosis: ${diagnosticResult.diagnosis}\nLabor Range: ${diagnosticResult.laborEstimate}`}
        >
          <div className="space-y-6 text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Equipment Diagnostic &amp; Incident Report
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reference: <span className="font-mono font-bold text-slate-700">{diagnosticResult.reportId}</span>
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="inline-block px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 uppercase text-[10px]">
                  Priority: {diagnosticResult.urgency}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Jurisdiction: {diagnosticResult.city}, Nigeria</p>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                Reported Symptoms
              </h2>
              <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                &ldquo;{diagnosticResult.issue}&rdquo;
              </p>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                Technical Finding &amp; Probable Cause
              </h2>
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 text-slate-900 text-sm font-medium leading-relaxed">
                {diagnosticResult.diagnosis}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                Mandatory Safety Protocols
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {diagnosticResult.safetyChecks.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      !
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
              <div>
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                  Required Spares &amp; Consumables
                </h2>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  {diagnosticResult.partsNeeded.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                  Professional Labor Benchmark
                </h2>
                <div className="text-lg font-black text-[#0D9488]">
                  {diagnosticResult.laborEstimate}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assigned Trade: <span className="font-semibold">{diagnosticResult.tradeSpecialist}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
              <span>Verified dispatch via EasyLife Verified Artisan Network</span>
              <span className="font-mono">STATUS: DISPATCH-READY</span>
            </div>
          </div>
        </DocumentPreviewModal>
      )}
    </div>
  );
}
