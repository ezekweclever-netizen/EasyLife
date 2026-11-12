import React from "react";

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-16 bg-white border-b border-[#E2E8F0]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl bg-slate-200" />
        <div className="h-10 w-full max-w-md rounded-xl bg-white border border-[#E2E8F0]" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl bg-white border border-[#E2E8F0]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
