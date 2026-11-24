import React from "react";
import type { Metadata } from "next";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
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
      <PageHero
        badge="100% Free Everyday Utilities"
        title="Smart Problem Solvers, Calculators & Document Generators"
        description="Free, practical AI assistants, financial calculators, and trade document templates built for Nigerian homes, artisans, and businesses. No account, login, or payment required."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <FreeToolsClient initialTab={tab} initialQuery={q} />
      </section>
    </PublicShell>
  );
}
