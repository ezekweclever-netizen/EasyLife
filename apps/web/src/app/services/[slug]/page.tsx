import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCatalogueServiceBySlugOrId,
  getCustomerProfile,
  getServiceCatalogueTree,
} from "@/lib/supabase/customer";
import { checkCatalogueServiceAvailability } from "@/lib/supabase/catalogue-availability";
import { searchAndMatchProfessionals } from "@/lib/supabase/matching";
import { CustomerHeader } from "@/components/customer/customer-header";
import { PublicShell } from "@/components/site/public-shell";
import { Icon } from "@/components/site/icons";
import {
  formatDurationLabel,
  formatNairaFromKobo,
  formatServicePriceRange,
  resolveCatalogueIcon,
} from "@/lib/catalogue-display";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  national_id_nin: "National ID (NIN)",
  voters_card: "Voter's Card",
  drivers_license: "Driver's Licence",
  international_passport: "International Passport",
  utility_bill_address_proof: "Verified Operating Address",
  trade_certificate: "Accredited Trade Certificate",
  cac_certificate: "CAC Business Registration",
  guarantor_form: "Verified Guarantor Reference",
};

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  individual: "Independent Trade Specialists",
  company: "Registered Technical Firms",
  dispatch_rider: "Verified Dispatch Couriers",
  property_consultant: "Licensed Property Consultants",
  healthcare_provider: "Accredited Healthcare Providers",
  business_vendor: "Verified Commercial Vendors",
};

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCatalogueServiceBySlugOrId(slug);
  if (!service) {
    const availability = await checkCatalogueServiceAvailability(slug);
    if (availability.status === "paused" || availability.status === "unavailable") {
      return {
        title: `${availability.name || "Service"} — ${
          availability.status === "paused" ? "Temporarily Paused" : "Temporarily Unavailable"
        } | EasyLife Nigeria`,
        description:
          availability.reason ||
          "This EasyLife service is temporarily unavailable for booking. Browse active alternative services below.",
        robots: { index: false, follow: true },
      };
    }
    notFound();
  }
  return {
    title: `${service.name} — EasyLife Services Nigeria`,
    description:
      service.short_description ||
      service.description ||
      `Book verified ${service.name} specialists across Port Harcourt, Lagos, and Abuja with escrow protection.`,
  };
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: ServiceDetailPageProps) {
  const { slug } = await params;
  const { city = "All Cities" } = await searchParams;
  const normalizedCity = ["All Cities", "Port Harcourt", "Lagos", "Abuja"].includes(city)
    ? city
    : "All Cities";

  const [auth, service, tree] = await Promise.all([
    getAuthenticatedUser(),
    getCatalogueServiceBySlugOrId(slug),
    getServiceCatalogueTree(false),
  ]);

  if (!service) {
    const availability = await checkCatalogueServiceAvailability(slug);
    if (availability.status !== "paused" && availability.status !== "unavailable") {
      notFound();
    }

    const isPaused = availability.status === "paused";
    const profile = auth
      ? await getCustomerProfile(auth.user.id, auth.accessToken)
      : null;

    const parentCategory =
      tree.find((c) => c.id === availability.categoryId) || null;
    const parentSubcategory =
      parentCategory?.subcategories.find(
        (sub) => sub.id === availability.subcategoryId
      ) || null;

    const activeAlternatives = [
      ...(parentSubcategory?.services || []),
      ...(parentCategory?.direct_services || []),
      ...(parentCategory?.subcategories.flatMap((sub) => sub.services) || []),
    ]
      .filter((item, idx, arr) => item.is_active && arr.findIndex((x) => x.id === item.id) === idx)
      .slice(0, 6);

    const fallbackPopular =
      activeAlternatives.length > 0
        ? activeAlternatives
        : tree
            .flatMap((c) => [
              ...(c.direct_services || []),
              ...c.subcategories.flatMap((sub) => sub.services),
            ])
            .filter((s) => s.is_active)
            .slice(0, 6);

    const unavailableContent = (
      <>
        <section className="bg-[#1F2328] text-white border-b border-[#2E343B]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {availability.serviceCode && (
                <span className="rounded-full bg-[#1F2328] border border-[#2E343B] px-3 py-1 text-xs font-mono font-bold text-[#E8590C]">
                  {availability.serviceCode}
                </span>
              )}
              <span className="rounded-full bg-amber-400/20 border border-amber-300 dark:border-amber-700/40 px-3 py-1 text-xs font-bold text-amber-100">
                {isPaused ? "Temporarily Paused" : "Service Temporarily Unavailable"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {availability.name || "Requested Service"} is{" "}
              {isPaused ? "Temporarily Paused" : "Currently Unavailable"}
            </h1>

            <p className="text-base text-[#FAF7F3] max-w-2xl leading-relaxed">
              {availability.reason ||
                "This service is temporarily paused and not accepting new bookings or quotation requests right now."}{" "}
              Please explore active services below or check back once EasyLife administration resumes this service.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled
                className="rounded-xl bg-white dark:bg-[#1F2328]/15 border border-white/25 px-5 py-3 text-sm font-bold text-white/70 cursor-not-allowed"
              >
                Booking &amp; Quotation Requests Disabled
              </button>
              {parentCategory && (
                <Link
                  href={`/services?cat=${encodeURIComponent(parentCategory.slug)}`}
                  className="rounded-xl bg-[#E8590C] hover:bg-[#C84A06] px-4 py-3 text-sm font-semibold text-white transition-colors"
                >
                  Browse Active {parentCategory.name}
                </Link>
              )}
              <Link
                href="/services"
                className="rounded-xl bg-white dark:bg-[#1F2328]/10 hover:bg-white dark:bg-[#1F2328]/20 border border-white/20 px-4 py-3 text-sm font-semibold text-white transition-colors"
              >
                Full Active Catalogue
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
              {parentCategory
                ? `Active Alternatives in ${parentCategory.name}`
                : "Recommended Active Services"}
            </h2>
            <Link
              href="/services"
              className="text-xs font-bold text-[#E8590C] hover:underline"
            >
              Match Specialists →
            </Link>
          </div>

          {fallbackPopular.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fallbackPopular.map((alt) => (
                <article
                  key={alt.id}
                  className="rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-5 flex flex-col justify-between gap-4 hover:border-[#E8590C] transition-colors"
                >
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#68797C]">
                      {alt.service_code}
                    </span>
                    <Link
                      href={`/services/${alt.slug}`}
                      className="mt-1 block text-base font-bold text-[#1F2328] dark:text-[#FAF7F3] hover:text-[#E8590C]"
                    >
                      {alt.name}
                    </Link>
                    {alt.short_description && (
                      <p className="mt-1.5 text-xs text-[#4A525C] dark:text-[#C3C8CF] line-clamp-2">
                        {alt.short_description}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#FCEBDD] flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1F2328] dark:text-[#FAF7F3]">
                      {formatServicePriceRange(
                        alt.base_price_min_kobo,
                        alt.base_price_max_kobo
                      )}
                    </span>
                    <Link
                      href={`/services/${alt.slug}`}
                      className="text-[#E8590C] hover:underline"
                    >
                      View Service →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 text-sm text-[#4A525C] dark:text-[#C3C8CF]">
              Explore our active{" "}
              <Link href="/services" className="font-bold text-[#E8590C] underline">
                service catalogue
              </Link>{" "}
              or{" "}
              <Link href="/post-a-need" className="font-bold text-[#1F2328] dark:text-[#FAF7F3] underline">
                post a need
              </Link>
              .
            </div>
          )}
        </div>
      </>
    );

    if (auth) {
      return (
        <div className="min-h-screen bg-[#FAF7F3] pb-24 md:pb-12 text-[#1F2328]">
          <CustomerHeader
            user={{
              id: auth.user.id,
              email: auth.user.email,
              fullName: profile?.full_name,
            }}
            selectedCity={
              normalizedCity !== "All Cities"
                ? normalizedCity
                : profile?.city || "Port Harcourt"
            }
          />
          <main>{unavailableContent}</main>
        </div>
      );
    }

    return <PublicShell>{unavailableContent}</PublicShell>;
  }

  const profile = auth
    ? await getCustomerProfile(auth.user.id, auth.accessToken)
    : null;

  // Resolve parent category, subcategory, and sibling related services cleanly
  const parentCategory =
    tree.find((c) => c.id === service.category_id) ||
    tree.find((c) =>
      c.subcategories.some((sub) => sub.services.some((s) => s.id === service.id))
    ) ||
    null;

  const parentSubcategory =
    parentCategory?.subcategories.find(
      (sub) =>
        sub.id === service.subcategory_id ||
        sub.services.some((s) => s.id === service.id)
    ) || null;

  const relatedServices = (
    parentSubcategory?.services ||
    parentCategory?.subcategories.flatMap((s) => s.services) ||
    []
  )
    .filter((s) => s.id !== service.id && s.is_active)
    .slice(0, 4);

  const requirements = (service.requirements || []).filter((r) => Boolean(r));
  const customerRequirements = requirements.filter(
    (r) => r.applies_to === "customer" || r.applies_to === "both"
  );
  const providerRequirements = requirements.filter(
    (r) => r.applies_to === "professional" || r.applies_to === "both"
  );

  const heroImageUrl =
    service.image_url ||
    parentSubcategory?.image_url ||
    parentCategory?.image_url ||
    null;

  const durationText = formatDurationLabel(service.estimated_duration_minutes);
  const bookHref = `/book?category=${encodeURIComponent(
    parentCategory?.id || service.category_id || ""
  )}&service=${encodeURIComponent(service.id)}&title=${encodeURIComponent(service.name)}${
    normalizedCity !== "All Cities" ? `&city=${encodeURIComponent(normalizedCity)}` : ""
  }`;

  const content = (
    <>
      {/* Hero Banner & 3-Tier Breadcrumb */}
      <section className="bg-[#1F2328] text-white border-b border-[#2E343B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
          <nav
            aria-label="Service hierarchy breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-[#FAF7F3]/85"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/services" className="hover:text-white transition-colors">
              All Services
            </Link>
            {parentCategory && (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  href={`/services?cat=${encodeURIComponent(parentCategory.slug)}`}
                  className="hover:text-white transition-colors"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            {parentCategory && parentSubcategory && (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  href={`/services?cat=${encodeURIComponent(parentCategory.slug)}&sub=${encodeURIComponent(parentSubcategory.slug)}`}
                  className="hover:text-white transition-colors"
                >
                  {parentSubcategory.name}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-white font-semibold">{service.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1F2328] border border-[#2E343B] px-3 py-1 text-xs font-mono font-bold text-[#E8590C]">
                  {service.service_code}
                </span>
                {service.is_featured && (
                  <span className="rounded-full bg-white dark:bg-[#1F2328]/15 px-3 py-1 text-xs font-bold text-white">
                    Featured Service
                  </span>
                )}
                {service.is_popular && (
                  <span className="rounded-full bg-[#E8590C]/20 border border-[#E8590C]/40 px-3 py-1 text-xs font-bold text-[#FFD5C7]">
                    High Demand
                  </span>
                )}
                {service.requires_site_inspection && (
                  <span className="rounded-full bg-teal-500/20 border border-teal-300 dark:border-teal-700/30 px-3 py-1 text-xs font-semibold text-teal-100">
                    Site Inspection / Scope Check Supported
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight leading-[1.15]">
                {service.name}
              </h1>

              {(service.short_description || service.description) && (
                <p className="text-base sm:text-lg text-[#FAF7F3] max-w-3xl leading-relaxed">
                  {service.description || service.short_description}
                </p>
              )}

              {Array.isArray(service.keywords) && service.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {service.keywords.slice(0, 8).map((kw) => (
                    <Link
                      key={kw}
                      href={`/services?q=${encodeURIComponent(kw)}`}
                      className="rounded-full bg-white dark:bg-[#1F2328]/10 hover:bg-white dark:bg-[#1F2328]/20 border border-white/15 px-3 py-1 text-xs font-medium text-[#FAF7F3] transition-colors"
                    >
                      #{kw}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Booking & Benchmark Summary Card */}
            <aside className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] p-6 shadow-xl border border-white/60 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-[#FCEBDD] dark:bg-[#2E343B] border border-[#E6E0D8] dark:border-[#2E343B] flex items-center justify-center shrink-0 overflow-hidden">
                  {heroImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroImageUrl}
                      alt={service.name}
                      width={56}
                      height={56}
                      decoding="async"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Icon
                      name={resolveCatalogueIcon(
                        service.icon_name || parentCategory?.icon_name,
                        parentCategory?.slug
                      )}
                      className="h-7 w-7 text-[#1F2328] dark:text-[#FAF7F3]"
                    />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68797C] block">
                    Typical Estimate Benchmark
                  </span>
                  <p className="text-lg font-extrabold text-[#1F2328] dark:text-[#FAF7F3]">
                    {formatServicePriceRange(
                      service.base_price_min_kobo,
                      service.base_price_max_kobo
                    )}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-[#FCEBDD] text-xs">
                <div className="rounded-xl bg-[#FAF7F3] p-3 border border-[#E2E8F0]">
                  <dt className="text-[#68797C] font-medium">Typical Duration</dt>
                  <dd className="mt-0.5 font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    {durationText || "Scoped on inspection"}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#FAF7F3] p-3 border border-[#E2E8F0]">
                  <dt className="text-[#68797C] font-medium">Min. Pro Experience</dt>
                  <dd className="mt-0.5 font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    {service.min_years_experience > 0
                      ? `${service.min_years_experience}+ years`
                      : "Vetted Specialist"}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2.5 pt-1">
                <Link
                  href={bookHref}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#E8590C] hover:bg-[#C84A06] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-colors"
                >
                  Book This Service →
                </Link>
                {parentCategory && (
                  <Link
                    href={`/services?cat=${encodeURIComponent(parentCategory.slug)}${
                      parentSubcategory
                        ? `&sub=${encodeURIComponent(parentSubcategory.slug)}`
                        : ""
                    }&service=${encodeURIComponent(service.slug)}`}
                    className="w-full inline-flex items-center justify-center rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] hover:bg-[#FCEBDD] dark:bg-[#2E343B] px-4 py-2.5 text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] transition-colors"
                  >
                    Filter Matching Pros in Directory
                  </Link>
                )}
              </div>

              <p className="text-[11px] text-[#68797C] leading-relaxed">
                Final pricing is agreed via an itemised quotation after technician review. Funds stay protected in EasyLife escrow until job sign-off.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Service-Specific Requirements & Provider Verification Criteria */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Scope / Preparation Checklist */}
          <div className="rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-[#FCEBDD] dark:bg-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] flex items-center justify-center">
                <Icon name="clipboard" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                  Customer Information &amp; Preparation
                </h2>
                <p className="text-xs text-[#68797C]">
                  Details that help technicians deliver an accurate itemised quotation
                </p>
              </div>
            </div>

            {customerRequirements.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF7F3] border border-[#E2E8F0] p-4 text-sm text-[#4A525C] dark:text-[#C3C8CF]">
                Share photos of the fault area, location access details, and your preferred date when submitting your booking request.
              </div>
            ) : (
              <ul className="space-y-3">
                {customerRequirements.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-2xl bg-[#F8FBFB] border border-[#E6E0D8] dark:border-[#2E343B] p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                        {req.title}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          req.is_required
                            ? "bg-[#E8590C] text-white"
                            : "bg-slate-200 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {req.is_required ? "Required" : "Recommended"}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
                        {req.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Provider Verification & Qualification Requirements */}
          <div className="rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-[#FCEBDD] dark:bg-[#2E343B] text-[#E8590C] flex items-center justify-center">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                  Provider Qualification &amp; Verification Standards
                </h2>
                <p className="text-xs text-[#68797C]">
                  Eligibility checks enforced before specialists can quote this service
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {service.requires_verified_identity && (
                <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  ✓ Verified Govt ID Required
                </span>
              )}
              {service.requires_trade_certification && (
                <span className="rounded-xl bg-[#FCEBDD] dark:bg-[#2E343B] border border-[#E8590C]/30 px-3 py-1.5 text-xs font-semibold text-[#E8590C]">
                  ✓ Trade Certification Required
                </span>
              )}
              {service.requires_business_registration && (
                <span className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-800">
                  ✓ CAC Business Registration Required
                </span>
              )}
              {service.min_years_experience > 0 && (
                <span className="rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#2E343B] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Minimum {service.min_years_experience} Years Experience
                </span>
              )}
            </div>

            {Array.isArray(service.eligible_provider_types) &&
              service.eligible_provider_types.length > 0 && (
                <div className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                  <span className="font-bold text-[#1F2328] dark:text-[#FAF7F3]">Eligible Providers: </span>
                  {service.eligible_provider_types
                    .map((t) => PROVIDER_TYPE_LABELS[t] || t)
                    .join(" • ")}
                </div>
              )}

            {Array.isArray(service.required_document_types) &&
              service.required_document_types.length > 0 && (
                <div className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
                  <span className="font-bold text-[#1F2328] dark:text-[#FAF7F3]">Verified Documents Checked: </span>
                  {service.required_document_types
                    .map((d) => DOCUMENT_TYPE_LABELS[d] || d)
                    .join(", ")}
                </div>
              )}

            {providerRequirements.length > 0 && (
              <ul className="space-y-2 pt-1">
                {providerRequirements.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-xl bg-[#FAF7F3] border border-[#E2E8F0] p-3 text-xs"
                  >
                    <p className="font-bold text-[#1F2328] dark:text-[#FAF7F3]">{req.title}</p>
                    {req.description && (
                      <p className="text-[#4A525C] dark:text-[#C3C8CF] mt-0.5">{req.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Matched Verified Specialists for This Service (streamed inside Suspense so 404 returns before flush) */}
        <Suspense fallback={<MatchedSpecialistsSkeleton />}>
          <MatchedSpecialistsSection
            serviceId={service.id}
            serviceSlug={service.slug}
            serviceName={service.name}
            parentCategoryName={parentCategory?.name}
            normalizedCity={normalizedCity}
            bookHref={bookHref}
          />
        </Suspense>

        {/* Related Services in Same Subcategory / Category */}
        {relatedServices.length > 0 && (
          <section className="pt-8 border-t border-[#E6E0D8] dark:border-[#2E343B] space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                Related Services in {parentSubcategory?.name || parentCategory?.name}
              </h2>
              <Link
                href="/services"
                className="text-xs font-bold text-[#E8590C] hover:underline"
              >
                Full Catalogue →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/services/${rel.slug}`}
                  className="rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-4 hover:border-[#E8590C] transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#68797C]">
                      {rel.service_code}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                      {rel.name}
                    </h3>
                    {rel.short_description && (
                      <p className="mt-1 text-xs text-[#4A525C] dark:text-[#C3C8CF] line-clamp-2">
                        {rel.short_description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#E8590C]">
                    {formatServicePriceRange(
                      rel.base_price_min_kobo,
                      rel.base_price_max_kobo
                    )}{" "}
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );

  if (auth) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] pb-24 md:pb-12 text-[#1F2328]">
        <CustomerHeader
          user={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: profile?.full_name,
          }}
          selectedCity={
            normalizedCity !== "All Cities"
              ? normalizedCity
              : profile?.city || "Port Harcourt"
          }
        />
        <main>{content}</main>
      </div>
    );
  }

  return <PublicShell>{content}</PublicShell>;
}

function MatchedSpecialistsSkeleton() {
  return (
    <section className="space-y-5 animate-pulse" aria-label="Loading matched specialists">
      <div className="h-7 w-72 rounded bg-slate-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]" />
        ))}
      </div>
    </section>
  );
}

async function MatchedSpecialistsSection({
  serviceId,
  serviceSlug,
  serviceName,
  parentCategoryName,
  normalizedCity,
  bookHref,
}: {
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  parentCategoryName?: string;
  normalizedCity: string;
  bookHref: string;
}) {
  const matchedPros = await searchAndMatchProfessionals({
    serviceId,
    city: normalizedCity === "All Cities" ? undefined : normalizedCity,
    limit: 12,
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
            Matched Verified Specialists ({matchedPros.length})
          </h2>
          <p className="text-sm text-[#4A525C] dark:text-[#C3C8CF] mt-1">
            Accredited technicians offering {serviceName}
            {normalizedCity !== "All Cities" ? ` in ${normalizedCity}` : " across Port Harcourt, Lagos, and Abuja"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["All Cities", "Port Harcourt", "Lagos", "Abuja"].map((hub) => {
            const active = normalizedCity === hub;
            return (
              <Link
                key={hub}
                href={
                  hub === "All Cities"
                    ? `/services/${serviceSlug}`
                    : `/services/${serviceSlug}?city=${encodeURIComponent(hub)}`
                }
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[#E8590C] text-white"
                    : "bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] hover:border-[#E8590C]"
                }`}
              >
                {hub}
              </Link>
            );
          })}
        </div>
      </div>

      {matchedPros.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#1F2328] border border-dashed border-[#CBD5E1] p-10 text-center max-w-2xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3]">
            No specialist profile currently listed directly for {serviceName}
            {normalizedCity !== "All Cities" ? ` in ${normalizedCity}` : ""}
          </h3>
          <p className="text-sm text-[#4A525C] dark:text-[#C3C8CF]">
            Submit a request with your job description and our verified technicians in{" "}
            {parentCategoryName || "this trade"} will respond with itemised quotes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={bookHref}
              className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C84A06]"
            >
              Request {serviceName} →
            </Link>
            {normalizedCity !== "All Cities" && (
              <Link
                href={`/services/${serviceSlug}`}
                className="rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] px-4 py-2.5 text-sm font-semibold text-[#1F2328] dark:text-[#FAF7F3]"
              >
                Check All Cities
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matchedPros.map((pro) => (
            <article
              key={pro.professional_id}
              className="rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs hover:border-[#E8590C] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#E8590C] text-white font-extrabold flex items-center justify-center shrink-0 overflow-hidden">
                    {pro.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pro.avatar_url}
                        alt={pro.business_name}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      pro.business_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] truncate">
                        {pro.business_name}
                      </h3>
                      {pro.is_verified && (
                        <span
                          className="text-[#E8590C] text-xs font-bold shrink-0"
                          title="Verified Professional"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#68797C] truncate">
                      {pro.headline || `${pro.years_of_experience} years experience`}
                    </p>
                    <p className="text-xs font-semibold text-amber-600 mt-0.5">
                      {Number(pro.review_count) > 0 && Number(pro.average_rating) > 0
                        ? `★ ${Number(pro.average_rating).toFixed(1)}`
                        : "No reviews yet"}{" "}
                      <span className="text-[#68797C] font-normal">
                        ({pro.review_count} reviews • {pro.completed_jobs_count} jobs)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-md bg-[#FCEBDD] dark:bg-[#2E343B] px-2 py-0.5 font-semibold text-[#1F2328] dark:text-[#FAF7F3]">
                    {pro.primary_city}
                  </span>
                  {pro.service_title && (
                    <span className="rounded-md bg-[#FCEBDD] dark:bg-[#2E343B] border border-[#E8590C]/30 px-2 py-0.5 font-medium text-[#E8590C] truncate max-w-[190px]">
                      {pro.service_title}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#FCEBDD] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#68797C] block">
                    Call-out Benchmark
                  </span>
                  <span className="text-sm font-extrabold text-[#1F2328] dark:text-[#FAF7F3]">
                    {pro.base_callout_fee_kobo > 0
                      ? formatNairaFromKobo(pro.base_callout_fee_kobo)
                      : "Price available on request"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Link
                    href={`/professionals/${pro.professional_id}`}
                    className="rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] px-3 py-1.5 text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:bg-[#1F2328]"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`${bookHref}&pro=${encodeURIComponent(pro.professional_id)}`}
                    className="rounded-lg bg-[#E8590C] px-3.5 py-1.5 text-white hover:bg-[#C84A06]"
                  >
                    Book Pro
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
