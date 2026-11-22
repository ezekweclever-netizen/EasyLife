"use client";

import React from "react";
import Link from "next/link";

export default function CustomerDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#F8FAFC]">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#0D223A] border border-[#E2E8F0] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-xl font-bold text-[#0F172A]">
          Unable to load your dashboard
        </h1>
        <p className="text-sm text-[#64748B]">
          A temporary connection error occurred while loading your profile and bookings.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0D655E]"
          >
            Retry Dashboard
          </button>
          <Link
            href="/explore-services"
            className="rounded-xl border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#0F172A]"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  );
}
