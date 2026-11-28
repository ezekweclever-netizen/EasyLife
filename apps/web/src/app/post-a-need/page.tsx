import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/site/icons";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCatalogueServiceBySlugOrId,
  getCustomerProfile,
  getDiscoverableProfessionals,
  getProfessionalById,
  getServiceCategories,
} from "@/lib/supabase/customer";
import { PostANeedWizard } from "@/components/booking/post-a-need-wizard";

export const metadata: Metadata = {
  title: "Post a Need — Transparent Quotes from Verified Pros | EasyLife Nigeria",
  description:
    "Describe any repair, maintenance, or everyday service problem in plain English. EasyLife AI assists with problem diagnosis and connects you with verified local trade professionals across Port Harcourt, Lagos, and Abuja.",
};

interface PostANeedPageProps {
  searchParams: Promise<{
    category?: string;
    service?: string;
    pro?: string;
    city?: string;
    title?: string;
    description?: string;
    urgency?: "normal" | "high" | "emergency";
  }>;
}

export default async function PostANeedPage({
  searchParams,
}: PostANeedPageProps) {
  const {
    category,
    service,
    pro,
    city,
    title,
    description,
    urgency,
  } = await searchParams;

  const auth = await getAuthenticatedUser();

  const [allCategories, preSelectedPro, preSelectedService, profile] =
    await Promise.all([
      getServiceCategories(),
      pro ? getProfessionalById(pro) : Promise.resolve(null),
      service ? getCatalogueServiceBySlugOrId(service) : Promise.resolve(null),
      auth
        ? getCustomerProfile(auth.user.id, auth.accessToken)
        : Promise.resolve(null),
    ]);

  const topCategories = allCategories.filter((c) => !c.parent_id);
  const categories = topCategories.length > 0 ? topCategories : allCategories;

  const matchedCategory = category
    ? allCategories.find((c) => c.id === category || c.slug === category) || null
    : null;

  const resolvedCategoryId =
    preSelectedService?.category_id ||
    matchedCategory?.parent_id ||
    matchedCategory?.id ||
    undefined;

  const resolvedSubcategoryId =
    preSelectedService?.subcategory_id ||
    (matchedCategory?.parent_id ? matchedCategory.id : undefined);

  const resolvedTitle = title || preSelectedService?.name || undefined;
  const activeCity = city?.trim() || profile?.city || "Port Harcourt";

  const preloadedPros = await getDiscoverableProfessionals({
    city: activeCity,
    categoryId: resolvedCategoryId,
    verifiedOnly: true,
    limit: 6,
  });

  return (
    <PublicShell>
      <section className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[500px] flex items-center justify-center bg-[#1F2328] text-white border-b border-[#2E343B]">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-post-a-need.jpg"
            alt="Customer celebrating receiving instant transparent quotes on EasyLife"
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
              Everyday Problems. Smarter Solutions.
            </p>
            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Tell Us What You Need, Get Honest Quotes
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-[#FAF7F3] leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Describe your repair in plain words. We match you with verified technicians in Port Harcourt, Lagos, and Abuja who send you clear price quotes.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Main Request Wizard */}
        <PostANeedWizard
          categories={categories}
          initialCategory={resolvedCategoryId}
          initialSubcategory={resolvedSubcategoryId}
          initialService={preSelectedService}
          initialPro={preSelectedPro}
          initialCity={activeCity}
          initialTitle={resolvedTitle}
          initialDescription={description}
          initialUrgency={urgency}
          user={
            auth
              ? {
                  id: auth.user.id,
                  email: auth.user.email || undefined,
                  fullName: profile?.full_name ?? undefined,
                }
              : null
          }
          preloadedPros={preloadedPros}
        />

        {/* How Post a Need Works (The 4-Step Escrow & Quotation Guarantee) */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
              How Post a Need Works
            </h2>
            <p className="text-xs sm:text-sm text-[#4A525C] dark:text-[#C3C8CF]">
              Complete transparency from request submission to final sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl p-5 border border-[#E6E0D8] dark:border-[#2E343B] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30 text-xs font-black flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                Describe the Problem
              </h4>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                Tell us what needs fixing, select your city, and upload photos if you have them.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1F2328] rounded-2xl p-5 border border-[#E6E0D8] dark:border-[#2E343B] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30 text-xs font-black flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                Receive Clear Quotes
              </h4>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                Verified technicians send you price quotes showing parts and labour costs.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1F2328] rounded-2xl p-5 border border-[#E6E0D8] dark:border-[#2E343B] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30 text-xs font-black flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                Choose Your Technician
              </h4>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                Compare ratings, reviews, and prices, then accept the quote you like.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1F2328] rounded-2xl p-5 border border-[#E6E0D8] dark:border-[#2E343B] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30 text-xs font-black flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                Pay Safely
              </h4>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                Your payment is held safely until the technician finishes the job and you approve the work.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Trust Banner */}
        <div className="rounded-3xl bg-[#1F2328] border border-[#2E343B] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-[#FAF7F3]">
              Looking for a specific verified professional instead?
            </h3>
            <p className="text-xs sm:text-sm text-[#C3C8CF] max-w-xl">
              Browse our accredited directory of verified technicians across Port Harcourt, Lagos, and Abuja. Filter by trade, rating, and neighbourhood.
            </p>
          </div>
          <ButtonLink
            href="/services"
            size="lg"
            className="shrink-0 bg-[#E8590C] hover:bg-[#C84A06] text-white font-bold"
          >
            Browse Verified Pros &rarr;
          </ButtonLink>
        </div>
      </section>
    </PublicShell>
  );
}
