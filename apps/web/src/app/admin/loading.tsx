import React from "react";

export default function AdminSectionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]/80" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]/80"
          />
        ))}
      </div>
      <div className="h-72 rounded-3xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]/80" />
    </div>
  );
}
