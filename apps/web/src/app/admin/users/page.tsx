import React from "react";
import type { Metadata } from "next";
import { fetchAdminUsers } from "@/app/actions/admin";
import { UserManagerClient } from "@/components/admin/user-manager-client";

export const metadata: Metadata = {
  title: "User Account Management — EasyLife Administration",
  description: "Search, filter, inspect profiles, and manage suspensions with documented audit records.",
};

export default async function AdminUsersPage() {
  const result = await fetchAdminUsers({ page: 1, limit: 25 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2E343B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
              Identity &amp; Accounts
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Role-Based Marketplace Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            User Account Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search marketplace members, inspect role assignments, and execute audit-logged suspensions or reinstatements.
          </p>
        </div>
      </div>

      <UserManagerClient
        initialUsers={result.users as any}
        initialCount={result.totalCount}
      />
    </div>
  );
}
