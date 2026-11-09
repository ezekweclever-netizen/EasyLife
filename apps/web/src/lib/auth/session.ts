/**
 * Interim server-side session handling for Supabase Auth.
 *
 * Tokens are stored in HTTP-only, SameSite=Lax cookies (Secure in production)
 * and are never readable from browser JavaScript. Every protected read
 * re-verifies the access token with Supabase Auth (`/auth/v1/user`) rather
 * than trusting the cookie contents.
 *
 * ARCHITECTURE NOTE: This will be superseded by `@supabase/ssr` middleware
 * (automatic token refresh + role-based route guards) in the authentication
 * stage. See ARCHITECTURE_DECISIONS.md (ADR-009).
 */

import { cookies } from "next/headers";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export const ACCESS_TOKEN_COOKIE = "el_access_token";
export const REFRESH_TOKEN_COOKIE = "el_refresh_token";
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SupabaseSessionPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string | null };
}

export function isSessionPayload(value: unknown): value is SupabaseSessionPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.access_token === "string" &&
    typeof record.refresh_token === "string" &&
    typeof record.expires_in === "number" &&
    typeof record.user === "object" &&
    record.user !== null
  );
}

/** Must only be called from Server Actions or Route Handlers. */
export async function persistSession(session: SupabaseSessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor(session.expires_in)),
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

/** Must only be called from Server Actions or Route Handlers. */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function readAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

/** Verifies the cookie token against Supabase Auth. Returns null if invalid/expired. */
export async function getAuthenticatedUser(): Promise<{
  user: AuthenticatedUser;
  accessToken: string;
} | null> {
  const config = getSupabasePublicConfig();
  const accessToken = await readAccessToken();
  if (!config || !accessToken) return null;

  const result = await supabaseFetch<{ id?: unknown; email?: unknown }>(config, "/auth/v1/user", {
    accessToken,
  });
  if (!result.ok || typeof result.data?.id !== "string") return null;

  return {
    user: {
      id: result.data.id,
      email: typeof result.data.email === "string" ? result.data.email : null,
    },
    accessToken,
  };
}
