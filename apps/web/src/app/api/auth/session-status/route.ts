import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { resolveUserDashboardPath } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json(
      {
        authenticated: false,
        dashboardHref: "/dashboard",
        primaryRole: null,
        roles: [],
        hasProRole: false,
        hasBusinessRole: false,
        avatarUrl: null,
        fullName: null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const [dashboardHref, profileRes, rolesRes] = await Promise.all([
    resolveUserDashboardPath(auth.user.id, auth.accessToken),
    supabaseAdminFetch<Array<{ full_name: string | null; avatar_url: string | null; primary_role: string | null }>>(
      `/rest/v1/profiles?id=eq.${auth.user.id}&limit=1&select=full_name,avatar_url,primary_role`
    ),
    supabaseAdminFetch<Array<{ role: string }>>(
      `/rest/v1/user_roles?user_id=eq.${auth.user.id}&is_active=eq.true&revoked_at=is.null&select=role`
    ),
  ]);

  const profile = profileRes.ok && Array.isArray(profileRes.data) && profileRes.data[0] ? profileRes.data[0] : null;
  const rolesList = rolesRes.ok && Array.isArray(rolesRes.data) ? rolesRes.data.map((r) => r.role) : [];
  const primaryRole = profile?.primary_role || null;
  if (primaryRole && !rolesList.includes(primaryRole)) {
    rolesList.push(primaryRole);
  }

  const hasProRole = rolesList.includes("professional");
  const hasBusinessRole = rolesList.includes("business") || rolesList.includes("property_manager");

  return NextResponse.json(
    {
      authenticated: true,
      email: auth.user.email,
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      primaryRole,
      roles: rolesList,
      hasProRole,
      hasBusinessRole,
      dashboardHref,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
