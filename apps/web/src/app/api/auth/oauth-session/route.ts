import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { persistSession } from "@/lib/auth/session";
import { resolveUserDashboardPath } from "@/lib/auth/admin-guard";
import { ensureOAuthUserProfile } from "@/app/auth/callback/route";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      intended_role?: string;
    };

    if (!body.access_token || !body.refresh_token) {
      return NextResponse.json(
        { ok: false, message: "Missing OAuth session tokens." },
        { status: 400 }
      );
    }

    const config = getSupabasePublicConfig();
    if (!config) {
      return NextResponse.json(
        { ok: false, message: "Supabase configuration is missing." },
        { status: 500 }
      );
    }

    // Verify access token against Supabase Auth directly
    const userRes = await supabaseFetch<{
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }>(config, "/auth/v1/user", {
      accessToken: body.access_token,
    });

    if (!userRes.ok || !userRes.data?.id) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired OAuth access token." },
        { status: 401 }
      );
    }

    await persistSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_in: typeof body.expires_in === "number" ? body.expires_in : 3600,
      user: {
        id: userRes.data.id,
        email: userRes.data.email ?? null,
      },
    });

    await ensureOAuthUserProfile(userRes.data, body.intended_role);
    const redirectPath = await resolveUserDashboardPath(
      userRes.data.id,
      body.access_token
    );

    return NextResponse.json({ ok: true, redirectPath });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to finalize OAuth session." },
      { status: 500 }
    );
  }
}
