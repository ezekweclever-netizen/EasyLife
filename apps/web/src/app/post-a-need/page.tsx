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
      <section className="relative w-full overflow-hidden min-h-[460px] sm:min-h-[500px] flex items-center justify-center bg-[#071E28] text-white border-b border-[#24989A]/20">
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
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#EE9277] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Everyday Problems. Smarter Solutions.
            </p>
            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Post a Need — Describe Your Problem, Get Honest Quotes
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-[#E1EEF0] leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Whether it&apos;s an urgent emergency repair or a planned project, describe your problem in plain English. EasyLife AI diagnoses your fault and connects you with accredited local trade specialists across Port Harcourt, Lagos, and Abuja.
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              How Post a Need Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Complete transparency from request submission to final sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0D223A] rounded-2xl p-5 border border-slate-200/80 dark:border-[#163654] space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-black flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Describe in Plain Words
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Detail your problem in Port Harcourt, Lagos, or Abuja, upload fault photos, and specify your preferred timing.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D223A] rounded-2xl p-5 border border-slate-200/80 dark:border-[#163654] space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-black flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Receive Itemized Quotes
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Accredited pros review your scope and submit transparent breakdowns of labour, materials, and callout fees.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D223A] rounded-2xl p-5 border border-slate-200/80 dark:border-[#163654] space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-black flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Choose Your Professional
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Compare ratings, reviews, past jobs, and pricing. Accept the quote that fits your timeline and budget.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D223A] rounded-2xl p-5 border border-slate-200/80 dark:border-[#163654] space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#0D9488] dark:text-[#5CD3D5] text-xs font-black flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Protected Escrow Release
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your payment is securely held in escrow until the technician finishes the job and you approve the quality inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Trust Banner */}
        <div className="rounded-3xl bg-linear-to-r from-[#0D9488] to-[#154752] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold">
              Looking for a specific verified professional instead?
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Browse our accredited directory of verified technicians across Port Harcourt, Lagos, and Abuja. Filter by trade, rating, and neighbourhood.
            </p>
          </div>
          <ButtonLink
            href="/services"
            variant="secondary"
            size="lg"
            className="shrink-0 bg-white text-[#154752] hover:bg-slate-100 font-bold"
          >
            Browse Verified Pros &rarr;
          </ButtonLink>
        </div>
      </section>
    </PublicShell>
  );
}
