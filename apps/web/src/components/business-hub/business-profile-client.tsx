"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/site/icons";
import { ReportModal } from "@/components/directories/report-modal";
import type { DirectoryBusinessDetail } from "@/lib/supabase/directories";

interface BusinessProfileClientProps {
  business: DirectoryBusinessDetail;
}

export function BusinessProfileClient({ business }: BusinessProfileClientProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isFoodCategory =
    business.business_category?.toLowerCase().includes("restaurant") ||
    business.business_category?.toLowerCase().includes("food") ||
    business.business_category?.toLowerCase().includes("baker");

  // Format operating hours
  const hours = business.operating_hours as Record<string, string> | null;
  const hoursEntries = hours && typeof hours === "object" ? Object.entries(hours) : [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/business-hub"
          className="text-xs font-semibold text-[#E8590C] hover:underline inline-flex items-center gap-1"
        >
          <span>&larr; Back to Business Hub &amp; Directory</span>
        </Link>
      </div>

      {/* Main Business Profile Card */}
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-10 shadow-xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] uppercase tracking-wider">
                {business.business_category || business.industry || "Local Enterprise"}
              </span>

              {business.verification_status === "approved" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  ✓ Verified EasyLife Business
                </span>
              )}

              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {business.city}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {business.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Icon name="map-pin" className="w-4 h-4 text-[#E8590C]" />
                <span>
                  {business.address ? `${business.address}, ` : ""}
                  {business.city}, {business.state}
                </span>
              </span>
              {business.contact_phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <span>📞 {business.contact_phone}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Contact CTAs */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5">
            {business.contact_phone && (
              <a
                href={`tel:${business.contact_phone}`}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#E8590C] text-white hover:bg-[#C84A06] transition-all shadow-md text-center flex items-center justify-center gap-2"
              >
                <span>📞 Call Business</span>
              </a>
            )}

            <Link
              href={`/contact?inquiry=business&target=${encodeURIComponent(business.name)}`}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Send Direct Inquiry</span>
            </Link>

            {business.website && (
              <a
                href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#E8590C] hover:underline text-center"
              >
                Visit Official Website &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2 spans) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Description */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                About this Enterprise
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {business.description || "Established local business serving the community with quality services."}
              </p>
            </div>

            {/* Services & Capabilities */}
            {business.services_offered && business.services_offered.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Services &amp; Specialisations Offered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {business.services_offered.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-[#FCEBDD] dark:bg-[#E8590C]/20 border border-[#E8590C]/30 text-xs font-semibold text-[#E8590C]"
                    >
                      ✓ {srv}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Promotions & Deals */}
            {business.promotions && business.promotions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Exclusive Deals &amp; Member Offers
                  </h2>
                  <span className="text-xs text-[#E8590C] font-semibold">
                    {business.promotions.length} Active {business.promotions.length === 1 ? "Deal" : "Deals"}
                  </span>
                </div>

                <div className="space-y-3">
                  {business.promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                            {promo.discount_percentage ? `${promo.discount_percentage}% OFF` : "SPECIAL DISCOUNT"}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {promo.title}
                          </h3>
                        </div>

                        {promo.discount_code && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 font-mono text-xs font-bold bg-white dark:bg-[#1F2328] border border-amber-300 dark:border-amber-800 rounded text-slate-800 dark:text-slate-200">
                              {promo.discount_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(promo.discount_code!)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 hover:bg-amber-300 transition cursor-pointer"
                            >
                              {copiedCode === promo.discount_code ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {promo.description}
                      </p>

                      {promo.conditions && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>Terms:</strong> {promo.conditions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food Discovery Notice (if food category) */}
            {isFoodCategory && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>🍽️ EasyLife Food Discovery Policy</span>
                </p>
                <p className="leading-relaxed">
                  This business is listed for verified directory discovery, operating hours, and direct inquiries. In accordance with platform policy, full food delivery carts, checkout, and driver dispatch are not hosted.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Column (1 span) */}
          <div className="space-y-6">
            {/* Operating Hours Card */}
            <div className="p-5 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🕒 Operating Hours</span>
              </h3>

              {hoursEntries.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {hoursEntries.map(([day, val]) => (
                    <div key={day} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/80 last:border-0">
                      <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">
                        {day.replace(/_/g, " ")}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong>Monday – Friday:</strong> 8:00 AM – 6:00 PM</p>
                  <p><strong>Saturday:</strong> 9:00 AM – 4:00 PM</p>
                  <p><strong>Sunday:</strong> Closed</p>
                </div>
              )}
            </div>

            {/* Location & Physical Address Card */}
            <div className="p-5 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                📍 Physical Location
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {business.address || "Main Commercial Center"}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {business.city}, {business.state}
              </p>
            </div>

            {/* Commercial Maintenance Connect */}
            <div className="p-5 rounded-2xl bg-[#1F2328] border border-[#2E343B] text-white space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8590C]">
                Corporate Maintenance
              </span>
              <h4 className="text-xs font-bold leading-snug">
                Own or manage commercial properties?
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Track facility assets, log equipment faults, and schedule preventive servicing across your locations.
              </p>
              <Link
                href="/business"
                className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E8590C] hover:bg-[#C84A06] text-white transition shadow-xs"
              >
                Open Maintenance Portal &rarr;
              </Link>
            </div>

            {/* Flag / Report */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="text-xs text-slate-400 hover:text-red-600 transition cursor-pointer"
              >
                Flag or Report this Business Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportModalOpen(false)}
          entityType="business"
          entityId={business.id}
          entityName={business.name}
        />
      )}
    </div>
  );
}
