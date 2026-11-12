"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, type IconName } from "./icons";
import type {
  EnrichedCatalogueService,
  HomepageCategorySummary,
} from "@/lib/supabase/customer";
import {
  formatDurationLabel,
  formatServicePriceRange,
  resolveCatalogueIcon,
} from "@/lib/catalogue-display";

export interface StackedCategoryItem {
  id: string;
  number: string;
  title: string;
  tag: string;
  description: string;
  highlights: readonly string[];
  previewTitle: string;
  previewSubtitle: string;
  previewBadge: string;
  href: string;
  icon: IconName;
  illustrationSrc: string;
  illustrationAlt: string;
  gradientStyle: string;
  accentGlow: string;
}

export const STACKED_SERVICE_CATEGORIES: readonly StackedCategoryItem[] = [
  {
    id: "home-repairs",
    number: "01",
    tag: "Home Repairs & Maintenance",
    title: "Home Repairs and Maintenance",
    description:
      "Carpentry, security doors, wall painting, POP ceilings, floor tiling, AC servicing, and everyday property upkeep by vetted specialists.",
    highlights: ["Doors & Locks", "Painting & POP", "AC & Appliance Repair"],
    previewTitle: "Vetted Home Specialist",
    previewSubtitle: "Carpentry, painting, tiling & AC servicing",
    previewBadge: "Escrow Protected",
    href: "/explore-services?group=home-repairs",
    icon: "hammer",
    illustrationSrc: "/categories/home-repairs.png",
    illustrationAlt: "3D illustration of a friendly Nigerian home repair and maintenance specialist",
    gradientStyle: "linear-gradient(135deg, #0D357A 0%, #1553BC 56%, #1D6CE6 100%)",
    accentGlow: "rgba(96, 165, 250, 0.28)",
  },
  {
    id: "cleaning-services",
    number: "02",
    tag: "Cleaning Services",
    title: "Cleaning Services",
    description:
      "Thorough residential deep cleaning, post-construction cleanup, office sanitation, and integrated pest & fumigation treatments.",
    highlights: ["Deep Cleaning", "Post-Renovation", "Fumigation"],
    previewTitle: "Certified Cleaning Crew",
    previewSubtitle: "Move-in deep cleaning, upholstery & fumigation",
    previewBadge: "Same-Day Slots",
    href: "/explore-services?cat=cleaning-fumigation",
    icon: "sparkles",
    illustrationSrc: "/categories/cleaning-services.png",
    illustrationAlt: "3D illustration of a friendly Nigerian cleaning specialist",
    gradientStyle: "linear-gradient(135deg, #0B3A3E 0%, #11666B 56%, #18898F 100%)",
    accentGlow: "rgba(45, 212, 191, 0.26)",
  },
  {
    id: "electrical-services",
    number: "03",
    tag: "Electrical Services",
    title: "Electrical Services",
    description:
      "Safe residential and commercial wiring, distribution board balancing, solar inverter installations, changeover switches, and fault tracing.",
    highlights: ["Solar & Inverters", "DB & Wiring", "Fault Tracing"],
    previewTitle: "Accredited Electrician",
    previewSubtitle: "Inverter setup, changeover switches & diagnostics",
    previewBadge: "Safety Verified",
    href: "/explore-services?cat=electrical-power-backup",
    icon: "zap",
    illustrationSrc: "/categories/electrical-services.png",
    illustrationAlt: "3D illustration of a certified Nigerian electrical engineer",
    gradientStyle: "linear-gradient(135deg, #251F68 0%, #3C36A3 56%, #534FD1 100%)",
    accentGlow: "rgba(165, 180, 252, 0.28)",
  },
  {
    id: "plumbing-services",
    number: "04",
    tag: "Plumbing Services",
    title: "Plumbing Services",
    description:
      "Fast pipe leak repairs, borehole submersible pump diagnostics, overhead tank float systems, water heaters, and drainage works.",
    highlights: ["Leak Repairs", "Borehole Pumps", "Water Heaters"],
    previewTitle: "Master Plumber",
    previewSubtitle: "Pipe leaks, borehole pumps & tank plumbing",
    previewBadge: "Itemised Quotes",
    href: "/explore-services?cat=plumbing-water-systems",
    icon: "wrench",
    illustrationSrc: "/categories/plumbing-services.png",
    illustrationAlt: "3D illustration of a friendly Nigerian master plumber",
    gradientStyle: "linear-gradient(135deg, #0E3B5C 0%, #156293 56%, #1F84C2 100%)",
    accentGlow: "rgba(125, 211, 252, 0.26)",
  },
  {
    id: "moving-relocation",
    number: "05",
    tag: "Moving & Relocation",
    title: "Moving and Relocation",
    description:
      "Careful home and office moves, furniture dismantling, protective bubble-wrapping, loading crews, and reliable city-wide haulage.",
    highlights: ["House Moving", "Office Relocation", "Protective Packing"],
    previewTitle: "Relocation & Haulage Team",
    previewSubtitle: "Apartment & office moving with protective packing",
    previewBadge: "Trusted Crew",
    href: "/explore-services?cat=moving-relocation-services",
    icon: "truck",
    illustrationSrc: "/categories/moving-relocation.png",
    illustrationAlt: "3D illustration of a friendly Nigerian moving and relocation specialist",
    gradientStyle: "linear-gradient(135deg, #114438 0%, #196956 56%, #238E75 100%)",
    accentGlow: "rgba(110, 231, 183, 0.25)",
  },
  {
    id: "beauty-personal-care",
    number: "06",
    tag: "Beauty & Personal Care",
    title: "Beauty and Personal Care",
    description:
      "Doorstep executive barbering, bridal and photoshoot makeup artists, hair braiding, wig styling, and personal grooming at your convenience.",
    highlights: ["Mobile Barbers", "Hair & Braids", "Bridal Makeup"],
    previewTitle: "On-Demand Grooming Pro",
    previewSubtitle: "Home-visit barbers, stylists & makeup artists",
    previewBadge: "ID Vetted",
    href: "/explore-services?cat=beauty-personal-care",
    icon: "scissors",
    illustrationSrc: "/categories/beauty-personal-care.png",
    illustrationAlt: "3D illustration of a friendly Nigerian beauty and personal care stylist",
    gradientStyle: "linear-gradient(135deg, #461B59 0%, #6E2B8C 56%, #923EB8 100%)",
    accentGlow: "rgba(232, 121, 249, 0.25)",
  },
  {
    id: "automotive-services",
    number: "07",
    tag: "Automotive Services",
    title: "Automotive Services",
    description:
      "Computerized OBD fault scanning, vehicle wiring, alternator and starter refurbishment, battery health testing, and auto AC electricals.",
    highlights: ["OBD Diagnostics", "Auto Electricals", "Car AC & Battery"],
    previewTitle: "Auto Diagnostic Specialist",
    previewSubtitle: "Computerized scanning, alternators & car AC",
    previewBadge: "On-Site Service",
    href: "/explore-services?cat=auto-electrical-services",
    icon: "car",
    illustrationSrc: "/categories/automotive-services.png",
    illustrationAlt: "3D illustration of a friendly Nigerian automotive diagnostic technician",
    gradientStyle: "linear-gradient(135deg, #162638 0%, #243F5E 56%, #315984 100%)",
    accentGlow: "rgba(147, 197, 253, 0.25)",
  },
  {
    id: "professional-business",
    number: "08",
    tag: "Professional & Business",
    title: "Professional and Business Services",
    description:
      "Multi-site commercial facility upkeep, preventive generator & HVAC maintenance, corporate event coordination, and vetted business support.",
    highlights: ["Facility Upkeep", "Preventive Logs", "Business Errands"],
    previewTitle: "Commercial & Business Desk",
    previewSubtitle: "Scheduled maintenance, events & operational tasks",
    previewBadge: "SLA & Escrow",
    href: "/explore-services?group=professional-business",
    icon: "shield",
    illustrationSrc: "/categories/professional-business.png",
    illustrationAlt: "3D illustration of a friendly Nigerian professional and business consultant",
    gradientStyle: "linear-gradient(135deg, #123D47 0%, #1B606B 56%, #24989A 100%)",
    accentGlow: "rgba(94, 234, 212, 0.28)",
  },
];

export interface StackedCategoriesSectionProps {
  mainCategories?: HomepageCategorySummary[];
  featuredServices?: EnrichedCatalogueService[];
  popularServices?: EnrichedCatalogueService[];
  totalServicesCount?: number;
  catalogueLoadError?: boolean;
}

export function StackedCategoriesSection({
  mainCategories = [],
  featuredServices = [],
  popularServices = [],
  totalServicesCount = 0,
  catalogueLoadError = false,
}: StackedCategoriesSectionProps) {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [cardTransforms, setCardTransforms] = useState<Array<{ scale: number; dim: number }>>(() =>
    STACKED_SERVICE_CATEGORIES.map(() => ({ scale: 1, dim: 0 }))
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCardTransforms(STACKED_SERVICE_CATEGORIES.map(() => ({ scale: 1, dim: 0 })));
      return;
    }

    let rafId = 0;

    const updateStackDepth = () => {
      const nextTransforms = STACKED_SERVICE_CATEGORIES.map((_, index) => {
        const currentEl = cardRefs.current[index];
        const nextEl = cardRefs.current[index + 1];
        if (!currentEl || !nextEl) {
          return { scale: 1, dim: 0 };
        }

        const currentRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();
        const overlapDistance = currentRect.bottom - nextRect.top;

        if (overlapDistance <= 0) {
          return { scale: 1, dim: 0 };
        }

        const progress = Math.min(1, Math.max(0, overlapDistance / Math.max(240, currentRect.height)));
        return {
          scale: Number((1 - progress * 0.038).toFixed(4)),
          dim: Number((progress * 0.14).toFixed(4)),
        };
      });

      setCardTransforms(nextTransforms);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateStackDepth);
    };

    updateStackDepth();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [prefersReducedMotion]);

  const totalLabel = String(STACKED_SERVICE_CATEGORIES.length).padStart(2, "0");

  return (
    <section
      id="popular-categories"
      aria-labelledby="categories-heading"
      className="bg-[#EEF6F7] py-16 sm:py-24 border-b border-[#DAE7E7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#24989A]">
              Marketplace Service Categories
            </p>
            <h2
              id="categories-heading"
              className="mt-2.5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#154752] leading-[1.14]"
            >
              Every Essential Service, One Trusted Platform.
            </h2>
            <p className="mt-4 text-base sm:text-lg lg:text-[1.15rem] text-[#4E6065] leading-relaxed">
              Explore eight core service categories across Port Harcourt, Lagos, and Abuja — backed by verified professionals, transparent quotes, and escrow protection.
            </p>
          </div>

          <Link
            href="/explore-services"
            className="inline-flex items-center justify-center gap-2 self-start lg:self-end rounded-xl bg-[#154752] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#0D282E] transition-colors shadow-xs shrink-0"
          >
            <span>Browse Full Service Directory</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Vertically Stacked Interactive Cards */}
        <div className="relative space-y-6 sm:space-y-8 pb-6">
          {STACKED_SERVICE_CATEGORIES.map((category, index) => {
            const transformState = cardTransforms[index] ?? { scale: 1, dim: 0 };
            const stickyTopPx = 84 + index * 14;

            return (
              <div
                key={category.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                style={{
                  position: "sticky",
                  top: `${stickyTopPx}px`,
                  zIndex: 10 + index,
                }}
                className="will-change-transform"
              >
                <article
                  style={{
                    background: category.gradientStyle,
                    transform: prefersReducedMotion
                      ? undefined
                      : `translate3d(0, 0, 0) scale(${transformState.scale})`,
                    transformOrigin: "top center",
                  }}
                  className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] border border-white/15 shadow-[0_22px_50px_-15px_rgba(13,40,46,0.34)] transition-transform duration-150 ease-out"
                >
                  {/* Subtle darkening overlay when overlapped by next card */}
                  {!prefersReducedMotion && transformState.dim > 0 && (
                    <div
                      aria-hidden="true"
                      style={{ opacity: transformState.dim }}
                      className="pointer-events-none absolute inset-0 bg-[#071824] z-30 transition-opacity duration-150"
                    />
                  )}

                  {/* Ambient radial glow behind character */}
                  <div
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at 78% 58%, ${category.accentGlow} 0%, transparent 66%)`,
                    }}
                    className="pointer-events-none absolute inset-0"
                  />

                  {/* Top Peek Strip (remains visible when subsequent cards stack on top) */}
                  <div className="relative z-10 flex items-center justify-between gap-4 px-6 sm:px-10 pt-5 sm:pt-6 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
                        <Icon name={category.icon} className="h-5 w-5" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-white/95 truncate">
                        {category.tag}
                      </span>
                    </div>

                    <span className="text-xs sm:text-sm font-bold tabular-nums tracking-wider text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/15 shrink-0">
                      {category.number} / {totalLabel}
                    </span>
                  </div>

                  {/* Main Two-Column Card Body */}
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8 px-6 sm:px-10 pt-6 sm:pt-8 pb-0 lg:pb-0">
                    {/* Left Column: Heading, Description, Highlights & CTA */}
                    <div className="lg:col-span-7 pb-6 lg:pb-10">
                      <h3 className="text-2xl sm:text-3xl lg:text-[2.3rem] font-extrabold text-white tracking-tight leading-[1.13]">
                        {category.title}
                      </h3>

                      <p className="mt-3.5 sm:mt-4 text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl">
                        {category.description}
                      </p>

                      {/* Key Sub-services Pills */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {category.highlights.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/20 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white/95"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#EE9277]" />
                            {item}
                          </span>
                        ))}
                      </div>

                      {/* Primary Action CTA */}
                      <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-4">
                        <Link
                          href={category.href}
                          className="group inline-flex items-center gap-2.5 rounded-full bg-white px-6 sm:px-7 py-3.5 text-base font-bold text-[#154752] shadow-md hover:bg-[#F3F8F8] transition-all"
                        >
                          <span>Explore Services</span>
                          <span
                            aria-hidden="true"
                            className="transition-transform duration-150 group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Floating Service Preview Card + 3D Character Illustration */}
                    <div className="lg:col-span-5 relative flex items-end justify-center lg:justify-end min-h-[250px] sm:min-h-[300px] lg:min-h-[330px]">
                      {/* Bazeprime-Style Floating White UI Card */}
                      <div className="hidden sm:block absolute left-0 xl:left-2 bottom-8 z-20 max-w-[230px] rounded-2xl bg-white p-4 shadow-xl border border-white/60 -rotate-2">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                            ✓
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#24989A]">
                            {category.previewBadge}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-[#154752] leading-snug">
                          {category.previewTitle}
                        </p>
                        <p className="mt-1 text-xs text-[#68797C] leading-relaxed">
                          {category.previewSubtitle}
                        </p>
                      </div>

                      {/* 3D Stylized Character Illustration */}
                      <Image
                        src={category.illustrationSrc}
                        alt={category.illustrationAlt}
                        width={420}
                        height={360}
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 320px, 360px"
                        quality={82}
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="relative z-10 h-[250px] sm:h-[305px] lg:h-[335px] w-auto object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.32)] select-none"
                      />
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Dynamic Live Catalogue Extension: 12–15 Major Categories & Featured/Popular Services */}
        <div
          id="live-catalogue-discovery"
          className="mt-16 sm:mt-20 pt-14 border-t border-[#DAE7E7] space-y-14"
        >
          {/* Major Categories Dynamic Showcase (~12-15 categories) */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#24989A]">
                  Live Marketplace Catalogue
                </p>
                <h3 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#154752] tracking-tight">
                  Browse All {mainCategories.length > 0 ? mainCategories.length : "15"} Major Service Categories
                </h3>
                <p className="mt-1.5 text-sm sm:text-base text-[#4E6065]">
                  Select any category or subcategory below to inspect individual service specifications, pricing benchmarks, and verified specialists.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#DAE7E7] px-4 py-2.5 text-sm font-semibold text-[#154752] hover:border-[#24989A] hover:text-[#24989A] transition-colors shadow-xs"
                >
                  <span>Full 3-Tier Catalogue ({totalServicesCount > 0 ? totalServicesCount : "30+"})</span>
                </Link>
                <Link
                  href="/explore-services"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#24989A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80] transition-colors shadow-xs"
                >
                  <span>Explore All Services →</span>
                </Link>
              </div>
            </div>

            {catalogueLoadError ? (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Live service catalogue temporarily unavailable
                  </p>
                  <p className="text-xs sm:text-sm text-amber-800 mt-1">
                    We could not load live database categories right now. You can still browse the directory or submit a direct service request.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/explore-services"
                    className="rounded-xl bg-[#154752] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#0D282E]"
                  >
                    Open Service Directory
                  </Link>
                  <Link
                    href="/book"
                    className="rounded-xl bg-white border border-amber-300 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-900 hover:bg-amber-100/60"
                  >
                    Submit Request
                  </Link>
                </div>
              </div>
            ) : mainCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center space-y-3">
                <p className="text-base font-bold text-[#154752]">
                  No active categories published yet
                </p>
                <p className="text-sm text-[#4E6065]">
                  Check back shortly or submit a custom request for immediate dispatch support.
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80]"
                >
                  Post Custom Service Request →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {mainCategories.slice(0, 15).map((cat) => (
                  <div
                    key={cat.id}
                    className="group rounded-2xl bg-white border border-[#DAE7E7] p-5 flex flex-col justify-between shadow-xs hover:border-[#24989A] hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/explore-services?cat=${encodeURIComponent(cat.slug)}`}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <span className="h-10 w-10 rounded-xl bg-[#EEF6F7] border border-[#DAE7E7] text-[#154752] group-hover:bg-[#24989A] group-hover:text-white group-hover:border-[#24989A] flex items-center justify-center shrink-0 transition-colors">
                            <Icon
                              name={resolveCatalogueIcon(cat.icon_name, cat.slug)}
                              className="h-5 w-5"
                            />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-[#154752] group-hover:text-[#24989A] truncate transition-colors">
                              {cat.name}
                            </h4>
                            <p className="text-xs text-[#68797C]">
                              {cat.subcategory_count} subcategor{cat.subcategory_count === 1 ? "y" : "ies"} • {cat.service_count} service{cat.service_count === 1 ? "" : "s"}
                            </p>
                          </div>
                        </Link>

                        {cat.is_featured && (
                          <span className="shrink-0 rounded-full bg-[#EEF6F7] border border-[#24989A]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#24989A]">
                            Featured
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p className="mt-3 text-xs sm:text-sm text-[#4E6065] line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}

                      {cat.subcategories.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {cat.subcategories.slice(0, 3).map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/explore-services?cat=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(sub.slug)}`}
                              className="inline-flex items-center gap-1 rounded-full bg-[#F3F8F8] border border-[#DAE7E7] px-2.5 py-1 text-[11px] font-medium text-[#154752] hover:border-[#24989A] hover:text-[#24989A] transition-colors"
                            >
                              <span className="truncate max-w-[160px]">{sub.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EEF6F7] flex items-center justify-between text-xs font-semibold">
                      <Link
                        href={`/explore-services?cat=${encodeURIComponent(cat.slug)}`}
                        className="text-[#24989A] hover:underline"
                      >
                        Explore Subcategories &amp; Pros →
                      </Link>
                      <Link
                        href={`/book?category=${encodeURIComponent(cat.id)}`}
                        className="text-[#154752] hover:text-[#24989A]"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured & Popular Individual Services Showcase */}
          {!catalogueLoadError && (featuredServices.length > 0 || popularServices.length > 0) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#24989A]">
                    In-Demand Specialisations
                  </p>
                  <h3 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#154752] tracking-tight">
                    Featured &amp; Popular Services
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-[#4E6065]">
                    Inspect transparent Naira benchmarks, technician qualification requirements, and instant booking links.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="text-sm font-bold text-[#154752] hover:text-[#24989A] underline underline-offset-4 shrink-0"
                >
                  Browse All {totalServicesCount} Individual Services →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {(featuredServices.length > 0 ? featuredServices : popularServices)
                  .slice(0, 8)
                  .map((srv) => {
                    const durationText = formatDurationLabel(srv.estimated_duration_minutes);
                    return (
                      <article
                        key={srv.id}
                        className="rounded-2xl bg-white border border-[#DAE7E7] p-5 flex flex-col justify-between shadow-xs hover:border-[#24989A] hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="text-[#24989A] uppercase tracking-wider truncate">
                              {srv.category_name}
                            </span>
                            {srv.is_popular && (
                              <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Popular
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/services/${srv.slug}`}
                            className="mt-2 block text-base font-bold text-[#154752] hover:text-[#24989A] leading-snug transition-colors"
                          >
                            {srv.name}
                          </Link>

                          {srv.subcategory_name && (
                            <p className="mt-1 text-xs font-medium text-[#68797C] truncate">
                              {srv.subcategory_name}
                            </p>
                          )}

                          {srv.short_description && (
                            <p className="mt-2.5 text-xs sm:text-sm text-[#4E6065] line-clamp-2 leading-relaxed">
                              {srv.short_description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EEF6F7] space-y-3">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-[#68797C] font-semibold">
                                Benchmark Guide
                              </span>
                              <span className="font-extrabold text-[#154752]">
                                {formatServicePriceRange(
                                  srv.base_price_min_kobo,
                                  srv.base_price_max_kobo
                                )}
                              </span>
                            </div>
                            {durationText && (
                              <span className="rounded-lg bg-[#F3F8F8] px-2.5 py-1 text-[11px] font-semibold text-[#4E6065]">
                                ~{durationText}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 text-xs font-bold">
                            <Link
                              href={`/services/${srv.slug}`}
                              className="flex-1 text-center rounded-xl border border-[#DAE7E7] py-2 text-[#154752] hover:bg-[#F3F8F8] transition-colors"
                            >
                              Details
                            </Link>
                            <Link
                              href={`/book?category=${encodeURIComponent(srv.category_id)}&service=${encodeURIComponent(srv.id)}&title=${encodeURIComponent(srv.name)}`}
                              className="flex-1 text-center rounded-xl bg-[#154752] py-2 text-white hover:bg-[#0D282E] transition-colors"
                            >
                              Book
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
