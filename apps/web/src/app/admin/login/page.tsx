import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { EasyLifeLogo } from "@/components/ui/logo";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Administrator Console Sign In — EasyLife Operations",
  description: "Restricted access for authorised EasyLife marketplace administrators.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const adminCheck = await verifyAdminSession();
  const { next = "/admin" } = await searchParams;
  const safeNext = next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin";

  if (adminCheck.ok) {
    redirect(safeNext);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="focus-visible:outline-2 focus-visible:outline-teal-400 rounded-lg">
            <EasyLifeLogo theme="dark" size="md" showSlogan={false} />
          </Link>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
              🛡️ Marketplace Operations Security
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Administrator Sign In
            </h1>
            <p className="text-xs text-slate-400 max-w-sm">
              Sign in with an authorised EasyLife administrator account to review KYC verifications, resolve disputes, and govern hub operations across Port Harcourt, Lagos, and Abuja.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <AdminLoginForm nextPath={safeNext} />
        </div>

        <p className="text-center text-[11px] text-slate-500">
          All administrative sessions and mutations are recorded to immutable audit logs.
        </p>
      </div>
    </div>
  );
}
