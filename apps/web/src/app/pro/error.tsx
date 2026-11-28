"use client";

import React from "react";
import Link from "next/link";

export default function ProPortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[55vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Unable to load Professional Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          We encountered a temporary issue fetching your professional workspace. Please retry in a moment.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#E8590C] cursor-pointer"
          >
            Retry Portal
          </button>
          <Link
            href="/pro/dashboard"
            className="rounded-xl border border-slate-200 dark:border-[#2E343B] px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
          >
            Pro Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
