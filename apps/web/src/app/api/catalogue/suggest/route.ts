import { NextRequest, NextResponse, after } from "next/server";
import {
  recordCatalogueSearchSignal,
  searchCatalogueDiscovery,
} from "@/lib/supabase/customer";

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get("q") || "";
    const trimmedQuery = rawQuery.trim().slice(0, 100);
    const rawLimit = Number.parseInt(
      request.nextUrl.searchParams.get("limit") || "6",
      10
    );
    const serviceLimit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(rawLimit, 12))
      : 6;

    const result = await searchCatalogueDiscovery(trimmedQuery, {
      categories: 3,
      subcategories: 3,
      services: serviceLimit,
    });

    if (trimmedQuery.length >= 3 && !result.hasError) {
      const topService = result.services[0];
      const topCategory = result.categories[0];
      const combinedCount =
        (result.totalServicesCount ?? result.services.length) +
        result.categories.length +
        result.subcategories.length;

      after(async () => {
        await recordCatalogueSearchSignal({
          query: trimmedQuery,
          surface: "suggest",
          resolvedCategoryId: topService?.category_id ?? topCategory?.id ?? null,
          resolvedServiceId: topService?.id ?? null,
          resultCount: combinedCount,
        });
      });
    }

    return NextResponse.json(
      {
        query: trimmedQuery,
        hasError: result.hasError,
        totalServices: result.totalServicesCount ?? result.services.length,
        categories: result.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon_name: c.icon_name,
          subcategory_count: c.subcategory_count,
          service_count: c.service_count,
        })),
        subcategories: result.subcategories.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          parent_name: s.parent_name,
          parent_slug: s.parent_slug,
          service_count: s.service_count,
        })),
        services: result.services.map((srv) => ({
          id: srv.id,
          service_code: srv.service_code,
          name: srv.name,
          slug: srv.slug,
          short_description: srv.short_description,
          category_name: srv.category_name,
          category_slug: srv.category_slug,
          subcategory_name: srv.subcategory_name,
          subcategory_slug: srv.subcategory_slug,
          base_price_min_kobo: srv.base_price_min_kobo,
          base_price_max_kobo: srv.base_price_max_kobo,
          is_featured: srv.is_featured,
          is_popular: srv.is_popular,
          available_provider_count:
            (srv as { available_provider_count?: number })
              .available_provider_count ?? undefined,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        query: "",
        hasError: true,
        totalServices: 0,
        categories: [],
        subcategories: [],
        services: [],
      },
      { status: 500 }
    );
  }
}
