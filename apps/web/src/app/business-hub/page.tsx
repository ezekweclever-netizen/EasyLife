import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getDirectoryBusinesses,
  getActiveBusinessPromotions,
} from "@/lib/supabase/directories";
import { PublicShell } from "@/components/site/public-shell";
import { BusinessDirectoryClient } from "@/components/directories/business-client";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "Business Hub & Verified Local Directory — EasyLife Nigeria",
  description:
    "Explore verified local businesses, trade workshops, corporate repair specialists, seasonal promotions, and commercial facility management across Port Harcourt, Lagos, and Abuja.",
};

interface BusinessHubPageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    q?: string;
  }>;
}

const FALLBACK_PROMOTIONS = [
  {
    id: "promo-1",
    title: "15% Off Solar Inverter Servicing & Power Calibration",
    business_name: "Apex Solar & Industrial Power Systems Ltd.",
    business_slug: "apex-solar-power-systems-abuja",
    discount: "15% OFF",
    code: "EASYPOWER15",
    city: "Abuja",
    valid_until: "End of Month",
    description:
      "Includes complete battery storage health diagnostics, charge controller calibration, and DC switchboard safety checks.",
  },
  {
    id: "promo-2",
    title: "Commercial Facility AC & Chiller Preventive Inspection",
    business_name: "Benchmark Facilities & Commercial Maintenance Co.",
    business_slug: "benchmark-facilities-maintenance-lagos",
    discount: "FREE AUDIT",
    code: "FACILITYFREE",
    city: "Lagos",
    valid_until: "Limited Time",
    description:
      "Complimentary scheduled quarterly diagnostic audit for corporate offices and commercial retail spaces in Victoria Island and Ikeja.",
  },
  {
    id: "promo-3",
    title: "Corporate Legal & CAC Verification Support Discount",
    business_name: "Niger Delta Corporate & Legal Support Partners",
    business_slug: "niger-delta-corporate-support-ph",
    discount: "20% DISCOUNT",
    code: "CORPAUDIT20",
    city: "Port Harcourt",
    valid_until: "Ongoing",
    description:
      "Discounted advisory, statutory company filings, and commercial facility tenancy compliance review for registered businesses.",
  },
];

export default async function BusinessHubPage({
  searchParams,
}: BusinessHubPageProps) {
  const {
    category = "All",
    city = "All Cities",
    q = "",
  } = await searchParams;

  const [businesses, dbPromos] = await Promise.all([
    getDirectoryBusinesses({
      category: category === "All" ? undefined : category,
      city,
      query: q || undefined,
    }),
    getActiveBusinessPromotions(6),
  ]);

  const promotions =
    dbPromos.length > 0
      ? dbPromos.map((p) => ({
          id: p.id,
          title: p.title,
          business_name: p.business?.name || "Verified Local Business",
          business_slug: p.business?.slug || p.business_id,
          discount: p.discount_percentage
            ? `${p.discount_percentage}% OFF`
            : "SPECIAL OFFER",
          code: p.discount_code || "EASYLIFE",
          city: p.business?.city || "Nigeria",
          valid_until: p.end_date
            ? new Date(p.end_date).toLocaleDateString()
            : "Ongoing",
          description: p.description,
        }))
      : FALLBACK_PROMOTIONS;

  return (
    <PublicShell>
      <section className="relative w-full overflow-hidden bg-[#071E28] text-white border-b border-[#24989A]/20">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-business-hub.jpg"
            alt="Business professionals shaking hands in high-rise boardroom"
            fill
            priority
            sizes="100vw"
            quality={92}
            className="object-cover object-[50%_12%] sm:object-[55%_15%] md:object-[65%_18%] lg:object-[68%_20%]"
          />
          {/* Base ambient darkening */}
          <div className="absolute inset-0 bg-[#051726]/20" />
          {/* Directional gradient: deep opacity focused strictly on left text column, clearing early to reveal business partners and handshake */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020B13]/95 via-[#031320]/85 via-28% md:to-transparent to-[#041726]/30" />
          {/* Mobile vertical gradient reinforcement for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020B13]/95 via-[#041726]/75 to-[#020B13]/50 sm:hidden" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-xl lg:max-w-lg">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#EE9277] drop-shadow-xs">
              EasyLife Business Hub
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight leading-[1.14] text-white drop-shadow-sm">
              Verified Local Businesses, Trade Centres &amp; Corporate Maintenance
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#E1EEF0] leading-relaxed drop-shadow-xs">
              Discover accredited workshops, commercial suppliers, bespoke contractors, and special member promotions across Port Harcourt, Lagos, and Abuja.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hub Core Areas Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="#directory"
            className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 shadow-sm space-y-2 hover:border-[#0D9488]/40 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] flex items-center justify-center">
              <Icon name="building" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0D9488] transition-colors">
              Local Directory &darr;
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Discover verified stores, workshops, pharmacies, and food venues in your area.
            </p>
          </a>

          <a
            href="#promotions"
            className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 shadow-sm space-y-2 hover:border-[#0D9488]/40 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Icon name="receipt" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
              Deals &amp; Offers &darr;
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Access exclusive commercial discounts and seasonal deals from vetted local partners.
            </p>
          </a>

          <Link
            href="/business"
            className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 shadow-sm space-y-2 hover:border-[#0D9488]/40 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icon name="shield" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Maintenance Portal &rarr;
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Multi-property facility management, equipment QR codes, and preventive schedules.
            </p>
          </Link>

          <Link
            href="/register?role=business"
            className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 shadow-sm space-y-2 hover:border-[#0D9488]/40 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icon name="check-circle" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              List Your Enterprise &rarr;
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Onboard your business, publish services, offer promo codes, and receive direct inquiries.
            </p>
          </Link>
        </div>

        {/* Active Business Promotions & Deals */}
        <div id="promotions" className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Special Offers &amp; Member Rates
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Active Promotions &amp; Seasonal Deals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Commercial discounts offered by vetted directory partners in Port Harcourt, Lagos, and Abuja
              </p>
            </div>
            <ButtonLink href="/register?role=business" variant="outline" size="sm">
              Publish Business Promotion
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                      {promo.discount}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      📍 {promo.city}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {promo.title}
                  </h3>
                  <Link
                    href={`/business-hub/${promo.business_slug}`}
                    className="text-[11px] font-semibold text-[#0D9488] dark:text-[#5CD3D5] hover:underline block"
                  >
                    🏢 {promo.business_name}
                  </Link>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {promo.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
                    CODE: {promo.code}
                  </div>
                  <Link
                    href={`/business-hub/${promo.business_slug}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488] hover:bg-[#0F766E] text-white transition shadow-xs"
                  >
                    View Offer &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Directory Search & Directory Client */}
        <div id="directory" className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Directory Discovery
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Verified Local Business Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter by trade, city, and business category across Port Harcourt, Lagos, and Abuja
              </p>
            </div>
            <ButtonLink href="/register?role=business" size="sm">
              List Your Business
            </ButtonLink>
          </div>

          <BusinessDirectoryClient
            initialBusinesses={businesses}
            defaultCategory={category}
            defaultCity={city}
            defaultQuery={q}
          />
        </div>

        {/* Commercial Maintenance Solutions Banner */}
        <div className="rounded-3xl bg-linear-to-r from-slate-900 to-[#154752] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
              Corporate &amp; Facility Management
            </span>
            <h3 className="text-lg sm:text-xl font-bold">
              Manage multiple properties, assets and schedules effortlessly
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              EasyLife Business maintenance portal provides multi-tenant property logging, asset QR codes, scheduled servicing, and transparent corporate maintenance records.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <ButtonLink
              href="/business-solutions"
              variant="outline"
              size="md"
              className="bg-transparent border-white text-white hover:bg-white/10"
            >
              Learn More
            </ButtonLink>
            <ButtonLink
              href="/business"
              size="md"
              className="bg-[#24989A] hover:bg-[#1E7D7F] text-white"
            >
              Open Maintenance Portal
            </ButtonLink>
          </div>
        </div>

        {/* Food Discovery Notice */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-[#071526] border border-slate-200 dark:border-[#163654] text-xs text-slate-600 dark:text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            🍽️ EasyLife Directory Discovery Standards
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed">
            All business directory listings on EasyLife are provided for verified local discovery, operating hours, and direct customer contact. In strict compliance with EasyLife policy, full online food ordering and food delivery carts are not hosted.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
