import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/site/public-shell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { getJobVacancyBySlugOrId } from "@/app/actions/jobs";
import { JobDetailClient } from "@/components/jobs/job-detail-client";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const vacancy = await getJobVacancyBySlugOrId(id);

  if (!vacancy) {
    return {
      title: "Opportunity Not Found — EasyLife",
    };
  }

  return {
    title: `${vacancy.title} in ${vacancy.city} — EasyLife Jobs & Opportunities`,
    description: vacancy.description.slice(0, 160),
  };
}

export default async function JobOpportunityDetailPage({
  params,
}: JobDetailPageProps) {
  const { id } = await params;
  const vacancy = await getJobVacancyBySlugOrId(id);

  if (!vacancy) {
    notFound();
  }

  const auth = await getAuthenticatedUser();
  const profile = auth
    ? await getCustomerProfile(auth.user.id, auth.accessToken)
    : null;

  return (
    <PublicShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <JobDetailClient
          vacancy={vacancy}
          currentUser={
            auth
              ? {
                  id: auth.user.id,
                  email: auth.user.email || undefined,
                  fullName: profile?.full_name ?? undefined,
                }
              : null
          }
        />
      </div>
    </PublicShell>
  );
}
