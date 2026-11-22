"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateCustomerProfileAction,
  type ProfileFormState,
} from "@/app/actions/profile";

interface ProfileFormClientProps {
  email: string;
  initialFullName: string;
  initialDisplayName: string;
  initialPhone: string;
  initialCity: string;
  initialAddressLine: string;
}

const initialState: ProfileFormState = {
  status: "idle",
  message: "",
};

export function ProfileFormClient({
  email,
  initialFullName,
  initialDisplayName,
  initialPhone,
  initialCity,
  initialAddressLine,
}: ProfileFormClientProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateCustomerProfileAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-300 font-medium flex items-start gap-2.5"
        >
          <span className="font-bold text-red-600">!</span>
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" && state.message && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-900 font-medium flex items-start gap-2.5"
        >
          <span className="font-bold text-emerald-600">✓</span>
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={initialFullName}
            className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Display / Preferred Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={initialDisplayName}
            placeholder="How should technicians address you?"
            className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={email}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] text-sm text-[#64748B] cursor-not-allowed"
          />
          <span className="text-[10px] text-[#94A3B8]">
            Managed through authentication provider
          </span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Nigerian Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialPhone}
            placeholder="+234 800 000 0000"
            className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="city"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Primary Service City
          </label>
          <select
            id="city"
            name="city"
            defaultValue={initialCity || "Port Harcourt"}
            className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <option value="Port Harcourt">Port Harcourt (Rivers State)</option>
            <option value="Lagos">Lagos (Lagos State)</option>
            <option value="Abuja">Abuja (Federal Capital Territory)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="addressLine"
            className="block text-xs font-bold text-[#334155] uppercase tracking-wider"
          >
            Default Property Address
          </label>
          <input
            id="addressLine"
            name="addressLine"
            type="text"
            defaultValue={initialAddressLine}
            placeholder="Street / Estate / Flat address"
            className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#0D223A] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#F1F5F9]">
        <span className="text-xs text-[#64748B]">
          All data stored securely on Supabase
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
