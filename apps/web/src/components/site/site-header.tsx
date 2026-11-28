"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EasyLifeLogo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { PUBLIC_PRIMARY_NAV_LINKS } from "@/lib/public-catalog";
import { logoutAction } from "@/app/actions/profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { Icon, type IconName } from "./icons";

export interface SiteHeaderAuthState {
  isLoggedIn: boolean;
  dashboardHref: string;
}

export function SiteHeader({
  initialAuth,
}: {
  initialAuth?: SiteHeaderAuthState;
} = {}) {
  const pathname = usePathname() ?? "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<SiteHeaderAuthState>(
    initialAuth ?? { isLoggedIn: false, dashboardHref: "/dashboard" }
  );

  useEffect(() => {
    if (initialAuth) {
      setAuthState(initialAuth);
    }
  }, [initialAuth]);

  // Verify HTTP-only session status from server endpoint when navigating client-side
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { authenticated?: boolean; dashboardHref?: string } | null) => {
        if (!active || !data) return;
        setAuthState({
          isLoggedIn: Boolean(data.authenticated),
          dashboardHref: data.dashboardHref || "/dashboard",
        });
      })
      .catch(() => {
        // Keep current state on transient network failure
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  // Close menus after navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent background page scrolling when the mobile menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isMenuOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isMenuOpen]);

  // Scroll sensitivity: hide floating navbar on scroll down, reveal on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (isMenuOpen) {
          setIsVisible(true);
          lastScrollYRef.current = currentY;
          ticking = false;
          return;
        }

        if (currentY < 40) {
          setIsVisible(true);
        } else if (currentY > lastScrollYRef.current && currentY > 80) {
          setIsVisible(false);
        } else if (currentY < lastScrollYRef.current) {
          setIsVisible(true);
        }

        lastScrollYRef.current = currentY;
        ticking = false;
      });
      ticking = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMenuOpen]);

  // Allow Escape to close the mobile menu
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-transform duration-300 ease-in-out px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-3 pointer-events-none ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-[1440px] mx-auto rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white/95 dark:bg-[#1F2328]/95 backdrop-blur-md shadow-md sm:shadow-lg pointer-events-auto transition-colors">
          <div className="px-3.5 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
            {/* Logo */}
            <Link
              href="/"
              aria-label="EasyLife — Everyday Problems. Smarter Solutions."
              className="rounded-lg shrink-0 focus-visible:outline-2 focus-visible:outline-[#E8590C]"
              onClick={() => setIsMenuOpen(false)}
            >
              <EasyLifeLogo theme="light" size="md" showSlogan={true} />
            </Link>

            {/* Desktop Navigation: Six Core MVP Sections */}
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-0.5 xl:gap-1">
                {PUBLIC_PRIMARY_NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href} className="shrink-0">
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center whitespace-nowrap px-2 xl:px-2.5 2xl:px-3 py-2 rounded-lg text-xs xl:text-[13px] 2xl:text-[14px] font-medium transition-colors ${
                          active
                            ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-semibold border-b-2 border-[#E8590C]"
                            : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] hover:text-[#E8590C] dark:hover:text-[#E8590C]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Desktop Right: Theme Toggle & Auth Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 2xl:gap-2.5 shrink-0 whitespace-nowrap">
              <ThemeToggle />

              {authState.isLoggedIn ? (
                <>
                  <RoleSwitcher variant="header" />
                  <ButtonLink href={authState.dashboardHref} size="sm">
                    My Dashboard
                  </ButtonLink>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] px-3.5 py-2 text-[14px] font-semibold text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#2E343B] transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ButtonLink href="/login" variant="ghost" size="sm">
                    Log in
                  </ButtonLink>
                  <ButtonLink href="/register" size="sm">
                    Create account
                  </ButtonLink>
                </>
              )}
            </div>

            {/* Mobile Controls: Theme Toggle & Animated Hamburger */}
            <div className="lg:hidden flex items-center gap-1.5 shrink-0">
              <ThemeToggle compact />

              <button
                type="button"
                className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] transition-colors"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <span className="sr-only">
                  {isMenuOpen ? "Close menu" : "Open menu"}
                </span>
                <Icon name={isMenuOpen ? "close" : "menu"} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer / Slide-Down */}
          {isMenuOpen && (
            <nav
              id="mobile-navigation"
              aria-label="Mobile Navigation"
              className="lg:hidden border-t border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] rounded-b-2xl shadow-2xl transition-all max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain relative z-50 divide-y divide-[#E6E0D8]/60 dark:divide-[#2E343B]"
            >
              {/* Six Core Section Links with Rich Visual Cards */}
              <div className="p-3 sm:p-4 space-y-1.5">
                <p className="px-3 py-1 text-[11px] font-bold tracking-wider text-[#4A525C] dark:text-[#C3C8CF] uppercase">
                  Explore EasyLife
                </p>
                {PUBLIC_PRIMARY_NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  const iconName = link.icon as IconName;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3.5 p-3 rounded-xl transition-all ${
                        active
                          ? "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] font-semibold ring-1 ring-[#E8590C]/30"
                          : "text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? "bg-[#E8590C] text-white"
                            : "bg-[#FAF7F3] dark:bg-[#1F2328] text-[#4A525C] dark:text-[#C3C8CF]"
                        }`}
                      >
                        <Icon name={iconName} className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold leading-tight">
                          {link.label}
                        </div>
                        <div className="text-[11px] text-[#4A525C] dark:text-[#C3C8CF] truncate mt-0.5">
                          {link.description}
                        </div>
                      </div>
                      {active && (
                        <div className="w-1.5 h-6 rounded-full bg-[#E8590C] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Theme Appearance Controls in Mobile Drawer */}
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1F2328] dark:text-[#FAF7F3] block">
                    Theme Appearance
                  </span>
                  <span className="text-[11px] text-[#4A525C] dark:text-[#C3C8CF]">
                    Light, dark or match system
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {/* Direct WhatsApp Quick Connect Link */}
              <div className="px-4 py-3">
                <a
                  href="https://wa.me/2347049948582"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>Chat with EasyLife Support on WhatsApp</span>
                </a>
              </div>

              {/* Mobile Role Switcher (if logged in with multiple roles) */}
              {authState.isLoggedIn && (
                <div className="px-3 sm:px-4 py-2">
                  <RoleSwitcher variant="mobile" onSelect={() => setIsMenuOpen(false)} />
                </div>
              )}

              {/* Authentication Quick Action Buttons */}
              <div className="px-4 py-4 grid grid-cols-2 gap-2.5 bg-[#FAF7F3] dark:bg-[#15181C] rounded-b-2xl">
                {authState.isLoggedIn ? (
                  <>
                    <ButtonLink
                      href={authState.dashboardHref}
                      fullWidth
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Dashboard
                    </ButtonLink>
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="w-full h-full inline-flex items-center justify-center rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] px-4 py-2.5 text-sm font-semibold text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#2E343B] transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <ButtonLink
                      href="/login"
                      variant="outline"
                      fullWidth
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log in
                    </ButtonLink>
                    <ButtonLink
                      href="/register"
                      fullWidth
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create account
                    </ButtonLink>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Floating Header Spacer: Guarantees page content below is never covered or overlapping */}
      <div className="h-22 sm:h-26 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Dimmed backdrop when mobile drawer is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 top-20 sm:top-22 bg-black/40 backdrop-blur-xs z-30 xl:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
