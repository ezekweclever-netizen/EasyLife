"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AvailableDashboard {
  role: string;
  label: string;
  href: string;
  icon: string;
  description: string;
}

interface RoleSwitcherProps {
  variant?: "header" | "mobile" | "sidebar";
  onSelect?: () => void;
}

export function RoleSwitcher({
  variant = "header",
  onSelect,
}: RoleSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);
  const [dashboards, setDashboards] = useState<AvailableDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          authenticated?: boolean;
          availableDashboards?: AvailableDashboard[];
        } | null) => {
          if (!active) return;
          if (data?.authenticated && Array.isArray(data.availableDashboards)) {
            setDashboards(data.availableDashboards);
          } else {
            setDashboards([]);
          }
          setIsLoading(false);
        }
      )
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  // Close flyout on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Determine active dashboard based on current URL path
  const currentDashboard =
    dashboards.find((d) => {
      if (d.href === "/dashboard" && pathname === "/dashboard") return true;
      if (d.href !== "/dashboard" && pathname.startsWith(d.href)) return true;
      return false;
    }) || dashboards[0];

  // If user has only 1 dashboard or no session, do not render a switcher
  if (isLoading || dashboards.length <= 1) {
    return null;
  }

  // Variant: Mobile Drawer view
  if (variant === "mobile") {
    return (
      <div className="p-3 space-y-2 bg-[#FAF7F3] dark:bg-[#15181C] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-[#4A525C] dark:text-[#C3C8CF] uppercase tracking-wider">
            Switch Dashboard Role
          </span>
          <span className="text-[10px] font-semibold text-[#E8590C]">
            {dashboards.length} Roles Active
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {dashboards.map((dash) => {
            const isCurrent = currentDashboard?.role === dash.role;
            return (
              <Link
                key={dash.role}
                href={dash.href}
                onClick={onSelect}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] ring-1 ring-[#E8590C]/30"
                    : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-white dark:hover:bg-[#1F2328]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{dash.icon}</span>
                  <div>
                    <span className="block">{dash.label}</span>
                    <span className="text-[10px] text-[#4A525C] dark:text-[#C3C8CF] font-normal">
                      {dash.description}
                    </span>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-[#2E7D4F] bg-[#E8F5ED] px-2 py-0.5 rounded-full border border-[#A3D9B5]">
                    Active
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: Sidebar view (e.g., in Admin or Business sidebars)
  if (variant === "sidebar") {
    return (
      <div className="px-3 py-2 space-y-1.5 border-t border-[#E6E0D8] dark:border-[#2E343B]">
        <span className="text-[10px] font-bold text-[#4A525C] dark:text-[#C3C8CF] uppercase tracking-wider block px-2">
          Role Views
        </span>
        <div className="space-y-1">
          {dashboards.map((dash) => {
            const isCurrent = currentDashboard?.role === dash.role;
            return (
              <Link
                key={dash.role}
                href={dash.href}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-bold"
                    : "text-[#4A525C] dark:text-[#C3C8CF] hover:text-[#1F2328] dark:hover:text-white hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                }`}
              >
                <span>{dash.icon}</span>
                <span className="truncate">{dash.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: Header Dropdown (default for desktop navbars)
  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8590C]/30 bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] text-xs font-bold hover:bg-[#FCEBDD]/80 transition-all cursor-pointer shadow-2xs"
        title="Switch active role dashboard"
      >
        <span>{currentDashboard?.icon || "🔄"}</span>
        <span className="hidden sm:inline">
          {currentDashboard?.label || "Switch Role"}
        </span>
        <span className="text-[10px] ml-0.5">▾</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] shadow-xl p-2 z-50 space-y-1 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-[#E6E0D8] dark:border-[#2E343B] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF] block">
              Multi-Role Dashboard Switcher
            </span>
            <span className="text-xs text-[#1F2328] dark:text-[#FAF7F3] font-medium">
              Switch your workspace mode:
            </span>
          </div>

          {dashboards.map((dash) => {
            const isCurrent = currentDashboard?.role === dash.role;
            return (
              <Link
                key={dash.role}
                href={dash.href}
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onSelect?.();
                }}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] ring-1 ring-[#E8590C]/30"
                    : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{dash.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{dash.label}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-[#2E7D4F] bg-[#E8F5ED] px-1.5 py-0.2 rounded-full border border-[#A3D9B5] shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#4A525C] dark:text-[#C3C8CF] font-normal line-clamp-1">
                    {dash.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}