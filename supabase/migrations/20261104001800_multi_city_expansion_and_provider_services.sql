-- ============================================================================
-- Migration: 20261104001800_multi_city_expansion_and_provider_services.sql
-- Description: Multi-City Coverage Expansion (Port Harcourt, Lagos, Abuja),
--              Multiple Services per Provider, and Location Hierarchy Seeding.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND OPERATING NEIGHBOURHOODS HIERARCHY
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'operating_neighbourhoods'
      AND column_name = 'country'
  ) THEN
    ALTER TABLE public.operating_neighbourhoods
      ADD COLUMN country text NOT NULL DEFAULT 'Nigeria';
  END IF;
END $$;

-- ============================================================================
-- 2. SEED COMPREHENSIVE NEIGHBOURHOODS ACROSS ALL 3 HUBS
-- ============================================================================

-- A. PORT HARCOURT & SURROUNDING RIVERS STATE COMMUNITIES
INSERT INTO public.operating_neighbourhoods (country, state, city, lga, name, slug, latitude, longitude, display_order)
VALUES
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Old GRA', 'ph-old-gra', 4.8180, 7.0060, 1),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'New GRA (Phases 1-4)', 'ph-new-gra', 4.8250, 6.9950, 2),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Trans-Amadi Industrial Area', 'ph-trans-amadi', 4.8090, 7.0390, 3),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Peter Odili Road Axis', 'ph-peter-odili', 4.8050, 7.0420, 4),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'D-Line', 'ph-d-line', 4.8080, 7.0120, 5),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Diobu (Miles 1-3)', 'ph-diobu', 4.7930, 7.0010, 6),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Borokiri & Old Township', 'ph-borokiri', 4.7560, 7.0310, 7),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Port Harcourt City', 'Abuloma & Amadi-Ama', 'ph-abuloma', 4.7920, 7.0540, 8),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Woji Estate & Town', 'ph-woji', 4.8242, 7.0620, 9),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Rumuola & Rumuadaolu', 'ph-rumuola', 4.8390, 7.0020, 10),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Rumuokoro Junction', 'ph-rumuokoro', 4.8680, 6.9850, 11),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Rumuokwuta', 'ph-rumuokwuta', 4.8340, 6.9870, 12),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Ada George & Mgbuoba', 'ph-ada-george', 4.8420, 6.9670, 13),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Eliozu & Rumuodara', 'ph-eliozu', 4.8640, 7.0210, 14),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Obio/Akpor', 'Choba & Alakahia (UniPort Axis)', 'ph-choba-alakahia', 4.8950, 6.9150, 15),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Eleme', 'Aleto & Indorama Complex', 'ph-aleto-eleme', 4.7920, 7.1150, 16),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Eleme', 'Onne Oil & Gas Free Zone', 'ph-onne', 4.7210, 7.1580, 17),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Oyigbo', 'Oyigbo Town & Express', 'ph-oyigbo', 4.8810, 7.1420, 18),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Ikwerre', 'Omagwa (Intl Airport Axis)', 'ph-omagwa-airport', 4.9920, 6.9420, 19),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Ikwerre', 'Igwuruta Town', 'ph-igwuruta', 4.9350, 7.0150, 20),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Okrika', 'Okrika Mainland', 'ph-okrika', 4.7430, 7.0860, 21),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Ogu-Bolo', 'Ogu Town', 'ph-ogu-town', 4.7120, 7.2140, 22),
  ('Nigeria', 'Rivers State', 'Port Harcourt', 'Tai', 'Tai Central Axis', 'ph-tai', 4.7710, 7.2980, 23)
ON CONFLICT (state, city, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  lga = EXCLUDED.lga,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  display_order = EXCLUDED.display_order;

-- B. LAGOS STATE COMMUNITIES
INSERT INTO public.operating_neighbourhoods (country, state, city, lga, name, slug, latitude, longitude, display_order)
VALUES
  ('Nigeria', 'Lagos State', 'Lagos', 'Ikeja', 'Ikeja GRA', 'lag-ikeja-gra', 6.5920, 3.3560, 30),
  ('Nigeria', 'Lagos State', 'Lagos', 'Ikeja', 'Alausa & Secretariat', 'lag-alausa', 6.6180, 3.3610, 31),
  ('Nigeria', 'Lagos State', 'Lagos', 'Ikeja', 'Allen Avenue & Opebi', 'lag-allen-opebi', 6.6020, 3.3590, 32),
  ('Nigeria', 'Lagos State', 'Lagos', 'Eti-Osa', 'Victoria Island (VI)', 'lag-victoria-island', 6.4281, 3.4219, 33),
  ('Nigeria', 'Lagos State', 'Lagos', 'Eti-Osa', 'Ikoyi (Old & Banana Island)', 'lag-ikoyi', 6.4520, 3.4410, 34),
  ('Nigeria', 'Lagos State', 'Lagos', 'Eti-Osa', 'Lekki Phase 1', 'lag-lekki-phase1', 6.4470, 3.4720, 35),
  ('Nigeria', 'Lagos State', 'Lagos', 'Eti-Osa', 'Lekki Phase 2 & Chevron', 'lag-lekki-phase2', 6.4350, 3.5380, 36),
  ('Nigeria', 'Lagos State', 'Lagos', 'Eti-Osa', 'Ajah & Badore Axis', 'lag-ajah', 6.4670, 3.5710, 37),
  ('Nigeria', 'Lagos State', 'Lagos', 'Ibeju-Lekki', 'Sangotedo & Eleko Axis', 'lag-sangotedo', 6.4780, 3.6320, 38),
  ('Nigeria', 'Lagos State', 'Lagos', 'Lagos Island', 'Marina & Broad Street (CMS)', 'lag-marina', 6.4530, 3.3950, 39),
  ('Nigeria', 'Lagos State', 'Lagos', 'Surulere', 'Surulere (Adeniran Ogunsanya & Bode Thomas)', 'lag-surulere', 6.4980, 3.3580, 40),
  ('Nigeria', 'Lagos State', 'Lagos', 'Lagos Mainland', 'Yaba & Sabo Tech Hub', 'lag-yaba', 6.5090, 3.3780, 41),
  ('Nigeria', 'Lagos State', 'Lagos', 'Apapa', 'Apapa Wharf & GRA', 'lag-apapa', 6.4460, 3.3640, 42),
  ('Nigeria', 'Lagos State', 'Lagos', 'Kosofe', 'Magodo (GRA Phase 1 & 2)', 'lag-magodo', 6.6210, 3.3820, 43),
  ('Nigeria', 'Lagos State', 'Lagos', 'Kosofe', 'Gbagada (Phases 1 & 2)', 'lag-gbagada', 6.5560, 3.3890, 44),
  ('Nigeria', 'Lagos State', 'Lagos', 'Oshodi-Isolo', 'Ajao Estate & Oshodi', 'lag-ajao-estate', 6.5410, 3.3370, 45),
  ('Nigeria', 'Lagos State', 'Lagos', 'Alimosho', 'Egbeda & Gowon Estate', 'lag-alimosho-egbeda', 6.5980, 3.2840, 46),
  ('Nigeria', 'Lagos State', 'Lagos', 'Amuwo-Odofin', 'Festac Town', 'lag-festac', 6.4680, 3.2860, 47),
  ('Nigeria', 'Lagos State', 'Lagos', 'Ikorodu', 'Ikorodu Town & Agric', 'lag-ikorodu', 6.6180, 3.5120, 48),
  ('Nigeria', 'Lagos State', 'Lagos', 'Badagry', 'Badagry Central', 'lag-badagry', 6.4310, 2.8840, 49),
  ('Nigeria', 'Lagos State', 'Lagos', 'Epe', 'Epe Town & Marina', 'lag-epe', 6.5840, 3.9830, 50)
ON CONFLICT (state, city, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  lga = EXCLUDED.lga,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  display_order = EXCLUDED.display_order;

-- C. ABUJA FEDERAL CAPITAL TERRITORY (FCT) COMMUNITIES
INSERT INTO public.operating_neighbourhoods (country, state, city, lga, name, slug, latitude, longitude, display_order)
VALUES
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Central Business District (CBD)', 'abj-cbd', 9.0570, 7.4950, 60),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Maitama District', 'abj-maitama', 9.0882, 7.4934, 61),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Asokoro District', 'abj-asokoro', 9.0430, 7.5250, 62),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Wuse 2 & Wuse Zones 1-7', 'abj-wuse', 9.0680, 7.4720, 63),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Garki 1 & Garki 2', 'abj-garki', 9.0300, 7.4800, 64),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Jabi & Utako Districts', 'abj-jabi-utako', 9.0710, 7.4320, 65),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Gwarinpa Estate (1st-5th Ave)', 'abj-gwarinpa', 9.1120, 7.4040, 66),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Life Camp & Kado', 'abj-life-camp', 9.0780, 7.4110, 67),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Apo & Apo Legislative Quarters', 'abj-apo', 8.9950, 7.5020, 68),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Lugbe (Airport Road Corridor)', 'abj-lugbe', 8.9740, 7.3780, 69),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Guzape & Asokoro Extension', 'abj-guzape', 9.0250, 7.5180, 70),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Lokogoma & Galadimawa', 'abj-lokogoma', 8.9890, 7.4640, 71),
  ('Nigeria', 'FCT', 'Abuja', 'Bwari', 'Kubwa & Phase 4', 'abj-kubwa', 9.1550, 7.3320, 72),
  ('Nigeria', 'FCT', 'Abuja', 'Bwari', 'Bwari Central', 'abj-bwari', 9.2880, 7.3820, 73),
  ('Nigeria', 'FCT', 'Abuja', 'Kuje', 'Kuje Town & Extension', 'abj-kuje', 8.8890, 7.2340, 74),
  ('Nigeria', 'FCT', 'Abuja', 'Gwagwalada', 'Gwagwalada Central', 'abj-gwagwalada', 8.9430, 7.0860, 75),
  ('Nigeria', 'FCT', 'Abuja', 'Abuja Municipal', 'Nyanya & Karu Corridor', 'abj-nyanya-karu', 9.0340, 7.5780, 76)
ON CONFLICT (state, city, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  lga = EXCLUDED.lga,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 3. MULTIPLE SERVICES PER PROVIDER SCHEMA ENHANCEMENT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_services'
      AND column_name = 'service_title'
  ) THEN
    ALTER TABLE public.professional_services
      ADD COLUMN service_title text;
  END IF;
END $$;

-- Drop strict 1-per-category unique constraint to allow multiple services per category
ALTER TABLE public.professional_services
  DROP CONSTRAINT IF EXISTS professional_services_pro_cat_unique;

-- Replace with conditional index or multi-service uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_service_title_cat
  ON public.professional_services(professional_id, category_id, COALESCE(service_title, ''));

-- Index on service title for searchability
CREATE INDEX IF NOT EXISTS idx_pro_services_title
  ON public.professional_services(service_title);

-- ============================================================================
-- 4. MULTI-CITY SERVICE SEARCH MATCHING ENGINE RPC
-- ============================================================================

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
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_ref_geom := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

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
        WHEN p_neighbourhood IS NOT NULL AND (psa.neighbourhood ILIKE '%' || p_neighbourhood || '%') THEN true
        WHEN p_lga IS NOT NULL AND (psa.lga_or_district ILIKE '%' || p_lga || '%') THEN true
        WHEN p_city IS NOT NULL AND p_city <> 'All Cities' AND (psa.city ILIKE '%' || p_city || '%' OR pp.primary_city ILIKE '%' || p_city || '%') THEN true
        ELSE false
      END AS is_area_match,
      -- Category Relevance (check category slug, name, or specific service title)
      CASE
        WHEN p_category_id IS NOT NULL AND ps.category_id = p_category_id THEN 100.0
        WHEN p_category_slug IS NOT NULL AND sc.slug = p_category_slug THEN 100.0
        WHEN p_keyword IS NOT NULL AND (
          sc.name ILIKE '%' || p_keyword || '%'
          OR COALESCE(ps.service_title, '') ILIKE '%' || p_keyword || '%'
          OR pp.headline ILIKE '%' || p_keyword || '%'
          OR pp.bio ILIKE '%' || p_keyword || '%'
        ) THEN 90.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps ON ps.professional_id = pp.id AND ps.is_active = true
    LEFT JOIN public.service_categories sc ON sc.id = ps.category_id
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      AND (NOT p_verified_only OR pp.verification_status = 'approved')
      AND (pp.average_rating >= p_min_rating)
      AND (
        (p_category_id IS NULL AND p_category_slug IS NULL)
        OR (p_category_id IS NOT NULL AND ps.category_id = p_category_id)
        OR (p_category_slug IS NOT NULL AND sc.slug = p_category_slug)
        OR (p_keyword IS NOT NULL AND COALESCE(ps.service_title, '') ILIKE '%' || p_keyword || '%')
      )
      AND (
        p_keyword IS NULL
        OR p_keyword = ''
        OR pp.business_name ILIKE '%' || p_keyword || '%'
        OR pp.headline ILIKE '%' || p_keyword || '%'
        OR pp.bio ILIKE '%' || p_keyword || '%'
        OR sc.name ILIKE '%' || p_keyword || '%'
        OR COALESCE(ps.service_title, '') ILIKE '%' || p_keyword || '%'
      )
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
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_service_professionals TO anon, authenticated;

-- ============================================================================
-- 5. SECURE INITIAL ADMINISTRATOR PROVISIONING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.provision_initial_admin(
  p_email text,
  p_full_name text DEFAULT 'EasyLife Administrator'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_existing_role text;
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: A valid email address is required.';
  END IF;

  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(p_email));

  -- 2. If not found in auth.users, check profiles
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = lower(trim(p_email));
  END IF;

  -- 3. If user doesn't exist, create profile placeholder
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Allow trusted admin insert
    PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      primary_role,
      is_active,
      city,
      state
    ) VALUES (
      v_user_id,
      lower(trim(p_email)),
      trim(p_full_name),
      'admin',
      true,
      'Abuja',
      'FCT'
    );
  ELSE
    -- User exists, upgrade to admin
    PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

    UPDATE public.profiles
    SET primary_role = 'admin',
        is_active = true,
        is_suspended = false,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 4. Assign active admin role in user_roles
  INSERT INTO public.user_roles (user_id, role, is_active, assigned_at)
  VALUES (v_user_id, 'admin', true, now())
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_active = true,
      revoked_at = NULL,
      assigned_at = now();

  -- 5. Audit log
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_user_id,
    'admin',
    'admin.provisioned_initial_account',
    'profile',
    v_user_id,
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'role', 'admin',
      'provisioned_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', lower(trim(p_email)),
    'message', 'Administrator account successfully provisioned with full platform permissions.'
  );
END;
$$;

COMMIT;
