"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminReviewVerificationAction,
  fetchAdminProfessionals,
} from "@/app/actions/admin";

interface ProfessionalItem {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  bio?: string | null;
  provider_type?: string | null;
  years_of_experience?: number | null;
  primary_city?: string | null;
  base_callout_fee_kobo: number;
  verification_status: string;
  rejection_reason?: string | null;
  is_available: boolean;
  average_rating: number;
  review_count: number;
  created_at: string;
  profiles?: {
    id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    is_suspended: boolean;
  } | null;
  professional_services?: Array<{
    id: string;
    service_title?: string | null;
    min_price_kobo: number;
    max_price_kobo?: number | null;
    qualification_notes?: string | null;
    certification_reference?: string | null;
    years_experience_in_service?: number | null;
    is_active: boolean;
    service_categories?: { name: string } | null;
    services?: { name: string; service_code: string } | null;
  }>;
  professional_service_areas?: Array<{
    id: string;
    city: string;
    lga_or_district: string;
    neighbourhood?: string | null;
    service_radius_km: number;
    is_primary: boolean;
    is_active: boolean;
  }>;
  professional_documents?: Array<{
    id: string;
    document_type: string;
    file_name: string;
    verification_status: string;
    review_notes?: string | null;
    created_at: string;
  }>;
}

interface ProfessionalManagerClientProps {
  initialPros: ProfessionalItem[];
  initialStatus?: string;
}

export function ProfessionalManagerClient({
  initialPros,
  initialStatus = "all",
}: ProfessionalManagerClientProps) {
  const router = useRouter();
  const [pros, setPros] = useState<ProfessionalItem[]>(initialPros);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedPro, setSelectedPro] = useState<ProfessionalItem | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [modalFeedback, setModalFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = await fetchAdminProfessionals({
        search,
        verificationStatus: statusFilter,
      });
      setPros((data as unknown as ProfessionalItem[]) || []);
    });
  };

  const handleVerificationDecision = (
    pro: ProfessionalItem,
    decision: "approved" | "rejected" | "suspended"
  ) => {
    setModalFeedback(null);
    const fd = new FormData();
    fd.append("professionalId", pro.id);
    fd.append("decision", decision);
    if (decisionReason.trim()) fd.append("reason", decisionReason.trim());

    startTransition(async () => {
      const res = await adminReviewVerificationAction(fd);
      setModalFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setPros((prev) =>
          prev.map((item) =>
            item.id === pro.id
              ? {
                  ...item,
                  verification_status: decision,
                  rejection_reason:
                    decision === "rejected" || decision === "suspended"
                      ? decisionReason.trim()
                      : null,
                }
              : item
          )
        );
        setSelectedPro((prev) =>
          prev && prev.id === pro.id
            ? {
                ...prev,
                verification_status: decision,
                rejection_reason:
                  decision === "rejected" || decision === "suspended"
                    ? decisionReason.trim()
                    : null,
              }
            : prev
        );
        setDecisionReason("");
        router.refresh();
      }
    });
  };

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round((kobo || 0) / 100));
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white dark:bg-[#1F2328] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E343B]/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row flex-1 sm:items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name or trade..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved / Verified</option>
            <option value="pending">Pending KYC Review</option>
            <option value="unsubmitted">Unsubmitted</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isPending ? "Filtering..." : "Search"}
          </button>
        </form>

        <Link
          href="/admin/verifications"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>🛡️</span>
          <span>Open Verification Queue →</span>
        </Link>
      </div>

      {/* Professionals Table */}
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2328]/80 border-b border-slate-200 dark:border-[#2E343B] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Business / Trade</th>
                <th className="py-3.5 px-4">Owner Profile</th>
                <th className="py-3.5 px-4">Callout Fee</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No professionals found matching the selected filters.
                  </td>
                </tr>
              ) : (
                pros.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.business_name}
                      </div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {p.headline || "Accredited Service Professional"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.primary_city || "Port Harcourt"} •{" "}
                        {(p.professional_services || []).length} services •{" "}
                        {p.is_available ? "Available" : "Paused"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-100 font-semibold">
                        {p.profiles?.full_name || "—"}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {p.profiles?.email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {formatNaira(p.base_callout_fee_kobo || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.verification_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Verified
                        </span>
                      ) : p.verification_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          ⏳ Pending KYC
                        </span>
                      ) : p.verification_status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ Rejected
                        </span>
                      ) : p.verification_status === "suspended" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-800 text-white">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          Unsubmitted
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                        <span>⭐</span>
                        <span>
                          {p.review_count > 0 && p.average_rating
                            ? Number(p.average_rating).toFixed(1)
                            : "New"}
                        </span>
                        <span className="text-2xs font-normal text-slate-400">
                          ({p.review_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedPro(p);
                          setDecisionReason("");
                          setModalFeedback(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                      >
                        Inspect
                      </button>
                      <Link
                        href={`/admin/verifications?search=${encodeURIComponent(p.business_name)}`}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition inline-block"
                      >
                        KYC Docs →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pro Detail Modal */}
      {selectedPro && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-[#2E343B] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                Professional Trade Dossier
              </div>
              <button
                onClick={() => setSelectedPro(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-[#1F2328] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Business Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPro.business_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Owner &amp; Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedPro.profiles?.full_name || "—"} ({selectedPro.profiles?.email || "—"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Provider Type &amp; Experience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedPro.provider_type || "trade_technician"} • {selectedPro.years_of_experience ?? 0} yrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Callout Benchmark</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatNaira(selectedPro.base_callout_fee_kobo)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Verification Status</span>
                  <span className="font-bold uppercase text-2xs">{selectedPro.verification_status}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Primary Hub &amp; Availability</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedPro.primary_city || "Port Harcourt"} •{" "}
                    {selectedPro.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              {/* Services & Qualifications */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  Service Offerings ({(selectedPro.professional_services || []).length})
                </h4>
                {(selectedPro.professional_services || []).length === 0 ? (
                  <p className="text-slate-400">No service offerings added.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedPro.professional_services || []).map((ps) => (
                      <div key={ps.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-white dark:bg-[#1F2328]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {ps.service_title || ps.services?.name || ps.service_categories?.name || "Service"}
                          </span>
                          <span className="font-mono text-[#E8590C] font-bold">
                            {formatNaira(ps.min_price_kobo)}
                          </span>
                        </div>
                        {(ps.certification_reference || ps.qualification_notes) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {ps.certification_reference && `Cert: ${ps.certification_reference} `}
                            {ps.qualification_notes && `• ${ps.qualification_notes}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Areas & KYC Docs Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">
                    Operating Locations ({(selectedPro.professional_service_areas || []).length})
                  </h4>
                  {(selectedPro.professional_service_areas || []).map((area) => (
                    <div key={area.id} className="p-2 rounded-lg bg-slate-50 dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] text-[11px]">
                      {area.neighbourhood ? `${area.neighbourhood}, ` : ""}
                      {area.lga_or_district} ({area.city}) • {area.service_radius_km}km
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">
                    Submitted KYC Docs ({(selectedPro.professional_documents || []).length})
                  </h4>
                  {(selectedPro.professional_documents || []).map((doc) => (
                    <div key={doc.id} className="p-2 rounded-lg bg-slate-50 dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] text-[11px] flex justify-between">
                      <span className="capitalize">{doc.document_type.replace(/_/g, " ")}</span>
                      <span className="font-bold uppercase">{doc.verification_status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Governance Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Admin Review / Governance Note (required min 5 chars to Reject or Suspend)
                </label>
                <input
                  type="text"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Enter reason for rejection, suspension, or verification note..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                />

                {modalFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-semibold ${
                      modalFeedback.ok
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {modalFeedback.msg}
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleVerificationDecision(selectedPro, "approved")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Approve Pro
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleVerificationDecision(selectedPro, "rejected")}
                      className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Reject Pro
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleVerificationDecision(selectedPro, "suspended")}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Suspend Pro
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPro(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
