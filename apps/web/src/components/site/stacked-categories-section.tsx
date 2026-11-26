"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface StickyPurposeCard {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: readonly string[];
  ctaText: string;
  ctaHref: string;
  pills: ReadonlyArray<{ label: string; href: string }>;
  gradientStyle: string;
  ambientGlowPrimary: string;
  ambientGlowSecondary: string;
  illustrationSrc: string;
  illustrationAlt: string;
  shadowColor: string;
}

export const EASYLIFE_PURPOSE_CARDS: readonly StickyPurposeCard[] = [
  {
    id: "find-solutions",
    label: "FIND SERVICES (01 / 03)",
    title: "Need Something Fixed or Done?",
    description: "Connect with accredited service professionals and certified trade specialists in Port Harcourt, Lagos, and Abuja.",
    bullets: [
      "Strictly vetted identity, workshop address and verified trade competence",
      "Protected escrow payments released only on your satisfactory sign-off",
      "Transparent itemized quotations separating materials from labour upfront",
    ],
    ctaText: "Find a Professional",
    ctaHref: "/services",
    pills: [
      { label: "Plumbing", href: "/services?cat=plumbing-services" },
      { label: "Electrical", href: "/services?cat=electrical-services" },
      { label: "AC Repair", href: "/services?cat=ac-refrigeration-services" },
      { label: "Generators", href: "/services?cat=generator-services" },
      { label: "Carpentry", href: "/services?cat=carpentry-woodwork-services" },
      { label: "Cleaning", href: "/services?cat=cleaning-waste-services" },
    ],
    gradientStyle: "linear-gradient(135deg, #102D78 0%, #1649A5 100%)",
    ambientGlowPrimary: "rgba(96, 165, 250, 0.36)",
    ambientGlowSecondary: "rgba(56, 189, 248, 0.16)",
    illustrationSrc: "/cards/find-solutions.jpg",
    illustrationAlt:
      "3D illustration representing everyday services, verified professionals, and home repairs",
    shadowColor: "rgba(16, 45, 120, 0.34)",
  },
  {
    id: "discover-opportunities",
    label: "JOBS & OPPORTUNITIES (02 / 03)",
    title: "Looking for Work or Trade Gigs?",
    description: "Discover verified job vacancies, commercial maintenance contracts, and vocational apprenticeships across our hubs.",
    bullets: [
      "Direct connections with vetted employers and commercial facility managers",
      "Transparent compensation benchmarks in Naira with zero application fees",
      "Career growth pathways from trade apprentice to accredited technician",
    ],
    ctaText: "Browse Opportunities",
    ctaHref: "/jobs",
    pills: [
      { label: "Skilled Trades", href: "/jobs?category=Skilled+Trades" },
      { label: "Full-Time", href: "/jobs?type=full_time" },
      { label: "Trade Gigs", href: "/jobs?type=contract" },
      { label: "Apprenticeships", href: "/jobs?type=apprenticeship" },
      { label: "Post a Job", href: "/jobs/post" },
    ],
    gradientStyle: "linear-gradient(135deg, #064E46 0%, #087F70 100%)",
    ambientGlowPrimary: "rgba(45, 212, 191, 0.32)",
    ambientGlowSecondary: "rgba(16, 185, 129, 0.18)",
    illustrationSrc: "/cards/discover-opportunities.jpg",
    illustrationAlt:
      "3D illustration representing career opportunities, vocational gigs, and trade employment",
    shadowColor: "rgba(6, 78, 70, 0.34)",
  },
  {
    id: "achieve-goals",
    label: "BUSINESS HUB (03 / 03)",
    title: "Local Business Directory & Hub",
    description: "Explore vetted local businesses, claim member promotions, and manage multi-property corporate facility maintenance.",
    bullets: [
      "Search vetted local workshops, repair hubs, and commercial contractors",
      "Exclusive commercial member discounts, bulk rates, and seasonal deals",
      "Enterprise multi-property asset tracking and scheduled servicing",
    ],
    ctaText: "Visit Business Hub",
    ctaHref: "/business-hub",
    pills: [
      { label: "Business Directory", href: "/business-hub" },
      { label: "Member Deals", href: "/business-hub" },
      { label: "Asset Tracking", href: "/business-hub" },
      { label: "Facility Portal", href: "/business" },
    ],
    gradientStyle: "linear-gradient(135deg, #33216F 0%, #5140A9 100%)",
    ambientGlowPrimary: "rgba(167, 139, 250, 0.36)",
    ambientGlowSecondary: "rgba(129, 140, 248, 0.18)",
    illustrationSrc: "/cards/achieve-goals.jpg",
    illustrationAlt:
      "3D illustration representing local businesses, corporate facilities, and digital resources",
    shadowColor: "rgba(51, 33, 111, 0.36)",
  },
];

export function StackedCategoriesSection() {
  const stickyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardSurfaceRefs = useRef<Array<HTMLElement | null>>([]);
  const dimOverlayRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let rafId = 0;

    const resetStyles = () => {
      for (let i = 0; i < EASYLIFE_PURPOSE_CARDS.length; i++) {
        const surface = cardSurfaceRefs.current[i];
        const overlay = dimOverlayRefs.current[i];
        if (surface) {
          surface.style.transform = "translate3d(0, 0, 0) scale(1)";
        }
        if (overlay) {
          overlay.style.opacity = "0";
        }
      }
    };

    const updateDepth = () => {
      if (reducedMotion) {
        resetStyles();
        return;
      }

      for (let i = 0; i < EASYLIFE_PURPOSE_CARDS.length; i++) {
        const currentSticky = stickyRefs.current[i];
        const nextSticky = stickyRefs.current[i + 1];
        const surface = cardSurfaceRefs.current[i];
        const overlay = dimOverlayRefs.current[i];

        if (!surface) continue;

        if (!currentSticky || !nextSticky) {
          surface.style.transform = "translate3d(0, 0, 0) scale(1)";
          if (overlay) overlay.style.opacity = "0";
          continue;
        }

        const currentRect = currentSticky.getBoundingClientRect();
        const nextRect = nextSticky.getBoundingClientRect();
        const overlap = currentRect.bottom - nextRect.top;

        if (overlap <= 0) {
          surface.style.transform = "translate3d(0, 0, 0) scale(1)";
          if (overlay) overlay.style.opacity = "0";
          continue;
        }

        const cardHeight = Math.max(260, currentRect.height);
        const progress = Math.min(1, Math.max(0, overlap / cardHeight));
        const scale = 1 - progress * 0.04;
        const dimOpacity = progress * 0.22;

        surface.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
        if (overlay) {
          overlay.style.opacity = dimOpacity.toFixed(4);
        }
      }
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDepth);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      scheduleUpdate();
    };

    updateDepth();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <section
      id="popular-categories"
      aria-label="What You Can Do on EasyLife"
      className="relative bg-[#F3F8F8] dark:bg-[#071526] py-16 sm:py-24 border-b border-[#DAE7E7] dark:border-[#163654]"
      style={{ overflowX: "clip" }}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading above Sticky Stack */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#24989A] uppercase">
            Everyday Problems. Smarter Solutions.
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Three Ways EasyLife Works For You
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            From emergency repairs to rewarding careers and business maintenance — discover our consolidated ecosystem.
          </p>
        </div>

        {/* Sticky 3-Card Stack Container */}
        <div className="relative flex flex-col gap-[220px] sm:gap-[250px] md:gap-[280px] pb-16 sm:pb-24">
          {EASYLIFE_PURPOSE_CARDS.map((card, index) => {
            const topOffsetStyle = `calc(max(84px, (100vh - 360px) / 2) + ${index * 16}px)`;

            return (
              <div
                key={card.id}
                ref={(el) => {
                  stickyRefs.current[index] = el;
                }}
                style={{
                  position: "sticky",
                  top: topOffsetStyle,
                  zIndex: 10 + index * 10,
                }}
                className="w-full"
              >
                <article
                  ref={(el) => {
                    cardSurfaceRefs.current[index] = el;
                  }}
                  style={{
                    background: card.gradientStyle,
                    boxShadow: `0 24px 54px -18px ${card.shadowColor}, 0 8px 20px -10px rgba(7, 17, 34, 0.25)`,
                    transformOrigin: "top center",
                    willChange: "transform",
                  }}
                  className="relative overflow-hidden min-h-[300px] sm:min-h-[330px] md:min-h-[350px] rounded-[22px] md:rounded-[28px] p-6 sm:p-8 md:p-10 flex items-center justify-between gap-4 sm:gap-6 lg:gap-10 transition-transform duration-150 ease-out"
                >
                  {/* Depth dim overlay when next card stacks above */}
                  <div
                    ref={(el) => {
                      dimOverlayRefs.current[index] = el;
                    }}
                    aria-hidden="true"
                    style={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 bg-[#050C1A] z-30 transition-opacity duration-150 ease-out"
                  />

                  {/* Subtle top hairline sheen */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-20"
                  />

                  {/* Subtle ambient radial lighting accents */}
                  <div
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at 82% 52%, ${card.ambientGlowPrimary} 0%, transparent 56%)`,
                    }}
                    className="pointer-events-none absolute inset-0 z-0"
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at 12% 14%, ${card.ambientGlowSecondary} 0%, transparent 48%)`,
                    }}
                    className="pointer-events-none absolute inset-0 z-0"
                  />

                  {/* Left Content Column */}
                  <div className="relative z-10 flex-1 min-w-0 max-w-[620px] flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.11em] sm:tracking-[0.14em] text-white/75">
                      {card.label}
                    </p>

                    <h3 className="mt-1 sm:mt-2 text-[1.35rem] sm:text-[1.85rem] md:text-[2.2rem] font-bold tracking-[-0.02em] text-white leading-[1.15]">
                      {card.title}
                    </h3>

                    <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm md:text-[0.95rem] text-white/85 leading-relaxed max-w-[520px]">
                      {card.description}
                    </p>

                    {/* Value Proposition Bullets */}
                    <ul className="mt-3 space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-white/90 hidden sm:block">
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className="text-[#5CD3D5] font-bold text-xs">✓</span>
                          <span className="leading-tight">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Direct CTA Action & Category Pills */}
                    <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
                      <Link
                        href={card.ctaHref}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2 sm:py-2.5 text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] shrink-0"
                      >
                        <span>{card.ctaText}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {card.pills.map((pill) => (
                          <Link
                            key={pill.label}
                            href={pill.href}
                            className="inline-flex items-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:bg-white/25 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white backdrop-blur-xs transition-colors"
                          >
                            {pill.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Visual 3D Illustration */}
                  <div className="relative z-10 shrink-0 flex items-center justify-center w-[100px] h-[100px] sm:w-[170px] sm:h-[170px] md:w-[230px] md:h-[230px] lg:w-[260px] lg:h-[260px]">
                    <div
                      className="relative w-full h-full select-none mix-blend-lighten"
                      style={{
                        WebkitMaskImage:
                          "radial-gradient(circle at 50% 50%, #000 46%, rgba(0,0,0,0.8) 58%, transparent 72%)",
                        maskImage:
                          "radial-gradient(circle at 50% 50%, #000 46%, rgba(0,0,0,0.8) 58%, transparent 72%)",
                      }}
                    >
                      <Image
                        src={card.illustrationSrc}
                        alt={card.illustrationAlt}
                        fill
                        sizes="(max-width: 640px) 100px, (max-width: 768px) 170px, (max-width: 1024px) 230px, 260px"
                        priority={index === 0}
                        className="object-contain scale-[1.18] brightness-[1.06] contrast-[1.04]"
                      />
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
