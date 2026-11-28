import React from "react";
import type { Metadata } from "next";
import { getActiveBusiness } from "@/app/actions/business";
import { getEmployerVacanciesAndApplications } from "@/app/actions/jobs";
import { BusinessNav } from "@/components/business/business-nav";
import { EmployerJobsClient } from "@/components/business/employer-jobs-client";

export const metadata: Metadata = {
  title: "Employer Jobs & Candidate Management — EasyLife",
  description:
    "Manage posted trade vacancies, review candidate applications, schedule interviews, and recruit verified artisans and technicians.",
};

export default async function BusinessJobsPage() {
  const business = await getActiveBusiness();
  const jobsData = await getEmployerVacanciesAndApplications();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1F2328] text-slate-900 dark:text-slate-100">
      <BusinessNav
        businessName={String(business?.name || "Employer Operations")}
        businessCity={String(business?.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmployerJobsClient
          initialData={jobsData}
          businessName={business?.name ? String(business.name) : undefined}
        />
      </main>
    </div>
  );
}
