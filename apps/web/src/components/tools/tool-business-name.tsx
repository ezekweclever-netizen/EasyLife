"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface BusinessNameIdea {
  name: string;
  slogan: string;
  cacFeasibility: "High" | "Moderate" | "Special Approval";
  cacCategory: string;
  domainSuggestions: string[];
  rationale: string;
}

export function ToolBusinessName() {
  const [industry, setIndustry] = useState("logistics");
  const [style, setStyle] = useState("punchy");
  const [keyword, setKeyword] = useState("Apex");
  const [cityFocus, setCityFocus] = useState("National");
  const [results, setResults] = useState<BusinessNameIdea[]>([]);
  const [selectedName, setSelectedName] = useState<BusinessNameIdea | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const kw = keyword.trim() || "Prime";

    const baseList: Record<string, string[]> = {
      logistics: ["Haulage", "Logistics", "Dispatch", "Express", "Freight", "Couriers", "Transit"],
      solar: ["Solar", "Power", "Energy", "Volts", "Current", "Renewables", "Grid"],
      construction: ["Build", "Construct", "Engineering", "Structures", "Properties", "Contracting"],
      tech: ["Technologies", "Digital", "Labs", "Systems", "Interactive", "Software", "Networks"],
      food: ["Kitchen", "Foods", "Catering", "Grill", "Bites", "Chow", "Feast"],
      cleaning: ["Cleaners", "Hygiene", "Janitorial", "Sanitation", "Sparkle", "Facilities"],
    };

    const suffixes = baseList[industry] || ["Ventures", "Services", "Enterprises", "Solutions", "Global"];

    const generated: BusinessNameIdea[] = [
      {
        name: style === "afro" ? `Naija ${kw} ${suffixes[0]}` : `${kw} ${suffixes[0]} Limited`,
        slogan: `Excellence and precision in every ${industry} engagement.`,
        cacFeasibility: "High",
        cacCategory: "Business Name (BN) / Private Limited Company (LTD)",
        domainSuggestions: [`${kw.toLowerCase()}${suffixes[0]?.toLowerCase()}.ng`, `${kw.toLowerCase()}${suffixes[0]?.toLowerCase()}.com.ng`],
        rationale: "Strong, commanding brand presence with high memorability in commercial tenders.",
      },
      {
        name: `${kw}Craft ${suffixes[1] || "Enterprises"}`,
        slogan: "Dependable solutions engineered for modern Nigerian enterprises.",
        cacFeasibility: "High",
        cacCategory: "Business Name (Sole Proprietorship / Partnership)",
        domainSuggestions: [`get${kw.toLowerCase()}craft.ng`, `${kw.toLowerCase()}craft.com`],
        rationale: "Combines technical craftsmanship with enterprise credibility.",
      },
      {
        name: style === "punchy" ? `Swift${kw}` : `The ${kw} Group`,
        slogan: "Moving faster, delivering smarter, built to last.",
        cacFeasibility: "Moderate",
        cacCategory: "Private Company Limited by Shares (LTD)",
        domainSuggestions: [`swift${kw.toLowerCase()}.ng`, `the${kw.toLowerCase()}group.com.ng`],
        rationale: "Punchy, modern tech-enabled brand identity ideal for mobile app and web commerce.",
      },
      {
        name: `${cityFocus !== "National" ? cityFocus : "Apex"} ${kw} ${suffixes[2] || "Solutions"}`,
        slogan: "Rooted in local expertise, delivering world-class standards.",
        cacFeasibility: "High",
        cacCategory: "Business Name Registration",
        domainSuggestions: [`${kw.toLowerCase()}solutions.ng`, `${kw.toLowerCase()}solutions.com.ng`],
        rationale: "Appeals directly to regional decision-makers and state commercial procurement.",
      },
      {
        name: `${kw}Sphere Integrated`,
        slogan: "End-to-end reliability across every operational milestone.",
        cacFeasibility: "Special Approval",
        cacCategory: "Corporate Consortium / Holding Entity",
        domainSuggestions: [`${kw.toLowerCase()}sphere.ng`, `${kw.toLowerCase()}sphere.africa`],
        rationale: "Scalable brand identity for future multi-state expansion and conglomerate diversification.",
      },
    ];

    setResults(generated);
    setSelectedName(generated[0] || null);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Brand Architecture &amp; Identity
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Business Name Ideas &amp; CAC Suitability Generator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Generate distinctive, commercially viable Nigerian business names with CAC feasibility analysis, domains, and registration checklists.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Industry / Sector
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="logistics">Logistics &amp; Haulage</option>
              <option value="solar">Solar &amp; Power Engineering</option>
              <option value="construction">Building &amp; Contracting</option>
              <option value="tech">Software &amp; Digital Services</option>
              <option value="food">Catering, Food &amp; Hospitality</option>
              <option value="cleaning">Cleaning &amp; Facility Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Naming Vibe / Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="punchy">Punchy &amp; Modern</option>
              <option value="corporate">Corporate &amp; Formal</option>
              <option value="afro">Nigerian Heritage / Cultural</option>
              <option value="tech">Tech / Global Fintech</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Core Root Word
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Apex, Delta, Falcon, Kosi"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Market Scope
            </label>
            <select
              value={cityFocus}
              onChange={(e) => setCityFocus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium"
            >
              <option value="National">Nationwide (Nigeria)</option>
              <option value="Lagos">Lagos Commercial Hub</option>
              <option value="Port Harcourt">Port Harcourt / Niger Delta</option>
              <option value="Abuja">Abuja / FCT</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? "Synthesizing Names..." : "⚡ Generate Brand Candidates"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Generated Brand Candidates ({results.length})
            </span>
            {selectedName && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-bold hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>👁️ View Brand Brief</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedName(item)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedName?.name === item.name
                    ? "bg-teal-50/70 dark:bg-teal-950/40 border-[#0D9488] shadow-sm"
                    : "bg-white dark:bg-[#0D223A] border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.cacFeasibility === "High"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.cacFeasibility === "Moderate"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.cacFeasibility} CAC Odds
                    </span>
                  </div>
                  <p className="text-xs italic text-slate-600 dark:text-slate-300">
                    &ldquo;{item.slogan}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {item.rationale}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {item.domainSuggestions[0]}
                  </span>
                  <span className="font-bold text-[#0D9488]">
                    {selectedName?.name === item.name ? "Selected ✓" : "Select &rarr;"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedName && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Brand Identity Brief — ${selectedName.name}`}
          badge="Corporate Brand Brief"
          filename={`brand-brief-${selectedName.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
          summaryText={`EasyLife Brand Identity Brief\nBusiness Name: ${selectedName.name}\nTagline: ${selectedName.slogan}\nCAC Feasibility: ${selectedName.cacFeasibility}\nCategory: ${selectedName.cacCategory}\nDomain: ${selectedName.domainSuggestions.join(", ")}`}
        >
          <div className="space-y-6 text-slate-800">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
                Corporate Affairs Commission (CAC) Preparation Brief
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {selectedName.name}
              </h1>
              <p className="text-sm italic text-slate-600 mt-1">
                &ldquo;{selectedName.slogan}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Recommended CAC Classification
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedName.cacCategory}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Name Reservation Feasibility
                </span>
                <span className="font-bold text-emerald-700 mt-0.5 block">
                  {selectedName.cacFeasibility} Probability of Uncontested Approval
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                Brand Strategic Rationale
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                {selectedName.rationale}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                Recommended Digital Domains &amp; Handles
              </h2>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {selectedName.domainSuggestions.map((dom, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-slate-800">
                    {dom}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                CAC Business Registration 4-Step Checklist
              </h2>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                <li>Run official Name Availability Search on CAC CRP portal (cac.gov.ng).</li>
                <li>Submit Form CAC 1.1 with verified NIN/bvn of proprietors or directors.</li>
                <li>Draft Memorandum &amp; Articles of Association (MEMART) or Objectives.</li>
                <li>Pay statutory Federal Inland Revenue Service (FIRS) stamp duty and download RC Certificate.</li>
              </ol>
            </div>
          </div>
        </DocumentPreviewModal>
      )}
    </div>
  );
}
