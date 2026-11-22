"use client";

import React, { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  updatePasswordAction,
  type PasswordRecoveryState,
} from "@/app/actions/auth";
import { PublicShell } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";

const initialState: PasswordRecoveryState = {
  status: "idle",
  message: "",
};

export default function ForgotPasswordPage() {
  const [recoveryToken, setRecoveryToken] = useState<string>("");
  const [requestState, requestAction, isRequestPending] = useActionState(
    requestPasswordResetAction,
    initialState
  );
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updatePasswordAction,
    initialState
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const tokenFromHash = hashParams.get("access_token");
    if (tokenFromHash) {
      setRecoveryToken(tokenFromHash);
    }
  }, []);

  return (
    <PublicShell>
      <div className="py-6 sm:py-10 bg-[#F8FAFC] dark:bg-[#071526] min-h-[calc(100vh-5.5rem)] flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {recoveryToken ? "Set a New Password" : "Reset Your Password"}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              {recoveryToken
                ? "Choose a strong new password (minimum 8 characters) for your EasyLife account."
                : "Enter the email address associated with your EasyLife account and we will send you a password reset link."}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-6 sm:p-8 shadow-xs">
            {recoveryToken ? (
              <form action={updateAction} className="space-y-5">
                <input type="hidden" name="accessToken" value={recoveryToken} />
                {updateState.status === "error" && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300"
                  >
                    {updateState.message}
                  </div>
                )}
                {updateState.status === "success" && (
                  <div
                    role="status"
                    className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-900 space-y-2"
                  >
                    <p>{updateState.message}</p>
                    <Link
                      href="/login"
                      className="inline-block font-bold text-[#0D9488] dark:text-[#5CD3D5] hover:underline"
                    >
                      Proceed to Sign In →
                    </Link>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-[#0F172A] dark:text-slate-200 mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full h-12 px-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#163654] bg-white dark:bg-[#0D223A] text-base text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-[#0F172A] dark:text-slate-200 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                    className="w-full h-12 px-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#163654] bg-white dark:bg-[#0D223A] text-base text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="Re-enter your new password"
                  />
                </div>

                <Button type="submit" fullWidth disabled={isUpdatePending}>
                  {isUpdatePending ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <form action={requestAction} className="space-y-5">
                {requestState.status === "error" && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300"
                  >
                    {requestState.message}
                  </div>
                )}
                {requestState.status === "success" && (
                  <div
                    role="status"
                    className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-900"
                  >
                    {requestState.message}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-semibold text-[#0F172A] dark:text-slate-200 mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full h-12 px-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#163654] bg-white dark:bg-[#0D223A] text-base text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    placeholder="e.g. name@example.com"
                  />
                </div>

                <Button type="submit" fullWidth disabled={isRequestPending}>
                  {isRequestPending ? "Sending Reset Link..." : "Send Password Reset Link"}
                </Button>

                <div className="text-center pt-1">
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-[#0D9488] dark:text-[#5CD3D5] hover:underline"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
