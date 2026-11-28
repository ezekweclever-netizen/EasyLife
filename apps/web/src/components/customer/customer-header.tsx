"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { EasyLifeLogo } from "@/components/ui/logo";
import { logoutAction } from "@/app/actions/profile";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RoleSwitcher } from "@/components/auth/role-switcher";

export interface CustomerHeaderProps {
  user?: {
    id: string;
    email: string | null;
    fullName?: string;
    avatarUrl?: string | null;
    primaryRole?: string | null;
    roles?: string[];
  } | null;
  unreadNotificationsCount?: number;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

const CUSTOMER_NAV = [
  {
    label: "Home",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Explore Services",
    mobileLabel: "Explore",
    href: "/explore-services",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "AI Assistant",
    mobileLabel: "AI Help",
    href: "/assistant",
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: "My Bookings",
    mobileLabel: "Bookings",
    href: "/bookings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Messages",
    mobileLabel: "Messages",
    href: "/messages",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    mobileLabel: "Profile",
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
  unreadNotificationsCount,
  selectedCity = "Port Harcourt",
  onCityChange,
}: CustomerHeaderProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [city, setCity] = useState(selectedCity);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<{
    hasProRole: boolean;
    hasBusinessRole: boolean;
    avatarUrl: string | null;
  }>({
    hasProRole: Boolean(user?.primaryRole === "professional" || user?.roles?.includes("professional")),
    hasBusinessRole: Boolean(user?.primaryRole === "business" || user?.roles?.includes("business")),
    avatarUrl: user?.avatarUrl || null,
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data?.authenticated) return;
        setSessionMeta((prev) => ({
          hasProRole: Boolean(data.hasProRole || prev.hasProRole),
          hasBusinessRole: Boolean(data.hasBusinessRole || prev.hasBusinessRole),
          avatarUrl: data.avatarUrl || prev.avatarUrl,
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const tabletDrawerRef = useRef<HTMLElement>(null);
  const tabletToggleRef = useRef<HTMLButtonElement>(null);
  const onCityChangeRef = useRef(onCityChange);
  onCityChangeRef.current = onCityChange;

  useEffect(() => {
    if (selectedCity) {
      setCity(selectedCity);
    }
  }, [selectedCity]);

  // Close menus on route transitions
  useEffect(() => {
    setIsCityDropdownOpen(false);
    setIsProfileMenuOpen(false);
    setIsTabletMenuOpen(false);
  }, [pathname]);

  // Close open dropdowns / tablet drawer on outside click or Escape
  useEffect(() => {
    if (!isCityDropdownOpen && !isProfileMenuOpen && !isTabletMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isCityDropdownOpen &&
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(target)
      ) {
        setIsCityDropdownOpen(false);
      }
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        isTabletMenuOpen &&
        tabletDrawerRef.current &&
        !tabletDrawerRef.current.contains(target) &&
        tabletToggleRef.current &&
        !tabletToggleRef.current.contains(target)
      ) {
        setIsTabletMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCityDropdownOpen(false);
        setIsProfileMenuOpen(false);
        setIsTabletMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCityDropdownOpen, isProfileMenuOpen, isTabletMenuOpen]);

  const handleSelectCity = (nextCity: string) => {
    setCity(nextCity);
    try {
      localStorage.setItem("easylife_city", nextCity);
    } catch {
      // Ignore storage failures in restricted contexts
    }
    setIsCityDropdownOpen(false);

    if (onCityChangeRef.current) {
      onCityChangeRef.current(nextCity);
      return;
    }

    if (
      pathname === "/dashboard" ||
      pathname === "/explore-services" ||
      pathname === "/book"
    ) {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      params.set("city", nextCity);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/customer";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const bookHref = `/book?city=${encodeURIComponent(city)}`;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E6E0D8] dark:border-[#2E343B] bg-white/95 dark:bg-[#1F2328]/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-[#1F2328]/90">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
            <Link
              href="/dashboard"
              aria-label="EasyLife Customer Home"
              className="shrink-0 max-sm:[&_img]:h-6.5"
            >
              <EasyLifeLogo theme="light" size="sm" />
            </Link>

            {/* City Selector Pill */}
            <div className="relative shrink-0" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCityDropdownOpen((o) => !o);
                  setIsProfileMenuOpen(false);
                  setIsTabletMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] border border-[#E8590C]/30 hover:bg-[#FCEBDD]/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-expanded={isCityDropdownOpen}
                aria-haspopup="true"
                aria-label="Select service location"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E8590C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="max-w-[84px] sm:max-w-none truncate">{city}</span>
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#E8590C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-60 sm:w-64 bg-white dark:bg-[#1F2328] rounded-xl shadow-lg border border-[#E6E0D8] dark:border-[#2E343B] py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-medium text-[#4A525C] dark:text-[#C3C8CF] border-b border-[#E6E0D8] dark:border-[#2E343B]">
                    Select Your City
                  </div>
                  {PILOT_CITIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c.name)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition-colors cursor-pointer ${
                        city === c.name ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-semibold" : "text-[#1F2328] dark:text-[#FAF7F3]"
                      }`}
                    >
                      <div>
                        <div>{c.name}</div>
                        <div className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">{c.state}</div>
                      </div>
                      {city === c.name && (
                        <svg className="w-4 h-4 text-[#E8590C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links (>= 1280px only) */}
          <nav aria-label="Customer Primary" className="hidden xl:block">
            <ul className="flex items-center gap-0.5 2xl:gap-1">
              {CUSTOMER_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`px-2.5 2xl:px-3.5 py-2 rounded-lg text-[13.5px] 2xl:text-[15px] font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                        active
                          ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-semibold"
                          : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] hover:text-[#E8590C] dark:hover:text-[#E8590C]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Mode Switches for Pro & Business in Customer View */}
            {sessionMeta.hasProRole && (
              <Link
                href="/pro/dashboard"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E8F5ED] text-[#2E7D4F] border border-[#A3D9B5] hover:bg-[#E8F5ED]/80 transition whitespace-nowrap shrink-0"
                title="Switch back to Professional Dashboard"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F] animate-pulse" />
                Pro Mode
              </Link>
            )}

            {sessionMeta.hasBusinessRole && (
              <Link
                href="/business"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EBF0F5] text-[#4A525C] border border-[#C3C8CF] hover:bg-[#EBF0F5]/80 transition whitespace-nowrap shrink-0"
                title="Switch back to Business Portal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8590C] animate-pulse" />
                Business Mode
              </Link>
            )}

            <Link
              href={bookHref}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#E8590C] text-white hover:bg-[#C84A06] shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Request Service</span>
              <span className="sm:hidden">Book</span>
            </Link>

            {/* Notification Bell */}
            <NotificationBell initialUnreadCount={unreadNotificationsCount} />

            {/* Theme Toggle */}
            <ThemeToggle compact />

            {/* Multi-Role Switcher */}
            <RoleSwitcher variant="header" />

            {/* User Profile Menu */}
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen((o) => !o);
                  setIsCityDropdownOpen(false);
                  setIsTabletMenuOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition-colors cursor-pointer"
                aria-label="User account menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F2328] text-white border border-[#E8590C]/40 flex items-center justify-center font-semibold text-xs uppercase shadow-sm overflow-hidden">
                  {sessionMeta.avatarUrl ? (
                    <img
                      src={sessionMeta.avatarUrl}
                      alt={user?.fullName || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.fullName ? user.fullName[0] : (user?.email ? user.email[0] : "C")
                  )}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1F2328] rounded-xl shadow-lg border border-[#E6E0D8] dark:border-[#2E343B] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E6E0D8] dark:border-[#2E343B]">
                    <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF]">Signed in as</p>
                    <p className="text-sm font-semibold text-[#1F2328] dark:text-[#FAF7F3] truncate">
                      {user?.fullName || user?.email || "Customer"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] truncate">{user.email}</p>
                    )}
                  </div>

                  {/* Mode Switching Options inside Profile Menu */}
                  {sessionMeta.hasProRole && (
                    <Link
                      href="/pro/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#2E7D4F] bg-[#E8F5ED] hover:bg-[#E8F5ED]/80 transition border-b border-[#A3D9B5]"
                    >
                      <span>Switch to Pro Mode</span>
                      <span className="text-[10px] bg-[#2E7D4F] text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                    </Link>
                  )}
                  {sessionMeta.hasBusinessRole && (
                    <Link
                      href="/business"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] bg-[#FAF7F3] dark:bg-[#1F2328] hover:bg-[#E6E0D8] transition border-b border-[#E6E0D8] dark:border-[#2E343B]"
                    >
                      <span>Switch to Business Mode</span>
                      <span className="text-[10px] bg-[#E8590C] text-white px-1.5 py-0.5 rounded-full font-bold">BIZ</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                  >
                    Help &amp; Support
                  </Link>

                  <div className="border-t border-[#E6E0D8] dark:border-[#2E343B] mt-1 pt-1">
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm text-[#C53030] hover:bg-[#FDE8E8] dark:hover:bg-[#C53030]/20 font-medium cursor-pointer"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Tablet & Small-Laptop Navigation Toggle (768px - 1279px) */}
            <button
              ref={tabletToggleRef}
              type="button"
              onClick={() => {
                setIsTabletMenuOpen((o) => !o);
                setIsCityDropdownOpen(false);
                setIsProfileMenuOpen(false);
              }}
              aria-expanded={isTabletMenuOpen}
              aria-controls="customer-tablet-navigation"
              aria-label={isTabletMenuOpen ? "Close customer menu" : "Open customer menu"}
              className="hidden md:inline-flex xl:hidden items-center justify-center h-9 w-9 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition-colors shrink-0 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isTabletMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Tablet & Small-Laptop Slide-Down Navigation (768px - 1279px) */}
        {isTabletMenuOpen && (
          <nav
            ref={tabletDrawerRef}
            id="customer-tablet-navigation"
            aria-label="Customer Tablet Navigation"
            className="hidden md:block xl:hidden border-t border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] shadow-lg"
          >
            <div className="max-w-[1440px] mx-auto px-6 py-3 grid grid-cols-3 gap-2">
              {CUSTOMER_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsTabletMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-semibold border border-[#E8590C]/30"
                        : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] hover:text-[#E8590C] dark:hover:text-[#E8590C]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="max-w-[1440px] mx-auto px-6 pb-3">
              <RoleSwitcher variant="mobile" onSelect={() => setIsTabletMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (< 768px thumb reachability) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1F2328] border-t border-[#E6E0D8] dark:border-[#2E343B] shadow-lg pb-safe"
      >
        <ul className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
          {CUSTOMER_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1 min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center py-1 text-center transition-colors ${
                    active ? "text-[#E8590C] font-semibold" : "text-[#4A525C] dark:text-[#C3C8CF] hover:text-[#1F2328] dark:hover:text-[#FAF7F3]"
                  }`}
                >
                  <div className={`p-1 rounded-full ${active ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20" : ""}`}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] mt-0.5 leading-tight whitespace-nowrap truncate max-w-full px-0.5">
                    {item.mobileLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
