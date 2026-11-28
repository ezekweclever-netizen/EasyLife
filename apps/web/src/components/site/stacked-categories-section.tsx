"use client";

import React, { useEffect, useRef, useState } from "react";
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
    gradientStyle: "linear-gradient(135deg, #15181C 0%, #1F2328 50%, #2A3037 100%)",
    ambientGlowPrimary: "rgba(232, 89, 12, 0.22)",
    ambientGlowSecondary: "rgba(232, 89, 12, 0.12)",
    illustrationSrc: "/cards/find-solutions.jpg",
    illustrationAlt:
      "3D illustration representing everyday services, verified professionals, and home repairs",
    shadowColor: "rgba(31, 35, 40, 0.35)",
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
    gradientStyle: "linear-gradient(135deg, #1A1F24 0%, #252B32 50%, #303740 100%)",
    ambientGlowPrimary: "rgba(232, 89, 12, 0.24)",
    ambientGlowSecondary: "rgba(232, 89, 12, 0.14)",
    illustrationSrc: "/cards/discover-opportunities.jpg",
    illustrationAlt:
      "3D illustration representing career opportunities, vocational gigs, and trade employment",
    shadowColor: "rgba(31, 35, 40, 0.35)",
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
    gradientStyle: "linear-gradient(135deg, #16191D 0%, #20262C 50%, #2B323B 100%)",
    ambientGlowPrimary: "rgba(232, 89, 12, 0.22)",
    ambientGlowSecondary: "rgba(232, 89, 12, 0.12)",
    illustrationSrc: "/cards/achieve-goals.jpg",
    illustrationAlt:
      "3D illustration representing local businesses, corporate facilities, and digital resources",
    shadowColor: "rgba(31, 35, 40, 0.35)",
  },
];

export function StackedCategoriesSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardSurfaceRefs = useRef<Array<HTMLElement | null>>([]);
  const labelRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const actionsRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dimOverlayRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Default baseline fallback values
  const [metrics, setMetrics] = useState({
    stackBase: 93,
    top0: 93,
    top1: 146,
    top2: 215,
    stackStep: 54,
  });

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let rafId = 0;

    /**
     * Measure actual navbar height and card top padding + label height
     * to set precise CSS variables for index-based sticky positioning:
     * Card 0 top = navbar height + 12px
     * Card 1 top = Card 0 top + step0 (Card 0 top padding + label height + 12px)
     * Card 2 top = Card 1 top + step1 (Card 1 top padding + label height + 12px)
     */
    const updateStackMetrics = () => {
      // 1. Measure Navbar height (fixed header)
      const headerEl = document.querySelector("header");
      let navHeight = 80;
      if (headerEl) {
        const navRect = headerEl.getBoundingClientRect();
        navHeight = Math.max(64, Math.round(navRect.height));
      } else {
        navHeight = window.innerWidth >= 640 ? 92 : 80;
      }

      // Card 1 top = navbar height + 12px
      const calculatedStackBase = navHeight + 12;

      // 2. Measure per-card step heights from actual card top padding and label height
      const stepHeights: number[] = [53, 53, 53];

      for (let i = 0; i < EASYLIFE_PURPOSE_CARDS.length; i++) {
        const cardEl = cardSurfaceRefs.current[i];
        const labelEl = labelRefs.current[i];

        if (cardEl && labelEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const labelRect = labelEl.getBoundingClientRect();
          // Distance from card's top edge to the bottom of the eyebrow label
          const labelBottomFromCardTop = labelRect.bottom - cardRect.top;
          // Step height = distance from top to label bottom + 12px gap
          const step = Math.round(labelBottomFromCardTop + 12);
          if (step > 30) {
            stepHeights[i] = step;
          }
        }
      }

      const calculatedTop0 = calculatedStackBase;
      const calculatedTop1 = calculatedTop0 + (stepHeights[0] ?? 53);
      const calculatedTop2 = calculatedTop1 + (stepHeights[1] ?? 53);
      const calculatedMaxStep = Math.max(...stepHeights);

      const nextMetrics = {
        stackBase: calculatedStackBase,
        top0: calculatedTop0,
        top1: calculatedTop1,
        top2: calculatedTop2,
        stackStep: calculatedMaxStep,
      };

      setMetrics(nextMetrics);

      if (containerRef.current) {
        containerRef.current.style.setProperty("--stack-base", `${calculatedStackBase}px`);
        containerRef.current.style.setProperty("--stack-step", `${calculatedMaxStep}px`);
        containerRef.current.style.setProperty("--top-0", `${calculatedTop0}px`);
        containerRef.current.style.setProperty("--top-1", `${calculatedTop1}px`);
        containerRef.current.style.setProperty("--top-2", `${calculatedTop2}px`);
      }
    };

    /**
     * Manage depth shading, lockstep exit synchronization, and prevent covered cards'
     * buttons/chips from receiving pointer clicks or keyboard Tab focus.
     */
    const updateDepth = () => {
      const currentMetrics = metricsRef.current;
      const step0 = currentMetrics.top1 - currentMetrics.top0;
      const step1 = currentMetrics.top2 - currentMetrics.top1;

      const card1Wrapper = stickyRefs.current[0];
      const card2Wrapper = stickyRefs.current[1];
      const card3Wrapper = stickyRefs.current[2];

      // Invariant lock on exit:
      // When Card 3 reaches its final stacked position (top2), Card 2 MUST remain
      // exactly step1 above Card 3, and Card 1 MUST remain exactly step0 above Card 2.
      if (card3Wrapper && card2Wrapper && card1Wrapper) {
        const c3_y = card3Wrapper.getBoundingClientRect().top;

        if (c3_y <= currentMetrics.top2) {
          const targetY2 = c3_y - step1;
          const targetY1 = targetY2 - step0;

          // Compute raw position of Card 2 and Card 1 without current translation
          const currentTrans2 = parseFloat(card2Wrapper.dataset.transY || "0");
          const c2_raw = card2Wrapper.getBoundingClientRect().top - currentTrans2;

          const currentTrans1 = parseFloat(card1Wrapper.dataset.transY || "0");
          const c1_raw = card1Wrapper.getBoundingClientRect().top - currentTrans1;

          const deltaY2 = Math.round(targetY2 - c2_raw);
          const deltaY1 = Math.round(targetY1 - c1_raw);

          card2Wrapper.style.transform = `translate3d(0, ${deltaY2}px, 0)`;
          card2Wrapper.dataset.transY = `${deltaY2}`;

          card1Wrapper.style.transform = `translate3d(0, ${deltaY1}px, 0)`;
          card1Wrapper.dataset.transY = `${deltaY1}`;
        } else {
          if (card2Wrapper.dataset.transY) {
            card2Wrapper.style.transform = "";
            delete card2Wrapper.dataset.transY;
          }
          if (card1Wrapper.dataset.transY) {
            card1Wrapper.style.transform = "";
            delete card1Wrapper.dataset.transY;
          }
        }
      }

      for (let i = 0; i < EASYLIFE_PURPOSE_CARDS.length; i++) {
        const currentSticky = stickyRefs.current[i];
        const nextSticky = stickyRefs.current[i + 1];
        const overlay = dimOverlayRefs.current[i];
        const actions = actionsRefs.current[i];

        if (!currentSticky) continue;

        if (!nextSticky) {
          // Last card (Card 3) is never covered
          if (overlay) overlay.style.opacity = "0";
          if (actions) {
            actions.removeAttribute("inert");
            actions.querySelectorAll("a").forEach((a) => a.removeAttribute("tabindex"));
          }
          continue;
        }

        const currentRect = currentSticky.getBoundingClientRect();
        const nextRect = nextSticky.getBoundingClientRect();
        const overlap = currentRect.bottom - nextRect.top;

        if (overlap <= 0) {
          // Not overlapping yet
          if (overlay) overlay.style.opacity = "0";
          if (actions) {
            actions.removeAttribute("inert");
            actions.querySelectorAll("a").forEach((a) => a.removeAttribute("tabindex"));
          }
          continue;
        }

        // Accessibility requirement 14:
        // Disable click and keyboard focus on covered card buttons & chips
        if (actions) {
          const actionsRect = actions.getBoundingClientRect();
          const isCovered = nextRect.top <= actionsRect.bottom;
          if (isCovered) {
            actions.setAttribute("inert", "");
            actions.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
          } else {
            actions.removeAttribute("inert");
            actions.querySelectorAll("a").forEach((a) => a.removeAttribute("tabindex"));
          }
        }

        // Dimming overlay on covered content (eyebrow label sits above overlay with z-30)
        if (overlay && !reducedMotion) {
          const cardHeight = Math.max(200, currentRect.height);
          const progress = Math.min(1, Math.max(0, overlap / cardHeight));
          const dimOpacity = progress * 0.22;
          overlay.style.opacity = dimOpacity.toFixed(3);
        } else if (overlay) {
          overlay.style.opacity = "0";
        }
      }
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateDepth();
      });
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      scheduleUpdate();
    };

    // Initial measurements and observers
    updateStackMetrics();
    updateDepth();

    // ResizeObserver watches for label wraps, font loading, or layout shifts
    const resizeObserver = new ResizeObserver(() => {
      updateStackMetrics();
      scheduleUpdate();
    });

    labelRefs.current.forEach((el) => el && resizeObserver.observe(el));
    cardSurfaceRefs.current.forEach((el) => el && resizeObserver.observe(el));

    // Watch font loading to recalibrate line heights accurately
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updateStackMetrics();
        scheduleUpdate();
      });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", () => {
      updateStackMetrics();
      scheduleUpdate();
    });
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <section
      id="popular-categories"
      aria-label="What You Can Do on EasyLife"
      className="relative bg-[#FAF7F3] dark:bg-[#15181C] pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 border-b border-[#E6E0D8] dark:border-[#2E343B]"
      style={{ overflowX: "clip" }}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading above Sticky Stack */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#E8590C] uppercase">
            Everyday Problems. Smarter Solutions.
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F2328] dark:text-[#FAF7F3]">
            Three Ways EasyLife Works For You
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF]">
            From emergency repairs to rewarding careers and business maintenance — discover our consolidated ecosystem.
          </p>
        </div>

        {/* Sticky 3-Card Stack Container with tightly coupled spacing */}
        <div
          ref={containerRef}
          className="relative flex flex-col gap-6 md:gap-10 pb-0"
          style={
            {
              "--stack-base": `${metrics.stackBase}px`,
              "--stack-step": `${metrics.stackStep}px`,
              "--top-0": `${metrics.top0}px`,
              "--top-1": `${metrics.top1}px`,
              "--top-2": `${metrics.top2}px`,
            } as React.CSSProperties
          }
        >
          {EASYLIFE_PURPOSE_CARDS.map((card, index) => {
            const topVar = index === 0 ? "var(--top-0)" : index === 1 ? "var(--top-1)" : "var(--top-2)";

            return (
              <div
                key={card.id}
                ref={(el) => {
                  stickyRefs.current[index] = el;
                }}
                style={
                  {
                    position: "sticky",
                    top: `var(--card-top-${index}, ${topVar})`,
                    zIndex: 10 + index * 10,
                    "--i": index,
                  } as React.CSSProperties
                }
                className="w-full"
              >
                <article
                  ref={(el) => {
                    cardSurfaceRefs.current[index] = el;
                  }}
                  style={{
                    background: card.gradientStyle,
                    boxShadow: `0 24px 54px -18px ${card.shadowColor}, 0 8px 20px -10px rgba(7, 17, 34, 0.25)`,
                  }}
                  className="relative overflow-hidden h-auto rounded-[22px] md:rounded-[28px] p-6 sm:p-8 md:p-10 flex items-start sm:items-center justify-between gap-4 sm:gap-6 lg:gap-10"
                >
                  {/* Depth dim overlay when next card stacks above - sits behind the label */}
                  <div
                    ref={(el) => {
                      dimOverlayRefs.current[index] = el;
                    }}
                    aria-hidden="true"
                    style={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 bg-[#050C1A] z-20 transition-opacity duration-150 ease-out"
                  />

                  {/* Subtle top hairline sheen */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10"
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
                  <div className="relative z-10 flex-1 min-w-0 max-w-[620px] flex flex-col justify-start sm:justify-center">
                    {/* Eyebrow Label with z-30 ensuring it stays in front of dim overlay with high contrast */}
                    <p
                      ref={(el) => {
                        labelRefs.current[index] = el;
                      }}
                      className="relative z-30 text-[10px] sm:text-xs font-bold uppercase tracking-[0.11em] sm:tracking-[0.14em] text-white/95 mb-3 sm:mb-4 select-none"
                    >
                      {card.label}
                    </p>

                    <h3 className="text-[1.35rem] sm:text-[1.85rem] md:text-[2.2rem] font-bold tracking-[-0.02em] text-white leading-[1.15]">
                      {card.title}
                    </h3>

                    <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm md:text-[0.95rem] text-white/85 leading-relaxed max-w-[520px]">
                      {card.description}
                    </p>

                    {/* Value Proposition Bullets */}
                    <ul className="mt-3 space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-white/90 hidden sm:block">
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className="text-[#E8590C] font-bold text-xs">✓</span>
                          <span className="leading-tight">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Direct CTA Action & Category Pills */}
                    <div
                      ref={(el) => {
                        actionsRefs.current[index] = el;
                      }}
                      className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3"
                    >
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
