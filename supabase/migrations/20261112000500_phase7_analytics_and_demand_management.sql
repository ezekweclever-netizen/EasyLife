-- =============================================================================
-- Migration: Phase 7 — Analytics & Demand Management
-- Purpose:
--   1. Create lightweight, privacy-first aggregate table
--      public.catalogue_search_metrics (zero PII: no user_id/session/IP) to
--      track search demand and zero-result searches across catalogue discovery.
--   2. Add public.record_catalogue_search_signal(...) RPC (SECURITY DEFINER)
--      to safely normalize, sanitize, and upsert aggregate search counters.
--   3. Add performance indexes for analytics queries across bookings,
--      maintenance_requests, and ai_assistant_logs.
--   4. Add admin-only public.get_admin_demand_analytics(p_days) RPC returning
--      all 8 Phase 7 marketplace insights in one consolidated JSONB payload:
--        - most_searched_services & top_search_queries
--        - most_requested_services (bookings + custom tasks + maintenance + searches)
--        - most_frequently_booked_services (total, completed, active, GMV)
--        - popular_categories (main & subcategories with bookings, AI, search, supply)
--        - insufficient_provider_services (0-pro, offline-only, thin/unmet gaps)
--        - zero_result_searches
--        - demand_by_location (city summary + city/LGA demand vs provider coverage)
--        - provider_availability_by_service (direct, eligible, available, PH/Lagos/Abuja)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Anonymized Aggregate Search Metrics Table (Zero PII)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalogue_search_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query TEXT NOT NULL,
  search_surface TEXT NOT NULL DEFAULT 'catalogue',
  city_filter TEXT NOT NULL DEFAULT '',
  resolved_category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  resolved_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  search_count BIGINT NOT NULL DEFAULT 1,
  zero_result_count BIGINT NOT NULL DEFAULT 0,
  last_result_count INTEGER NOT NULL DEFAULT 0,
  first_searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalogue_search_metrics_surface_check
    CHECK (search_surface IN ('suggest', 'catalogue', 'explore')),
  CONSTRAINT catalogue_search_metrics_query_len_check
    CHECK (char_length(normalized_query) BETWEEN 2 AND 80),
  CONSTRAINT catalogue_search_metrics_unique_bucket
    UNIQUE (normalized_query, search_surface, city_filter)
);

ALTER TABLE public.catalogue_search_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage catalogue search metrics" ON public.catalogue_search_metrics;
CREATE POLICY "Admins manage catalogue search metrics"
  ON public.catalogue_search_metrics
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_catalogue_search_metrics_last_searched
  ON public.catalogue_search_metrics (last_searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalogue_search_metrics_zero_hits
  ON public.catalogue_search_metrics (zero_result_count DESC, last_searched_at DESC)
  WHERE zero_result_count > 0;

CREATE INDEX IF NOT EXISTS idx_catalogue_search_metrics_resolved_srv
  ON public.catalogue_search_metrics (resolved_service_id, search_count DESC)
  WHERE resolved_service_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalogue_search_metrics_resolved_cat
  ON public.catalogue_search_metrics (resolved_category_id, search_count DESC)
  WHERE resolved_category_id IS NOT NULL;

-- Supporting analytics indexes on existing marketplace tables
CREATE INDEX IF NOT EXISTS idx_bookings_analytics_service_status
  ON public.bookings (service_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_analytics_category_city
  ON public.bookings (category_id, city, lga_or_district, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_cat_created
  ON public.ai_assistant_logs (recommended_category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_srv_created
  ON public.maintenance_requests (service_id, category_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. Privacy-First Aggregate Search Signal RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_catalogue_search_signal(
  p_query TEXT,
  p_surface TEXT DEFAULT 'catalogue',
  p_city TEXT DEFAULT '',
  p_resolved_category_id UUID DEFAULT NULL,
  p_resolved_service_id UUID DEFAULT NULL,
  p_result_count INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_surface TEXT := CASE
    WHEN lower(trim(COALESCE(p_surface, ''))) IN ('suggest', 'catalogue', 'explore')
      THEN lower(trim(p_surface))
    ELSE 'catalogue'
  END;
  v_min_len INTEGER := CASE WHEN v_surface = 'suggest' THEN 3 ELSE 2 END;
  v_norm_query TEXT;
  v_city TEXT;
  v_cat_id UUID := NULL;
  v_srv_id UUID := NULL;
  v_res_count INTEGER := GREATEST(0, COALESCE(p_result_count, 0));
  v_zero_inc BIGINT := CASE WHEN GREATEST(0, COALESCE(p_result_count, 0)) = 0 THEN 1 ELSE 0 END;
BEGIN
  v_norm_query := lower(trim(regexp_replace(COALESCE(p_query, ''), '\s+', ' ', 'g')));
  IF v_norm_query = '' OR char_length(v_norm_query) < v_min_len THEN
    RETURN;
  END IF;

  -- Reject email-like or phone-number-like strings to strictly avoid collecting PII
  IF v_norm_query LIKE '%@%' OR v_norm_query ~ '[0-9]{7,}' THEN
    RETURN;
  END IF;

  v_norm_query := left(v_norm_query, 80);

  v_city := trim(COALESCE(p_city, ''));
  IF lower(v_city) IN ('', 'all', 'all cities') THEN
    v_city := '';
  ELSE
    v_city := left(v_city, 60);
  END IF;

  IF p_resolved_category_id IS NOT NULL THEN
    SELECT sc.id INTO v_cat_id
    FROM public.service_categories sc
    WHERE sc.id = p_resolved_category_id
      AND sc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF p_resolved_service_id IS NOT NULL THEN
    SELECT s.id INTO v_srv_id
    FROM public.services s
    WHERE s.id = p_resolved_service_id
      AND s.deleted_at IS NULL
    LIMIT 1;
  END IF;

  INSERT INTO public.catalogue_search_metrics (
    normalized_query,
    search_surface,
    city_filter,
    resolved_category_id,
    resolved_service_id,
    search_count,
    zero_result_count,
    last_result_count,
    first_searched_at,
    last_searched_at
  ) VALUES (
    v_norm_query,
    v_surface,
    v_city,
    v_cat_id,
    v_srv_id,
    1,
    v_zero_inc,
    v_res_count,
    now(),
    now()
  )
  ON CONFLICT (normalized_query, search_surface, city_filter)
  DO UPDATE SET
    search_count = public.catalogue_search_metrics.search_count + 1,
    zero_result_count = public.catalogue_search_metrics.zero_result_count + EXCLUDED.zero_result_count,
    last_result_count = EXCLUDED.last_result_count,
    resolved_category_id = COALESCE(EXCLUDED.resolved_category_id, public.catalogue_search_metrics.resolved_category_id),
    resolved_service_id = COALESCE(EXCLUDED.resolved_service_id, public.catalogue_search_metrics.resolved_service_id),
    last_searched_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_catalogue_search_signal(TEXT, TEXT, TEXT, UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_catalogue_search_signal(TEXT, TEXT, TEXT, UUID, UUID, INTEGER) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Admin Demand, Search & Supply-Gap Analytics RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_demand_analytics(
  p_days INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_days INTEGER := CASE WHEN p_days IS NULL OR p_days <= 0 THEN 0 ELSE LEAST(p_days, 3650) END;
  v_since TIMESTAMPTZ := CASE
    WHEN p_days IS NULL OR p_days <= 0 THEN '-infinity'::TIMESTAMPTZ
    ELSE now() - make_interval(days => LEAST(p_days, 3650))
  END;
  v_payload JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Administrator privileges required.'
      USING ERRCODE = '42501';
  END IF;

  WITH active_pros AS (
    SELECT
      pp.id,
      pp.is_available,
      trim(COALESCE(pp.primary_city, '')) AS primary_city
    FROM public.professional_profiles pp
    JOIN public.profiles prof
      ON prof.id = pp.user_id
     AND prof.deleted_at IS NULL
     AND prof.is_active = true
     AND prof.is_suspended = false
    WHERE pp.deleted_at IS NULL
      AND pp.verification_status = 'approved'
  ),
  pro_city_coverage AS (
    SELECT
      ap.id AS professional_id,
      ap.is_available,
      ARRAY(
        SELECT DISTINCT trim(city_name)
        FROM (
          SELECT ap.primary_city AS city_name WHERE ap.primary_city <> ''
          UNION ALL
          SELECT trim(psa.city) AS city_name
          FROM public.professional_service_areas psa
          WHERE psa.professional_id = ap.id
            AND psa.is_active = true
            AND trim(COALESCE(psa.city, '')) <> ''
        ) c_rows
      ) AS cities
    FROM active_pros ap
  ),
  active_services_base AS (
    SELECT
      s.id AS service_id,
      s.service_code,
      s.name,
      s.slug,
      s.category_id,
      s.subcategory_id,
      s.requires_trade_certification,
      s.is_featured,
      s.is_popular,
      mc.name AS category_name,
      mc.slug AS category_slug,
      sub.name AS subcategory_name,
      sub.slug AS subcategory_slug
    FROM public.services s
    JOIN public.service_categories mc
      ON mc.id = s.category_id
     AND mc.deleted_at IS NULL
    LEFT JOIN public.service_categories sub
      ON sub.id = s.subcategory_id
     AND sub.deleted_at IS NULL
    WHERE s.is_active = true
      AND s.deleted_at IS NULL
  ),
  window_bookings AS (
    SELECT
      b.id,
      b.service_id,
      b.category_id,
      b.subcategory_id,
      b.status::TEXT AS status,
      b.is_custom_task,
      COALESCE(b.agreed_amount_kobo, 0)::BIGINT AS agreed_amount_kobo,
      COALESCE(NULLIF(trim(b.city), ''), 'Unspecified') AS city,
      COALESCE(NULLIF(trim(b.lga_or_district), ''), 'All Districts / Unspecified') AS lga_or_district
    FROM public.bookings b
    WHERE b.deleted_at IS NULL
      AND b.created_at >= v_since
  ),
  window_maint AS (
    SELECT
      mr.id,
      mr.service_id,
      mr.category_id
    FROM public.maintenance_requests mr
    WHERE mr.created_at >= v_since
  ),
  window_searches AS (
    SELECT
      csm.*
    FROM public.catalogue_search_metrics csm
    WHERE csm.last_searched_at >= v_since
  ),
  window_ai_logs AS (
    SELECT
      al.id,
      al.recommended_category_id,
      al.recommended_category_name
    FROM public.ai_assistant_logs al
    WHERE al.created_at >= v_since
  ),
  service_supply AS (
    SELECT
      asb.service_id,
      COUNT(DISTINCT pcc.professional_id) FILTER (WHERE ps.service_id = asb.service_id)::INTEGER AS direct_service_pros,
      COUNT(DISTINCT pcc.professional_id)::INTEGER AS total_eligible_pros,
      COUNT(DISTINCT pcc.professional_id) FILTER (WHERE pcc.is_available = true)::INTEGER AS available_pros,
      COUNT(DISTINCT pcc.professional_id) FILTER (WHERE pcc.is_available = false)::INTEGER AS offline_pros,
      COUNT(DISTINCT pcc.professional_id) FILTER (
        WHERE pcc.is_available = true
          AND EXISTS (SELECT 1 FROM unnest(pcc.cities) c WHERE c ILIKE '%Port Harcourt%')
      )::INTEGER AS ph_pros,
      COUNT(DISTINCT pcc.professional_id) FILTER (
        WHERE pcc.is_available = true
          AND EXISTS (SELECT 1 FROM unnest(pcc.cities) c WHERE c ILIKE '%Lagos%')
      )::INTEGER AS lagos_pros,
      COUNT(DISTINCT pcc.professional_id) FILTER (
        WHERE pcc.is_available = true
          AND EXISTS (SELECT 1 FROM unnest(pcc.cities) c WHERE c ILIKE '%Abuja%')
      )::INTEGER AS abuja_pros
    FROM active_services_base asb
    LEFT JOIN public.professional_services ps
      ON ps.is_active = true
     AND ps.deleted_at IS NULL
     AND (
       ps.service_id = asb.service_id
       OR (asb.subcategory_id IS NOT NULL AND ps.category_id = asb.subcategory_id)
       OR ps.category_id = asb.category_id
     )
    LEFT JOIN pro_city_coverage pcc
      ON pcc.professional_id = ps.professional_id
    GROUP BY asb.service_id
  ),
  service_booking_stats AS (
    SELECT
      wb.service_id,
      COUNT(*)::INTEGER AS total_bookings,
      COUNT(*) FILTER (WHERE wb.status = 'completed')::INTEGER AS completed_bookings,
      COUNT(*) FILTER (WHERE wb.status IN ('open', 'quoted', 'scheduled', 'in_progress', 'pro_marked_complete'))::INTEGER AS active_bookings,
      COUNT(*) FILTER (WHERE wb.status IN ('open', 'quoted'))::INTEGER AS open_unmatched_bookings,
      COUNT(*) FILTER (WHERE wb.status = 'cancelled')::INTEGER AS cancelled_bookings,
      COUNT(*) FILTER (WHERE wb.status = 'disputed')::INTEGER AS disputed_bookings,
      COUNT(*) FILTER (WHERE wb.is_custom_task = true)::INTEGER AS custom_task_bookings,
      COALESCE(SUM(wb.agreed_amount_kobo) FILTER (WHERE wb.status = 'completed'), 0)::BIGINT AS gross_agreed_kobo,
      COALESCE(ROUND(AVG(wb.agreed_amount_kobo) FILTER (WHERE wb.status = 'completed' AND wb.agreed_amount_kobo > 0)), 0)::BIGINT AS avg_agreed_kobo
    FROM window_bookings wb
    WHERE wb.service_id IS NOT NULL
    GROUP BY wb.service_id
  ),
  category_booking_stats AS (
    SELECT
      wb.category_id,
      COUNT(*)::INTEGER AS total_cat_bookings,
      COUNT(*) FILTER (WHERE wb.service_id IS NULL)::INTEGER AS untagged_cat_bookings,
      COUNT(*) FILTER (WHERE wb.status IN ('open', 'quoted'))::INTEGER AS open_cat_bookings,
      COUNT(*) FILTER (WHERE wb.is_custom_task = true)::INTEGER AS custom_cat_bookings,
      COUNT(*) FILTER (WHERE wb.status = 'completed')::INTEGER AS completed_cat_bookings,
      COALESCE(SUM(wb.agreed_amount_kobo) FILTER (WHERE wb.status = 'completed'), 0)::BIGINT AS cat_gross_agreed_kobo
    FROM window_bookings wb
    WHERE wb.category_id IS NOT NULL
    GROUP BY wb.category_id
  ),
  service_maint_stats AS (
    SELECT
      wm.service_id,
      COUNT(*)::INTEGER AS maint_count
    FROM window_maint wm
    WHERE wm.service_id IS NOT NULL
    GROUP BY wm.service_id
  ),
  service_search_stats AS (
    SELECT
      ws.resolved_service_id AS service_id,
      COALESCE(SUM(ws.search_count), 0)::BIGINT AS search_count,
      COALESCE(SUM(ws.zero_result_count), 0)::BIGINT AS zero_result_hits
    FROM window_searches ws
    WHERE ws.resolved_service_id IS NOT NULL
    GROUP BY ws.resolved_service_id
  ),
  service_combined AS (
    SELECT
      asb.*,
      COALESCE(ss.direct_service_pros, 0) AS direct_service_pros,
      COALESCE(ss.total_eligible_pros, 0) AS total_eligible_pros,
      COALESCE(ss.available_pros, 0) AS available_pros,
      COALESCE(ss.offline_pros, 0) AS offline_pros,
      COALESCE(ss.ph_pros, 0) AS ph_pros,
      COALESCE(ss.lagos_pros, 0) AS lagos_pros,
      COALESCE(ss.abuja_pros, 0) AS abuja_pros,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN COALESCE(ss.ph_pros, 0) = 0 THEN 'Port Harcourt' ELSE NULL END,
        CASE WHEN COALESCE(ss.lagos_pros, 0) = 0 THEN 'Lagos' ELSE NULL END,
        CASE WHEN COALESCE(ss.abuja_pros, 0) = 0 THEN 'Abuja' ELSE NULL END
      ], NULL) AS missing_cities,
      COALESCE(sbs.total_bookings, 0) AS direct_bookings,
      COALESCE(sbs.completed_bookings, 0) AS completed_bookings,
      COALESCE(sbs.active_bookings, 0) AS active_bookings,
      COALESCE(sbs.open_unmatched_bookings, 0) AS open_unmatched_bookings,
      COALESCE(sbs.cancelled_bookings, 0) AS cancelled_bookings,
      COALESCE(sbs.disputed_bookings, 0) AS disputed_bookings,
      COALESCE(sbs.custom_task_bookings, 0) AS custom_task_bookings,
      COALESCE(sbs.gross_agreed_kobo, 0)::BIGINT AS gross_agreed_kobo,
      COALESCE(sbs.avg_agreed_kobo, 0)::BIGINT AS avg_agreed_kobo,
      COALESCE(cbs.total_cat_bookings, 0) AS category_bookings_context,
      COALESCE(cbs.untagged_cat_bookings, 0) AS category_untagged_bookings,
      COALESCE(sms.maint_count, 0) AS maintenance_requests_count,
      COALESCE(sss.search_count, 0)::BIGINT AS search_count,
      COALESCE(sss.zero_result_hits, 0)::BIGINT AS zero_result_hits
    FROM active_services_base asb
    LEFT JOIN service_supply ss ON ss.service_id = asb.service_id
    LEFT JOIN service_booking_stats sbs ON sbs.service_id = asb.service_id
    LEFT JOIN category_booking_stats cbs ON cbs.category_id = asb.category_id
    LEFT JOIN service_maint_stats sms ON sms.service_id = asb.service_id
    LEFT JOIN service_search_stats sss ON sss.service_id = asb.service_id
  ),
  service_with_status AS (
    SELECT
      sc.*,
      CASE
        WHEN sc.total_eligible_pros = 0 THEN 'critical_no_providers'
        WHEN sc.available_pros = 0 THEN 'high_none_available'
        WHEN sc.open_unmatched_bookings > sc.available_pros
          OR ((sc.direct_bookings + sc.maintenance_requests_count) >= 3 AND sc.available_pros <= 1)
          THEN 'high_unmet_demand'
        WHEN sc.available_pros <= 1 OR cardinality(sc.missing_cities) > 0 THEN 'moderate_thin_supply'
        ELSE 'healthy'
      END AS gap_severity
    FROM service_combined sc
  ),
  cat_hierarchy AS (
    SELECT
      c.id AS category_id,
      c.parent_id,
      pcat.name AS parent_name,
      c.name,
      c.slug,
      CASE WHEN c.parent_id IS NULL THEN 'main' ELSE 'subcategory' END AS tier,
      c.is_active
    FROM public.service_categories c
    LEFT JOIN public.service_categories pcat
      ON pcat.id = c.parent_id
     AND pcat.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
      AND c.is_active = true
  ),
  popular_categories_cte AS (
    SELECT
      ch.category_id,
      ch.parent_id,
      ch.parent_name,
      ch.name,
      ch.slug,
      ch.tier,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_bookings wb
        LEFT JOIN public.services bs ON bs.id = wb.service_id
        WHERE (ch.tier = 'main' AND wb.category_id = ch.category_id)
           OR (ch.tier = 'subcategory' AND (wb.subcategory_id = ch.category_id OR bs.subcategory_id = ch.category_id))
      ) AS total_bookings,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_bookings wb
        LEFT JOIN public.services bs ON bs.id = wb.service_id
        WHERE wb.status = 'completed'
          AND (
            (ch.tier = 'main' AND wb.category_id = ch.category_id)
            OR (ch.tier = 'subcategory' AND (wb.subcategory_id = ch.category_id OR bs.subcategory_id = ch.category_id))
          )
      ) AS completed_bookings,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_bookings wb
        LEFT JOIN public.services bs ON bs.id = wb.service_id
        WHERE wb.status IN ('open', 'quoted', 'scheduled', 'in_progress', 'pro_marked_complete')
          AND (
            (ch.tier = 'main' AND wb.category_id = ch.category_id)
            OR (ch.tier = 'subcategory' AND (wb.subcategory_id = ch.category_id OR bs.subcategory_id = ch.category_id))
          )
      ) AS active_bookings,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_bookings wb
        LEFT JOIN public.services bs ON bs.id = wb.service_id
        WHERE wb.is_custom_task = true
          AND (
            (ch.tier = 'main' AND wb.category_id = ch.category_id)
            OR (ch.tier = 'subcategory' AND (wb.subcategory_id = ch.category_id OR bs.subcategory_id = ch.category_id))
          )
      ) AS custom_task_bookings,
      (
        SELECT COALESCE(SUM(wb.agreed_amount_kobo) FILTER (WHERE wb.status = 'completed'), 0)::BIGINT
        FROM window_bookings wb
        LEFT JOIN public.services bs ON bs.id = wb.service_id
        WHERE (ch.tier = 'main' AND wb.category_id = ch.category_id)
           OR (ch.tier = 'subcategory' AND (wb.subcategory_id = ch.category_id OR bs.subcategory_id = ch.category_id))
      ) AS gross_agreed_kobo,
      (
        SELECT COALESCE(SUM(ws.search_count), 0)::BIGINT
        FROM window_searches ws
        LEFT JOIN public.services ss ON ss.id = ws.resolved_service_id
        WHERE (ch.tier = 'main' AND ws.resolved_category_id = ch.category_id)
           OR (ch.tier = 'subcategory' AND (ws.resolved_category_id = ch.category_id OR ss.subcategory_id = ch.category_id))
      ) AS search_count,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_ai_logs wal
        WHERE wal.recommended_category_id = ch.category_id
           OR (ch.tier = 'main' AND wal.recommended_category_id IN (
                SELECT subc.id FROM public.service_categories subc WHERE subc.parent_id = ch.category_id AND subc.deleted_at IS NULL
              ))
      ) AS ai_assistant_hits,
      (
        SELECT COUNT(*)::INTEGER
        FROM window_maint wm
        LEFT JOIN public.services ms ON ms.id = wm.service_id
        WHERE (ch.tier = 'main' AND (wm.category_id = ch.category_id OR ms.category_id = ch.category_id))
           OR (ch.tier = 'subcategory' AND (wm.category_id = ch.category_id OR ms.subcategory_id = ch.category_id))
      ) AS maintenance_requests_count,
      (
        SELECT COUNT(*)::INTEGER
        FROM active_services_base asb
        WHERE (ch.tier = 'main' AND asb.category_id = ch.category_id)
           OR (ch.tier = 'subcategory' AND asb.subcategory_id = ch.category_id)
      ) AS active_services_count,
      (
        SELECT COUNT(DISTINCT pcc.professional_id)::INTEGER
        FROM public.professional_services ps
        JOIN pro_city_coverage pcc ON pcc.professional_id = ps.professional_id
        LEFT JOIN public.services ps_srv ON ps_srv.id = ps.service_id
        WHERE ps.is_active = true
          AND ps.deleted_at IS NULL
          AND pcc.is_available = true
          AND (
            ps.category_id = ch.category_id
            OR (ch.tier = 'main' AND (
              ps.category_id IN (SELECT sc2.id FROM public.service_categories sc2 WHERE sc2.parent_id = ch.category_id AND sc2.deleted_at IS NULL)
              OR ps_srv.category_id = ch.category_id
            ))
            OR (ch.tier = 'subcategory' AND ps_srv.subcategory_id = ch.category_id)
          )
      ) AS available_pros_count
    FROM cat_hierarchy ch
  ),
  location_booking_agg AS (
    SELECT
      wb.city,
      wb.lga_or_district,
      COUNT(*)::INTEGER AS total_bookings,
      COUNT(*) FILTER (WHERE wb.status IN ('open', 'quoted'))::INTEGER AS open_unmatched_bookings,
      COUNT(*) FILTER (WHERE wb.status IN ('open', 'quoted', 'scheduled', 'in_progress', 'pro_marked_complete'))::INTEGER AS active_bookings,
      COUNT(*) FILTER (WHERE wb.status = 'completed')::INTEGER AS completed_bookings,
      COUNT(*) FILTER (WHERE wb.is_custom_task = true)::INTEGER AS custom_task_bookings,
      COALESCE(SUM(wb.agreed_amount_kobo) FILTER (WHERE wb.status = 'completed'), 0)::BIGINT AS gross_agreed_kobo
    FROM window_bookings wb
    GROUP BY wb.city, wb.lga_or_district
  ),
  city_search_agg AS (
    SELECT
      CASE WHEN ws.city_filter = '' THEN 'All Cities / Unfiltered' ELSE ws.city_filter END AS city,
      COALESCE(SUM(ws.search_count), 0)::BIGINT AS search_count,
      COALESCE(SUM(ws.zero_result_count), 0)::BIGINT AS zero_result_count
    FROM window_searches ws
    GROUP BY 1
  ),
  city_supply_agg AS (
    SELECT
      city_name,
      COUNT(DISTINCT pcc.professional_id)::INTEGER AS approved_pros_count,
      COUNT(DISTINCT pcc.professional_id) FILTER (WHERE pcc.is_available = true)::INTEGER AS available_pros_count
    FROM (
      VALUES ('Port Harcourt'), ('Lagos'), ('Abuja')
    ) AS hubs(city_name)
    LEFT JOIN pro_city_coverage pcc
      ON EXISTS (SELECT 1 FROM unnest(pcc.cities) c WHERE c ILIKE '%' || hubs.city_name || '%')
    GROUP BY hubs.city_name
  ),
  demand_by_city_cte AS (
    SELECT
      c_name AS city,
      COALESCE((SELECT SUM(lba.total_bookings) FROM location_booking_agg lba WHERE lower(lba.city) = lower(c_name)), 0)::INTEGER AS total_bookings,
      COALESCE((SELECT SUM(lba.open_unmatched_bookings) FROM location_booking_agg lba WHERE lower(lba.city) = lower(c_name)), 0)::INTEGER AS open_unmatched_bookings,
      COALESCE((SELECT SUM(lba.completed_bookings) FROM location_booking_agg lba WHERE lower(lba.city) = lower(c_name)), 0)::INTEGER AS completed_bookings,
      COALESCE((SELECT SUM(lba.gross_agreed_kobo) FROM location_booking_agg lba WHERE lower(lba.city) = lower(c_name)), 0)::BIGINT AS gross_agreed_kobo,
      COALESCE((SELECT SUM(csa.search_count) FROM city_search_agg csa WHERE lower(csa.city) = lower(c_name)), 0)::BIGINT AS search_count,
      COALESCE((SELECT cs.approved_pros_count FROM city_supply_agg cs WHERE lower(cs.city_name) = lower(c_name)), 0)::INTEGER AS approved_pros_count,
      COALESCE((SELECT cs.available_pros_count FROM city_supply_agg cs WHERE lower(cs.city_name) = lower(c_name)), 0)::INTEGER AS available_pros_count
    FROM (
      SELECT DISTINCT city_col AS c_name
      FROM (
        SELECT unnest(ARRAY['Port Harcourt', 'Lagos', 'Abuja']) AS city_col
        UNION
        SELECT city AS city_col FROM location_booking_agg
        UNION
        SELECT city AS city_col FROM city_search_agg
      ) all_c
      WHERE trim(COALESCE(city_col, '')) <> ''
    ) cities
  ),
  demand_by_location_cte AS (
    SELECT
      lba.city,
      lba.lga_or_district,
      lba.total_bookings,
      lba.open_unmatched_bookings,
      lba.active_bookings,
      lba.completed_bookings,
      lba.custom_task_bookings,
      lba.gross_agreed_kobo,
      COALESCE((SELECT csa.search_count FROM city_search_agg csa WHERE lower(csa.city) = lower(lba.city)), 0)::BIGINT AS city_search_count,
      (
        SELECT COUNT(DISTINCT ap.id)::INTEGER
        FROM active_pros ap
        LEFT JOIN public.professional_service_areas psa
          ON psa.professional_id = ap.id AND psa.is_active = true
        WHERE (
          lower(ap.primary_city) = lower(lba.city)
          OR lower(COALESCE(psa.city, '')) = lower(lba.city)
        )
        AND (
          lba.lga_or_district = 'All Districts / Unspecified'
          OR lower(COALESCE(psa.lga_or_district, '')) ILIKE '%' || lower(split_part(lba.lga_or_district, ' ', 1)) || '%'
          OR lower(COALESCE(psa.neighbourhood, '')) ILIKE '%' || lower(split_part(lba.lga_or_district, ' ', 1)) || '%'
          OR psa.id IS NULL
        )
      ) AS approved_pros_count,
      (
        SELECT COUNT(DISTINCT ap.id)::INTEGER
        FROM active_pros ap
        LEFT JOIN public.professional_service_areas psa
          ON psa.professional_id = ap.id AND psa.is_active = true
        WHERE ap.is_available = true
          AND (
            lower(ap.primary_city) = lower(lba.city)
            OR lower(COALESCE(psa.city, '')) = lower(lba.city)
          )
          AND (
            lba.lga_or_district = 'All Districts / Unspecified'
            OR lower(COALESCE(psa.lga_or_district, '')) ILIKE '%' || lower(split_part(lba.lga_or_district, ' ', 1)) || '%'
            OR lower(COALESCE(psa.neighbourhood, '')) ILIKE '%' || lower(split_part(lba.lga_or_district, ' ', 1)) || '%'
            OR psa.id IS NULL
          )
      ) AS available_pros_count
    FROM location_booking_agg lba
    ORDER BY lba.total_bookings DESC, lba.open_unmatched_bookings DESC, lba.city ASC
    LIMIT 30
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'generated_at', now(),
    'summary', jsonb_build_object(
      'total_searches', COALESCE((SELECT SUM(search_count) FROM window_searches), 0),
      'zero_result_searches', COALESCE((SELECT SUM(zero_result_count) FROM window_searches), 0),
      'zero_result_rate_pct', CASE
        WHEN COALESCE((SELECT SUM(search_count) FROM window_searches), 0) > 0
          THEN ROUND(
            (COALESCE((SELECT SUM(zero_result_count) FROM window_searches), 0)::NUMERIC * 100.0)
            / COALESCE((SELECT SUM(search_count) FROM window_searches), 1)::NUMERIC,
            1
          )
        ELSE 0
      END,
      'active_services_count', (SELECT COUNT(*)::INTEGER FROM service_with_status),
      'services_with_zero_providers_count', (SELECT COUNT(*)::INTEGER FROM service_with_status WHERE total_eligible_pros = 0),
      'services_none_available_count', (SELECT COUNT(*)::INTEGER FROM service_with_status WHERE available_pros = 0),
      'insufficient_provider_services_count', (SELECT COUNT(*)::INTEGER FROM service_with_status WHERE gap_severity <> 'healthy'),
      'total_bookings_in_window', (SELECT COUNT(*)::INTEGER FROM window_bookings),
      'direct_service_bookings_count', (SELECT COUNT(*)::INTEGER FROM window_bookings WHERE service_id IS NOT NULL),
      'custom_task_requests_count', (SELECT COUNT(*)::INTEGER FROM window_bookings WHERE is_custom_task = true),
      'maintenance_requests_count', (SELECT COUNT(*)::INTEGER FROM window_maint),
      'ai_queries_in_window', (SELECT COUNT(*)::INTEGER FROM window_ai_logs),
      'approved_available_pros_count', (SELECT COUNT(*)::INTEGER FROM active_pros WHERE is_available = true),
      'approved_total_pros_count', (SELECT COUNT(*)::INTEGER FROM active_pros)
    ),
    'most_searched_services', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          sws.service_id,
          sws.service_code,
          sws.name,
          sws.slug,
          sws.category_name,
          sws.subcategory_name,
          sws.search_count,
          sws.zero_result_hits,
          sws.direct_bookings,
          sws.available_pros,
          sws.total_eligible_pros,
          sws.gap_severity
        FROM service_with_status sws
        WHERE sws.search_count > 0
        ORDER BY sws.search_count DESC, sws.direct_bookings DESC, sws.name ASC
        LIMIT 15
      ) t
    ), '[]'::jsonb),
    'top_search_queries', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          ws.normalized_query,
          ws.search_surface,
          ws.city_filter,
          ws.search_count,
          ws.zero_result_count,
          ws.last_result_count,
          srv.name AS resolved_service_name,
          srv.slug AS resolved_service_slug,
          cat.name AS resolved_category_name,
          ws.last_searched_at
        FROM window_searches ws
        LEFT JOIN public.services srv ON srv.id = ws.resolved_service_id
        LEFT JOIN public.service_categories cat ON cat.id = ws.resolved_category_id
        ORDER BY ws.search_count DESC, ws.last_searched_at DESC
        LIMIT 20
      ) t
    ), '[]'::jsonb),
    'most_requested_services', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          sws.service_id,
          sws.service_code,
          sws.name,
          sws.slug,
          sws.category_name,
          sws.subcategory_name,
          sws.direct_bookings,
          sws.open_unmatched_bookings,
          sws.custom_task_bookings,
          sws.maintenance_requests_count,
          sws.search_count,
          sws.category_bookings_context,
          (sws.direct_bookings + sws.maintenance_requests_count + sws.search_count)::BIGINT AS combined_demand_signals,
          sws.available_pros,
          sws.gap_severity
        FROM service_with_status sws
        WHERE (sws.direct_bookings + sws.maintenance_requests_count + sws.search_count + sws.category_bookings_context) > 0
        ORDER BY
          (sws.direct_bookings + sws.maintenance_requests_count) DESC,
          sws.search_count DESC,
          sws.category_bookings_context DESC,
          sws.name ASC
        LIMIT 20
      ) t
    ), '[]'::jsonb),
    'most_frequently_booked_services', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          sws.service_id,
          sws.service_code,
          sws.name,
          sws.slug,
          sws.category_name,
          sws.subcategory_name,
          sws.direct_bookings AS total_bookings,
          sws.completed_bookings,
          sws.active_bookings,
          sws.cancelled_bookings,
          sws.disputed_bookings,
          sws.custom_task_bookings,
          sws.gross_agreed_kobo,
          sws.avg_agreed_kobo,
          CASE
            WHEN sws.direct_bookings > 0
              THEN ROUND((sws.completed_bookings::NUMERIC * 100.0) / sws.direct_bookings::NUMERIC, 1)
            ELSE 0
          END AS completion_rate_pct,
          sws.available_pros
        FROM service_with_status sws
        WHERE sws.direct_bookings > 0
        ORDER BY sws.direct_bookings DESC, sws.completed_bookings DESC, sws.gross_agreed_kobo DESC, sws.name ASC
        LIMIT 20
      ) t
    ), '[]'::jsonb),
    'popular_categories', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          pc.category_id,
          pc.parent_id,
          pc.parent_name,
          pc.name,
          pc.slug,
          pc.tier,
          pc.total_bookings,
          pc.completed_bookings,
          pc.active_bookings,
          pc.custom_task_bookings,
          pc.gross_agreed_kobo,
          pc.search_count,
          pc.ai_assistant_hits,
          pc.maintenance_requests_count,
          pc.active_services_count,
          pc.available_pros_count
        FROM popular_categories_cte pc
        ORDER BY
          (pc.tier = 'main') DESC,
          (pc.total_bookings + pc.maintenance_requests_count + pc.ai_assistant_hits) DESC,
          pc.search_count DESC,
          pc.gross_agreed_kobo DESC,
          pc.name ASC
        LIMIT 80
      ) t
    ), '[]'::jsonb),
    'insufficient_provider_services', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          sws.service_id,
          sws.service_code,
          sws.name,
          sws.slug,
          sws.category_name,
          sws.subcategory_name,
          sws.requires_trade_certification,
          sws.direct_service_pros,
          sws.total_eligible_pros,
          sws.available_pros,
          sws.offline_pros,
          sws.ph_pros,
          sws.lagos_pros,
          sws.abuja_pros,
          sws.missing_cities,
          (sws.direct_bookings + sws.maintenance_requests_count)::INTEGER AS booking_demand,
          sws.open_unmatched_bookings,
          sws.search_count,
          sws.category_bookings_context,
          sws.gap_severity
        FROM service_with_status sws
        WHERE sws.gap_severity <> 'healthy'
        ORDER BY
          CASE sws.gap_severity
            WHEN 'critical_no_providers' THEN 1
            WHEN 'high_none_available' THEN 2
            WHEN 'high_unmet_demand' THEN 3
            ELSE 4
          END ASC,
          sws.open_unmatched_bookings DESC,
          (sws.direct_bookings + sws.search_count) DESC,
          cardinality(sws.missing_cities) DESC,
          sws.name ASC
      ) t
    ), '[]'::jsonb),
    'zero_result_searches', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          ws.normalized_query,
          ws.search_surface,
          ws.city_filter,
          ws.zero_result_count,
          ws.search_count,
          ws.last_result_count,
          ws.last_searched_at
        FROM window_searches ws
        WHERE ws.zero_result_count > 0
        ORDER BY ws.zero_result_count DESC, ws.last_searched_at DESC
        LIMIT 30
      ) t
    ), '[]'::jsonb),
    'demand_by_city', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          dbc.*,
          CASE
            WHEN dbc.available_pros_count > 0
              THEN ROUND(dbc.total_bookings::NUMERIC / dbc.available_pros_count::NUMERIC, 2)
            ELSE NULL
          END AS bookings_per_available_pro
        FROM demand_by_city_cte dbc
        ORDER BY dbc.total_bookings DESC, dbc.search_count DESC, dbc.city ASC
      ) t
    ), '[]'::jsonb),
    'demand_by_location', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          dbl.*,
          CASE
            WHEN dbl.available_pros_count > 0
              THEN ROUND(dbl.total_bookings::NUMERIC / dbl.available_pros_count::NUMERIC, 2)
            ELSE NULL
          END AS bookings_per_available_pro
        FROM demand_by_location_cte dbl
      ) t
    ), '[]'::jsonb),
    'provider_availability_by_service', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          sws.service_id,
          sws.service_code,
          sws.name,
          sws.slug,
          sws.category_id,
          sws.category_name,
          sws.subcategory_name,
          sws.requires_trade_certification,
          sws.direct_service_pros,
          sws.total_eligible_pros,
          sws.available_pros,
          sws.offline_pros,
          sws.ph_pros,
          sws.lagos_pros,
          sws.abuja_pros,
          sws.missing_cities,
          (sws.direct_bookings + sws.maintenance_requests_count)::INTEGER AS booking_demand,
          sws.search_count,
          sws.gap_severity
        FROM service_with_status sws
        ORDER BY
          sws.available_pros ASC,
          sws.direct_service_pros ASC,
          (sws.direct_bookings + sws.search_count) DESC,
          sws.name ASC
      ) t
    ), '[]'::jsonb)
  ) INTO v_payload;

  RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_demand_analytics(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_demand_analytics(INTEGER) TO authenticated, service_role;

COMMIT;
