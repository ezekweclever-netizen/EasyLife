import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getServiceCategories } from "@/lib/supabase/customer";
import {
  getOperatingNeighbourhoods,
  getNeighbourhoodCoordinates,
  searchAndMatchProfessionals,
} from "@/lib/supabase/matching";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { ServiceDiscoveryClient } from "@/components/discovery/service-discovery-client";

export const metadata: Metadata = {
  title: "Service Discovery & Professional Matching — EasyLife Nigeria",
  description:
    "Discover verified technicians, electricians, plumbers, generator engineers, and artisans in Port Harcourt, Lagos, and Abuja using location proximity, availability, and customer ratings.",
};

interface ExploreServicesPageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    group?: string;
    city?: string;
    area?: string;
    distance?: string;
    date?: string;
    time?: string;
    rating?: string;
    verified?: string;
    available?: string;
  }>;
}

const CATEGORY_GROUPS: Record<
  string,
  {
    label: string;
    description: string;
    slugs: readonly string[];
    extraHref?: { label: string; href: string };
  }
> = {
  "home-repairs": {
    label: "Home Repairs and Maintenance",
    description:
      "Showing specialists across carpentry, painting, tiling, HVAC, appliance repair, and generator upkeep.",
    slugs: [
      "carpentry-doors-locks",
      "painting-wall-finishing",
      "tiling-floor-installation",
      "hvac-air-conditioning",
      "appliance-repair",
      "generator-maintenance",
    ],
  },
  "professional-business": {
    label: "Professional and Business Services",
    description:
      "Showing specialists for everyday business errands, event operations, and commercial property support.",
    slugs: ["everyday-tasks", "event-planning-services"],
    extraHref: { label: "Explore Commercial Facility Solutions →", href: "/business-solutions" },
  },
};

export default async function ExploreServicesPage({
  searchParams,
}: ExploreServicesPageProps) {
  const {
    q = "",
    cat = "",
    group = "",
    city = "All Cities",
    area = "",
    distance = "all",
    date = "",
    time = "",
    rating = "0",
    verified = "",
    available = "",
  } = await searchParams;

  const minRating = parseFloat(rating) || 0;
  const verifiedOnly = verified === "true";
  const availableOnly = available === "true";
  const maxDistanceKm = distance === "all" ? undefined : parseFloat(distance) || 25;

  // Retrieve GPS coordinates if neighbourhood or specific city hub was selected
  let refLat: number | undefined;
  let refLng: number | undefined;

  if (area) {
    const coords = await getNeighbourhoodCoordinates(area, city);
    if (coords) {
      refLat = coords.latitude;
      refLng = coords.longitude;
    }
  } else if (city === "Port Harcourt") {
    refLat = 4.8156;
    refLng = 7.0498;
  } else if (city === "Lagos") {
    refLat = 6.5244;
    refLng = 3.3792;
  } else if (city === "Abuja") {
    refLat = 9.0765;
    refLng = 7.3986;
  }

  const activeGroup = group && CATEGORY_GROUPS[group] ? CATEGORY_GROUPS[group] : null;
  const effectiveCategorySlug = cat || (activeGroup && activeGroup.slugs.length === 1 ? activeGroup.slugs[0]! : "");

  // Fetch real Supabase categories, ALL hub neighbourhoods, and matched professionals
  const [categories, neighbourhoods, matchedPros] = await Promise.all([
    getServiceCategories(),
    getOperatingNeighbourhoods(),
    searchAndMatchProfessionals({
      keyword: q,
      categorySlug: effectiveCategorySlug,
      city: city === "All Cities" ? undefined : city,
      neighbourhood: area,
      latitude: refLat,
      longitude: refLng,
      maxDistanceKm,
      targetDate: date,
      targetTime: time,
      minRating,
      verifiedOnly,
      availableOnly,
      limit: 60,
    }),
  ]);

  const filteredMatchedPros =
    activeGroup && !cat
      ? matchedPros.filter((pro) =>
          activeGroup.slugs.includes(pro.category_slug || "")
        )
      : matchedPros;

  return (
    <PublicShell>
      {/* Hero */}
      <PageHero
        eyebrow="Multi-City Service Discovery"
        title="Find &amp; Book Verified Local Professionals"
        description="Connect with accredited technicians and trade specialists across Port Harcourt, Lagos, and Abuja. Ranked by verified trade, proximity, confirmed availability, and ratings."
      >
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-teal-200">
          <span>Popular Trades:</span>
          {categories.slice(0, 5).map((c) => (
            <Link
              key={c.id}
              href={`/explore-services?cat=${c.slug}&city=${encodeURIComponent(city)}`}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </PageHero>

      {/* Main Matching & Discovery Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {activeGroup && (
          <div className="rounded-2xl border border-[#24989A]/30 bg-[#EEF9F9] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#154752] text-white text-xs font-bold uppercase tracking-wider">
                  Category Group Selected
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#154752]">
                  {activeGroup.label}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#4E6065]">
                {activeGroup.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {categories
                  .filter((c) => activeGroup.slugs.includes(c.slug))
                  .map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/explore-services?cat=${sub.slug}&city=${encodeURIComponent(city)}`}
                      className="px-3 py-1 rounded-full bg-white border border-[#DAE7E7] text-xs sm:text-sm font-semibold text-[#154752] hover:border-[#24989A] hover:text-[#24989A] transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeGroup.extraHref && (
                <Link
                  href={activeGroup.extraHref.href}
                  className="px-4 py-2 rounded-xl bg-[#154752] text-white text-sm font-semibold hover:bg-[#0D282E] transition"
                >
                  {activeGroup.extraHref.label}
                </Link>
              )}
              <Link
                href="/explore-services"
                className="px-4 py-2 rounded-xl bg-white border border-[#DAE7E7] text-sm font-semibold text-[#1F2F34] hover:bg-slate-50 transition"
              >
                Show All Categories
              </Link>
            </div>
          </div>
        )}

        <ServiceDiscoveryClient
          categories={categories}
          neighbourhoods={neighbourhoods}
          initialResults={filteredMatchedPros}
          defaultCity={city}
          defaultCategorySlug={effectiveCategorySlug}
          defaultKeyword={q}
        />

        {/* Service Categories Grid Overview */}
        <section className="mt-16 pt-10 border-t border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Accredited Service Categories
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Official everyday maintenance and repair specialisations available across Port Harcourt, Lagos, and Abuja.
              </p>
            </div>
            <Link
              href="/book"
              className="text-sm sm:text-base font-semibold text-[#0D9488] hover:underline"
            >
              Request Any Service →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-[#0D9488] transition shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-xs font-bold text-[#0D9488] shrink-0">
                      #{c.display_order}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                      {c.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <Link
                    href={`/explore-services?cat=${c.slug}&city=${encodeURIComponent(city)}`}
                    className="font-semibold text-[#0D9488] hover:underline"
                  >
                    Match Pros
                  </Link>
                  <Link
                    href={`/book?category=${c.id}`}
                    className="font-bold text-slate-700 hover:text-slate-900"
                  >
                    Request →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
