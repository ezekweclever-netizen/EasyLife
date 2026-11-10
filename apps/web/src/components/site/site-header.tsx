"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EasyLifeLogo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { PUBLIC_PRIMARY_NAV_LINKS } from "@/lib/public-catalog";
import { logoutAction } from "@/app/actions/profile";
import { Icon } from "./icons";

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

  // Close the mobile menu after navigation.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
      <header className="sticky top-0 z-40 border-b border-[#DAE7E7] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="EasyLife — Everyday Problems. Smarter Solutions."
            className="rounded-lg shrink-0 focus-visible:outline-2 focus-visible:outline-[#24989A]"
            onClick={() => setIsMenuOpen(false)}
          >
            <EasyLifeLogo theme="light" size="md" showSlogan={true} />
          </Link>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {PUBLIC_PRIMARY_NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href} className="shrink-0">
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${
                        active
                          ? "bg-[#F3F8F8] text-[#154752] font-semibold border-b-2 border-[#24989A]"
                          : "text-[#1F2F34] hover:bg-[#F3F8F8] hover:text-[#154752]"
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
            {authState.isLoggedIn ? (
              <>
                <ButtonLink href={authState.dashboardHref} size="sm">
                  My Dashboard
                </ButtonLink>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl border border-[#DAE7E7] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#1F2F34] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
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

          <button
            type="button"
            className="xl:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DAE7E7] text-[#1F2F34] hover:bg-[#F3F8F8] transition-colors"
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

        {isMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile Navigation"
            className="xl:hidden border-t border-[#DAE7E7] bg-white shadow-2xl transition-all max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain relative z-40"
          >
            <ul className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-1">
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
                          ? "bg-[#F3F8F8] text-[#154752] font-semibold"
                          : "text-[#1F2F34] hover:bg-[#F3F8F8] hover:text-[#154752]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 border-t border-[#DAE7E7] grid grid-cols-2 gap-3 bg-neutral-50/50">
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
                      className="w-full h-full inline-flex items-center justify-center rounded-xl border border-[#DAE7E7] bg-white px-4 py-2.5 text-base font-semibold text-[#1F2F34] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
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
      </header>

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
