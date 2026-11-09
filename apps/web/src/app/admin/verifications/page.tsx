import React from "react";
import type { Metadata } from "next";
import { fetchAdminDocuments } from "@/app/actions/admin";
import { VerificationQueueClient } from "@/components/admin/verification-queue-client";

export const metadata: Metadata = {
  title: "KYC & Professional Verification Queue — EasyLife Administration",
  description: "Audit artisan credentials, CAC licenses, and identity documents with binding administrative accreditation.",
};

export default async function AdminVerificationsPage() {
  const docs = await fetchAdminDocuments("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              KYC &amp; Trust Accreditation
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Vetting Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Verification Management Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review identity proofs, vocational trade certificates, and enterprise registrations to prevent unverified providers from operating on the marketplace.
          </p>
        </div>
      </div>

      <VerificationQueueClient initialDocs={docs as any} />
    </div>
  );
}
