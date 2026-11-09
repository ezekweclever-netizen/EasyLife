"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/business" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                EL
              </span>
              <div>
                <span className="font-extrabold text-slate-900 text-lg leading-tight block">
                  EasyLife <span className="text-teal-700 font-semibold text-sm">Business</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {businessName} • {businessCity}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Facility Portal Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 -mb-px border-t border-slate-100">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
