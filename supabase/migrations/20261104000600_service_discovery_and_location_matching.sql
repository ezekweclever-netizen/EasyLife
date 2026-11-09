-- Migration: 20261104000600_service_discovery_and_location_matching.sql
-- Description: PostGIS geospatial setup, 10 initial service categories, Port Harcourt neighbourhoods,
--              location-based professional matching engine RPC, and administrative category controls.

BEGIN;

-- ============================================================================
-- 1. POSTGIS GEOSPATIAL EXTENSION & ENHANCEMENTS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1.1 Enhance professional_service_areas with geospatial coordinates
ALTER TABLE public.professional_service_areas
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,6);

-- Add generated geography column for spatial indexing and calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_service_areas'
      AND column_name = 'geom'
  ) THEN
    ALTER TABLE public.professional_service_areas
      ADD COLUMN geom geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pro_service_areas_geom
  ON public.professional_service_areas USING GIST (geom);

-- 1.2 Enhance bookings with geospatial coordinates
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'geom'
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN geom geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_geom
  ON public.bookings USING GIST (geom);

-- ============================================================================
-- 2. PORT HARCOURT & SURROUNDING LOCALITIES REFERENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.operating_neighbourhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL DEFAULT 'Rivers State',
  city text NOT NULL DEFAULT 'Port Harcourt',
  lga text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  latitude numeric(10,6) NOT NULL,
  longitude numeric(10,6) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_operating_neighbourhood_slug UNIQUE (state, city, slug)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'operating_neighbourhoods'
      AND column_name = 'geom'
  ) THEN
    ALTER TABLE public.operating_neighbourhoods
      ADD COLUMN geom geography(Point, 4326)
      GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_operating_neighbourhoods_geom
  ON public.operating_neighbourhoods USING GIST (geom);

-- Seed Initial Port Harcourt & Surrounding Localities with accurate GPS
INSERT INTO public.operating_neighbourhoods (state, city, lga, name, slug, latitude, longitude, display_order)
VALUES
  ('Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Woji', 'woji', 4.8242, 7.0620, 1),
  ('Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Peter Odili / Trans-Amadi', 'trans-amadi-peter-odili', 4.8050, 7.0380, 2),
  ('Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Old GRA', 'old-gra', 4.8180, 7.0060, 3),
  ('Rivers State', 'Port Harcourt', 'Port Harcourt City', 'New GRA (Phases 1-3)', 'new-gra', 4.8250, 6.9950, 4),
  ('Rivers State', 'Port Harcourt', 'Port Harcourt City', 'D-Line', 'd-line', 4.8080, 7.0120, 5),
  ('Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Diobu (Mile 1-3)', 'diobu', 4.7930, 7.0010, 6),
  ('Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Rumuola', 'rumuola', 4.8390, 7.0020, 7),
  ('Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Rumuokoro & Eliozu', 'rumuokoro-eliozu', 4.8680, 6.9850, 8),
  ('Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Choba & Alakahia (UniPort Axis)', 'choba-alakahia', 4.8950, 6.9150, 9),
  ('Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Ada George & Mgbuoba', 'ada-george-mgbuoba', 4.8420, 6.9670, 10),
  ('Rivers State', 'Port Harcourt', 'Eleme', 'Aleto & Indorama Axis', 'aleto-eleme', 4.7920, 7.1150, 11),
  ('Rivers State', 'Port Harcourt', 'Eleme', 'Onne Free Zone', 'onne', 4.7210, 7.1580, 12),
  ('Rivers State', 'Port Harcourt', 'Ikwerre', 'Omagwa (Airport Area)', 'omagwa-airport', 4.9920, 6.9420, 13),
  ('Rivers State', 'Port Harcourt', 'Ikwerre', 'Igwuruta', 'igwuruta', 4.9350, 7.0150, 14),
  ('Rivers State', 'Port Harcourt', 'Oyigbo', 'Oyigbo Town', 'oyigbo', 4.8810, 7.1420, 15)
ON CONFLICT (state, city, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  lga = EXCLUDED.lga,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  display_order = EXCLUDED.display_order;

ALTER TABLE public.operating_neighbourhoods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "neighbourhoods_read_all" ON public.operating_neighbourhoods;
CREATE POLICY "neighbourhoods_read_all" ON public.operating_neighbourhoods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "neighbourhoods_admin_write" ON public.operating_neighbourhoods;
CREATE POLICY "neighbourhoods_admin_write" ON public.operating_neighbourhoods
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. INITIAL 10 SERVICE CATEGORIES (PER PROMPT 10 SPECIFICATION)
-- ============================================================================
-- Update existing 8 categories seamlessly to preserve foreign key references
UPDATE public.service_categories
SET
  name = 'Plumbing',
  slug = 'plumbing',
  description = 'Piping, water supply leaks, borehole pumps, overhead tanks, bathroom and kitchen fittings.',
  icon_name = 'wrench',
  display_order = 1,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000001' OR slug = 'plumbing-water-systems';

UPDATE public.service_categories
SET
  name = 'Electrical services',
  slug = 'electrical-services',
  description = 'House wiring, distribution boxes, circuit breakers, conduit repairs, lighting fixtures, and surge protectors.',
  icon_name = 'zap',
  display_order = 2,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000002' OR slug = 'electrical-power-backup';

UPDATE public.service_categories
SET
  name = 'Air conditioning and refrigeration',
  slug = 'air-conditioning-and-refrigeration',
  description = 'Split-unit AC servicing, compressor replacements, refrigerant gas top-up, deep coil washing, and chillers.',
  icon_name = 'wind',
  display_order = 3,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000003' OR slug = 'hvac-air-conditioning';

UPDATE public.service_categories
SET
  name = 'Generator and inverter repairs',
  slug = 'generator-and-inverter-repairs',
  description = 'Diesel/petrol generator mechanics, AVR & coil rewinding, scheduled oil service, inverter and battery backup repairs.',
  icon_name = 'settings',
  display_order = 4,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000004' OR slug = 'generator-maintenance';

UPDATE public.service_categories
SET
  name = 'Cleaning services',
  slug = 'cleaning-services',
  description = 'Post-construction deep cleaning, residential janitorial, upholstery steam extraction, and domestic hygiene.',
  icon_name = 'sparkles',
  display_order = 5,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000006' OR slug = 'cleaning-fumigation';

UPDATE public.service_categories
SET
  name = 'Painting',
  slug = 'painting',
  description = 'Interior & exterior wall painting, POP finishings, screeding, damp proofing, and epoxy flooring.',
  icon_name = 'paintbrush',
  display_order = 6,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000007' OR slug = 'painting-wall-finishing';

UPDATE public.service_categories
SET
  name = 'Carpentry',
  slug = 'carpentry',
  description = 'Cabinetry, door hung alignment, security lock installation, roofing trusses, and bespoke timber works.',
  icon_name = 'hammer',
  display_order = 7,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000005' OR slug = 'carpentry-doors-locks';

UPDATE public.service_categories
SET
  name = 'General home maintenance',
  slug = 'general-home-maintenance',
  description = 'Handyman fixes, masonry patching, broken tile replacement, roof leak sealant, and general property upkeep.',
  icon_name = 'tool',
  display_order = 9,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000008' OR slug = 'appliance-repair';

-- Insert Category 8: Pest control
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order)
VALUES (
  '10000000-0000-4000-8000-000000000009',
  'Pest control',
  'pest-control',
  'Fumigation, rodent baiting, subterranean termite treatments, and insect eradication.',
  'shield',
  1000,
  true,
  8
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Insert Category 10: Solar installation and maintenance
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order)
VALUES (
  '10000000-0000-4000-8000-000000000010',
  'Solar installation and maintenance',
  'solar-installation-and-maintenance',
  'Solar panel array mounting, MPPT/hybrid inverter configuration, lithium battery banks, and energy audits.',
  'sun',
  1000,
  true,
  10
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Ensure RLS on service_categories allows public read and strict admin write
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_categories_read_all" ON public.service_categories;
CREATE POLICY "service_categories_read_all" ON public.service_categories
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;
CREATE POLICY "service_categories_admin_all" ON public.service_categories
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. SERVICE DISCOVERY & LOCATION-BASED MATCHING ENGINE RPC
-- ============================================================================
-- Prioritises:
-- 1. Correct service category
-- 2. Service-area coverage & geographic distance
-- 3. Availability (only claimed if availability schedule/flag confirms it)
-- 4. Relevant experience
-- 5. Customer rating
-- 6. Verification status (badge & trust boost, without automatically conflating with technical competence)

-- Drop any previous function overload before recreating
DROP FUNCTION IF EXISTS public.match_service_professionals CASCADE;

CREATE OR REPLACE FUNCTION public.match_service_professionals(
  p_category_id uuid DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_city text DEFAULT 'Port Harcourt',
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
  match_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_ref_geom geography(Point, 4326) := NULL;
  v_day_of_week smallint := NULL;
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
  WITH matched_pros AS (
    SELECT DISTINCT ON (pp.id)
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
      -- Compute distance using PostGIS ST_Distance (in meters -> km)
      CASE
        WHEN v_ref_geom IS NOT NULL AND psa.geom IS NOT NULL
        THEN ST_Distance(psa.geom, v_ref_geom) / 1000.0
        WHEN v_ref_geom IS NOT NULL AND pp.primary_city = 'Port Harcourt'
        -- Approximate fallback to PH city center (4.8156, 7.0498) if pro area has no GPS
        THEN ST_Distance(ST_SetSRID(ST_MakePoint(7.0498, 4.8156), 4326)::geography, v_ref_geom) / 1000.0
        ELSE NULL
      END AS calc_dist_km,
      -- Check coverage match
      CASE
        WHEN p_neighbourhood IS NOT NULL AND psa.neighbourhood ILIKE '%' || p_neighbourhood || '%' THEN true
        WHEN p_lga IS NOT NULL AND psa.lga_or_district ILIKE '%' || p_lga || '%' THEN true
        WHEN p_city IS NOT NULL AND (psa.city ILIKE '%' || p_city || '%' OR pp.primary_city ILIKE '%' || p_city || '%') THEN true
        ELSE false
      END AS is_area_match,
      -- Category Relevance
      CASE
        WHEN p_category_id IS NOT NULL AND ps.category_id = p_category_id THEN 100.0
        WHEN p_category_slug IS NOT NULL AND sc.slug = p_category_slug THEN 100.0
        WHEN p_keyword IS NOT NULL AND (
          sc.name ILIKE '%' || p_keyword || '%'
          OR pp.headline ILIKE '%' || p_keyword || '%'
          OR pp.bio ILIKE '%' || p_keyword || '%'
        ) THEN 80.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps ON ps.professional_id = pp.id AND ps.is_active = true
    LEFT JOIN public.service_categories sc ON sc.id = ps.category_id
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      -- Verification filter if specified
      AND (NOT p_verified_only OR pp.verification_status = 'approved')
      -- Rating filter
      AND (pp.average_rating >= p_min_rating)
      -- Category filter
      AND (
        (p_category_id IS NULL AND p_category_slug IS NULL)
        OR (p_category_id IS NOT NULL AND ps.category_id = p_category_id)
        OR (p_category_slug IS NOT NULL AND sc.slug = p_category_slug)
      )
      -- Keyword filter
      AND (
        p_keyword IS NULL
        OR p_keyword = ''
        OR pp.business_name ILIKE '%' || p_keyword || '%'
        OR pp.headline ILIKE '%' || p_keyword || '%'
        OR pp.bio ILIKE '%' || p_keyword || '%'
        OR sc.name ILIKE '%' || p_keyword || '%'
      )
      -- City / Area Filter
      AND (
        p_city IS NULL
        OR p_city = 'All Cities'
        OR pp.primary_city ILIKE '%' || p_city || '%'
        OR (psa.city IS NOT NULL AND psa.city ILIKE '%' || p_city || '%')
      )
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
    -- Match score weighting:
    -- 1. Category relevance (35%)
    -- 2. Location & distance proximity (25%)
    -- 3. Availability verification (15%)
    -- 4. Customer Rating & reviews (15%)
    -- 5. Relevant experience (5%)
    -- 6. Verification trust tier (5%)
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
    -- Availability filter
    (NOT p_available_only OR (mp.pro_is_avail = true AND mp.sched_avail = true))
    -- Distance filter
    AND (p_max_distance_km IS NULL OR mp.calc_dist_km IS NULL OR mp.calc_dist_km <= p_max_distance_km)
  ORDER BY
    match_score DESC,
    mp.pro_rating DESC,
    mp.pro_completed_jobs DESC,
    distance_km ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execution permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.match_service_professionals TO anon, authenticated;

COMMIT;
