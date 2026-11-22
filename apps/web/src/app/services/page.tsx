import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCustomerProfile,
  getHomepageCatalogueData,
  normalizeCatalogueSlugAlias,
  recordCatalogueSearchSignal,
  searchServiceCataloguePaginated,
} from "@/lib/supabase/customer";
import { checkCatalogueCategoryAvailability } from "@/lib/supabase/catalogue-availability";
import { CustomerHeader } from "@/components/customer/customer-header";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { ServiceSearchForm } from "@/components/site/service-search-form";
import { Icon } from "@/components/site/icons";
import {
  formatDurationLabel,
  formatServicePriceRange,
  resolveCatalogueIcon,
} from "@/lib/catalogue-display";

export const metadata: Metadata = {
  title: "Full 3-Tier Service Catalogue — EasyLife Nigeria",
  description:
    "Browse every accredited maintenance, repair, cleaning, electrical, plumbing, solar, and automotive service available across Port Harcourt, Lagos, and Abuja.",
};

const CATALOGUE_PAGE_SIZE = 12;

interface ServicesCataloguePageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    sub?: string;
    certified?: string;
    page?: string;
  }>;
}

export default async function ServicesCatalogueIndexPage({
  searchParams,
}: ServicesCataloguePageProps) {
  const {
    q = "",
    cat = "",
    sub = "",
    certified = "",
    page = "1",
  } = await searchParams;

  const trimmedQuery = q.trim();
  const normalizedCat = cat.trim() ? normalizeCatalogueSlugAlias(cat.trim()) : "";
  const normalizedSub = sub.trim() ? normalizeCatalogueSlugAlias(sub.trim()) : "";
  const certifiedOnly = certified === "true";
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const isFilteredView = Boolean(
    trimmedQuery || normalizedCat || normalizedSub || certifiedOnly || currentPage > 1
  );

  const [auth, summary, paginatedSearch] = await Promise.all([
    getAuthenticatedUser(),
    getHomepageCatalogueData(),
    isFilteredView
      ? searchServiceCataloguePaginated({
          query: trimmedQuery || undefined,
          categorySlug: normalizedCat || undefined,
          subcategorySlug: normalizedSub || undefined,
          requiresCertification: certifiedOnly ? true : undefined,
          limit: CATALOGUE_PAGE_SIZE,
          offset: (currentPage - 1) * CATALOGUE_PAGE_SIZE,
        })
      : Promise.resolve(null),
  ]);

  const tree = summary.tree;

  const activeCategoryNode = normalizedCat
    ? tree.find((c) => c.slug === normalizedCat) || null
    : null;
  const activeSubcategoryNode = normalizedSub
    ? (activeCategoryNode
        ? activeCategoryNode.subcategories.find((s) => s.slug === normalizedSub)
        : tree.flatMap((c) => c.subcategories).find((s) => s.slug === normalizedSub)) || null
    : null;

  // Check if requested category or subcategory exists cleanly or is paused/unavailable
  let unavailableCategoryNotice: string | null = null;
  if (normalizedCat && !activeCategoryNode) {
    const catCheck = await checkCatalogueCategoryAvailability(normalizedCat);
    if (catCheck.status === "unavailable") {
      unavailableCategoryNotice =
        catCheck.reason || `The category "${catCheck.name}" is temporarily unavailable.`;
    }
  } else if (normalizedSub && !activeSubcategoryNode) {
    const subCheck = await checkCatalogueCategoryAvailability(normalizedSub);
    if (subCheck.status === "unavailable") {
      unavailableCategoryNotice =
        subCheck.reason || `The subcategory "${subCheck.name}" is temporarily unavailable.`;
    }
  }

  const profile = auth
    ? await getCustomerProfile(auth.user.id, auth.accessToken)
    : null;

  const availableSubcategoriesForFilter = activeCategoryNode
    ? activeCategoryNode.subcategories
    : tree.flatMap((c) => c.subcategories);

  const totalMatches = paginatedSearch?.totalCount ?? 0;

  if (
    trimmedQuery.length >= 2 &&
    currentPage === 1 &&
    paginatedSearch &&
    !paginatedSearch.hasError
  ) {
    after(async () => {
      await recordCatalogueSearchSignal({
        query: trimmedQuery,
        surface: "catalogue",
        resolvedCategoryId:
          activeCategoryNode?.id || paginatedSearch.items[0]?.category_id || null,
        resolvedServiceId: paginatedSearch.items[0]?.id || null,
        resultCount: totalMatches,
      });
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalMatches / CATALOGUE_PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages);
  const showingFrom =
    totalMatches === 0 ? 0 : (currentPage - 1) * CATALOGUE_PAGE_SIZE + 1;
  const showingTo = Math.min(totalMatches, currentPage * CATALOGUE_PAGE_SIZE);

  const buildCataloguePageHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (trimmedQuery) sp.set("q", trimmedQuery);
    if (normalizedCat) sp.set("cat", normalizedCat);
    if (normalizedSub) sp.set("sub", normalizedSub);
    if (certifiedOnly) sp.set("certified", "true");
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/services?${qs}` : "/services";
  };

  const pageWindow: number[] = [];
  for (
    let p = Math.max(1, clampedPage - 2);
    p <= Math.min(totalPages, clampedPage + 2);
    p += 1
  ) {
    pageWindow.push(p);
  }

  const content = (
    <>
      <PageHero
        eyebrow="Dynamic 3-Tier Service Catalogue"
        title="Every Accredited EasyLife Service"
        description={`Browse ${tree.length} major categories and ${summary.totalServicesCount} standardised individual services across Port Harcourt, Lagos, and Abuja.`}
      >
        <div className="pt-3 max-w-2xl">
          <ServiceSearchForm
            id="catalogue-index-search"
            defaultQuery={trimmedQuery}
            tone="dark"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Catalogue Search & Filter Toolbar */}
        <form
          action="/services"
          method="get"
          role="search"
          aria-label="Filter EasyLife service catalogue"
          className="rounded-2xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#154752]">
              Search &amp; Filter Individual Services
            </h2>
            {isFilteredView && (
              <Link
                href="/services"
                className="text-xs font-semibold text-[#24989A] hover:underline"
              >
                Reset to Full 3-Tier View
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="cat-q"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#68797C] mb-1"
              >
                Service Name or Keyword
              </label>
              <input
                id="cat-q"
                name="q"
                type="search"
                defaultValue={trimmedQuery}
                placeholder="e.g. solar inverter, barber, AC leak"
                className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] text-sm text-[#1F2F34] focus:outline-none focus:ring-2 focus:ring-[#24989A]"
              />
            </div>

            <div>
              <label
                htmlFor="cat-filter"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#68797C] mb-1"
              >
                Major Category
              </label>
              <select
                id="cat-filter"
                name="cat"
                defaultValue={normalizedCat}
                className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#1F2F34]"
              >
                <option value="">All Categories ({tree.length})</option>
                {tree.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sub-filter"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#68797C] mb-1"
              >
                Subcategory
              </label>
              <select
                id="sub-filter"
                name="sub"
                defaultValue={normalizedSub}
                className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#1F2F34]"
              >
                <option value="">All Subcategories</option>
                {availableSubcategoriesForFilter.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#154752] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="certified"
                  value="true"
                  defaultChecked={certifiedOnly}
                  className="rounded border-[#CBD5E1] text-[#24989A]"
                />
                <span>Trade Certification Required</span>
              </label>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-[#24989A] hover:bg-[#1D7E80] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Filter Catalogue
              </button>
            </div>
          </div>
        </form>

        {unavailableCategoryNotice && (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-950">
                Requested Category Currently Unavailable
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1">
                {unavailableCategoryNotice} You can browse active categories below or submit a custom request.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/services"
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#0D223A] border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-900"
              >
                View All Active Services
              </Link>
              <Link
                href="/book"
                className="px-4 py-2 rounded-xl bg-[#154752] text-xs font-bold text-white"
              >
                Request Custom Service
              </Link>
            </div>
          </div>
        )}

        {summary.hasError && (!isFilteredView || paginatedSearch?.hasError) ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h2 className="text-base font-bold text-amber-950">
                Unable to load live catalogue services
              </h2>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                Our service database did not respond cleanly. Please try again or use our general request wizard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/explore-services"
                className="px-4 py-2 rounded-xl bg-[#154752] text-white text-xs font-bold hover:bg-[#0D282E]"
              >
                Explore Specialists
              </Link>
              <Link
                href="/book"
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#0D223A] border border-amber-300 dark:border-amber-700 text-amber-900 text-xs font-semibold"
              >
                Submit Request
              </Link>
            </div>
          </div>
        ) : isFilteredView && paginatedSearch ? (
          <section aria-label="Filtered service results" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DAE7E7]">
              <div>
                <h2 className="text-xl font-bold text-[#154752]">
                  {totalMatches > 0
                    ? `Showing ${showingFrom}–${showingTo} of ${totalMatches} Matching Services`
                    : "No Active Services Matched Your Filter"}
                </h2>
                <p className="text-xs text-[#68797C] mt-0.5">
                  {trimmedQuery ? `Query: "${trimmedQuery}"` : "Filtered catalogue view"}
                  {activeCategoryNode ? ` • Category: ${activeCategoryNode.name}` : ""}
                  {activeSubcategoryNode ? ` • Subcategory: ${activeSubcategoryNode.name}` : ""}
                  {certifiedOnly ? " • Certified Trades Only" : ""}
                </p>
              </div>
              <Link
                href={`/explore-services${trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : ""}`}
                className="px-4 py-2 rounded-xl bg-[#154752] text-white text-xs font-bold hover:bg-[#0D282E] self-start sm:self-auto"
              >
                Match Technicians Nearby →
              </Link>
            </div>

            {paginatedSearch.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] p-10 text-center max-w-xl mx-auto space-y-4">
                <h3 className="text-base font-bold text-[#154752]">
                  No active services matched this criteria
                </h3>
                <p className="text-sm text-[#4E6065]">
                  Try fewer keywords, clear your category filter, or submit a custom request so verified EasyLife specialists can quote your job.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/book${trimmedQuery ? `?title=${encodeURIComponent(trimmedQuery)}` : ""}`}
                    className="rounded-xl bg-[#24989A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1D7E80]"
                  >
                    Request Custom Service →
                  </Link>
                  <Link
                    href="/services"
                    className="rounded-xl border border-[#DAE7E7] bg-white dark:bg-[#0D223A] px-4 py-2.5 text-xs font-semibold text-[#154752]"
                  >
                    Clear All Filters
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedSearch.items.map((srv) => {
                    const dur = formatDurationLabel(srv.estimated_duration_minutes);
                    return (
                      <article
                        key={srv.id}
                        className="rounded-2xl border border-[#DAE7E7] bg-white dark:bg-[#0D223A] p-5 flex flex-col justify-between hover:border-[#24989A] transition-colors shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-mono font-bold text-[#68797C]">
                              {srv.service_code}
                            </span>
                            <div className="flex items-center gap-1">
                              {srv.requires_trade_certification && (
                                <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[10px] font-bold text-[#0F766E]">
                                  Certified Trade
                                </span>
                              )}
                              {srv.available_provider_count > 0 && (
                                <span className="rounded-full bg-[#EEF6F7] px-2 py-0.5 text-[10px] font-bold text-[#154752]">
                                  {srv.available_provider_count} pros
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-[11px] font-semibold text-[#24989A] uppercase tracking-wider truncate">
                            {srv.category_name}
                            {srv.subcategory_name ? ` • ${srv.subcategory_name}` : ""}
                          </p>

                          <Link
                            href={`/services/${srv.slug}`}
                            className="mt-1 block text-base font-bold text-[#154752] hover:text-[#24989A] leading-snug"
                          >
                            {srv.name}
                          </Link>

                          {srv.short_description && (
                            <p className="mt-1.5 text-xs text-[#4E6065] line-clamp-2 leading-relaxed">
                              {srv.short_description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EEF6F7] flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-extrabold text-[#154752] block">
                              {formatServicePriceRange(
                                srv.base_price_min_kobo,
                                srv.base_price_max_kobo
                              )}
                            </span>
                            {dur && (
                              <span className="text-[11px] text-[#68797C]">
                                Est. {dur}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="rounded-lg border border-[#DAE7E7] bg-[#F8FBFB] px-3 py-1.5 font-semibold text-[#154752] hover:bg-[#EEF6F7]"
                            >
                              View
                            </Link>
                            <Link
                              href={`/book?category=${encodeURIComponent(srv.category_id)}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(srv.name)}`}
                              className="rounded-lg bg-[#24989A] px-3 py-1.5 font-bold text-white hover:bg-[#1D7E80]"
                            >
                              Book
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Catalogue pagination"
                    className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#DAE7E7]"
                  >
                    <p className="text-xs font-medium text-[#4E6065]">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {currentPage > 1 ? (
                        <Link
                          href={buildCataloguePageHref(currentPage - 1)}
                          className="px-3.5 py-2 rounded-xl border border-[#DAE7E7] bg-white dark:bg-[#0D223A] text-xs font-bold text-[#154752] hover:bg-[#EEF6F7]"
                        >
                          ← Previous
                        </Link>
                      ) : (
                        <span className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526] text-xs font-semibold text-slate-400">
                          ← Previous
                        </span>
                      )}

                      {pageWindow.map((p) => (
                        <Link
                          key={p}
                          href={buildCataloguePageHref(p)}
                          aria-current={p === currentPage ? "page" : undefined}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            p === currentPage
                              ? "bg-[#154752] text-white border-[#154752]"
                              : "bg-white dark:bg-[#0D223A] text-[#154752] border-[#DAE7E7] hover:bg-[#EEF6F7]"
                          }`}
                        >
                          {p}
                        </Link>
                      ))}

                      {currentPage < totalPages ? (
                        <Link
                          href={buildCataloguePageHref(currentPage + 1)}
                          className="px-3.5 py-2 rounded-xl border border-[#DAE7E7] bg-white dark:bg-[#0D223A] text-xs font-bold text-[#154752] hover:bg-[#EEF6F7]"
                        >
                          Next →
                        </Link>
                      ) : (
                        <span className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526] text-xs font-semibold text-slate-400">
                          Next →
                        </span>
                      )}
                    </div>
                  </nav>
                )}
              </>
            )}
          </section>
        ) : tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] p-10 text-center space-y-3">
            <h2 className="text-lg font-bold text-[#154752]">
              No active catalogue services found
            </h2>
            <p className="text-sm text-[#4E6065]">
              Submit a custom service request and our regional operations desk will match an accredited technician.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white"
            >
              Request Custom Service →
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Jump Category Pills */}
            <nav
              aria-label="Catalogue category jump links"
              className="flex flex-wrap gap-2 pb-4 border-b border-[#DAE7E7]"
            >
              {tree.map((catNode) => (
                <a
                  key={catNode.id}
                  href={`#cat-${catNode.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#0D223A] border border-[#DAE7E7] px-3.5 py-1.5 text-xs font-semibold text-[#154752] hover:border-[#24989A] hover:text-[#24989A] transition-colors shadow-xs"
                >
                  <Icon
                    name={resolveCatalogueIcon(catNode.icon_name, catNode.slug)}
                    className="h-3.5 w-3.5"
                  />
                  <span>{catNode.name}</span>
                </a>
              ))}
            </nav>

            {/* Tier 1 -> Tier 2 -> Tier 3 Sections */}
            <div className="space-y-12">
              {tree.map((cat) => {
                const subCount = (cat.subcategories || []).length;
                const serviceCount =
                  (cat.direct_services || []).length +
                  (cat.subcategories || []).reduce(
                    (sum, s) => sum + (s.services || []).length,
                    0
                  );

                return (
                  <section
                    key={cat.id}
                    id={`cat-${cat.slug}`}
                    className="scroll-mt-24 rounded-3xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] p-6 sm:p-8 shadow-xs space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EEF6F7]">
                      <div className="flex items-start gap-3.5">
                        <span className="h-12 w-12 rounded-2xl bg-[#EEF6F7] border border-[#DAE7E7] text-[#154752] flex items-center justify-center shrink-0">
                          <Icon
                            name={resolveCatalogueIcon(cat.icon_name, cat.slug)}
                            className="h-6 w-6"
                          />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-[#154752]">
                              {cat.name}
                            </h2>
                            {cat.is_featured && (
                              <span className="rounded-full bg-[#EEF6F7] border border-[#24989A]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#24989A]">
                                Featured
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-sm text-[#4E6065] mt-1 max-w-3xl">
                              {cat.description}
                            </p>
                          )}
                          <p className="text-xs text-[#68797C] mt-1 font-medium">
                            {subCount} subcategor{subCount === 1 ? "y" : "ies"} • {serviceCount} service{serviceCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                          href={`/explore-services?cat=${encodeURIComponent(cat.slug)}`}
                          className="rounded-xl bg-[#EEF6F7] px-4 py-2 text-xs font-bold text-[#154752] hover:bg-[#DAE7E7] transition-colors"
                        >
                          Match Pros in Category →
                        </Link>
                        <Link
                          href={`/book?category=${encodeURIComponent(cat.id)}`}
                          className="rounded-xl bg-[#154752] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D282E] transition-colors"
                        >
                          Book
                        </Link>
                      </div>
                    </div>

                    {/* Subcategories & Nested Services */}
                    <div className="space-y-6">
                      {(cat.subcategories || []).map((sub) => (
                        <div key={sub.id} className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-[#154752]">
                                {sub.name}
                              </h3>
                              {sub.description && (
                                <p className="text-xs text-[#68797C] mt-0.5">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                            <Link
                              href={`/explore-services?cat=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(sub.slug)}`}
                              className="text-xs font-semibold text-[#24989A] hover:underline"
                            >
                              Filter {sub.name} →
                            </Link>
                          </div>

                          {(sub.services || []).length === 0 ? (
                            <p className="text-xs text-[#68797C] italic bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#EEF6F7]">
                              Specialised services under {sub.name} can be booked via general category request.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(sub.services || []).map((srv) => {
                                const dur = formatDurationLabel(
                                  srv.estimated_duration_minutes
                                );
                                return (
                                  <article
                                    key={srv.id}
                                    className="rounded-2xl border border-[#DAE7E7] bg-[#F8FBFB] p-4 flex flex-col justify-between hover:border-[#24989A] transition-colors"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2 text-[11px]">
                                        <span className="font-mono font-bold text-[#68797C]">
                                          {srv.service_code}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {srv.requires_trade_certification && (
                                            <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[10px] font-bold text-[#0F766E]">
                                              Certified Trade
                                            </span>
                                          )}
                                          {srv.is_popular && (
                                            <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                              Popular
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <Link
                                        href={`/services/${srv.slug}`}
                                        className="mt-1.5 block text-sm font-bold text-[#154752] hover:text-[#24989A] leading-snug"
                                      >
                                        {srv.name}
                                      </Link>

                                      {srv.short_description && (
                                        <p className="mt-1.5 text-xs text-[#4E6065] line-clamp-2 leading-relaxed">
                                          {srv.short_description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-[#DAE7E7]/70 flex items-center justify-between gap-2 text-xs">
                                      <div>
                                        <span className="font-extrabold text-[#154752] block">
                                          {formatServicePriceRange(
                                            srv.base_price_min_kobo,
                                            srv.base_price_max_kobo
                                          )}
                                        </span>
                                        {dur && (
                                          <span className="text-[11px] text-[#68797C]">
                                            Est. {dur}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                          href={`/services/${srv.slug}`}
                                          className="rounded-lg border border-[#DAE7E7] bg-white dark:bg-[#0D223A] px-2.5 py-1.5 font-semibold text-[#154752] hover:bg-[#EEF6F7]"
                                        >
                                          View
                                        </Link>
                                        <Link
                                          href={`/book?category=${encodeURIComponent(cat.id)}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(srv.name)}`}
                                          className="rounded-lg bg-[#24989A] px-2.5 py-1.5 font-bold text-white hover:bg-[#1D7E80]"
                                        >
                                          Book
                                        </Link>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {(cat.direct_services || []).length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-base font-bold text-[#154752]">
                            Direct Category Services
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(cat.direct_services || []).map((srv) => (
                              <article
                                key={srv.id}
                                className="rounded-2xl border border-[#DAE7E7] bg-[#F8FBFB] p-4 flex flex-col justify-between"
                              >
                                <div>
                                  <Link
                                    href={`/services/${srv.slug}`}
                                    className="text-sm font-bold text-[#154752] hover:text-[#24989A]"
                                  >
                                    {srv.name}
                                  </Link>
                                  {srv.short_description && (
                                    <p className="mt-1 text-xs text-[#4E6065] line-clamp-2">
                                      {srv.short_description}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-[#DAE7E7]/70 flex items-center justify-between text-xs">
                                  <span className="font-bold text-[#154752]">
                                    {formatServicePriceRange(
                                      srv.base_price_min_kobo,
                                      srv.base_price_max_kobo
                                    )}
                                  </span>
                                  <Link
                                    href={`/services/${srv.slug}`}
                                    className="font-semibold text-[#24989A] hover:underline"
                                  >
                                    Details →
                                  </Link>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );

  if (auth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
        <CustomerHeader
          user={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: profile?.full_name,
          }}
          selectedCity={profile?.city || "Port Harcourt"}
        />
        <main>{content}</main>
      </div>
    );
  }

  return <PublicShell>{content}</PublicShell>;
}
