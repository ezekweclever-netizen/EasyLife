import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCatalogueServiceBySlugOrId,
  getCustomerProfile,
  getProfessionalById,
  getServiceCategories,
} from "@/lib/supabase/customer";
import { checkCatalogueServiceAvailability } from "@/lib/supabase/catalogue-availability";
import { CustomerHeader } from "@/components/customer/customer-header";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata: Metadata = {
  title: "Request a Service — EasyLife",
  description:
    "Submit a service request for accredited plumbing, electrical, generator, AC, and facility repairs across Port Harcourt, Lagos, and Abuja.",
};

interface BookPageProps {
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

export default async function BookServicePage({ searchParams }: BookPageProps) {
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
  if (!auth) {
    const nextQs = new URLSearchParams();
    if (category) nextQs.set("category", category);
    if (service) nextQs.set("service", service);
    if (pro) nextQs.set("pro", pro);
    if (city) nextQs.set("city", city);
    if (title) nextQs.set("title", title);
    if (description) nextQs.set("description", description);
    if (urgency) nextQs.set("urgency", urgency);
    const nextPath = nextQs.toString() ? `/book?${nextQs.toString()}` : "/book";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const [allCategories, preSelectedPro, preSelectedService, profile] = await Promise.all([
    getServiceCategories(),
    pro ? getProfessionalById(pro) : Promise.resolve(null),
    service ? getCatalogueServiceBySlugOrId(service) : Promise.resolve(null),
    getCustomerProfile(auth.user.id, auth.accessToken),
  ]);

  let unavailableServiceNotice:
    | { name: string; reason: string; categorySlug?: string }
    | null = null;
  let fallbackUnavailableCategoryId: string | undefined;

  if (service && !preSelectedService) {
    const availability = await checkCatalogueServiceAvailability(service);
    if (availability.status === "unavailable") {
      unavailableServiceNotice = {
        name: availability.name || service,
        reason:
          availability.reason ||
          "This service is currently paused for standard booking. You can still submit a custom request in the parent trade category below.",
        categorySlug: availability.categorySlug,
      };
      if (
        availability.categoryId &&
        allCategories.some((c) => c.id === availability.categoryId && !c.parent_id)
      ) {
        fallbackUnavailableCategoryId = availability.categoryId;
      }
    }
  }

  const topCategories = allCategories.filter((c) => !c.parent_id);
  const categories = topCategories.length > 0 ? topCategories : allCategories;

  const matchedCategory = category
    ? allCategories.find((c) => c.id === category || c.slug === category) || null
    : null;

  const resolvedCategoryId =
    preSelectedService?.category_id ||
    matchedCategory?.parent_id ||
    matchedCategory?.id ||
    fallbackUnavailableCategoryId ||
    undefined;

  const resolvedSubcategoryId =
    preSelectedService?.subcategory_id ||
    (matchedCategory?.parent_id ? matchedCategory.id : undefined);

  const resolvedTitle =
    title || preSelectedService?.name || unavailableServiceNotice?.name || undefined;
  const activeCity = city?.trim() || profile?.city || "Port Harcourt";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        selectedCity={activeCity}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
            <span>✓ Verified Technician Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            Request Service in {activeCity}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Describe your repair or maintenance need. Nearby accredited trade specialists will review your fault and submit transparent quotations.
          </p>
        </div>

        <BookingWizard
          categories={categories}
          preSelectedCategory={resolvedCategoryId}
          preSelectedSubcategoryId={resolvedSubcategoryId}
          preSelectedService={preSelectedService}
          unavailableServiceNotice={unavailableServiceNotice}
          preSelectedPro={preSelectedPro}
          defaultCity={activeCity}
          initialTitle={resolvedTitle}
          initialDescription={description}
          initialUrgency={urgency}
          userEmail={auth.user.email || undefined}
          userName={profile?.full_name}
        />
      </main>
    </div>
  );
}
