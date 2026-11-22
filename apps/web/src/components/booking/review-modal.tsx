"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/app/actions/reviews";

interface ReviewModalProps {
  bookingId: string;
  referenceCode: string;
  proName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewModal({
  bookingId,
  referenceCode,
  proName = "the specialist",
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddPhoto = () => {
    if (photoInput.trim() && !photos.includes(photoInput.trim())) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || comment.trim().length < 5) {
      setError("Please provide at least 5 characters of constructive feedback.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("rating", rating.toString());
    formData.append("title", title.trim());
    formData.append("comment", comment.trim());
    for (const photo of photos) {
      formData.append("photos", photo);
    }

    startTransition(async () => {
      const res = await submitReviewAction(formData);
      if (res.ok) {
        onSuccess?.();
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-[#163654]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Rate &amp; Review Your Experience
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Booking #{referenceCode} with <span className="font-semibold text-slate-700 dark:text-slate-200">{proName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating ?? rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-hidden transition transform hover:scale-110"
                  >
                    <span
                      className={`text-3xl ${
                        isFilled ? "text-amber-400" : "text-slate-200"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                );
              })}
              <span className="ml-3 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                {rating === 5 && "Excellent (5.0)"}
                {rating === 4 && "Very Good (4.0)"}
                {rating === 3 && "Satisfactory (3.0)"}
                {rating === 2 && "Poor (2.0)"}
                {rating === 1 && "Very Poor (1.0)"}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Headline or Summary (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prompt arrival, excellent generator diagnosis"
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
            />
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Detailed Feedback *
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the punctuality, trade competence, tidiness, and transparency of the specialist..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Minimum 5 characters</span>
              <span>{comment.length} chars</span>
            </div>
          </div>

          {/* Supporting Photos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Supporting Photographs of Finished Work (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Paste image URL (e.g. https://... or storage path)"
                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>
            {photos.length > 0 && (
              <div className="mt-2 space-y-1">
                {photos.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-[#071526] p-2 rounded-lg border">
                    <span className="truncate max-w-xs">{p}</span>
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Badge Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-[#163654] text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            🛡️ <span className="font-bold text-slate-800 dark:text-slate-100">Verified Customer Review:</span> Your review will be publicly attached to {proName}'s profile with an accredited booking badge to help other customers.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {isPending ? "Publishing..." : "Submit Verified Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
