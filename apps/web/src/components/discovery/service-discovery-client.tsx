"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CatalogueCategoryNode,
  ProfessionalDiscoverySort,
} from "@easylife/shared-types";
import type { OperatingNeighbourhood, MatchedProfessionalItem } from "@/lib/supabase/matching";

export interface DiscoveryUnavailableNotice {
  kind: "service" | "category" | "subcategory";
  name: string;
  reason: string;
  alternatives: Array<{
    label: string;
    href: string;
  }>;
}

interface ServiceDiscoveryClientProps {
  catalogueTree: CatalogueCategoryNode[];
  neighbourhoods: OperatingNeighbourhood[];
  initialResults: MatchedProfessionalItem[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  defaultCity?: string;
  defaultCategorySlug?: string;
  defaultSubcategorySlug?: string;
  defaultServiceSlug?: string;
  defaultKeyword?: string;
  defaultArea?: string;
  defaultDistance?: string;
  defaultDate?: string;
  defaultTime?: string;
  defaultRating?: string;
  defaultVerified?: boolean;
  defaultAvailable?: boolean;
  defaultProviderType?: string;
  defaultSort?: ProfessionalDiscoverySort;
  unavailableNotice?: DiscoveryUnavailableNotice | null;
  activeServiceBookingHref?: string;
}

export function ServiceDiscoveryClient({
  catalogueTree,
  neighbourhoods,
  initialResults,
  totalCount,
  currentPage = 1,
  pageSize = 9,
  defaultCity = "All Cities",
  defaultCategorySlug = "",
  defaultSubcategorySlug = "",
  defaultServiceSlug = "",
  defaultKeyword = "",
  defaultArea = "",
  defaultDistance = "all",
  defaultDate = "",
  defaultTime = "",
  defaultRating = "0",
  defaultVerified = false,
  defaultAvailable = false,
  defaultProviderType = "",
  defaultSort = "relevance",
  unavailableNotice = null,
  activeServiceBookingHref,
}: ServiceDiscoveryClientProps) {
  const router = useRouter();
  const [results, setResults] = useState<MatchedProfessionalItem[]>(initialResults);
  const [isPending, startTransition] = useTransition();

  // Search filter states
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [categorySlug, setCategorySlug] = useState(defaultCategorySlug);
  const [subcategorySlug, setSubcategorySlug] = useState(defaultSubcategorySlug);
  const [serviceSlug, setServiceSlug] = useState(defaultServiceSlug);
  const [city, setCity] = useState(defaultCity);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState(defaultArea);
  const [maxDistanceKm, setMaxDistanceKm] = useState<string>(defaultDistance);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [targetTime, setTargetTime] = useState(defaultTime);
  const [minRating, setMinRating] = useState<string>(defaultRating);
  const [verifiedOnly, setVerifiedOnly] = useState(defaultVerified);
  const [availableOnly, setAvailableOnly] = useState(defaultAvailable);
  const [providerType, setProviderType] = useState(defaultProviderType);
  const [sortBy, setSortBy] = useState<ProfessionalDiscoverySort>(defaultSort);

  // Sync client state when server-side search results or URL-driven defaults update
  useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);

  useEffect(() => {
    setCity(defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    setCategorySlug(defaultCategorySlug);
  }, [defaultCategorySlug]);

  useEffect(() => {
    setSubcategorySlug(defaultSubcategorySlug);
  }, [defaultSubcategorySlug]);

  useEffect(() => {
    setServiceSlug(defaultServiceSlug);
  }, [defaultServiceSlug]);

  useEffect(() => {
    setKeyword(defaultKeyword);
  }, [defaultKeyword]);

  useEffect(() => {
    setSelectedNeighbourhood(defaultArea);
  }, [defaultArea]);

  useEffect(() => {
    setMaxDistanceKm(defaultDistance);
  }, [defaultDistance]);

  useEffect(() => {
    setTargetDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    setTargetTime(defaultTime);
  }, [defaultTime]);

  useEffect(() => {
    setMinRating(defaultRating);
  }, [defaultRating]);

  useEffect(() => {
    setVerifiedOnly(defaultVerified);
  }, [defaultVerified]);

  useEffect(() => {
    setAvailableOnly(defaultAvailable);
  }, [defaultAvailable]);

  useEffect(() => {
    setProviderType(defaultProviderType);
  }, [defaultProviderType]);

  useEffect(() => {
    setSortBy(defaultSort);
  }, [defaultSort]);

  const selectedCategoryNode = useMemo(
    () => catalogueTree.find((c) => c.slug === categorySlug) || null,
    [catalogueTree, categorySlug]
  );

  const availableSubcategories = useMemo(
    () => selectedCategoryNode?.subcategories || [],
    [selectedCategoryNode]
  );

  const selectedSubcategoryNode = useMemo(
    () => availableSubcategories.find((s) => s.slug === subcategorySlug) || null,
    [availableSubcategories, subcategorySlug]
  );

  const availableServices = useMemo(() => {
    if (selectedSubcategoryNode) {
      return selectedSubcategoryNode.services || [];
    }
    if (selectedCategoryNode) {
      return [
        ...(selectedCategoryNode.direct_services || []),
        ...selectedCategoryNode.subcategories.flatMap((s) => s.services || []),
      ];
    }
    return catalogueTree.flatMap((c) => [
      ...(c.direct_services || []),
      ...c.subcategories.flatMap((s) => s.services || []),
    ]);
  }, [catalogueTree, selectedCategoryNode, selectedSubcategoryNode]);

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

  const buildQueryParams = (overrides?: {
    city?: string;
    neighbourhood?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    serviceSlug?: string;
    keyword?: string;
    sortBy?: ProfessionalDiscoverySort;
    providerType?: string;
    page?: number;
  }) => {
    const activeCity = overrides?.city ?? city;
    const activeArea = overrides?.neighbourhood ?? selectedNeighbourhood;
    const activeCat = overrides?.categorySlug ?? categorySlug;
    const activeSub = overrides?.subcategorySlug ?? subcategorySlug;
    const activeSrv = overrides?.serviceSlug ?? serviceSlug;
    const activeKeyword = overrides?.keyword ?? keyword;
    const activeSort = overrides?.sortBy ?? sortBy;
    const activeType = overrides?.providerType ?? providerType;
    const activePage = overrides?.page ?? 1;

    const queryParams = new URLSearchParams();
    if (activeKeyword.trim()) queryParams.set("q", activeKeyword.trim());
    if (activeCat) queryParams.set("cat", activeCat);
    if (activeSub) queryParams.set("sub", activeSub);
    if (activeSrv) queryParams.set("service", activeSrv);
    if (activeCity && activeCity !== "All Cities") queryParams.set("city", activeCity);
    if (activeArea) queryParams.set("area", activeArea);
    if (maxDistanceKm && maxDistanceKm !== "all") queryParams.set("distance", maxDistanceKm);
    if (targetDate) queryParams.set("date", targetDate);
    if (targetTime) queryParams.set("time", targetTime);
    if (minRating !== "0") queryParams.set("rating", minRating);
    if (verifiedOnly) queryParams.set("verified", "true");
    if (availableOnly) queryParams.set("available", "true");
    if (activeType) queryParams.set("type", activeType);
    if (activeSort && activeSort !== "relevance") queryParams.set("sort", activeSort);
    if (activePage > 1) queryParams.set("page", String(activePage));
    return queryParams;
  };

  const applyFilters = (overrides?: {
    city?: string;
    neighbourhood?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    serviceSlug?: string;
    keyword?: string;
    sortBy?: ProfessionalDiscoverySort;
    providerType?: string;
    page?: number;
  }) => {
    const qs = buildQueryParams({ ...overrides, page: overrides?.page ?? 1 }).toString();
    startTransition(() => {
      router.push(qs ? `/explore-services?${qs}` : "/explore-services", { scroll: false });
    });
  };

  const buildPageHref = (targetPage: number) => {
    const qs = buildQueryParams({ page: targetPage }).toString();
    return qs ? `/explore-services?${qs}` : "/explore-services";
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handleReset = () => {
    setKeyword("");
    setCategorySlug("");
    setSubcategorySlug("");
    setServiceSlug("");
    setCity("All Cities");
    setSelectedNeighbourhood("");
    setMaxDistanceKm("all");
    setTargetDate("");
    setTargetTime("");
    setMinRating("0");
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setProviderType("");
    setSortBy("relevance");
    startTransition(() => {
      router.push("/explore-services", { scroll: false });
    });
  };

  const resolvedTotalCount =
    typeof totalCount === "number" ? totalCount : results.length;
  const totalPages = Math.max(1, Math.ceil(resolvedTotalCount / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const showingFrom =
    resolvedTotalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(resolvedTotalCount, (currentPage - 1) * pageSize + results.length);
  const pageNumbers: number[] = [];
  for (
    let p = Math.max(1, clampedPage - 2);
    p <= Math.min(totalPages, clampedPage + 2);
    p += 1
  ) {
    pageNumbers.push(p);
  }

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
          href="/services"
          className="px-3.5 py-2 rounded-xl hover:bg-white/80 hover:text-[#0A2540] transition whitespace-nowrap"
        >
          📚 Full Service Catalogue
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
            placeholder="Search by fault, individual service, or specialist name (e.g. Inverter technician, borehole pump, AC repair)..."
            className="w-full pl-10 pr-28 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          <span className="absolute left-3 text-slate-400 text-base">🔍</span>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="absolute right-1.5 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
          >
            {isPending ? "Matching..." : "Search"}
          </button>
        </div>

        {/* 3-Tier Catalogue + Location/Radius/Rating/Availability Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Main Category */}
          <div>
            <label
              htmlFor="discovery-cat"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Major Category
            </label>
            <select
              id="discovery-cat"
              name="cat"
              value={categorySlug}
              onChange={(e) => {
                const nextCat = e.target.value;
                setCategorySlug(nextCat);
                setSubcategorySlug("");
                setServiceSlug("");
                applyFilters({
                  categorySlug: nextCat,
                  subcategorySlug: "",
                  serviceSlug: "",
                });
              }}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="">All Major Categories</option>
              {catalogueTree.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Subcategory */}
          <div>
            <label
              htmlFor="discovery-sub"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Subcategory
            </label>
            <select
              id="discovery-sub"
              name="sub"
              value={subcategorySlug}
              disabled={!categorySlug || availableSubcategories.length === 0}
              onChange={(e) => {
                const nextSub = e.target.value;
                setSubcategorySlug(nextSub);
                setServiceSlug("");
                applyFilters({
                  subcategorySlug: nextSub,
                  serviceSlug: "",
                });
              }}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900 disabled:opacity-55"
            >
              <option value="">
                {categorySlug
                  ? `All Subcategories (${availableSubcategories.length})`
                  : "Select a Category first"}
              </option>
              {availableSubcategories.map((sub) => (
                <option key={sub.id} value={sub.slug}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Individual Service */}
          <div>
            <label
              htmlFor="discovery-service"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Specific Service
            </label>
            <select
              id="discovery-service"
              name="service"
              value={serviceSlug}
              onChange={(e) => {
                const nextSrv = e.target.value;
                setServiceSlug(nextSrv);
                applyFilters({ serviceSlug: nextSrv });
              }}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            >
              <option value="">
                All Services ({availableServices.length})
              </option>
              {availableServices.map((srv) => (
                <option key={srv.id} value={srv.slug}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Location (City) */}
          <div>
            <label
              htmlFor="discovery-city"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Operating City
            </label>
            <select
              id="discovery-city"
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

          {/* 5. Neighbourhood / LGA */}
          <div>
            <label
              htmlFor="discovery-area"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Neighbourhood / LGA
            </label>
            <select
              id="discovery-area"
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

          {/* 6. Distance / Radius Filter (PostGIS Proximity) */}
          <div>
            <label
              htmlFor="discovery-distance"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Geographic Radius
            </label>
            <select
              id="discovery-distance"
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

          {/* 7. Rating Filter */}
          <div>
            <label
              htmlFor="discovery-rating"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Min. Customer Rating
            </label>
            <select
              id="discovery-rating"
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

          {/* 8. Availability & Date */}
          <div>
            <label
              htmlFor="discovery-date"
              className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1"
            >
              Target Appointment
            </label>
            <input
              id="discovery-date"
              type="date"
              name="availability"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-9 px-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        {/* Sort By + Provider Type + Checkbox Toggles & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="discovery-sort"
                className="font-bold text-slate-600 uppercase tracking-wider text-[11px]"
              >
                Sort:
              </label>
              <select
                id="discovery-sort"
                name="sort"
                value={sortBy}
                onChange={(e) => {
                  const nextSort = e.target.value as ProfessionalDiscoverySort;
                  setSortBy(nextSort);
                  applyFilters({ sortBy: nextSort });
                }}
                className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
              >
                <option value="relevance">Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="distance">Nearest Distance</option>
                <option value="experience">Most Experienced</option>
                <option value="jobs">Most Completed Jobs</option>
                <option value="price_asc">Lowest Call-out Fee</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label
                htmlFor="discovery-type"
                className="font-bold text-slate-600 uppercase tracking-wider text-[11px]"
              >
                Provider:
              </label>
              <select
                id="discovery-type"
                name="type"
                value={providerType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setProviderType(nextType);
                  applyFilters({ providerType: nextType });
                }}
                className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-900"
              >
                <option value="">All Providers</option>
                <option value="individual">Independent Specialists</option>
                <option value="company">Technical Firms</option>
              </select>
            </div>

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
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg bg-[#0D9488] text-white font-bold hover:bg-[#0F766E] transition shadow-xs disabled:opacity-60"
            >
              {isPending ? "Updating..." : "Apply Matching"}
            </button>
          </div>
        </div>
      </div>

      {/* Unavailable Service / Category Graceful Notice */}
      {unavailableNotice && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                Temporarily Unavailable {unavailableNotice.kind}
              </span>
              <h3 className="text-base font-bold text-amber-950 mt-1">
                &ldquo;{unavailableNotice.name}&rdquo; is currently paused
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 mt-0.5">
                {unavailableNotice.reason}
              </p>
            </div>
            <Link
              href={
                activeServiceBookingHref ||
                `/book?title=${encodeURIComponent(unavailableNotice.name)}${
                  city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""
                }`
              }
              className="px-4 py-2 rounded-xl bg-[#154752] text-white text-xs font-bold hover:bg-[#0D282E] shrink-0 self-start sm:self-center"
            >
              Submit Custom Request →
            </Link>
          </div>

          {unavailableNotice.alternatives.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-amber-950">Active Alternatives:</span>
              {unavailableNotice.alternatives.map((alt) => (
                <Link
                  key={alt.href}
                  href={alt.href}
                  className="rounded-full bg-white border border-amber-300 px-3 py-1 text-xs font-semibold text-[#154752] hover:border-[#24989A] hover:text-[#24989A] transition-colors"
                >
                  {alt.label} →
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Matched Professionals ({resolvedTotalCount})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {resolvedTotalCount > 0 && totalPages > 1
              ? `Showing ${showingFrom}–${showingTo} of ${resolvedTotalCount} verified professionals • `
              : ""}
            Ranked by Service &amp; Category Match, Proximity ({city}), Verified Availability, Experience, and Ratings.
          </p>
        </div>

        <Link
          href={activeServiceBookingHref || `/book${city !== "All Cities" ? `?city=${encodeURIComponent(city)}` : ""}`}
          className="px-4 py-2 rounded-lg bg-[#0F172A] text-teal-300 text-xs font-bold hover:bg-slate-800 transition self-start sm:self-auto"
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
              href={activeServiceBookingHref || `/book?city=${encodeURIComponent(city)}`}
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
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pro.avatar_url}
                        alt={pro.business_name}
                        width={52}
                        height={52}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
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
                    href={
                      activeServiceBookingHref
                        ? `${activeServiceBookingHref}&pro=${encodeURIComponent(pro.professional_id)}`
                        : `/book?pro=${pro.professional_id}`
                    }
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

      {/* Server-Backed Pagination Bar */}
      {totalPages > 1 && (
        <nav
          aria-label="Professional directory pagination"
          className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200"
        >
          <p className="text-xs font-medium text-slate-600">
            Showing {showingFrom}–{showingTo} of {resolvedTotalCount} verified professionals (Page{" "}
            {currentPage} of {totalPages})
          </p>
          <div className="flex items-center gap-1.5">
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                scroll={false}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#154752] hover:bg-slate-50"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400">
                ← Previous
              </span>
            )}

            {pageNumbers.map((p) => (
              <Link
                key={p}
                href={buildPageHref(p)}
                scroll={false}
                aria-current={p === currentPage ? "page" : undefined}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  p === currentPage
                    ? "bg-[#154752] text-white border-[#154752]"
                    : "bg-white text-[#154752] border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}
              </Link>
            ))}

            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                scroll={false}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#154752] hover:bg-slate-50"
              >
                Next →
              </Link>
            ) : (
              <span className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400">
                Next →
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
