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

export async function readRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

/** Exchanges an unexpired refresh token for a fresh Supabase Auth session. */
export async function refreshSessionWithToken(
  refreshToken: string
): Promise<SupabaseSessionPayload | null> {
  const config = getSupabasePublicConfig();
  if (!config || !refreshToken) return null;

  const res = await supabaseFetch<unknown>(
    config,
    "/auth/v1/token?grant_type=refresh_token",
    {
      method: "POST",
      body: { refresh_token: refreshToken },
    }
  );

  if (!res.ok || !isSessionPayload(res.data)) {
    return null;
  }

  return res.data;
}

/**
 * Verifies the cookie token against Supabase Auth.
 * Automatically falls back to refreshing via `el_refresh_token` if the short-lived
 * access token expired, persisting new cookies when called in a mutable context.
 */
export async function getAuthenticatedUser(): Promise<{
  user: AuthenticatedUser;
  accessToken: string;
} | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const accessToken = await readAccessToken();
  if (accessToken) {
    const result = await supabaseFetch<{ id?: unknown; email?: unknown }>(
      config,
      "/auth/v1/user",
      { accessToken }
    );
    if (result.ok && typeof result.data?.id === "string") {
      return {
        user: {
          id: result.data.id,
          email: typeof result.data.email === "string" ? result.data.email : null,
        },
        accessToken,
      };
    }
  }

  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;

  const refreshed = await refreshSessionWithToken(refreshToken);
  if (!refreshed || typeof refreshed.user?.id !== "string") return null;

  try {
    await persistSession(refreshed);
  } catch {
    // Read-only Server Component render context; refreshed token remains valid for this request.
  }

  return {
    user: {
      id: refreshed.user.id,
      email: typeof refreshed.user.email === "string" ? refreshed.user.email : null,
    },
    accessToken: refreshed.access_token,
  };
}
