"use client";

import React from "react";
import Link from "next/link";

export default function AppRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAF7F3]">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#FCEBDD] text-[#1F2328] flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-[#1F2328]">
          Something went wrong loading this page
        </h1>
        <p className="text-sm text-[#4A525C] leading-relaxed">
          We encountered a temporary interruption while communicating with the EasyLife marketplace backend. Your data is safe.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C84A06] transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[#E6E0D8] px-5 py-2.5 text-sm font-semibold text-[#1F2328] hover:bg-[#FAF7F3] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
