"use client";

import React, { useState, useTransition } from "react";
import {
  acceptQuotationAction,
  declineQuotationAction,
  requestQuotationClarificationAction,
} from "@/app/actions/booking";

export interface QuotationComparisonItem {
  id: string;
  reference_code: string;
  professional_id: string;
  status: string;
  version?: number;
  work_description?: string | null;
  labour_charges_kobo?: number;
  materials_costs_kobo?: number;
  additional_expenses_kobo?: number;
  subtotal_kobo: number;
  tax_kobo: number;
  total_amount_kobo: number;
  currency_code?: string;
  estimated_duration_minutes: number;
  proposed_start_at: string | null;
  valid_until: string | null;
  notes: string | null;
  decline_reason?: string | null;
  clarification_requested_at?: string | null;
  clarification_notes?: string | null;
  withdrawal_reason?: string | null;
  accepted_at: string | null;
  declined_at?: string | null;
  withdrawn_at?: string | null;
  created_at: string;
  quotation_items?: Array<{
    id: string;
    item_type: string;
    description: string;
    quantity: number;
    unit_price_kobo: number;
    line_total_kobo: number;
  }>;
  professional_profiles?: {
    id: string;
    business_name: string;
    headline: string | null;
    primary_city: string;
    verification_status: string;
    average_rating?: number;
    completed_jobs_count?: number;
  } | null;
}

interface QuotationComparisonProps {
  bookingId: string;
  preferredDate?: string | null;
  preferredTimeSlot?: string | null;
  bookingStatus: string;
  acceptedQuotationId?: string | null;
  quotations: QuotationComparisonItem[];
  onActionComplete?: () => void;
}

export function QuotationComparison({
  bookingId,
  preferredDate,
  preferredTimeSlot,
  bookingStatus,
  acceptedQuotationId,
  quotations,
  onActionComplete,
}: QuotationComparisonProps) {
  const [isPending, startTransition] = useTransition();

  // Accept modal state
  const [selectedQuoteForAccept, setSelectedQuoteForAccept] = useState<QuotationComparisonItem | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(
    preferredDate || new Date().toISOString().split("T")[0]
  );
  const [appointmentTime, setAppointmentTime] = useState(
    preferredTimeSlot?.includes("Morning") ? "09:00" : "14:00"
  );
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Decline modal state
  const [selectedQuoteForDecline, setSelectedQuoteForDecline] = useState<QuotationComparisonItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineError, setDeclineError] = useState<string | null>(null);

  // Clarification modal state
  const [selectedQuoteForClarify, setSelectedQuoteForClarify] = useState<QuotationComparisonItem | null>(null);
  const [clarificationNotes, setClarificationNotes] = useState("");
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Expanded details toggle for line items
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuoteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForAccept) return;
    setAcceptError(null);

    const startDateTime = `${appointmentDate}T${appointmentTime}:00+01:00`;
    const duration = selectedQuoteForAccept.estimated_duration_minutes || 60;
    const endDate = new Date(new Date(startDateTime).getTime() + duration * 60000);

    startTransition(async () => {
      const res = await acceptQuotationAction(
        bookingId,
        selectedQuoteForAccept.id,
        startDateTime,
        endDate.toISOString()
      );

      if (res.ok) {
        setSelectedQuoteForAccept(null);
        setFeedback({
          type: "success",
          text: `Quotation accepted! Appointment scheduled for ${appointmentDate} at ${appointmentTime}.`,
        });
        onActionComplete?.();
      } else {
        setAcceptError(res.message);
      }
    });
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForDecline) return;
    setDeclineError(null);

    startTransition(async () => {
      const res = await declineQuotationAction(
        bookingId,
        selectedQuoteForDecline.id,
        declineReason
      );

      if (res.ok) {
        setSelectedQuoteForDecline(null);
        setDeclineReason("");
        setFeedback({
          type: "success",
          text: `Quotation ${selectedQuoteForDecline.reference_code} has been declined.`,
        });
        onActionComplete?.();
      } else {
        setDeclineError(res.message);
      }
    });
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForClarify) return;
    setClarifyError(null);

    startTransition(async () => {
      const res = await requestQuotationClarificationAction(
        bookingId,
        selectedQuoteForClarify.id,
        clarificationNotes
      );

      if (res.ok) {
        setSelectedQuoteForClarify(null);
        setClarificationNotes("");
        setFeedback({
          type: "success",
          text: `Clarification request sent to ${selectedQuoteForClarify.professional_profiles?.business_name || "the professional"}.`,
        });
        onActionComplete?.();
      } else {
        setClarifyError(res.message);
      }
    });
  };

  if (!quotations || quotations.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
        <span className="text-3xl">⏳</span>
        <h3 className="text-sm font-bold text-slate-800">No Quotations Received Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Accredited specialists are reviewing your request. When quotes arrive, you will be able to compare pricing, labour, materials, and timeframes side-by-side.
        </p>
      </div>
    );
  }

  const canAcceptAny = ["draft", "submitted", "open", "pending_pro_response", "quoted"].includes(bookingStatus);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Comparison Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
            Side-by-Side Comparison
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Compare Quotations ({quotations.length})
          </h3>
          <p className="text-xs text-slate-500">
            Compare labour, materials, additional fees, and estimated completion times before making a decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            Backend Verified Pricing
          </span>
        </div>
      </div>

      {/* Responsive Comparison Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {quotations.map((quote) => {
          const isAccepted = quote.status === "accepted" || acceptedQuotationId === quote.id;
          const isDeclined = quote.status === "declined";
          const isWithdrawn = quote.status === "withdrawn";
          const isExpired = quote.status === "expired" || (quote.valid_until && new Date(quote.valid_until).getTime() < Date.now());
          const isPendingReview = quote.status === "pending" && !isExpired;

          const pro = quote.professional_profiles;
          const labour = quote.labour_charges_kobo ?? 0;
          const materials = quote.materials_costs_kobo ?? 0;
          const additional = quote.additional_expenses_kobo ?? 0;

          return (
            <div
              key={quote.id}
              className={`flex flex-col justify-between rounded-3xl border transition-all ${
                isAccepted
                  ? "border-[#0D9488] bg-teal-50/40 shadow-md ring-2 ring-[#0D9488]"
                  : isDeclined || isWithdrawn || isExpired
                  ? "border-slate-200 bg-slate-50/60 opacity-80"
                  : "border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-md"
              } p-6`}
            >
              <div className="space-y-4">
                {/* Header: Reference & Status Pill */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {quote.reference_code}
                    </span>
                    {quote.version && quote.version > 1 && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        v{quote.version}
                      </span>
                    )}
                  </div>
                  <div>
                    {isAccepted ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0D9488] text-white">
                        ✓ Accepted Quote
                      </span>
                    ) : isDeclined ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        Declined
                      </span>
                    ) : isWithdrawn ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        Withdrawn
                      </span>
                    ) : isExpired ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {pro?.business_name || "Accredited Trade Professional"}
                  </h4>
                  {pro?.headline && (
                    <p className="text-xs text-slate-500 line-clamp-1">{pro.headline}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                    {pro?.verification_status === "approved" && (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                        <span>🛡️</span> Verified Specialist
                      </span>
                    )}
                    {pro?.completed_jobs_count !== undefined && pro.completed_jobs_count > 0 && (
                      <span>• {pro.completed_jobs_count} jobs completed</span>
                    )}
                  </div>
                </div>

                {/* Total Price Callout */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Total Estimated Amount
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-[#0D9488]">
                      ₦{(quote.total_amount_kobo / 100).toLocaleString("en-NG")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">NGN</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    ⏱️ Est. Completion: <strong>{quote.estimated_duration_minutes || 60} mins</strong>
                  </span>
                </div>

                {/* Structured Cost Breakdown Matrix */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cost Breakdown
                  </span>
                  <div className="space-y-1.5 text-xs bg-white rounded-xl p-3 border border-slate-200">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Labour Charges:</span>
                      <strong className="font-mono">
                        ₦{(labour / 100).toLocaleString("en-NG")}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Materials &amp; Parts:</span>
                      <strong className="font-mono">
                        ₦{(materials / 100).toLocaleString("en-NG")}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Additional (Callout/Transport):</span>
                      <strong className="font-mono">
                        ₦{(additional / 100).toLocaleString("en-NG")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Work Description */}
                {quote.work_description && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Proposed Scope of Work
                    </span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {quote.work_description}
                    </p>
                  </div>
                )}

                {/* Validity Notice */}
                {quote.valid_until && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                    <span>Valid until:</span>
                    <span className={`font-medium ${isExpired ? "text-red-700 font-bold" : "text-slate-700"}`}>
                      {new Date(quote.valid_until).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "Africa/Lagos",
                      })}
                    </span>
                  </div>
                )}

                {/* Customer Response Notices */}
                {quote.clarification_requested_at && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">💬 Clarification Requested:</span>
                    <p className="italic text-[11px]">&ldquo;{quote.clarification_notes}&rdquo;</p>
                  </div>
                )}

                {quote.decline_reason && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold block">Decline Reason:</span>
                    <p className="text-[11px]">{quote.decline_reason}</p>
                  </div>
                )}

                {/* Expandable Itemized Rows */}
                {quote.quotation_items && quote.quotation_items.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleExpand(quote.id)}
                      className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center justify-between w-full"
                    >
                      <span>
                        {expandedQuoteIds[quote.id] ? "Hide Line Items ▲" : `View Line Items (${quote.quotation_items.length}) ▼`}
                      </span>
                    </button>

                    {expandedQuoteIds[quote.id] && (
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-dashed border-slate-200">
                        {quote.quotation_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                            <div>
                              <span className="font-medium">{item.description}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 capitalize">
                                ({item.item_type} × {item.quantity})
                              </span>
                            </div>
                            <span className="font-mono text-slate-900 font-semibold">
                              ₦{(item.line_total_kobo / 100).toLocaleString("en-NG")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
                {canAcceptAny && isPendingReview && (
                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForAccept(quote)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-xs transition"
                  >
                    Accept Quote &amp; Book →
                  </button>
                )}

                {isPendingReview && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuoteForClarify(quote);
                        setClarificationNotes(quote.clarification_notes || "");
                      }}
                      className="py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                    >
                      💬 Ask Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteForDecline(quote)}
                      className="py-2 px-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 font-semibold text-xs transition"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {isExpired && (
                  <p className="text-[11px] text-red-600 text-center font-medium">
                    This quotation has expired and cannot be accepted.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ACCEPT QUOTATION & CONFIRM APPOINTMENT */}
      {selectedQuoteForAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
                Confirm Appointment &amp; Quotation
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Accept {selectedQuoteForAccept.professional_profiles?.business_name || "Specialist"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review appointment time and escrow commitment for{" "}
                <span className="font-mono font-semibold">{selectedQuoteForAccept.reference_code}</span>.
              </p>
            </div>

            {acceptError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-900">
                {acceptError}
              </div>
            )}

            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
                <div className="flex justify-between text-xs text-teal-900">
                  <span>Agreed Escrow Amount:</span>
                  <span className="font-bold font-mono text-sm text-[#0D9488]">
                    ₦{(selectedQuoteForAccept.total_amount_kobo / 100).toLocaleString("en-NG")}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-teal-800">
                  <span>Labour: ₦{((selectedQuoteForAccept.labour_charges_kobo || 0) / 100).toLocaleString("en-NG")}</span>
                  <span>Materials: ₦{((selectedQuoteForAccept.materials_costs_kobo || 0) / 100).toLocaleString("en-NG")}</span>
                </div>
                <p className="text-[10px] text-teal-700 italic border-t border-teal-200 pt-1.5">
                  🛡️ Protected by EasyLife Escrow Guarantee. No payment is released until you approve the completed job.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0D9488]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForAccept(null)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition"
                >
                  {isPending ? "Confirming..." : "Confirm & Accept Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CLARIFICATION */}
      {selectedQuoteForClarify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
                Request Quotation Clarification
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Ask {selectedQuoteForClarify.professional_profiles?.business_name || "Specialist"} a Question
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Have questions about line items, materials costs, or estimated timeframe? Send a direct clarification request.
              </p>
            </div>

            {clarifyError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-900">
                {clarifyError}
              </div>
            )}

            <form onSubmit={handleClarifySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Your Question or Request</label>
                <textarea
                  rows={4}
                  required
                  value={clarificationNotes}
                  onChange={(e) => setClarificationNotes(e.target.value)}
                  placeholder="e.g. Could you clarify which brand of replacement parts will be used for the water heater?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0D9488]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForClarify(null)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition"
                >
                  {isPending ? "Sending..." : "Submit Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DECLINE QUOTATION */}
      {selectedQuoteForDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                Decline Quotation
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Decline {selectedQuoteForDecline.reference_code}?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The specialist will be informed that you have declined this quote.
              </p>
            </div>

            {declineError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-900">
                {declineError}
              </div>
            )}

            <form onSubmit={handleDeclineSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Reason for declining (optional)</label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Price is higher than expected, or chosen another specialist."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForDecline(null)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {isPending ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
