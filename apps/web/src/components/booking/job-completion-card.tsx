"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  customerConfirmCompletionAction,
  customerReportIncompleteWorkAction,
} from "@/app/actions/completion";

interface JobCompletionCardProps {
  bookingId: string;
  referenceCode: string;
  bookingStatus: string;
  proName?: string;
  proNotes?: string | null;
  proMarkedCompleteAt?: string | null;
  reworkNotes?: string | null;
  reworkCount?: number;
  onOpenDispute: () => void;
  onOpenReview: () => void;
  hasReview?: boolean;
}

export function JobCompletionCard({
  bookingId,
  referenceCode,
  bookingStatus,
  proName = "Specialist",
  proNotes,
  proMarkedCompleteAt,
  reworkNotes,
  reworkCount = 0,
  onOpenDispute,
  onOpenReview,
  hasReview = false,
}: JobCompletionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Rework report modal
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reworkPhotoInput, setReworkPhotoInput] = useState("");
  const [reworkPhotos, setReworkPhotos] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleConfirmCompletion = () => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await customerConfirmCompletionAction(bookingId);
      if (res.ok) {
        setActionSuccess(res.message);
        router.refresh();
      } else {
        setActionError(res.message);
      }
    });
  };

  const handleReportIncompleteWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reworkReason.trim()) {
      setActionError("Please describe what tasks were left unfinished.");
      return;
    }

    setActionError(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("reason", reworkReason);
    for (const photo of reworkPhotos) {
      formData.append("photos", photo);
    }

    startTransition(async () => {
      const res = await customerReportIncompleteWorkAction(formData);
      if (res.ok) {
        setShowReworkModal(false);
        setReworkReason("");
        setReworkPhotos([]);
        setActionSuccess(res.message);
        router.refresh();
      } else {
        setActionError(res.message);
      }
    });
  };

  const handleAddPhoto = () => {
    if (reworkPhotoInput.trim() && !reworkPhotos.includes(reworkPhotoInput.trim())) {
      setReworkPhotos([...reworkPhotos, reworkPhotoInput.trim()]);
      setReworkPhotoInput("");
    }
  };

  // 1. Pro marked complete — Customer action required
  if (bookingStatus === "pro_marked_complete") {
    return (
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-300 dark:border-amber-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white uppercase tracking-wider">
              Inspection Required
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950">
              {proName} Marked This Job as Complete
            </h2>
            <p className="text-xs sm:text-sm text-amber-900">
              Please inspect the completed work. Confirm to release payment from escrow, or report any incomplete tasks.
            </p>
          </div>
          {proMarkedCompleteAt && (
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium sm:text-right shrink-0">
              Submitted: {new Date(proMarkedCompleteAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })},{" "}
              {new Date(proMarkedCompleteAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", timeZone: "Africa/Lagos" })}
            </div>
          )}
        </div>

        {/* Professional Notes */}
        {proNotes && (
          <div className="bg-white dark:bg-[#0D223A]/80 backdrop-blur-xs rounded-2xl border border-amber-200 dark:border-amber-800 p-4 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Specialist Completion Notes
            </span>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line font-medium">
              "{proNotes}"
            </p>
          </div>
        )}

        {/* Feedback Banners */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-bold text-red-900">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-900">
            {actionSuccess}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirmCompletion}
            className="flex-1 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            ✓ Confirm Completion &amp; Release Escrow
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setActionError(null);
              setShowReworkModal(true);
            }}
            className="px-5 py-3.5 rounded-2xl bg-white dark:bg-[#0D223A] border border-amber-300 dark:border-amber-700 text-amber-900 hover:bg-amber-100 font-bold text-xs transition disabled:opacity-50"
          >
            Report Incomplete Work
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onOpenDispute}
            className="px-4 py-3.5 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:bg-red-950/60 font-bold text-xs transition"
          >
            File Formal Dispute
          </button>
        </div>

        {/* Rework Modal */}
        {showReworkModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0D223A] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-[#163654]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report Incomplete Work</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Specify what tasks were not finished to your satisfaction. The specialist will be instructed to return and address them.
                </p>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-800 dark:text-red-300">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleReportIncompleteWork} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Describe Unfinished or Substandard Tasks *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    placeholder="e.g. The leak under the kitchen sink is still dripping; the safety valve was not installed as quoted..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Upload Supporting Photographs (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reworkPhotoInput}
                      onChange={(e) => setReworkPhotoInput(e.target.value)}
                      placeholder="Paste image URL (e.g. https://... or storage path)"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Add Photo
                    </button>
                  </div>
                  {reworkPhotos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {reworkPhotos.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-[#071526] p-2 rounded-lg border">
                          <span className="truncate max-w-xs">{p}</span>
                          <button
                            type="button"
                            onClick={() => setReworkPhotos(reworkPhotos.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReworkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    {isPending ? "Submitting..." : "Send Back for Rework"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    );
  }

  // 2. Active rework in progress
  if (bookingStatus === "in_progress" && reworkNotes) {
    return (
      <section className="bg-amber-50 dark:bg-amber-950/60/70 rounded-3xl border border-amber-200 dark:border-amber-800 p-6 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px]">
          <span>⚠ Rework in Progress (Cycle #{reworkCount})</span>
        </div>
        <p className="text-slate-800 dark:text-slate-100 font-medium">
          You requested corrections on this job: <span className="italic">"{reworkNotes}"</span>. The specialist has been notified to resolve these items.
        </p>
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={onOpenDispute}
            className="text-red-600 hover:text-red-800 dark:text-red-300 font-bold text-xs"
          >
            File Formal Dispute if specialist does not return →
          </button>
        </div>
      </section>
    );
  }

  // 3. Completed Booking — Review Banner
  if (bookingStatus === "completed") {
    return (
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 dark:border-emerald-800 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white uppercase tracking-wider">
              ✓ Job Completed &amp; Verified
            </span>
            <h2 className="text-xl font-bold text-emerald-950">
              This Service Request is Successfully Closed
            </h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Escrow funds have been released to {proName}.
            </p>
          </div>

          {!hasReview ? (
            <button
              type="button"
              onClick={onOpenReview}
              className="px-6 py-3 rounded-2xl bg-[#0F766E] hover:bg-[#0D655E] text-white font-extrabold text-xs shadow-md transition self-start sm:self-auto flex items-center gap-2"
            >
              ★ Rate &amp; Review Specialist
            </button>
          ) : (
            <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
              ✓ Review Submitted
            </span>
          )}
        </div>
      </section>
    );
  }

  return null;
}
