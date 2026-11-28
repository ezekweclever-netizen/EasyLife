"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF7F3] text-[#1F2F34] flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] p-8 text-center space-y-4 shadow-sm">
          <h1 className="text-xl font-bold text-[#1F2328]">
            EasyLife — Temporary Service Interruption
          </h1>
          <p className="text-sm text-[#4A525C] leading-relaxed">
            An unexpected error interrupted this request. Click retry to reload the page cleanly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C84A06] cursor-pointer"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="rounded-xl border border-[#E6E0D8] px-5 py-2.5 text-sm font-semibold text-[#1F2328]"
            >
              Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
