import React from "react";
import { EASYLIFE_EXPERIENCE_DESIGN_PROFILES } from "@easylife/shared-config";
import { EasyLifeLogo } from "./logo";
import { Badge } from "./badge";

export interface ExperienceNavItem {
  label: string;
  href: string;
  active?: boolean;
  badgeCount?: number;
}

export interface ExperienceShellProps {
  experience: "customer" | "professional" | "business" | "admin";
  title: string;
  subtitle?: string;
  cityContext?: string;
  navItems: readonly ExperienceNavItem[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Provides distinct visual framing & navigation patterns for each of EasyLife's
 * four connected experiences while maintaining cohesive Harbor Teal & Coral branding.
 */
export function ExperienceShell({
  experience,
  title,
  subtitle,
  cityContext = "Port Harcourt, Rivers State",
  navItems,
  headerActions,
  children,
}: ExperienceShellProps) {
  const profile = EASYLIFE_EXPERIENCE_DESIGN_PROFILES[experience];

  // 1. Customer Experience: Clean White Discovery Header + Spacious Marketplace Canvas
  if (experience === "customer") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F3F8F8]">
        <header className="bg-white border-b border-[#DAE7E7] sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <EasyLifeLogo theme="light" size="sm" showSlogan />
              <nav
                aria-label="Customer navigation"
                className="hidden md:flex items-center gap-1"
              >
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-[#F3F8F8] text-[#154752] font-semibold border-b-2 border-[#24989A]"
                        : "text-[#1F2F34] hover:bg-[#F3F8F8]"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="teal" dot>
                {cityContext}
              </Badge>
              {headerActions}
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#154752]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#68797C] mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </main>
      </div>
    );
  }

  // 2. Service Professional Experience: Harbor Teal Operational Workbench Header
  if (experience === "professional") {
    return (
      <div className="min-h-screen flex flex-col bg-[#F3F8F8]">
        <header className="bg-[#154752] text-white border-b border-[#24989A]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <EasyLifeLogo theme="dark" size="sm" showSlogan />
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#0D282E] text-[#24989A] border border-[#24989A]/40">
                Professional Workbench
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#DAE7E7] hidden sm:inline">
                Coverage: {cityContext}
              </span>
              {headerActions}
            </div>
          </div>
          <div className="bg-[#0D282E] border-t border-[#24989A]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    item.active
                      ? "bg-[#24989A] text-white"
                      : "text-[#DAE7E7] hover:bg-white/10"
                  }`}
                >
                  {item.label}
                  {typeof item.badgeCount === "number" && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                      {item.badgeCount}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#154752]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#68797C] mt-0.5">{subtitle}</p>
            )}
          </div>
          {children}
        </main>
      </div>
    );
  }

  // 3 & 4. Business Maintenance Portal & Admin Governance Console
  const isAdmin = experience === "admin";
  const sidebarBg = isAdmin ? "bg-[#081B1F]" : "bg-[#0D282E]";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F8F8]">
      <aside
        className={`w-full lg:w-64 shrink-0 text-white ${sidebarBg} flex flex-col justify-between p-4 lg:p-5 border-r border-[#24989A]/20`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <EasyLifeLogo theme="dark" size="sm" showSlogan />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-[#24989A] border border-[#24989A]/30">
              {isAdmin ? "Admin" : "Facility B2B"}
            </span>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-[#DAE7E7]/70">
            {profile.label}
          </p>

          <nav
            aria-label={`${profile.label} navigation`}
            className="mt-2 space-y-1"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#24989A] text-white"
                    : "text-[#DAE7E7] hover:bg-white/10"
                }`}
              >
                <span>{item.label}</span>
                {typeof item.badgeCount === "number" && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-black/30 text-[#DAE7E7]">
                    {item.badgeCount}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block pt-4 border-t border-white/10 text-xs text-[#DAE7E7]/70">
          <p className="font-medium text-white">{cityContext}</p>
          <p className="mt-0.5">Central Supabase RLS Active</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#DAE7E7] px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#154752]">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#68797C] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
