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
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#FAF7F3]">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-xl font-bold text-[#1F2328]">
          Unable to load your dashboard
        </h1>
        <p className="text-sm text-[#64748B]">
          A temporary connection error occurred while loading your profile and bookings.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C84A06]"
          >
            Retry Dashboard
          </button>
          <Link
            href="/explore-services"
            className="rounded-xl border border-[#E6E0D8] px-5 py-2.5 text-sm font-semibold text-[#1F2328]"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  );
}
