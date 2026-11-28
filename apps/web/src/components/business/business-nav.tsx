"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RoleSwitcher } from "@/components/auth/role-switcher";

interface BusinessNavProps {
  businessName: string;
  businessCity?: string;
}

export function BusinessNav({ businessName, businessCity = "Port Harcourt" }: BusinessNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/business", label: "Dashboard", icon: "📊" },
    { href: "/business/jobs", label: "Vacancies & Applicants", icon: "💼" },
    { href: "/business/properties", label: "Properties", icon: "🏢" },
    { href: "/business/assets", label: "Equipment & Assets", icon: "⚙️" },
    { href: "/business/maintenance", label: "Maintenance", icon: "🛠️" },
    { href: "/business/schedules", label: "Schedules & Reminders", icon: "📅" },
    { href: "/business/team", label: "Team & Roles", icon: "👥" },
  ];

  return (
    <header className="border-b border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/business" className="flex items-center gap-3 min-w-0">
              <EasyLifeLogo theme="light" size="sm" />
              <div className="hidden sm:block border-l border-[#E6E0D8] dark:border-[#2E343B] pl-3 min-w-0">
                <span className="font-bold text-[#E8590C] text-xs uppercase tracking-wider block">
                  Business Portal
                </span>
                <span className="text-sm text-[#4A525C] dark:text-[#C3C8CF] font-medium truncate block">
                  {businessName} • {businessCity}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5ED] text-[#2E7D4F] border border-[#A3D9B5]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D4F] animate-pulse"></span>
              Facility Portal Active
            </span>
            <RoleSwitcher variant="header" />
            <ThemeToggle compact />
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold text-[#C53030] hover:bg-[#FDE8E8] dark:hover:bg-[#C53030]/20 px-2.5 py-1.5 rounded-lg border border-[#F8B4B4] transition cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2.5 -mb-px border-t border-[#E6E0D8] dark:border-[#2E343B]">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] border border-[#E8590C]/30 shadow-xs"
                    : "text-[#4A525C] dark:text-[#C3C8CF] hover:text-[#1F2328] dark:hover:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
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
