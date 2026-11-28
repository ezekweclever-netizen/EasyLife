"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { DirectoryBusinessItem } from "@/lib/supabase/directories";
import { ReportModal } from "@/components/directories/report-modal";

interface BusinessDirectoryClientProps {
  initialBusinesses: DirectoryBusinessItem[];
  defaultCategory: string;
  defaultCity: string;
  defaultQuery: string;
}

const BUSINESS_CATEGORIES = [
  "All",
  "Restaurants & Food",
  "Bakeries & Confectionery",
  "Supermarkets & Groceries",
  "Pharmacies & Health Stores",
  "Local Shops & Retail",
  "Business & Corporate Services",
  "Commercial Facility Maintenance",
  "Solar & Electrical Contractors",
  "Automotive & Engineering",
  "General Services",
];

const PILOT_CITIES = ["All Cities", "Port Harcourt", "Lagos", "Abuja"];

export function BusinessDirectoryClient({
  initialBusinesses,
  defaultCategory,
  defaultCity,
  defaultQuery,
}: BusinessDirectoryClientProps) {
  const [businesses, setBusinesses] = useState<DirectoryBusinessItem[]>(initialBusinesses);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [selectedCity, setSelectedCity] = useState<string>(defaultCity);
  const [searchQuery, setSearchQuery] = useState<string>(defaultQuery);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  const filterResults = (cat: string, city: string, q: string) => {
    let filtered = [...initialBusinesses];

    if (city && city !== "All Cities") {
      filtered = filtered.filter(
        (b) => b.city && b.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (cat !== "All") {
      filtered = filtered.filter(
        (b) =>
          (b.business_category && b.business_category.toLowerCase().includes(cat.toLowerCase())) ||
          (b.industry && b.industry.toLowerCase().includes(cat.toLowerCase()))
      );
    }

    if (q.trim()) {
      const term = q.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          (b.description && b.description.toLowerCase().includes(term)) ||
          (b.address && b.address.toLowerCase().includes(term)) ||
          (b.services_offered && b.services_offered.some((s) => s.toLowerCase().includes(term)))
      );
    }

    setBusinesses(filtered);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    filterResults(cat, selectedCity, searchQuery);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    filterResults(selectedCategory, city, searchQuery);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    filterResults(selectedCategory, selectedCity, q);
  };

  return (
    <div className="space-y-8">
      {/* Search Header & City Filter */}
      <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search local businesses by trade, company name, or service..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          </div>

          <Link
            href="/register?role=business"
            className="px-4 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#C84A06] text-white text-xs font-bold transition shadow-xs text-center whitespace-nowrap"
          >
            + Register Your Business
          </Link>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Pilot City:
          </span>
          {PILOT_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCityChange(city)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCity === city
                  ? "bg-[#1F2328] dark:bg-[#E8590C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
          {BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#E8590C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Roster */}
      {businesses.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-12 text-center space-y-3">
          <div className="text-3xl">🏢</div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No local businesses currently match your search
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try switching cities, categories, or clearing your search term. Are you an established local enterprise? List your business profile today.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedCity("All Cities");
                setSearchQuery("");
                setBusinesses(initialBusinesses);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Clear Filters
            </button>
            <Link
              href="/register?role=business"
              className="px-4 py-2 bg-[#E8590C] hover:bg-[#C84A06] text-white rounded-lg text-xs font-bold transition"
            >
              Register Business Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => {
            const profileUrl = `/business-hub/${biz.slug || biz.id}`;
            const isFoodCategory =
              biz.business_category?.toLowerCase().includes("restaurant") ||
              biz.business_category?.toLowerCase().includes("food") ||
              biz.business_category?.toLowerCase().includes("baker");

            return (
              <div
                key={biz.id}
                className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs hover:border-[#E8590C]/50 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-700 dark:text-slate-200 border border-[#E6E0D8] dark:border-[#2E343B]">
                      {biz.business_category || biz.industry || "Local Enterprise"}
                    </span>
                    {biz.verification_status === "approved" && (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                        ✓ Verified Business
                      </span>
                    )}
                  </div>

                  <div>
                    <Link
                      href={profileUrl}
                      className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#E8590C] transition-colors block"
                    >
                      {biz.name}
                    </Link>
                    {biz.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {biz.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{biz.address ? `${biz.address}, ` : ""}{biz.city}, {biz.state}</span>
                    </p>
                    {biz.contact_phone && (
                      <p className="flex items-center gap-1">
                        <span>📞</span>
                        <span>{biz.contact_phone}</span>
                      </p>
                    )}
                    {isFoodCategory && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        🍽️ Directory discovery & dining hours (no delivery checkout)
                      </p>
                    )}
                  </div>

                  {biz.services_offered && biz.services_offered.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                      {biz.services_offered.slice(0, 4).map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 rounded text-[10px] border border-[#E6E0D8] dark:border-[#2E343B]"
                        >
                          {srv}
                        </span>
                      ))}
                      {biz.services_offered.length > 4 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                          +{biz.services_offered.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={profileUrl}
                      className="flex-1 text-center px-3.5 py-2 bg-[#E8590C] hover:bg-[#C84A06] text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      View Profile &amp; Services &rarr;
                    </Link>

                    {biz.contact_phone && (
                      <a
                        href={`tel:${biz.contact_phone}`}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                        title="Call business phone"
                      >
                        📞 Call
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <Link
                      href={`/contact?inquiry=business&target=${encodeURIComponent(biz.name)}`}
                      className="hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      Inquire via EasyLife
                    </Link>
                    <button
                      type="button"
                      onClick={() => setReportTarget({ id: biz.id, name: biz.name })}
                      className="hover:text-red-600 transition cursor-pointer"
                    >
                      Flag / Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          entityType="business"
          entityId={reportTarget.id}
          entityName={reportTarget.name}
        />
      )}
    </div>
  );
}
