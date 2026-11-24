import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: "EasyLife Operations & Marketplace Administration",
  description:
    "Enterprise management console for user accounts, professional verification, dispute arbitration, service taxonomy, and marketplace governance.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/admin";

  // Allow the dedicated Admin Login route to render without triggering a redirect loop
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const adminCheck = await verifyAdminSession();

  if (!adminCheck.ok) {
    if (adminCheck.reason === "unauthenticated") {
      redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }

    // Authenticated user does NOT hold admin privileges -> block access cleanly
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
            🛡️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white">
              Administrator Access Restricted
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your signed-in account ({adminCheck.user?.email || "Authenticated User"}) does not hold{" "}
              <span className="text-teal-400 font-semibold">Platform Administrator</span> permissions for the EasyLife Operations Console.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition"
            >
              Return to User Dashboard
            </Link>
            <Link
              href="/admin/login"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition"
            >
              Sign In with Administrator Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminEmail = adminCheck.user.email || "admin@easylife.ng";
  const adminName = adminCheck.fullName;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071526] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Navigation Sidebar */}
      <AdminSidebar adminEmail={adminEmail} adminName={adminName} />

      {/* Main Administrative Work Canvas */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Operational Status Header */}
        <header className="h-14 bg-white dark:bg-[#0D223A] border-b border-slate-200 dark:border-[#163654] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                Production Marketplace Core
              </span>
            </div>
            <span className="hidden xl:inline-block text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Active Regional Hubs:
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">Port Harcourt • Lagos • Abuja</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
              🛡️ Audit Trail Immutable
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
              v1.0-prod
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
