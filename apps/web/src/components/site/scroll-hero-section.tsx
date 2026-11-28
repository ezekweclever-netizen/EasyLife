"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { ServiceSearchForm } from "@/components/site/service-search-form";
import { ButtonLink } from "@/components/ui/button";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ScrollHeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;
    let isVisible = true;
    let rafId = 0;

    const resetTransforms = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = "translate3d(0, 0, 0) scale(1)";
      }
      if (contentRef.current) {
        contentRef.current.style.transform = "translate3d(0, 0, 0)";
        contentRef.current.style.opacity = "1";
      }
    };

    const applyFrame = () => {
      const section = sectionRef.current;
      const bg = bgRef.current;
      const content = contentRef.current;
      if (!section || !bg) return;

      if (reducedMotion) {
        resetTransforms();
        return;
      }

      const rect = section.getBoundingClientRect();
      const height = Math.max(1, rect.height);
      const progress = clamp01(-rect.top / height);

      const isMobile = window.innerWidth < 768;
      const maxParallaxY = isMobile ? 26 : 52;
      const maxScaleBoost = isMobile ? 0.05 : 0.08;

      const bgY = progress * maxParallaxY;
      const bgScale = 1 + progress * maxScaleBoost;

      bg.style.transform = `translate3d(0, ${bgY.toFixed(1)}px, 0) scale(${bgScale.toFixed(4)})`;

      if (content) {
        const contentY = progress * (isMobile ? -12 : -22);
        const contentOpacity = Math.max(0.2, 1 - progress * 0.72);
        content.style.transform = `translate3d(0, ${contentY.toFixed(1)}px, 0)`;
        content.style.opacity = contentOpacity.toFixed(3);
      }
    };

    const scheduleFrame = () => {
      if (!isVisible && !reducedMotion) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyFrame);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      scheduleFrame();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) scheduleFrame();
      },
      { rootMargin: "120px 0px 120px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    applyFrame();
    window.addEventListener("scroll", scheduleFrame, { passive: true });
    window.addEventListener("resize", scheduleFrame, { passive: true });
    mq.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleFrame);
      window.removeEventListener("resize", scheduleFrame);
      mq.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="EasyLife Marketplace Hero"
      className="relative w-full min-h-[620px] sm:min-h-[660px] md:min-h-[680px] lg:min-h-[calc(100svh-72px)] lg:max-h-[880px] flex items-center justify-center overflow-hidden bg-[#1F2328] text-white border-b border-[#2E343B]"
    >
      {/* Full-Width, Full-Height Edge-to-Edge Background Photograph */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 will-change-transform"
        style={{ transformOrigin: "center 30%" }}
      >
        <Image
          src="/images/hero-home-community.jpg"
          alt="EasyLife community: verified trade technician, happy Nigerian family, and business professional"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_15%] sm:object-[50%_18%] md:object-[50%_20%]"
        />
      </div>

      {/* Subtle, transparent dark overlay preserving full image clarity and prominence */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/55"
      />

      {/* Foreground Content Layer: Fully Centered Horizontally and Vertically */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28 flex flex-col items-center justify-center text-center">
        <div
          ref={contentRef}
          className="max-w-3xl mx-auto text-center will-change-transform flex flex-col items-center justify-center"
        >
          {/* Pilot Cities Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/25 text-[#FAF7F3] text-xs sm:text-sm font-semibold mb-4 sm:mb-5 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#E8590C] animate-pulse" />
            <span>Operating in Port Harcourt • Lagos • Abuja</span>
          </div>

          <h1 className="text-[2.1rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.6rem] font-bold tracking-tight text-white leading-[1.12] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Everyday Problems. <br />
            <span className="text-[#E8590C]">Smarter Solutions.</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-[#FAF7F3] max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            EasyLife helps people and businesses find reliable everyday services and manage essential maintenance with less effort.
          </p>

          {/* Main Service Search Bar */}
          <div className="mt-6 sm:mt-8 w-full max-w-xl mx-auto">
            <ServiceSearchForm id="hero-search" tone="dark" />
          </div>

          {/* Direct Action CTAs: Find Services and Post a Need */}
          <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/services" size="lg" className="shadow-md">
              Find Services
            </ButtonLink>
            <ButtonLink
              href="/post-a-need"
              size="lg"
              variant="outline-inverse"
              className="bg-black/35 border-white/30 text-white hover:bg-black/50 shadow-md"
            >
              Post a Need
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
