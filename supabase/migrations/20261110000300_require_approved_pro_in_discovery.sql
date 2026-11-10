-- ============================================================================
-- Migration: 20261110000300_require_approved_pro_in_discovery.sql
-- Description: Ensure public marketplace discovery (match_service_professionals)
--              only exposes vetted/approved professionals (`verification_status = 'approved'`),
--              matching public.public_professional_directory and EasyLife's verification
--              policy so unsubmitted/pending/rejected profiles do not appear in
--              customer search or link to inaccessible /professionals/[id] pages.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.match_service_professionals CASCADE;

CREATE OR REPLACE FUNCTION public.match_service_professionals(
  p_category_id uuid DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_neighbourhood text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_max_distance_km numeric DEFAULT NULL,
  p_target_date date DEFAULT NULL,
  p_target_time time DEFAULT NULL,
  p_min_rating numeric DEFAULT 0.0,
  p_verified_only boolean DEFAULT false,
  p_available_only boolean DEFAULT false,
  p_provider_type text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_ref_geom geography(Point, 4326) := NULL;
  v_day_of_week smallint := NULL;
  v_keyword text := NULLIF(trim(p_keyword), '');
  v_category_slug text := NULLIF(trim(p_category_slug), '');
  v_city text := CASE
    WHEN NULLIF(trim(p_city), '') IS NULL THEN NULL
    WHEN lower(trim(p_city)) IN ('all', 'all cities') THEN NULL
    ELSE trim(p_city)
  END;
  v_lga text := NULLIF(trim(p_lga), '');
  v_neighbourhood text := NULLIF(trim(p_neighbourhood), '');
  v_provider_type text := NULLIF(trim(p_provider_type), '');
BEGIN
  -- If coordinates supplied, construct reference point
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_ref_geom := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  -- Determine day of week if date provided (0 = Sunday .. 6 = Saturday)
  IF p_target_date IS NOT NULL THEN
    v_day_of_week := EXTRACT(DOW FROM p_target_date)::smallint;
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
      sc.name AS cat_name,
      sc.slug AS cat_slug,
      ps.service_title AS ps_title,
      ps.is_primary_skill AS ps_primary,
      ps.created_at AS ps_created_at,
      pp.provider_type AS pro_type,
      -- Check calendar schedule availability
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
      -- Compute distance using PostGIS ST_Distance (in meters -> km) with fallbacks for all 3 hubs
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
      -- Check coverage match
      CASE
        WHEN v_neighbourhood IS NOT NULL AND psa.neighbourhood ILIKE '%' || v_neighbourhood || '%' THEN true
        WHEN v_lga IS NOT NULL AND psa.lga_or_district ILIKE '%' || v_lga || '%' THEN true
        WHEN v_city IS NOT NULL AND (psa.city ILIKE '%' || v_city || '%' OR pp.primary_city ILIKE '%' || v_city || '%') THEN true
        ELSE false
      END AS is_area_match,
      -- Category / Keyword Relevance (including parent/child categories and service_title)
      CASE
        WHEN p_category_id IS NOT NULL AND ps.category_id = p_category_id THEN 100.0
        WHEN p_category_id IS NOT NULL AND sc.parent_id = p_category_id THEN 95.0
        WHEN v_category_slug IS NOT NULL AND sc.slug = v_category_slug THEN 100.0
        WHEN v_category_slug IS NOT NULL AND sc.parent_id IN (
          SELECT parent_sc.id FROM public.service_categories parent_sc WHERE parent_sc.slug = v_category_slug
        ) THEN 95.0
        WHEN v_keyword IS NOT NULL AND (
          COALESCE(ps.service_title, '') ILIKE '%' || v_keyword || '%'
          OR sc.name ILIKE '%' || v_keyword || '%'
        ) THEN 90.0
        WHEN v_keyword IS NOT NULL AND (
          pp.business_name ILIKE '%' || v_keyword || '%'
          OR pp.headline ILIKE '%' || v_keyword || '%'
          OR pp.bio ILIKE '%' || v_keyword || '%'
          OR COALESCE(ps.description, '') ILIKE '%' || v_keyword || '%'
        ) THEN 80.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps ON ps.professional_id = pp.id AND ps.is_active = true
    LEFT JOIN public.service_categories sc ON sc.id = ps.category_id
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND p.is_active = true
      AND p.is_suspended = false
      -- Enforce approved verification status consistent with public_professional_directory & RLS
      AND pp.verification_status = 'approved'
      -- Rating filter
      AND (pp.average_rating >= COALESCE(p_min_rating, 0.0))
      -- Provider Type filter (trade_technician, dispatch_rider, property_agent, business_provider)
      AND (v_provider_type IS NULL OR pp.provider_type = v_provider_type)
      -- Category filter (including subcategory resolution)
      AND (
        (p_category_id IS NULL AND v_category_slug IS NULL)
        OR (p_category_id IS NOT NULL AND (ps.category_id = p_category_id OR sc.parent_id = p_category_id))
        OR (
          v_category_slug IS NOT NULL
          AND (
            sc.slug = v_category_slug
            OR sc.parent_id IN (
              SELECT parent_sc.id FROM public.service_categories parent_sc WHERE parent_sc.slug = v_category_slug
            )
          )
        )
      )
      -- Keyword filter
      AND (
        v_keyword IS NULL
        OR pp.business_name ILIKE '%' || v_keyword || '%'
        OR COALESCE(pp.headline, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(pp.bio, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(sc.name, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(ps.service_title, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(ps.description, '') ILIKE '%' || v_keyword || '%'
      )
      -- City / Hub Filter
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
  )
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
    )::numeric(6,2) AS match_score
  FROM matched_pros mp
  WHERE
    (NOT p_available_only OR (mp.pro_is_avail = true AND mp.sched_avail = true))
    AND (p_max_distance_km IS NULL OR mp.calc_dist_km IS NULL OR mp.calc_dist_km <= p_max_distance_km)
  ORDER BY
    match_score DESC,
    mp.pro_rating DESC,
    mp.pro_completed_jobs DESC,
    distance_km ASC
  LIMIT COALESCE(p_limit, 25)
  OFFSET COALESCE(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_service_professionals(
  uuid, text, text, text, text, text, numeric, numeric, numeric, date, time, numeric, boolean, boolean, text, integer, integer
) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
