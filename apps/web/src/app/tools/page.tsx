import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PublicShell } from "@/components/site/public-shell";
import { FreeToolsClient } from "@/components/tools/free-tools-client";

export const metadata: Metadata = {
  title: "Free Everyday Utility Tools, AI Assistants & Calculators — EasyLife Nigeria",
  description:
    "Free practical AI problem diagnostic assistants, invoice & receipt generators, loan repayment calculators, budget planners, and trade document templates for Nigerian homes and enterprises.",
};

interface FreeToolsPageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
  }>;
}

export default async function FreeToolsPage({
  searchParams,
}: FreeToolsPageProps) {
  const { tab = "all", q = "" } = await searchParams;

  return (
    <PublicShell>
      <section className="relative w-full overflow-hidden bg-[#071E28] text-white border-b border-[#24989A]/20">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-tools.jpg"
            alt="Couple using smart calculator and solar planning tools for home improvements"
            fill
            priority
            sizes="100vw"
            quality={92}
            className="object-cover object-[52%_12%] sm:object-[55%_15%] md:object-[65%_18%] lg:object-[68%_20%]"
          />
          {/* Base ambient darkening */}
          <div className="absolute inset-0 bg-[#051726]/20" />
          {/* Directional gradient: deep opacity focused strictly on left text column, clearing early to reveal couple and solar planning tools */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020B13]/95 via-[#031320]/85 via-28% md:to-transparent to-[#041726]/30" />
          {/* Mobile vertical gradient reinforcement for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020B13]/95 via-[#041726]/75 to-[#020B13]/50 sm:hidden" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-xl lg:max-w-lg">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#EE9277] drop-shadow-xs">
              100% Free Everyday Utilities
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight leading-[1.14] text-white drop-shadow-sm">
              Smart Problem Solvers, Calculators &amp; Document Generators
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#E1EEF0] leading-relaxed drop-shadow-xs">
              Free, practical AI assistants, financial calculators, and trade document templates built for Nigerian homes, artisans, and businesses. No account, login, or payment required.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <FreeToolsClient initialTab={tab} initialQuery={q} />
      </section>
    </PublicShell>
  );
}
