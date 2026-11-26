"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/site/icons";
import { ApplyJobModal } from "./apply-job-modal";
import type { JobVacancyRow } from "@easylife/shared-types";

interface JobDetailClientProps {
  vacancy: JobVacancyRow;
  currentUser?: {
    id: string;
    email?: string;
    fullName?: string;
  } | null;
}

export function JobDetailClient({ vacancy, currentUser }: JobDetailClientProps) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const minKobo = vacancy.min_salary_kobo ?? 0;
  const maxKobo = vacancy.max_salary_kobo ?? 0;
  const salaryFormatted =
    minKobo > 0 && maxKobo > 0
      ? `₦${(minKobo / 100).toLocaleString()} – ₦${(maxKobo / 100).toLocaleString()}`
      : minKobo > 0
      ? `From ₦${(minKobo / 100).toLocaleString()}`
      : "Negotiable";

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/jobs"
          className="text-xs font-semibold text-[#0D9488] dark:text-[#5CD3D5] hover:underline inline-flex items-center gap-1"
        >
          <span>&larr; Back to All Jobs &amp; Opportunities</span>
        </Link>
      </div>

      {/* Main Job Card */}
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 sm:p-10 shadow-xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                {vacancy.category}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                {(vacancy.employment_type || "Full Time").replace("_", " ")}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 capitalize">
                {(vacancy.workplace_type || "On Site").replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {vacancy.title}
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              Hiring Organization:{" "}
              <span className="text-[#0F766E] dark:text-[#5CD3D5] font-bold">
                {(vacancy as any).company_name || "Verified EasyLife Partner Employer"}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Icon name="map-pin" className="w-4 h-4 text-[#0D9488]" />
                <span>
                  {vacancy.city}, {vacancy.state}
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Icon name="briefcase" className="w-4 h-4 text-slate-400" />
                <span>
                  {vacancy.positions_available}{" "}
                  {vacancy.positions_available === 1 ? "opening" : "openings"}
                </span>
              </span>
              {vacancy.application_deadline && (
                <>
                  <span>•</span>
                  <span>
                    Deadline:{" "}
                    {new Date(vacancy.application_deadline).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Primary Apply CTA */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <div className="text-left md:text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Compensation ({vacancy.salary_period || "month"})
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {salaryFormatted}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apply for This Role</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
          {/* Role Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Role Overview
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {vacancy.description}
            </p>
          </div>

          {/* Key Responsibilities */}
          {vacancy.responsibilities && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Key Responsibilities
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-[#071526]/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {vacancy.responsibilities}
              </div>
            </div>
          )}

          {/* Requirements & Certifications */}
          {vacancy.requirements && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Requirements &amp; Trade Qualifications
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-[#071526]/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {vacancy.requirements}
              </div>
            </div>
          )}

          {/* Benefits List */}
          {vacancy.benefits && vacancy.benefits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Benefits &amp; Support
              </h2>
              <div className="flex flex-wrap gap-2">
                {vacancy.benefits.map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-[#5CD3D5] text-xs font-semibold border border-teal-200/80 dark:border-teal-900"
                  >
                    <span>✓</span>
                    <span>{benefit}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Physical Address */}
          {vacancy.address && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Operating Location / Work Site
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                {vacancy.address}
              </p>
            </div>
          )}
        </div>

        {/* Safety & Anti-Scam Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-sm">
            <span>🛡️ EasyLife Zero-Fee Application Guarantee</span>
          </p>
          <p className="leading-relaxed">
            EasyLife strictly forbids employers from charging job seekers for application forms, registration, interviews, or medical checks. Never pay money to anyone for a job opportunity. If asked for money, report the posting immediately to support@easylife.ng.
          </p>
        </div>

        {/* Bottom Apply CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Interested in this trade opportunity?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct application submitted with zero agency fees.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Apply for This Role</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Application Modal */}
      <ApplyJobModal
        vacancy={vacancy}
        currentUser={currentUser}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
}
