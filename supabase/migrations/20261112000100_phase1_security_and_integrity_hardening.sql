-- =============================================================================
-- Migration: Phase 1 — Security, RLS, Storage & Database Integrity Hardening
-- Target Project: EasyLife Service Marketplace
-- Purpose: Remediates verified Phase 1 audit findings without dropping or
--          altering historical user, provider, booking, or quotation data.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Harden public.is_admin() to strictly ignore revoked admin roles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NULL AND SESSION_USER IN ('postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.is_suspended = false
      AND p.deleted_at IS NULL
      AND ur.role = 'admin'
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
  );
END;
$function$;

-- -----------------------------------------------------------------------------
-- 2. Restrict Unapproved / Inactive / Deleted Professional Sub-Table Reads &
--    Add Soft-Archival Support on public.professional_services
-- -----------------------------------------------------------------------------
ALTER TABLE public.professional_services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP INDEX IF EXISTS public.uq_pro_service_title_cat;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_service_title_cat
  ON public.professional_services (professional_id, category_id, COALESCE(service_title, ''))
  WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS public.idx_pro_services_category;
CREATE INDEX IF NOT EXISTS idx_pro_services_category
  ON public.professional_services (category_id, professional_id)
  WHERE is_active = true AND deleted_at IS NULL;

DROP POLICY IF EXISTS "pro_services_read_all" ON public.professional_services;
DROP POLICY IF EXISTS "pro_services_read_approved_or_own" ON public.professional_services;
CREATE POLICY "pro_services_read_approved_or_own"
  ON public.professional_services
  FOR SELECT
  USING (
    (
      is_active = true
      AND deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.professional_profiles pp
        WHERE pp.id = professional_services.professional_id
          AND pp.verification_status = 'approved'::public.verification_status
          AND pp.deleted_at IS NULL
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_services.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "pro_services_manage_own" ON public.professional_services;
DROP POLICY IF EXISTS "pro_services_insert_own_or_admin" ON public.professional_services;
CREATE POLICY "pro_services_insert_own_or_admin"
  ON public.professional_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_services.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "pro_services_update_own_or_admin" ON public.professional_services;
CREATE POLICY "pro_services_update_own_or_admin"
  ON public.professional_services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_services.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_services.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "pro_services_delete_admin_only" ON public.professional_services;
CREATE POLICY "pro_services_delete_admin_only"
  ON public.professional_services
  FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "pro_areas_read_all" ON public.professional_service_areas;
DROP POLICY IF EXISTS "pro_areas_read_approved_or_own" ON public.professional_service_areas;
CREATE POLICY "pro_areas_read_approved_or_own"
  ON public.professional_service_areas
  FOR SELECT
  USING (
    (
      is_active = true
      AND EXISTS (
        SELECT 1
        FROM public.professional_profiles pp
        WHERE pp.id = professional_service_areas.professional_id
          AND pp.verification_status = 'approved'::public.verification_status
          AND pp.deleted_at IS NULL
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_service_areas.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "pro_availability_read_all" ON public.professional_availability;
DROP POLICY IF EXISTS "pro_availability_read_approved_or_own" ON public.professional_availability;
CREATE POLICY "pro_availability_read_approved_or_own"
  ON public.professional_availability
  FOR SELECT
  USING (
    (
      is_available = true
      AND EXISTS (
        SELECT 1
        FROM public.professional_profiles pp
        WHERE pp.id = professional_availability.professional_id
          AND pp.verification_status = 'approved'::public.verification_status
          AND pp.deleted_at IS NULL
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.professional_profiles pp
      WHERE pp.id = professional_availability.professional_id
        AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Update matching RPC so archived (deleted_at IS NOT NULL) services are excluded
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
  p_offset integer DEFAULT 0
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
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
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_ref_geom := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

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
        WHEN v_neighbourhood IS NOT NULL AND psa.neighbourhood ILIKE '%' || v_neighbourhood || '%' THEN true
        WHEN v_lga IS NOT NULL AND psa.lga_or_district ILIKE '%' || v_lga || '%' THEN true
        WHEN v_city IS NOT NULL AND (psa.city ILIKE '%' || v_city || '%' OR pp.primary_city ILIKE '%' || v_city || '%') THEN true
        ELSE false
      END AS is_area_match,
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
    LEFT JOIN public.professional_services ps
      ON ps.professional_id = pp.id AND ps.is_active = true AND ps.deleted_at IS NULL
    LEFT JOIN public.service_categories sc ON sc.id = ps.category_id
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND p.is_active = true
      AND p.is_suspended = false
      AND pp.verification_status = 'approved'
      AND (pp.average_rating >= COALESCE(p_min_rating, 0.0))
      AND (v_provider_type IS NULL OR pp.provider_type = v_provider_type)
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
      AND (
        v_keyword IS NULL
        OR pp.business_name ILIKE '%' || v_keyword || '%'
        OR COALESCE(pp.headline, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(pp.bio, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(sc.name, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(ps.service_title, '') ILIKE '%' || v_keyword || '%'
        OR COALESCE(ps.description, '') ILIKE '%' || v_keyword || '%'
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
$function$;

-- -----------------------------------------------------------------------------
-- 3. Close Permissive WITH CHECK (true) INSERT Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert ai logs" ON public.ai_assistant_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own ai logs" ON public.ai_assistant_logs;
CREATE POLICY "Authenticated users can insert own ai logs"
  ON public.ai_assistant_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert own support tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can insert own support tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "System can insert risk flags" ON public.risk_flags;
DROP POLICY IF EXISTS "Admins can insert risk flags" ON public.risk_flags;
CREATE POLICY "Admins can insert risk flags"
  ON public.risk_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Service role can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can insert payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can insert payment transactions"
  ON public.payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can update payment transactions"
  ON public.payment_transactions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Eliminate Business 'viewer' Role Write Privilege Escalation
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Business managers can manage business locations" ON public.business_locations;
DROP POLICY IF EXISTS "Business writers can insert business locations" ON public.business_locations;
DROP POLICY IF EXISTS "Business writers can update business locations" ON public.business_locations;
DROP POLICY IF EXISTS "Business writers can delete business locations" ON public.business_locations;

CREATE POLICY "Business writers can insert business locations"
  ON public.business_locations
  FOR INSERT
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "Business writers can update business locations"
  ON public.business_locations
  FOR UPDATE
  USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "Business writers can delete business locations"
  ON public.business_locations
  FOR DELETE
  USING (public.has_business_write_access(business_id) OR public.is_admin());

DROP POLICY IF EXISTS "Business owners can manage invitations" ON public.business_invitations;
DROP POLICY IF EXISTS "Business owners/admins can insert invitations" ON public.business_invitations;
DROP POLICY IF EXISTS "Business owners/admins can update invitations" ON public.business_invitations;
DROP POLICY IF EXISTS "Business owners/admins can delete invitations" ON public.business_invitations;

CREATE POLICY "Business owners/admins can insert invitations"
  ON public.business_invitations
  FOR INSERT
  WITH CHECK (
    public.is_business_owner(business_id)
    OR EXISTS (
      SELECT 1
      FROM public.business_members bm
      JOIN public.businesses b ON b.id = bm.business_id
      WHERE bm.business_id = business_invitations.business_id
        AND bm.user_id = auth.uid()
        AND bm.is_active = true
        AND bm.member_role IN ('owner', 'admin')
        AND b.is_active = true
        AND b.deleted_at IS NULL
    )
    OR public.is_admin()
  );

CREATE POLICY "Business owners/admins can update invitations"
  ON public.business_invitations
  FOR UPDATE
  USING (
    public.is_business_owner(business_id)
    OR EXISTS (
      SELECT 1
      FROM public.business_members bm
      JOIN public.businesses b ON b.id = bm.business_id
      WHERE bm.business_id = business_invitations.business_id
        AND bm.user_id = auth.uid()
        AND bm.is_active = true
        AND bm.member_role IN ('owner', 'admin')
        AND b.is_active = true
        AND b.deleted_at IS NULL
    )
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_business_owner(business_id)
    OR EXISTS (
      SELECT 1
      FROM public.business_members bm
      JOIN public.businesses b ON b.id = bm.business_id
      WHERE bm.business_id = business_invitations.business_id
        AND bm.user_id = auth.uid()
        AND bm.is_active = true
        AND bm.member_role IN ('owner', 'admin')
        AND b.is_active = true
        AND b.deleted_at IS NULL
    )
    OR public.is_admin()
  );

CREATE POLICY "Business owners/admins can delete invitations"
  ON public.business_invitations
  FOR DELETE
  USING (
    public.is_business_owner(business_id)
    OR EXISTS (
      SELECT 1
      FROM public.business_members bm
      JOIN public.businesses b ON b.id = bm.business_id
      WHERE bm.business_id = business_invitations.business_id
        AND bm.user_id = auth.uid()
        AND bm.is_active = true
        AND bm.member_role IN ('owner', 'admin')
        AND b.is_active = true
        AND b.deleted_at IS NULL
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Business members can create/manage maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Business writers can insert maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Business writers can update maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Business writers can delete maintenance requests" ON public.maintenance_requests;

CREATE POLICY "Business writers can insert maintenance requests"
  ON public.maintenance_requests
  FOR INSERT
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "Business writers can update maintenance requests"
  ON public.maintenance_requests
  FOR UPDATE
  USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "Business writers can delete maintenance requests"
  ON public.maintenance_requests
  FOR DELETE
  USING (public.has_business_write_access(business_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.create_business_maintenance_request(
  p_business_id uuid,
  p_property_id uuid,
  p_asset_id uuid,
  p_category_id uuid,
  p_requested_by uuid,
  p_title text,
  p_description text,
  p_fault_severity public.fault_severity_level DEFAULT 'medium'::public.fault_severity_level,
  p_assigned_professional_id uuid DEFAULT NULL::uuid,
  p_scheduled_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_estimated_cost_kobo bigint DEFAULT 0,
  p_photos jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
  v_initial_status public.maintenance_request_status_type;
BEGIN
  IF auth.uid() IS NOT NULL
     OR (
       session_user NOT IN ('postgres', 'supabase_admin')
       AND COALESCE(auth.role(), '') <> 'service_role'
     ) THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_write_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to create maintenance requests for this business.';
    END IF;
    IF p_requested_by IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'FORBIDDEN: Requester identity mismatch.';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Property % does not belong to business %', p_property_id, p_business_id;
  END IF;

  IF p_asset_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.assets WHERE id = p_asset_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Asset % does not belong to business %', p_asset_id, p_business_id;
  END IF;

  v_initial_status := CASE
    WHEN p_scheduled_date IS NOT NULL THEN 'scheduled'::public.maintenance_request_status_type
    WHEN p_assigned_professional_id IS NOT NULL THEN 'quote_requested'::public.maintenance_request_status_type
    ELSE 'open'::public.maintenance_request_status_type
  END;

  INSERT INTO public.maintenance_requests (
    business_id,
    property_id,
    asset_id,
    category_id,
    requested_by,
    assigned_professional_id,
    title,
    description,
    fault_severity,
    status,
    scheduled_date,
    estimated_cost_kobo,
    photos
  ) VALUES (
    p_business_id,
    p_property_id,
    p_asset_id,
    p_category_id,
    p_requested_by,
    p_assigned_professional_id,
    trim(p_title),
    trim(p_description),
    p_fault_severity,
    v_initial_status,
    p_scheduled_date,
    COALESCE(p_estimated_cost_kobo, 0),
    COALESCE(p_photos, '[]'::jsonb)
  ) RETURNING id INTO v_request_id;

  IF p_asset_id IS NOT NULL AND p_fault_severity IN ('high', 'critical') THEN
    UPDATE public.assets SET status = 'needs_maintenance', updated_at = now()
    WHERE id = p_asset_id AND business_id = p_business_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'maintenance_request_id', v_request_id,
    'status', v_initial_status
  );
END;
$function$;

-- -----------------------------------------------------------------------------
-- 5. Harden Supabase Storage Buckets & storage.objects RLS Policies
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    UPDATE storage.buckets
    SET file_size_limit = 8388608,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
    WHERE id = 'booking-attachments';

    UPDATE storage.buckets
    SET file_size_limit = 10485760,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
    WHERE id IN ('maintenance-invoices', 'dispute-evidence');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Drop duplicate/unrestricted policies that omitted folder-prefix isolation
    DROP POLICY IF EXISTS "easylife_public_buckets_insert" ON storage.objects;
    DROP POLICY IF EXISTS "easylife_public_buckets_read" ON storage.objects;
    DROP POLICY IF EXISTS "easylife_verification_docs_p19_insert" ON storage.objects;
    DROP POLICY IF EXISTS "easylife_verification_docs_p19_read" ON storage.objects;

    -- Tighten booking-attachments (enforce folder owner on insert, owner/booking participant/admin on read)
    DROP POLICY IF EXISTS "easylife_booking_attachments_insert" ON storage.objects;
    CREATE POLICY "easylife_booking_attachments_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'booking-attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    DROP POLICY IF EXISTS "easylife_booking_attachments_read" ON storage.objects;
    CREATE POLICY "easylife_booking_attachments_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'booking-attachments'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR public.is_admin()
          OR EXISTS (
            SELECT 1
            FROM public.booking_attachments ba
            WHERE ba.storage_bucket = 'booking-attachments'
              AND ba.storage_path = name
              AND public.can_access_booking(ba.booking_id)
          )
        )
      );

    -- Tighten maintenance-invoices (enforce folder owner prefix on insert)
    DROP POLICY IF EXISTS "easylife_maintenance_invoices_insert" ON storage.objects;
    CREATE POLICY "easylife_maintenance_invoices_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'maintenance-invoices'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Tighten dispute-evidence (enforce folder owner prefix on insert)
    DROP POLICY IF EXISTS "easylife_dispute_evidence_insert" ON storage.objects;
    CREATE POLICY "easylife_dispute_evidence_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'dispute-evidence'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Add owner/admin delete policies for cleanup
    DROP POLICY IF EXISTS "easylife_public_media_owner_delete" ON storage.objects;
    CREATE POLICY "easylife_public_media_owner_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id IN ('avatars', 'portfolio-media')
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );

    DROP POLICY IF EXISTS "easylife_verification_docs_owner_delete" ON storage.objects;
    CREATE POLICY "easylife_verification_docs_owner_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'verification-documents'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );

    DROP POLICY IF EXISTS "easylife_booking_attachments_delete" ON storage.objects;
    CREATE POLICY "easylife_booking_attachments_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'booking-attachments'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );

    DROP POLICY IF EXISTS "easylife_maintenance_invoices_delete" ON storage.objects;
    CREATE POLICY "easylife_maintenance_invoices_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'maintenance-invoices'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );

    DROP POLICY IF EXISTS "easylife_dispute_evidence_delete" ON storage.objects;
    CREATE POLICY "easylife_dispute_evidence_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'dispute-evidence'
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage.objects policy updates due to insufficient privileges in current role.';
END $$;

-- -----------------------------------------------------------------------------
-- 6. Deduplicate Active Commission Settings & Enforce Single Active Rule Constraint
-- -----------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(city, '__GLOBAL__')
      ORDER BY effective_from DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.commission_settings
  WHERE is_active = true AND effective_to IS NULL
)
UPDATE public.commission_settings cs
SET is_active = false,
    effective_to = COALESCE(cs.effective_to, now()),
    updated_at = now()
FROM ranked r
WHERE cs.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_settings_one_active_per_scope
  ON public.commission_settings (
    COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(city, '__GLOBAL__')
  )
  WHERE is_active = true AND effective_to IS NULL;

CREATE OR REPLACE FUNCTION public.admin_set_commission_setting(
  p_category_id uuid DEFAULT NULL::uuid,
  p_city text DEFAULT NULL::text,
  p_commission_bps integer DEFAULT 1000,
  p_flat_fee_kobo integer DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_res_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  -- Close any existing active setting in the exact same (category_id, city) scope
  IF p_is_active THEN
    UPDATE public.commission_settings
    SET is_active = false,
        effective_to = COALESCE(effective_to, now()),
        updated_at = now()
    WHERE category_id IS NOT DISTINCT FROM p_category_id
      AND city IS NOT DISTINCT FROM p_city
      AND is_active = true
      AND effective_to IS NULL;
  END IF;

  INSERT INTO public.commission_settings (
    category_id,
    city,
    commission_bps,
    flat_fee_kobo,
    is_active,
    created_by,
    effective_from,
    effective_to,
    updated_at
  ) VALUES (
    p_category_id,
    p_city,
    p_commission_bps,
    p_flat_fee_kobo,
    p_is_active,
    v_admin_id,
    now(),
    CASE WHEN p_is_active THEN NULL ELSE now() END,
    now()
  ) RETURNING id INTO v_res_id;

  PERFORM public.admin_record_audit_log(
    'commission_setting.configured',
    'commission_setting',
    v_res_id::text,
    null,
    jsonb_build_object(
      'category_id', p_category_id,
      'city', p_city,
      'commission_bps', p_commission_bps,
      'flat_fee_kobo', p_flat_fee_kobo,
      'is_active', p_is_active
    )
  );

  RETURN jsonb_build_object('success', true, 'setting_id', v_res_id);
END;
$function$;

-- -----------------------------------------------------------------------------
-- 7. Fix Broken SQL Functions (reviews columns, numeric division, enum values, user_roles columns)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evaluate_review_risk_rules(p_review_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rev RECORD;
  v_identical_count INTEGER := 0;
  v_flags JSONB := '[]'::jsonb;
  v_flag_id UUID;
BEGIN
  SELECT r.id, r.booking_id, r.reviewer_user_id, r.professional_id, r.rating, r.comment, r.created_at, pp.user_id AS pro_user_id
  INTO v_rev
  FROM public.reviews r
  LEFT JOIN public.professional_profiles pp ON pp.id = r.professional_id
  WHERE r.id = p_review_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Review not found');
  END IF;

  -- Check 1: Self-Review Attempt (Reviewer matches the reviewed professional's user_id)
  IF v_rev.pro_user_id IS NOT NULL AND v_rev.reviewer_user_id = v_rev.pro_user_id THEN
    v_flag_id := public.record_risk_flag(
      'review',
      p_review_id,
      'suspicious_review_activity',
      'high',
      'Self-review detected: Reviewer and Professional user accounts match.',
      jsonb_build_object('reviewer_user_id', v_rev.reviewer_user_id, 'professional_id', v_rev.professional_id)
    );
    v_flags := v_flags || jsonb_build_object('type', 'self_review', 'id', v_flag_id);
  END IF;

  -- Check 2: Identical Review Comment Repeated across multiple bookings
  IF v_rev.comment IS NOT NULL AND length(trim(v_rev.comment)) > 15 THEN
    SELECT COUNT(*)::INTEGER
    INTO v_identical_count
    FROM public.reviews
    WHERE reviewer_user_id = v_rev.reviewer_user_id
      AND trim(lower(comment)) = trim(lower(v_rev.comment))
      AND id <> p_review_id;

    IF v_identical_count >= 2 THEN
      v_flag_id := public.record_risk_flag(
        'review',
        p_review_id,
        'suspicious_review_activity',
        'medium',
        'Duplicate review text repeated across ' || v_identical_count || ' other bookings.',
        jsonb_build_object('identical_count', v_identical_count, 'comment_snippet', substr(v_rev.comment, 1, 60))
      );
      v_flags := v_flags || jsonb_build_object('type', 'duplicate_text', 'id', v_flag_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', p_review_id,
    'flags', v_flags,
    'administrative_review_only', true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.evaluate_account_risk_rules(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_dup_count INTEGER := 0;
  v_dup_ids JSONB := '[]'::jsonb;
  v_cancelled_bookings INTEGER := 0;
  v_total_bookings INTEGER := 0;
  v_recent_booking_velocity INTEGER := 0;
  v_dispute_count INTEGER := 0;
  v_flag_count INTEGER := 0;
  v_flags_generated JSONB := '[]'::jsonb;
  v_flag_id UUID;
BEGIN
  SELECT id, email, phone, full_name, primary_role, is_suspended
  INTO v_user
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Rule 1: Duplicate Accounts Check (Shared Phone Number)
  IF v_user.phone IS NOT NULL AND length(trim(v_user.phone)) >= 10 THEN
    SELECT COUNT(*)::INTEGER, COALESCE(jsonb_agg(id), '[]'::jsonb)
    INTO v_dup_count, v_dup_ids
    FROM public.profiles
    WHERE id <> p_user_id
      AND phone IS NOT NULL
      AND regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(v_user.phone, '[^0-9]', '', 'g');

    IF v_dup_count > 0 THEN
      v_flag_id := public.record_risk_flag(
        'user',
        p_user_id,
        'duplicate_account',
        'medium',
        'Potential duplicate profile sharing phone number with ' || v_dup_count || ' other account(s).',
        jsonb_build_object('matched_user_ids', v_dup_ids, 'phone', v_user.phone)
      );
      v_flag_count := v_flag_count + 1;
      v_flags_generated := v_flags_generated || jsonb_build_object('type', 'duplicate_account', 'id', v_flag_id);
    END IF;
  END IF;

  -- Rule 2: Repeated Suspicious Activity (Cancellation Spike)
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER
  INTO v_total_bookings, v_cancelled_bookings
  FROM public.bookings
  WHERE customer_id = p_user_id;

  IF v_total_bookings >= 3 AND (v_cancelled_bookings::NUMERIC / v_total_bookings::NUMERIC) >= 0.60 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'repeated_suspicious_activity',
      'medium',
      'High booking cancellation rate (' || v_cancelled_bookings || ' of ' || v_total_bookings || ' bookings cancelled).',
      jsonb_build_object('total_bookings', v_total_bookings, 'cancelled_bookings', v_cancelled_bookings)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'repeated_suspicious_activity', 'id', v_flag_id);
  END IF;

  -- Rule 3: Unusual Booking Velocity (>= 4 bookings in past 15 minutes)
  SELECT COUNT(*)::INTEGER
  INTO v_recent_booking_velocity
  FROM public.bookings
  WHERE customer_id = p_user_id
    AND created_at >= (now() - INTERVAL '15 minutes');

  IF v_recent_booking_velocity >= 4 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'unusual_booking_pattern',
      'high',
      'Rapid booking creation pattern (' || v_recent_booking_velocity || ' requests created within 15 minutes).',
      jsonb_build_object('velocity_count', v_recent_booking_velocity, 'window_minutes', 15)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'unusual_booking_pattern', 'id', v_flag_id);
  END IF;

  -- Rule 4: Repeated Complaints (Disputes raised by or against user in past 30 days)
  SELECT COUNT(*)::INTEGER
  INTO v_dispute_count
  FROM public.disputes d
  JOIN public.bookings b ON d.booking_id = b.id
  LEFT JOIN public.professional_profiles pp ON pp.id = b.professional_id
  WHERE (b.customer_id = p_user_id OR pp.user_id = p_user_id)
    AND d.created_at >= (now() - INTERVAL '30 days');

  IF v_dispute_count >= 2 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'repeated_complaints',
      'high',
      'Repeated dispute involvement (' || v_dispute_count || ' disputes in the last 30 days).',
      jsonb_build_object('dispute_count', v_dispute_count, 'window_days', 30)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'repeated_complaints', 'id', v_flag_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'flags_count', v_flag_count,
    'flags', v_flags_generated,
    'administrative_review_only', true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_account_deletion_request(p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_request_id UUID;
  v_has_active_escrow BOOLEAN := false;
  v_open_disputes BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: You must be logged in to submit an account deletion request.';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Please provide a meaningful reason of at least 5 characters.';
  END IF;

  -- Compliance Safety Check 1: Verify no open disputes involving customer or assigned professional
  SELECT EXISTS (
    SELECT 1
    FROM public.disputes d
    JOIN public.bookings b ON b.id = d.booking_id
    LEFT JOIN public.professional_profiles pp ON pp.id = b.professional_id
    WHERE (b.customer_id = v_user_id OR pp.user_id = v_user_id)
      AND d.status::text IN ('open', 'under_review', 'awaiting_information')
  ) INTO v_open_disputes;

  IF v_open_disputes THEN
    RAISE EXCEPTION 'CONFLICT: You have active disputes under review. Complete or resolve open disputes before requesting account erasure.';
  END IF;

  -- Compliance Safety Check 2: Verify no active in-flight bookings or escrow obligations
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    LEFT JOIN public.professional_profiles pp ON pp.id = b.professional_id
    WHERE (b.customer_id = v_user_id OR pp.user_id = v_user_id)
      AND b.deleted_at IS NULL
      AND b.status::text IN ('accepted', 'confirmed', 'scheduled', 'in_progress', 'pro_marked_complete', 'disputed')
  ) INTO v_has_active_escrow;

  IF v_has_active_escrow THEN
    RAISE EXCEPTION 'CONFLICT: You have active bookings or pending escrow settlements. Complete or cancel active engagements before requesting account erasure.';
  END IF;

  INSERT INTO public.account_deletion_requests (
    user_id,
    reason,
    status
  ) VALUES (
    v_user_id,
    trim(p_reason),
    'pending'
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_user_id,
    'customer',
    'privacy.account_deletion_requested',
    'account_deletion_request',
    v_request_id::text,
    jsonb_build_object(
      'request_id', v_request_id,
      'requested_at', now(),
      'statutory_framework', 'NDPA_2023_SEC_34'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'status', 'pending',
    'message', 'Your account deletion request has been recorded under the Nigeria Data Protection Act 2023. Our DPO and administration will review within statutory timeframes.'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.provision_initial_admin(
  p_email text,
  p_full_name text DEFAULT 'EasyLife Administrator'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN: provision_initial_admin requires service_role or database owner privileges.';
  END IF;

  IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: A valid email address is required.';
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(p_email));

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = lower(trim(p_email));
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
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
    PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

    UPDATE public.profiles
    SET primary_role = 'admin',
        is_active = true,
        is_suspended = false,
        deleted_at = NULL,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_active, revoked_at)
  VALUES (v_user_id, 'admin', true, NULL)
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_active = true,
      revoked_at = NULL;

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
    v_user_id::text,
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
$function$;

-- -----------------------------------------------------------------------------
-- 8. Fix Job Execution Sign-Off Bypass & Add Appointment Schedule RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_booking_job_execution(
  p_booking_id uuid,
  p_action text,
  p_completion_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking RECORD;
  v_caller_id UUID;
  v_is_pro BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  v_is_pro := EXISTS (
    SELECT 1 FROM public.professional_profiles
    WHERE id = v_booking.professional_id AND user_id = v_caller_id
  );

  IF NOT (v_is_pro OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the assigned professional can update job execution');
  END IF;

  IF v_booking.status = 'disputed'::public.booking_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DISPUTED',
      'message', 'Booking is currently under dispute arbitration and cannot advance execution status.'
    );
  END IF;

  IF p_action = 'begin_job' THEN
    IF v_booking.status NOT IN ('confirmed'::public.booking_status, 'accepted'::public.booking_status, 'scheduled'::public.booking_status) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INVALID_STATE',
        'message', format('Cannot start job from status: %s. Appointment must be confirmed.', v_booking.status)
      );
    END IF;

    UPDATE public.bookings
    SET status = 'in_progress'::public.booking_status,
        actual_start_at = COALESCE(actual_start_at, now()),
        updated_at = now()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'in_progress');

  ELSIF p_action = 'submit_completion' THEN
    IF v_booking.status NOT IN ('in_progress'::public.booking_status, 'scheduled'::public.booking_status, 'confirmed'::public.booking_status) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INVALID_STATE',
        'message', format('Cannot submit completion from status: %s. Job must be active or in progress.', v_booking.status)
      );
    END IF;

    UPDATE public.bookings
    SET status = 'pro_marked_complete'::public.booking_status,
        pro_marked_complete_at = now(),
        pro_completion_notes = COALESCE(NULLIF(trim(p_completion_notes), ''), pro_completion_notes),
        updated_at = now()
    WHERE id = p_booking_id;

    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_booking.customer_id,
      'job_completion_request',
      'Job Completion Request Submitted',
      'Your service specialist has submitted work completion for booking #' || v_booking.reference_code || '. Please inspect and confirm completion.',
      '/bookings/' || v_booking.id,
      'booking',
      v_booking.id,
      jsonb_build_object('booking_id', v_booking.id, 'reference_code', v_booking.reference_code, 'actor_user_id', v_caller_id)
    );

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'pro_marked_complete');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTION', 'message', 'Unknown action');
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_booking_appointment_schedule(
  p_booking_id uuid,
  p_scheduled_start timestamp with time zone,
  p_scheduled_end timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking RECORD;
  v_caller_id UUID := auth.uid();
  v_is_customer BOOLEAN;
  v_is_pro BOOLEAN;
  v_is_admin BOOLEAN;
  v_end_at TIMESTAMPTZ;
  v_has_conflict BOOLEAN := false;
BEGIN
  v_is_admin := public.is_admin();

  IF v_caller_id IS NULL AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHENTICATED', 'message', 'Authentication required.');
  END IF;

  IF p_scheduled_start IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TIME', 'message', 'A valid scheduled start timestamp is required.');
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found.');
  END IF;

  v_is_customer := (v_booking.customer_id = v_caller_id);
  v_is_pro := EXISTS (
    SELECT 1 FROM public.professional_profiles pp
    WHERE pp.id = v_booking.professional_id
      AND pp.user_id = v_caller_id
  );

  IF NOT (v_is_customer OR v_is_pro OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Not authorized to reschedule this appointment.');
  END IF;

  IF v_booking.status::text IN ('completed', 'cancelled', 'disputed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE', 'message', format('Cannot reschedule booking in status: %s', v_booking.status));
  END IF;

  v_end_at := COALESCE(p_scheduled_end, p_scheduled_start + INTERVAL '2 hours');
  IF v_end_at <= p_scheduled_start THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TIME', 'message', 'Scheduled end time must be after start time.');
  END IF;

  IF v_booking.professional_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.professional_id = v_booking.professional_id
        AND a.booking_id <> p_booking_id
        AND a.status IN ('confirmed', 'rescheduled', 'in_progress')
        AND a.scheduled_start_at < v_end_at
        AND a.scheduled_end_at > p_scheduled_start
    ) INTO v_has_conflict;

    IF v_has_conflict THEN
      RETURN jsonb_build_object('success', false, 'error', 'APPOINTMENT_CONFLICT', 'message', 'Another confirmed appointment overlaps with the selected schedule window.');
    END IF;
  END IF;

  UPDATE public.bookings
  SET scheduled_start_at = p_scheduled_start,
      scheduled_end_at = v_end_at,
      preferred_date = p_scheduled_start::date,
      updated_at = now()
  WHERE id = p_booking_id;

  UPDATE public.appointments
  SET scheduled_date = p_scheduled_start::date,
      start_time = p_scheduled_start::time,
      end_time = v_end_at::time,
      scheduled_start_at = p_scheduled_start,
      scheduled_end_at = v_end_at,
      notes = COALESCE(NULLIF(trim(p_notes), ''), notes),
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND status IN ('confirmed', 'pending', 'rescheduled');

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    v_caller_id,
    (CASE WHEN v_is_admin THEN 'admin' WHEN v_is_pro THEN 'professional' ELSE 'customer' END)::public.user_role,
    'booking.appointment_rescheduled',
    'booking',
    p_booking_id::text,
    jsonb_build_object('scheduled_start_at', v_booking.scheduled_start_at, 'scheduled_end_at', v_booking.scheduled_end_at),
    jsonb_build_object('scheduled_start_at', p_scheduled_start, 'scheduled_end_at', v_end_at)
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'scheduled_start_at', p_scheduled_start,
    'scheduled_end_at', v_end_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.update_booking_appointment_schedule(uuid, timestamp with time zone, timestamp with time zone, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_booking_appointment_schedule(uuid, timestamp with time zone, timestamp with time zone, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_booking_appointment_schedule(uuid, timestamp with time zone, timestamp with time zone, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_appointment_schedule(uuid, timestamp with time zone, timestamp with time zone, text) TO service_role;

COMMIT;
