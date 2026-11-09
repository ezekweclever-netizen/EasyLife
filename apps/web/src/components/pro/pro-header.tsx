"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfessionalVerificationStatus } from "@/lib/supabase/pro";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface ProHeaderProps {
  businessName?: string;
  verificationStatus?: ProfessionalVerificationStatus;
  primaryCity?: string;
  avatarUrl?: string | null;
  activeJobsCount?: number;
}

export function ProHeader({
  businessName = "Service Professional",
  verificationStatus = "unsubmitted",
  primaryCity = "Port Harcourt",
  avatarUrl,
  activeJobsCount = 0,
}: ProHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/pro/dashboard", icon: "grid" },
    { label: "Job Requests", href: "/pro/jobs", icon: "briefcase", badge: activeJobsCount > 0 ? activeJobsCount : undefined },
    { label: "Quotations", href: "/pro/quotations", icon: "file-text" },
    { label: "Messages", href: "/pro/messages", icon: "message-square" },
    { label: "Earnings", href: "/pro/earnings", icon: "wallet" },
    { label: "Profile", href: "/pro/profile", icon: "user" },
  ];

  // Map verification status to badge display
  let badgeText = "Unverified";
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-300";
  let badgeDotClass = "bg-slate-400";

  if (verificationStatus === "approved") {
    badgeText = "Verified Pro";
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300";
    badgeDotClass = "bg-emerald-500";
  } else if (verificationStatus === "pending") {
    badgeText = "Under Review";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-300";
    badgeDotClass = "bg-amber-500 animate-pulse";
  } else if (verificationStatus === "rejected") {
    badgeText = "Rejected";
    badgeClass = "bg-red-50 text-red-700 border-red-300";
    badgeDotClass = "bg-red-500";
  } else if (verificationStatus === "suspended") {
    badgeText = "Suspended";
    badgeClass = "bg-red-50 text-red-700 border-red-300";
    badgeDotClass = "bg-red-500";
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Pro Badge */}
          <div className="flex items-center gap-6">
            <Link href="/pro/dashboard" className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">
                Easy<span className="text-[#0D9488]">Life</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#0F172A] text-teal-300 rounded">
                PRO
              </span>
            </Link>

            {/* Desktop Navigation (All 6 Required Items) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/pro/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-[#0D9488] bg-teal-50/70 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-[#0D9488] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Verification Status & Account Info */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Verification Status Pill */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${badgeDotClass}`} />
              <span>{badgeText}</span>
            </div>

            {/* Business info snippet */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                {businessName}
              </span>
              <span className="text-[11px] text-slate-500">{primaryCity}</span>
            </div>

            {/* Avatar / Profile quick link */}
            <Link
              href="/pro/profile"
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#0D9488] transition"
              title="Manage Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#0D9488]">
                  {businessName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>

            {/* Customer Switch */}
            <Link
              href="/dashboard"
              className="hidden lg:inline-flex text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
              title="Switch to Customer Mode"
            >
              Customer View
            </Link>

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/pro/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "text-[#0D9488] bg-teal-50 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#0D9488] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Mode:</span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#0D9488] hover:underline"
            >
              Switch to Customer Mode →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
