"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface StickyPurposeCard {
  id: string;
  label: string;
  title: string;
  description: string;
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
    label: "FIND SOLUTIONS (01 / 03)",
    title: "Need something?",
    description: "Find a service, professional, product or property.",
    pills: [
      { label: "Services", href: "/explore-services" },
      { label: "Professionals", href: "/explore-services#professionals" },
      { label: "Products", href: "/services" },
      { label: "Property", href: "/property-services" },
    ],
    gradientStyle: "linear-gradient(135deg, #102D78 0%, #1649A5 100%)",
    ambientGlowPrimary: "rgba(96, 165, 250, 0.36)",
    ambientGlowSecondary: "rgba(56, 189, 248, 0.16)",
    illustrationSrc: "/cards/find-solutions.jpg",
    illustrationAlt:
      "3D illustration representing everyday services, verified professionals, products, and property solutions",
    shadowColor: "rgba(16, 45, 120, 0.34)",
  },
  {
    id: "discover-opportunities",
    label: "DISCOVER OPPORTUNITIES (02 / 03)",
    title: "Looking for opportunities?",
    description: "Find jobs, gigs, training, events and business opportunities.",
    pills: [
      { label: "Jobs", href: "/become-a-professional" },
      { label: "Gigs", href: "/tasks" },
      { label: "Training", href: "/verification-policy" },
      { label: "Events", href: "/explore-services?cat=event-planning-services" },
      { label: "Business", href: "/business-solutions" },
    ],
    gradientStyle: "linear-gradient(135deg, #064E46 0%, #087F70 100%)",
    ambientGlowPrimary: "rgba(45, 212, 191, 0.32)",
    ambientGlowSecondary: "rgba(16, 185, 129, 0.18)",
    illustrationSrc: "/cards/discover-opportunities.jpg",
    illustrationAlt:
      "3D illustration representing career opportunities, gigs, training, events, and business growth",
    shadowColor: "rgba(6, 78, 70, 0.34)",
  },
  {
    id: "achieve-goals",
    label: "ACHIEVE GOALS (03 / 03)",
    title: "Want to get something done?",
    description: "Use free tools, AI assistance and business resources.",
    pills: [
      { label: "Free Tools", href: "/how-it-works" },
      { label: "AI Assistant", href: "/assistant" },
      { label: "Resources", href: "/help" },
    ],
    gradientStyle: "linear-gradient(135deg, #33216F 0%, #5140A9 100%)",
    ambientGlowPrimary: "rgba(167, 139, 250, 0.36)",
    ambientGlowSecondary: "rgba(129, 140, 248, 0.18)",
    illustrationSrc: "/cards/achieve-goals.jpg",
    illustrationAlt:
      "3D illustration representing AI assistance, productivity tools, and digital resources",
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

        const cardHeight = Math.max(240, currentRect.height);
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
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky 3-Card Stack Container */}
        <div className="relative flex flex-col gap-[210px] sm:gap-[230px] md:gap-[250px] pb-16 sm:pb-24">
          {EASYLIFE_PURPOSE_CARDS.map((card, index) => {
            const topOffsetStyle = `calc(max(84px, (100vh - 324px) / 2) + ${index * 16}px)`;

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
                  className="relative overflow-hidden min-h-[276px] sm:h-[304px] md:h-[324px] rounded-[20px] md:rounded-[26px] px-5 py-6 sm:px-9 sm:py-8 md:px-12 lg:px-[52px] md:py-9 flex items-center justify-between gap-3 sm:gap-6 lg:gap-10 transition-transform duration-150 ease-out"
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

                  {/* Left Content Column (Vertically Centered) */}
                  <div className="relative z-10 flex-1 min-w-0 max-w-[580px] flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.11em] sm:tracking-[0.14em] text-white/75">
                      {card.label}
                    </p>

                    <h2 className="mt-1.5 sm:mt-2.5 text-[1.35rem] sm:text-[1.9rem] md:text-[2.25rem] font-bold tracking-[-0.02em] text-white leading-[1.14]">
                      {card.title}
                    </h2>

                    <p className="mt-2 sm:mt-3 text-[0.84rem] sm:text-[0.975rem] md:text-[1.0625rem] text-white/85 leading-[1.45] sm:leading-[1.5] max-w-[490px]">
                      {card.description}
                    </p>

                    {/* Category Pills */}
                    <div className="mt-3.5 sm:mt-6 flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                      {card.pills.map((pill) => (
                        <Link
                          key={pill.label}
                          href={pill.href}
                          className="inline-flex items-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:bg-white/25 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-[13px] font-medium text-white backdrop-blur-xs transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                        >
                          {pill.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Right Visual 3D Illustration */}
                  <div className="relative z-10 shrink-0 flex items-center justify-center w-[96px] h-[96px] sm:w-[176px] sm:h-[176px] md:w-[244px] md:h-[244px] lg:w-[272px] lg:h-[272px]">
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
                        sizes="(max-width: 640px) 96px, (max-width: 768px) 176px, (max-width: 1024px) 244px, 272px"
                        priority={index === 0}
                        className="object-contain scale-[1.2] brightness-[1.06] contrast-[1.04]"
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
