import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDirectoryBusinesses } from "@/lib/supabase/directories";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { BusinessDirectoryClient } from "@/components/directories/business-client";

export const metadata: Metadata = {
  title: "Local Business Directory — Port Harcourt, Lagos & Abuja | EasyLife Nigeria",
  description:
    "Discover verified local service businesses, repair workshops, printing hubs, tailoring studios, and commercial specialists across Port Harcourt, Lagos, and Abuja.",
};

interface BusinessesPageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    q?: string;
  }>;
}

export default async function BusinessesDirectoryPage({
  searchParams,
}: BusinessesPageProps) {
  const {
    category = "All",
    city = "All Cities",
    q = "",
  } = await searchParams;

  const businesses = await getDirectoryBusinesses({
    category: category === "All" ? undefined : category,
    city,
    query: q || undefined,
  });

  return (
    <PublicShell>
      <PageHero
        badge="Community Business Directory"
        title="Verified Local Businesses Across Our Nigerian Hubs"
        description="Discover local repair firms, tech maintenance hubs, bespoke tailoring studios, event rental centers, and commercial contractors in Port Harcourt, Lagos, and Abuja."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BusinessDirectoryClient
          initialBusinesses={businesses}
          defaultCategory={category}
          defaultCity={city}
          defaultQuery={q}
        />
      </section>
    </PublicShell>
  );
}
