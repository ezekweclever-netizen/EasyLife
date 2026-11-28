import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCatalogueServiceBySlugOrId,
  getCustomerProfile,
  getHomepageCatalogueData,
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
import { ServiceSearchForm } from "@/components/site/service-search-form";
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
  title: "Find Services & Verified Professionals — EasyLife Nigeria",
  description:
    "Discover verified technicians, electricians, plumbers, generator engineers, and artisans in Port Harcourt, Lagos, and Abuja. Compare ratings, callout fees, and book with escrow protection.",
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
const CATALOGUE_PAGE_SIZE = 12;

interface ServicesPageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    sub?: string;
    service?: string;
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
    view?: string;
    certified?: string;
    page?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const {
    q = "",
    cat = "",
    sub = "",
    service = "",
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
    view = "pros",
    certified = "",
    page = "1",
  } = await searchParams;

  const trimmedQuery = q.trim();
  const normalizedCat = cat.trim() ? normalizeCatalogueSlugAlias(cat.trim()) : "";
  const normalizedSub = sub.trim() ? normalizeCatalogueSlugAlias(sub.trim()) : "";
  const minRating = parseFloat(rating) || 0;
  const verifiedOnly = verified === "true";
  const availableOnly = available === "true";
  const certifiedOnly = certified === "true";
  const maxDistanceKm = distance === "all" ? undefined : parseFloat(distance) || 25;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const isCatalogueView = view === "catalogue";

  const sortBy: ProfessionalDiscoverySort = VALID_SORT_MODES.has(
    sort as ProfessionalDiscoverySort
  )
    ? (sort as ProfessionalDiscoverySort)
    : "relevance";

  // Concurrently load Auth, Catalogue Tree, Neighbourhoods, Explicit Service, and Homepage data
  const [auth, catalogueTree, neighbourhoods, explicitService, summary] =
    await Promise.all([
      getAuthenticatedUser(),
      getServiceCatalogueTree(false),
      getOperatingNeighbourhoods(),
      service.trim() ? getCatalogueServiceBySlugOrId(service.trim()) : Promise.resolve(null),
      getHomepageCatalogueData(),
    ]);

  // Resolve coordinates if neighbourhood or city selected
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

  // Resolve active Category, Subcategory, and Service
  let selectedCategory: CatalogueCategoryNode | null = null;
  let selectedSubcategory: CatalogueSubcategoryNode | null = null;
  const selectedService: CatalogueServiceItem | null = explicitService;

  if (normalizedCat) {
    selectedCategory = catalogueTree.find((c) => c.slug === normalizedCat) || null;
    if (!selectedCategory) {
      for (const mainCat of catalogueTree) {
        const subMatch = mainCat.subcategories.find((s) => s.slug === normalizedCat);
        if (subMatch) {
          selectedCategory = mainCat;
          selectedSubcategory = subMatch;
          break;
        }
      }
    }
  }

  if (normalizedSub && !selectedSubcategory) {
    if (selectedCategory) {
      selectedSubcategory =
        selectedCategory.subcategories.find((s) => s.slug === normalizedSub) || null;
    } else {
      for (const mainCat of catalogueTree) {
        const subMatch = mainCat.subcategories.find((s) => s.slug === normalizedSub);
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

  // Check for unavailable service/category
  let unavailableNotice: DiscoveryUnavailableNotice | null = null;
  if (service.trim() && !selectedService) {
    const srvAvailability = await checkCatalogueServiceAvailability(service.trim());
    if (srvAvailability.status === "unavailable") {
      const parentCatNode = catalogueTree.find((c) => c.id === srvAvailability.categoryId) || null;
      const parentSubNode = parentCatNode?.subcategories.find((s) => s.id === srvAvailability.subcategoryId) || null;
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
  } else if (normalizedSub && !selectedSubcategory) {
    const subAvailability = await checkCatalogueCategoryAvailability(normalizedSub);
    if (subAvailability.status === "unavailable") {
      const parentCatNode = catalogueTree.find((c) => c.id === subAvailability.categoryId) || null;
      unavailableNotice = {
        kind: "subcategory",
        name: subAvailability.name || normalizedSub,
        reason:
          subAvailability.reason ||
          "This subcategory is temporarily paused while operations update provider coverage.",
        alternatives: (parentCatNode?.subcategories || []).slice(0, 4).map((alt) => ({
          label: alt.name,
          href: `/services?cat=${encodeURIComponent(parentCatNode!.slug)}&sub=${encodeURIComponent(alt.slug)}`,
        })),
      };
    }
  } else if (normalizedCat && !selectedCategory) {
    const catAvailability = await checkCatalogueCategoryAvailability(normalizedCat);
    if (catAvailability.status === "unavailable") {
      unavailableNotice = {
        kind: "category",
        name: catAvailability.name || normalizedCat,
        reason:
          catAvailability.reason ||
          "This category is temporarily paused while operations update provider coverage.",
        alternatives: catalogueTree.slice(0, 4).map((alt) => ({
          label: alt.name,
          href: `/services?cat=${encodeURIComponent(alt.slug)}`,
        })),
      };
    }
  }

  const effectiveCategorySlug =
    selectedSubcategory?.slug || selectedCategory?.slug || "";

  // Concurrently fetch pros, catalogue search, and profile
  const [proMatchRes, paginatedCatalogueSearch, profile] = await Promise.all([
    !isCatalogueView
      ? searchAndMatchProfessionalsPaginated({
          keyword: trimmedQuery,
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
          limit: PRO_PAGE_SIZE,
          offset: (currentPage - 1) * PRO_PAGE_SIZE,
        })
      : searchAndMatchProfessionalsPaginated({
          keyword: trimmedQuery,
          categorySlug: effectiveCategorySlug,
          city: city === "All Cities" ? undefined : city,
          limit: 1,
          offset: 0,
        }),
    isCatalogueView || trimmedQuery
      ? searchServiceCataloguePaginated({
          query: trimmedQuery || undefined,
          categorySlug: effectiveCategorySlug || undefined,
          subcategorySlug: selectedSubcategory?.slug || undefined,
          requiresCertification: certifiedOnly ? true : undefined,
          limit: CATALOGUE_PAGE_SIZE,
          offset: (currentPage - 1) * CATALOGUE_PAGE_SIZE,
        })
      : Promise.resolve(null),
    auth ? getCustomerProfile(auth.user.id, auth.accessToken) : Promise.resolve(null),
  ]);

  if (trimmedQuery.length >= 2 && currentPage === 1 && !proMatchRes.hasError) {
    after(async () => {
      await recordCatalogueSearchSignal({
        query: trimmedQuery,
        surface: isCatalogueView ? "catalogue" : "explore",
        city: city !== "All Cities" ? city : undefined,
        resolvedCategoryId: selectedCategory?.id || null,
        resolvedServiceId: selectedService?.id || null,
        resultCount: isCatalogueView
          ? (paginatedCatalogueSearch?.totalCount ?? 0)
          : proMatchRes.totalCount,
      });
    });
  }

  const tree = summary.tree;
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

  const totalCatalogueMatches = paginatedCatalogueSearch?.totalCount ?? 0;
  const totalCataloguePages = Math.max(1, Math.ceil(totalCatalogueMatches / CATALOGUE_PAGE_SIZE));
  const cataloguePageWindow: number[] = [];
  for (
    let p = Math.max(1, currentPage - 2);
    p <= Math.min(totalCataloguePages, currentPage + 2);
    p += 1
  ) {
    cataloguePageWindow.push(p);
  }

  const buildCatalogueHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    sp.set("view", "catalogue");
    if (trimmedQuery) sp.set("q", trimmedQuery);
    if (normalizedCat) sp.set("cat", normalizedCat);
    if (normalizedSub) sp.set("sub", normalizedSub);
    if (certifiedOnly) sp.set("certified", "true");
    if (targetPage > 1) sp.set("page", String(targetPage));
    return `/services?${sp.toString()}`;
  };

  const content = (
    <>
      <section className="relative w-full overflow-hidden min-h-[520px] sm:min-h-[560px] flex items-center justify-center bg-[#1F2328] text-white border-b border-[#2E343B]">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-find-services.jpg"
            alt="Smiling customer shaking hands with certified technician"
            fill
            priority
            sizes="100vw"
            quality={92}
            className="object-cover object-[50%_15%] sm:object-[50%_18%] md:object-[50%_20%]"
          />
          {/* Subtle, transparent dark overlay preserving full image clarity and prominence */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55" />
        </div>

        {/* Content container: Fully Centered Horizontally and Vertically */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center justify-center">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#E8590C] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Accredited Trades &amp; Professional Marketplace
            </p>
            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Find &amp; Book Verified Service Professionals
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-[#FAF7F3] leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Connect with accredited artisans, technicians, and trade specialists across Port Harcourt, Lagos, and Abuja. Browse by trade, filter by neighbourhood, or explore standardised service scopes.
            </p>

            <div className="mt-8 w-full flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl mx-auto">
                <ServiceSearchForm
                  id="services-marketplace-search"
                  defaultQuery={trimmedQuery}
                  tone="dark"
                />
              </div>

              {/* Core Approved Trade Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-5 text-xs text-teal-100 max-w-3xl mx-auto">
                <span className="font-bold text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">Approved Core Trades:</span>
                {[
                  { label: "Plumbing", slug: "plumbing-water-systems" },
                  { label: "Electrical", slug: "electrical-power-backup" },
                  { label: "HVAC & AC", slug: "hvac-air-conditioning" },
                  { label: "Generators", slug: "generator-maintenance" },
                  { label: "Carpentry", slug: "carpentry-doors-locks" },
                  { label: "Cleaning", slug: "cleaning-fumigation" },
                  { label: "Painting", slug: "painting-wall-finishing" },
                  { label: "Appliance Repair", slug: "appliance-repair" },
                ].map((catItem) => (
                  <Link
                    key={catItem.slug}
                    href={`/services?cat=${encodeURIComponent(catItem.slug)}${
                      city !== "All Cities" ? `&city=${encodeURIComponent(city)}` : ""
                    }`}
                    className={`px-3 py-1 rounded-full font-semibold transition ${
                      normalizedCat === catItem.slug
                        ? "bg-[#E8590C] text-white shadow-xs"
                        : "bg-black/40 hover:bg-black/60 text-white border border-white/20"
                    }`}
                  >
                    {catItem.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Marketplace Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E0D8] dark:border-[#2E343B]">
          <div className="bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-1 rounded-2xl inline-flex items-center gap-1 text-xs font-bold">
            <Link
              href={`/services${trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : ""}${
                normalizedCat ? `&cat=${encodeURIComponent(normalizedCat)}` : ""
              }`}
              className={`px-4 py-2.5 rounded-xl transition ${
                !isCatalogueView
                  ? "bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] shadow-xs"
                  : "text-[#4A525C] dark:text-[#C3C8CF] hover:text-[#1F2328] dark:hover:text-[#FAF7F3]"
              }`}
            >
              🔧 Verified Professionals ({proMatchRes.totalCount})
            </Link>
            <Link
              href={`/services?view=catalogue${
                trimmedQuery ? `&q=${encodeURIComponent(trimmedQuery)}` : ""
              }${normalizedCat ? `&cat=${encodeURIComponent(normalizedCat)}` : ""}`}
              className={`px-4 py-2.5 rounded-xl transition ${
                isCatalogueView
                  ? "bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] shadow-xs"
                  : "text-[#4A525C] dark:text-[#C3C8CF] hover:text-[#1F2328] dark:hover:text-[#FAF7F3]"
              }`}
            >
              📚 Standard Service Catalogue
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/post-a-need"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E8590C] hover:bg-[#C84A06] text-white transition shadow-xs"
            >
              <span>📝 Post a Need</span>
              <span className="text-[10px] opacity-80">(Get Quotes)</span>
            </Link>
            <Link
              href="/business-hub"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition"
            >
              <span>🏢 Business Hub</span>
            </Link>
          </div>
        </div>

        {/* VIEW 1: VERIFIED PROFESSIONALS (MARKETPLACE DISCOVERY) */}
        {!isCatalogueView && (
          <ServiceDiscoveryClient
            catalogueTree={catalogueTree}
            neighbourhoods={neighbourhoods}
            initialResults={proMatchRes.items}
            totalCount={proMatchRes.totalCount}
            currentPage={currentPage}
            pageSize={PRO_PAGE_SIZE}
            defaultCity={city}
            defaultCategorySlug={normalizedCat}
            defaultSubcategorySlug={normalizedSub}
            defaultServiceSlug={service}
            defaultKeyword={trimmedQuery}
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
        )}

        {/* VIEW 2: STANDARD 3-TIER SERVICE CATALOGUE */}
        {isCatalogueView && (
          <div className="space-y-8">
            {/* Filter toolbar for catalogue */}
            <form
              action="/services"
              method="get"
              role="search"
              aria-label="Filter EasyLife service catalogue"
              className="rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs space-y-4"
            >
              <input type="hidden" name="view" value="catalogue" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                  Search &amp; Filter Standardised Services
                </h2>
                {(trimmedQuery || normalizedCat || certifiedOnly) && (
                  <Link
                    href="/services?view=catalogue"
                    className="text-xs font-semibold text-[#E8590C] hover:underline"
                  >
                    Reset Catalogue Filters
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="cat-q"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF] mb-1"
                  >
                    Service Name or Keyword
                  </label>
                  <input
                    id="cat-q"
                    name="q"
                    type="search"
                    defaultValue={trimmedQuery}
                    placeholder="e.g. AC recharge, plumbing leak, generator rewinding"
                    className="w-full h-10 px-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cat-filter"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF] mb-1"
                  >
                    Major Category
                  </label>
                  <select
                    id="cat-filter"
                    name="cat"
                    defaultValue={normalizedCat}
                    className="w-full h-10 px-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3]"
                  >
                    <option value="">All Categories ({tree.length})</option>
                    {tree.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F2328] dark:text-[#FAF7F3] cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      name="certified"
                      value="true"
                      defaultChecked={certifiedOnly}
                      className="rounded border-[#E6E0D8] dark:border-[#2E343B] text-[#E8590C]"
                    />
                    <span>Trade Certification Required</span>
                  </label>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-[#E8590C] hover:bg-[#C84A06] text-white text-sm font-bold transition-colors cursor-pointer ml-auto"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </form>

            {/* Catalogue Results */}
            {paginatedCatalogueSearch && paginatedCatalogueSearch.items.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    Standardised Services ({totalCatalogueMatches})
                  </h3>
                  <Link
                    href={`/services?${trimmedQuery ? `q=${encodeURIComponent(trimmedQuery)}` : ""}`}
                    className="text-xs font-bold text-[#E8590C] hover:underline"
                  >
                    Switch to Verified Professionals View →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCatalogueSearch.items.map((srv) => {
                    const dur = formatDurationLabel(srv.estimated_duration_minutes);
                    return (
                      <article
                        key={srv.id}
                        className="rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] p-5 flex flex-col justify-between hover:border-[#E8590C] transition-colors shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-mono font-bold text-[#4A525C] dark:text-[#C3C8CF]">
                              {srv.service_code}
                            </span>
                            <div className="flex items-center gap-1">
                              {srv.requires_trade_certification && (
                                <span className="rounded-full bg-[#FCEBDD] border border-[#E8590C]/30 px-2 py-0.5 text-[10px] font-bold text-[#E8590C]">
                                  Certified Trade
                                </span>
                              )}
                              {srv.available_provider_count > 0 && (
                                <span className="rounded-full bg-[#FAF7F3] dark:bg-[#1F2328] px-2 py-0.5 text-[10px] font-bold text-[#4A525C] dark:text-[#C3C8CF]">
                                  {srv.available_provider_count} pros
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-[11px] font-semibold text-[#E8590C] uppercase tracking-wider truncate">
                            {srv.category_name}
                            {srv.subcategory_name ? ` • ${srv.subcategory_name}` : ""}
                          </p>

                          <Link
                            href={`/services/${srv.slug}`}
                            className="mt-1 block text-base font-bold text-[#1F2328] dark:text-[#FAF7F3] hover:text-[#E8590C] leading-snug"
                          >
                            {srv.name}
                          </Link>

                          {srv.short_description && (
                            <p className="mt-1.5 text-xs text-[#4A525C] dark:text-[#C3C8CF] line-clamp-2 leading-relaxed">
                              {srv.short_description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E6E0D8] dark:border-[#2E343B] flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-extrabold text-[#1F2328] dark:text-[#FAF7F3] block">
                              {formatServicePriceRange(
                                srv.base_price_min_kobo,
                                srv.base_price_max_kobo
                              )}
                            </span>
                            {dur && (
                              <span className="text-[11px] text-[#4A525C] dark:text-[#C3C8CF]">
                                Est. {dur}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] px-3 py-1.5 font-semibold text-[#1F2328] dark:text-[#FAF7F3] hover:bg-white"
                            >
                              Details
                            </Link>
                            <Link
                              href={`/book?category=${encodeURIComponent(srv.category_id)}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(srv.name)}`}
                              className="rounded-lg bg-[#E8590C] px-3 py-1.5 font-bold text-white hover:bg-[#C84A06]"
                            >
                              Book
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalCataloguePages > 1 && (
                  <nav
                    aria-label="Catalogue pagination"
                    className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E6E0D8] dark:border-[#2E343B]"
                  >
                    <p className="text-xs font-medium text-[#4A525C] dark:text-[#C3C8CF]">
                      Page {currentPage} of {totalCataloguePages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {currentPage > 1 ? (
                        <Link
                          href={buildCatalogueHref(currentPage - 1)}
                          className="px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3]"
                        >
                          ← Previous
                        </Link>
                      ) : (
                        <span className="px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-xs font-semibold text-slate-400">
                          ← Previous
                        </span>
                      )}

                      {cataloguePageWindow.map((p) => (
                        <Link
                          key={p}
                          href={buildCatalogueHref(p)}
                          aria-current={p === currentPage ? "page" : undefined}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            p === currentPage
                              ? "bg-[#1F2328] text-white border-[#1F2328]"
                              : "bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] border-[#E6E0D8] dark:border-[#2E343B] hover:bg-[#FAF7F3] hover:text-[#E8590C]"
                          }`}
                        >
                          {p}
                        </Link>
                      ))}

                      {currentPage < totalCataloguePages ? (
                        <Link
                          href={buildCatalogueHref(currentPage + 1)}
                          className="px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3]"
                        >
                          Next →
                        </Link>
                      ) : (
                        <span className="px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-xs font-semibold text-slate-400">
                          Next →
                        </span>
                      )}
                    </div>
                  </nav>
                )}
              </div>
            ) : (
              /* Fallback 3-Tier Category Tree View */
              <div className="space-y-10">
                <nav
                  aria-label="Catalogue category jump links"
                  className="flex flex-wrap gap-2 pb-4 border-b border-[#E6E0D8] dark:border-[#2E343B]"
                >
                  {tree.map((catNode) => (
                    <a
                      key={catNode.id}
                      href={`#cat-${catNode.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] px-3.5 py-1.5 text-xs font-semibold text-[#1F2328] dark:text-[#FAF7F3] hover:border-[#E8590C] hover:text-[#E8590C] transition-colors shadow-xs"
                    >
                      <Icon
                        name={resolveCatalogueIcon(catNode.icon_name, catNode.slug)}
                        className="h-3.5 w-3.5"
                      />
                      <span>{catNode.name}</span>
                    </a>
                  ))}
                </nav>

                <div className="space-y-10">
                  {tree.map((catItem) => {
                    const subCount = (catItem.subcategories || []).length;
                    const serviceCount =
                      (catItem.direct_services || []).length +
                      (catItem.subcategories || []).reduce(
                        (sum, s) => sum + (s.services || []).length,
                        0
                      );

                    return (
                      <section
                        key={catItem.id}
                        id={`cat-${catItem.slug}`}
                        className="scroll-mt-24 rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-8 shadow-xs space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E6E0D8] dark:border-[#2E343B]">
                          <div className="flex items-start gap-3.5">
                            <span className="h-12 w-12 rounded-2xl bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30 flex items-center justify-center shrink-0">
                              <Icon
                                name={resolveCatalogueIcon(catItem.icon_name, catItem.slug)}
                                className="h-6 w-6"
                              />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                                  {catItem.name}
                                </h3>
                                {catItem.is_featured && (
                                  <span className="rounded-full bg-[#FCEBDD] border border-[#E8590C]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8590C]">
                                    Featured
                                  </span>
                                )}
                              </div>
                              {catItem.description && (
                                <p className="text-sm text-[#4A525C] dark:text-[#C3C8CF] mt-1 max-w-3xl">
                                  {catItem.description}
                                </p>
                              )}
                              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1 font-medium">
                                {subCount} subcategor{subCount === 1 ? "y" : "ies"} • {serviceCount} service{serviceCount === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <Link
                              href={`/services?cat=${encodeURIComponent(catItem.slug)}`}
                              className="rounded-xl bg-[#FCEBDD] text-[#E8590C] hover:bg-[#FCEBDD]/80 px-4 py-2 text-xs font-bold transition-colors"
                            >
                              Match Pros in Category →
                            </Link>
                            <Link
                              href={`/book?category=${encodeURIComponent(catItem.id)}`}
                              className="rounded-xl bg-[#E8590C] hover:bg-[#C84A06] px-4 py-2 text-xs font-bold text-white transition-colors"
                            >
                              Book
                            </Link>
                          </div>
                        </div>

                        {/* Subcategories list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(catItem.subcategories || []).map((subItem) => (
                            <div
                              key={subItem.id}
                              className="p-4 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                                  {subItem.name}
                                </h4>
                                <span className="text-[10px] font-bold text-[#4A525C] dark:text-[#C3C8CF]">
                                  {(subItem.services || []).length} services
                                </span>
                              </div>
                              {subItem.description && (
                                <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] line-clamp-2">
                                  {subItem.description}
                                </p>
                              )}
                              <div className="pt-2 flex items-center justify-between text-xs">
                                <Link
                                  href={`/services?cat=${encodeURIComponent(catItem.slug)}&sub=${encodeURIComponent(subItem.slug)}`}
                                  className="font-bold text-[#E8590C] hover:underline"
                                >
                                  Find Specialists →
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (auth) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] dark:bg-[#15181C] pb-24 md:pb-12 text-[#1F2328] dark:text-[#FAF7F3]">
        <CustomerHeader
          user={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: profile?.full_name,
          }}
          selectedCity={city !== "All Cities" ? city : profile?.city || "Port Harcourt"}
        />
        <main>{content}</main>
      </div>
    );
  }

  return <PublicShell>{content}</PublicShell>;
}
