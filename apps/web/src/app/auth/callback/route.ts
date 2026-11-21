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

  const profileCheck = await supabaseAdminFetch<
    Array<{ id: string; primary_role: string | null; created_at?: string | null }>
  >(
    `/rest/v1/profiles?id=eq.${user.id}&limit=1&select=id,primary_role,created_at`
  );

  const existingProfile =
    profileCheck.ok && Array.isArray(profileCheck.data) ? profileCheck.data[0] : undefined;

  if (existingProfile) {
    // Handle race where Postgres on_auth_user_created trigger already created a default
    // 'customer' profile moments before /auth/callback ran with a chosen registration role.
    const createdAtMs = existingProfile.created_at ? Date.parse(existingProfile.created_at) : NaN;
    const isFreshAccount = Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 15 * 60 * 1000;

    if (
      isFreshAccount &&
      safeRole !== "customer" &&
      existingProfile.primary_role === "customer"
    ) {
      await supabaseAdminFetch(`/rest/v1/profiles?id=eq.${user.id}`, {
        method: "PATCH",
        body: { primary_role: safeRole },
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
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  // Check if error is related to email verification link
  if (
    errorCode === "otp_expired" ||
    (errorDescription &&
      (errorDescription.toLowerCase().includes("email link") ||
        errorDescription.toLowerCase().includes("otp") ||
        errorDescription.toLowerCase().includes("expired") ||
        errorDescription.toLowerCase().includes("token")))
  ) {
    return NextResponse.redirect(
      new URL(
        `/auth/verified?status=error&message=${encodeURIComponent(
          errorDescription || "The verification link is invalid, expired, or has already been used."
        )}`,
        request.url
      )
    );
  }

  if (error || errorDescription) {
    const msg = errorDescription || error || "Google authentication was cancelled or failed.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase%20configuration%20is%20missing", request.url)
    );
  }

  // Handle email verification token_hash (e.g. from signup confirmation email)
  if (tokenHash && type) {
    try {
      const verifyRes = await fetch(`${config.url}/auth/v1/verify`, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_hash: tokenHash,
          type: type,
        }),
        cache: "no-store",
      });

      if (!verifyRes.ok) {
        let errMsg = "The verification link is invalid, expired, or has already been used.";
        try {
          const errJson = (await verifyRes.json()) as { message?: string; msg?: string; error_description?: string };
          errMsg = errJson.error_description || errJson.message || errJson.msg || errMsg;
        } catch {
          // keep fallback
        }
        return NextResponse.redirect(
          new URL(`/auth/verified?status=error&message=${encodeURIComponent(errMsg)}`, request.url)
        );
      }

      const verifiedSession = await verifyRes.json();
      if (isSessionPayload(verifiedSession)) {
        await persistSession(verifiedSession);
      }

      if (type === "recovery") {
        return NextResponse.redirect(new URL("/forgot-password?mode=reset", request.url));
      }

      return NextResponse.redirect(new URL("/auth/verified?status=success", request.url));
    } catch {
      return NextResponse.redirect(
        new URL(
          `/auth/verified?status=error&message=${encodeURIComponent(
            "An error occurred while confirming your email. Please try again."
          )}`,
          request.url
        )
      );
    }
  }

  // If no code query parameter was supplied, redirect to the client-side hash fragment catcher
  if (!code) {
    return NextResponse.redirect(new URL("/auth/callback/session", request.url));
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

  if (!verifier) {
    cookieStore.delete("el_oauth_role");
    cookieStore.delete("el_oauth_next");
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Your Google sign-in session expired or browser cookies were interrupted. Please click Continue with Google again."
        )}`,
        request.url
      )
    );
  }

  // Exchange authorization code with Supabase Auth PKCE endpoint
  const tokenRes = await fetch(`${config.url}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
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
