-- ============================================================================
-- EasyLife Migration: Service Lifecycle Management & Structured Platform Settings
-- Date: 2026-11-14
-- Purpose:
--   1. Add explicit service lifecycle statuses ('active', 'paused', 'inactive')
--      with independent homepage visibility ('show_on_homepage').
--   2. Enforce booking & quotation blocking for paused/inactive services at DB level.
--   3. Add auditable admin RPCs for service lifecycle & homepage visibility control.
--   4. Upgrade catalogue RPCs (get_service_catalogue_tree, search_service_catalogue)
--      to expose status, paused_at, deactivated_at, created_at, updated_at.
--   5. Seed structured, human-friendly platform settings across 6 domains without
--      inventing fictional financial defaults.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Service Lifecycle Columns & Synchronization Trigger
-- ----------------------------------------------------------------------------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.services'::regclass
      AND conname = 'services_status_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_status_check
      CHECK (status IN ('active', 'paused', 'inactive'));
  END IF;
END;
$$;

-- Backfill lifecycle status for existing rows
UPDATE public.services
SET
  status = CASE
    WHEN deleted_at IS NOT NULL OR is_active = false THEN 'inactive'
    ELSE 'active'
  END,
  deactivated_at = CASE
    WHEN (deleted_at IS NOT NULL OR is_active = false) AND deactivated_at IS NULL THEN COALESCE(deleted_at, updated_at, now())
    ELSE deactivated_at
  END
WHERE status IS DISTINCT FROM CASE
    WHEN deleted_at IS NOT NULL OR is_active = false THEN 'inactive'
    ELSE 'active'
  END;

CREATE INDEX IF NOT EXISTS idx_services_status_homepage
  ON public.services (status, show_on_homepage)
  WHERE deleted_at IS NULL;

-- Synchronize services.status and services.is_active while keeping
-- show_on_homepage completely independent of lifecycle status.
CREATE OR REPLACE FUNCTION public.sync_service_lifecycle_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      NEW.status := CASE WHEN COALESCE(NEW.is_active, true) THEN 'active' ELSE 'inactive' END;
    END IF;
    IF NEW.status = 'active' THEN
      NEW.is_active := true;
      NEW.paused_at := NULL;
      NEW.deactivated_at := NULL;
    ELSIF NEW.status = 'paused' THEN
      NEW.is_active := false;
      NEW.paused_at := COALESCE(NEW.paused_at, now());
      NEW.deactivated_at := NULL;
    ELSE
      NEW.status := 'inactive';
      NEW.is_active := false;
      NEW.deactivated_at := COALESCE(NEW.deactivated_at, now());
      NEW.paused_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE path: explicit status change takes precedence
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'active' THEN
      NEW.is_active := true;
      NEW.paused_at := NULL;
      NEW.deactivated_at := NULL;
    ELSIF NEW.status = 'paused' THEN
      NEW.is_active := false;
      NEW.paused_at := COALESCE(NEW.paused_at, now());
      NEW.deactivated_at := NULL;
    ELSE
      NEW.status := 'inactive';
      NEW.is_active := false;
      NEW.deactivated_at := COALESCE(NEW.deactivated_at, now());
      NEW.paused_at := NULL;
    END IF;
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    -- Legacy caller toggled is_active directly
    IF NEW.is_active = true THEN
      NEW.status := 'active';
      NEW.paused_at := NULL;
      NEW.deactivated_at := NULL;
    ELSE
      NEW.status := 'inactive';
      NEW.deactivated_at := COALESCE(NEW.deactivated_at, now());
      NEW.paused_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_sync_status_and_is_active ON public.services;
CREATE TRIGGER trg_services_sync_status_and_is_active
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_service_lifecycle_status();

-- ----------------------------------------------------------------------------
-- 2. Database-Level Guard: Block Bookings for Paused/Inactive Services
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_active_service_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_marketplace JSONB;
BEGIN
  -- Respect global marketplace booking toggle if configured
  SELECT value INTO v_marketplace
  FROM public.platform_settings
  WHERE key = 'settings.marketplace'
  LIMIT 1;

  IF v_marketplace IS NOT NULL AND COALESCE((v_marketplace->>'enable_service_bookings')::boolean, true) = false THEN
    RAISE EXCEPTION 'BOOKINGS_DISABLED: Service bookings are currently paused by platform administration.';
  END IF;

  IF NEW.service_id IS NOT NULL THEN
    SELECT id, name, status, is_active, deleted_at
    INTO v_service
    FROM public.services
    WHERE id = NEW.service_id
    LIMIT 1;

    IF NOT FOUND OR v_service.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'SERVICE_NOT_FOUND: The requested service is no longer available.';
    END IF;

    IF v_service.status = 'paused' THEN
      RAISE EXCEPTION 'SERVICE_PAUSED: "%" is temporarily paused and not accepting new bookings or quotation requests.', v_service.name;
    END IF;

    IF v_service.status = 'inactive' OR v_service.is_active = false THEN
      RAISE EXCEPTION 'SERVICE_INACTIVE: "%" is currently inactive and unavailable for booking.', v_service.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_require_active_service ON public.bookings;
CREATE TRIGGER trg_bookings_require_active_service
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_active_service_on_booking();

-- ----------------------------------------------------------------------------
-- 3. Auditable Admin RPCs for Service Lifecycle & Homepage Visibility
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_service_status(
  p_service_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID;
  v_existing public.services%ROWTYPE;
  v_updated public.services%ROWTYPE;
  v_clean_status TEXT := lower(trim(COALESCE(p_status, '')));
BEGIN
  IF NOT (public.is_admin() OR COALESCE(auth.role(), '') = 'service_role' OR session_user IN ('postgres', 'supabase_admin')) THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  IF v_clean_status NOT IN ('active', 'paused', 'inactive') THEN
    RAISE EXCEPTION 'INVALID_STATUS: Service status must be active, paused, or inactive.';
  END IF;

  SELECT * INTO v_existing
  FROM public.services
  WHERE id = p_service_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Service not found.';
  END IF;

  IF v_existing.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'ARCHIVED: Archived services must be restored before changing lifecycle status.';
  END IF;

  v_actor := auth.uid();

  UPDATE public.services
  SET
    status = v_clean_status,
    updated_by = COALESCE(v_actor, updated_by),
    updated_at = now()
  WHERE id = p_service_id
  RETURNING * INTO v_updated;

  INSERT INTO public.audit_logs (
    actor_user_id, actor_role, action, entity_type, entity_id, old_values, new_values, metadata
  ) VALUES (
    v_actor,
    CASE WHEN v_actor IS NOT NULL THEN 'admin'::public.user_role ELSE NULL END,
    'service.status_changed',
    'service',
    p_service_id::text,
    jsonb_build_object(
      'status', v_existing.status,
      'is_active', v_existing.is_active,
      'show_on_homepage', v_existing.show_on_homepage
    ),
    jsonb_build_object(
      'status', v_updated.status,
      'is_active', v_updated.is_active,
      'show_on_homepage', v_updated.show_on_homepage,
      'paused_at', v_updated.paused_at,
      'deactivated_at', v_updated.deactivated_at
    ),
    jsonb_build_object(
      'service_name', v_updated.name,
      'reason', NULLIF(trim(COALESCE(p_reason, '')), '')
    )
  );

  RETURN jsonb_build_object(
    'id', v_updated.id,
    'name', v_updated.name,
    'status', v_updated.status,
    'is_active', v_updated.is_active,
    'show_on_homepage', v_updated.show_on_homepage,
    'paused_at', v_updated.paused_at,
    'deactivated_at', v_updated.deactivated_at,
    'updated_at', v_updated.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_service_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_service_status(UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_toggle_service_homepage_visibility(
  p_service_id UUID,
  p_show_on_homepage BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID;
  v_existing public.services%ROWTYPE;
  v_updated public.services%ROWTYPE;
BEGIN
  IF NOT (public.is_admin() OR COALESCE(auth.role(), '') = 'service_role' OR session_user IN ('postgres', 'supabase_admin')) THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  SELECT * INTO v_existing
  FROM public.services
  WHERE id = p_service_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Service not found.';
  END IF;

  IF v_existing.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'ARCHIVED: Archived services must be restored before changing homepage visibility.';
  END IF;

  v_actor := auth.uid();

  UPDATE public.services
  SET
    show_on_homepage = COALESCE(p_show_on_homepage, false),
    updated_by = COALESCE(v_actor, updated_by),
    updated_at = now()
  WHERE id = p_service_id
  RETURNING * INTO v_updated;

  INSERT INTO public.audit_logs (
    actor_user_id, actor_role, action, entity_type, entity_id, old_values, new_values, metadata
  ) VALUES (
    v_actor,
    CASE WHEN v_actor IS NOT NULL THEN 'admin'::public.user_role ELSE NULL END,
    'service.homepage_visibility_changed',
    'service',
    p_service_id::text,
    jsonb_build_object('show_on_homepage', v_existing.show_on_homepage, 'status', v_existing.status),
    jsonb_build_object('show_on_homepage', v_updated.show_on_homepage, 'status', v_updated.status),
    jsonb_build_object('service_name', v_updated.name)
  );

  RETURN jsonb_build_object(
    'id', v_updated.id,
    'name', v_updated.name,
    'status', v_updated.status,
    'show_on_homepage', v_updated.show_on_homepage,
    'updated_at', v_updated.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_toggle_service_homepage_visibility(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_toggle_service_homepage_visibility(UUID, BOOLEAN) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_delete_service(
  p_service_id UUID,
  p_hard_delete BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID;
  v_existing public.services%ROWTYPE;
  v_booking_refs BIGINT := 0;
  v_pro_refs BIGINT := 0;
  v_mode TEXT := 'soft_archived';
BEGIN
  IF NOT (public.is_admin() OR COALESCE(auth.role(), '') = 'service_role' OR session_user IN ('postgres', 'supabase_admin')) THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  SELECT * INTO v_existing
  FROM public.services
  WHERE id = p_service_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Service not found.';
  END IF;

  SELECT COUNT(*) INTO v_booking_refs FROM public.bookings WHERE service_id = p_service_id;
  SELECT COUNT(*) INTO v_pro_refs FROM public.professional_services WHERE service_id = p_service_id;

  v_actor := auth.uid();

  IF COALESCE(p_hard_delete, false) AND v_booking_refs = 0 AND v_pro_refs = 0 THEN
    DELETE FROM public.service_requirements WHERE service_id = p_service_id;
    DELETE FROM public.services WHERE id = p_service_id;
    v_mode := 'hard_deleted';
  ELSE
    UPDATE public.services
    SET
      status = 'inactive',
      is_active = false,
      show_on_homepage = false,
      deactivated_at = COALESCE(deactivated_at, now()),
      deleted_at = COALESCE(deleted_at, now()),
      updated_by = COALESCE(v_actor, updated_by),
      updated_at = now()
    WHERE id = p_service_id;
    v_mode := 'soft_archived';
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id, actor_role, action, entity_type, entity_id, old_values, new_values, metadata
  ) VALUES (
    v_actor,
    CASE WHEN v_actor IS NOT NULL THEN 'admin'::public.user_role ELSE NULL END,
    CASE WHEN v_mode = 'hard_deleted' THEN 'service.deleted' ELSE 'service.archived' END,
    'service',
    p_service_id::text,
    jsonb_build_object('name', v_existing.name, 'status', v_existing.status, 'show_on_homepage', v_existing.show_on_homepage),
    jsonb_build_object('mode', v_mode, 'booking_refs', v_booking_refs, 'provider_refs', v_pro_refs),
    jsonb_build_object('service_code', v_existing.service_code)
  );

  RETURN jsonb_build_object(
    'id', p_service_id,
    'name', v_existing.name,
    'mode', v_mode,
    'booking_refs', v_booking_refs,
    'provider_refs', v_pro_refs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_service(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_service(UUID, BOOLEAN) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Upgrade get_service_catalogue_tree(BOOLEAN) with Lifecycle Fields
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_service_catalogue_tree(
  p_include_inactive BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allow_inactive BOOLEAN := false;
  v_result JSONB;
BEGIN
  IF p_include_inactive THEN
    IF public.is_admin() OR COALESCE(auth.role(), '') = 'service_role' OR session_user IN ('postgres', 'supabase_admin') THEN
      v_allow_inactive := true;
    ELSE
      RAISE EXCEPTION 'FORBIDDEN: Only administrators may inspect inactive catalogue entries.';
    END IF;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', mc.id,
        'name', mc.name,
        'slug', mc.slug,
        'description', mc.description,
        'icon_name', mc.icon_name,
        'image_url', mc.image_url,
        'keywords', mc.keywords,
        'default_commission_bps', mc.default_commission_bps,
        'display_order', mc.display_order,
        'is_active', mc.is_active,
        'is_featured', mc.is_featured,
        'is_popular', mc.is_popular,
        'show_on_homepage', mc.show_on_homepage,
        'direct_services', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'category_id', s.category_id,
              'subcategory_id', s.subcategory_id,
              'service_code', s.service_code,
              'name', s.name,
              'slug', s.slug,
              'short_description', s.short_description,
              'description', s.description,
              'image_url', s.image_url,
              'icon_name', s.icon_name,
              'keywords', s.keywords,
              'display_order', s.display_order,
              'base_price_min_kobo', s.base_price_min_kobo,
              'base_price_max_kobo', s.base_price_max_kobo,
              'estimated_duration_minutes', s.estimated_duration_minutes,
              'status', s.status,
              'paused_at', s.paused_at,
              'deactivated_at', s.deactivated_at,
              'created_at', s.created_at,
              'updated_at', s.updated_at,
              'is_active', s.is_active,
              'is_featured', s.is_featured,
              'is_popular', s.is_popular,
              'show_on_homepage', s.show_on_homepage,
              'requires_verified_identity', s.requires_verified_identity,
              'requires_trade_certification', s.requires_trade_certification,
              'requires_business_registration', s.requires_business_registration,
              'requires_site_inspection', s.requires_site_inspection,
              'min_years_experience', s.min_years_experience,
              'eligible_provider_types', s.eligible_provider_types,
              'required_document_types', s.required_document_types,
              'requirements', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', sr.id,
                    'requirement_key', sr.requirement_key,
                    'requirement_type', sr.requirement_type,
                    'title', sr.title,
                    'description', sr.description,
                    'is_required', sr.is_required,
                    'applies_to', sr.applies_to,
                    'config', sr.config
                  )
                  ORDER BY sr.display_order, sr.title
                )
                FROM public.service_requirements sr
                WHERE sr.service_id = s.id
                  AND sr.deleted_at IS NULL
                  AND (v_allow_inactive OR sr.is_active = true)
              ), '[]'::jsonb)
            )
            ORDER BY s.display_order, s.name
          )
          FROM public.services s
          WHERE s.category_id = mc.id
            AND s.subcategory_id IS NULL
            AND s.deleted_at IS NULL
            AND (v_allow_inactive OR s.status = 'active')
        ), '[]'::jsonb),
        'subcategories', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sub.id,
              'parent_id', sub.parent_id,
              'name', sub.name,
              'slug', sub.slug,
              'description', sub.description,
              'icon_name', sub.icon_name,
              'image_url', sub.image_url,
              'keywords', sub.keywords,
              'display_order', sub.display_order,
              'is_active', sub.is_active,
              'is_featured', sub.is_featured,
              'is_popular', sub.is_popular,
              'services', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', s.id,
                    'category_id', s.category_id,
                    'subcategory_id', s.subcategory_id,
                    'service_code', s.service_code,
                    'name', s.name,
                    'slug', s.slug,
                    'short_description', s.short_description,
                    'description', s.description,
                    'image_url', s.image_url,
                    'icon_name', s.icon_name,
                    'keywords', s.keywords,
                    'display_order', s.display_order,
                    'base_price_min_kobo', s.base_price_min_kobo,
                    'base_price_max_kobo', s.base_price_max_kobo,
                    'estimated_duration_minutes', s.estimated_duration_minutes,
                    'status', s.status,
                    'paused_at', s.paused_at,
                    'deactivated_at', s.deactivated_at,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at,
                    'is_active', s.is_active,
                    'is_featured', s.is_featured,
                    'is_popular', s.is_popular,
                    'show_on_homepage', s.show_on_homepage,
                    'requires_verified_identity', s.requires_verified_identity,
                    'requires_trade_certification', s.requires_trade_certification,
                    'requires_business_registration', s.requires_business_registration,
                    'requires_site_inspection', s.requires_site_inspection,
                    'min_years_experience', s.min_years_experience,
                    'eligible_provider_types', s.eligible_provider_types,
                    'required_document_types', s.required_document_types,
                    'requirements', COALESCE((
                      SELECT jsonb_agg(
                        jsonb_build_object(
                          'id', sr.id,
                          'requirement_key', sr.requirement_key,
                          'requirement_type', sr.requirement_type,
                          'title', sr.title,
                          'description', sr.description,
                          'is_required', sr.is_required,
                          'applies_to', sr.applies_to,
                          'config', sr.config
                        )
                        ORDER BY sr.display_order, sr.title
                      )
                      FROM public.service_requirements sr
                      WHERE sr.service_id = s.id
                        AND sr.deleted_at IS NULL
                        AND (v_allow_inactive OR sr.is_active = true)
                    ), '[]'::jsonb)
                  )
                  ORDER BY s.display_order, s.name
                )
                FROM public.services s
                WHERE s.subcategory_id = sub.id
                  AND s.deleted_at IS NULL
                  AND (v_allow_inactive OR s.status = 'active')
              ), '[]'::jsonb)
            )
            ORDER BY sub.display_order, sub.name
          )
          FROM public.service_categories sub
          WHERE sub.parent_id = mc.id
            AND sub.deleted_at IS NULL
            AND (v_allow_inactive OR sub.is_active = true)
        ), '[]'::jsonb)
      )
      ORDER BY mc.display_order, mc.name
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.service_categories mc
  WHERE mc.parent_id IS NULL
    AND mc.deleted_at IS NULL
    AND (v_allow_inactive OR mc.is_active = true);

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_service_catalogue_tree(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_service_catalogue_tree(BOOLEAN) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Upgrade search_service_catalogue to Expose Lifecycle Status
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_service_catalogue(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER);

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
  service_status TEXT,
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
      s.status AS service_status,
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
      (s.status = 'active' AND s.is_active AND mc.is_active AND (sub.id IS NULL OR sub.is_active)) AS is_currently_available,
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
        (v_allow_unavailable = true AND s.status IN ('active', 'paused'))
        OR (s.status = 'active' AND s.is_active = true AND mc.is_active = true AND (sub.id IS NULL OR sub.is_active = true))
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
    p_row.service_status,
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

-- ----------------------------------------------------------------------------
-- 6. Seed Structured Platform Settings Sections (6 Organized Domains)
--    Zero fictional financial values or unconfigured payment activations.
-- ----------------------------------------------------------------------------
INSERT INTO public.platform_settings (key, value, description, is_public)
VALUES
  (
    'settings.general',
    jsonb_build_object(
      'platform_name', 'EasyLife',
      'platform_description', 'Trusted home, facility, and business service marketplace connecting verified professionals with customers across Nigeria.',
      'platform_logo_url', '/images/easylife-logo.png',
      'contact_email', 'support@easylife.ng',
      'contact_phone', '',
      'website_url', 'https://easylife.ng',
      'business_address', '',
      'default_currency', 'NGN',
      'default_country', 'Nigeria',
      'default_timezone', 'Africa/Lagos',
      'supported_cities', jsonb_build_array('Port Harcourt', 'Lagos', 'Abuja')
    ),
    'General platform identity, contact details, currency, country, and timezone settings.',
    true
  ),
  (
    'settings.registration',
    jsonb_build_object(
      'enable_customer_registration', true,
      'enable_professional_registration', true,
      'enable_business_registration', true,
      'require_email_verification', true,
      'require_phone_verification', false,
      'require_professional_approval', true,
      'require_business_approval', true,
      'min_password_length', 8,
      'require_strong_password', true
    ),
    'Customer, professional, and business registration, verification, approval, and password policies.',
    false
  ),
  (
    'settings.marketplace',
    jsonb_build_object(
      'enable_service_bookings', true,
      'enable_quotation_requests', true,
      'enable_provider_applications', true,
      'require_service_approval', true,
      'show_paused_services_in_catalogue', false,
      'default_quotation_expiry_hours', 48,
      'dispute_auto_escalate_hours', 48,
      'maintenance_mode_enabled', false,
      'maintenance_mode_message', ''
    ),
    'Service marketplace operational switches, quotation windows, and visibility controls.',
    true
  ),
  (
    'settings.financial',
    jsonb_build_object(
      'commission_enabled', false,
      'default_commission_percent', 0,
      'minimum_callout_fee_naira', 0,
      'supported_currencies', jsonb_build_array('NGN'),
      'tax_enabled', false,
      'tax_rate_percent', 0,
      'tax_label', 'VAT',
      'payment_provider_enabled', false,
      'payment_provider_name', 'Paystack'
    ),
    'Commission structure, transaction controls, supported currencies, tax, and payment gateway settings.',
    false
  ),
  (
    'settings.notifications',
    jsonb_build_object(
      'email_notifications_enabled', true,
      'push_notifications_enabled', true,
      'sms_notifications_enabled', false,
      'booking_notifications_enabled', true,
      'account_verification_notifications_enabled', true,
      'admin_alert_notifications_enabled', true,
      'admin_alert_email', 'support@easylife.ng'
    ),
    'Email, push, SMS, booking, verification, and administrative notification toggles.',
    false
  ),
  (
    'settings.security',
    jsonb_build_object(
      'enforce_admin_mfa', false,
      'session_timeout_minutes', 60,
      'max_login_attempts', 5,
      'lockout_duration_minutes', 15,
      'audit_logging_enabled', true,
      'require_reason_for_suspension', true,
      'restrict_admin_registration', true
    ),
    'Administrative access controls, session policies, login protection, and audit logging settings.',
    false
  )
ON CONFLICT (key) DO NOTHING;

-- Remove obsolete raw test/legacy keys that conflict with structured settings UI
DELETE FROM public.platform_settings
WHERE key IN ('test_ops_threshold');

NOTIFY pgrst, 'reload schema';

COMMIT;
