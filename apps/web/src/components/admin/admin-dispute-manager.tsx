"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminUpdateDisputeAction, adminAddDisputeNoteAction } from "@/app/actions/disputes";
import type { DisputeStatus, DisputeResolutionType } from "@easylife/shared-types";

export interface AdminDisputeItem {
  id: string;
  reference_code: string;
  booking_id: string;
  opened_by_user_id: string;
  against_user_id: string;
  category: string;
  description: string;
  disputed_amount_kobo: number;
  currency_code: string;
  status: DisputeStatus;
  assigned_admin_id: string | null;
  internal_notes: string | null;
  resolution_type: DisputeResolutionType | null;
  resolution_summary: string | null;
  refund_amount_kobo: number;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    reference_code: string;
    title: string;
    status: string;
    city: string;
    agreed_amount_kobo: number | null;
  } | null;
  evidence?: Array<{
    id: string;
    file_name: string;
    storage_path: string;
    mime_type: string;
    description: string | null;
    created_at: string;
  }>;
  internal_notes_list?: Array<{
    id: string;
    admin_user_id: string;
    note: string;
    created_at: string;
  }>;
}

interface AdminDisputeManagerProps {
  initialDisputes: AdminDisputeItem[];
}

export function AdminDisputeManager({ initialDisputes }: AdminDisputeManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [disputes, setDisputes] = useState<AdminDisputeItem[]>(initialDisputes);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Active Selected Dispute for Arbitration Drawer/Modal
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);

  // Form State inside Modal
  const [editStatus, setEditStatus] = useState<DisputeStatus>("open");
  const [assignedAdmin, setAssignedAdmin] = useState<string>("");
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [resolutionType, setResolutionType] = useState<string>("");
  const [resolutionSummary, setResolutionSummary] = useState<string>("");
  const [refundNaira, setRefundNaira] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter disputes
  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = d.reference_code.toLowerCase().includes(q);
      const matchCat = d.category.toLowerCase().includes(q);
      const matchDesc = d.description.toLowerCase().includes(q);
      const matchBooking = d.booking?.reference_code?.toLowerCase().includes(q);
      if (!matchRef && !matchCat && !matchDesc && !matchBooking) return false;
    }
    return true;
  });

  const openArbitrationModal = (d: AdminDisputeItem) => {
    setSelectedDispute(d);
    setEditStatus(d.status);
    setAssignedAdmin(d.assigned_admin_id || "");
    setResolutionType(d.resolution_type || "");
    setResolutionSummary(d.resolution_summary || "");
    setRefundNaira(d.refund_amount_kobo ? d.refund_amount_kobo / 100 : 0);
    setNewInternalNote("");
    setFeedback(null);
  };

  const handleUpdateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setFeedback(null);
    const formData = new FormData();
    formData.append("disputeId", selectedDispute.id);
    formData.append("status", editStatus);
    if (assignedAdmin) formData.append("assignedAdminId", assignedAdmin);
    if (newInternalNote.trim()) formData.append("internalNote", newInternalNote.trim());
    if (resolutionType) formData.append("resolutionType", resolutionType);
    if (resolutionSummary.trim()) formData.append("resolutionSummary", resolutionSummary.trim());
    formData.append("refundAmountNaira", refundNaira.toString());

    startTransition(async () => {
      const res = await adminUpdateDisputeAction(formData);
      if (res.ok) {
        setFeedback({ type: "success", text: "Dispute case successfully updated and recorded!" });
        setNewInternalNote("");
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Metrics
  const openCount = disputes.filter((d) => d.status === "open").length;
  const underReviewCount = disputes.filter((d) => d.status === "under_review").length;
  const awaitingInfoCount = disputes.filter((d) => d.status === "awaiting_information").length;
  const resolvedCount = disputes.filter((d) => ["resolved", "resolved_for_customer", "resolved_for_professional"].includes(d.status)).length;
  const totalDisputedNaira = disputes.reduce((sum, d) => sum + (d.disputed_amount_kobo || 0), 0) / 100;

  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Disputes</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-600">{openCount}</span>
            {openCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <span className="text-[11px] text-slate-400">Needs initial triage</span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Under Review</span>
          <div className="text-2xl font-black text-blue-600">{underReviewCount}</div>
          <span className="text-[11px] text-slate-400">Investigating evidence</span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Awaiting Info</span>
          <div className="text-2xl font-black text-purple-600">{awaitingInfoCount}</div>
          <span className="text-[11px] text-slate-400">Evidence requested</span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
          <span className="text-[11px] text-slate-400">Formally adjudicated</span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Disputed Value</span>
          <div className="text-xl font-black text-slate-900 dark:text-white truncate">
            ₦{totalDisputedNaira.toLocaleString("en-NG")}
          </div>
          <span className="text-[11px] text-slate-400">Protected in escrow</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0D223A] p-4 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { key: "all", label: "All Cases" },
            { key: "open", label: "Open" },
            { key: "under_review", label: "Under Review" },
            { key: "awaiting_information", label: "Awaiting Info" },
            { key: "resolved", label: "Resolved" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.key
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, booking, category..."
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
          />
        </div>
      </div>

      {/* Disputes Data Table */}
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#071526] text-slate-700 dark:text-slate-200 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-[#163654]">
              <tr>
                <th className="py-4 px-6">Case Ref / Date</th>
                <th className="py-4 px-6">Booking Reference</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Disputed Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No disputes match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">{d.reference_code}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(d.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/bookings/${d.booking_id}`}
                        target="_blank"
                        className="font-mono font-bold text-[#0D9488] hover:underline block"
                      >
                        #{d.booking?.reference_code || d.booking_id.slice(0, 8)} ↗
                      </Link>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block max-w-xs">
                        {d.booking?.title || "Service Request"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {d.category.replace(/_/g, " ")}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{d.description}</p>
                    </td>
                    <td className="py-4 px-6 font-mono font-extrabold text-slate-900 dark:text-white">
                      ₦{((d.disputed_amount_kobo || 0) / 100).toLocaleString("en-NG")}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === "open"
                            ? "bg-amber-100 text-amber-800 dark:text-amber-300"
                            : d.status === "under_review"
                            ? "bg-blue-100 text-blue-800"
                            : d.status === "awaiting_information"
                            ? "bg-purple-100 text-purple-800"
                            : ["resolved", "resolved_for_customer", "resolved_for_professional"].includes(d.status)
                            ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => openArbitrationModal(d)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
                      >
                        Investigate &amp; Adjudicate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitration Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-[#163654] max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white uppercase tracking-wider">
                    Administrative Arbitration Console
                  </span>
                  <span className="font-mono text-xs text-slate-400">ID: {selectedDispute.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Dispute Case: {selectedDispute.reference_code}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Booking #{selectedDispute.booking?.reference_code || selectedDispute.booking_id} • Category:{" "}
                  <strong className="text-slate-800 dark:text-slate-100 capitalize">{selectedDispute.category.replace(/_/g, " ")}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
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

            {/* Case Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-[#071526] p-4 rounded-2xl border border-slate-200 dark:border-[#163654] space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  Dispute Summary &amp; Claim
                </span>
                <p className="text-slate-900 dark:text-white whitespace-pre-line leading-relaxed font-medium">
                  "{selectedDispute.description}"
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-[#163654] flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Claimed Disputed Value:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    ₦{((selectedDispute.disputed_amount_kobo || 0) / 100).toLocaleString("en-NG")}
                  </span>
                </div>
              </div>

              {/* Uploaded Evidence Gallery */}
              <div className="bg-slate-50 dark:bg-[#071526] p-4 rounded-2xl border border-slate-200 dark:border-[#163654] space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  Supporting Evidence Files ({selectedDispute.evidence?.length || 0})
                </span>
                {!selectedDispute.evidence || selectedDispute.evidence.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No evidence files attached to this case.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedDispute.evidence.map((ev) => (
                      <div key={ev.id} className="p-2 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-[#163654] flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[200px] font-bold text-slate-800 dark:text-slate-100">{ev.file_name}</span>
                        <a
                          href={ev.storage_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0D9488] font-bold hover:underline shrink-0 text-[10px]"
                        >
                          View File ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes Timeline */}
            <div className="bg-slate-50 dark:bg-[#071526] p-4 rounded-2xl border border-slate-200 dark:border-[#163654] space-y-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                Confidential Investigation Logs (Admin Only)
              </span>
              {selectedDispute.internal_notes ? (
                <div className="p-3 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-[#163654] text-slate-800 dark:text-slate-100 text-xs font-mono whitespace-pre-line max-h-32 overflow-y-auto">
                  {selectedDispute.internal_notes}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">No internal notes recorded yet.</p>
              )}
            </div>

            {/* Arbitration Form */}
            <form onSubmit={handleUpdateCase} className="space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Case Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Update Case Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as DisputeStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A] font-semibold"
                  >
                    <option value="open">Open (Initial triage)</option>
                    <option value="under_review">Under Review (Investigation active)</option>
                    <option value="awaiting_information">Awaiting Information (Waiting for party responses)</option>
                    <option value="resolved">Resolved (Adjudication decision applied)</option>
                    <option value="rejected">Rejected (Complaint dismissed / unfounded)</option>
                    <option value="closed">Closed (Arbitration completed)</option>
                  </select>
                </div>

                {/* Resolution Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Formal Resolution Type
                  </label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
                  >
                    <option value="">Select decision outcome...</option>
                    <option value="full_refund">Full Refund to Customer (100% Escrow Return)</option>
                    <option value="partial_refund">Partial Refund to Customer (Specify amount below)</option>
                    <option value="release_to_professional">Release Escrow to Specialist (Work verified satisfactory)</option>
                    <option value="rework_required">Order Specialist Rework (Mandatory rectification)</option>
                    <option value="rejected_unfounded">Reject Complaint as Unfounded</option>
                    <option value="mutual_agreement">Mutual Settlement Agreement</option>
                  </select>
                </div>
              </div>

              {/* Refund Amount (if partial refund) */}
              {resolutionType === "partial_refund" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Refund Amount to Customer (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={refundNaira}
                    onChange={(e) => setRefundNaira(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Add New Internal Investigation Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Add Confidential Investigation Note
                </label>
                <textarea
                  rows={2}
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  placeholder="Record findings from phone call with client or specialist, inspection photos review, etc..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
                />
              </div>

              {/* Resolution Summary / Formal Decision Documentation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Document Formal Arbitration Decision &amp; Notice to Parties
                </label>
                <textarea
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Explain findings, evidence evaluated, policy basis, and instructions dispatched to customer and specialist..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isPending ? "Recording Decision..." : "Apply Arbitration Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
