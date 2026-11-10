"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";

interface AdminSidebarProps {
  adminEmail?: string | null;
  adminName?: string | null;
}

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📊" },
      { href: "/admin/analytics", label: "Analytics & Trends", icon: "📈" },
    ],
  },
  {
    title: "Marketplace & Entities",
    items: [
      { href: "/admin/users", label: "User Accounts", icon: "👥" },
      { href: "/admin/professionals", label: "Professionals", icon: "👷" },
      { href: "/admin/verifications", label: "KYC & Verifications", icon: "🛡️" },
      { href: "/admin/businesses", label: "Businesses & Facilities", icon: "🏢" },
      { href: "/admin/categories", label: "Service Categories", icon: "📁" },
    ],
  },
  {
    title: "Service Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: "📋" },
      { href: "/admin/quotations", label: "Quotations", icon: "📑" },
      { href: "/admin/disputes", label: "Disputes & Cases", icon: "⚖️" },
      { href: "/admin/reviews", label: "Review Moderation", icon: "⭐" },
    ],
  },
  {
    title: "Governance & Control",
    items: [
      { href: "/admin/risk-flags", label: "Risk Flags & Review", icon: "🚩" },
      { href: "/admin/notifications", label: "Notification Dispatch", icon: "🔔" },
      { href: "/admin/commissions", label: "Commission Rates", icon: "💰" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
      { href: "/admin/settings", label: "Platform Settings", icon: "⚙️" },
      { href: "/admin/audit-logs", label: "Immutable Audit Logs", icon: "📜" },
    ],
  },
];

export function AdminSidebar({
  adminEmail = "admin@easylife.ng",
  adminName = "Administrator",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <EasyLifeLogo theme="dark" size="sm" />
          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-xs uppercase tracking-wider">
            Admin
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle admin menu"
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <EasyLifeLogo theme="dark" size="sm" />
          </Link>
          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-xs uppercase tracking-wider">
            Ops
          </span>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                          isActive
                            ? "bg-teal-600 text-white shadow-xs"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Admin User Footer Profile & Security Badge */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-teal-400 font-black flex items-center justify-center text-sm border border-slate-700">
              {adminName ? adminName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-bold text-white truncate">{adminName}</div>
              <div className="text-xs text-slate-400 truncate">{adminEmail}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Role: Admin
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-teal-400 transition"
                title="Return to Customer App"
              >
                Customer App
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-red-400 hover:text-red-300 font-semibold transition cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
