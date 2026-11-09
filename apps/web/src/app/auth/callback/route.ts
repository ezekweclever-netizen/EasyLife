import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/rest";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { persistSession, isSessionPayload } from "@/lib/auth/session";
import { resolveUserDashboardPath } from "@/lib/auth/admin-guard";
import { SELF_REGISTRABLE_ROLES } from "@/lib/validation/forms";

export async function ensureOAuthUserProfile(
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  intendedRoleRaw?: string | null
) {
  const safeRole =
    intendedRoleRaw &&
    (SELF_REGISTRABLE_ROLES as readonly string[]).includes(intendedRoleRaw)
      ? intendedRoleRaw
      : "customer";

  const profileCheck = await supabaseAdminFetch<Array<{ id: string; primary_role: string | null }>>(
    `/rest/v1/profiles?id=eq.${user.id}&limit=1&select=id,primary_role`
  );

  if (
    profileCheck.ok &&
    Array.isArray(profileCheck.data) &&
    profileCheck.data.length > 0
  ) {
    return;
  }

  const meta = user.user_metadata || {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    user.email?.split("@")[0] ||
    "EasyLife User";

  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) ||
    (typeof meta.picture === "string" && meta.picture.trim()) ||
    null;

  await supabaseAdminFetch("/rest/v1/profiles", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: {
      id: user.id,
      email: user.email || "",
      full_name: fullName,
      avatar_url: avatarUrl,
      primary_role: safeRole,
      country: "Nigeria",
    },
  });

  await supabaseAdminFetch("/rest/v1/user_roles", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates" },
    body: {
      user_id: user.id,
      role: safeRole,
      is_active: true,
    },
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error || errorDescription) {
    const msg = errorDescription || error || "Google authentication was cancelled or failed.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );
  }

  // If no code query parameter was supplied, redirect to the client-side hash fragment catcher
  if (!code) {
    return NextResponse.redirect(new URL("/auth/callback/session", request.url));
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase%20configuration%20is%20missing", request.url)
    );
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("el_pkce_verifier")?.value
    ? decodeURIComponent(cookieStore.get("el_pkce_verifier")!.value)
    : undefined;
  const intendedRole = cookieStore.get("el_oauth_role")?.value
    ? decodeURIComponent(cookieStore.get("el_oauth_role")!.value)
    : "customer";
  const nextPath = cookieStore.get("el_oauth_next")?.value
    ? decodeURIComponent(cookieStore.get("el_oauth_next")!.value)
    : null;

  // Exchange authorization code with Supabase Auth PKCE endpoint
  const tokenEndpoint = verifier
    ? `${config.url}/auth/v1/token?grant_type=pkce`
    : `${config.url}/auth/v1/token?grant_type=authorization_code`;

  const payload = verifier ? { auth_code: code, code_verifier: verifier } : { code };

  const tokenRes = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    let errMsg = "Could not complete Google authentication.";
    try {
      const errJson = (await tokenRes.json()) as {
        error_description?: string;
        msg?: string;
        message?: string;
      };
      errMsg = errJson.error_description || errJson.msg || errJson.message || errMsg;
    } catch {
      // keep default
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errMsg)}`, request.url)
    );
  }

  const sessionData = await tokenRes.json();
  if (!isSessionPayload(sessionData)) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20OAuth%20session%20response", request.url)
    );
  }

  await persistSession(sessionData);
  await ensureOAuthUserProfile(
    sessionData.user as {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    },
    intendedRole
  );

  // Clean up temporary OAuth cookies
  cookieStore.delete("el_pkce_verifier");
  cookieStore.delete("el_oauth_role");
  cookieStore.delete("el_oauth_next");

  const dashboardPath = await resolveUserDashboardPath(
    sessionData.user.id,
    sessionData.access_token
  );
  const destination =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("/admin")
      ? nextPath
      : dashboardPath;

  return NextResponse.redirect(new URL(destination, request.url));
}
