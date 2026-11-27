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
      className="relative w-full min-h-[720px] sm:min-h-[760px] md:min-h-[640px] lg:min-h-[calc(100svh-72px)] lg:max-h-[900px] flex items-end md:items-center overflow-hidden bg-[#0A1D36] text-white border-b border-[#24989A]/20"
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
          className="object-cover object-[56%_2%] sm:object-[54%_4%] md:object-[76%_20%] lg:object-[74%_20%] xl:object-[70%_20%]"
        />
      </div>

      {/* Responsive Blue-Navy Gradient Overlays for Text Readability */}
      {/* Mobile vertical gradient: allows faces at the top to remain completely clear, smoothly darkens behind content below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(8, 25, 48, 0.0) 0%, rgba(8, 25, 48, 0.04) 24%, rgba(8, 25, 48, 0.72) 42%, rgba(8, 25, 48, 0.95) 58%, #081930 100%)",
        }}
      />

      {/* Tablet & Desktop directional blue-navy gradient: rich contrast on left, luminous photo on right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(96deg, rgba(8, 25, 48, 0.96) 0%, rgba(9, 28, 54, 0.92) 38%, rgba(11, 36, 68, 0.48) 58%, rgba(10, 29, 54, 0.08) 100%)",
        }}
      />

      {/* Subtle bottom atmospheric vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10 bg-gradient-to-t from-[#081930]/65 to-transparent"
      />

      {/* Foreground Content Layer */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[300px] pb-8 sm:pt-[340px] sm:pb-10 md:py-20 lg:py-24">
        <div
          ref={contentRef}
          className="max-w-[480px] md:max-w-[440px] lg:max-w-[500px] xl:max-w-[540px] mx-auto md:mx-0 text-center md:text-left will-change-transform"
        >
          {/* Pilot Cities Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#091E38]/85 border border-white/20 text-[#E6F1F5] text-xs sm:text-sm font-semibold mb-4 sm:mb-5 shadow-xs backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#EE9277] animate-pulse" />
            <span>Operating in Port Harcourt • Lagos • Abuja</span>
          </div>

          <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[2.2rem] lg:text-[3.25rem] xl:text-[3.5rem] font-bold tracking-tight text-white leading-[1.12] drop-shadow-[0_2px_14px_rgba(8,25,48,0.4)]">
            Everyday Problems. <br />
            <span className="text-[#5CD3D5]">Smarter Solutions.</span>
          </h1>

          <p className="mt-3.5 sm:mt-5 text-sm sm:text-base lg:text-[1.075rem] text-[#E6F1F5] max-w-xl mx-auto md:mx-0 leading-relaxed drop-shadow-[0_1px_6px_rgba(8,25,48,0.35)]">
            EasyLife helps people and businesses find reliable everyday services and manage essential maintenance with less effort.
          </p>

          {/* Main Service Search Bar (No Popular Services links) */}
          <div className="mt-6 sm:mt-8 max-w-xl mx-auto md:mx-0">
            <ServiceSearchForm id="hero-search" tone="dark" />
          </div>

          {/* Direct Action CTAs: Find Services and Post a Need */}
          <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <ButtonLink href="/services" size="lg">
              Find Services
            </ButtonLink>
            <ButtonLink
              href="/post-a-need"
              size="lg"
              variant="outline-inverse"
              className="bg-[#091E38]/50 backdrop-blur-xs"
            >
              Post a Need
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
