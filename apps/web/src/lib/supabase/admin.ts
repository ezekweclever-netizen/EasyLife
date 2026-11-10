/**
 * Server-only Supabase Admin helper using SUPABASE_SERVICE_ROLE_KEY.
 * NEVER import this file from Client Components or expose to the browser.
 */

import { getSupabasePublicConfig, SupabaseRestResult } from "./rest";

export function getSupabaseAdminKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export async function supabaseAdminFetch<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<SupabaseRestResult<T>> {
  const config = getSupabasePublicConfig();
  const adminKey = getSupabaseAdminKey();

  if (!config || !adminKey) {
    return {
      ok: false,
      status: 500,
      message: "Server admin configuration is missing (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${config.url}${cleanPath}`;

  const headers: Record<string, string> = {
    apikey: adminKey,
    Authorization: `Bearer ${adminKey}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      let errText = "admin_request_failed";
      if (parsed && typeof parsed === "object") {
        const j = parsed as Record<string, unknown>;
        errText =
          (typeof j.message === "string" && j.message) ||
          (typeof j.error_description === "string" && j.error_description) ||
          (typeof j.error === "string" && j.error) ||
          errText;
      } else if (typeof parsed === "string" && parsed.trim()) {
        errText = parsed.trim().slice(0, 300);
      }
      return { ok: false, status: res.status, message: errText };
    }

    return { ok: true, status: res.status, data: (parsed ?? null) as T };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      message: err instanceof Error ? err.message : "Network error during admin call",
    };
  }
}
