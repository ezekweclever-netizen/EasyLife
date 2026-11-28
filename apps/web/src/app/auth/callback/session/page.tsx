"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OAuthSessionCatcherPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = parseInt(params.get("expires_in") || "3600", 10);

    if (!accessToken || !refreshToken) {
      setError("No valid authentication session was returned. Please sign in again.");
      return;
    }

    const roleCookieMatch = document.cookie.match(/(?:^|;\s*)el_oauth_role=([^;]+)/);
    const intendedRole = roleCookieMatch?.[1]
      ? decodeURIComponent(roleCookieMatch[1])
      : "customer";

    fetch("/api/auth/oauth-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        intended_role: intendedRole,
      }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; redirectPath?: string; message?: string }) => {
        if (data.ok && data.redirectPath) {
          router.replace(data.redirectPath);
        } else {
          setError(data.message || "Unable to establish authenticated session.");
        }
      })
      .catch(() => {
        setError("Network error while finalizing Google sign-in.");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-8 text-center space-y-4 shadow-xs">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 font-bold text-xl mx-auto flex items-center justify-center">
              !
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sign-In Incomplete</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">{error}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex px-5 py-2.5 rounded-xl bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C]"
              >
                Return to Sign In
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full border-3 border-[#E8590C] border-t-transparent animate-spin mx-auto" />
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Completing EasyLife Sign-In...
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifying your session and loading your dashboard.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
