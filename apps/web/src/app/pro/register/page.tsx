import React from "react";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getServiceCategories, getCustomerProfile } from "@/lib/supabase/customer";
import { ProRegisterWizard } from "@/components/pro/pro-register-wizard";

export const metadata: Metadata = {
  title: "Professional Onboarding & Registration — EasyLife Nigeria",
  description: "Register your technical trade business or artisan practice on EasyLife.",
};

export default async function ProRegisterPage() {
  const auth = await getAuthenticatedUser();
  const categories = await getServiceCategories();

  let defaultUser: { fullName?: string; email?: string; phone?: string | null } | null = null;
  if (auth) {
    const profile = await getCustomerProfile(auth.user.id, auth.accessToken);
    defaultUser = {
      fullName: profile?.full_name,
      email: profile?.email || auth.user.email || undefined,
      phone: profile?.phone,
    };
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-semibold mb-3">
          Technician &amp; Artisan Registration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join Nigeria&apos;s Verified Service Network
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Create your professional profile, configure your service categories, set your operating pilot city, and submit documents for vetting.
        </p>
      </div>

      <ProRegisterWizard
        categories={categories}
        defaultUser={defaultUser}
      />
    </div>
  );
}
