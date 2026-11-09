"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import {
  ROLE_OPTIONS,
  PILOT_CITIES,
  type FormActionState,
  type RegisterField,
} from "@/lib/validation/forms";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: FormActionState<RegisterField> = {
  status: "idle",
  values: {},
  fieldErrors: {},
};

export function RegisterForm({ defaultRole }: { defaultRole?: string }) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(
    defaultRole && ROLE_OPTIONS.some((r) => r.value === defaultRole)
      ? defaultRole
      : "customer"
  );

  return (
    <div className="space-y-6">
      <GoogleSignInButton
        label="Sign up quickly with Google"
        intendedRole={selectedRole}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-slate-400 font-semibold">
            or register with email
          </span>
        </div>
      </div>

      <form action={formAction} noValidate className="space-y-6">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-3"
        >
          <span className="font-bold text-red-600 mt-0.5">!</span>
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" && state.message && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 flex items-start gap-3"
        >
          <span className="font-bold text-emerald-600 mt-0.5">✓</span>
          <div>
            <p className="font-semibold">Account Registered Successfully</p>
            <p className="mt-1 text-emerald-800">{state.message}</p>
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0F766E]"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Account Type Selection */}
      <fieldset>
        <legend className="block text-sm font-semibold text-[#0F172A] mb-2">
          Select Your Account Type
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((opt) => {
            const isChecked = selectedRole === opt.value;
            return (
              <label
                key={opt.value}
                className={`relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "border-[#0D9488] bg-teal-50/40 ring-1 ring-[#0D9488]"
                    : "border-[#CBD5E1] bg-white hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {opt.label}
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={isChecked}
                    onChange={() => setSelectedRole(opt.value)}
                    className="h-4 w-4 text-[#0D9488] focus:ring-[#0D9488] border-slate-300"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 leading-snug">
                  {opt.description}
                </p>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.role && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {state.fieldErrors.role}
          </p>
        )}
      </fieldset>

      {/* Full Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-semibold text-[#0F172A] mb-1.5"
          >
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={state.values?.fullName ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.fullName
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
            placeholder="e.g. Chukwuma Obi"
          />
          {state.fieldErrors?.fullName && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#0F172A] mb-1.5"
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
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.email
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
            placeholder="e.g. chukwuma@example.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone Number & Pilot City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-[#0F172A] mb-1.5"
          >
            Nigerian Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={state.values?.phone ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.phone
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
            placeholder="e.g. 0803 123 4567"
          />
          {state.fieldErrors?.phone ? (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.phone}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Used for job SMS alerts &amp; OTP verification.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-semibold text-[#0F172A] mb-1.5"
          >
            Pilot City (Operating Hub)
          </label>
          <select
            id="city"
            name="city"
            defaultValue={state.values?.city ?? "Port Harcourt"}
            required
            aria-invalid={Boolean(state.fieldErrors?.city)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.city
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
          >
            {PILOT_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {state.fieldErrors?.city && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.city}
            </p>
          )}
        </div>
      </div>

      {/* Passwords */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs text-[#0D9488] font-medium hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.password
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
            placeholder="At least 8 chars, 1 letter, 1 number"
          />
          {state.fieldErrors?.password && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-[#0F172A] mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#0F172A] bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] ${
              state.fieldErrors?.confirmPassword
                ? "border-red-500 bg-red-50/20"
                : "border-[#CBD5E1] hover:border-slate-400"
            }`}
            placeholder="Re-enter password"
          />
          {state.fieldErrors?.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {state.fieldErrors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      {/* Terms Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            required
            aria-invalid={Boolean(state.fieldErrors?.acceptTerms)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            I agree to the EasyLife{" "}
            <Link
              href="/terms-of-service"
              target="_blank"
              className="text-[#0D9488] font-semibold underline"
            >
              Terms of Service
            </Link>
            ,{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="text-[#0D9488] font-semibold underline"
            >
              Privacy Policy
            </Link>
            , and adhere to the{" "}
            <Link
              href="/verification-policy"
              target="_blank"
              className="text-[#0D9488] font-semibold underline"
            >
              Professional Verification Policy
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.acceptTerms && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {state.fieldErrors.acceptTerms}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 text-base font-semibold"
      >
        {isPending ? "Creating your account..." : "Create EasyLife Account"}
      </Button>

      {/* Already registered */}
      <div className="text-center text-xs text-slate-600">
        <span>Already have an account? </span>
        <Link
          href="/login"
          className="font-semibold text-[#0D9488] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </form>
    </div>
  );
}
