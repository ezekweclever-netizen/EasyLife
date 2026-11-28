import React from "react";

export default function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F3]">
      <div className="bg-[#1F2328] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-4 w-72 rounded bg-white dark:bg-[#1F2328]/20" />
            <div className="h-10 w-3/4 rounded bg-white dark:bg-[#1F2328]/25" />
            <div className="h-5 w-full max-w-2xl rounded bg-white dark:bg-[#1F2328]/15" />
          </div>
          <div className="lg:col-span-4 h-64 rounded-3xl bg-white dark:bg-[#1F2328]/90" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 rounded-3xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]" />
          <div className="h-48 rounded-3xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B]" />
        </div>
      </div>
    </div>
  );
}
