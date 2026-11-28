"use client";

import React from "react";
import Link from "next/link";

interface PerformanceStatsProps {
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  activeJobsCount: number;
  responseRatePct: number;
  walletBalanceKobo: number;
  inEscrowKobo: number;
}

export function PerformanceStats({
  rating,
  reviewCount,
  completedJobsCount,
  activeJobsCount,
  responseRatePct,
  walletBalanceKobo,
  inEscrowKobo,
}: PerformanceStatsProps) {
  const formatNaira = (kobo: number) => {
    const naira = kobo / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(naira);
  };

  const stats = [
    {
      label: "Customer Rating",
      value: rating > 0 ? `${rating.toFixed(1)} ★` : "New Pro",
      subtext: `${reviewCount} verified reviews`,
      href: "/pro/profile",
      highlight: false,
    },
    {
      label: "Completed Jobs",
      value: completedJobsCount.toString(),
      subtext: "Successful handovers",
      href: "/pro/jobs?tab=history",
      highlight: false,
    },
    {
      label: "Active Jobs",
      value: activeJobsCount.toString(),
      subtext: "In progress / scheduled",
      href: "/pro/jobs?tab=active",
      highlight: activeJobsCount > 0,
    },
    {
      label: "Response Rate",
      value: `${responseRatePct}%`,
      subtext: "Fast quote response",
      href: "/pro/jobs",
      highlight: false,
    },
    {
      label: "Escrow Protection",
      value: formatNaira(inEscrowKobo),
      subtext: "Locked customer funds",
      href: "/pro/earnings",
      highlight: inEscrowKobo > 0,
    },
    {
      label: "Available Payout",
      value: formatNaira(walletBalanceKobo),
      subtext: "Ready for bank transfer",
      href: "/pro/earnings",
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((st) => (
        <Link
          key={st.label}
          href={st.href}
          className={`p-4 rounded-xl border transition-all hover:shadow-xs group ${
            st.highlight
              ? "bg-teal-50 dark:bg-teal-950/60/50 border-teal-300 dark:border-teal-700"
              : "bg-white dark:bg-[#1F2328] border-slate-200 dark:border-[#2E343B] hover:border-slate-300 dark:border-slate-700"
          }`}
        >
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-slate-800 dark:text-slate-100">
            {st.label}
          </span>
          <span
            className={`block text-xl font-extrabold tracking-tight ${
              st.highlight ? "text-[#E8590C]" : "text-slate-900 dark:text-white"
            }`}
          >
            {st.value}
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {st.subtext}
          </span>
        </Link>
      ))}
    </div>
  );
}
