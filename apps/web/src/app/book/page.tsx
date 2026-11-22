import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
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
    | { name: string; reason: string; categorySlug?: string; status: "paused" | "inactive" | "unavailable" }
    | null = null;
  let blockedForBooking = false;

  if (service && !preSelectedService) {
    const availability = await checkCatalogueServiceAvailability(service);
    if (
      availability.status === "paused" ||
      availability.status === "inactive" ||
      availability.status === "unavailable"
    ) {
      blockedForBooking = true;
      unavailableServiceNotice = {
        name: availability.name || service,
        status: availability.status,
        reason:
          availability.reason ||
          (availability.status === "paused"
            ? "This service is temporarily paused and not accepting new bookings or quotation requests."
            : "This service is currently inactive and unavailable for booking."),
        categorySlug: availability.categorySlug,
      };
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
    undefined;

  const resolvedSubcategoryId =
    preSelectedService?.subcategory_id ||
    (matchedCategory?.parent_id ? matchedCategory.id : undefined);

  const resolvedTitle = title || preSelectedService?.name || undefined;
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
        {blockedForBooking && unavailableServiceNotice ? (
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-amber-200 dark:border-amber-800 shadow-xs p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {unavailableServiceNotice.status === "paused"
                ? "Service Temporarily Paused"
                : "Service Unavailable"}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {unavailableServiceNotice.name} Cannot Be Booked Right Now
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {unavailableServiceNotice.reason}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link
                href="/explore-services"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition"
              >
                Browse Active Services
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526] text-slate-700 dark:text-slate-200 text-sm font-bold transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
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
              unavailableServiceNotice={null}
              preSelectedPro={preSelectedPro}
              defaultCity={activeCity}
              initialTitle={resolvedTitle}
              initialDescription={description}
              initialUrgency={urgency}
              userEmail={auth.user.email || undefined}
              userName={profile?.full_name}
            />
          </>
        )}
      </main>
    </div>
  );
}
