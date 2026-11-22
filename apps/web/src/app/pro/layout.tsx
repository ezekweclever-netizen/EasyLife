import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfessionalProfile } from "@/lib/supabase/pro";
import { ProHeader } from "@/components/pro/pro-header";

export const metadata: Metadata = {
  title: "Professional Portal — EasyLife Nigeria",
  description: "Manage service requests, quotations, escrow earnings, and verification.",
};

export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/dashboard");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071526] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <ProHeader
        businessName={profile?.business_name || auth.user.email?.split("@")[0] || "Professional"}
        verificationStatus={profile?.verification_status || "unsubmitted"}
        primaryCity={profile?.primary_city || "Port Harcourt"}
        avatarUrl={profile?.avatar_url}
        activeJobsCount={profile?.completed_jobs_count}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
