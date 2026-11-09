import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
  getEligibleJobRequests,
} from "@/lib/supabase/pro";
import { ProJobsManager } from "@/components/pro/pro-jobs-manager";

export const metadata: Metadata = {
  title: "Service Requests & Job Management — EasyLife Pro",
  description: "Browse verified service requests, submit quotations, and manage jobs.",
};

export default async function ProJobsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/jobs");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);
  if (!profile) {
    redirect("/pro/register");
  }

  const [openRequests, activeJobs, completedJobs] = await Promise.all([
    getEligibleJobRequests(
      { city: profile.primary_city, proId: profile.id, statusFilter: "open" },
      auth.accessToken
    ),
    getEligibleJobRequests(
      { proId: profile.id, statusFilter: "active" },
      auth.accessToken
    ),
    getEligibleJobRequests(
      { proId: profile.id, statusFilter: "completed" },
      auth.accessToken
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
          Job Dispatch &amp; Operations
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Service Requests &amp; Active Jobs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review legitimate customer repair requests, prepare itemized quotations, update appointments, and request completion sign-off.
        </p>
      </div>

      <ProJobsManager
        initialOpenRequests={openRequests}
        initialActiveJobs={activeJobs}
        initialCompletedJobs={completedJobs}
        professionalId={profile.id}
        isVerified={profile.verification_status === "approved"}
      />
    </div>
  );
}
