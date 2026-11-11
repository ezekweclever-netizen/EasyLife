"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
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

  return (
    <div className="space-y-3.5">
      {oauthError && (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2"
        >
          <span className="font-bold text-amber-700 mt-0.5">!</span>
          <span>{oauthError}</span>
        </div>
      )}

      <GoogleSignInButton label="Continue with Google" nextPath={nextPath} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-slate-400 font-semibold">
            or sign in with email
          </span>
        </div>
      </div>

      <form action={formAction} noValidate className="space-y-3.5">
        {nextPath && <input type="hidden" name="next" value={nextPath} />}
        {state.status === "error" && state.message && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs sm:text-sm text-red-800 flex items-start gap-2.5"
          >
            <span className="font-bold text-red-600 mt-0.5">!</span>
            <span>{state.message}</span>
          </div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#0F172A] mb-1"
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
            className={`w-full h-10.5 px-3.5 rounded-lg border text-sm sm:text-base text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.email
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
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
              className="block text-sm font-semibold text-[#0F172A]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm text-[#0F766E] hover:underline font-medium"
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
              className={`w-full h-10.5 px-3.5 pr-12 rounded-lg border text-sm sm:text-base text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
                state.fieldErrors?.password
                  ? "border-red-500 bg-red-50/20"
                  : "border-[#CBD5E1] hover:border-slate-400"
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
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
        <div className="pt-1 text-center text-xs text-slate-600">
          <span>Don&apos;t have an EasyLife account yet? </span>
          <Link
            href="/register"
            className="font-semibold text-[#0D9488] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
