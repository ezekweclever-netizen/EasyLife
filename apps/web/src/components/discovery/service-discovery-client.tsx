"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";
import type { OperatingNeighbourhood, MatchedProfessionalItem } from "@/lib/supabase/matching";

interface ServiceDiscoveryClientProps {
  categories: ServiceCategoryItem[];
  neighbourhoods: OperatingNeighbourhood[];
  initialResults: MatchedProfessionalItem[];
  defaultCity?: string;
  defaultCategorySlug?: string;
  defaultKeyword?: string;
}

export function ServiceDiscoveryClient({
  categories,
  neighbourhoods,
  initialResults,
  defaultCity = "All Cities",
  defaultCategorySlug = "",
  defaultKeyword = "",
}: ServiceDiscoveryClientProps) {
  const [results, setResults] = useState<MatchedProfessionalItem[]>(initialResults);
  const [isPending, startTransition] = useTransition();

  // Search filter states
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [categorySlug, setCategorySlug] = useState(defaultCategorySlug);
  const [city, setCity] = useState(defaultCity);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState<string>("all");
  const [targetDate, setTargetDate] = useState("");
  const [targetTime, setTargetTime] = useState("");
  const [minRating, setMinRating] = useState<string>("0");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Filter neighbourhoods matching current selected city
  const cityNeighbourhoods = neighbourhoods.filter(
    (n) => city === "All Cities" || n.city.toLowerCase() === city.toLowerCase()
  );

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(kobo / 100);
  };

  const applyFilters = (overrides?: {
    city?: string;
    neighbourhood?: string;
    categorySlug?: string;
    keyword?: string;
  }) => {
    const activeCity = overrides?.city ?? city;
    const activeArea = overrides?.neighbourhood ?? selectedNeighbourhood;
    const activeCat = overrides?.categorySlug ?? categorySlug;
    const activeKeyword = overrides?.keyword ?? keyword;

    const queryParams = new URLSearchParams();
    if (activeKeyword) queryParams.set("q", activeKeyword);
    if (activeCat) queryParams.set("cat", activeCat);
    if (activeCity && activeCity !== "All Cities") queryParams.set("city", activeCity);
    if (activeArea) queryParams.set("area", activeArea);
    if (maxDistanceKm && maxDistanceKm !== "all") queryParams.set("distance", maxDistanceKm);
    if (targetDate) queryParams.set("date", targetDate);
    if (targetTime) queryParams.set("time", targetTime);
    if (minRating !== "0") queryParams.set("rating", minRating);
    if (verifiedOnly) queryParams.set("verified", "true");
    if (availableOnly) queryParams.set("available", "true");

    startTransition(() => {
      const qs = queryParams.toString();
      window.history.replaceState(null, "", qs ? `/explore-services?${qs}` : "/explore-services");

      let filtered = [...initialResults];

      if (activeCat) {
        filtered = filtered.filter((p) => p.category_slug === activeCat);
      }

      if (activeKeyword.trim()) {
        const q = activeKeyword.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.business_name.toLowerCase().includes(q) ||
            p.headline?.toLowerCase().includes(q) ||
            p.bio?.toLowerCase().includes(q) ||
            p.category_name.toLowerCase().includes(q) ||
            p.service_title?.toLowerCase().includes(q)
        );
      }

      if (activeCity !== "All Cities") {
        filtered = filtered.filter((p) =>
          p.primary_city.toLowerCase().includes(activeCity.toLowerCase())
        );
      }

      if (minRating !== "0") {
        const r = parseFloat(minRating);
        filtered = filtered.filter((p) => Number(p.average_rating) >= r);
      }

      if (verifiedOnly) {
        filtered = filtered.filter((p) => p.is_verified);
      }

      if (availableOnly) {
        filtered = filtered.filter((p) => p.is_available && p.is_schedule_available);
      }

      if (maxDistanceKm && maxDistanceKm !== "all" && activeCity !== "All Cities") {
        const d = parseFloat(maxDistanceKm);
        filtered = filtered.filter((p) => p.distance_km <= d);
      }

      setResults(filtered);
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handleReset = () => {
    setKeyword("");
    setCategorySlug("");
    setCity("All Cities");
    setSelectedNeighbourhood("");
    setMaxDistanceKm("all");
    setTargetDate("");
    setTargetTime("");
    setMinRating("0");
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setResults(initialResults);
    window.history.replaceState(null, "", "/explore-services");
  };

  return (
    <div className="space-y-8">
      {/* Everyday Services Directory Switcher */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-700">
        <Link
          href="/explore-services"
          className="px-3.5 py-2 rounded-xl bg-white text-[#0A2540] shadow-xs whitespace-nowrap"
        >
          🔧 Trades &amp; Technicians
        </Link>
        <Link
          href="/dispatch"
          className="px-3.5 py-2 rounded-xl hover:bg-white/80 hover:text-[#0A2540] transition whitespace-nowrap"
        >
          🏍️ Delivery &amp; Dispatch
        </Link>
        <Link
          href="/property-services"
          className="px-3.5 py-2 rounded-xl hover:bg-white/80 hover:text-[#0A2540] transition whitespace-nowrap"
        >
          🏠 Property Consultants
        </Link>
        <Link
          href="/businesses"
          className="px-3.5 py-2 rounded-xl hover:bg-white/80 hover:text-[#0A2540] transition whitespace-nowrap"
        >
          🏢 Local Businesses
        </Link>
        <Link
          href="/healthcare"
          className="px-3.5 py-2 rounded-xl hover:bg-white/80 hover:text-[#0A2540] transition whitespace-nowrap"
        >
          🏥 Healthcare Directory
        </Link>
        <Link
          href="/tasks"
          className="px-3.5 py-2 rounded-xl bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20 transition whitespace-nowrap ml-auto"
        >
          📝 Post Everyday Task
        </Link>
      </div>

      {/* Search & Filter Header Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Multi-City Service Hubs Selector */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            Operating Hub:
          </span>
          {["All Cities", "Port Harcourt", "Lagos", "Abuja"].map((hub) => {
            const selected = city === hub;
            return (
              <button
                key={hub}
                type="button"
                onClick={() => {
                  setCity(hub);
                  setSelectedNeighbourhood("");
                  applyFilters({ city: hub, neighbourhood: "" });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  selected
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {hub === "All Cities" ? "All Hubs (PH • Lagos • Abuja)" : `📍 ${hub}`}
              </button>
            );
          })}
        </div>

        {/* Keyword Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search by fault, trade, or specialist name (e.g. Inverter technician, borehole pump, AC repair, Chukwuma)..."
            className="w-full pl-10 pr-28 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          <span className="absolute left-3 text-slate-400 text-base">🔍</span>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="absolute right-1.5 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
          >
            Search
          </button>
        </div>

        {/* 6 Prompt 10 Filters: Category, Location, Distance, Availability, Rating, Verification */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Service Category
            </label>
            <select
              name="cat"
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
              }}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="">All Services &amp; Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.parent_id ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Location (City) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Operating City
            </label>
            <select
              name="city"
              value={city}
              onChange={(e) => {
                const nextCity = e.target.value;
                setCity(nextCity);
                setSelectedNeighbourhood("");
                applyFilters({ city: nextCity, neighbourhood: "" });
              }}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="All Cities">All Cities (PH, Lagos, Abuja)</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
            </select>
          </div>

          {/* 3. Neighbourhood / LGA (Port Harcourt & Surrounding) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Neighbourhood / LGA
            </label>
            <select
              value={selectedNeighbourhood}
              onChange={(e) => setSelectedNeighbourhood(e.target.value)}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="">All Neighbourhoods</option>
              {cityNeighbourhoods.map((n) => (
                <option key={n.id} value={n.slug}>
                  {n.name} ({n.lga})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Distance / Radius Filter (PostGIS Proximity) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Geographic Radius
            </label>
            <select
              name="distance"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="15">Within 15 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="all">Entire Region</option>
            </select>
          </div>

          {/* 5. Rating Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Min. Customer Rating
            </label>
            <select
              name="rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="0">Any Rating</option>
              <option value="4.0">★ 4.0 &amp; above</option>
              <option value="4.5">★ 4.5 &amp; above</option>
              <option value="4.8">★ 4.8 &amp; above</option>
            </select>
          </div>

          {/* 6. Availability & Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Target Appointment
            </label>
            <input
              type="date"
              name="availability"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        {/* Checkbox Toggles & Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="verified"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
              />
              <span className="font-semibold text-slate-700">Verified Pros Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="available"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
              />
              <span className="font-semibold text-slate-700">Confirmed Available Only</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              className="px-4 py-1.5 rounded-lg bg-[#0D9488] text-white font-bold hover:bg-[#0F766E] transition shadow-xs"
            >
              Apply Matching
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Matched Professionals ({results.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by Category Match, Proximity ({city}), Verified Availability, Experience, and Ratings.
          </p>
        </div>

        <Link
          href="/book"
          className="px-4 py-2 rounded-lg bg-[#0F172A] text-teal-300 text-xs font-bold hover:bg-slate-800 transition"
        >
          Post a Service Request →
        </Link>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-2xl mx-auto flex items-center justify-center">
            📍
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No direct profile matches in {city} under this specific filter
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No individual provider records match your exact search filters. Rather than showing fabricated results, EasyLife allows you to post an everyday task or custom request, and our accredited providers will prepare quotations for you.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/book?city=${encodeURIComponent(city)}`}
              className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
            >
              Submit Service Request
            </Link>
            <Link
              href={`/tasks`}
              className="px-5 py-2.5 rounded-xl bg-[#0A2540] text-white text-xs font-bold hover:bg-[#1E3A5F] transition shadow-xs"
            >
              Post an Everyday Task
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((pro) => (
            <div
              key={pro.professional_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-[#0D9488] hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Pro Avatar & Basic info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-full bg-[#0D9488] text-white font-black text-lg flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.business_name} className="w-full h-full object-cover" />
                    ) : (
                      pro.business_name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {pro.business_name}
                      </h3>
                      {pro.is_verified && (
                        <span className="text-[#0D9488] shrink-0" title="Verified Professional">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {pro.headline || `${pro.years_of_experience} Years Field Experience`}
                    </p>

                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-bold text-amber-500">
                        ★ {Number(pro.average_rating) > 0 ? Number(pro.average_rating).toFixed(1) : "5.0"}
                      </span>
                      <span className="text-slate-400">({pro.review_count} reviews)</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">
                        {pro.completed_jobs_count} completed jobs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pro.bio || "Accredited technical trade professional operating on EasyLife."}
                </p>

                {/* Proximity, Availability & Category Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#0D9488] font-semibold border border-teal-200">
                    {pro.category_name}
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    📍 {pro.distance_km < 50 ? `${pro.distance_km.toFixed(1)} km away` : pro.primary_city}
                  </span>

                  {/* Strictly enforce: Do not claim available unless supported by availability data */}
                  {pro.is_available && pro.is_schedule_available ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      ● Available
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                      ○ Book in Advance
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Call-out Rate & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Starting Call-out Fee
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {pro.base_callout_fee_kobo > 0
                      ? formatNaira(pro.base_callout_fee_kobo)
                      : "Standard Rate"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/professionals/${pro.professional_id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/book?pro=${pro.professional_id}`}
                    className="px-4 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
