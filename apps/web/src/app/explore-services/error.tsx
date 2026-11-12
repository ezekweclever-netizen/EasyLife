"use client";

import React from "react";
import Link from "next/link";

export default function ExploreServicesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-[#F8FAFC]">
      <div className="max-w-md w-full rounded-3xl bg-white border border-[#DAE7E7] p-8 text-center space-y-4 shadow-xs">
        <h1 className="text-xl font-bold text-[#154752]">
          Unable to load service discovery
        </h1>
        <p className="text-sm text-[#4E6065]">
          We hit a temporary error while fetching matching specialists and categories.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80]"
          >
            Retry Discovery
          </button>
          <Link
            href="/services"
            className="rounded-xl border border-[#DAE7E7] px-5 py-2.5 text-sm font-semibold text-[#154752]"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
