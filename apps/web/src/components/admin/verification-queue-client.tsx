"use client";

import React, { useState } from "react";
import {
  adminReviewDocumentAction,
  adminReviewVerificationAction,
} from "@/app/actions/admin";

interface VerificationDocItem {
  id: string;
  professional_id: string;
  document_type: string;
  document_url: string;
  verification_status: string;
  rejection_reason: string | null;
  created_at: string;
  professional_profiles?: {
    id: string;
    business_name: string;
    slug: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
}

interface VerificationQueueClientProps {
  initialDocs: VerificationDocItem[];
}

export function VerificationQueueClient({
  initialDocs,
}: VerificationQueueClientProps) {
  const [docs, setDocs] = useState<VerificationDocItem[]>(initialDocs);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDoc, setActiveDoc] = useState<VerificationDocItem | null>(null);
  const [modalMode, setModalMode] = useState<"approve" | "reject" | "overall_approve" | "overall_reject" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredDocs = docs.filter((d) => {
    if (statusFilter === "all") return true;
    return d.verification_status === statusFilter;
  });

  const handleDocumentReview = async (decision: "approved" | "rejected") => {
    if (!activeDoc) return;
    setActionError(null);

    const fd = new FormData();
    fd.append("documentId", activeDoc.id);
    fd.append("status", decision);
    if (reasonInput) fd.append("notes", reasonInput);

    const res = await adminReviewDocumentAction(fd);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? { ...d, verification_status: decision, rejection_reason: decision === "rejected" ? reasonInput : null }
          : d
      )
    );

    setTimeout(() => {
      setModalMode(null);
      setActiveDoc(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 1200);
  };

  const handleOverallDecision = async (decision: "approved" | "rejected") => {
    if (!activeDoc?.professional_id) return;
    setActionError(null);

    const fd = new FormData();
    fd.append("professionalId", activeDoc.professional_id);
    fd.append("decision", decision);
    if (reasonInput) fd.append("reason", reasonInput);

    const res = await adminReviewVerificationAction(fd);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setTimeout(() => {
      setModalMode(null);
      setActiveDoc(null);
      setReasonInput("");
      setActionSuccess(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Filter Documents:</span>
          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "approved", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredDocs.length}</strong> submitted documents
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Professional</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Verification Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No KYC documents in queue for this status.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {doc.professional_profiles?.business_name || "Professional"}
                      </div>
                      <div className="text-2xs text-slate-500">
                        {doc.professional_profiles?.profiles?.full_name || "—"} ({doc.professional_profiles?.profiles?.email || "—"})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 capitalize">
                        {doc.document_type.replace(/_/g, " ")}
                      </div>
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-2xs text-teal-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>📎 View File Evidence ↗</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.verification_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : doc.verification_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Under Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Document Level Decision */}
                      <button
                        onClick={() => {
                          setActiveDoc(doc);
                          setReasonInput("");
                          setActionError(null);
                          setActionSuccess(null);
                          setModalMode("approve");
                        }}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        Approve Doc
                      </button>
                      <button
                        onClick={() => {
                          setActiveDoc(doc);
                          setReasonInput("");
                          setActionError(null);
                          setActionSuccess(null);
                          setModalMode("reject");
                        }}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                      >
                        Reject Doc
                      </button>

                      {/* Overall Professional Status */}
                      <button
                        onClick={() => {
                          setActiveDoc(doc);
                          setReasonInput("");
                          setActionError(null);
                          setActionSuccess(null);
                          setModalMode("overall_approve");
                        }}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                      >
                        Accredit Pro
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {modalMode && activeDoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">
                {modalMode === "approve" && "Confirm Document Approval"}
                {modalMode === "reject" && "Reject Document Evidence"}
                {modalMode === "overall_approve" && "Grant Verified Badge to Professional"}
                {modalMode === "overall_reject" && "Reject Professional Verification"}
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Target: <strong className="text-slate-900">{activeDoc.professional_profiles?.business_name}</strong> • Document: <span className="capitalize">{activeDoc.document_type.replace(/_/g, " ")}</span>
            </p>

            {(modalMode === "reject" || modalMode === "overall_reject") && (
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Rejection Reason (Mandatory &amp; Logged) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="E.g. Document image is illegible, expired, or names do not match government ID."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                />
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-2xs font-semibold">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-2xs font-semibold">
                {actionSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {modalMode === "approve" && (
                <button
                  type="button"
                  onClick={() => handleDocumentReview("approved")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  Approve Document
                </button>
              )}

              {modalMode === "reject" && (
                <button
                  type="button"
                  onClick={() => handleDocumentReview("rejected")}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
                >
                  Confirm Rejection
                </button>
              )}

              {modalMode === "overall_approve" && (
                <button
                  type="button"
                  onClick={() => handleOverallDecision("approved")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
                >
                  Accredit Professional Badge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
