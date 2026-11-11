"use client";

import React, { useEffect, useState } from "react";

interface GoogleSignInButtonProps {
  label?: string;
  intendedRole?: string;
  nextPath?: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function GoogleSignInButton({
  label = "Continue with Google",
  intendedRole = "customer",
  nextPath,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Reset pending spinner if user returns via browser back button (bfcache restore)
  useEffect(() => {
    const handlePageShow = () => {
      setIsLoading(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleGoogleSignIn = async () => {
    setStatusMessage(null);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      setStatusMessage(
        "Google sign-in is being configured. Please sign in with email and password."
      );
      return;
    }

    setIsLoading(true);
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, "");

      // Verify Google provider status in Supabase before redirecting (bounded timeout)
      const settingsRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseAnonKey },
        signal: AbortSignal.timeout(10000),
      });

      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as {
          external?: Record<string, boolean>;
        };
        if (settings?.external && settings.external.google !== true) {
          setStatusMessage(
            "Google sign-in is being configured in Supabase Authentication (Google Client ID & Secret pending activation). Please use email and password."
          );
          setIsLoading(false);
          return;
        }
      }

      // Generate PKCE challenge
      const randomBytes = new Uint8Array(48);
      window.crypto.getRandomValues(randomBytes);
      const codeVerifier = base64UrlEncode(randomBytes);
      const encoded = new TextEncoder().encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", encoded);
      const codeChallenge = base64UrlEncode(new Uint8Array(digest));

      // Store verifier and intended metadata in short-lived cookies for /auth/callback
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `el_pkce_verifier=${encodeURIComponent(codeVerifier)}; path=/; max-age=600; SameSite=Lax${secureFlag}`;
      document.cookie = `el_oauth_role=${encodeURIComponent(intendedRole)}; path=/; max-age=600; SameSite=Lax${secureFlag}`;
      if (
        nextPath &&
        nextPath.startsWith("/") &&
        !nextPath.startsWith("//") &&
        !nextPath.startsWith("/\\")
      ) {
        document.cookie = `el_oauth_next=${encodeURIComponent(nextPath)}; path=/; max-age=600; SameSite=Lax${secureFlag}`;
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      const authUrl = new URL(`${cleanUrl}/auth/v1/authorize`);
      authUrl.searchParams.set("provider", "google");
      authUrl.searchParams.set("redirect_to", redirectTo);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      window.location.href = authUrl.toString();
    } catch {
      setStatusMessage(
        "Unable to initiate Google sign-in right now. Please continue with email and password."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-10.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.23 1.18-3.26 0-6.02-2.2-7-5.16H1.01v3.14C3.05 21.2 7.21 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5 14.01c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.15H1.01C.37 7.43 0 8.88 0 11.65s.37 4.22 1.01 5.5l3.99-3.14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.79 0 3.4.62 4.67 1.82l3.5-3.5C18.08 1.19 15.3 0 12 0 7.21 0 3.05 2.8 1.01 6.15l3.99 3.14c.98-2.96 3.74-5.16 7-5.16Z"
          />
        </svg>
        <span>{isLoading ? "Connecting to Google..." : label}</span>
      </button>

      {statusMessage && (
        <div
          role="status"
          className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed"
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
