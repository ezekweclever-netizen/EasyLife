"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ButtonLink, Button } from "@/components/ui/button";
import { resendVerificationEmailAction } from "@/app/actions/auth";

export function EmailVerifiedClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "success";
  const errorMessage = searchParams.get("message");

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    startTransition(async () => {
      const res = await resendVerificationEmailAction(resendEmail.trim());
      setResendStatus(res);
    });
  };

  const isSuccess = status === "success";

  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-[#F8FAFC] dark:bg-[#071526] min-h-[calc(100vh-6rem)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654] p-6 sm:p-8 shadow-sm text-center space-y-6">
          {isSuccess ? (
            <>
              {/* Verified Success State */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl font-bold shadow-xs">
                ✓
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Email Verified
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Your account has been successfully verified. You can now log in to EasyLife.
                </p>
              </div>

              <div className="pt-2">
                <ButtonLink
                  href="/login"
                  size="lg"
                  className="w-full justify-center text-base font-bold shadow-md"
                >
                  Log In
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              {/* Failed / Expired Verification State */}
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center text-3xl font-bold shadow-xs">
                ✕
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Verification Incomplete
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {errorMessage ||
                    "The email verification link is invalid, expired, or has already been used. Please request a new verification link below."}
                </p>
              </div>

              {/* Resend Verification Email Form */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-left space-y-3">
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Request a New Verification Link
                </h2>

                {resendStatus && (
                  <div
                    role="alert"
                    className={`p-3 rounded-xl text-xs font-medium ${
                      resendStatus.ok
                        ? "bg-emerald-50 dark:bg-emerald-950/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-950/60 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {resendStatus.message}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    disabled={isPending}
                    className="w-full h-10.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#24989A]"
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !resendEmail.trim()}
                    className="w-full justify-center font-bold"
                  >
                    {isPending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </form>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
                >
                  ← Return to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
