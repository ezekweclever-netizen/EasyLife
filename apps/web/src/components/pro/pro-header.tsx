"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfessionalVerificationStatus } from "@/lib/supabase/pro";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
  const pathname = usePathname() ?? "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

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
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0D223A] border-b border-slate-200 dark:border-[#163654]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-3">
          {/* Left: Brand & Pro Badge */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            <Link href="/pro/dashboard" className="flex items-center gap-2 shrink-0 max-sm:[&_img]:h-6.5">
              <EasyLifeLogo theme="light" size="sm" />
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#0F172A] text-teal-300 rounded whitespace-nowrap shrink-0">
                PRO
              </span>
            </Link>

            {/* Desktop Navigation (>= 1280px) */}
            <nav aria-label="Professional Primary" className="hidden xl:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/pro/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-2.5 2xl:px-3 py-2 rounded-lg text-[13.5px] 2xl:text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 inline-flex items-center ${
                      isActive
                        ? "text-[#0D9488] dark:text-[#5CD3D5] bg-teal-50/70 dark:bg-teal-950/60 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Verification Status Pill */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${badgeDotClass}`} />
              <span>{badgeText}</span>
            </div>

            {/* Business info snippet */}
            <div className="hidden 2xl:flex flex-col text-right shrink-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                {businessName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{primaryCity}</span>
            </div>

            {/* Avatar / Profile quick link */}
            <Link
              href="/pro/profile"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#0D9488] transition shrink-0"
              title="Manage Profile"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={businessName}
                  width={36}
                  height={36}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#0D9488]">
                  {businessName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>

            {/* Customer Switch */}
            <Link
              href="/dashboard"
              className="hidden md:inline-flex text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-[#071526] dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition"
              title="Switch to Customer Mode"
            >
              Customer View
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle compact />

            {/* Sign Out */}
            <form action={logoutAction} className="hidden md:block shrink-0">
              <button
                type="submit"
                className="text-xs text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/60 dark:hover:bg-red-950/40 font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
            </form>

            {/* Mobile & Tablet menu toggle button (< 1280px) */}
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
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

      {/* Mobile & Tablet navigation drawer */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          className="xl:hidden border-t border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] px-4 pt-2 pb-4 space-y-1 shadow-lg"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/pro/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "text-[#0D9488] dark:text-[#5CD3D5] bg-teal-50 dark:bg-teal-950/60 font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-[#0D9488] dark:text-[#5CD3D5] hover:underline"
            >
              Switch to Customer Mode →
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm font-semibold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
