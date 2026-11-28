import React from "react";

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F3]">
      <div className="h-16 bg-white dark:bg-[#1F2328] border-b border-[#E6E0D8]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl bg-slate-200" />
        <div className="h-10 w-full max-w-md rounded-xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8]" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
