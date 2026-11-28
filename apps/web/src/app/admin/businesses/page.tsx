import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminBusinesses } from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Commercial Businesses & Property Managers — EasyLife Administration",
  description: "Monitor registered property management firms, multi-branch facilities, and enterprise asset portfolios.",
};

export default async function AdminBusinessesPage() {
  const businesses = await fetchAdminBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Enterprise Portfolio
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Commercial &amp; Facility Entities
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Business &amp; Facility Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Oversee corporate accounts, manage multi-city branches, property allocations, and enterprise maintenance permissions.
          </p>
        </div>

        <Link
          href="/business"
          target="_blank"
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline self-start sm:self-auto"
        >
          View Business Portal ↗
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Registered Enterprise Accounts ({businesses.length})
          </div>
          <span className="text-2xs text-slate-400">
            Across Port Harcourt, Lagos &amp; Abuja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2328]/80 border-b border-slate-200 dark:border-[#2E343B] text-2xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Organization Name</th>
                <th className="py-3.5 px-4">Locations &amp; Branches</th>
                <th className="py-3.5 px-4">Properties</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No enterprise business accounts registered yet.
                  </td>
                </tr>
              ) : (
                businesses.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {b.name}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        slug: /{b.slug}
                      </div>
                      {b.description && (
                        <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {b.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {Array.isArray(b.business_locations) ? b.business_locations.length : 0} registered locations
                      </div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400">
                        {Array.isArray(b.business_locations) && b.business_locations.length > 0
                          ? b.business_locations.map((loc: any) => loc.city || loc.name).filter(Boolean).slice(0, 3).join(", ")
                          : "Headquarters only"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#F06A1F] border border-teal-200 dark:border-teal-800">
                        {Array.isArray(b.properties) ? b.properties[0]?.count || b.properties.length : 0} Assets / Sites
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-100">{b.contact_email || "No email"}</div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400">{b.contact_phone || "No phone"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
