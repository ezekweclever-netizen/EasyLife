import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/site/public-shell";
import { getBusinessBySlugOrId } from "@/lib/supabase/directories";
import { BusinessProfileClient } from "@/components/business-hub/business-profile-client";

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BusinessDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusinessBySlugOrId(id);

  if (!business) {
    return {
      title: "Business Not Found — EasyLife Business Hub",
    };
  }

  return {
    title: `${business.name} — ${business.business_category || business.industry || "Local Enterprise"} in ${business.city} | EasyLife`,
    description: business.description?.slice(0, 160) || `Verified business profile for ${business.name} in ${business.city}, Nigeria.`,
  };
}

export default async function BusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const { id } = await params;
  const business = await getBusinessBySlugOrId(id);

  if (!business) {
    notFound();
  }

  return (
    <PublicShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BusinessProfileClient business={business} />
      </div>
    </PublicShell>
  );
}
