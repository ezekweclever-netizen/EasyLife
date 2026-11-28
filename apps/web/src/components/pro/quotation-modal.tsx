"use client";

import React, { useState, useTransition } from "react";
import { createQuotationAction } from "@/app/actions/pro";
import { generateAIQuotationSuggestionAction } from "@/app/actions/ai-quotation";
import type { AIQuotationSuggestionResult } from "@/lib/ai/quotation-engine";

export interface QuotationLineItem {
  id: string;
  item_type: "labor" | "parts" | "callout" | "transport" | "other";
  description: string;
  quantity: number;
  unit_price_naira: number;
}

interface QuotationModalProps {
  bookingId: string;
  bookingRef: string;
  bookingTitle: string;
  professionalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingQuotation?: {
    id: string;
    work_description?: string | null;
    estimated_duration_minutes: number;
    proposed_start_at: string | null;
    notes: string | null;
    items?: Array<{
      id?: string;
      item_type: string;
      description: string;
      quantity: number;
      unit_price_kobo: number;
    }>;
  } | null;
}

export function QuotationModal({
  bookingId,
  bookingRef,
  bookingTitle,
  professionalId,
  isOpen,
  onClose,
  onSuccess,
  existingQuotation,
}: QuotationModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialItems: QuotationLineItem[] =
    existingQuotation?.items && existingQuotation.items.length > 0
      ? existingQuotation.items.map((it, idx) => ({
          id: it.id || String(idx + 1),
          item_type: (it.item_type === "material" ? "parts" : it.item_type) as any,
          description: it.description,
          quantity: it.quantity,
          unit_price_naira: Math.round(it.unit_price_kobo / 100),
        }))
      : [
          {
            id: "1",
            item_type: "labor",
            description: "Technical diagnosis & initial workmanship",
            quantity: 1,
            unit_price_naira: 8000,
          },
        ];

  const [items, setItems] = useState<QuotationLineItem[]>(initialItems);
  const [workDescription, setWorkDescription] = useState(existingQuotation?.work_description || "");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(
    existingQuotation?.estimated_duration_minutes || 120
  );
  const [validUntilDays, setValidUntilDays] = useState(7);
  const [proposedStartAt, setProposedStartAt] = useState(existingQuotation?.proposed_start_at || "");
  const [notes, setNotes] = useState(existingQuotation?.notes || "");

  // AI Quotation Assistant State
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIQuotationSuggestionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleGenerateAISuggestion = async () => {
    setIsAILoading(true);
    setAiError(null);
    try {
      const res = await generateAIQuotationSuggestionAction({
        bookingId,
        jobTitle: bookingTitle,
        problemDescription: workDescription || bookingTitle,
        scopeNotes: notes || undefined,
      });

      if (!res.success || !res.data) {
        setAiError(res.error || "Could not generate AI quotation suggestion.");
      } else {
        setAiSuggestion(res.data);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to contact AI quotation assistant.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.work_description) {
      setWorkDescription(aiSuggestion.work_description);
    }
    if (aiSuggestion.estimated_duration_minutes) {
      setEstimatedDurationMinutes(aiSuggestion.estimated_duration_minutes);
    }
    if (aiSuggestion.items && aiSuggestion.items.length > 0) {
      const newItems: QuotationLineItem[] = aiSuggestion.items.map((it) => ({
        id: Math.random().toString(),
        item_type: it.item_type,
        description: it.description,
        quantity: it.quantity,
        unit_price_naira: it.unit_price_naira,
      }));
      setItems(newItems);
    }
    setShowAIAssistant(false);
  };

  if (!isOpen) return null;

  const addItem = (type: "labor" | "parts" | "callout" | "transport" | "other") => {
    const newItem: QuotationLineItem = {
      id: Math.random().toString(),
      item_type: type,
      description:
        type === "parts"
          ? "Replacement parts / materials"
          : type === "transport"
          ? "Logistics & site delivery"
          : type === "callout"
          ? "Standard call-out inspection fee"
          : type === "other"
          ? "Additional service item"
          : "Workmanship & repair labour",
      quantity: 1,
      unit_price_naira: type === "callout" ? 5000 : 3000,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, updates: Partial<QuotationLineItem>) => {
    setItems(items.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  // Preview breakdown
  const labourNaira = items
    .filter((it) => it.item_type === "labor")
    .reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price_naira) || 0), 0);

  const materialsNaira = items
    .filter((it) => it.item_type === "parts")
    .reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price_naira) || 0), 0);

  const additionalNaira = items
    .filter((it) => ["callout", "transport", "other"].includes(it.item_type))
    .reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price_naira) || 0), 0);

  const totalNaira = labourNaira + materialsNaira + additionalNaira;
  const subtotalNaira = totalNaira;

  const submitQuotation = (asDraft: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("professionalId", professionalId);
    if (existingQuotation?.id) {
      formData.append("quotationId", existingQuotation.id);
    }
    formData.append("isDraft", asDraft ? "true" : "false");
    formData.append("workDescription", workDescription);
    formData.append("estimatedDurationMinutes", estimatedDurationMinutes.toString());
    formData.append("validUntilDays", validUntilDays.toString());
    formData.append("proposedStartAt", proposedStartAt);
    formData.append("notes", notes);
    formData.append("itemsJson", JSON.stringify(items));

    startTransition(async () => {
      const res = await createQuotationAction(
        { status: "idle", message: "" },
        formData
      );

      if (res.status === "error") {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15181C]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-2xl w-full border border-[#E6E0D8] dark:border-[#2E343B] shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#E6E0D8] dark:border-[#2E343B]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8590C]">
              {existingQuotation ? "Revise / Edit Quotation" : "Prepare Structured Quotation"}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3] mt-0.5">
              {bookingTitle}
            </h2>
            <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-0.5">
              Ref: <span className="font-mono font-medium">{bookingRef}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-900">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900">
            ✓ {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* AI Quotation Assistant Panel */}
          <div className="p-4 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E8590C]/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#E8590C] animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2328] dark:text-[#FAF7F3] flex items-center gap-1.5">
                    ✨ AI Quotation Assistant
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#FCEBDD] text-[#E8590C] border border-[#E8590C]/30">
                      Draft Proposal Generator
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
                  Generate structured labour, materials, and expense suggestions based on job requirements.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAIAssistant(true);
                  handleGenerateAISuggestion();
                }}
                disabled={isAILoading}
                className="px-3.5 py-2 rounded-xl bg-[#E8590C] hover:bg-[#C84A06] text-white text-xs font-bold shadow-xs hover:shadow transition disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {isAILoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Analyzing Scope...
                  </>
                ) : (
                  <>✨ Suggest Quotation</>
                )}
              </button>
            </div>

            {aiError && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900">
                {aiError}
              </div>
            )}

            {showAIAssistant && aiSuggestion && (
              <div className="mt-4 pt-4 border-t border-[#E6E0D8] dark:border-[#2E343B] space-y-3">
                <div className="p-3 rounded-xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-xs space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4A525C] dark:text-[#C3C8CF]">Suggested Work Scope:</span>
                    <p className="text-[#1F2328] dark:text-[#FAF7F3] font-medium mt-0.5">{aiSuggestion.work_description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4A525C] dark:text-[#C3C8CF] pt-1 border-t border-[#E6E0D8] dark:border-[#2E343B]">
                    <div>
                      <span className="text-[#4A525C] dark:text-[#C3C8CF]">Est. Duration:</span>{" "}
                      <strong className="text-[#1F2328] dark:text-[#FAF7F3]">{aiSuggestion.estimated_duration_minutes} mins</strong>
                    </div>
                    <div>
                      <span className="text-[#4A525C] dark:text-[#C3C8CF]">Total Draft Benchmark:</span>{" "}
                      <strong className="text-[#E8590C] font-bold">₦{aiSuggestion.total_suggested_naira.toLocaleString("en-NG")}</strong>
                    </div>
                    <div>
                      <span className="text-[#4A525C] dark:text-[#C3C8CF]">Items:</span>{" "}
                      <strong className="text-[#1F2328] dark:text-[#FAF7F3]">{aiSuggestion.items.length} suggested lines</strong>
                    </div>
                  </div>
                </div>

                {/* Important Professional Rule Alert */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 leading-relaxed">
                  <strong className="font-bold block mb-0.5">⚠️ Professional Review & Approval Required</strong>
                  {aiSuggestion.disclaimer}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAIAssistant(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] text-[#4A525C] dark:text-[#C3C8CF] text-xs font-semibold hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAISuggestion}
                    className="px-4 py-1.5 rounded-lg bg-[#E8590C] hover:bg-[#C84A06] text-white text-xs font-bold shadow-xs transition"
                  >
                    Apply to Quotation Form →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description of Proposed Work */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
              Description of Proposed Work *
            </label>
            <textarea
              rows={2}
              required
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="e.g. Inspect leak at main valve, replace copper washer and pressure gasket, pressure test line."
              className="w-full p-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-xs text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
            />
          </div>

          {/* Itemized Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Itemized Line Items
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addItem("labor")}
                  className="px-2.5 py-1 rounded-lg bg-[#FCEBDD] border border-[#E8590C]/30 text-[#E8590C] text-[11px] font-semibold hover:bg-[#FCEBDD]/80 transition"
                >
                  + Add Labour
                </button>
                <button
                  type="button"
                  onClick={() => addItem("parts")}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] text-[11px] font-semibold hover:bg-[#FAF7F3] transition"
                >
                  + Add Materials
                </button>
                <button
                  type="button"
                  onClick={() => addItem("transport")}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] text-[11px] font-semibold hover:bg-[#FAF7F3] transition"
                >
                  + Add Additional Fee
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price_naira) || 0);
                return (
                  <div
                    key={it.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328]/50 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs"
                  >
                    <span className="w-5 text-slate-400 font-mono text-[11px]">
                      #{idx + 1}
                    </span>

                    <select
                      value={it.item_type}
                      onChange={(e) =>
                        updateItem(it.id, {
                          item_type: e.target.value as any,
                        })
                      }
                      className="h-9 px-2 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] font-medium text-[#1F2328] dark:text-[#FAF7F3]"
                    >
                      <option value="labor">Labour</option>
                      <option value="parts">Materials / Parts</option>
                      <option value="callout">Callout Fee</option>
                      <option value="transport">Transport / Logistics</option>
                      <option value="other">Other Expense</option>
                    </select>

                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(it.id, { description: e.target.value })}
                      placeholder="Item description..."
                      required
                      className="flex-1 h-9 px-3 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3]"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(it.id, {
                              quantity: parseFloat(e.target.value) || 1,
                            })
                          }
                          placeholder="Qty"
                          className="w-full h-9 px-2 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] text-center"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={it.unit_price_naira}
                          onChange={(e) =>
                            updateItem(it.id, {
                              unit_price_naira: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Unit (₦)"
                          className="w-full h-9 px-2 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] text-right"
                        />
                      </div>

                      <span className="w-24 text-right font-bold text-slate-900 dark:text-white shrink-0">
                        ₦{lineTotal.toLocaleString("en-NG")}
                      </span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Breakdown & Trusted Backend Totals Preview */}
          <div className="p-4 rounded-2xl bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#4A525C] dark:text-[#C3C8CF] font-medium">
                  Total Calculated Quotation
                </span>
                <p className="text-[10px] text-[#4A525C] dark:text-[#C3C8CF]">
                  Calculated and validated by EasyLife trusted backend in minor units (kobo).
                </p>
              </div>
              <span className="text-2xl font-black text-[#E8590C]">
                ₦{totalNaira.toLocaleString("en-NG")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E6E0D8] dark:border-[#2E343B] text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Labour:</span>
                <strong className="text-slate-800 dark:text-slate-100">₦{labourNaira.toLocaleString("en-NG")}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Materials:</span>
                <strong className="text-slate-800 dark:text-slate-100">₦{materialsNaira.toLocaleString("en-NG")}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Additional:</span>
                <strong className="text-slate-800 dark:text-slate-100">₦{additionalNaira.toLocaleString("en-NG")}</strong>
              </div>
            </div>
          </div>

          {/* Scheduling, Duration & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Estimated Duration
              </label>
              <select
                value={estimatedDurationMinutes}
                onChange={(e) => setEstimatedDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328]"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={240}>Half Day (4 Hours)</option>
                <option value={480}>Full Day (8 Hours)</option>
                <option value={1440}>Multi-day Job</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Quotation Validity
              </label>
              <select
                value={validUntilDays}
                onChange={(e) => setValidUntilDays(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328]"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Standard)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Proposed Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={proposedStartAt}
                onChange={(e) => setProposedStartAt(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Additional Notes &amp; Warranty Terms for Customer
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 30-day warranty on workmanship; materials backed by manufacturer warranty."
              className="w-full p-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328]"
            />
          </div>

          {/* Form Actions: Save Draft vs Submit Final Quote */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E6E0D8] dark:border-[#2E343B]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs font-semibold text-[#4A525C] dark:text-[#C3C8CF] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => submitQuotation(true)}
                disabled={isPending}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E8590C]/40 bg-[#FCEBDD] hover:bg-[#FCEBDD]/80 text-[#E8590C] text-xs font-bold transition"
              >
                {isPending ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                onClick={() => submitQuotation(false)}
                disabled={isPending || totalNaira <= 0}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#E8590C] text-white text-xs font-bold hover:bg-[#C84A06] disabled:opacity-50 transition shadow-xs"
              >
                {isPending ? "Submitting..." : `Submit Quote (₦${totalNaira.toLocaleString("en-NG")})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
