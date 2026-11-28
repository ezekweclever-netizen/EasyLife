"use client";

import React, { useState } from "react";
import type { HealthcareFacilityRow } from "@easylife/shared-types";
import { ReportModal } from "@/components/directories/report-modal";

interface HealthcareDirectoryClientProps {
  initialFacilities: HealthcareFacilityRow[];
  defaultType: "hospital" | "clinic" | "pharmacy" | "all";
  defaultCity: string;
  defaultLga: string;
  defaultQuery: string;
  defaultEmergency: boolean;
}

export function HealthcareDirectoryClient({
  initialFacilities,
  defaultType,
  defaultCity,
  defaultLga,
  defaultQuery,
  defaultEmergency,
}: HealthcareDirectoryClientProps) {
  const [facilities, setFacilities] = useState<HealthcareFacilityRow[]>(initialFacilities);
  const [selectedType, setSelectedType] = useState<string>(defaultType);
  const [selectedLga, setSelectedLga] = useState<string>(defaultLga);
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(defaultEmergency);
  const [searchQuery, setSearchQuery] = useState<string>(defaultQuery);

  // Reporting modal state
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  const filterResults = (type: string, lga: string, emergency: boolean, q: string) => {
    let filtered = [...initialFacilities];

    if (type !== "all") {
      filtered = filtered.filter((f) => f.facility_type === type);
    }

    if (lga) {
      filtered = filtered.filter((f) => f.lga.toLowerCase() === lga.toLowerCase());
    }

    if (emergency) {
      filtered = filtered.filter((f) => f.is_emergency_24_7);
    }

    if (q.trim()) {
      const term = q.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.address.toLowerCase().includes(term) ||
          (f.description && f.description.toLowerCase().includes(term)) ||
          f.services_offered.some((s) => s.toLowerCase().includes(term))
      );
    }

    setFacilities(filtered);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    filterResults(type, selectedLga, emergencyOnly, searchQuery);
  };

  const handleLgaChange = (lga: string) => {
    setSelectedLga(lga);
    filterResults(selectedType, lga, emergencyOnly, searchQuery);
  };

  const handleEmergencyToggle = (checked: boolean) => {
    setEmergencyOnly(checked);
    filterResults(selectedType, selectedLga, checked, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterResults(selectedType, selectedLga, emergencyOnly, query);
  };

  return (
    <div className="space-y-8">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search medical facilities by name, specialized service, or street (e.g. Pediatrics, Trauma, Choba, D-Line, Antimalarial)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Facility Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Facilities" },
              { id: "hospital", label: "🏥 Hospitals" },
              { id: "clinic", label: "🩺 Clinics" },
              { id: "pharmacy", label: "💊 Pharmacies" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTypeChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedType === tab.id
                    ? "bg-[#1F2328] dark:bg-[#E8590C] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* LGA selector */}
            <select
              value={selectedLga}
              onChange={(e) => handleLgaChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="">All LGAs</option>
              <option value="Port Harcourt City">Port Harcourt City LGA</option>
              <option value="Obio/Akpor">Obio/Akpor LGA</option>
              <option value="Eleme">Eleme LGA</option>
              <option value="Ikwerre">Ikwerre LGA</option>
              <option value="Oyigbo">Oyigbo LGA</option>
            </select>

            {/* 24/7 Emergency Filter */}
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => handleEmergencyToggle(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-600"
              />
              <span className="text-red-700 dark:text-red-400">🚨 24/7 Emergency Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      {facilities.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-12 text-center space-y-3">
          <div className="text-3xl">🏥</div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No matching healthcare facilities found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            We could not find any healthcare facilities or pharmacies matching your filters in Port Harcourt. Try selecting &quot;All Facilities&quot; or clearing your search.
          </p>
          <button
            onClick={() => {
              setSelectedType("all");
              setSelectedLga("");
              setEmergencyOnly(false);
              setSearchQuery("");
              setFacilities(initialFacilities);
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs hover:border-[#E8590C]/40 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header with Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        facility.facility_type === "hospital"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : facility.facility_type === "clinic"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {facility.facility_type === "hospital"
                        ? "Hospital"
                        : facility.facility_type === "clinic"
                        ? "Clinic"
                        : "Pharmacy"}
                    </span>
                    {facility.is_emergency_24_7 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                        🚨 24/7 Emergency
                      </span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                    ✓ Verified
                  </span>
                </div>

                {/* Name & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {facility.name}
                  </h3>
                  {facility.description && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {facility.description}
                    </p>
                  )}
                </div>

                {/* Location & Operating Hours */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400">📍</span>
                    <span>
                      {facility.address}, {facility.lga}, {facility.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">🕒</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {facility.operating_hours}
                    </span>
                  </div>
                </div>

                {/* Services Pills */}
                {facility.services_offered && facility.services_offered.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                    {facility.services_offered.slice(0, 4).map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-[#E6E0D8] dark:border-[#2E343B]"
                      >
                        {service}
                      </span>
                    ))}
                    {facility.services_offered.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-400 text-[10px]">
                        +{facility.services_offered.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons & Report */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${facility.contact_phone}`}
                    className="px-3 py-1.5 bg-[#E8590C] hover:bg-[#C84A06] text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>📞</span> Call
                  </a>
                  {facility.website && (
                    <a
                      href={facility.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      Website
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setReportTarget({ id: facility.id, name: facility.name })}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition"
                >
                  Flag / Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          entityType="healthcare_facility"
          entityId={reportTarget.id}
          entityName={reportTarget.name}
        />
      )}
    </div>
  );
}
