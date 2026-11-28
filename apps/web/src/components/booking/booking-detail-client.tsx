"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerBookingItem } from "@/lib/supabase/customer";
import { QuotationComparison } from "./quotation-comparison";
import { JobCompletionCard } from "./job-completion-card";
import { ReviewModal } from "./review-modal";
import { DisputeModal } from "./dispute-modal";
import {
  acceptQuotationAction,
  confirmAppointmentAction,
  cancelBookingAction,
} from "@/app/actions/booking";
import { getOrCreateBookingConversationAction } from "@/app/actions/messages";

// Note: QuotationComparison renders structured quotation_items breakdown, comparisons and acceptQuotationAction handling.

interface BookingDetailClientProps {
  booking: CustomerBookingItem;
  customerEmail?: string;
}

const ORDERED_LIFECYCLE_STEPS = [
  { key: "submitted", label: "Request Placed", desc: "Broadcast to accredited specialists" },
  { key: "quoted", label: "Quotation Received", desc: "Itemized quote submitted" },
  { key: "accepted", label: "Quote Accepted", desc: "Professional selected by customer" },
  { key: "confirmed", label: "Appointment Confirmed", desc: "Time slot locked & conflict-free" },
  { key: "in_progress", label: "In Progress", desc: "Technician on site executing repair" },
  { key: "completed", label: "Completed", desc: "Job inspected and approved" },
];

export function BookingDetailClient({ booking, customerEmail }: BookingDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review & Dispute modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Notification / Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isCancelled = booking.status === "cancelled";
  const isDisputed = booking.status === "disputed";
  const canCancel = ["draft", "submitted", "open", "pending_pro_response", "quoted", "accepted", "confirmed"].includes(
    booking.status
  );

  const getStepStatus = (stepKey: string) => {
    if (isCancelled) return "cancelled";
    if (isDisputed) return "disputed";

    const progression = [
      "draft",
      "submitted",
      "open",
      "pending_pro_response",
      "quoted",
      "accepted",
      "confirmed",
      "scheduled",
      "in_progress",
      "pro_marked_complete",
      "completed",
    ];

    const currentIdx = progression.indexOf(booking.status);
    let stepTargetIdx = progression.indexOf(stepKey);

    if (stepKey === "quoted" && (booking.status === "quoted" || (booking.quotations && booking.quotations.length > 0))) {
      return "completed";
    }

    if (currentIdx >= stepTargetIdx) return "completed";
    return "upcoming";
  };

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }
    setCancelError(null);

    startTransition(async () => {
      const res = await cancelBookingAction(booking.id, cancelReason);
      if (res.ok) {
        setShowCancelModal(false);
        setFeedback({
          type: "success",
          text: "Booking has been cancelled in accordance with platform policy.",
        });
        router.refresh();
      } else {
        setCancelError(res.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-900 border-red-200 dark:border-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar with Reference & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <Link href="/bookings" className="hover:text-[#E8590C] font-medium">
              ← Back to My Bookings
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2328]">
              Booking #{booking.reference_code}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                booking.status === "completed"
                  ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                  : booking.status === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : booking.status === "confirmed"
                  ? "bg-teal-100 text-teal-800 dark:text-[#F06A1F]"
                  : booking.status === "accepted"
                  ? "bg-cyan-100 text-cyan-800"
                  : booking.status === "cancelled"
                  ? "bg-red-100 text-red-800 dark:text-red-300"
                  : booking.status === "disputed"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-amber-100 text-amber-800 dark:text-amber-300"
              }`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:bg-red-950/60 transition shadow-xs self-start sm:self-auto"
            >
              Cancel Request
            </button>
          )}
          {!isCancelled && !isDisputed && ["in_progress", "pro_marked_complete", "scheduled", "confirmed"].includes(booking.status) && (
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-950/60 transition shadow-xs self-start sm:self-auto"
            >
              Report Problem
            </button>
          )}
        </div>
      </div>

      {/* Formal Dispute Notice Banner */}
      {isDisputed && (
        <section className="bg-purple-50 rounded-3xl border-2 border-purple-300 p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
              Dispute Under Administrative Arbitration
            </span>
          </div>
          <h3 className="text-lg font-black text-purple-950">
            Dispute Case Active: #{booking.active_dispute?.reference_code || "Arbitration Pending"}
          </h3>
          <p className="text-xs text-purple-900 leading-relaxed">
            This booking is currently subject to formal arbitration. Automatic completion and escrow payout have been strictly halted. An EasyLife administrator is examining evidence from both parties to document a binding resolution.
          </p>
          {booking.active_dispute?.resolution_summary && (
            <div className="p-3 bg-white dark:bg-[#1F2328]/80 rounded-xl border border-purple-200 text-xs text-purple-900">
              <strong>Resolution Summary:</strong> {booking.active_dispute.resolution_summary}
            </div>
          )}
        </section>
      )}

      {/* Status Progress Timeline */}
      <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#1F2328]">Service Lifecycle &amp; Appointment Progress</h2>

        {isCancelled ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60/70 border border-red-200 dark:border-red-800 text-xs text-red-900 space-y-1">
            <p className="font-bold">This booking has been cancelled.</p>
            {booking.cancellation_reason && (
              <p className="text-xs text-red-700 dark:text-red-400">Reason: {booking.cancellation_reason}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ORDERED_LIFECYCLE_STEPS.map((s, idx) => {
              const state = getStepStatus(s.key);
              return (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        state === "completed"
                          ? "bg-[#E8590C] text-white"
                          : "bg-[#E6E0D8] text-[#64748B]"
                      }`}
                    >
                      {state === "completed" ? "✓" : idx + 1}
                    </div>
                    <div className="h-0.5 flex-1 bg-[#E6E0D8] hidden lg:block" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#1F2328]">{s.label}</p>
                    <p className="text-[10px] text-[#64748B] leading-tight">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Service Accountability: Job Completion Inspection & Actions */}
      <JobCompletionCard
        bookingId={booking.id}
        referenceCode={booking.reference_code}
        bookingStatus={booking.status}
        proName={booking.assigned_pro?.business_name || "Specialist"}
        proNotes={booking.pro_completion_notes}
        proMarkedCompleteAt={booking.pro_marked_complete_at}
        reworkNotes={booking.rework_notes}
        reworkCount={booking.rework_count}
        hasReview={Boolean(booking.review)}
        onOpenDispute={() => setShowDisputeModal(true)}
        onOpenReview={() => setShowReviewModal(true)}
      />

      {/* Verified Customer Review (if published) */}
      {booking.review && (
        <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">
                {"★".repeat(booking.review.rating)}{"☆".repeat(5 - booking.review.rating)}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {booking.review.rating}.0 / 5.0 Rating
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:text-[#F06A1F] uppercase tracking-wider ml-1">
                Verified Customer
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(booking.review.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Lagos" })}
            </span>
          </div>

          {booking.review.title && (
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{booking.review.title}</h4>
          )}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            "{booking.review.comment}"
          </p>

          {booking.review.photos && booking.review.photos.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Customer Uploaded Photos ({booking.review.photos.length})
              </span>
              <div className="flex gap-2 flex-wrap">
                {booking.review.photos.map((photo, pIdx) => (
                  <div key={pIdx} className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-[#1F2328] text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    📷 {photo.split("/").pop()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.review.professional_response && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/60/70 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs space-y-1 mt-3">
              <span className="font-bold text-teal-950 block">Response from {booking.assigned_pro?.business_name || "Specialist"}:</span>
              <p className="text-teal-900 italic">"{booking.review.professional_response}"</p>
              {booking.review.responded_at && (
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono block pt-1">
                  Responded on {new Date(booking.review.responded_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Confirmed Appointment Card (if confirmed or scheduled) */}
      {booking.scheduled_start_at && ["confirmed", "scheduled", "in_progress", "completed"].includes(booking.status) && (
        <section className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-200 dark:border-teal-800 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8590C] text-white uppercase tracking-wider mb-1">
                ✓ Confirmed Appointment
              </span>
              <h2 className="text-lg font-bold text-teal-950">
                Scheduled for {new Date(booking.scheduled_start_at).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Lagos" })}
              </h2>
              <p className="text-xs text-teal-800 dark:text-[#F06A1F]">
                Time Window: {new Date(booking.scheduled_start_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}
                {booking.scheduled_end_at && ` – ${new Date(booking.scheduled_end_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}`}
              </p>
            </div>

            {booking.agreed_amount_kobo && (
              <div className="text-right sm:border-l sm:border-teal-200 dark:border-teal-800 sm:pl-6 space-y-2">
                <div>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-medium">Agreed Escrow Value</span>
                  <span className="text-xl font-extrabold text-[#E8590C]">
                    ₦{(booking.agreed_amount_kobo / 100).toLocaleString("en-NG")}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const res = await getOrCreateBookingConversationAction(booking.id);
                      if (res.success && res.conversationId) {
                        router.push(`/messages?conversationId=${res.conversationId}`);
                      }
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E8590C] hover:bg-[#C84A06] text-white text-[11px] font-bold transition flex items-center gap-1.5 ml-auto shadow-xs"
                >
                  💬 Chat with Specialist
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quotations Review & Comparison Section */}
      <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
        <QuotationComparison
          bookingId={booking.id}
          preferredDate={booking.preferred_date}
          preferredTimeSlot={booking.preferred_time_slot}
          bookingStatus={booking.status}
          acceptedQuotationId={booking.accepted_quotation_id}
          quotations={(booking.quotations || []) as any}
          onActionComplete={() => router.refresh()}
        />
      </section>

      {/* Problem Details & Service Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1F2328]">Problem Details &amp; Diagnosis</h2>
            
            <div className="space-y-1">
              <span className="text-xs text-[#64748B] block">Summary</span>
              <p className="font-bold text-sm text-[#1F2328]">{booking.title}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-[#64748B] block">Full Description</span>
              <p className="text-xs sm:text-sm text-[#4A525C] whitespace-pre-line bg-[#FAF7F3] p-4 rounded-xl border border-[#E6E0D8]">
                {booking.description}
              </p>
            </div>

            {booking.attachments && booking.attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Attachments ({booking.attachments.length})
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {booking.attachments.map((att) => (
                    <div key={att.id} className="p-3 rounded-xl border border-[#E6E0D8] bg-[#FAF7F3] text-xs">
                      <span className="font-semibold block truncate">{att.file_name}</span>
                      <span className="text-[10px] text-[#64748B]">{(att.file_size_bytes / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Historical Status Log */}
          {booking.status_history && booking.status_history.length > 0 && (
            <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#1F2328]">Status History &amp; Audit Trail</h2>
              <div className="divide-y divide-slate-100 text-xs">
                {booking.status_history.map((hist, idx) => (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {hist.to_status.replace(/_/g, " ")}
                      </span>
                      {hist.reason && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{hist.reason}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(hist.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Location & Cancellation Policy */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#1F2328]">Service Location</h2>
            <div>
              <span className="text-[#64748B] block">City &amp; State</span>
              <span className="font-bold text-[#1F2328]">{booking.city}, {booking.state}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Physical Address</span>
              <span className="font-bold text-[#1F2328]">{booking.service_address}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Urgency</span>
              <span className="font-bold text-[#E8590C] capitalize">{booking.urgency}</span>
            </div>
          </section>

          {/* Cancellation Policy Box */}
          <div className="bg-slate-50 dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B] p-6 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white block">Cancellation Policy</span>
            <p className="text-[11px] leading-relaxed">
              • Free cancellation while awaiting or reviewing quotations.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Once an appointment is confirmed, cancellations within 2 hours of the scheduled time may be subject to a technician diagnosis callout fee.
            </p>
            <p className="text-[11px] leading-relaxed">
              • In-progress jobs cannot be cancelled directly; please open a dispute if issues arise.
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-[#2E343B]">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Service Request</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please indicate your reason for cancelling this booking.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-800 dark:text-red-300">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Issue resolved independently, emergency reschedule required..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          bookingId={booking.id}
          referenceCode={booking.reference_code}
          proName={booking.assigned_pro?.business_name || "Specialist"}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: "Thank you! Your verified review has been submitted.",
            });
            router.refresh();
          }}
        />
      )}

      {/* Formal Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          bookingId={booking.id}
          referenceCode={booking.reference_code}
          agreedAmountNaira={booking.agreed_amount_kobo ? booking.agreed_amount_kobo / 100 : 0}
          proName={booking.assigned_pro?.business_name || "Specialist"}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            setFeedback({
              type: "success",
              text: "Formal dispute filed. An administrator will investigate your case.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
