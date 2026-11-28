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
      <section className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[500px] flex items-center justify-center bg-[#1F2328] text-white border-b border-[#2E343B]">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-tools.jpg"
            alt="Couple using smart calculator and solar planning tools for home improvements"
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
              100% Free Everyday Utilities
            </p>
            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Smart Problem Solvers, Calculators &amp; Document Generators
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-[#FAF7F3] leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
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
