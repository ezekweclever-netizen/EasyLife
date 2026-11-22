import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
  getProQuotations,
} from "@/lib/supabase/pro";
import { ProQuotationList } from "@/components/pro/pro-quotation-list";

export const metadata: Metadata = {
  title: "Quotations Management — EasyLife Pro",
  description: "Track submitted quotes, customer acceptances, drafts, and itemized billing.",
};

export default async function ProQuotationsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/quotations");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);
  if (!profile) {
    redirect("/pro/register");
  }

  const quotations = await getProQuotations(profile.id, auth.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
            Estimates &amp; Invoicing
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Quotation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track itemized pricing sent to customers. When a client accepts, the booking is confirmed and funds are locked into Escrow.
          </p>
        </div>

        <Link
          href="/pro/jobs"
          className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs self-start sm:self-auto"
        >
          + Prepare New Quote
        </Link>
      </div>

      <ProQuotationList
        quotations={quotations}
        professionalId={profile.id}
      />
    </div>
  );
}
