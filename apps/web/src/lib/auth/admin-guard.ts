/**
 * Server-only Administrator Verification & Role Resolution Helpers.
 * Ensures only verified administrators can access /admin routes or execute
 * privileged administrative Server Actions.
 */

import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth/session";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface AdminCheckResult {
  ok: true;
  user: AuthenticatedUser;
  accessToken: string;
  fullName: string;
}

export interface AdminCheckFailure {
  ok: false;
  reason: "unauthenticated" | "forbidden";
  user?: AuthenticatedUser;
}

/**
 * Verifies that the current caller has an active authenticated Supabase session
 * AND holds the `admin` role in `public.profiles` or `public.user_roles`.
 */
export async function verifyAdminSession(): Promise<AdminCheckResult | AdminCheckFailure> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, reason: "unauthenticated" };
  }

  // Query profiles & user_roles using server-side admin client for authoritative check
  const [profileRes, roleRes] = await Promise.all([
    supabaseAdminFetch<
      Array<{
        id: string;
        full_name: string | null;
        primary_role: string | null;
        is_active: boolean | null;
        is_suspended: boolean;
        deleted_at: string | null;
      }>
    >(
      `/rest/v1/profiles?id=eq.${auth.user.id}&limit=1&select=id,full_name,primary_role,is_active,is_suspended,deleted_at`
    ),
    supabaseAdminFetch<Array<{ role: string; is_active: boolean; revoked_at: string | null }>>(
      `/rest/v1/user_roles?user_id=eq.${auth.user.id}&role=eq.admin&is_active=eq.true&revoked_at=is.null&limit=1&select=role,is_active,revoked_at`
    ),
  ]);

  const profile =
    profileRes.ok && Array.isArray(profileRes.data) && profileRes.data.length > 0
      ? profileRes.data[0]
      : null;

  const hasAdminRoleRecord =
    roleRes.ok &&
    Array.isArray(roleRes.data) &&
    roleRes.data.some((r) => r.role === "admin" && r.is_active === true && r.revoked_at === null);

  const isActive = profile?.is_active === true;
  const isSuspended = Boolean(profile?.is_suspended);
  const isDeleted = Boolean(profile?.deleted_at);
  const isAdmin =
    Boolean(profile) &&
    isActive &&
    !isSuspended &&
    !isDeleted &&
    hasAdminRoleRecord &&
    profile?.primary_role === "admin";

  if (!isAdmin) {
    return {
      ok: false,
      reason: "forbidden",
      user: auth.user,
    };
  }

  return {
    ok: true,
    user: auth.user,
    accessToken: auth.accessToken,
    fullName: profile?.full_name || auth.user.email?.split("@")[0]?.toUpperCase() || "Platform Administrator",
  };
}

/**
 * Determines the primary destination route for an authenticated user based on their role.
 */
export async function resolveUserDashboardPath(
  userId: string,
  accessToken?: string
): Promise<string> {
  const config = getSupabasePublicConfig();

  // Check authoritative profile & user_roles concurrently
  const [profileRes, rolesRes] = await Promise.all([
    config && accessToken
      ? supabaseFetch<Array<{ primary_role: string | null }>>(
          config,
          `/rest/v1/profiles?id=eq.${userId}&limit=1&select=primary_role`,
          { accessToken }
        )
      : supabaseAdminFetch<Array<{ primary_role: string | null }>>(
          `/rest/v1/profiles?id=eq.${userId}&limit=1&select=primary_role`
        ),
    supabaseAdminFetch<Array<{ role: string }>>(
      `/rest/v1/user_roles?user_id=eq.${userId}&is_active=eq.true&revoked_at=is.null&select=role`
    ),
  ]);

  const primaryRole =
    profileRes.ok && Array.isArray(profileRes.data) && profileRes.data[0]?.primary_role
      ? profileRes.data[0].primary_role
      : null;

  if (primaryRole === "admin") return "/admin";
  if (primaryRole === "professional") return "/pro/dashboard";
  if (primaryRole === "business" || primaryRole === "property_manager") return "/business";

  // Secondary check in user_roles in case elevated role was added alongside customer
  if (rolesRes.ok && Array.isArray(rolesRes.data)) {
    const roles = rolesRes.data.map((r) => r.role);
    if (roles.includes("admin")) return "/admin";
    if (roles.includes("professional")) return "/pro/dashboard";
    if (roles.includes("business") || roles.includes("property_manager")) return "/business";
  }

  return "/dashboard";
}
