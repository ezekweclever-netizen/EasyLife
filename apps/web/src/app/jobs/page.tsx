import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/site/icons";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import type { JobVacancyRow } from "@easylife/shared-types";

export const metadata: Metadata = {
  title: "Jobs & Opportunities — Skilled Trades, Gigs & Employment | EasyLife Nigeria",
  description:
    "Discover verified trade vacancies, technician roles, freelance gigs, and vocational apprenticeships in Port Harcourt, Lagos, and Abuja. No application fees.",
};

interface JobsPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    category?: string;
    type?: string;
  }>;
}

const PILOT_CITIES = [
  { id: "All", label: "All Cities" },
  { id: "Port Harcourt", label: "Port Harcourt" },
  { id: "Lagos", label: "Lagos" },
  { id: "Abuja", label: "Abuja" },
];

const TRADE_CATEGORIES = [
  { id: "All", label: "All Categories" },
  { id: "Electrical & Solar", label: "Electrical & Solar" },
  { id: "AC & Refrigeration", label: "AC & Refrigeration" },
  { id: "Generator & Mechanical", label: "Generator & Mechanical" },
  { id: "Plumbing & Water", label: "Plumbing & Water" },
  { id: "Skilled Trades", label: "Skilled Trades" },
  { id: "Apprenticeship & Vocational", label: "Apprenticeships" },
  { id: "Facility Maintenance", label: "Facility Maintenance" },
];

const EMPLOYMENT_TYPES = [
  { id: "All", label: "All Types" },
  { id: "full_time", label: "Full Time" },
  { id: "contract", label: "Contract" },
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "freelance", label: "Gig / Freelance" },
  { id: "part_time", label: "Part Time" },
];

const FALLBACK_OPPORTUNITIES: Array<Partial<JobVacancyRow> & { company_name?: string }> = [
  {
    id: "sample-job-1",
    slug: "senior-solar-inverter-battery-technician-ph",
    title: "Senior Solar Inverter & Battery Storage Technician",
    category: "Electrical & Solar",
    employment_type: "full_time",
    workplace_type: "on_site",
    city: "Port Harcourt",
    state: "Rivers State",
    min_salary_kobo: 22000000,
    max_salary_kobo: 30000000,
    salary_period: "month",
    description: "Experienced solar installer required for residential and commercial multi-battery inverter installations across Old GRA and Peter Odili areas.",
    requirements: "3+ years hands-on inverter wiring, lithium battery configuration, and clean electrical safety track record.",
    company_name: "Apex Solar Energy Ltd",
    positions_available: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-job-2",
    slug: "commercial-hvac-maintenance-specialist-lagos",
    title: "Commercial AC & HVAC Maintenance Specialist",
    category: "AC & Refrigeration",
    employment_type: "contract",
    workplace_type: "on_site",
    city: "Lagos",
    state: "Lagos State",
    min_salary_kobo: 25000000,
    max_salary_kobo: 35000000,
    salary_period: "month",
    description: "Seeking trade-certified HVAC technician to conduct quarterly scheduled multi-split and chiller maintenance for commercial office plazas in Victoria Island.",
    requirements: "Valid trade certification, deep chemical cleaning expertise, and diagnostic tools for R410A/R32 refrigerants.",
    company_name: "Prime Facility Works",
    positions_available: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-job-3",
    slug: "heavy-duty-diesel-generator-engineer-abuja",
    title: "Heavy Diesel Generator Overhaul Engineer",
    category: "Generator & Mechanical",
    employment_type: "full_time",
    workplace_type: "on_site",
    city: "Abuja",
    state: "Federal Capital Territory",
    min_salary_kobo: 28000000,
    max_salary_kobo: 38000000,
    salary_period: "month",
    description: "Responsible for preventive maintenance, emergency overhauls, and injector servicing on 50kVA - 500kVA backup diesel generators in Maitama & Wuse 2.",
    requirements: "5+ years mechanical experience on diesel engines, ATS switchgear knowledge, and diagnostic capability.",
    company_name: "Capital Energy Support",
    positions_available: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-job-4",
    slug: "vocational-plumbing-apprentice-ph",
    title: "Vocational Apprentice: PPR Pipefitting & Sanitary Plumbing",
    category: "Apprenticeship & Vocational",
    employment_type: "apprenticeship",
    workplace_type: "on_site",
    city: "Port Harcourt",
    state: "Rivers State",
    min_salary_kobo: 8000000,
    max_salary_kobo: 12000000,
    salary_period: "month",
    description: "Paid vocational apprenticeship opportunity under a master licensed plumber. Learn PPR pipe fusion, water heater installation, and modern sanitary fitting.",
    requirements: "Minimum SSCE, high mechanical curiosity, punctuality, and willingness to learn with daily transport stipend.",
    company_name: "Rivers Master Trades Guild",
    positions_available: 4,
    created_at: new Date().toISOString(),
  },
];

export default async function JobsOpportunitiesPage({
  searchParams,
}: JobsPageProps) {
  const { q = "", city = "All", category = "All", type = "All" } =
    await searchParams;

  // Query live approved vacancies from Supabase
  let vacancies: Array<JobVacancyRow & { company_name?: string }> = [];
  try {
    let queryPath =
      "/rest/v1/job_vacancies?select=*,business:businesses(id,name,slug),employer:employer_profiles(id,company_name,slug)&status=eq.open&moderation_status=eq.approved&order=created_at.desc&limit=30";

    if (city !== "All") {
      queryPath += `&city=ilike.*${encodeURIComponent(city)}*`;
    }
    if (category !== "All") {
      queryPath += `&category=ilike.*${encodeURIComponent(category)}*`;
    }
    if (type !== "All") {
      queryPath += `&employment_type=eq.${encodeURIComponent(
        type.toLowerCase().replace(/[\s-]/g, "_")
      )}`;
    }
    if (q.trim()) {
      const qClean = encodeURIComponent(q.trim());
      queryPath += `&or=(title.ilike.*${qClean}*,description.ilike.*${qClean}*,requirements.ilike.*${qClean}*)`;
    }

    const res = await supabaseAdminFetch<
      Array<
        JobVacancyRow & {
          company_name?: string;
          business?: { id: string; name: string; slug: string } | null;
          employer?: { id: string; company_name: string; slug: string } | null;
        }
      >
    >(queryPath);

    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      vacancies = res.data.map((item) => ({
        ...item,
        company_name:
          item.employer?.company_name ||
          item.business?.name ||
          item.company_name ||
          "Verified EasyLife Partner Employer",
      }));
    }
  } catch (err) {
    console.warn("Could not fetch vacancies from DB, using fallback list:", err);
  }

  // Filter fallback if DB is not populated for specific filter
  let displayList: Array<Partial<JobVacancyRow> & { company_name?: string }> =
    vacancies.length > 0 ? vacancies : FALLBACK_OPPORTUNITIES;

  if (vacancies.length === 0) {
    if (city !== "All") {
      displayList = displayList.filter(
        (j) => j.city?.toLowerCase() === city.toLowerCase()
      );
    }
    if (category !== "All") {
      displayList = displayList.filter(
        (j) => j.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (type !== "All") {
      displayList = displayList.filter((j) => j.employment_type === type);
    }
    if (q.trim()) {
      const qLow = q.toLowerCase();
      displayList = displayList.filter(
        (j) =>
          j.title?.toLowerCase().includes(qLow) ||
          j.description?.toLowerCase().includes(qLow) ||
          j.requirements?.toLowerCase().includes(qLow)
      );
    }
  }

  return (
    <PublicShell>
      <section className="relative w-full overflow-hidden bg-[#071E28] text-white border-b border-[#24989A]/20">
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero-jobs.jpg"
            alt="Young professional celebrating job offer with skilled trade team in background"
            fill
            priority
            sizes="100vw"
            quality={92}
            className="object-cover object-[45%_12%] sm:object-[50%_15%] md:object-[55%_18%] lg:object-[60%_20%]"
          />
          {/* Base ambient darkening */}
          <div className="absolute inset-0 bg-[#051726]/20" />
          {/* Directional gradient: deep opacity focused strictly on left text column, clearing early to reveal smiling professional and workshop team */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020B13]/95 via-[#031320]/85 via-28% md:to-transparent to-[#041726]/30" />
          {/* Mobile vertical gradient reinforcement for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020B13]/95 via-[#041726]/75 to-[#020B13]/50 sm:hidden" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-xl lg:max-w-lg">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#EE9277] drop-shadow-xs">
              Jobs &amp; Vocational Opportunities
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight leading-[1.14] text-white drop-shadow-sm">
              Find Meaningful Work, Trade Gigs &amp; Apprenticeships
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#E1EEF0] leading-relaxed drop-shadow-xs">
              Connect directly with verified local businesses, trade contractors, and facility managers across Port Harcourt, Lagos, and Abuja. 100% free with zero application fees.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Top Control Bar: Search & Action CTAs */}
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-5 sm:p-7 shadow-sm space-y-5">
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search trade, role, or skill..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#071526]/50 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-[#0D9488]"
              />
            </div>

            {/* City Selector */}
            <select
              name="city"
              defaultValue={city}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#071526]/50 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-[#0D9488]"
            >
              {PILOT_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Category Selector */}
            <select
              name="category"
              defaultValue={category}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#071526]/50 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-[#0D9488]"
            >
              {TRADE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Filter Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Icon name="search" className="w-4 h-4" />
              <span>Filter Roles</span>
            </button>
          </form>

          {/* Quick Filter Type Pills & Quick Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {EMPLOYMENT_TYPES.map((t) => {
                const isSelected = type === t.id;
                const searchParamsObj = new URLSearchParams();
                if (q) searchParamsObj.set("q", q);
                if (city !== "All") searchParamsObj.set("city", city);
                if (category !== "All") searchParamsObj.set("category", category);
                if (t.id !== "All") searchParamsObj.set("type", t.id);

                return (
                  <Link
                    key={t.id}
                    href={`/jobs?${searchParamsObj.toString()}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#0F766E] text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>

            {/* Employer / Applicant Navigation */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Link
                href="/jobs/applications"
                className="text-xs font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline whitespace-nowrap"
              >
                Track My Applications &rarr;
              </Link>
              <ButtonLink
                href="/jobs/post"
                size="sm"
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <Icon name="briefcase" className="w-3.5 h-3.5" />
                <span>Post a Vacancy</span>
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Opportunity Listings Grid */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Available Opportunities ({displayList.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified openings across Port Harcourt, Lagos, and Abuja
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              ✓ Verified Employer Postings
            </span>
          </div>

          {displayList.length === 0 ? (
            <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-2xl mx-auto flex items-center justify-center">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No vacancies matched your filters
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Try broadening your search keywords or switching between Port Harcourt, Lagos, and Abuja.
                </p>
              </div>
              <div className="pt-2">
                <ButtonLink href="/jobs" size="sm" variant="secondary">
                  Reset All Filters
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {displayList.map((job) => {
                const minKobo = job.min_salary_kobo ?? 0;
                const maxKobo = job.max_salary_kobo ?? 0;
                const salaryFormatted =
                  minKobo > 0 && maxKobo > 0
                    ? `₦${(minKobo / 100).toLocaleString()} – ₦${(
                        maxKobo / 100
                      ).toLocaleString()}`
                    : minKobo > 0
                    ? `From ₦${(minKobo / 100).toLocaleString()}`
                    : "Negotiable";

                const detailHref = `/jobs/${job.slug || job.id}`;

                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider mb-1">
                            {job.category || "Skilled Trade"}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                            <Link
                              href={detailHref}
                              className="hover:text-[#0F766E] dark:hover:text-[#5CD3D5] transition-colors"
                            >
                              {job.title}
                            </Link>
                          </h3>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                            {job.company_name || "Verified EasyLife Partner Employer"}
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize shrink-0">
                          {(job.employment_type || "Full Time").replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {job.requirements && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#071526]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <strong className="text-slate-800 dark:text-slate-200">
                            Key Requirement:{" "}
                          </strong>
                          {job.requirements}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Compensation ({job.salary_period || "month"})
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {salaryFormatted}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1">
                          <Icon name="map-pin" className="w-3.5 h-3.5 text-[#0D9488]" />
                          <span>{job.city}</span>
                        </span>
                        <ButtonLink
                          href={detailHref}
                          size="sm"
                          className="text-xs font-bold"
                        >
                          View &amp; Apply &rarr;
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Employer Callout Banner */}
        <div className="rounded-3xl border border-slate-200 dark:border-[#163654] bg-linear-to-r from-teal-50 to-slate-50 dark:from-[#0D223A] dark:to-[#071526] p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Hiring skilled technicians, apprentices, or maintenance staff?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Post your job vacancies directly to thousands of verified professionals, artisans, and vocational trainees across Port Harcourt, Lagos, and Abuja.
            </p>
          </div>
          <ButtonLink
            href="/jobs/post"
            size="md"
            className="shrink-0 font-bold"
          >
            Post a Vacancy Now &rarr;
          </ButtonLink>
        </div>
      </section>
    </PublicShell>
  );
}
