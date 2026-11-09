"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";
import { NotificationBell } from "@/components/notifications/notification-bell";

export interface CustomerHeaderProps {
  user?: {
    id: string;
    email: string | null;
    fullName?: string;
  } | null;
  unreadNotificationsCount?: number;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

const CUSTOMER_NAV = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Explore Services",
    href: "/explore-services",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "AI Problem Assistant",
    href: "/assistant",
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: "My Bookings",
    href: "/bookings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const PILOT_CITIES = [
  { name: "Port Harcourt", state: "Rivers State", label: "Port Harcourt, Rivers" },
  { name: "Lagos", state: "Lagos State", label: "Lagos (Island & Mainland)" },
  { name: "Abuja", state: "FCT", label: "Abuja, FCT" },
];

export function CustomerHeader({
  user,
  unreadNotificationsCount = 0,
  selectedCity = "Port Harcourt",
  onCityChange,
}: CustomerHeaderProps) {
  const pathname = usePathname() ?? "/";
  const [city, setCity] = useState(selectedCity);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    // Read persisted city choice if available
    const saved = localStorage.getItem("easylife_city");
    if (saved && ["Port Harcourt", "Lagos", "Abuja"].includes(saved)) {
      setCity(saved);
      if (onCityChange) onCityChange(saved);
    }
  }, [onCityChange]);

  const handleSelectCity = (c: string) => {
    setCity(c);
    localStorage.setItem("easylife_city", c);
    setIsCityDropdownOpen(false);
    if (onCityChange) onCityChange(c);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/customer";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" aria-label="EasyLife Customer Home" className="shrink-0">
              <EasyLifeLogo theme="light" size="sm" />
            </Link>

            {/* City Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] hover:bg-[#CCFBF1] transition-colors"
                aria-expanded={isCityDropdownOpen}
                aria-label="Select service location"
              >
                <svg className="w-3.5 h-3.5 text-[#0F766E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{city}</span>
                <svg className="w-3 h-3 text-[#0F766E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-medium text-[#64748B] border-b border-[#F1F5F9]">
                    Select Your City
                  </div>
                  {PILOT_CITIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c.name)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#F8FAFC] transition-colors ${
                        city === c.name ? "bg-[#F0FDFA] text-[#0F766E] font-semibold" : "text-[#1E293B]"
                      }`}
                    >
                      <div>
                        <div>{c.name}</div>
                        <div className="text-xs text-[#64748B]">{c.state}</div>
                      </div>
                      {city === c.name && (
                        <svg className="w-4 h-4 text-[#0F766E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links (5 Required Items) */}
          <nav aria-label="Customer Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {CUSTOMER_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        active
                          ? "bg-[#F0FDFA] text-[#0F766E] font-semibold"
                          : "text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Action CTAs: Book a Service & User Profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Request Service</span>
              <span className="sm:hidden">Book</span>
            </Link>

            {/* Notification Bell */}
            <NotificationBell initialUnreadCount={unreadNotificationsCount} />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((o) => !o)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors"
                aria-label="User account menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-semibold text-xs uppercase shadow-sm">
                  {user?.fullName ? user.fullName[0] : (user?.email ? user.email[0] : "C")}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#F1F5F9]">
                    <p className="text-xs text-[#64748B]">Signed in as</p>
                    <p className="text-sm font-semibold text-[#0F172A] truncate">
                      {user?.fullName || user?.email || "Customer"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-[#94A3B8] truncate">{user.email}</p>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    Help & Support
                  </Link>

                  <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (App-like thumb reachability) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg pb-safe"
      >
        <ul className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {CUSTOMER_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center py-1 text-center transition-colors ${
                    active ? "text-[#0F766E] font-semibold" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <div className={`p-1 rounded-full ${active ? "bg-[#F0FDFA]" : ""}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
