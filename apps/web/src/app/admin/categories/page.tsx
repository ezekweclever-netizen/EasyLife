import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategoriesAdmin } from "@/lib/supabase/matching";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";

export const metadata: Metadata = {
  title: "Service Category Management — EasyLife Administration",
  description: "Configure system service categories, icons, descriptions, and display ordering.",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Taxonomy Management
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Marketplace Categories
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Service Category Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage the accredited trade categories offered across Port Harcourt, Lagos, and Abuja.
          </p>
        </div>

        <Link
          href="/explore-services"
          target="_blank"
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline self-start sm:self-auto"
        >
          View Public Customer Catalog ↗
        </Link>
      </div>

      <AdminCategoryManager initialCategories={categories} />
    </div>
  );
}
