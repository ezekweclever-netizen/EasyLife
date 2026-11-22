import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  buildProviderRequiredDocumentChecklist,
  getProfessionalProfile,
  getProfessionalServiceEligibilities,
} from "@/lib/supabase/pro";
import {
  getServiceCatalogueTree,
  getServiceCategories,
} from "@/lib/supabase/customer";
import { getOperatingNeighbourhoods } from "@/lib/supabase/matching";
import { DocumentUploadCard } from "@/components/pro/document-upload-card";
import { VerificationBanner } from "@/components/pro/verification-banner";
import { ProProfileEditor } from "@/components/pro/pro-profile-editor";
import { ProServicesManager } from "@/components/pro/pro-services-manager";
import { ProLocationsAvailabilityManager } from "@/components/pro/pro-locations-availability-manager";

export const metadata: Metadata = {
  title: "Professional Profile & Verification — EasyLife Pro",
  description: "Manage your trade profile, service offerings, approved locations, working hours, and verification documents.",
};

export default async function ProProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/profile");
  }

  const [profile, categories, catalogueTree, neighbourhoods] = await Promise.all([
    getProfessionalProfile(auth.user.id, auth.accessToken),
    getServiceCategories(),
    getServiceCatalogueTree(false, auth.accessToken),
    getOperatingNeighbourhoods(),
  ]);

  if (!profile) {
    redirect("/pro/register");
  }

  const catalogueServiceIds = (profile.services || [])
    .map((s) => s.service_id)
    .filter((id): id is string => Boolean(id));

  const eligibilities = await getProfessionalServiceEligibilities(
    profile.id,
    catalogueServiceIds,
    auth.accessToken
  );

  const checklist = buildProviderRequiredDocumentChecklist(profile);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
          Account &amp; Vetting
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          Professional Profile &amp; Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your business details, service offerings and qualifications, approved service locations, weekly schedule, and KYC credentials.
        </p>
      </div>

      {/* Verification Status Banner */}
      <VerificationBanner
        status={profile.verification_status}
        rejectionReason={profile.rejection_reason}
        submittedAt={profile.submitted_for_verification_at}
      />

      {/* Section 1: Editable Business Details & Availability Switch */}
      <ProProfileEditor profile={profile} />

      {/* Section 2: Service Offerings, Qualifications & Eligibility */}
      <ProServicesManager
        professionalId={profile.id}
        services={profile.services || []}
        categories={categories}
        catalogueTree={catalogueTree}
        eligibilities={eligibilities}
        defaultYearsExperience={profile.years_of_experience}
      />

      {/* Section 3: Approved Service Locations & Weekly Working Hours */}
      <ProLocationsAvailabilityManager
        professionalId={profile.id}
        primaryCity={profile.primary_city}
        primaryState={profile.primary_state}
        areas={profile.service_areas || []}
        availability={profile.availability || []}
        neighbourhoods={neighbourhoods}
      />

      {/* Section 4: Required Credentials Checklist & KYC Document Submission */}
      <DocumentUploadCard
        professionalId={profile.id}
        verificationStatus={profile.verification_status}
        existingDocuments={profile.documents || []}
        checklist={checklist}
      />
    </div>
  );
}
