"use client";

import React from "react";
import Link from "next/link";

export default function BookingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#F8FAFC]">
      <div className="max-w-md w-full rounded-3xl bg-white border border-[#E2E8F0] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-xl font-bold text-[#0F172A]">
          Unable to load your bookings
        </h1>
        <p className="text-sm text-[#64748B]">
          There was a temporary issue loading your service requests and quotation statuses.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0D655E]"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#0F172A]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
