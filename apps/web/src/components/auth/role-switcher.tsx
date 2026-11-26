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
      <div className="p-3 space-y-2 bg-slate-50/80 dark:bg-[#071526]/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Switch Dashboard Role
          </span>
          <span className="text-[10px] font-semibold text-[#0D9488] dark:text-[#5CD3D5]">
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
                    ? "bg-teal-50 dark:bg-teal-950/70 text-[#0F766E] dark:text-[#5CD3D5] ring-1 ring-teal-500/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{dash.icon}</span>
                  <div>
                    <span className="block">{dash.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {dash.description}
                    </span>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
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
      <div className="px-3 py-2 space-y-1.5 border-t border-slate-200 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-2">
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
                    ? "bg-teal-50 dark:bg-teal-950/70 text-[#0F766E] dark:text-[#5CD3D5] font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/50 text-[#0F766E] dark:text-[#5CD3D5] text-xs font-bold hover:bg-teal-100/70 dark:hover:bg-teal-950/80 transition-all cursor-pointer shadow-2xs"
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
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] shadow-xl p-2 z-50 space-y-1 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Multi-Role Dashboard Switcher
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
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
                    ? "bg-teal-50 dark:bg-teal-950/70 text-[#0F766E] dark:text-[#5CD3D5] ring-1 ring-teal-500/30"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{dash.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{dash.label}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal line-clamp-1">
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