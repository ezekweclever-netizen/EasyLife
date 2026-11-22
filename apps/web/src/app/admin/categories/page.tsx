import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminCatalogueData } from "@/lib/supabase/admin-catalogue";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";

export const metadata: Metadata = {
  title: "Service Categories & Subcategories — EasyLife Administration",
  description:
    "Manage main service categories, subcategories, images, keywords, homepage visibility, and display ordering.",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const snapshot = await fetchAdminCatalogueData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#163654]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Taxonomy Management
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tier 1 &amp; Tier 2 Catalogue Hierarchy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Service Categories &amp; Subcategories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize main categories, nested subcategories, catalogue images, search keywords,
            homepage visibility, and commission defaults.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/services"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            Manage Individual Services →
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

      <AdminCategoryManager initialCategories={snapshot.categories} />
    </div>
  );
}
