"use client";

import React, { useState } from "react";
import Link from "next/link";
import { submitJobApplicationAction } from "@/app/actions/jobs";
import type { JobVacancyRow } from "@easylife/shared-types";

interface ApplyJobModalProps {
  vacancy: JobVacancyRow;
  currentUser?: {
    id: string;
    email?: string;
    fullName?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyJobModal({
  vacancy,
  currentUser,
  isOpen,
  onClose,
}: ApplyJobModalProps) {
  const [applicantName, setApplicantName] = useState(
    currentUser?.fullName || ""
  );
  const [applicantEmail, setApplicantEmail] = useState(
    currentUser?.email || ""
  );
  const [applicantPhone, setApplicantPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successReference, setSuccessReference] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("vacancyId", vacancy.id);
    formData.append("applicantName", applicantName.trim());
    formData.append("applicantEmail", applicantEmail.trim());
    formData.append("applicantPhone", applicantPhone.trim());
    formData.append("coverLetter", coverLetter.trim());
    if (resumeUrl.trim()) formData.append("resumeUrl", resumeUrl.trim());
    if (portfolioLinks.trim())
      formData.append("portfolioLinks", portfolioLinks.trim());

    try {
      const result = await submitJobApplicationAction(
        { status: "idle", message: "" },
        formData
      );

      if (result.status === "success" && result.referenceCode) {
        setSuccessReference(result.referenceCode);
      } else {
        setSubmissionError(result.message || "Failed to submit application.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] dark:border-[#2E343B] shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E6E0D8] dark:border-[#2E343B] flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#E8590C] uppercase tracking-wider">
              Apply for Position
            </span>
            <h2
              id="modal-title"
              className="text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3] mt-0.5 line-clamp-1"
            >
              {vacancy.title}
            </h2>
            <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-0.5">
              {vacancy.city}, {vacancy.state} • EasyLife Zero Application Fee Guarantee
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successReference ? (
            /* Success State */
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-[#FCEBDD] text-[#E8590C] mx-auto flex items-center justify-center text-3xl border border-[#E8590C]/30">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                  Application Submitted!
                </h3>
                <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] max-w-sm mx-auto">
                  Your details and trade pitch have been delivered directly to the hiring employer.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-left space-y-1">
                <span className="text-[10px] font-bold text-[#4A525C] dark:text-[#C3C8CF] uppercase tracking-wider">
                  Tracking Reference Code
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-[#E8590C]">
                    {successReference}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(successReference)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] hover:bg-white dark:hover:bg-slate-800 text-[#1F2328] dark:text-[#FAF7F3]"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/jobs/applications"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-[#E8590C] text-white hover:bg-[#C84A06] transition"
                >
                  Track My Applications &rarr;
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs border border-[#E6E0D8] dark:border-[#2E343B] text-[#4A525C] dark:text-[#C3C8CF] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {!currentUser && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                  <span>
                    You are not logged in. For your application to be tracked in your candidate dashboard, please{" "}
                    <Link
                      href={`/login?next=${encodeURIComponent(
                        `/jobs/${vacancy.slug || vacancy.id}`
                      )}`}
                      className="font-bold underline text-[#E8590C] hover:text-[#C84A06]"
                    >
                      log in or create an account
                    </Link>
                    .
                  </span>
                </div>
              )}

              {submissionError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                  {submissionError}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Chukwuma Emmanuel"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs sm:text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                />
                {fieldErrors.applicantName && (
                  <p className="text-[11px] text-red-600">{fieldErrors.applicantName}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs sm:text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                  />
                  {fieldErrors.applicantEmail && (
                    <p className="text-[11px] text-red-600">
                      {fieldErrors.applicantEmail}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nigerian Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs sm:text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                  />
                  {fieldErrors.applicantPhone && (
                    <p className="text-[11px] text-red-600">
                      {fieldErrors.applicantPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Cover Letter / Pitch */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Why are you a good fit? <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Min 20 characters</span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Outline your hands-on trade experience, certifications, and why you are interested in this position..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs sm:text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                />
                {fieldErrors.coverLetter && (
                  <p className="text-[11px] text-red-600">{fieldErrors.coverLetter}</p>
                )}
              </div>

              {/* Resume / Portfolio Link */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Resume or LinkedIn / Portfolio Link (Optional)
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or LinkedIn profile"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs sm:text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                />
              </div>

              {/* Safety Notice */}
              <div className="p-3 rounded-xl bg-[#FCEBDD]/60 dark:bg-[#1F2328] border border-[#E8590C]/30 text-[11px] text-[#1F2328] dark:text-[#FAF7F3]">
                🔒 <strong>No Application Fee:</strong> EasyLife strictly prohibits employers from demanding form fees, registration charges, or payments. Applying is 100% free.
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E6E0D8] dark:border-[#2E343B] text-[#4A525C] dark:text-[#C3C8CF] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E8590C] text-white hover:bg-[#C84A06] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>Submit Application &rarr;</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
