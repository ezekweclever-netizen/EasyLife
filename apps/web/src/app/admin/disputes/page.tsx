import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { storageService } from "@/lib/storage/storage-service";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { AdminDisputeManager, AdminDisputeItem } from "@/components/admin/admin-dispute-manager";

export const metadata: Metadata = {
  title: "Service Dispute Arbitration & Case Management — Admin Portal | EasyLife",
  description: "Investigate customer disputes, review photographic evidence, assign administrators, and document binding resolution decisions.",
};

export default async function AdminDisputesPage() {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    redirect("/admin/login?next=%2Fadmin%2Fdisputes");
  }

  const [disputesRes, evidenceRes, notesRes] = await Promise.all([
    supabaseAdminFetch<any[]>(
      "/rest/v1/disputes?select=*,bookings(reference_code,title,status,city,agreed_amount_kobo)&order=created_at.desc&limit=100"
    ),
    supabaseAdminFetch<any[]>(
      "/rest/v1/dispute_evidence?select=*&order=created_at.asc&limit=200"
    ),
    supabaseAdminFetch<any[]>(
      "/rest/v1/dispute_internal_notes?select=*&order=created_at.asc&limit=300"
    ),
  ]);

  const rawDisputes = disputesRes.ok && Array.isArray(disputesRes.data) ? disputesRes.data : [];
  const rawEvidence = evidenceRes.ok && Array.isArray(evidenceRes.data) ? evidenceRes.data : [];
  const rawNotes = notesRes.ok && Array.isArray(notesRes.data) ? notesRes.data : [];

  const signedEvidence = await Promise.all(
    rawEvidence.map(async (ev) => {
      const sp = typeof ev.storage_path === "string" ? ev.storage_path : "";
      if (!sp || sp.startsWith("http://") || sp.startsWith("https://")) {
        return ev;
      }
      const signed = await storageService.createSignedUrl("dispute-evidence", sp, 3600);
      return {
        ...ev,
        storage_path: signed.signedUrl || sp,
      };
    })
  );

  const disputes: AdminDisputeItem[] = rawDisputes.map((d) => ({
    ...d,
    booking: d.bookings || null,
    evidence: signedEvidence.filter((ev) => ev.dispute_id === d.id),
    internal_notes_list: rawNotes.filter((n) => n.dispute_id === d.id),
  }));

  return (
    <div className="min-h-screen bg-[#FAF7F3] py-10 px-4 sm:px-6 lg:px-8 text-[#1F2328]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 dark:text-slate-100">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-100 font-semibold">Service Accountability</span>
              <span>/</span>
              <span className="text-purple-700 font-bold">Dispute Management</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Service Dispute Arbitration Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Arbitrate complaints, evaluate evidence, assign administrators, and ensure disputed bookings are never automatically completed without rigorous oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/reviews"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1F2328] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition shadow-xs"
            >
              ★ Review Moderation
            </Link>
            <Link
              href="/admin/categories"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1F2328] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition shadow-xs"
            >
              Categories
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#E8590C] text-white text-xs font-bold hover:bg-[#C84A06] transition shadow-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Dispute Manager Interactive Client */}
        <AdminDisputeManager initialDisputes={disputes} />
      </div>
    </div>
  );
}
