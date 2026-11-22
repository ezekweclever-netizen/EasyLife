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
  "IT & Computer Repair",
  "Tailoring & Fashion Design",
  "Printing, Branding & Signage",
  "Catering & Event Rentals",
  "Commercial Facility Maintenance",
  "Solar & Electrical Contractors",
  "Automotive Workshop & Servicing",
  "General Services",
];

export function BusinessDirectoryClient({
  initialBusinesses,
  defaultCategory,
  defaultCity,
  defaultQuery,
}: BusinessDirectoryClientProps) {
  const [businesses, setBusinesses] = useState<DirectoryBusinessItem[]>(initialBusinesses);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState<string>(defaultQuery);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  const filterResults = (cat: string, q: string) => {
    let filtered = [...initialBusinesses];

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
    filterResults(cat, searchQuery);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    filterResults(selectedCategory, q);
  };

  return (
    <div className="space-y-8">
      {/* Search Header & Register CTA */}
      <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search local businesses by trade, company name, or service..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          </div>

          <Link
            href="/register?role=business"
            className="px-4 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#1E3A5F] text-white text-xs font-bold transition shadow-xs text-center whitespace-nowrap"
          >
            + Register Your Business
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
          {BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-[#0D9488] text-white shadow-xs"
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
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-12 text-center space-y-3">
          <div className="text-3xl">🏢</div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No local businesses currently match your search
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try switching categories or clearing your search term. Are you an established local enterprise in Port Harcourt? List your business profile today.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setBusinesses(initialBusinesses);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Clear Filters
            </button>
            <Link
              href="/register?role=business"
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition"
            >
              Register Business Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-xs hover:border-[#0D9488]/40 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#163654]">
                    {biz.business_category || biz.industry || "Local Enterprise"}
                  </span>
                  {biz.verification_status === "approved" && (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                      ✓ Verified Business
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {biz.name}
                  </h3>
                  {biz.description && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {biz.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>📍 {biz.address ? `${biz.address}, ` : ""}{biz.city}, {biz.state}</p>
                  {biz.contact_phone && <p>📞 {biz.contact_phone}</p>}
                </div>

                {biz.services_offered && biz.services_offered.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                    {biz.services_offered.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-50 dark:bg-[#071526] text-slate-600 dark:text-slate-300 rounded text-[10px] border border-slate-200 dark:border-[#163654]"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {biz.contact_phone && (
                    <a
                      href={`tel:${biz.contact_phone}`}
                      className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold transition"
                    >
                      Call Business
                    </a>
                  )}
                  <Link
                    href={`/contact?inquiry=business&target=${encodeURIComponent(biz.name)}`}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    Inquire
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setReportTarget({ id: biz.id, name: biz.name })}
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
          entityType="business"
          entityId={reportTarget.id}
          entityName={reportTarget.name}
        />
      )}
    </div>
  );
}
