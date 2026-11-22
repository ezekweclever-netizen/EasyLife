import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCatalogueServiceBySlugOrId,
  getCustomerProfile,
  getServiceCatalogueTree,
  normalizeCatalogueSlugAlias,
  recordCatalogueSearchSignal,
  searchServiceCataloguePaginated,
} from "@/lib/supabase/customer";
import {
  checkCatalogueCategoryAvailability,
  checkCatalogueServiceAvailability,
} from "@/lib/supabase/catalogue-availability";
import {
  getOperatingNeighbourhoods,
  getNeighbourhoodCoordinates,
  searchAndMatchProfessionalsPaginated,
} from "@/lib/supabase/matching";
import { CustomerHeader } from "@/components/customer/customer-header";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { Icon } from "@/components/site/icons";
import {
  ServiceDiscoveryClient,
  type DiscoveryUnavailableNotice,
} from "@/components/discovery/service-discovery-client";
import {
  formatDurationLabel,
  formatServicePriceRange,
  resolveCatalogueIcon,
} from "@/lib/catalogue-display";
import type {
  CatalogueCategoryNode,
  CatalogueServiceItem,
  CatalogueSubcategoryNode,
  ProfessionalDiscoverySort,
} from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Service Discovery & Professional Matching — EasyLife Nigeria",
  description:
    "Discover verified technicians, electricians, plumbers, generator engineers, and artisans in Port Harcourt, Lagos, and Abuja using location proximity, availability, and customer ratings.",
};

const VALID_SORT_MODES = new Set<ProfessionalDiscoverySort>([
  "relevance",
  "rating",
  "distance",
  "experience",
  "jobs",
  "price_asc",
]);

const PRO_PAGE_SIZE = 9;
const KEYWORD_SRV_PAGE_SIZE = 6;

interface ExploreServicesPageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    sub?: string;
    service?: string;
    group?: string;
    city?: string;
    area?: string;
    distance?: string;
    date?: string;
    time?: string;
    rating?: string;
    verified?: string;
    available?: string;
    type?: string;
    sort?: string;
    page?: string;
    srvPage?: string;
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
    sub = "",
    service = "",
    group = "",
    city = "All Cities",
    area = "",
    distance = "all",
    date = "",
    time = "",
    rating = "0",
    verified = "",
    available = "",
    type = "",
    sort = "relevance",
    page = "1",
    srvPage = "1",
  } = await searchParams;

  const normalizedCatParam = cat.trim()
    ? normalizeCatalogueSlugAlias(cat.trim())
    : "";
  const normalizedSubParam = sub.trim()
    ? normalizeCatalogueSlugAlias(sub.trim())
    : "";
  const minRating = parseFloat(rating) || 0;
  const verifiedOnly = verified === "true";
  const availableOnly = available === "true";
  const maxDistanceKm = distance === "all" ? undefined : parseFloat(distance) || 25;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const currentSrvPage = Math.max(1, Number.parseInt(srvPage, 10) || 1);
  const sortBy: ProfessionalDiscoverySort = VALID_SORT_MODES.has(
    sort as ProfessionalDiscoverySort
  )
    ? (sort as ProfessionalDiscoverySort)
    : "relevance";

  // Retrieve GPS + normalized LGA/name if neighbourhood or specific city hub was selected
  // Load 3-tier catalogue tree + cached neighbourhoods + explicit service slug lookup first in parallel
  const [auth, catalogueTree, neighbourhoods, explicitService] =
    await Promise.all([
      getAuthenticatedUser(),
      getServiceCatalogueTree(false),
      getOperatingNeighbourhoods(),
      service.trim() ? getCatalogueServiceBySlugOrId(service.trim()) : Promise.resolve(null),
    ]);

  let refLat: number | undefined;
  let refLng: number | undefined;
  let resolvedHood: {
    latitude: number;
    longitude: number;
    name: string;
    lga: string;
  } | null = null;

  if (area) {
    const areaLower = area.trim().toLowerCase();
    const cityLower = city && city !== "All Cities" ? city.trim().toLowerCase() : "";
    const cachedMatch =
      neighbourhoods.find(
        (n) =>
          (!cityLower || n.city.toLowerCase().includes(cityLower)) &&
          (n.slug.toLowerCase() === areaLower || n.name.toLowerCase().includes(areaLower))
      ) || null;
    if (cachedMatch) {
      resolvedHood = {
        latitude: cachedMatch.latitude,
        longitude: cachedMatch.longitude,
        name: cachedMatch.name,
        lga: cachedMatch.lga,
      };
    } else {
      resolvedHood = await getNeighbourhoodCoordinates(area, city);
    }
    if (resolvedHood) {
      refLat = resolvedHood.latitude;
      refLng = resolvedHood.longitude;
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

  // Resolve active Main Category, Subcategory, and Individual Service cleanly across all URL shapes
  let selectedCategory: CatalogueCategoryNode | null = null;
  let selectedSubcategory: CatalogueSubcategoryNode | null = null;
  const selectedService: CatalogueServiceItem | null = explicitService;

  if (normalizedCatParam) {
    selectedCategory =
      catalogueTree.find((c) => c.slug === normalizedCatParam) || null;
    if (!selectedCategory) {
      // Support legacy deep-link where `?cat=` carried a subcategory slug
      for (const mainCat of catalogueTree) {
        const subMatch = mainCat.subcategories.find(
          (s) => s.slug === normalizedCatParam
        );
        if (subMatch) {
          selectedCategory = mainCat;
          selectedSubcategory = subMatch;
          break;
        }
      }
    }
  }

  if (normalizedSubParam && !selectedSubcategory) {
    if (selectedCategory) {
      selectedSubcategory =
        selectedCategory.subcategories.find(
          (s) => s.slug === normalizedSubParam
        ) || null;
    } else {
      for (const mainCat of catalogueTree) {
        const subMatch = mainCat.subcategories.find(
          (s) => s.slug === normalizedSubParam
        );
        if (subMatch) {
          selectedCategory = mainCat;
          selectedSubcategory = subMatch;
          break;
        }
      }
    }
  }

  if (selectedService) {
    for (const mainCat of catalogueTree) {
      if (mainCat.direct_services.some((s) => s.id === selectedService.id)) {
        selectedCategory = selectedCategory || mainCat;
        break;
      }
      const subMatch = mainCat.subcategories.find((sc) =>
        sc.services.some((s) => s.id === selectedService.id)
      );
      if (subMatch) {
        selectedCategory = selectedCategory || mainCat;
        selectedSubcategory = selectedSubcategory || subMatch;
        break;
      }
    }
  }

  // Detect temporarily unavailable services or categories explicitly requested in URL
  let unavailableNotice: DiscoveryUnavailableNotice | null = null;
  if (service.trim() && !selectedService) {
    const srvAvailability = await checkCatalogueServiceAvailability(service.trim());
    if (srvAvailability.status === "unavailable") {
      const parentCatNode =
        catalogueTree.find((c) => c.id === srvAvailability.categoryId) || null;
      const parentSubNode =
        parentCatNode?.subcategories.find(
          (s) => s.id === srvAvailability.subcategoryId
        ) || null;
      const altServices = [
        ...(parentSubNode?.services || []),
        ...(parentCatNode?.direct_services || []),
        ...(parentCatNode?.subcategories.flatMap((s) => s.services) || []),
      ]
        .filter((item, idx, arr) => item.is_active && arr.findIndex((x) => x.id === item.id) === idx)
        .slice(0, 4);

      unavailableNotice = {
        kind: "service",
        name: srvAvailability.name || service.trim(),
        reason:
          srvAvailability.reason ||
          "This individual service is temporarily paused while operations update scheduling.",
        alternatives: altServices.map((alt) => ({
          label: alt.name,
          href: `/services/${encodeURIComponent(alt.slug)}`,
        })),
      };
    }
  } else if (normalizedSubParam && !selectedSubcategory) {
    const subAvailability = await checkCatalogueCategoryAvailability(normalizedSubParam);
    if (subAvailability.status === "unavailable") {
      const parentCatNode =
        catalogueTree.find((c) => c.id === subAvailability.categoryId) || null;
      unavailableNotice = {
        kind: "subcategory",
        name: subAvailability.name || normalizedSubParam,
        reason:
          subAvailability.reason ||
          "This subcategory is temporarily paused while operations update provider coverage.",
        alternatives: (parentCatNode?.subcategories || []).slice(0, 4).map((alt) => ({
          label: alt.name,
          href: `/explore-services?cat=${encodeURIComponent(parentCatNode!.slug)}&sub=${encodeURIComponent(alt.slug)}`,
        })),
      };
    }
  } else if (normalizedCatParam && !selectedCategory) {
    const catAvailability = await checkCatalogueCategoryAvailability(normalizedCatParam);
    if (catAvailability.status === "unavailable") {
      unavailableNotice = {
        kind: "category",
        name: catAvailability.name || normalizedCatParam,
        reason:
          catAvailability.reason ||
          "This category is temporarily paused while operations update provider coverage.",
        alternatives: catalogueTree.slice(0, 4).map((alt) => ({
          label: alt.name,
          href: `/explore-services?cat=${encodeURIComponent(alt.slug)}`,
        })),
      };
    }
  }

  const activeGroup = group && CATEGORY_GROUPS[group] ? CATEGORY_GROUPS[group] : null;
  const effectiveCategorySlug =
    selectedSubcategory?.slug ||
    selectedCategory?.slug ||
    (!selectedService && activeGroup && activeGroup.slugs.length === 1
      ? activeGroup.slugs[0]!
      : "");

  const isMultiCategoryGroupScope = Boolean(
    activeGroup &&
      !selectedCategory &&
      !selectedSubcategory &&
      !selectedService &&
      activeGroup.slugs.length > 1
  );

  const [proMatchRes, keywordCatalogueRes, profile] = await Promise.all([
    searchAndMatchProfessionalsPaginated({
      keyword: q,
      categorySlug: effectiveCategorySlug,
      serviceId: selectedService?.id || undefined,
      city: city === "All Cities" ? undefined : city,
      lga: resolvedHood?.lga || undefined,
      neighbourhood: resolvedHood?.name || area || undefined,
      latitude: refLat,
      longitude: refLng,
      maxDistanceKm,
      targetDate: date,
      targetTime: time,
      minRating,
      verifiedOnly,
      availableOnly,
      providerType: type || undefined,
      sortBy,
      limit: isMultiCategoryGroupScope ? 60 : PRO_PAGE_SIZE,
      offset: isMultiCategoryGroupScope ? 0 : (currentPage - 1) * PRO_PAGE_SIZE,
    }),
    q.trim()
      ? searchServiceCataloguePaginated({
          query: q.trim(),
          categorySlug: selectedCategory?.slug || undefined,
          subcategorySlug: selectedSubcategory?.slug || undefined,
          limit: KEYWORD_SRV_PAGE_SIZE,
          offset: (currentSrvPage - 1) * KEYWORD_SRV_PAGE_SIZE,
        })
      : Promise.resolve(null),
    auth ? getCustomerProfile(auth.user.id, auth.accessToken) : Promise.resolve(null),
  ]);

  const groupFilteredAll = isMultiCategoryGroupScope
    ? proMatchRes.items.filter((pro) =>
        activeGroup!.slugs.includes(pro.category_slug || "")
      )
    : proMatchRes.items;

  const filteredMatchedPros = isMultiCategoryGroupScope
    ? groupFilteredAll.slice(
        (currentPage - 1) * PRO_PAGE_SIZE,
        currentPage * PRO_PAGE_SIZE
      )
    : groupFilteredAll;

  const totalMatchedProsCount = isMultiCategoryGroupScope
    ? groupFilteredAll.length
    : proMatchRes.totalCount;

  if (
    q.trim().length >= 2 &&
    currentPage === 1 &&
    currentSrvPage === 1 &&
    !proMatchRes.hasError
  ) {
    const combinedExploreCount =
      (keywordCatalogueRes?.totalCount ?? 0) + totalMatchedProsCount;
    after(async () => {
      await recordCatalogueSearchSignal({
        query: q.trim(),
        surface: "explore",
        city: city !== "All Cities" ? city : undefined,
        resolvedCategoryId:
          selectedCategory?.id || keywordCatalogueRes?.items[0]?.category_id || null,
        resolvedServiceId:
          selectedService?.id || keywordCatalogueRes?.items[0]?.id || null,
        resultCount: combinedExploreCount,
      });
    });
  }

  const headerCity =
    city && city !== "All Cities" ? city : profile?.city || "Port Harcourt";

  const cityQs = city && city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : "";

  const drilldownServices: CatalogueServiceItem[] = selectedSubcategory
    ? selectedSubcategory.services
    : selectedCategory
    ? [
        ...(selectedCategory.direct_services || []),
        ...selectedCategory.subcategories.flatMap((sc) => sc.services || []),
      ]
    : [];

  const activeServiceBookingHref = selectedService
    ? `/book?category=${encodeURIComponent(
        selectedCategory?.id || selectedService.category_id || ""
      )}&service=${encodeURIComponent(selectedService.id)}&title=${encodeURIComponent(
        selectedService.name
      )}${city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""}`
    : selectedCategory
    ? `/book?category=${encodeURIComponent(selectedCategory.id)}${
        city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""
      }`
    : undefined;

  const buildFilterHref = (params: {
    catSlug?: string;
    subSlug?: string;
    srvSlug?: string;
    srvPageNum?: number;
  }) => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (params.catSlug) sp.set("cat", params.catSlug);
    if (params.subSlug) sp.set("sub", params.subSlug);
    if (params.srvSlug) sp.set("service", params.srvSlug);
    if (city && city !== "All Cities") sp.set("city", city);
    if (area) sp.set("area", area);
    if (distance && distance !== "all") sp.set("distance", distance);
    if (sortBy !== "relevance") sp.set("sort", sortBy);
    if (type) sp.set("type", type);
    if (params.srvPageNum && params.srvPageNum > 1) {
      sp.set("srvPage", String(params.srvPageNum));
    }
    const out = sp.toString();
    return out ? `/explore-services?${out}` : "/explore-services";
  };

  const keywordServicesTotalPages = keywordCatalogueRes
    ? Math.max(1, Math.ceil(keywordCatalogueRes.totalCount / KEYWORD_SRV_PAGE_SIZE))
    : 1;

  const pageContent = (
    <>
      {/* Hero */}
      <PageHero
        eyebrow="Multi-City Service Discovery"
        title="Find &amp; Book Verified Local Professionals"
        description="Connect with accredited technicians and trade specialists across Port Harcourt, Lagos, and Abuja. Browse by Main Category, Subcategory, or Individual Service."
      >
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-teal-200">
          <span>Popular Trades:</span>
          {catalogueTree.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/explore-services?cat=${encodeURIComponent(c.slug)}${cityQs}`}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#0D223A]/10 hover:bg-white dark:bg-[#0D223A]/20 text-white font-medium transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </PageHero>

      {/* Main Matching & Discovery Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {activeGroup && (
          <div className="rounded-2xl border border-[#24989A]/30 dark:border-teal-800 bg-[#EEF9F9] dark:bg-teal-950/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#154752] text-white text-xs font-bold uppercase tracking-wider">
                  Category Group Selected
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#154752] dark:text-white">
                  {activeGroup.label}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#4E6065] dark:text-slate-300">
                {activeGroup.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {catalogueTree
                  .filter((c) => activeGroup.slugs.includes(c.slug))
                  .map((subCat) => (
                    <Link
                      key={subCat.id}
                      href={`/explore-services?cat=${encodeURIComponent(subCat.slug)}${cityQs}`}
                      className="px-3 py-1 rounded-full bg-white dark:bg-[#0D223A] border border-[#DAE7E7] dark:border-[#163654] text-xs sm:text-sm font-semibold text-[#154752] dark:text-slate-200 hover:border-[#24989A] hover:text-[#24989A] transition"
                    >
                      {subCat.name}
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
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] dark:border-[#163654] text-sm font-semibold text-[#1F2F34] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                Show All Categories
              </Link>
            </div>
          </div>
        )}

        {/* 3-Tier Interactive Hierarchy Drilldown: Main Category -> Subcategory -> Individual Service */}
        <section
          aria-label="Service hierarchy navigation"
          className="rounded-2xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] dark:border-[#163654] p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#154752] dark:text-white">
                Browse by Category, Subcategory &amp; Individual Service
              </h2>
              <p className="text-xs text-[#68797C] dark:text-slate-400">
                Drill down cleanly from {catalogueTree.length} major categories into subcategories and standardised services.
              </p>
            </div>
            <Link
              href="/services"
              className="text-xs font-bold text-[#24989A] dark:text-[#5CD3D5] hover:underline"
            >
              Open Full 3-Tier Catalogue →
            </Link>
          </div>

          {/* Tier 1: Main Categories */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={buildFilterHref({})}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !selectedCategory
                  ? "bg-[#154752] dark:bg-[#24989A] text-white border-[#154752] dark:border-[#24989A]"
                  : "bg-[#F8FBFB] dark:bg-[#071526] text-[#154752] dark:text-slate-200 border-[#DAE7E7] dark:border-[#163654] hover:border-[#24989A] dark:hover:border-[#24989A]"
              }`}
            >
              All Categories
            </Link>
            {catalogueTree.map((mainCat) => {
              const isSelected = selectedCategory?.id === mainCat.id;
              return (
                <Link
                  key={mainCat.id}
                  href={buildFilterHref({ catSlug: mainCat.slug })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    isSelected
                      ? "bg-[#154752] dark:bg-[#24989A] text-white border-[#154752] dark:border-[#24989A]"
                      : "bg-[#F8FBFB] dark:bg-[#071526] text-[#154752] dark:text-slate-200 border-[#DAE7E7] dark:border-[#163654] hover:border-[#24989A] dark:hover:border-[#24989A]"
                  }`}
                >
                  {mainCat.name}
                </Link>
              );
            })}
          </div>

          {/* Tier 2: Subcategories for Selected Main Category */}
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div className="pt-3 border-t border-[#EEF6F7] dark:border-[#163654] space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#68797C] dark:text-slate-400">
                Subcategories in {selectedCategory.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={buildFilterHref({ catSlug: selectedCategory.slug })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    !selectedSubcategory
                      ? "bg-[#24989A] text-white border-[#24989A]"
                      : "bg-[#F3F8F8] dark:bg-[#071526] text-[#154752] dark:text-slate-200 border-[#DAE7E7] dark:border-[#163654] hover:border-[#24989A] dark:hover:border-[#24989A]"
                  }`}
                >
                  All in {selectedCategory.name}
                </Link>
                {selectedCategory.subcategories.map((subNode) => {
                  const isSubSelected = selectedSubcategory?.id === subNode.id;
                  return (
                    <Link
                      key={subNode.id}
                      href={buildFilterHref({
                        catSlug: selectedCategory!.slug,
                        subSlug: subNode.slug,
                      })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        isSubSelected
                          ? "bg-[#24989A] text-white border-[#24989A]"
                          : "bg-[#F3F8F8] dark:bg-[#071526] text-[#154752] dark:text-slate-200 border-[#DAE7E7] dark:border-[#163654] hover:border-[#24989A] dark:hover:border-[#24989A]"
                      }`}
                    >
                      {subNode.name} ({subNode.services.length})
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tier 3: Individual Services in Selected Scope */}
          {selectedCategory && drilldownServices.length > 0 && (
            <div className="pt-3 border-t border-[#EEF6F7] dark:border-[#163654] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#68797C] dark:text-slate-400">
                  Individual Services in {selectedSubcategory?.name || selectedCategory.name} ({drilldownServices.length})
                </p>
                {selectedService && (
                  <Link
                    href={buildFilterHref({
                      catSlug: selectedCategory.slug,
                      subSlug: selectedSubcategory?.slug,
                    })}
                    className="text-xs font-semibold text-[#24989A] dark:text-[#5CD3D5] hover:underline"
                  >
                    Show All in {selectedSubcategory?.name || selectedCategory.name}
                  </Link>
                )}
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                  drilldownServices.length > 9
                    ? "max-h-[420px] overflow-y-auto pr-1"
                    : ""
                }`}
              >
                {drilldownServices.map((srv) => {
                  const isSrvActive = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 transition-colors ${
                        isSrvActive
                          ? "border-[#24989A] bg-[#EEF9F9] dark:bg-teal-950/40"
                          : "border-[#DAE7E7] dark:border-[#163654] bg-[#F8FBFB] dark:bg-[#071526] hover:border-[#24989A]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-mono font-bold text-[#68797C] dark:text-slate-400">
                            {srv.service_code}
                          </span>
                          <span className="font-bold text-[#154752] dark:text-[#5CD3D5]">
                            {formatServicePriceRange(
                              srv.base_price_min_kobo,
                              srv.base_price_max_kobo
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm font-bold text-[#154752] dark:text-white">
                          {srv.name}
                        </p>
                        {srv.short_description && (
                          <p className="mt-1 text-xs text-[#4E6065] dark:text-slate-300 line-clamp-2">
                            {srv.short_description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold pt-2 border-t border-[#DAE7E7]/70 dark:border-[#163654]">
                        <Link
                          href={buildFilterHref({
                            catSlug: selectedCategory!.slug,
                            subSlug: selectedSubcategory?.slug,
                            srvSlug: srv.slug,
                          })}
                          className={
                            isSrvActive
                              ? "text-[#0F766E] dark:text-[#5CD3D5]"
                              : "text-[#24989A] dark:text-[#5CD3D5] hover:underline"
                          }
                        >
                          {isSrvActive ? "✓ Filtering Pros" : "Match Specialists"}
                        </Link>
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/services/${srv.slug}`}
                            className="text-[#154752] dark:text-slate-300 hover:underline"
                          >
                            Details
                          </Link>
                          <Link
                            href={`/book?category=${encodeURIComponent(
                              selectedCategory!.id
                            )}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(
                              srv.name
                            )}${city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""}`}
                            className="rounded-lg bg-[#154752] px-2.5 py-1 text-white hover:bg-[#0D282E]"
                          >
                            Book
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Active Individual Service Spotlight */}
        {selectedService && (
          <div className="rounded-2xl border border-[#24989A]/40 dark:border-[#163654] bg-white dark:bg-[#0D223A] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#154752] px-2.5 py-0.5 font-mono font-bold text-white">
                  {selectedService.service_code}
                </span>
                <span className="font-semibold text-[#24989A] dark:text-[#5CD3D5]">
                  Selected Service Filter
                </span>
                {selectedService.requires_trade_certification && (
                  <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 font-semibold text-[#0F766E] dark:text-[#5CD3D5]">
                    Trade Certification Checked
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#154752] dark:text-white">
                {selectedService.name}
              </h2>
              {selectedService.short_description && (
                <p className="text-sm text-[#4E6065] dark:text-slate-300 max-w-2xl">
                  {selectedService.short_description}
                </p>
              )}
              <p className="text-xs font-semibold text-[#154752] dark:text-slate-200">
                Estimate Benchmark:{" "}
                {formatServicePriceRange(
                  selectedService.base_price_min_kobo,
                  selectedService.base_price_max_kobo
                )}
                {formatDurationLabel(selectedService.estimated_duration_minutes)
                  ? ` • Est. ${formatDurationLabel(selectedService.estimated_duration_minutes)}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href={`/services/${selectedService.slug}`}
                className="rounded-xl border border-[#DAE7E7] dark:border-[#163654] bg-[#F3F8F8] dark:bg-[#071526] px-4 py-2 text-xs font-bold text-[#154752] dark:text-slate-200 hover:bg-[#EEF6F7] dark:hover:bg-slate-800"
              >
                View Service Specs
              </Link>
              {activeServiceBookingHref && (
                <Link
                  href={activeServiceBookingHref}
                  className="rounded-xl bg-[#24989A] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D7E80]"
                >
                  Book This Service →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Keyword-Matched Individual Catalogue Services */}
        {q.trim() && keywordCatalogueRes && keywordCatalogueRes.items.length > 0 && (
          <section className="rounded-2xl bg-[#EEF6F7] dark:bg-[#071526] border border-[#DAE7E7] dark:border-[#163654] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#154752] dark:text-white">
                  Catalogue Services Matching &ldquo;{q.trim()}&rdquo; ({keywordCatalogueRes.totalCount})
                </h2>
                {keywordServicesTotalPages > 1 && (
                  <p className="text-[11px] text-[#68797C] dark:text-slate-400">
                    Page {currentSrvPage} of {keywordServicesTotalPages}
                  </p>
                )}
              </div>
              <Link
                href={`/services?q=${encodeURIComponent(q.trim())}`}
                className="text-xs font-bold text-[#24989A] dark:text-[#5CD3D5] hover:underline"
              >
                Filter All Matching Services →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {keywordCatalogueRes.items.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] dark:border-[#163654] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-[#24989A] dark:text-[#5CD3D5] uppercase tracking-wider truncate">
                        {srv.category_name}
                        {srv.subcategory_name ? ` • ${srv.subcategory_name}` : ""}
                      </p>
                      {srv.available_provider_count > 0 && (
                        <span className="shrink-0 rounded-full bg-[#EEF6F7] dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[10px] font-bold text-[#154752] dark:text-[#5CD3D5]">
                          {srv.available_provider_count} pros
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/services/${srv.slug}`}
                      className="mt-1 block text-sm font-bold text-[#154752] dark:text-white hover:text-[#24989A] dark:hover:text-[#5CD3D5]"
                    >
                      {srv.name}
                    </Link>
                    {srv.short_description && (
                      <p className="mt-1 text-xs text-[#4E6065] dark:text-slate-300 line-clamp-2">
                        {srv.short_description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-[#EEF6F7] dark:border-[#163654]">
                    <span className="text-[#154752] dark:text-[#5CD3D5]">
                      {formatServicePriceRange(
                        srv.base_price_min_kobo,
                        srv.base_price_max_kobo
                      )}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/services/${srv.slug}`}
                        className="text-[#24989A] dark:text-[#5CD3D5] hover:underline"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/book?category=${encodeURIComponent(
                          srv.category_id
                        )}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(
                          srv.name
                        )}${city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""}`}
                        className="rounded-lg bg-[#154752] px-2.5 py-1 text-white hover:bg-[#0D282E]"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {keywordServicesTotalPages > 1 && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DAE7E7] dark:border-[#163654]">
                {currentSrvPage > 1 && (
                  <Link
                    href={buildFilterHref({
                      catSlug: selectedCategory?.slug,
                      subSlug: selectedSubcategory?.slug,
                      srvSlug: selectedService?.slug,
                      srvPageNum: currentSrvPage - 1,
                    })}
                    className="rounded-lg border border-[#DAE7E7] dark:border-[#163654] bg-white dark:bg-[#0D223A] px-3 py-1.5 text-xs font-bold text-[#154752] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800"
                  >
                    ← Prev Services
                  </Link>
                )}
                {currentSrvPage < keywordServicesTotalPages && (
                  <Link
                    href={buildFilterHref({
                      catSlug: selectedCategory?.slug,
                      subSlug: selectedSubcategory?.slug,
                      srvSlug: selectedService?.slug,
                      srvPageNum: currentSrvPage + 1,
                    })}
                    className="rounded-lg border border-[#DAE7E7] dark:border-[#163654] bg-white dark:bg-[#0D223A] px-3 py-1.5 text-xs font-bold text-[#154752] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800"
                  >
                    More Matching Services →
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        <ServiceDiscoveryClient
          catalogueTree={catalogueTree}
          neighbourhoods={neighbourhoods}
          initialResults={filteredMatchedPros}
          totalCount={totalMatchedProsCount}
          currentPage={currentPage}
          pageSize={PRO_PAGE_SIZE}
          defaultCity={city}
          defaultCategorySlug={selectedCategory?.slug || ""}
          defaultSubcategorySlug={selectedSubcategory?.slug || ""}
          defaultServiceSlug={selectedService?.slug || ""}
          defaultKeyword={q}
          defaultArea={area}
          defaultDistance={distance}
          defaultDate={date}
          defaultTime={time}
          defaultRating={rating}
          defaultVerified={verifiedOnly}
          defaultAvailable={availableOnly}
          defaultProviderType={type}
          defaultSort={sortBy}
          unavailableNotice={unavailableNotice}
          activeServiceBookingHref={activeServiceBookingHref}
        />

        {/* Top-Level Accredited Major Categories Grid Overview (Main Categories Only) */}
        <section className="mt-16 pt-10 border-t border-slate-200 dark:border-[#163654] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Accredited Major Service Categories ({catalogueTree.length})
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                Official everyday maintenance and repair categories available across Port Harcourt, Lagos, and Abuja.
              </p>
            </div>
            <Link
              href="/services"
              className="text-sm sm:text-base font-semibold text-[#0D9488] hover:underline"
            >
              Browse Full 3-Tier Catalogue →
            </Link>
          </div>

          {catalogueTree.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] p-8 text-center text-sm text-slate-600 dark:text-slate-300">
              No active service categories could be loaded right now.{" "}
              <Link href="/book" className="font-bold text-[#0D9488] underline">
                Submit a direct service request
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogueTree.map((c) => {
                const subCount = c.subcategories.length;
                const srvCount =
                  c.direct_services.length +
                  c.subcategories.reduce((acc, s) => acc + s.services.length, 0);

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 flex flex-col justify-between hover:border-[#0D9488] transition shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-[#0D9488] shrink-0">
                          <Icon
                            name={resolveCatalogueIcon(c.icon_name, c.slug)}
                            className="h-4.5 w-4.5"
                          />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                            {c.name}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {subCount} subcategor{subCount === 1 ? "y" : "ies"} • {srvCount} service{srvCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>

                      {c.subcategories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.subcategories.slice(0, 3).map((sc) => (
                            <Link
                              key={sc.id}
                              href={`/explore-services?cat=${encodeURIComponent(c.slug)}&sub=${encodeURIComponent(sc.slug)}${cityQs}`}
                              className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:bg-teal-950/60 hover:text-[#0F766E] text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              {sc.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                      <Link
                        href={`/explore-services?cat=${encodeURIComponent(c.slug)}${cityQs}`}
                        className="font-semibold text-[#0D9488] hover:underline"
                      >
                        Match Pros →
                      </Link>
                      <Link
                        href={`/book?category=${encodeURIComponent(c.id)}`}
                        className="font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white dark:text-white"
                      >
                        Request
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );

  if (auth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071526] pb-24 md:pb-12 text-[#0F172A] dark:text-slate-100">
        <CustomerHeader
          user={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: profile?.full_name,
          }}
          selectedCity={headerCity}
        />
        <main>{pageContent}</main>
      </div>
    );
  }

  return <PublicShell>{pageContent}</PublicShell>;
}
