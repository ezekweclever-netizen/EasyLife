import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getJobApplicationsForUser } from "@/app/actions/jobs";
import { Icon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "My Job Applications — EasyLife Nigeria",
  description: "Track the status of all your trade job, gig, and apprenticeship applications on EasyLife.",
};

const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  submitted: {
    label: "Submitted",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-teal-50 dark:bg-teal-950/60",
    text: "text-[#0F766E] dark:text-[#5CD3D5]",
  },
  interviewed: {
    label: "Interview Scheduled",
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
  },
  offered: {
    label: "Offer Extended",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    label: "Not Selected",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
  },
};

export default async function JobApplicationsTrackerPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent("/jobs/applications")}`);
  }

  const applications = await getJobApplicationsForUser();

  return (
    <PublicShell>
      <PageHero
        badge="Career & Application Tracker"
        title="My Job & Apprenticeship Applications"
        description="Track the real-time status of your applications submitted to verified employers across Port Harcourt, Lagos, and Abuja."
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Submitted Applications ({applications.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Applications are reviewed directly by verified hiring managers.
            </p>
          </div>
          <ButtonLink href="/jobs" size="sm" variant="secondary">
            Explore More Opportunities &rarr;
          </ButtonLink>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-[#5CD3D5] text-2xl mx-auto flex items-center justify-center">
              💼
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Applications Submitted Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Discover verified trade roles, apprenticeships, and facility technician vacancies across Nigeria.
              </p>
            </div>
            <div className="pt-2">
              <ButtonLink href="/jobs" size="md">
                Browse Open Positions
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const badge =
                STATUS_BADGES[app.status] || STATUS_BADGES.submitted!;
              const vacancy = app.vacancy;

              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          Ref: {app.reference_code}
                        </span>
                        {vacancy?.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-[#5CD3D5]">
                            {vacancy.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {vacancy?.title || "Trade Vacancy"}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {vacancy?.city ? `${vacancy.city}, ${vacancy.state}` : "Nigeria"} • Applied on{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} self-start`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Pitch / Cover Letter Excerpt */}
                  {app.cover_letter && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071526]/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[11px] mb-1">
                        Your Application Pitch:
                      </span>
                      <p className="line-clamp-2 leading-relaxed">
                        {app.cover_letter}
                      </p>
                    </div>
                  )}

                  {/* Employer Notes if Any */}
                  {app.employer_notes && (
                    <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-[#0F766E] dark:text-[#5CD3D5]">
                      <span className="font-bold block text-[11px] mb-0.5">
                        Note from Employer:
                      </span>
                      <p>{app.employer_notes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Contact: {app.applicant_phone}
                    </span>
                    {vacancy && (
                      <Link
                        href={`/jobs/${vacancy.slug || vacancy.id}`}
                        className="font-bold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
                      >
                        View Vacancy Scope &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
