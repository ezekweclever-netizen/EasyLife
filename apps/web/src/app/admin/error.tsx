"use client";

import React from "react";
import Link from "next/link";

export default function AdminSectionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[55vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Operations Console Error
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Failed to load this administrative view. Your session and database records remain intact.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            Retry View
          </button>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 dark:border-[#163654] px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
          >
            Admin Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
