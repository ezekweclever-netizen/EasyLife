import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { resolveUserDashboardPath } from "@/lib/auth/admin-guard";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json(
      { authenticated: false, dashboardHref: "/dashboard" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const dashboardHref = await resolveUserDashboardPath(auth.user.id, auth.accessToken);
  return NextResponse.json(
    {
      authenticated: true,
      email: auth.user.email,
      dashboardHref,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
