"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminReviewDocumentAction,
  adminReviewVerificationAction,
} from "@/app/actions/admin";
import type { ProfessionalServiceEligibilityResult } from "@easylife/shared-types";

interface ProServiceSummary {
  id: string;
  service_id?: string | null;
  service_title?: string | null;
  qualification_notes?: string | null;
  certification_reference?: string | null;
  years_experience_in_service?: number | null;
  is_active: boolean;
  service_categories?: { name: string } | null;
  services?: {
    id: string;
    name: string;
    service_code: string;
    requires_trade_certification: boolean;
    requires_business_registration: boolean;
    min_years_experience: number;
  } | null;
}

interface VerificationDocItem {
  id: string;
  professional_id: string;
  document_type: string;
  document_url?: string | null;
  file_name?: string | null;
  storage_path?: string | null;
  document_number_masked?: string | null;
  verification_status: string;
  review_notes: string | null;
  created_at: string;
  professional_profiles?: {
    id: string;
    business_name: string;
    slug: string;
    user_id: string;
    provider_type?: string | null;
    years_of_experience?: number | null;
    verification_status?: string | null;
    rejection_reason?: string | null;
    primary_city?: string | null;
    profiles?: {
      full_name: string | null;
      email: string | null;
      phone?: string | null;
    } | null;
    professional_services?: ProServiceSummary[];
    professional_service_areas?: Array<{
      id: string;
      city: string;
      lga_or_district: string;
      neighbourhood?: string | null;
      is_active: boolean;
    }>;
    service_eligibilities?: Record<string, ProfessionalServiceEligibilityResult>;
  } | null;
}

interface VerificationQueueClientProps {
  initialDocs: VerificationDocItem[];
  initialSearch?: string;
}

export function VerificationQueueClient({
  initialDocs,
  initialSearch = "",
}: VerificationQueueClientProps) {
  const router = useRouter();
  const [docs, setDocs] = useState<VerificationDocItem[]>(initialDocs);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeDoc, setActiveDoc] = useState<VerificationDocItem | null>(null);
  const [modalMode, setModalMode] = useState<
    "approve" | "reject" | "overall_approve" | "overall_reject" | "overall_suspend" | null
  >(null);
  const [reasonInput, setReasonInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDocs = docs.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.verification_status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const biz = d.professional_profiles?.business_name?.toLowerCase() || "";
    const owner = d.professional_profiles?.profiles?.full_name?.toLowerCase() || "";
    const email = d.professional_profiles?.profiles?.email?.toLowerCase() || "";
    return matchesStatus && (biz.includes(q) || owner.includes(q) || email.includes(q));
  });

  const handleDocumentReview = async (decision: "approved" | "rejected") => {
    if (!activeDoc) return;
    setActionError(null);
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append("documentId", activeDoc.id);
    fd.append("status", decision);
    if (reasonInput.trim()) fd.append("notes", reasonInput.trim());

    const res = await adminReviewDocumentAction(fd);
    setIsSubmitting(false);

    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? {
              ...d,
              verification_status: decision,
              review_notes: reasonInput.trim() || d.review_notes,
            }
          : d
      )
    );
    router.refresh();

    setTimeout(() => {
      setModalMode(null);
      setActiveDoc(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 900);
  };

  const handleOverallDecision = async (decision: "approved" | "rejected" | "suspended") => {
    if (!activeDoc?.professional_id) return;
    setActionError(null);
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append("professionalId", activeDoc.professional_id);
    fd.append("decision", decision);
    if (reasonInput.trim()) fd.append("reason", reasonInput.trim());

    const res = await adminReviewVerificationAction(fd);
    setIsSubmitting(false);

    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    const targetProId = activeDoc.professional_id;
    setDocs((prev) =>
      prev.map((d) => {
        if (d.professional_id !== targetProId) return d;
        const syncedDocStatus =
          decision === "approved" || decision === "rejected"
            ? d.verification_status === "pending"
              ? decision
              : d.verification_status
            : d.verification_status;
        return {
          ...d,
          verification_status: syncedDocStatus,
          review_notes:
            syncedDocStatus === decision && reasonInput.trim() ? reasonInput.trim() : d.review_notes,
          professional_profiles: d.professional_profiles
            ? {
                ...d.professional_profiles,
                verification_status: decision,
                rejection_reason:
                  decision === "rejected" || decision === "suspended" ? reasonInput.trim() : null,
              }
            : d.professional_profiles,
        };
      })
    );
    router.refresh();

    setTimeout(() => {
      setModalMode(null);
      setActiveDoc(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 900);
  };

  const renderProStatusBadge = (status?: string | null) => {
    if (status === "approved") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Pro: Verified
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Pro: Rejected
        </span>
      );
    }
    if (status === "suspended") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 dark:bg-slate-700 text-white border border-slate-700">
          Pro: Suspended
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Pro: Pending Review
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        Pro: {status || "unsubmitted"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-[#0D223A] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#163654]/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Filter Documents:</span>
          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "approved", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by business or owner..."
            className="h-9 w-60 sm:w-72 px-3 rounded-xl border border-slate-200 dark:border-[#163654] text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/30 focus:outline-none"
          />
          <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            Showing <strong className="text-slate-800 dark:text-slate-100">{filteredDocs.length}</strong> documents
          </div>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654]/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#071526]/80 border-b border-slate-200 dark:border-[#163654] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Professional &amp; Trade</th>
                <th className="py-3.5 px-4">Document Evidence</th>
                <th className="py-3.5 px-4">Requested Services &amp; Eligibility</th>
                <th className="py-3.5 px-4">Doc Status</th>
                <th className="py-3.5 px-4 text-right">Verification Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No KYC documents in queue for this filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const pro = doc.professional_profiles;
                  const services = (pro?.professional_services || []).filter((s) => s.is_active);
                  const eligibilities = pro?.service_eligibilities || {};

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/60 transition align-top">
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {pro?.business_name || "Professional"}
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400">
                          {pro?.profiles?.full_name || "—"} ({pro?.profiles?.email || "—"})
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {renderProStatusBadge(pro?.verification_status)}
                          {pro?.primary_city && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {pro.primary_city} • {pro.years_of_experience ?? 0} yrs
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                          {doc.document_type.replace(/_/g, " ")}
                        </div>
                        {doc.document_number_masked && (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            ID: {doc.document_number_masked}
                          </div>
                        )}
                        {doc.document_url ? (
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-2xs text-teal-600 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                          >
                            <span>📎 View File Evidence ({doc.file_name || "Document"}) ↗</span>
                          </a>
                        ) : (
                          <span className="text-2xs text-slate-400 mt-0.5 block">
                            📎 {doc.file_name || doc.storage_path || "Submitted metadata record"}
                          </span>
                        )}
                        {doc.review_notes && (
                          <p className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 mt-1">
                            Note: {doc.review_notes}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono">
                          Submitted {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1.5 max-w-xs">
                        {services.length === 0 ? (
                          <span className="text-[11px] text-slate-400">No services listed yet</span>
                        ) : (
                          services.slice(0, 3).map((s) => {
                            const elig = s.service_id ? eligibilities[s.service_id] : undefined;
                            return (
                              <div key={s.id} className="text-[11px] border-l-2 border-slate-200 dark:border-[#163654] pl-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {s.service_title || s.services?.name || s.service_categories?.name || "Service"}
                                  </span>
                                  {elig && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        elig.eligible
                                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                      }`}
                                    >
                                      {elig.eligible ? "Eligible" : "Needs Reqs"}
                                    </span>
                                  )}
                                </div>
                                {s.certification_reference && (
                                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                    Cert: {s.certification_reference}
                                  </div>
                                )}
                                {elig && !elig.eligible && elig.missing_requirements.length > 0 && (
                                  <div className="text-[10px] text-amber-800 dark:text-amber-300">
                                    {elig.missing_requirements[0]}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                        {services.length > 3 && (
                          <span className="text-[10px] text-slate-400 block">
                            +{services.length - 3} more services
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.verification_status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Verified
                          </span>
                        ) : doc.verification_status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ⏳ Under Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            ✕ Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5 min-w-[210px]">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Doc:</span>
                            <button
                              onClick={() => {
                                setActiveDoc(doc);
                                setReasonInput("");
                                setActionError(null);
                                setActionSuccess(null);
                                setModalMode("approve");
                              }}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActiveDoc(doc);
                                setReasonInput("");
                                setActionError(null);
                                setActionSuccess(null);
                                setModalMode("reject");
                              }}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                            >
                              Reject
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Pro:</span>
                            <button
                              onClick={() => {
                                setActiveDoc(doc);
                                setReasonInput("");
                                setActionError(null);
                                setActionSuccess(null);
                                setModalMode("overall_approve");
                              }}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-slate-900 dark:bg-teal-700 text-white hover:bg-slate-800 transition"
                            >
                              Accredit
                            </button>
                            <button
                              onClick={() => {
                                setActiveDoc(doc);
                                setReasonInput("");
                                setActionError(null);
                                setActionSuccess(null);
                                setModalMode("overall_reject");
                              }}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-rose-900 text-white hover:bg-rose-800 transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setActiveDoc(doc);
                                setReasonInput("");
                                setActionError(null);
                                setActionSuccess(null);
                                setModalMode("overall_suspend");
                              }}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition"
                            >
                              Suspend
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {modalMode && activeDoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0D223A] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-[#163654]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                {modalMode === "approve" && "Confirm Document Approval"}
                {modalMode === "reject" && "Reject Document Evidence"}
                {modalMode === "overall_approve" && "Grant Verified Badge to Professional"}
                {modalMode === "overall_reject" && "Reject Professional Verification"}
                {modalMode === "overall_suspend" && "Suspend Professional Account"}
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Target:{" "}
              <strong className="text-slate-900 dark:text-white">
                {activeDoc.professional_profiles?.business_name}
              </strong>{" "}
              • Document:{" "}
              <span className="capitalize">{activeDoc.document_type.replace(/_/g, " ")}</span>
            </p>

            {/* Identity & Account Match Cross-Check Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-[#163654] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-[11px] tracking-wider">
                  Identity &amp; Registration Cross-Check
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 dark:text-[#5CD3D5]">
                  Audited
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Registered Full Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">
                    {activeDoc.professional_profiles?.profiles?.full_name || "⚠️ Name not set"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Registered Business:</span>
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">
                    {activeDoc.professional_profiles?.business_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Document ID (Masked):</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 block">
                    {activeDoc.document_number_masked || "On document image"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Document Type:</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize block">
                    {activeDoc.document_type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {!activeDoc.professional_profiles?.profiles?.full_name && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                  <span>⚠️ Critical: Account full name missing. Review document names carefully before approving.</span>
                </div>
              )}
            </div>

            {modalMode === "overall_approve" &&
              activeDoc.professional_profiles?.service_eligibilities &&
              Object.values(activeDoc.professional_profiles.service_eligibilities).some(
                (e) => !e.eligible
              ) && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold">Service Eligibility Diagnostic Notice:</div>
                  <p>
                    Accrediting approves this provider&apos;s overall identity &amp; any pending documents. Any individual services requiring additional trade or CAC certificates remain flagged until uploaded.
                  </p>
                </div>
              )}

            {(modalMode === "reject" ||
              modalMode === "overall_reject" ||
              modalMode === "overall_suspend" ||
              modalMode === "approve") && (
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  {modalMode === "approve"
                    ? "Reviewer Notes (Optional)"
                    : "Reason (Min 5 Characters, Mandatory & Audited) *"}
                </label>
                <textarea
                  required={modalMode !== "approve"}
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={
                    modalMode === "approve"
                      ? "Optional internal review comment..."
                      : "E.g. Document image is illegible, expired, or does not match applicant profile."
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                />
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-2xs font-semibold">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-2xs font-semibold">
                {actionSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>

              {modalMode === "approve" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDocumentReview("approved")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                >
                  Approve Document
                </button>
              )}

              {modalMode === "reject" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDocumentReview("rejected")}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                >
                  Confirm Rejection
                </button>
              )}

              {modalMode === "overall_approve" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleOverallDecision("approved")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                >
                  Accredit Professional Badge
                </button>
              )}

              {modalMode === "overall_reject" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleOverallDecision("rejected")}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                >
                  Confirm Pro Rejection
                </button>
              )}

              {modalMode === "overall_suspend" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleOverallDecision("suspended")}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                >
                  Confirm Suspension
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
