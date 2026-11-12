-- =============================================================================
-- Migration: Phase 6 — Search, Filtering & Pagination Optimization
-- Purpose:
--   1. Enable pg_trgm in extensions schema + add trigram & full keyword FTS
--      GIN indexes across public.services and public.service_categories.
--   2. Add indexed, paginated search_service_catalogue RPC supporting service
--      name, alternative keywords, service code, category/subcategory filters,
--      fuzzy typo fallback, live provider counts & availability status.
--   3. Upgrade match_service_professionals (preserving exact 18-param / 25-col
--      contract) to fix subcategory matching via services.subcategory_id,
--      category/subcategory keywords matching (e.g. "barber"), multi-word token
--      + FTS + trigram search, and normalized neighbourhood/LGA area matching.
--   4. Add search_professionals_paginated RPC returning total_count + server
--      sorting (relevance, rating, distance, experience, jobs, price_asc) for
--      clean, scalable pagination on /explore-services.
--   5. Ensure operating_neighbourhoods index for fast location lookups.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Search Extensions & Performance Indexes
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.easylife_build_search_tsvector(
  p_name TEXT,
  p_code TEXT,
  p_short_desc TEXT,
  p_desc TEXT,
  p_keywords TEXT[]
)
RETURNS TSVECTOR
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT pg_catalog.to_tsvector(
    'english',
    coalesce(p_name, '') || ' ' ||
    coalesce(p_code, '') || ' ' ||
    coalesce(p_short_desc, '') || ' ' ||
    coalesce(p_desc, '') || ' ' ||
    coalesce(pg_catalog.array_to_string(p_keywords, ' '), '')
  );
$$;

CREATE INDEX IF NOT EXISTS idx_services_full_fts_gin
  ON public.services
  USING GIN (public.easylife_build_search_tsvector(name, service_code, short_description, description, keywords))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_name_trgm_gin
  ON public.services
  USING GIN (name extensions.gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_code_trgm_gin
  ON public.services
  USING GIN (service_code extensions.gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_slug_lower
  ON public.services (lower(slug))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_categories_name_trgm_gin
  ON public.service_categories
  USING GIN (name extensions.gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_categories_slug_lower
  ON public.service_categories (lower(slug))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_operating_neighbourhoods_city_order
  ON public.operating_neighbourhoods (is_active, city, display_order, name)
  WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 2. Indexed, Paginated 3-Tier Service Catalogue Search RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_service_catalogue(
  p_query TEXT DEFAULT NULL,
  p_category_slug TEXT DEFAULT NULL,
  p_subcategory_slug TEXT DEFAULT NULL,
  p_requires_certification BOOLEAN DEFAULT NULL,
  p_include_unavailable BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  service_code TEXT,
  name TEXT,
  slug TEXT,
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  keywords TEXT[],
  base_price_min_kobo BIGINT,
  base_price_max_kobo BIGINT,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  is_popular BOOLEAN,
  show_on_homepage BOOLEAN,
  requires_trade_certification BOOLEAN,
  requires_business_registration BOOLEAN,
  requires_site_inspection BOOLEAN,
  min_years_experience SMALLINT,
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_icon TEXT,
  category_is_active BOOLEAN,
  subcategory_id UUID,
  subcategory_name TEXT,
  subcategory_slug TEXT,
  subcategory_is_active BOOLEAN,
  is_currently_available BOOLEAN,
  available_provider_count BIGINT,
  relevance_score NUMERIC,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $$
DECLARE
  v_query TEXT := NULLIF(trim(COALESCE(p_query, '')), '');
  v_query_lower TEXT := NULLIF(lower(trim(COALESCE(p_query, ''))), '');
  v_cat_slug TEXT := NULLIF(lower(trim(COALESCE(p_category_slug, ''))), '');
  v_sub_slug TEXT := NULLIF(lower(trim(COALESCE(p_subcategory_slug, ''))), '');
  v_tsquery TSQUERY := NULL;
  v_tokens TEXT[] := ARRAY[]::TEXT[];
  v_allow_unavailable BOOLEAN := COALESCE(p_include_unavailable, false);
  v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_limit, 24), 100));
  v_offset INTEGER := GREATEST(0, COALESCE(p_offset, 0));
BEGIN
  IF v_query IS NOT NULL THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('english', v_query);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := plainto_tsquery('english', v_query);
    END;
    SELECT COALESCE(array_agg(tok), ARRAY[]::TEXT[])
    INTO v_tokens
    FROM (
      SELECT trim(x) AS tok
      FROM unnest(regexp_split_to_array(v_query_lower, '[\s,/+&_-]+')) AS x
      WHERE char_length(trim(x)) >= 2
      LIMIT 8
    ) t;
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT
      s.id,
      s.service_code,
      s.name,
      s.slug,
      s.short_description,
      s.description,
      s.image_url,
      s.icon_name,
      s.keywords,
      s.base_price_min_kobo,
      s.base_price_max_kobo,
      s.estimated_duration_minutes,
      s.is_active,
      s.is_featured,
      s.is_popular,
      s.show_on_homepage,
      s.requires_trade_certification,
      s.requires_business_registration,
      s.requires_site_inspection,
      s.min_years_experience,
      mc.id AS category_id,
      mc.name AS category_name,
      mc.slug AS category_slug,
      mc.icon_name AS category_icon,
      mc.is_active AS category_is_active,
      sub.id AS subcategory_id,
      sub.name AS subcategory_name,
      sub.slug AS subcategory_slug,
      COALESCE(sub.is_active, true) AS subcategory_is_active,
      (s.is_active AND mc.is_active AND (sub.id IS NULL OR sub.is_active)) AS is_currently_available,
      s.display_order,
      (
        CASE
          WHEN v_query_lower IS NULL THEN
            (CASE WHEN s.show_on_homepage THEN 20.0 ELSE 0.0 END)
            + (CASE WHEN s.is_featured THEN 15.0 ELSE 0.0 END)
            + (CASE WHEN s.is_popular THEN 10.0 ELSE 0.0 END)
            + (1000.0 / GREATEST(1, s.display_order + 10))
          ELSE
            (CASE WHEN lower(s.service_code) = v_query_lower OR lower(s.slug) = v_query_lower THEN 120.0 ELSE 0.0 END)
            + (CASE WHEN lower(s.name) = v_query_lower THEN 110.0 ELSE 0.0 END)
            + (CASE WHEN lower(s.name) LIKE v_query_lower || '%' THEN 60.0 ELSE 0.0 END)
            + (CASE WHEN lower(s.name) LIKE '%' || v_query_lower || '%' THEN 40.0 ELSE 0.0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM unnest(COALESCE(s.keywords, ARRAY[]::TEXT[])) kw
                WHERE lower(kw) = v_query_lower
              ) THEN 70.0 ELSE 0.0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM unnest(COALESCE(s.keywords, ARRAY[]::TEXT[])) kw
                WHERE lower(kw) LIKE '%' || v_query_lower || '%'
              ) THEN 42.0 ELSE 0.0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM unnest(COALESCE(sub.keywords, ARRAY[]::TEXT[]) || COALESCE(mc.keywords, ARRAY[]::TEXT[])) kw
                WHERE lower(kw) LIKE '%' || v_query_lower || '%'
              ) THEN 24.0 ELSE 0.0 END)
            + (CASE WHEN v_tsquery IS NOT NULL AND (
                public.easylife_build_search_tsvector(s.name, s.service_code, s.short_description, s.description, s.keywords) @@ v_tsquery
              ) THEN 35.0 ELSE 0.0 END)
            + (COALESCE((
                SELECT COUNT(*)::NUMERIC * 12.0
                FROM unnest(v_tokens) tok
                WHERE lower(s.name) LIKE '%' || tok || '%'
                   OR lower(COALESCE(s.short_description, '')) LIKE '%' || tok || '%'
                   OR lower(COALESCE(sub.name, '')) LIKE '%' || tok || '%'
                   OR lower(mc.name) LIKE '%' || tok || '%'
                   OR EXISTS (
                     SELECT 1
                     FROM unnest(
                       COALESCE(s.keywords, ARRAY[]::TEXT[])
                       || COALESCE(sub.keywords, ARRAY[]::TEXT[])
                       || COALESCE(mc.keywords, ARRAY[]::TEXT[])
                     ) akw
                     WHERE lower(akw) LIKE '%' || tok || '%'
                   )
              ), 0.0))
            + (GREATEST(
                extensions.similarity(lower(s.name), v_query_lower)::NUMERIC,
                extensions.similarity(lower(mc.name), v_query_lower)::NUMERIC,
                extensions.similarity(lower(COALESCE(sub.name, '')), v_query_lower)::NUMERIC
              ) * 30.0)
        END
      )::NUMERIC(10, 3) AS relevance_score
    FROM public.services s
    JOIN public.service_categories mc
      ON mc.id = s.category_id
     AND mc.deleted_at IS NULL
    LEFT JOIN public.service_categories sub
      ON sub.id = s.subcategory_id
     AND sub.deleted_at IS NULL
    WHERE s.deleted_at IS NULL
      AND (
        v_allow_unavailable = true
        OR (s.is_active = true AND mc.is_active = true AND (sub.id IS NULL OR sub.is_active = true))
      )
      AND (
        v_cat_slug IS NULL
        OR lower(mc.slug) = v_cat_slug
        OR lower(COALESCE(sub.slug, '')) = v_cat_slug
      )
      AND (
        v_sub_slug IS NULL
        OR lower(COALESCE(sub.slug, '')) = v_sub_slug
      )
      AND (
        p_requires_certification IS NULL
        OR s.requires_trade_certification = p_requires_certification
      )
      AND (
        v_query_lower IS NULL
        OR lower(s.name) LIKE '%' || v_query_lower || '%'
        OR lower(s.slug) LIKE '%' || v_query_lower || '%'
        OR lower(s.service_code) LIKE '%' || v_query_lower || '%'
        OR lower(COALESCE(s.short_description, '')) LIKE '%' || v_query_lower || '%'
        OR lower(COALESCE(s.description, '')) LIKE '%' || v_query_lower || '%'
        OR lower(mc.name) LIKE '%' || v_query_lower || '%'
        OR lower(COALESCE(sub.name, '')) LIKE '%' || v_query_lower || '%'
        OR (v_tsquery IS NOT NULL AND public.easylife_build_search_tsvector(s.name, s.service_code, s.short_description, s.description, s.keywords) @@ v_tsquery)
        OR EXISTS (
          SELECT 1
          FROM unnest(
            COALESCE(s.keywords, ARRAY[]::TEXT[])
            || COALESCE(sub.keywords, ARRAY[]::TEXT[])
            || COALESCE(mc.keywords, ARRAY[]::TEXT[])
          ) kw
          WHERE lower(kw) LIKE '%' || v_query_lower || '%'
        )
        OR (
          cardinality(v_tokens) > 0
          AND NOT EXISTS (
            SELECT 1
            FROM unnest(v_tokens) tok
            WHERE NOT (
              lower(s.name) LIKE '%' || tok || '%'
              OR lower(s.service_code) LIKE '%' || tok || '%'
              OR lower(COALESCE(s.short_description, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(s.description, '')) LIKE '%' || tok || '%'
              OR lower(mc.name) LIKE '%' || tok || '%'
              OR lower(COALESCE(sub.name, '')) LIKE '%' || tok || '%'
              OR EXISTS (
                SELECT 1
                FROM unnest(
                  COALESCE(s.keywords, ARRAY[]::TEXT[])
                  || COALESCE(sub.keywords, ARRAY[]::TEXT[])
                  || COALESCE(mc.keywords, ARRAY[]::TEXT[])
                ) akw
                WHERE lower(akw) LIKE '%' || tok || '%'
              )
            )
          )
        )
        OR extensions.similarity(lower(s.name), v_query_lower)::NUMERIC >= 0.24
      )
  ),
  paged AS (
    SELECT
      sc_out.*,
      COUNT(*) OVER()::BIGINT AS total_count
    FROM scored sc_out
    ORDER BY
      sc_out.is_currently_available DESC,
      sc_out.relevance_score DESC,
      sc_out.is_featured DESC,
      sc_out.is_popular DESC,
      sc_out.display_order ASC,
      sc_out.name ASC
    LIMIT v_limit
    OFFSET v_offset
  )
  SELECT
    p_row.id,
    p_row.service_code,
    p_row.name,
    p_row.slug,
    p_row.short_description,
    p_row.description,
    p_row.image_url,
    p_row.icon_name,
    p_row.keywords,
    p_row.base_price_min_kobo,
    p_row.base_price_max_kobo,
    p_row.estimated_duration_minutes,
    p_row.is_active,
    p_row.is_featured,
    p_row.is_popular,
    p_row.show_on_homepage,
    p_row.requires_trade_certification,
    p_row.requires_business_registration,
    p_row.requires_site_inspection,
    p_row.min_years_experience,
    p_row.category_id,
    p_row.category_name,
    p_row.category_slug,
    p_row.category_icon,
    p_row.category_is_active,
    p_row.subcategory_id,
    p_row.subcategory_name,
    p_row.subcategory_slug,
    p_row.subcategory_is_active,
    p_row.is_currently_available,
    COALESCE(pc.pro_cnt, 0::BIGINT) AS available_provider_count,
    p_row.relevance_score,
    p_row.total_count
  FROM paged p_row
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT pp.id)::BIGINT AS pro_cnt
    FROM public.professional_services ps
    JOIN public.professional_profiles pp
      ON pp.id = ps.professional_id
     AND pp.deleted_at IS NULL
     AND pp.verification_status = 'approved'
    JOIN public.profiles prof
      ON prof.id = pp.user_id
     AND prof.deleted_at IS NULL
     AND prof.is_active = true
     AND prof.is_suspended = false
    WHERE ps.is_active = true
      AND ps.deleted_at IS NULL
      AND (
        ps.service_id = p_row.id
        OR (p_row.subcategory_id IS NOT NULL AND ps.category_id = p_row.subcategory_id)
        OR ps.category_id = p_row.category_id
      )
  ) pc ON true;
END;
$$;

REVOKE ALL ON FUNCTION public.search_service_catalogue(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_service_catalogue(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Add Server-Paginated & Sorted Professional Search RPC + Upgrade Legacy RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_professionals_paginated(
  p_category_id uuid DEFAULT NULL::uuid,
  p_category_slug text DEFAULT NULL::text,
  p_keyword text DEFAULT NULL::text,
  p_city text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_neighbourhood text DEFAULT NULL::text,
  p_latitude numeric DEFAULT NULL::numeric,
  p_longitude numeric DEFAULT NULL::numeric,
  p_max_distance_km numeric DEFAULT NULL::numeric,
  p_target_date date DEFAULT NULL::date,
  p_target_time time without time zone DEFAULT NULL::time without time zone,
  p_min_rating numeric DEFAULT 0.0,
  p_verified_only boolean DEFAULT false,
  p_available_only boolean DEFAULT false,
  p_provider_type text DEFAULT NULL::text,
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0,
  p_service_id uuid DEFAULT NULL::uuid,
  p_sort_by text DEFAULT 'relevance'::text
)
RETURNS TABLE(
  professional_id uuid,
  user_id uuid,
  business_name text,
  slug text,
  headline text,
  bio text,
  years_of_experience smallint,
  verification_status public.verification_status,
  is_verified boolean,
  is_available boolean,
  is_schedule_available boolean,
  average_rating numeric,
  review_count integer,
  completed_jobs_count integer,
  base_callout_fee_kobo bigint,
  primary_city text,
  primary_state text,
  avatar_url text,
  distance_km numeric,
  coverage_match boolean,
  category_name text,
  category_slug text,
  service_title text,
  provider_type text,
  match_score numeric,
  matched_service_id uuid,
  matched_service_name text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_ref_geom geography(Point, 4326) := NULL;
  v_day_of_week smallint := NULL;
  v_keyword text := NULLIF(trim(COALESCE(p_keyword, '')), '');
  v_keyword_lower text := NULLIF(lower(trim(COALESCE(p_keyword, ''))), '');
  v_category_slug text := NULLIF(lower(trim(COALESCE(p_category_slug, ''))), '');
  v_city text := CASE
    WHEN NULLIF(trim(COALESCE(p_city, '')), '') IS NULL THEN NULL
    WHEN lower(trim(p_city)) IN ('all', 'all cities') THEN NULL
    ELSE trim(p_city)
  END;
  v_lga text := NULLIF(trim(replace(COALESCE(p_lga, ''), '-', ' ')), '');
  v_neighbourhood text := NULLIF(trim(replace(COALESCE(p_neighbourhood, ''), '-', ' ')), '');
  v_provider_type text := NULLIF(trim(COALESCE(p_provider_type, '')), '');
  v_sort_by text := COALESCE(NULLIF(lower(trim(p_sort_by)), ''), 'relevance');
  v_srv_cat_id uuid := NULL;
  v_srv_sub_id uuid := NULL;
  v_filter_cat_id uuid := p_category_id;
  v_filter_cat_parent_id uuid := NULL;
  v_tsquery tsquery := NULL;
  v_tokens text[] := ARRAY[]::text[];
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 12), 100));
  v_offset integer := GREATEST(0, COALESCE(p_offset, 0));
BEGIN
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_ref_geom := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  IF p_target_date IS NOT NULL THEN
    v_day_of_week := EXTRACT(DOW FROM p_target_date)::smallint;
  END IF;

  IF p_service_id IS NOT NULL THEN
    SELECT s.category_id, s.subcategory_id
    INTO v_srv_cat_id, v_srv_sub_id
    FROM public.services s
    WHERE s.id = p_service_id
      AND s.deleted_at IS NULL
      AND s.is_active = true;
  END IF;

  IF v_filter_cat_id IS NULL AND v_category_slug IS NOT NULL THEN
    SELECT sc.id, sc.parent_id
    INTO v_filter_cat_id, v_filter_cat_parent_id
    FROM public.service_categories sc
    WHERE lower(sc.slug) = v_category_slug
      AND sc.deleted_at IS NULL
      AND sc.is_active = true
    LIMIT 1;
  ELSIF v_filter_cat_id IS NOT NULL THEN
    SELECT sc.parent_id
    INTO v_filter_cat_parent_id
    FROM public.service_categories sc
    WHERE sc.id = v_filter_cat_id
      AND sc.deleted_at IS NULL;
  END IF;

  IF v_keyword IS NOT NULL THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('english', v_keyword);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := plainto_tsquery('english', v_keyword);
    END;
    SELECT COALESCE(array_agg(tok), ARRAY[]::text[])
    INTO v_tokens
    FROM (
      SELECT trim(x) AS tok
      FROM unnest(regexp_split_to_array(v_keyword_lower, '[\s,/+&_-]+')) AS x
      WHERE char_length(trim(x)) >= 2
      LIMIT 8
    ) t;
  END IF;

  RETURN QUERY
  WITH candidate_rows AS (
    SELECT
      pp.id AS pro_id,
      pp.user_id AS pro_user_id,
      pp.business_name AS pro_biz_name,
      pp.slug AS pro_slug,
      pp.headline AS pro_headline,
      pp.bio AS pro_bio,
      pp.years_of_experience AS pro_exp,
      pp.verification_status AS pro_ver_status,
      (pp.verification_status = 'approved') AS pro_is_verified,
      pp.is_available AS pro_is_avail,
      pp.average_rating AS pro_rating,
      pp.review_count AS pro_rev_count,
      pp.completed_jobs_count AS pro_completed_jobs,
      pp.base_callout_fee_kobo AS pro_fee,
      pp.primary_city AS pro_city,
      pp.primary_state AS pro_state,
      p.avatar_url AS pro_avatar,
      COALESCE(parent_sc.name, sc.name) AS cat_name,
      COALESCE(parent_sc.slug, sc.slug) AS cat_slug,
      COALESCE(ps.service_title, cs.name) AS ps_title,
      cs.id AS cs_id,
      cs.name AS cs_name,
      ps.is_primary_skill AS ps_primary,
      ps.created_at AS ps_created_at,
      pp.provider_type AS pro_type,
      CASE
        WHEN p_target_date IS NULL THEN pp.is_available
        WHEN EXISTS (
          SELECT 1 FROM public.professional_availability pa
          WHERE pa.professional_id = pp.id
            AND pa.is_available = true
            AND (pa.day_of_week IS NULL OR pa.day_of_week = v_day_of_week)
            AND (p_target_time IS NULL OR (p_target_time >= pa.start_time AND p_target_time <= pa.end_time))
        ) THEN true
        ELSE false
      END AS sched_avail,
      CASE
        WHEN v_ref_geom IS NOT NULL AND psa.geom IS NOT NULL
        THEN ST_Distance(psa.geom, v_ref_geom) / 1000.0
        WHEN v_ref_geom IS NOT NULL AND pp.primary_city = 'Port Harcourt'
        THEN ST_Distance(ST_SetSRID(ST_MakePoint(7.0498, 4.8156), 4326)::geography, v_ref_geom) / 1000.0
        WHEN v_ref_geom IS NOT NULL AND pp.primary_city = 'Lagos'
        THEN ST_Distance(ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)::geography, v_ref_geom) / 1000.0
        WHEN v_ref_geom IS NOT NULL AND pp.primary_city = 'Abuja'
        THEN ST_Distance(ST_SetSRID(ST_MakePoint(7.3986, 9.0765), 4326)::geography, v_ref_geom) / 1000.0
        ELSE NULL
      END AS calc_dist_km,
      CASE
        WHEN v_neighbourhood IS NOT NULL AND (
          COALESCE(psa.neighbourhood, '') ILIKE '%' || v_neighbourhood || '%'
          OR COALESCE(psa.lga_or_district, '') ILIKE '%' || COALESCE(v_lga, v_neighbourhood) || '%'
        ) THEN true
        WHEN v_lga IS NOT NULL AND COALESCE(psa.lga_or_district, '') ILIKE '%' || v_lga || '%' THEN true
        WHEN v_city IS NOT NULL AND (
          COALESCE(psa.city, '') ILIKE '%' || v_city || '%'
          OR pp.primary_city ILIKE '%' || v_city || '%'
        ) THEN true
        ELSE false
      END AS is_area_match,
      CASE
        WHEN p_service_id IS NOT NULL AND ps.service_id = p_service_id THEN 105.0
        WHEN v_filter_cat_id IS NOT NULL AND (
          ps.category_id = v_filter_cat_id
          OR cs.subcategory_id = v_filter_cat_id
          OR cs.category_id = v_filter_cat_id
        ) THEN 100.0
        WHEN v_filter_cat_id IS NOT NULL AND sc.parent_id = v_filter_cat_id THEN 96.0
        WHEN v_filter_cat_parent_id IS NOT NULL AND ps.category_id = v_filter_cat_parent_id THEN 84.0
        WHEN p_service_id IS NOT NULL AND (
          ps.category_id = v_srv_sub_id OR ps.category_id = v_srv_cat_id
        ) THEN 90.0
        WHEN v_keyword_lower IS NOT NULL AND (
          lower(COALESCE(ps.service_title, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(cs.name, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(sc.name, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(sub_cs.name, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(parent_sc.name, '')) LIKE '%' || v_keyword_lower || '%'
        ) THEN 92.0
        WHEN v_keyword_lower IS NOT NULL AND (
          lower(pp.business_name) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(pp.headline, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(pp.bio, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(ps.description, '')) LIKE '%' || v_keyword_lower || '%'
          OR lower(COALESCE(sc.description, '')) LIKE '%' || v_keyword_lower || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(
              COALESCE(cs.keywords, ARRAY[]::text[])
              || COALESCE(sub_cs.keywords, ARRAY[]::text[])
              || COALESCE(sc.keywords, ARRAY[]::text[])
              || COALESCE(parent_sc.keywords, ARRAY[]::text[])
            ) kw
            WHERE lower(kw) LIKE '%' || v_keyword_lower || '%'
          )
        ) THEN 84.0
        WHEN v_keyword_lower IS NOT NULL THEN 72.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps
      ON ps.professional_id = pp.id AND ps.is_active = true AND ps.deleted_at IS NULL
    LEFT JOIN public.service_categories sc
      ON sc.id = ps.category_id AND sc.deleted_at IS NULL
    LEFT JOIN public.service_categories parent_sc
      ON parent_sc.id = sc.parent_id AND parent_sc.deleted_at IS NULL
    LEFT JOIN public.services cs
      ON cs.id = ps.service_id AND cs.deleted_at IS NULL
    LEFT JOIN public.service_categories sub_cs
      ON sub_cs.id = cs.subcategory_id AND sub_cs.deleted_at IS NULL
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND p.is_active = true
      AND p.is_suspended = false
      AND pp.verification_status = 'approved'
      AND (pp.average_rating >= COALESCE(p_min_rating, 0.0))
      AND (v_provider_type IS NULL OR pp.provider_type = v_provider_type)
      AND (
        p_service_id IS NULL
        OR ps.service_id = p_service_id
        OR (v_srv_sub_id IS NOT NULL AND (ps.category_id = v_srv_sub_id OR cs.subcategory_id = v_srv_sub_id))
        OR (v_srv_cat_id IS NOT NULL AND (ps.category_id = v_srv_cat_id OR cs.category_id = v_srv_cat_id))
      )
      AND (
        (v_filter_cat_id IS NULL AND v_category_slug IS NULL)
        OR (
          v_filter_cat_id IS NOT NULL
          AND (
            ps.category_id = v_filter_cat_id
            OR sc.parent_id = v_filter_cat_id
            OR cs.category_id = v_filter_cat_id
            OR cs.subcategory_id = v_filter_cat_id
            OR (v_filter_cat_parent_id IS NOT NULL AND ps.category_id = v_filter_cat_parent_id AND ps.service_id IS NULL)
          )
        )
      )
      AND (
        v_keyword_lower IS NULL
        OR lower(pp.business_name) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(pp.headline, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(pp.bio, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(sc.name, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(sc.description, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(parent_sc.name, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(ps.service_title, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(ps.description, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(cs.name, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(cs.short_description, '')) LIKE '%' || v_keyword_lower || '%'
        OR lower(COALESCE(sub_cs.name, '')) LIKE '%' || v_keyword_lower || '%'
        OR (v_tsquery IS NOT NULL AND cs.id IS NOT NULL AND public.easylife_build_search_tsvector(cs.name, cs.service_code, cs.short_description, cs.description, cs.keywords) @@ v_tsquery)
        OR EXISTS (
          SELECT 1
          FROM unnest(
            COALESCE(cs.keywords, ARRAY[]::text[])
            || COALESCE(sub_cs.keywords, ARRAY[]::text[])
            || COALESCE(sc.keywords, ARRAY[]::text[])
            || COALESCE(parent_sc.keywords, ARRAY[]::text[])
          ) kw
          WHERE lower(kw) LIKE '%' || v_keyword_lower || '%'
        )
        OR (
          cardinality(v_tokens) > 0
          AND NOT EXISTS (
            SELECT 1
            FROM unnest(v_tokens) tok
            WHERE NOT (
              lower(pp.business_name) LIKE '%' || tok || '%'
              OR lower(COALESCE(pp.headline, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(pp.bio, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(sc.name, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(parent_sc.name, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(ps.service_title, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(cs.name, '')) LIKE '%' || tok || '%'
              OR lower(COALESCE(sub_cs.name, '')) LIKE '%' || tok || '%'
              OR EXISTS (
                SELECT 1
                FROM unnest(
                  COALESCE(cs.keywords, ARRAY[]::text[])
                  || COALESCE(sub_cs.keywords, ARRAY[]::text[])
                  || COALESCE(sc.keywords, ARRAY[]::text[])
                  || COALESCE(parent_sc.keywords, ARRAY[]::text[])
                ) akw
                WHERE lower(akw) LIKE '%' || tok || '%'
              )
            )
          )
        )
        OR extensions.similarity(lower(COALESCE(cs.name, '')), v_keyword_lower)::numeric >= 0.30
        OR extensions.similarity(lower(COALESCE(sc.name, '')), v_keyword_lower)::numeric >= 0.30
      )
      AND (
        v_city IS NULL
        OR pp.primary_city ILIKE '%' || v_city || '%'
        OR (psa.city IS NOT NULL AND psa.city ILIKE '%' || v_city || '%')
      )
  ),
  matched_pros AS (
    SELECT DISTINCT ON (cr.pro_id)
      cr.*
    FROM candidate_rows cr
    ORDER BY
      cr.pro_id,
      cr.cat_score DESC,
      cr.is_area_match DESC,
      cr.calc_dist_km ASC NULLS LAST,
      cr.ps_primary DESC NULLS LAST,
      cr.ps_created_at ASC NULLS LAST
  ),
  filtered_pros AS (
    SELECT
      mp.pro_id,
      mp.pro_user_id,
      mp.pro_biz_name,
      mp.pro_slug,
      mp.pro_headline,
      mp.pro_bio,
      mp.pro_exp,
      mp.pro_ver_status,
      mp.pro_is_verified,
      mp.pro_is_avail,
      mp.sched_avail,
      mp.pro_rating,
      mp.pro_rev_count,
      mp.pro_completed_jobs,
      mp.pro_fee,
      mp.pro_city,
      mp.pro_state,
      mp.pro_avatar,
      ROUND(COALESCE(mp.calc_dist_km, 5.0)::numeric, 2) AS distance_km,
      mp.is_area_match,
      COALESCE(mp.cat_name, 'General Service') AS category_name,
      COALESCE(mp.cat_slug, 'general') AS category_slug,
      mp.ps_title AS service_title,
      mp.pro_type AS provider_type,
      (
        (mp.cat_score * 0.35) +
        (GREATEST(0.0, 100.0 - (COALESCE(mp.calc_dist_km, 5.0) * 2.5)) * 0.25) +
        (CASE WHEN mp.sched_avail AND mp.pro_is_avail THEN 100.0 ELSE 0.0 END * 0.15) +
        (((mp.pro_rating * 20.0) + LEAST(20.0, mp.pro_completed_jobs * 2.0)) * 0.15) +
        (LEAST(100.0, mp.pro_exp * 10.0) * 0.05) +
        (CASE WHEN mp.pro_is_verified THEN 100.0 ELSE 20.0 END * 0.05)
      )::numeric(6,2) AS match_score,
      mp.cs_id AS matched_service_id,
      mp.cs_name AS matched_service_name
    FROM matched_pros mp
    WHERE
      (NOT p_available_only OR (mp.pro_is_avail = true AND mp.sched_avail = true))
      AND (p_max_distance_km IS NULL OR mp.calc_dist_km IS NULL OR mp.calc_dist_km <= p_max_distance_km)
      AND (
        v_neighbourhood IS NULL
        OR mp.is_area_match = true
        OR (v_ref_geom IS NOT NULL AND mp.calc_dist_km IS NOT NULL AND mp.calc_dist_km <= COALESCE(p_max_distance_km, 25.0))
      )
      AND (
        v_lga IS NULL
        OR v_neighbourhood IS NOT NULL
        OR mp.is_area_match = true
        OR (v_ref_geom IS NOT NULL AND mp.calc_dist_km IS NOT NULL AND mp.calc_dist_km <= COALESCE(p_max_distance_km, 25.0))
      )
  )
  SELECT
    fp.pro_id,
    fp.pro_user_id,
    fp.pro_biz_name,
    fp.pro_slug,
    fp.pro_headline,
    fp.pro_bio,
    fp.pro_exp,
    fp.pro_ver_status,
    fp.pro_is_verified,
    fp.pro_is_avail,
    fp.sched_avail,
    fp.pro_rating,
    fp.pro_rev_count,
    fp.pro_completed_jobs,
    fp.pro_fee,
    fp.pro_city,
    fp.pro_state,
    fp.pro_avatar,
    fp.distance_km,
    fp.is_area_match,
    fp.category_name,
    fp.category_slug,
    fp.service_title,
    fp.provider_type,
    fp.match_score,
    fp.matched_service_id,
    fp.matched_service_name,
    COUNT(*) OVER()::bigint AS total_count
  FROM filtered_pros fp
  ORDER BY
    CASE WHEN v_sort_by = 'rating' THEN fp.pro_rating ELSE 0 END DESC,
    CASE WHEN v_sort_by = 'experience' THEN fp.pro_exp ELSE 0 END DESC,
    CASE WHEN v_sort_by = 'jobs' THEN fp.pro_completed_jobs ELSE 0 END DESC,
    CASE WHEN v_sort_by = 'distance' THEN fp.distance_km ELSE 0 END ASC,
    CASE WHEN v_sort_by = 'price_asc' THEN COALESCE(fp.pro_fee, 999999999) ELSE 0 END ASC,
    fp.match_score DESC,
    fp.pro_rating DESC,
    fp.pro_completed_jobs DESC,
    fp.distance_km ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.search_professionals_paginated(
  uuid, text, text, text, text, text, numeric, numeric, numeric, date, time without time zone, numeric, boolean, boolean, text, integer, integer, uuid, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_professionals_paginated(
  uuid, text, text, text, text, text, numeric, numeric, numeric, date, time without time zone, numeric, boolean, boolean, text, integer, integer, uuid, text
) TO anon, authenticated, service_role;

-- Keep legacy match_service_professionals 25-column signature 100% backwards compatible
-- while delegating to search_professionals_paginated for full Phase 6 matching accuracy.
CREATE OR REPLACE FUNCTION public.match_service_professionals(
  p_category_id uuid DEFAULT NULL::uuid,
  p_category_slug text DEFAULT NULL::text,
  p_keyword text DEFAULT NULL::text,
  p_city text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_neighbourhood text DEFAULT NULL::text,
  p_latitude numeric DEFAULT NULL::numeric,
  p_longitude numeric DEFAULT NULL::numeric,
  p_max_distance_km numeric DEFAULT NULL::numeric,
  p_target_date date DEFAULT NULL::date,
  p_target_time time without time zone DEFAULT NULL::time without time zone,
  p_min_rating numeric DEFAULT 0.0,
  p_verified_only boolean DEFAULT false,
  p_available_only boolean DEFAULT false,
  p_provider_type text DEFAULT NULL::text,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0,
  p_service_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  professional_id uuid,
  user_id uuid,
  business_name text,
  slug text,
  headline text,
  bio text,
  years_of_experience smallint,
  verification_status public.verification_status,
  is_verified boolean,
  is_available boolean,
  is_schedule_available boolean,
  average_rating numeric,
  review_count integer,
  completed_jobs_count integer,
  base_callout_fee_kobo bigint,
  primary_city text,
  primary_state text,
  avatar_url text,
  distance_km numeric,
  coverage_match boolean,
  category_name text,
  category_slug text,
  service_title text,
  provider_type text,
  match_score numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    sp.professional_id,
    sp.user_id,
    sp.business_name,
    sp.slug,
    sp.headline,
    sp.bio,
    sp.years_of_experience,
    sp.verification_status,
    sp.is_verified,
    sp.is_available,
    sp.is_schedule_available,
    sp.average_rating,
    sp.review_count,
    sp.completed_jobs_count,
    sp.base_callout_fee_kobo,
    sp.primary_city,
    sp.primary_state,
    sp.avatar_url,
    sp.distance_km,
    sp.coverage_match,
    sp.category_name,
    sp.category_slug,
    sp.service_title,
    sp.provider_type,
    sp.match_score
  FROM public.search_professionals_paginated(
    p_category_id,
    p_category_slug,
    p_keyword,
    p_city,
    p_lga,
    p_neighbourhood,
    p_latitude,
    p_longitude,
    p_max_distance_km,
    p_target_date,
    p_target_time,
    p_min_rating,
    p_verified_only,
    p_available_only,
    p_provider_type,
    p_limit,
    p_offset,
    p_service_id,
    'relevance'
  ) sp;
$function$;

GRANT EXECUTE ON FUNCTION public.match_service_professionals(
  uuid, text, text, text, text, text, numeric, numeric, numeric, date, time without time zone, numeric, boolean, boolean, text, integer, integer, uuid
) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
