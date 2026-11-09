import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
} from "@/lib/supabase/pro";
import { getServiceCategories } from "@/lib/supabase/customer";
import { DocumentUploadCard } from "@/components/pro/document-upload-card";
import { VerificationBanner } from "@/components/pro/verification-banner";
import { ProServicesManager } from "@/components/pro/pro-services-manager";

export const metadata: Metadata = {
  title: "Professional Profile & Verification — EasyLife Pro",
  description: "Manage your trade profile, service areas, working hours, and verification documents.",
};

export default async function ProProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/profile");
  }

  const [profile, categories] = await Promise.all([
    getProfessionalProfile(auth.user.id, auth.accessToken),
    getServiceCategories(),
  ]);
  if (!profile) {
    redirect("/pro/register");
  }

  const baseCalloutNaira = (profile.base_callout_fee_kobo || 0) / 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
          Account &amp; Vetting
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Professional Profile &amp; Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Maintain your public credentials, operating areas, working hours, and official Nigerian identity documents.
        </p>
      </div>

      {/* Verification Status Banner */}
      <VerificationBanner
        status={profile.verification_status}
        rejectionReason={profile.rejection_reason}
        submittedAt={profile.submitted_for_verification_at}
      />

      {/* Section 1: Business & Profile Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Business &amp; Trade Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Public profile information displayed to prospective clients.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              profile.is_available
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {profile.is_available ? "● Available for Jobs" : "○ Currently Unavailable"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Trade / Business Name</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {profile.business_name}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">Headline</span>
            <span className="text-sm font-semibold text-slate-900 mt-1 block">
              {profile.headline || "Specialist Service Professional"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">Years of Experience</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {profile.years_of_experience} Years
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">Base Call-out Diagnosis Fee</span>
            <span className="text-sm font-bold text-[#0D9488] mt-1 block">
              ₦{baseCalloutNaira.toLocaleString("en-NG")}
            </span>
          </div>
        </div>

        <div>
          <span className="text-slate-500 font-medium block text-xs mb-1">
            Professional Bio &amp; Capabilities
          </span>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
            {profile.bio || "No description provided."}
          </div>
        </div>
      </div>

      {/* Section 2: Multiple Service Offerings Manager & Operating Areas */}
      <ProServicesManager
        professionalId={profile.id}
        services={profile.services || []}
        categories={categories}
      />

      {/* Section 2B: Operating Hub & Coverage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Operating Hub &amp; Coverage
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cities and districts you service across Port Harcourt, Lagos, and Abuja.
          </p>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 text-xs">
            <span className="font-bold text-teal-900 block">
              {profile.primary_city}, {profile.primary_state}
            </span>
            <span className="text-[11px] text-teal-700 mt-0.5 block">
              Primary Operating Base • 25km standard coverage
            </span>
          </div>

          {profile.service_areas &&
            profile.service_areas.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-800">
                  {a.lga_or_district} ({a.city})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {a.service_radius_km} km radius
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Section 3: Weekly Working Hours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Working Hours &amp; Availability Schedule
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Times when you can be booked for inspection and repairs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
            const avail = profile.availability?.find((a) => a.day_of_week === idx + 1);
            return (
              <div
                key={day}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center"
              >
                <span className="font-bold text-slate-900 block">{day}</span>
                <span className="text-[11px] text-[#0D9488] font-medium mt-1 block">
                  {avail ? `${avail.start_time.slice(0, 5)} - ${avail.end_time.slice(0, 5)}` : "08:00 - 18:00"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Secure Document Submission & Vetting Process */}
      <DocumentUploadCard
        professionalId={profile.id}
        existingDocuments={profile.documents || []}
      />
    </div>
  );
}
