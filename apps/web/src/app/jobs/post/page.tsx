import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/site/public-shell";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { PostVacancyForm } from "@/components/jobs/post-vacancy-form";

export const metadata: Metadata = {
  title: "Post a Trade Role or Vacancy — EasyLife Nigeria",
  description:
    "Post job vacancies and vocational apprenticeships to verified technicians, artisans, and skilled tradespeople in Port Harcourt, Lagos, and Abuja.",
};

export default async function PostJobPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent("/jobs/post")}`);
  }

  return (
    <PublicShell>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <PostVacancyForm />
      </main>
    </PublicShell>
  );
}
