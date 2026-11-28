import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
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
      <div className="py-5 sm:py-8 lg:py-10 bg-[#FAF7F3] dark:bg-[#1F2328] min-h-[calc(100vh-5.5rem)] flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEBDD] dark:bg-[#2E343B] border border-[#E8590C]/30 text-[#E8590C] text-xs font-semibold mb-2">
              <span>Secure Authentication</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2328] dark:text-white">
              Welcome Back to EasyLife
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Sign in to manage your bookings, quotes, or business facilities.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 sm:p-6 shadow-xs">
            <LoginForm nextPath={next} oauthError={error} />
          </div>

          <div className="mt-4 sm:mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>
              Operating in Port Harcourt, Lagos, and Abuja. Need help accessing your account?{" "}
              <Link href="/help" className="text-[#E8590C] font-semibold hover:underline">
                Contact Customer Care
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
