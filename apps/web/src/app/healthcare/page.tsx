import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getHealthcareFacilities } from "@/lib/supabase/healthcare";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";
import { HealthcareDirectoryClient } from "@/components/directories/healthcare-client";

export const metadata: Metadata = {
  title: "Healthcare Facility & Pharmacy Directory — EasyLife Nigeria",
  description:
    "Discover verified hospitals, specialized clinics, and community pharmacies across Port Harcourt, Lagos, and Abuja. Check operating hours, emergency services, and locations.",
};

interface HealthcarePageProps {
  searchParams: Promise<{
    type?: string;
    city?: string;
    lga?: string;
    q?: string;
    emergency?: string;
  }>;
}

export default async function HealthcareDirectoryPage({
  searchParams,
}: HealthcarePageProps) {
  const {
    type = "all",
    city = "All Cities",
    lga = "",
    q = "",
    emergency = "",
  } = await searchParams;

  const facilityType = (type === "hospital" || type === "clinic" || type === "pharmacy") ? type : "all";
  const emergencyOnly = emergency === "true";

  const facilities = await getHealthcareFacilities({
    facilityType,
    city: city === "All Cities" ? undefined : city,
    lga: lga || undefined,
    query: q || undefined,
    emergencyOnly,
  });

  return (
    <PublicShell>
      <PageHero
        badge="Public Healthcare Directory"
        title="Verified Hospitals, Clinics &amp; Pharmacies"
        description="Locate licensed medical facilities, primary healthcare clinics, and community pharmacies across Port Harcourt, Lagos, and Abuja."
      />

      {/* Prominent Legal & Medical Disclaimer Banner */}
      <section className="bg-amber-50 border-y border-amber-200 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <span className="text-base leading-none">ℹ️</span>
          <div>
            <strong className="font-bold">Public Information Directory Notice:</strong> EasyLife provides a directory of licensed healthcare facilities and community pharmacies for public convenience and emergency discovery. <strong>EasyLife is NOT a healthcare or clinical service provider</strong>, does not dispense medications, and does not conduct clinical triage. For urgent medical emergencies, please visit your nearest hospital emergency department immediately.
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <HealthcareDirectoryClient
          initialFacilities={facilities}
          defaultType={facilityType}
          defaultCity={city}
          defaultLga={lga}
          defaultQuery={q}
          defaultEmergency={emergencyOnly}
        />
      </section>
    </PublicShell>
  );
}
