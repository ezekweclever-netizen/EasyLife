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
      <body className="min-h-screen bg-[#F8FAFC] text-[#1F2F34] flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#DAE7E7] p-8 text-center space-y-4 shadow-sm">
          <h1 className="text-xl font-bold text-[#154752]">
            EasyLife — Temporary Service Interruption
          </h1>
          <p className="text-sm text-[#4E6065] leading-relaxed">
            An unexpected error interrupted this request. Click retry to reload the page cleanly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80] cursor-pointer"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="rounded-xl border border-[#DAE7E7] px-5 py-2.5 text-sm font-semibold text-[#154752]"
            >
              Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
