"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminModerateReviewAction } from "@/app/actions/reviews";

export interface AdminReviewItem {
  id: string;
  booking_id: string;
  reviewer_user_id: string;
  professional_id: string;
  rating: number;
  title: string | null;
  comment: string;
  photos: string[];
  professional_response: string | null;
  responded_at: string | null;
  is_published: boolean;
  moderation_status: "approved" | "pending" | "flagged" | "rejected";
  is_flagged: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_notes: string | null;
  original_comment: string | null;
  edit_count: number;
  created_at: string;
  booking?: {
    reference_code: string;
    title: string;
  } | null;
  professional?: {
    business_name: string;
    headline: string | null;
  } | null;
}

interface AdminReviewModeratorProps {
  initialReviews: AdminReviewItem[];
}

export function AdminReviewModerator({ initialReviews }: AdminReviewModeratorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (filter !== "all" && r.moderation_status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      const matchPro = (r.professional?.business_name || "").toLowerCase().includes(q);
      const matchRef = (r.booking?.reference_code || "").toLowerCase().includes(q);
      if (!matchComment && !matchTitle && !matchPro && !matchRef) return false;
    }
    return true;
  });

  const handleModerate = (reviewId: string, action: "approve" | "flag" | "reject") => {
    setFeedback(null);
    const notes = moderationNotes[reviewId] || "";
    const formData = new FormData();
    formData.append("reviewId", reviewId);
    formData.append("action", action);
    formData.append("notes", notes);

    startTransition(async () => {
      const res = await adminModerateReviewAction(formData);
      if (res.ok) {
        setFeedback({
          type: "success",
          text: `Review status successfully updated to '${action}'.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reviews</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{reviews.length}</div>
          <span className="text-[11px] text-slate-400">All submitted feedback</span>
        </div>
        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Published</span>
          <div className="text-2xl font-black text-emerald-600">
            {reviews.filter((r) => r.is_published).length}
          </div>
          <span className="text-[11px] text-slate-400">Live on specialist profiles</span>
        </div>
        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flagged</span>
          <div className="text-2xl font-black text-amber-600">
            {reviews.filter((r) => r.is_flagged || r.moderation_status === "flagged").length}
          </div>
          <span className="text-[11px] text-slate-400">Under content inspection</span>
        </div>
        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rejected</span>
          <div className="text-2xl font-black text-red-600">
            {reviews.filter((r) => r.moderation_status === "rejected").length}
          </div>
          <span className="text-[11px] text-slate-400">Abusive or fraudulent</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-900 border-red-200 dark:border-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0D223A] p-4 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "all", label: "All Reviews" },
            { key: "approved", label: "Approved" },
            { key: "flagged", label: "Flagged" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filter === tab.key
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comment, pro, or booking..."
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654] p-12 text-center text-slate-400 text-xs">
            No reviews match your filter criteria.
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div key={r.id} className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 text-base">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{r.rating}.0 / 5.0</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r.moderation_status === "approved"
                        ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                        : r.moderation_status === "flagged"
                        ? "bg-amber-100 text-amber-800 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {r.moderation_status}
                  </span>
                  {r.edit_count > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Edited {r.edit_count}x — history preserved)
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Booking #{r.booking?.reference_code || r.booking_id.slice(0, 8)} • Specialist:{" "}
                  <strong className="text-slate-800 dark:text-slate-100">{r.professional?.business_name || "Specialist"}</strong>
                </div>
              </div>

              {/* Review Title & Content */}
              <div className="space-y-1">
                {r.title && <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</h4>}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  "{r.comment}"
                </p>
                {r.original_comment && r.original_comment !== r.comment && (
                  <div className="p-3 bg-slate-50 dark:bg-[#071526] rounded-xl border border-slate-200 dark:border-[#163654] text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                    <span className="font-bold block text-slate-700 dark:text-slate-200">Original Submission:</span>
                    "{r.original_comment}"
                  </div>
                )}
              </div>

              {/* Professional Response if any */}
              {r.professional_response && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/60/70 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-950 italic">
                  <strong>Specialist Response:</strong> "{r.professional_response}"
                </div>
              )}

              {/* Moderation Controls */}
              <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Moderation notes / rationale (optional)..."
                  value={moderationNotes[r.id] || ""}
                  onChange={(e) =>
                    setModerationNotes({ ...moderationNotes, [r.id]: e.target.value })
                  }
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs flex-1 max-w-md"
                />

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {r.moderation_status !== "approved" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleModerate(r.id, "approve")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      Approve &amp; Publish
                    </button>
                  )}

                  {r.moderation_status !== "flagged" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleModerate(r.id, "flag")}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      Flag for Review
                    </button>
                  )}

                  {r.moderation_status !== "rejected" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleModerate(r.id, "reject")}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      Reject &amp; Hide
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
