import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessionalById, getServiceCategories } from "@/lib/supabase/customer";
import { PublicShell } from "@/components/site/public-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pro = await getProfessionalById(id);

  if (!pro) {
    return {
      title: "Professional Profile — EasyLife",
    };
  }

  return {
    title: `${pro.business_name || pro.display_name} — EasyLife Verified Professional`,
    description: pro.headline || `Accredited field technician in ${pro.primary_city || "Nigeria"}. Book verified repairs with escrow protection.`,
  };
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pro = await getProfessionalById(id);
  const categories = await getServiceCategories();

  // If not found in database, render verified dispatch alternative
  if (!pro) {
    return (
      <PublicShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FCEBDD] dark:bg-[#2E343B] text-[#E8590C] text-2xl mx-auto flex items-center justify-center font-bold">
            👤
          </div>
          <h1 className="text-2xl font-bold text-[#1F2328] dark:text-white">Professional Profile Not Found</h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
            This professional profile is either not yet publicly active or currently offline. You can still submit an open service request, and our operations desk will assign an accredited technician.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/book"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors"
            >
              Request a Service
            </Link>
            <Link
              href="/services"
              className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] dark:border-[#2E343B] text-[#4A525C] dark:text-slate-200 hover:bg-[#FAF7F3] dark:hover:bg-slate-800"
            >
              Browse Professionals
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  const displayName = pro.display_name || pro.business_name || "EasyLife Professional";
  const initial = displayName[0]?.toUpperCase() || "P";
  const city = pro.primary_city || "Port Harcourt";

  return (
    <PublicShell>
      <div className="bg-[#FAF7F3] dark:bg-[#1F2328] border-b border-[#E6E0D8] dark:border-[#2E343B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#E8590C] text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0">
                {initial}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2328] dark:text-white">
                    {displayName}
                  </h1>
                  {(pro.verification_status === "approved" || pro.verification_status === "verified") && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCEBDD] dark:bg-[#2E343B] text-[#E8590C] border border-[#E6E0D8] dark:border-teal-800"
                      title="Verified Identity, Qualifications & Clean Background Record"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Pro
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-[#475569] dark:text-slate-300">
                  {pro.headline || "Accredited Field Maintenance Specialist"}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-amber-500">
                      {Number(pro.review_count) > 0 && Number(pro.average_rating) > 0
                        ? `★ ${Number(pro.average_rating).toFixed(1)}`
                        : "No reviews yet"}
                    </span>
                    <span>({pro.review_count || 0} reviews)</span>
                  </span>
                  <span>•</span>
                  <span>📍 {city}, {pro.primary_state || "Nigeria"}</span>
                  {typeof pro.response_rate_pct === "number" && pro.response_rate_pct > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">⚡ {pro.response_rate_pct}% response rate</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Booking CTA Card */}
            <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-4 flex sm:flex-col items-center justify-between gap-4 shadow-xs shrink-0 md:w-64">
              <div className="w-full text-left sm:text-center">
                <span className="text-xs text-[#64748B] dark:text-slate-400 block">Starting Callout Fee</span>
                <span className="text-lg font-extrabold text-[#1F2328] dark:text-white">
                  {pro.base_callout_fee_kobo && pro.base_callout_fee_kobo > 0
                    ? `₦${(pro.base_callout_fee_kobo / 100).toLocaleString()}`
                    : "Price on request"}
                </span>
                {pro.hourly_rate_kobo && pro.hourly_rate_kobo > 0 && (
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 block mt-0.5">
                    • ₦{(pro.hourly_rate_kobo / 100).toLocaleString()}/hr
                  </span>
                )}
              </div>
              <Link
                href={`/book?pro=${pro.professional_id}`}
                className="w-full text-center px-5 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] hover:bg-[#C84A06] text-white transition-colors shadow-sm"
              >
                Book This Pro
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED INFORMATION TABS & SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Bio, Experience, Portfolio, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description & Bio */}
            <section className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-3 shadow-xs">
              <h2 className="text-lg font-bold text-[#1F2328] dark:text-white">About This Professional</h2>
              <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {pro.bio ||
                  `${displayName} is an accredited service technician operating across ${city}. Certified in residential and commercial maintenance with background clearance and technical competency vetting.`}
              </p>
            </section>

            {/* Experience & Credentials */}
            <section className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#1F2328] dark:text-white">Experience &amp; Verification</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-xs text-[#64748B] dark:text-slate-400 block">Industry Experience</span>
                  <span className="text-lg font-bold text-[#1F2328] dark:text-white">
                    {pro.years_of_experience ? `${pro.years_of_experience} Years` : "3+ Years"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-xs text-[#64748B] dark:text-slate-400 block">Completed Jobs</span>
                  <span className="text-lg font-bold text-[#1F2328] dark:text-white">
                    {pro.completed_jobs_count || 0} Verified Jobs
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-xs text-[#64748B] dark:text-slate-400 block">Verification Tier</span>
                  <span className="text-sm font-bold text-[#E8590C] flex items-center gap-1">
                    <span>🛡️ Tier 2 Verified</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] space-y-1.5 text-xs text-[#E8590C]">
                <p className="font-bold">Verified Background Credentials:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[#4A525C] dark:text-teal-200">
                  <li>National Identity Number (NIN) verified with NIMC database</li>
                  <li>Residential &amp; workshop address physically inspected</li>
                  <li>Practical technical trade assessment completed</li>
                  <li>Zero unresolved customer disputes on the platform</li>
                </ul>
              </div>
            </section>

            {/* Offered Services Catalogue */}
            <section className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-[#1F2328] dark:text-white">
                  Services Offered ({pro.services?.length || 0})
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Verified service specialisations and indicative baseline call-out / starting estimates
                </p>
              </div>

              {pro.services && pro.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pro.services.map((svc) => {
                    const minNaira = (svc.min_price_kobo || 0) / 100;
                    const maxNaira = svc.max_price_kobo ? svc.max_price_kobo / 100 : null;
                    return (
                      <div
                        key={svc.id}
                        className="p-4 rounded-xl border border-[#E6E0D8] dark:border-slate-800 bg-[#FAF7F3] dark:bg-[#1F2328] flex flex-col justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-[#1F2328] dark:text-white">
                              {svc.service_title || svc.category?.name || "Technical Service"}
                            </h3>
                            {svc.category?.name && (
                              <span className="px-2 py-0.5 rounded bg-[#FCEBDD] dark:bg-[#2E343B] text-[#E8590C] border border-[#E6E0D8] dark:border-teal-800 text-[10px] font-bold shrink-0">
                                {svc.category.name}
                              </span>
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-xs text-[#475569] dark:text-slate-400 leading-relaxed">
                              {svc.description}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-[#E6E0D8] dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[#64748B] dark:text-slate-400">Estimated Base Rate:</span>
                          <span className="font-bold text-[#E8590C]">
                            ₦{minNaira.toLocaleString("en-NG")}
                            {maxNaira ? ` – ₦${maxNaira.toLocaleString("en-NG")}` : "+"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Standard callout diagnostics &amp; custom quotation available upon booking.
                </p>
              )}
            </section>

            {/* Portfolio Samples */}
            <section className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#1F2328] dark:text-white">Work Portfolio &amp; Past Installations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-[#E6E0D8] dark:border-slate-800 rounded-xl overflow-hidden bg-[#FAF7F3] dark:bg-[#1F2328]">
                  <div className="h-32 bg-[#E6E0D8] dark:bg-slate-800 flex items-center justify-center text-3xl">
                    📸
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-[#1F2328] dark:text-white">Inspection &amp; Milestone Photo Proof</p>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Service coverage across {city}, {pro.primary_state || "Nigeria"}</p>
                  </div>
                </div>
                <div className="border border-[#E6E0D8] dark:border-slate-800 rounded-xl overflow-hidden bg-[#FAF7F3] dark:bg-[#1F2328]">
                  <div className="h-32 bg-[#E6E0D8] dark:bg-slate-800 flex items-center justify-center text-3xl">
                    🔧
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-[#1F2328] dark:text-white">Quality-Checked Installations &amp; Repairs</p>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Protected by EasyLife Customer Sign-Off PIN</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer Reviews & Feedback */}
            <section className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1F2328] dark:text-white">Customer Reviews</h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Verified feedback from completed platform bookings</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                  <span>
                    {Number(pro.review_count) > 0 && Number(pro.average_rating) > 0
                      ? `★ ${Number(pro.average_rating).toFixed(1)}`
                      : "No reviews yet"}
                  </span>
                  <span className="text-xs text-[#64748B] dark:text-slate-400">({pro.review_count || 0} reviews)</span>
                </div>
              </div>

              {pro.reviews && pro.reviews.length > 0 ? (
                <div className="space-y-4">
                  {pro.reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="p-4 rounded-xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-amber-500">
                          {"★".repeat(Math.max(1, Math.min(5, rev.rating)))}
                          {"☆".repeat(Math.max(0, 5 - rev.rating))}
                        </span>
                        <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {rev.title && (
                        <h3 className="text-sm font-bold text-[#1F2328] dark:text-white">{rev.title}</h3>
                      )}
                      <p className="text-sm text-[#4A525C] dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                      {rev.professional_response && (
                        <div className="mt-2 p-3 rounded-lg bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-slate-800 text-xs text-[#475569] dark:text-slate-300">
                          <span className="font-bold text-[#E8590C]">Response from {displayName}: </span>
                          {rev.professional_response}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-slate-800 text-center space-y-2">
                  <p className="text-sm font-bold text-[#1F2328] dark:text-white">No public reviews recorded yet</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
                    Be the first customer to book {displayName} through EasyLife and leave a review once the job is completed to your satisfaction.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/book?pro=${pro.professional_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#E8590C] hover:underline"
                    >
                      Book this technician now →
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR: Service Areas, Working Hours, Guarantee */}
          <div className="space-y-6">
            {/* Service Areas */}
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-white uppercase tracking-wider">
                Service Areas Covered
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Available for callout dispatch in {city} &amp; nearby districts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pro.service_areas && pro.service_areas.length > 0 ? (
                  pro.service_areas.map((area) => (
                    <span
                      key={area.id}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF7F3] dark:bg-slate-800 text-[#4A525C] dark:text-slate-200"
                    >
                      📍 {area.lga_or_district} ({area.city})
                    </span>
                  ))
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF7F3] dark:bg-slate-800 text-[#4A525C] dark:text-slate-200">
                    📍 {city}, {pro.primary_state || "Nigeria"}
                  </span>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-white uppercase tracking-wider">
                Working Hours &amp; Availability
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-slate-400">Monday – Friday</span>
                  <span className="font-semibold text-[#1F2328] dark:text-white">8:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-slate-400">Saturday</span>
                  <span className="font-semibold text-[#1F2328] dark:text-white">9:00 AM – 5:00 PM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF7F3] dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-slate-400">Sunday</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Emergency Callout Only</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B] dark:text-slate-400">Emergency 24/7</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Supported</span>
                </div>
              </div>
            </div>

            {/* EasyLife Escrow Guarantee Pill */}
            <div className="bg-[#FCEBDD] dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 space-y-2 text-xs text-[#E8590C]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#E8590C]">
                <span>🛡️ Escrow Protection</span>
              </div>
              <p className="text-[#4A525C] dark:text-teal-200 leading-relaxed">
                Never pay upfront into a technician&apos;s personal bank account. EasyLife holds funds in secure platform escrow until you inspect and approve the completed job.
              </p>
              <div className="pt-2">
                <Link
                  href={`/book?pro=${pro.professional_id}`}
                  className="w-full block text-center py-2.5 rounded-xl font-bold bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-xs"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
