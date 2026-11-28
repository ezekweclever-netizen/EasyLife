"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProQuotation } from "@/lib/supabase/pro";
import { withdrawQuotationAction } from "@/app/actions/pro";
import { QuotationModal } from "./quotation-modal";

interface ProQuotationListProps {
  quotations: ProQuotation[];
  professionalId: string;
}

export function ProQuotationList({
  quotations,
  professionalId,
}: ProQuotationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filter, setFilter] = useState<"all" | "draft" | "pending" | "accepted" | "declined" | "withdrawn">("all");

  // Withdrawal modal state
  const [quoteToWithdraw, setQuoteToWithdraw] = useState<ProQuotation | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Edit/Revise modal state
  const [activeModalQuote, setActiveModalQuote] = useState<ProQuotation | null>(null);

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredQuotes = quotations.filter((q) => {
    if (filter === "all") return true;
    if (filter === "declined") return q.status === "declined" || q.status === "expired";
    return q.status === filter;
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteToWithdraw) return;
    setWithdrawError(null);

    const formData = new FormData();
    formData.append("quotationId", quoteToWithdraw.id);
    formData.append("reason", withdrawalReason);
    if (quoteToWithdraw.booking_id) {
      formData.append("bookingId", quoteToWithdraw.booking_id);
    }

    startTransition(async () => {
      const res = await withdrawQuotationAction(formData);
      if (res.ok) {
        setQuoteToWithdraw(null);
        setWithdrawalReason("");
        setFeedback({
          type: "success",
          text: `Quotation ${quoteToWithdraw.reference_code} has been withdrawn.`,
        });
        router.refresh();
      } else {
        setWithdrawError(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-900 border border-red-200 dark:border-red-800"
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#2E343B] pb-3">
        {[
          { key: "all", label: "All Quotes", count: quotations.length },
          { key: "pending", label: "Pending Customer Review", count: quotations.filter((q) => q.status === "pending").length },
          { key: "draft", label: "Drafts", count: quotations.filter((q) => q.status === "draft").length },
          { key: "accepted", label: "Accepted & Funded", count: quotations.filter((q) => q.status === "accepted").length },
          { key: "declined", label: "Declined / Expired", count: quotations.filter((q) => ["declined", "expired"].includes(q.status)).length },
          { key: "withdrawn", label: "Withdrawn", count: quotations.filter((q) => q.status === "withdrawn").length },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#E8590C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white dark:bg-[#1F2328]/20 text-white" : "bg-slate-200 text-slate-700 dark:text-slate-200"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#2E343B] bg-white dark:bg-[#1F2328] space-y-2">
          <span className="text-3xl block">📄</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No quotations found in this filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Browse open requests in your area and prepare itemized quotes to secure new maintenance jobs.
          </p>
          <div className="mt-4">
            <Link
              href="/pro/jobs"
              className="text-xs font-bold text-[#E8590C] hover:underline"
            >
              Browse Open Service Requests →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((q) => {
            const isAccepted = q.status === "accepted";
            const isDeclined = q.status === "declined";
            const isDraft = q.status === "draft";
            const isWithdrawn = q.status === "withdrawn";
            const isExpired = q.status === "expired" || (q.valid_until && new Date(q.valid_until).getTime() < Date.now());
            const isPendingReview = q.status === "pending" && !isExpired;

            let statusPill = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Pending Customer Review
              </span>
            );
            if (isDraft) {
              statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  Draft (Unsent)
                </span>
              );
            } else if (isAccepted) {
              statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Accepted &amp; Funded ✓
                </span>
              );
            } else if (isDeclined) {
              statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Declined
                </span>
              );
            } else if (isWithdrawn) {
              statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2E343B]">
                  Withdrawn
                </span>
              );
            } else if (isExpired) {
              statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Expired
                </span>
              );
            }

            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-[#1F2328] rounded-2xl border p-6 shadow-xs space-y-4 transition ${
                  isAccepted
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60/20"
                    : "border-slate-200 dark:border-[#2E343B] hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {q.reference_code}
                      </span>
                      {q.version && q.version > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:text-slate-200">
                          v{q.version}
                        </span>
                      )}
                      {statusPill}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {q.booking?.title || "Service Request"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ref: {q.booking?.reference_code} • {q.booking?.city}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xl font-black text-[#E8590C] block">
                      ₦{(q.total_amount_kobo / 100).toLocaleString("en-NG")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isDraft ? "Saved" : "Sent on"} {new Date(q.created_at).toLocaleDateString("en-NG")}
                    </span>
                  </div>
                </div>

                {/* Scope of Work */}
                {q.work_description && (
                  <div className="bg-slate-50 dark:bg-[#1F2328]/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">Proposed Work:</strong>
                    <p className="whitespace-pre-line">{q.work_description}</p>
                  </div>
                )}

                {/* Customer Response Banners (Prompt 12 Feature) */}
                {q.clarification_requested_at && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>💬</span> Customer Requested Clarification
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-300">
                        {new Date(q.clarification_requested_at).toLocaleDateString("en-NG")}
                      </span>
                    </div>
                    <p className="italic bg-white dark:bg-[#1F2328]/70 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                      &ldquo;{q.clarification_notes}&rdquo;
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveModalQuote(q)}
                        className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold transition"
                      >
                        Revise &amp; Update Quote →
                      </button>
                    </div>
                  </div>
                )}

                {isDeclined && q.decline_reason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
                    <span className="font-bold block">Customer Decline Feedback:</span>
                    <p className="mt-0.5">{q.decline_reason}</p>
                  </div>
                )}

                {/* Cost Breakdown Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#1F2328] rounded-xl p-3 border border-slate-200 dark:border-[#2E343B] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Labour Charges</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-100">
                      ₦{((q.labour_charges_kobo || 0) / 100).toLocaleString("en-NG")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Materials &amp; Parts</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-100">
                      ₦{((q.materials_costs_kobo || 0) / 100).toLocaleString("en-NG")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Additional Expenses</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-100">
                      ₦{((q.additional_expenses_kobo || 0) / 100).toLocaleString("en-NG")}
                    </strong>
                  </div>
                </div>

                {/* Itemized Rows */}
                {q.items && q.items.length > 0 && (
                  <div className="bg-white dark:bg-[#1F2328] rounded-xl p-3 border border-slate-200 dark:border-[#2E343B] divide-y divide-slate-100 text-xs">
                    <div className="pb-2 font-bold text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-2 text-[11px]">
                      <span className="col-span-6">Description</span>
                      <span className="col-span-2 text-center">Type</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Line Total</span>
                    </div>
                    {q.items.map((it) => (
                      <div key={it.id} className="py-2 grid grid-cols-12 gap-2 text-slate-800 dark:text-slate-100">
                        <span className="col-span-6 font-medium truncate">
                          {it.description}
                        </span>
                        <span className="col-span-2 text-center text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold">
                          {it.item_type}
                        </span>
                        <span className="col-span-2 text-center text-slate-600 dark:text-slate-300">
                          {it.quantity}
                        </span>
                        <span className="col-span-2 text-right font-bold text-slate-900 dark:text-white">
                          ₦{(it.line_total_kobo / 100).toLocaleString("en-NG")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer & Action CTAs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    {q.valid_until && (
                      <span className="block text-[11px]">
                        Validity: {new Date(q.valid_until).toLocaleDateString("en-NG")}
                      </span>
                    )}
                    {q.notes && (
                      <p className="italic text-[11px]">&ldquo;{q.notes}&rdquo;</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => setActiveModalQuote(q)}
                        className="px-3 py-1.5 rounded-lg bg-[#E8590C] hover:bg-[#E8590C] text-white text-xs font-bold transition shadow-xs"
                      >
                        Edit &amp; Submit Draft →
                      </button>
                    )}

                    {isPendingReview && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveModalQuote(q)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                        >
                          Revise Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuoteToWithdraw(q)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:bg-red-950/60 text-xs font-semibold transition"
                        >
                          Withdraw
                        </button>
                      </>
                    )}

                    {isAccepted && q.booking_id && (
                      <Link
                        href={`/pro/jobs/${q.booking_id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] transition shadow-xs"
                      >
                        Manage Active Job →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {quoteToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-md w-full border border-slate-200 dark:border-[#2E343B] shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                Withdraw Quotation
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Withdraw {quoteToWithdraw.reference_code}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The customer will be notified that this quote is no longer active. You can prepare an updated proposal later if needed.
              </p>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-900">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Reason for withdrawal (optional)</label>
                <textarea
                  rows={3}
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  placeholder="e.g. Parts prices increased; schedule conflict on proposed start date."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteToWithdraw(null)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {isPending ? "Withdrawing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REVISE QUOTATION MODAL */}
      {activeModalQuote && (
        <QuotationModal
          bookingId={activeModalQuote.booking_id}
          bookingRef={activeModalQuote.booking?.reference_code || "REF"}
          bookingTitle={activeModalQuote.booking?.title || "Service Request"}
          professionalId={professionalId}
          isOpen={true}
          onClose={() => setActiveModalQuote(null)}
          onSuccess={() => {
            setActiveModalQuote(null);
            router.refresh();
          }}
          existingQuotation={{
            id: activeModalQuote.id,
            work_description: activeModalQuote.work_description,
            estimated_duration_minutes: activeModalQuote.estimated_duration_minutes,
            proposed_start_at: activeModalQuote.proposed_start_at,
            notes: activeModalQuote.notes,
            items: activeModalQuote.items?.map((it) => ({
              id: it.id,
              item_type: it.item_type,
              description: it.description,
              quantity: it.quantity,
              unit_price_kobo: it.unit_price_kobo,
            })),
          }}
        />
      )}
    </div>
  );
}
