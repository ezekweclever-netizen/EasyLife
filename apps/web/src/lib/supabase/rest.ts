/**
 * Minimal server-side client for the central Supabase backend (Auth + PostgREST)
 * using the platform `fetch` API — no extra npm dependency required.
 *
 * SECURITY: Only the public anon key is used here. All data access is still
 * governed by PostgreSQL Row Level Security. The service-role key is NEVER
 * referenced in this module. Import only from Server Components / Actions.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
      return null;
    }
  } catch {
    return null;
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export type SupabaseRestResult<T> =
  | { ok: true; status: number; data: T; contentRange?: string | null; totalCount?: number | null }
  | { ok: false; status: number; message: string; code?: string };

function parseContentRangeTotal(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const slashIdx = contentRange.lastIndexOf("/");
  if (slashIdx === -1) return null;
  const rawTotal = contentRange.slice(slashIdx + 1).trim();
  if (!rawTotal || rawTotal === "*") return null;
  const parsed = Number.parseInt(rawTotal, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

interface SupabaseFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retryOnNetworkError?: boolean;
}

function extractErrorDetails(body: unknown): { message: string; code?: string } {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message =
      [record.msg, record.message, record.error_description, record.error]
        .find((v): v is string => typeof v === "string" && v.length > 0) ?? "request_failed";
    const code =
      [record.error_code, record.code].find((v): v is string => typeof v === "string") ??
      (typeof record.code === "number" ? String(record.code) : undefined);
    return { message, code };
  }
  if (typeof body === "string" && body.length > 0) return { message: body.slice(0, 300) };
  return { message: "request_failed" };
}

export async function supabaseFetch<T>(
  config: SupabasePublicConfig,
  path: string,
  options: SupabaseFetchOptions = {}
): Promise<SupabaseRestResult<T>> {
  const {
    method = "GET",
    body,
    accessToken,
    headers = {},
    timeoutMs = 20_000,
    retryOnNetworkError = method === "GET",
  } = options;

  const maxAttempts = retryOnNetworkError ? 2 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${config.url}${path}`, {
        method,
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${accessToken ?? config.anonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });

      const text = await response.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!response.ok) {
        const details = extractErrorDetails(parsed);
        return { ok: false, status: response.status, ...details };
      }

      const contentRange = response.headers.get("content-range");
      return {
        ok: true,
        status: response.status,
        data: parsed as T,
        contentRange,
        totalCount: parseContentRangeTotal(contentRange),
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "TimeoutError";
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        continue;
      }
      return { ok: false, status: 0, message: isTimeout ? "timeout" : "network_error" };
    }
  }

  return { ok: false, status: 0, message: "network_error" };
}
