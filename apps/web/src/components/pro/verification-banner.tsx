"use client";

import React from "react";
import Link from "next/link";
import { ProfessionalVerificationStatus } from "@/lib/supabase/pro";

interface VerificationBannerProps {
  status: ProfessionalVerificationStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
}

export function VerificationBanner({
  status,
  rejectionReason,
  submittedAt,
}: VerificationBannerProps) {
  if (status === "approved") {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60/70 p-4 sm:p-5 text-emerald-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-300 font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              Verified EasyLife Professional
            </h3>
            <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
              Your identity and trade credentials have been verified by EasyLife Operations. You are fully eligible to send quotes, accept service requests, and receive guaranteed escrow payouts.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-xs">
            <span>Official Vetting Badge Active</span>
          </span>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60/80 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-100 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 font-bold">
            ⏳
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Verification Documents Under Review
            </h3>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              Your identity credentials and qualifications are currently being reviewed by our vetting desk in Port Harcourt/Lagos/Abuja. Applications are typically processed within 24–48 hours.
            </p>
            {submittedAt && (
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                Submitted on {new Date(submittedAt).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Link
            href="/pro/profile#documents"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-amber-400 bg-white dark:bg-[#1F2328] text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
          >
            View Uploaded Documents
          </Link>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/60 p-4 sm:p-5 text-red-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-red-700 dark:text-red-400 font-bold">
            !
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">
              Verification Requires Correction
            </h3>
            <p className="mt-0.5 text-xs text-red-800 dark:text-red-300">
              {rejectionReason || "Your uploaded documents could not be verified by our compliance team. Please review the requirements and re-submit a clearer copy."}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Link
            href="/pro/profile#documents"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-xs"
          >
            Re-submit Documents
          </Link>
        </div>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="rounded-xl border border-red-400 bg-red-50 dark:bg-red-950/60 p-4 sm:p-5 text-red-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-red-200 border border-red-400 flex items-center justify-center shrink-0 text-red-800 dark:text-red-300 font-bold">
            ✕
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">
              Account Suspended by Platform Administration
            </h3>
            <p className="mt-0.5 text-xs text-red-800 dark:text-red-300">
              Your professional privileges have been temporarily suspended. Please contact EasyLife support or the local operations desk to resolve any outstanding queries.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Link
            href="/contact"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-[#1F2328] text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Contact Support Desk
          </Link>
        </div>
      </div>
    );
  }

  // Default: unsubmitted / unverified
  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-teal-50/40 p-4 sm:p-5 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-full bg-teal-100 border border-teal-300 dark:border-teal-700 flex items-center justify-center shrink-0 text-[#E8590C] font-bold">
          🛡️
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Account Status: Unverified
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            EasyLife requires all technicians, artisans, and contractors to submit government identity (NIN / Voter&apos;s Card) and trade proof before sending quotations or receiving jobs. This protects customers and gives you access to premium bookings.
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <Link
          href="/pro/profile#documents"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] transition shadow-xs"
        >
          Submit Verification Documents →
        </Link>
      </div>
    </div>
  );
}
