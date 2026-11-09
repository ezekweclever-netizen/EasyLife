import { NextResponse } from "next/server";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const config = getSupabasePublicConfig();

  if (!config) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "easylife-web",
        database: "unconfigured",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  const dbCheck = await supabaseFetch<Array<{ id: string }>>(
    config,
    "/rest/v1/service_categories?limit=1&select=id",
    { timeoutMs: 5000 }
  );

  const latencyMs = Date.now() - startedAt;

  if (!dbCheck.ok) {
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "easylife-web",
        database: "unreachable",
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "healthy",
    service: "easylife-web",
    database: "connected",
    hubs: ["Port Harcourt", "Lagos", "Abuja"],
    latencyMs,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
}
