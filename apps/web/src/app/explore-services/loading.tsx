import React from "react";

export default function ExploreServicesLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#154752] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
          <div className="h-4 w-48 rounded bg-white/20" />
          <div className="h-10 w-96 max-w-full rounded bg-white/25" />
          <div className="h-5 w-full max-w-xl rounded bg-white/15" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-white border border-slate-200" />
        <div className="h-56 rounded-2xl bg-white border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-52 rounded-2xl bg-white border border-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
