"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { adminLoginAction } from "@/app/actions/auth";
import type { FormActionState, LoginField } from "@/lib/validation/forms";
import { Button } from "@/components/ui/button";

const initialState: FormActionState<LoginField> = {
  status: "idle",
  values: {},
  fieldErrors: {},
};

export function AdminLoginForm({ nextPath = "/admin" }: { nextPath?: string }) {
  const [state, formAction, isPending] = useActionState(adminLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs sm:text-sm text-red-200 flex items-start gap-3"
        >
          <span className="font-bold text-red-400 mt-0.5">!</span>
          <span>{state.message}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
        >
          Administrator Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          required
          className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-950/70 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          placeholder="admin@easylife.ng"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full h-11 px-3.5 pr-14 rounded-xl border border-slate-700 bg-slate-950/70 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
            placeholder="Enter administrator password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white p-1"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 text-sm font-bold"
      >
        {isPending ? "Verifying Privileges..." : "Access Operations Console"}
      </Button>

      <div className="pt-2 text-center text-xs text-slate-400">
        <Link href="/login" className="text-teal-400 hover:underline font-medium">
          ← Return to standard Customer / Pro sign-in
        </Link>
      </div>
    </form>
  );
}
