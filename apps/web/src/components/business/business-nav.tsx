"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface BusinessNavProps {
  businessName: string;
  businessCity?: string;
}

export function BusinessNav({ businessName, businessCity = "Port Harcourt" }: BusinessNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/business", label: "Dashboard", icon: "📊" },
    { href: "/business/properties", label: "Properties", icon: "🏢" },
    { href: "/business/assets", label: "Equipment & Assets", icon: "⚙️" },
    { href: "/business/maintenance", label: "Maintenance", icon: "🛠️" },
    { href: "/business/schedules", label: "Schedules & Reminders", icon: "📅" },
    { href: "/business/team", label: "Team & Roles", icon: "👥" },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/business" className="flex items-center gap-3 min-w-0">
              <EasyLifeLogo theme="light" size="sm" />
              <div className="hidden sm:block border-l border-slate-200 dark:border-[#163654] pl-3 min-w-0">
                <span className="font-bold text-teal-800 dark:text-[#5CD3D5] text-xs uppercase tracking-wider block">
                  Business Portal
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate block">
                  {businessName} • {businessCity}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Facility Portal Active
            </span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-[#071526] dark:hover:bg-slate-800 transition"
              title="Switch to Customer Mode"
            >
              Customer View
            </Link>
            <ThemeToggle compact />
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/60 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2.5 -mb-px border-t border-slate-100 dark:border-slate-800">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-[#5CD3D5] border border-teal-200 dark:border-teal-800 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
