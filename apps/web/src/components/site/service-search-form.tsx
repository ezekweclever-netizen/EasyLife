"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import {
  formatServicePriceRange,
  resolveCatalogueIcon,
} from "@/lib/catalogue-display";

interface SuggestCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  subcategory_count: number;
  service_count: number;
}

interface SuggestSubcategory {
  id: string;
  name: string;
  slug: string;
  parent_name: string;
  parent_slug: string;
  service_count: number;
}

interface SuggestService {
  id: string;
  service_code: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_name: string;
  category_slug: string;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  base_price_min_kobo: number;
  base_price_max_kobo: number | null;
  is_featured: boolean;
  is_popular: boolean;
  available_provider_count?: number;
}

interface SuggestPayload {
  query: string;
  hasError: boolean;
  totalServices?: number;
  categories: SuggestCategory[];
  subcategories: SuggestSubcategory[];
  services: SuggestService[];
}

/**
 * Main service search. Submits a GET request to /services?q=...
 * (works without JavaScript; Next.js <Form> adds client-side navigation) and
 * provides live database-backed category, subcategory, and individual service suggestions.
 */
export function ServiceSearchForm({
  id = "service-search",
  defaultQuery = "",
  tone = "dark",
  placeholder = "e.g. generator, AC repair, plumbing...",
}: {
  id?: string;
  defaultQuery?: string;
  tone?: "dark" | "light";
  placeholder?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestPayload | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setFetchError(false);
      try {
        const res = await fetch(
          `/api/catalogue/suggest?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setFetchError(true);
          setSuggestions(null);
          return;
        }
        const data = (await res.json()) as SuggestPayload;
        setSuggestions(data);
        setFetchError(Boolean(data.hasError));
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setFetchError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  const navigableItems: Array<{ label: string; href: string }> = suggestions
    ? [
        ...suggestions.services.map((srv) => ({
          label: srv.name,
          href: `/services/${srv.slug}`,
        })),
        ...suggestions.subcategories.map((sub) => ({
          label: sub.name,
          href: `/services?cat=${encodeURIComponent(sub.parent_slug)}&sub=${encodeURIComponent(sub.slug)}`,
        })),
        ...suggestions.categories.map((cat) => ({
          label: cat.name,
          href: `/services?cat=${encodeURIComponent(cat.slug)}`,
        })),
      ]
    : [];

  const totalMatches = navigableItems.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen || totalMatches === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalMatches);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? totalMatches - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && navigableItems[activeIndex]) {
      e.preventDefault();
      setIsOpen(false);
      router.push(navigableItems[activeIndex]!.href);
    }
  };

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative text-left">
      <Form
        action="/services"
        role="search"
        aria-label="Search EasyLife services"
        onSubmit={() => setIsOpen(false)}
        className={`flex flex-col sm:flex-row gap-2.5 rounded-2xl p-2.5 ${
          tone === "dark"
            ? "bg-white dark:bg-[#1F2328] shadow-xl shadow-black/15"
            : "bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] shadow-xs"
        }`}
      >
        <label htmlFor={id} className="sr-only">
          What do you need help with?
        </label>
        <div className="relative flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4A525C] dark:text-[#C3C8CF]"
          />
          <input
            id={id}
            name="q"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            maxLength={120}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder={placeholder}
            className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-base text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-12 px-4 sm:px-7 rounded-xl bg-[#E8590C] hover:bg-[#C84A06] text-white text-sm sm:text-base font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <span className="hidden sm:inline">Search services</span>
          <span className="sm:hidden">Search</span>
        </button>
      </Form>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Service catalogue suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] shadow-2xl overflow-hidden text-[#1F2328] dark:text-[#FAF7F3]"
        >
          {isLoading && !suggestions ? (
            <div className="px-5 py-4 text-sm text-[#4A525C] dark:text-[#C3C8CF] flex items-center gap-2.5">
              <span className="h-4 w-4 rounded-full border-2 border-[#E8590C] border-t-transparent animate-spin" />
              <span>Searching verified EasyLife services...</span>
            </div>
          ) : fetchError ? (
            <div className="px-5 py-4 text-sm text-[#4A525C] dark:text-[#C3C8CF] flex items-center justify-between gap-3">
              <span>Live suggestions are temporarily unavailable.</span>
              <Link
                href={`/services${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`}
                onClick={() => setIsOpen(false)}
                className="font-semibold text-[#E8590C] hover:underline shrink-0"
              >
                Search directory →
              </Link>
            </div>
          ) : suggestions && totalMatches === 0 ? (
            <div className="px-5 py-4 space-y-2.5">
              <p className="text-sm text-[#4A525C] dark:text-[#C3C8CF]">
                No active service in our catalogue currently matches{" "}
                <span className="font-semibold text-[#1F2328] dark:text-[#FAF7F3]">
                  &ldquo;{query.trim()}&rdquo;
                </span>
                . It may be temporarily paused or covered under a custom request.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <Link
                  href={`/services?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="text-[#E8590C] hover:underline"
                >
                  Search technicians matching &ldquo;{query.trim()}&rdquo; →
                </Link>
                <Link
                  href={`/book?title=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="text-[#1F2328] dark:text-[#FAF7F3] hover:underline"
                >
                  Request Custom Service →
                </Link>
                <Link
                  href="/tasks"
                  onClick={() => setIsOpen(false)}
                  className="text-[#4A525C] dark:text-[#C3C8CF] hover:underline"
                >
                  Post Everyday Task
                </Link>
                <Link
                  href="/services"
                  onClick={() => setIsOpen(false)}
                  className="text-[#1F2328] dark:text-[#FAF7F3] hover:underline"
                >
                  Browse Full Catalogue
                </Link>
              </div>
            </div>
          ) : suggestions ? (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-[#E6E0D8]/60 dark:divide-[#2E343B]">
              {suggestions.services.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF]">
                    <span>
                      {query.trim()
                        ? `Matching Services${
                            suggestions.totalServices
                              ? ` (${suggestions.totalServices})`
                              : ""
                          }`
                        : "Popular & Featured Services"}
                    </span>
                    <Link
                      href={
                        query.trim()
                          ? `/services?q=${encodeURIComponent(query.trim())}`
                          : "/services"
                      }
                      onClick={() => setIsOpen(false)}
                      className="text-[#E8590C] hover:underline normal-case font-semibold"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.services.map((srv) => {
                      runningIndex += 1;
                      const isHighlighted = runningIndex === activeIndex;
                      const proCount = srv.available_provider_count ?? 0;
                      return (
                        <Link
                          key={srv.id}
                          role="option"
                          aria-selected={isHighlighted}
                          href={`/services/${srv.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                            isHighlighted
                              ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#1F2328] dark:text-[#FAF7F3]"
                              : "hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] truncate">
                              {srv.name}
                            </p>
                            <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] truncate">
                              {srv.category_name}
                              {srv.subcategory_name ? ` • ${srv.subcategory_name}` : ""}
                              {proCount > 0
                                ? ` • ${proCount} verified pro${proCount === 1 ? "" : "s"}`
                                : ""}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-[#E8590C] bg-[#FCEBDD] dark:bg-[#E8590C]/20 px-2.5 py-1 rounded-lg">
                            {formatServicePriceRange(
                              srv.base_price_min_kobo,
                              srv.base_price_max_kobo
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestions.subcategories.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF]">
                    Subcategories
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {suggestions.subcategories.map((sub) => {
                      runningIndex += 1;
                      const isHighlighted = runningIndex === activeIndex;
                      return (
                        <Link
                          key={sub.id}
                          role="option"
                          aria-selected={isHighlighted}
                          href={`/services?cat=${encodeURIComponent(sub.parent_slug)}&sub=${encodeURIComponent(sub.slug)}`}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-colors ${
                            isHighlighted
                              ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#1F2328] dark:text-[#FAF7F3]"
                              : "hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] truncate">
                              {sub.name}
                            </p>
                            <p className="text-[11px] text-[#4A525C] dark:text-[#C3C8CF] truncate">
                              {sub.parent_name}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-[#4A525C] dark:text-[#C3C8CF]">
                            {sub.service_count} svc
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestions.categories.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF]">
                    Major Categories
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                    {suggestions.categories.map((cat) => {
                      runningIndex += 1;
                      const isHighlighted = runningIndex === activeIndex;
                      return (
                        <Link
                          key={cat.id}
                          role="option"
                          aria-selected={isHighlighted}
                          href={`/services?cat=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setIsOpen(false)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                            isHighlighted
                              ? "bg-[#1F2328] text-white border-[#1F2328]"
                              : "bg-[#FAF7F3] dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#E8590C]"
                          }`}
                        >
                          <Icon
                            name={resolveCatalogueIcon(cat.icon_name, cat.slug)}
                            className="h-3.5 w-3.5"
                          />
                          <span>{cat.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-[#FAF7F3] dark:bg-[#15181C] border-t border-[#E6E0D8] dark:border-[#2E343B] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link
                  href={`/services${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`}
                  onClick={() => setIsOpen(false)}
                  className="font-bold text-[#1F2328] dark:text-[#FAF7F3] hover:text-[#E8590C] transition-colors"
                >
                  {query.trim()
                    ? `Match professionals for "${query.trim()}" →`
                    : "Explore All Services & Match Verified Pros →"}
                </Link>
                {query.trim() && (suggestions.totalServices ?? 0) > suggestions.services.length && (
                  <Link
                    href={`/services?q=${encodeURIComponent(query.trim())}`}
                    onClick={() => setIsOpen(false)}
                    className="font-semibold text-[#E8590C] hover:underline"
                  >
                    See all {suggestions.totalServices} services →
                  </Link>
                )}
                {isLoading && (
                  <span className="text-[11px] text-[#4A525C] dark:text-[#C3C8CF]">Updating...</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
