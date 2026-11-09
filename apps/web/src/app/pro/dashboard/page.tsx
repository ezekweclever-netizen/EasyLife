import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
  getEligibleJobRequests,
  getProQuotations,
  getProEarningsSummary,
  calculateProfileCompletion,
} from "@/lib/supabase/pro";
import { VerificationBanner } from "@/components/pro/verification-banner";
import { ProfileCompletionMeter } from "@/components/pro/profile-completion-meter";
import { PerformanceStats } from "@/components/pro/performance-stats";
import { QuotationModal } from "@/components/pro/quotation-modal";

export const metadata: Metadata = {
  title: "Professional Dashboard — EasyLife Nigeria",
  description: "Manage service requests, quotations, active jobs, and verification.",
};

export default async function ProDashboardPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/dashboard");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);

  // If user has not created a professional profile yet, show onboarding invitation
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl">
          🛠️
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Complete Your Professional Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          You are signed in, but you haven&apos;t registered your business or technical trade on EasyLife yet.
        </p>
        <div className="mt-6">
          <Link
            href="/pro/register"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-[#0D9488] text-white text-sm font-bold hover:bg-[#0F766E] shadow-sm transition"
          >
            Start Professional Registration →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch real Supabase dashboard data
  const [openRequests, activeJobs, allQuotations, earnings] = await Promise.all([
    getEligibleJobRequests(
      { city: profile.primary_city, proId: profile.id, statusFilter: "open" },
      auth.accessToken
    ),
    getEligibleJobRequests(
      { proId: profile.id, statusFilter: "active" },
      auth.accessToken
    ),
    getProQuotations(profile.id, auth.accessToken),
    getProEarningsSummary(profile.id, auth.accessToken),
  ]);

  const pendingQuotations = allQuotations.filter((q) => q.status === "pending");
  const completion = calculateProfileCompletion(profile);

  // Group appointments from active jobs
  const upcomingAppointments = activeJobs.filter(
    (j) => j.status === "scheduled" || Boolean(j.scheduled_start_at)
  );

  return (
    <div className="space-y-8">
      {/* 1. Welcome & Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Professional Portal • {profile.primary_city}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Welcome, {profile.business_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {profile.headline || `${profile.years_of_experience} years experienced specialist`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pro/jobs"
            className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
          >
            Browse New Requests ({openRequests.length})
          </Link>
          <Link
            href="/pro/profile"
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* 2. Verification Status Alert Banner */}
      <VerificationBanner
        status={profile.verification_status}
        rejectionReason={profile.rejection_reason}
        submittedAt={profile.submitted_for_verification_at}
      />

      {/* 3. Performance Statistics */}
      <PerformanceStats
        rating={Number(profile.average_rating) || 0}
        reviewCount={profile.review_count || 0}
        completedJobsCount={profile.completed_jobs_count || 0}
        activeJobsCount={activeJobs.length}
        responseRatePct={profile.response_rate_pct || 100}
        walletBalanceKobo={earnings.wallet_balance_kobo}
        inEscrowKobo={earnings.in_escrow_kobo}
      />

      {/* 4. Profile Completion Meter */}
      <ProfileCompletionMeter
        percentage={completion.percentage}
        steps={completion.steps}
      />

      {/* 5. Main Dashboard Grids: New Requests & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: New Service Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                New Service Requests
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
                {openRequests.length} Available
              </span>
            </div>
            <Link
              href="/pro/jobs"
              className="text-xs font-semibold text-[#0D9488] hover:underline"
            >
              View all requests →
            </Link>
          </div>

          {openRequests.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white">
              <span className="text-2xl block mb-2">🔍</span>
              <p className="text-xs font-semibold text-slate-700">
                No new open requests in {profile.primary_city} right now.
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                As customers submit repair requests matching your trade categories, they will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {openRequests.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
                        {job.category?.name || "Service Request"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.urgency === "emergency"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.urgency}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {job.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>📍 {job.service_address}</span>
                      {job.preferred_date && (
                        <span>📅 Preferred: {job.preferred_date}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {job.reference_code}
                    </span>
                    <Link
                      href={`/pro/jobs/${job.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
                    >
                      Inspect &amp; Prepare Quote →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Jobs & Appointments */}
        <div className="space-y-6">
          {/* Active Jobs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Active Jobs
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeJobs.length} Ongoing
                </span>
              </div>
              <Link
                href="/pro/jobs?tab=active"
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                Manage jobs →
              </Link>
            </div>

            {activeJobs.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white">
                <span className="text-2xl block mb-2">⚡</span>
                <p className="text-xs font-semibold text-slate-700">
                  No active jobs in progress.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Send quotes to open requests to book confirmed appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        {job.reference_code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          job.status === "in_progress"
                            ? "bg-emerald-100 text-emerald-800 animate-pulse"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {job.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1">
                      📍 {job.service_address}
                    </p>

                    {job.agreed_amount_kobo && (
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        Escrow Value: ₦{(job.agreed_amount_kobo / 100).toLocaleString("en-NG")}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/pro/jobs/${job.id}`}
                        className="text-xs font-semibold text-[#0D9488] hover:underline"
                      >
                        View Full Job &amp; Handover →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Quotations Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Pending Quotations ({pendingQuotations.length})
              </h2>
              <Link
                href="/pro/quotations"
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                All quotations →
              </Link>
            </div>

            {pendingQuotations.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 text-center">
                No quotations currently awaiting customer acceptance.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {pendingQuotations.slice(0, 3).map((q) => (
                  <div key={q.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block font-mono">
                        {q.reference_code}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {q.booking?.title || "Quoted Repair Job"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#0D9488] block">
                        ₦{(q.total_amount_kobo / 100).toLocaleString("en-NG")}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Awaiting Client
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
