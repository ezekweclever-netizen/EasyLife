import React from "react";

export default function ServicesCatalogueLoading() {
  return (
    <div className="min-h-screen bg-[#FCEBDD]">
      <div className="bg-[#1F2328] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
          <div className="h-4 w-48 rounded bg-white dark:bg-[#1F2328]/20" />
          <div className="h-10 w-2/3 max-w-xl rounded bg-white dark:bg-[#1F2328]/25" />
          <div className="h-5 w-1/2 max-w-md rounded bg-white dark:bg-[#1F2328]/15" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
