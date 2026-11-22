import React from "react";

export default function CustomerDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-16 bg-white dark:bg-[#0D223A] border-b border-[#E2E8F0]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-56 rounded-2xl bg-[#0F766E]/20" />
        <div className="h-28 rounded-2xl bg-white dark:bg-[#0D223A] border border-[#E2E8F0]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-xl bg-white dark:bg-[#0D223A] border border-[#E2E8F0]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
