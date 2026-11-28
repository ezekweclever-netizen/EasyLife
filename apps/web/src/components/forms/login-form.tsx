"use client";

import React, { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { loginAction, resendVerificationEmailAction } from "@/app/actions/auth";
import type { FormActionState, LoginField } from "@/lib/validation/forms";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: FormActionState<LoginField> = {
  status: "idle",
  values: {},
  fieldErrors: {},
};

export function LoginForm({
  nextPath,
  oauthError,
}: {
  nextPath?: string;
  oauthError?: string;
} = {}) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isResending, startResendTransition] = useTransition();

  const isUnverified =
    state.status === "error" &&
    state.message?.toLowerCase().includes("not been verified");

  const handleResend = () => {
    const emailToResend = state.values?.email;
    if (!emailToResend) return;
    startResendTransition(async () => {
      const res = await resendVerificationEmailAction(emailToResend);
      setResendStatus(res);
    });
  };

  return (
    <div className="space-y-3.5">
      {oauthError && (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-900 flex items-start gap-2"
        >
          <span className="font-bold text-amber-700 dark:text-amber-300 mt-0.5">!</span>
          <span>{oauthError}</span>
        </div>
      )}

      <GoogleSignInButton label="Continue with Google" nextPath={nextPath} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-[#2E343B]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-[#1F2328] px-2.5 text-slate-400 font-semibold">
            or sign in with email
          </span>
        </div>
      </div>

      <form action={formAction} noValidate className="space-y-3.5">
        {nextPath && <input type="hidden" name="next" value={nextPath} />}
        {state.status === "error" && state.message && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 dark:bg-red-950/60 dark:bg-red-950/40 border border-red-200 dark:border-red-800 dark:border-red-900 p-3 text-xs sm:text-sm text-red-800 dark:text-red-300 space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-red-600 mt-0.5">!</span>
              <span className="flex-1">{state.message}</span>
            </div>
            {isUnverified && (
              <div className="pt-2 border-t border-red-200 dark:border-red-800 dark:border-red-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs text-red-700 dark:text-red-400">
                  Didn&apos;t receive the link or it expired?
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-xs font-bold text-[#E8590C] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            )}
          </div>
        )}

        {resendStatus && (
          <div
            role="status"
            className={`p-3 rounded-lg text-xs font-medium ${
              resendStatus.ok
                ? "bg-emerald-50 dark:bg-emerald-950/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/60 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {resendStatus.message}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#1F2328] dark:text-slate-200 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={`w-full h-10.5 px-3.5 rounded-lg border text-sm sm:text-base text-[#1F2328] dark:text-white bg-white dark:bg-[#1F2328] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
              state.fieldErrors?.email
                ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
                : "border-[#E6E0D8] dark:border-[#2E343B] dark:border-[#2E343B] hover:border-slate-400 dark:hover:border-slate-500"
            }`}
            placeholder="e.g. name@example.com"
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600 font-medium">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#1F2328] dark:text-slate-200"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm text-[#E8590C] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
              className={`w-full h-10.5 px-3.5 pr-12 rounded-lg border text-sm sm:text-base text-[#1F2328] dark:text-white bg-white dark:bg-[#1F2328] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
                state.fieldErrors?.password
                  ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
                  : "border-[#E6E0D8] dark:border-[#2E343B] dark:border-[#2E343B] hover:border-slate-400 dark:hover:border-slate-500"
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 p-1 cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {state.fieldErrors?.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600 font-medium">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-10.5 text-sm sm:text-base font-semibold cursor-pointer"
        >
          {isPending ? "Signing in..." : "Sign in to EasyLife"}
        </Button>

        {/* Helpful links */}
        <div className="pt-1 text-center text-xs text-slate-600 dark:text-slate-300">
          <span>Don&apos;t have an EasyLife account yet? </span>
          <Link
            href="/register"
            className="font-semibold text-[#E8590C] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
