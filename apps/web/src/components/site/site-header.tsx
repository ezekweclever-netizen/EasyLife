"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EasyLifeLogo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { PUBLIC_PRIMARY_NAV_LINKS } from "@/lib/public-catalog";
import { logoutAction } from "@/app/actions/profile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "./icons";

const DESKTOP_DIRECTORY_HREFS = new Set([
  "/dispatch",
  "/businesses",
  "/healthcare",
  "/property-services",
]);

const DESKTOP_PRIMARY_LINKS = PUBLIC_PRIMARY_NAV_LINKS.filter(
  (l) => !DESKTOP_DIRECTORY_HREFS.has(l.href)
);

const DESKTOP_DIRECTORY_LINKS = PUBLIC_PRIMARY_NAV_LINKS.filter((l) =>
  DESKTOP_DIRECTORY_HREFS.has(l.href)
);

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
  const [isDirOpen, setIsDirOpen] = useState(false);
  const dirMenuRef = useRef<HTMLLIElement | null>(null);
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

  // Close menus after navigation.
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDirOpen(false);
  }, [pathname]);

  // Close desktop Directories dropdown on outside click or Escape.
  useEffect(() => {
    if (!isDirOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (dirMenuRef.current && !dirMenuRef.current.contains(event.target as Node)) {
        setIsDirOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDirOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDirOpen]);

  // Prevent background page scrolling when the mobile menu is open.
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

  // Allow Escape to close the mobile menu.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-transform duration-300 ease-in-out px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-3 pointer-events-none ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-[1440px] mx-auto rounded-2xl border border-slate-200/90 dark:border-[#163654] bg-white/95 dark:bg-[#0E2238]/95 backdrop-blur-md shadow-md sm:shadow-lg pointer-events-auto transition-colors">
          <div className="px-3.5 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
            <Link
              href="/"
              aria-label="EasyLife — Everyday Problems. Smarter Solutions."
              className="rounded-lg shrink-0 focus-visible:outline-2 focus-visible:outline-[#24989A]"
              onClick={() => setIsMenuOpen(false)}
            >
              <EasyLifeLogo theme="light" size="md" showSlogan={true} />
            </Link>

            <nav aria-label="Primary" className="hidden xl:block">
              <ul className="flex items-center gap-1.5">
                {DESKTOP_PRIMARY_LINKS.slice(0, 1).map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href} className="shrink-0">
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center whitespace-nowrap px-3.5 py-2 rounded-lg text-[15px] font-medium transition-colors ${
                          active
                            ? "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] font-semibold border-b-2 border-[#24989A]"
                            : "text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 hover:text-[#154752] dark:hover:text-[#5CD3D5]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}

                <li ref={dirMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={isDirOpen}
                    aria-haspopup="true"
                    onClick={() => setIsDirOpen((open) => !open)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-[15px] font-medium transition-colors cursor-pointer ${
                      DESKTOP_DIRECTORY_LINKS.some((l) => isActive(l.href))
                        ? "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] font-semibold border-b-2 border-[#24989A]"
                        : "text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 hover:text-[#154752] dark:hover:text-[#5CD3D5]"
                    }`}
                  >
                    <span>Directories</span>
                    <svg
                      className={`h-4 w-4 transition-transform ${isDirOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDirOpen && (
                    <div className="absolute left-0 mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 shadow-lg z-50">
                      {DESKTOP_DIRECTORY_LINKS.map((dirLink) => {
                        const active = isActive(dirLink.href);
                        return (
                          <Link
                            key={dirLink.href}
                            href={dirLink.href}
                            onClick={() => setIsDirOpen(false)}
                            className={`block px-4 py-2.5 text-[15px] font-medium transition-colors ${
                              active
                                ? "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] font-semibold"
                                : "text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 hover:text-[#154752] dark:hover:text-[#5CD3D5]"
                            }`}
                          >
                            {dirLink.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>

                {DESKTOP_PRIMARY_LINKS.slice(1).map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href} className="shrink-0">
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center whitespace-nowrap px-3.5 py-2 rounded-lg text-[15px] font-medium transition-colors ${
                          active
                            ? "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] font-semibold border-b-2 border-[#24989A]"
                            : "text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 hover:text-[#154752] dark:hover:text-[#5CD3D5]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="hidden xl:flex items-center gap-2.5 shrink-0">
              <ThemeToggle />

              {authState.isLoggedIn ? (
                <>
                  <ButtonLink href={authState.dashboardHref} size="sm">
                    My Dashboard
                  </ButtonLink>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-[15px] font-semibold text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

            <div className="xl:hidden flex items-center gap-1.5 shrink-0">
              <ThemeToggle compact />

              <button
                type="button"
                className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-[#1F2F34] dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors"
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

          {isMenuOpen && (
            <nav
              id="mobile-navigation"
              aria-label="Mobile Navigation"
              className="xl:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-[#0E2238]/95 backdrop-blur-md rounded-b-2xl shadow-2xl transition-all max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain relative z-40"
            >
              <ul className="px-4 py-3 space-y-1">
                {[
                  ...PUBLIC_PRIMARY_NAV_LINKS,
                  { label: "Contact", href: "/contact" },
                ].map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-3.5 py-3 rounded-lg text-base font-medium transition-colors ${
                          active
                            ? "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] font-semibold"
                            : "text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 hover:text-[#154752] dark:hover:text-[#5CD3D5]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Theme Appearance
                </span>
                <ThemeToggle />
              </div>

              <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 bg-neutral-50/50 dark:bg-slate-900/50 rounded-b-2xl">
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
                        className="w-full h-full inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base font-semibold text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
