"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { fetchAdminProfessionals } from "@/app/actions/admin";

interface ProfessionalItem {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  callout_fee_kobo: number;
  verification_status: string;
  is_available: boolean;
  rating_average: number;
  rating_count: number;
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
}

interface ProfessionalManagerClientProps {
  initialPros: ProfessionalItem[];
}

export function ProfessionalManagerClient({
  initialPros,
}: ProfessionalManagerClientProps) {
  const [pros, setPros] = useState<ProfessionalItem[]>(initialPros);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPro, setSelectedPro] = useState<ProfessionalItem | null>(null);
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

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round(kobo / 100));
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleFilter} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name or trade..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved / Verified</option>
            <option value="pending">Pending KYC Review</option>
            <option value="unsubmitted">Unsubmitted</option>
            <option value="rejected">Rejected</option>
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
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
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
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {p.business_name}
                      </div>
                      <div className="text-2xs text-slate-500 truncate max-w-xs">
                        {p.headline || "Accredited Service Professional"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">
                        {p.profiles?.full_name || "—"}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {p.profiles?.email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {formatNaira(p.callout_fee_kobo || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.verification_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : p.verification_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Pending KYC
                        </span>
                      ) : p.verification_status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          ✕ Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-700">
                          Unsubmitted
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>⭐</span>
                        <span>{p.rating_average ? Number(p.rating_average).toFixed(1) : "5.0"}</span>
                        <span className="text-2xs font-normal text-slate-400">
                          ({p.rating_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPro(p)}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Inspect
                      </button>
                      <Link
                        href={`/admin/verifications?search=${encodeURIComponent(p.business_name)}`}
                        className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition inline-block"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">
                Professional Trade Dossier
              </div>
              <button
                onClick={() => setSelectedPro(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Business Name:</span>
                  <span className="font-bold text-slate-900">{selectedPro.business_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Slug:</span>
                  <span className="font-mono text-2xs text-slate-700">{selectedPro.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner Name:</span>
                  <span className="font-semibold text-slate-800">{selectedPro.profiles?.full_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{selectedPro.profiles?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{selectedPro.profiles?.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Callout Benchmark:</span>
                  <span className="font-bold text-slate-900">{formatNaira(selectedPro.callout_fee_kobo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="font-bold uppercase text-2xs">{selectedPro.verification_status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPro(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
