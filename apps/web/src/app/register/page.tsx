import React from "react";
import type { Metadata } from "next";
import { PublicShell } from "@/components/site/public-shell";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Create an Account — EasyLife Nigeria",
  description:
    "Join EasyLife as a customer, verified service professional, business owner, or property manager in Port Harcourt, Lagos, or Abuja.",
};

interface RegisterPageProps {
  searchParams: Promise<{
    role?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { role } = await searchParams;

  return (
    <PublicShell>
      <div className="py-6 sm:py-10 bg-[#FAF7F3] dark:bg-[#1F2328]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5 sm:mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEBDD] dark:bg-[#2E343B] border border-[#E8590C]/30 text-[#E8590C] text-xs font-semibold mb-2.5">
              <span>Account Registration</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2328] dark:text-white">
              Join the EasyLife Network
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
              Everyday repairs and maintenance, backed by strict verification and escrow payment protection in Nigeria.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-10 shadow-xs">
            <RegisterForm defaultRole={role} />
          </div>

          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>
              By creating an account, your data is handled in compliance with the Nigeria Data Protection Act (NDPA).
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
