import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { EasyLifeLogo } from "@/components/ui/logo";
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
      <div className="py-12 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <EasyLifeLogo theme="light" size="md" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-xs font-semibold mb-4">
              <span>Account Registration</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Join the EasyLife Network
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Everyday repairs and maintenance, backed by strict verification and escrow payment protection in Nigeria.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
            <RegisterForm defaultRole={role} />
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>
              By creating an account, your data is handled in compliance with the Nigeria Data Protection Act (NDPA).
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
