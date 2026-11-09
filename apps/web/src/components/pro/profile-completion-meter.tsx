"use client";

import React from "react";
import Link from "next/link";

interface Step {
  name: string;
  completed: boolean;
  hint: string;
}

interface ProfileCompletionMeterProps {
  percentage: number;
  steps: Step[];
}

export function ProfileCompletionMeter({
  percentage,
  steps,
}: ProfileCompletionMeterProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Profile Completion
          </h3>
          <p className="text-xs text-slate-500">
            A complete profile increases customer bookings and quote acceptance by up to 80%.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold text-[#0D9488]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            percentage === 100
              ? "bg-emerald-500"
              : percentage >= 60
              ? "bg-[#0D9488]"
              : "bg-amber-500"
          }`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {steps.map((s, idx) => (
          <div
            key={s.name}
            className={`p-2.5 rounded-lg border text-xs transition-colors ${
              s.completed
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-0.5">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  s.completed
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                {s.completed ? "✓" : idx + 1}
              </span>
              <span className="truncate">{s.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{s.hint}</p>
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <div className="mt-3.5 text-right">
          <Link
            href="/pro/profile"
            className="text-xs font-semibold text-[#0D9488] hover:underline"
          >
            Finish profile setup →
          </Link>
        </div>
      )}
    </div>
  );
}
