import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getServiceCategories,
  getCustomerProfile,
  getServiceCatalogueTree,
} from "@/lib/supabase/customer";
import { getOperatingNeighbourhoods } from "@/lib/supabase/matching";
import { getProfessionalProfile } from "@/lib/supabase/pro";
import { ProRegisterWizard } from "@/components/pro/pro-register-wizard";

export const metadata: Metadata = {
  title: "Professional Onboarding & Registration — EasyLife Nigeria",
  description: "Register your technical trade business or artisan practice on EasyLife.",
};

export default async function ProRegisterPage() {
  const auth = await getAuthenticatedUser();
  const [categories, catalogueTree, neighbourhoods] = await Promise.all([
    getServiceCategories(),
    getServiceCatalogueTree(false, auth?.accessToken),
    getOperatingNeighbourhoods(),
  ]);

  let defaultUser: { fullName?: string; email?: string; phone?: string | null } | null = null;
  let existingProStatus: string | null = null;

  if (auth) {
    const [profile, proProfile] = await Promise.all([
      getCustomerProfile(auth.user.id, auth.accessToken),
      getProfessionalProfile(auth.user.id, auth.accessToken),
    ]);
    defaultUser = {
      fullName: profile?.full_name,
      email: profile?.email || auth.user.email || undefined,
      phone: profile?.phone,
    };
    existingProStatus = proProfile ? proProfile.verification_status : null;
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-semibold mb-3">
          Technician &amp; Artisan Registration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join Nigeria&apos;s Verified Service Network
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Select your specific trade services from our verified catalogue, declare qualifications, choose operating hubs across Port Harcourt, Lagos, and Abuja, and submit credentials for vetting.
        </p>
      </div>

      {existingProStatus && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-teal-950 block">
              You already have an EasyLife Professional Profile (Status: {existingProStatus})
            </span>
            <span className="text-teal-800">
              You can manage services, locations, availability, and KYC documents directly from your Professional Profile.
            </span>
          </div>
          <Link
            href="/pro/profile"
            className="px-4 py-2 rounded-xl bg-[#0D9488] text-white font-bold text-xs hover:bg-[#0F766E] transition shrink-0 text-center"
          >
            Manage Pro Profile →
          </Link>
        </div>
      )}

      <ProRegisterWizard
        categories={categories}
        catalogueTree={catalogueTree}
        neighbourhoods={neighbourhoods}
        defaultUser={defaultUser}
      />
    </div>
  );
}
