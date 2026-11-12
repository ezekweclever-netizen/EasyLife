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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F8FAFC]">
      <div className="max-w-md w-full rounded-3xl bg-white border border-[#DAE7E7] p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF6F7] text-[#154752] flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-[#154752]">
          Something went wrong loading this page
        </h1>
        <p className="text-sm text-[#4E6065] leading-relaxed">
          We encountered a temporary interruption while communicating with the EasyLife marketplace backend. Your data is safe.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80] transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[#DAE7E7] px-5 py-2.5 text-sm font-semibold text-[#154752] hover:bg-[#F8FAFC] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
