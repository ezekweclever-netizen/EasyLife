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
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Full Name <span className="text-[#C53030]">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={initialFullName}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Display / Preferred Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={initialDisplayName}
            placeholder="How should technicians address you?"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={email}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] text-sm text-[#4A525C] dark:text-[#C3C8CF] cursor-not-allowed"
          />
          <span className="text-[10px] text-[#4A525C] dark:text-[#C3C8CF]">
            Managed through authentication provider
          </span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Nigerian Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialPhone}
            placeholder="+234 800 000 0000"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="city"
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Primary Service City
          </label>
          <select
            id="city"
            name="city"
            defaultValue={initialCity || "Port Harcourt"}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          >
            <option value="Port Harcourt">Port Harcourt (Rivers State)</option>
            <option value="Lagos">Lagos (Lagos State)</option>
            <option value="Abuja">Abuja (Federal Capital Territory)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="addressLine"
            className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider"
          >
            Default Property Address
          </label>
          <input
            id="addressLine"
            name="addressLine"
            type="text"
            defaultValue={initialAddressLine}
            placeholder="Street / Estate / Flat address"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
          />
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E6E0D8] dark:border-[#2E343B]">
        <span className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">
          All data stored securely on Supabase
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
