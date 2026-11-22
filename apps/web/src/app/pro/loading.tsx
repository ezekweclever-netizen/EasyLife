import React from "react";

export default function ProPortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654]"
          />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654]" />
    </div>
  );
}
