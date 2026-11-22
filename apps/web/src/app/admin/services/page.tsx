import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminCatalogueData } from "@/lib/supabase/admin-catalogue";
import { AdminServiceManager } from "@/components/admin/admin-service-manager";

export const metadata: Metadata = {
  title: "Individual Services & Eligibility Rules — EasyLife Administration",
  description:
    "Create and manage catalogue services, pricing bands, eligibility criteria, verification documents, and per-service requirements.",
};

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string }>;
}) {
  const [snapshot, resolvedParams] = await Promise.all([
    fetchAdminCatalogueData(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Service Catalogue
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tier 3 Services &amp; Eligibility Rules
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Individual Services &amp; Requirements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage services within categories and subcategories, pricing ranges, images,
            differentiated provider eligibility, and service-specific requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/categories"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526] transition"
          >
            ← Back to Categories
          </Link>
          <Link
            href="/explore-services"
            target="_blank"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:bg-teal-950/60 transition"
          >
            Public Catalog ↗
          </Link>
        </div>
      </div>

      <AdminServiceManager
        initialServices={snapshot.services}
        categories={snapshot.categories}
        initialCategoryFilter={resolvedParams.category || ""}
        initialSubcategoryFilter={resolvedParams.subcategory || ""}
      />
    </div>
  );
}
