import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { EasyLifeLogo } from "@/components/ui/logo";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Sign In — EasyLife Nigeria",
  description:
    "Log in to your EasyLife account. Access your customer bookings, professional jobs, or commercial maintenance dashboard.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <PublicShell>
      <div className="py-12 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <EasyLifeLogo theme="light" size="md" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-semibold mb-4">
              <span>Secure Authentication</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Welcome Back to EasyLife
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to manage your bookings, quotes, or business facilities.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <LoginForm nextPath={next} oauthError={error} />
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>
              Operating in Port Harcourt, Lagos, and Abuja. <br />
              Need help accessing your account?{" "}
              <Link href="/help" className="text-[#0D9488] font-semibold hover:underline">
                Contact Customer Care
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
