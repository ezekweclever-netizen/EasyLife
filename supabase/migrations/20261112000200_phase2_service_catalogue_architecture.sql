-- =============================================================================
-- Migration: Phase 2 — Scalable 3-Tier Service Catalogue Database Architecture
-- Hierarchy: Main Category -> Subcategory -> Individual Service (+ Requirements)
-- Purpose: Extends public.service_categories in place, adds public.services &
--          public.service_requirements, adds non-breaking service_id bridges
--          across bookings / professional_services / maintenance / commissions,
--          preserves 100% of existing historical data, and provides tree &
--          per-service provider eligibility verification RPCs.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Extend public.service_categories (Tier 1: Main Categories & Tier 2: Subcategories)
-- -----------------------------------------------------------------------------
ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_categories_parent_order
  ON public.service_categories (parent_id, display_order, name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_categories_visibility
  ON public.service_categories (is_active, show_on_homepage, is_featured, is_popular)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_categories_keywords_gin
  ON public.service_categories USING GIN (keywords);

-- Enforce strict 2-tier category tree (Main Category -> Subcategory) without cycles
CREATE OR REPLACE FUNCTION public.enforce_service_category_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_parent_id UUID;
  v_parent_deleted TIMESTAMPTZ;
  v_has_children BOOLEAN;
BEGIN
  IF NEW.slug IS NOT NULL THEN
    NEW.slug := lower(trim(NEW.slug));
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: A service category cannot be its own parent.';
    END IF;

    SELECT parent_id, deleted_at
    INTO v_parent_parent_id, v_parent_deleted
    FROM public.service_categories
    WHERE id = NEW.parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: Parent category % does not exist.', NEW.parent_id;
    END IF;

    IF v_parent_deleted IS NOT NULL THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: Cannot attach subcategory to archived parent category %.', NEW.parent_id;
    END IF;

    IF v_parent_parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: Maximum category depth is 2 levels (Main Category -> Subcategory).';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.service_categories child
        WHERE child.parent_id = NEW.id
          AND child.deleted_at IS NULL
      ) INTO v_has_children;

      IF v_has_children THEN
        RAISE EXCEPTION 'HIERARCHY_ERROR: Cannot convert a main category that already owns active subcategories into a subcategory.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_categories_hierarchy ON public.service_categories;
CREATE TRIGGER trg_service_categories_hierarchy
  BEFORE INSERT OR UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_category_hierarchy();

-- Clean & tighten service_categories RLS to respect soft archival
DROP POLICY IF EXISTS "service_categories_public_read" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_read_all" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_write" ON public.service_categories;

CREATE POLICY "service_categories_public_read"
  ON public.service_categories
  FOR SELECT
  USING ((is_active = true AND deleted_at IS NULL) OR public.is_admin());

CREATE POLICY "service_categories_admin_write"
  ON public.service_categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. Create public.services (Tier 3: Individual Services)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  service_code TEXT NOT NULL DEFAULT ('EL-SRV-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8))),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  show_on_homepage BOOLEAN NOT NULL DEFAULT false,
  base_price_min_kobo BIGINT NOT NULL DEFAULT 0 CHECK (base_price_min_kobo >= 0),
  base_price_max_kobo BIGINT CHECK (base_price_max_kobo IS NULL OR base_price_max_kobo >= base_price_min_kobo),
  estimated_duration_minutes INTEGER CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  default_commission_bps INTEGER CHECK (default_commission_bps IS NULL OR default_commission_bps BETWEEN 0 AND 5000),
  requires_verified_identity BOOLEAN NOT NULL DEFAULT true,
  requires_trade_certification BOOLEAN NOT NULL DEFAULT false,
  requires_business_registration BOOLEAN NOT NULL DEFAULT false,
  requires_site_inspection BOOLEAN NOT NULL DEFAULT false,
  min_years_experience SMALLINT NOT NULL DEFAULT 0 CHECK (min_years_experience BETWEEN 0 AND 50),
  eligible_provider_types TEXT[] NOT NULL DEFAULT ARRAY['trade_technician']::TEXT[],
  required_document_types public.document_type[] NOT NULL DEFAULT ARRAY['national_id_nin']::public.document_type[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(service_code, '')
    )
  ) STORED,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT services_slug_unique UNIQUE (slug),
  CONSTRAINT services_code_unique UNIQUE (service_code),
  CONSTRAINT services_eligible_provider_types_nonempty CHECK (cardinality(eligible_provider_types) >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_services_active_name_per_parent
  ON public.services (
    category_id,
    COALESCE(subcategory_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(trim(name))
  )
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_hierarchy_order
  ON public.services (category_id, subcategory_id, display_order, name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_visibility
  ON public.services (is_active, is_featured, is_popular, show_on_homepage)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_keywords_gin
  ON public.services USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_services_search_vector_gin
  ON public.services USING GIN (search_vector);

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validate category/subcategory hierarchy & provider_types on public.services
CREATE OR REPLACE FUNCTION public.enforce_service_hierarchy_and_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat_parent UUID;
  v_cat_deleted TIMESTAMPTZ;
  v_sub_parent UUID;
  v_sub_deleted TIMESTAMPTZ;
  v_ptype TEXT;
BEGIN
  NEW.name := trim(NEW.name);
  NEW.slug := lower(trim(NEW.slug));
  NEW.service_code := upper(trim(NEW.service_code));

  SELECT parent_id, deleted_at
  INTO v_cat_parent, v_cat_deleted
  FROM public.service_categories
  WHERE id = NEW.category_id;

  IF NOT FOUND OR v_cat_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'HIERARCHY_ERROR: Active main category % does not exist.', NEW.category_id;
  END IF;

  IF v_cat_parent IS NOT NULL THEN
    RAISE EXCEPTION 'HIERARCHY_ERROR: services.category_id (%) must reference a top-level main category (parent_id IS NULL).', NEW.category_id;
  END IF;

  IF NEW.subcategory_id IS NOT NULL THEN
    IF NEW.subcategory_id = NEW.category_id THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: subcategory_id cannot equal category_id.';
    END IF;

    SELECT parent_id, deleted_at
    INTO v_sub_parent, v_sub_deleted
    FROM public.service_categories
    WHERE id = NEW.subcategory_id;

    IF NOT FOUND OR v_sub_deleted IS NOT NULL THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: Active subcategory % does not exist.', NEW.subcategory_id;
    END IF;

    IF v_sub_parent IS DISTINCT FROM NEW.category_id THEN
      RAISE EXCEPTION 'HIERARCHY_ERROR: Subcategory % belongs to parent %, not category %.', NEW.subcategory_id, v_sub_parent, NEW.category_id;
    END IF;
  END IF;

  -- Ensure every eligible_provider_type value matches allowed professional_profiles.provider_type values
  FOREACH v_ptype IN ARRAY NEW.eligible_provider_types LOOP
    IF v_ptype NOT IN ('trade_technician', 'dispatch_rider', 'property_agent', 'general_artisan') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Unsupported eligible_provider_types entry "%".', v_ptype;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_hierarchy_and_eligibility ON public.services;
CREATE TRIGGER trg_services_hierarchy_and_eligibility
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_hierarchy_and_eligibility();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_read_active_or_admin" ON public.services;
CREATE POLICY "services_read_active_or_admin"
  ON public.services
  FOR SELECT
  USING ((is_active = true AND deleted_at IS NULL) OR public.is_admin());

DROP POLICY IF EXISTS "services_admin_write" ON public.services;
CREATE POLICY "services_admin_write"
  ON public.services
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Create public.service_requirements (Configurable Per-Service Rules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL CHECK (char_length(trim(requirement_key)) >= 2),
  requirement_type TEXT NOT NULL CHECK (
    requirement_type IN (
      'customer_input',
      'photo_evidence',
      'site_access',
      'provider_credential',
      'safety_compliance',
      'equipment_or_tools',
      'inspection'
    )
  ),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT NOT NULL DEFAULT 'both' CHECK (applies_to IN ('customer', 'professional', 'both')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT service_requirements_unique_key UNIQUE (service_id, requirement_key)
);

CREATE INDEX IF NOT EXISTS idx_service_requirements_lookup
  ON public.service_requirements (service_id, display_order)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE TRIGGER trg_service_requirements_updated_at
  BEFORE UPDATE ON public.service_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.service_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_requirements_read_active_or_admin" ON public.service_requirements;
CREATE POLICY "service_requirements_read_active_or_admin"
  ON public.service_requirements
  FOR SELECT
  USING (
    (
      is_active = true
      AND deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.services s
        WHERE s.id = service_requirements.service_id
          AND s.is_active = true
          AND s.deleted_at IS NULL
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "service_requirements_admin_write" ON public.service_requirements;
CREATE POLICY "service_requirements_admin_write"
  ON public.service_requirements
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Non-Breaking Bridge Columns on Existing Marketplace Tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.professional_services
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_services_pro_catalogue_service
  ON public.professional_services (professional_id, service_id)
  WHERE service_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pro_services_service_id
  ON public.professional_services (service_id)
  WHERE service_id IS NOT NULL AND is_active = true AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_professional_service_catalogue_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_srv RECORD;
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    SELECT id, category_id, subcategory_id, name, deleted_at
    INTO v_srv
    FROM public.services
    WHERE id = NEW.service_id;

    IF NOT FOUND OR v_srv.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Referenced catalogue service % does not exist.', NEW.service_id;
    END IF;

    -- Keep category_id aligned to either the service's main category or its subcategory
    IF NEW.category_id IS DISTINCT FROM v_srv.category_id
       AND (v_srv.subcategory_id IS NULL OR NEW.category_id IS DISTINCT FROM v_srv.subcategory_id) THEN
      NEW.category_id := COALESCE(v_srv.subcategory_id, v_srv.category_id);
    END IF;

    IF NEW.service_title IS NULL OR char_length(trim(NEW.service_title)) = 0 THEN
      NEW.service_title := v_srv.name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_professional_services_catalogue_ref ON public.professional_services;
CREATE TRIGGER trg_professional_services_catalogue_ref
  BEFORE INSERT OR UPDATE ON public.professional_services
  FOR EACH ROW EXECUTE FUNCTION public.sync_professional_service_catalogue_ref();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_bookings_service_id
  ON public.bookings (service_id)
  WHERE service_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_subcategory_id
  ON public.bookings (subcategory_id)
  WHERE subcategory_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_service_id
  ON public.maintenance_requests (service_id)
  WHERE service_id IS NOT NULL;

ALTER TABLE public.maintenance_schedules
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT;

ALTER TABLE public.commission_settings
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT;

DROP INDEX IF EXISTS public.idx_commission_settings_one_active_per_scope;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_settings_one_active_per_scope
  ON public.commission_settings (
    COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(city, '__GLOBAL__')
  )
  WHERE is_active = true AND effective_to IS NULL;

DROP FUNCTION IF EXISTS public.admin_set_commission_setting(uuid, text, integer, integer, boolean);
CREATE OR REPLACE FUNCTION public.admin_set_commission_setting(
  p_category_id uuid DEFAULT NULL::uuid,
  p_city text DEFAULT NULL::text,
  p_commission_bps integer DEFAULT 1000,
  p_flat_fee_kobo integer DEFAULT 0,
  p_is_active boolean DEFAULT true,
  p_service_id uuid DEFAULT NULL::uuid
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

  IF p_is_active THEN
    UPDATE public.commission_settings
    SET is_active = false,
        effective_to = COALESCE(effective_to, now()),
        updated_at = now()
    WHERE category_id IS NOT DISTINCT FROM p_category_id
      AND service_id IS NOT DISTINCT FROM p_service_id
      AND city IS NOT DISTINCT FROM p_city
      AND is_active = true
      AND effective_to IS NULL;
  END IF;

  INSERT INTO public.commission_settings (
    category_id,
    service_id,
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
    p_service_id,
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
      'service_id', p_service_id,
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
-- 5. Storage Bucket for Public Catalogue Assets (Category & Service Images)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'catalogue-assets',
      'catalogue-assets',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
    )
    ON CONFLICT (id) DO UPDATE
    SET public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[];
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "easylife_catalogue_assets_public_read" ON storage.objects;
    CREATE POLICY "easylife_catalogue_assets_public_read"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'catalogue-assets');

    DROP POLICY IF EXISTS "easylife_catalogue_assets_admin_insert" ON storage.objects;
    CREATE POLICY "easylife_catalogue_assets_admin_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'catalogue-assets' AND public.is_admin());

    DROP POLICY IF EXISTS "easylife_catalogue_assets_admin_update" ON storage.objects;
    CREATE POLICY "easylife_catalogue_assets_admin_update"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'catalogue-assets' AND public.is_admin())
      WITH CHECK (bucket_id = 'catalogue-assets' AND public.is_admin());

    DROP POLICY IF EXISTS "easylife_catalogue_assets_admin_delete" ON storage.objects;
    CREATE POLICY "easylife_catalogue_assets_admin_delete"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'catalogue-assets' AND public.is_admin());
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping catalogue-assets storage policy updates due to insufficient privileges in current role.';
END $$;

-- -----------------------------------------------------------------------------
-- 6. Enrich Existing Main Categories & Seed Tier-2 Subcategories
-- -----------------------------------------------------------------------------
UPDATE public.service_categories SET
  image_url = '/categories/plumbing-services.png',
  keywords = ARRAY['plumbing', 'plumber', 'borehole', 'overhead tank', 'pipe leak', 'water heater', 'drainage', 'sanitary'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000001';

UPDATE public.service_categories SET
  image_url = '/categories/electrical-services.png',
  keywords = ARRAY['electrical', 'electrician', 'inverter', 'solar', 'distribution board', 'changeover', 'wiring', 'surge'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000002';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['hvac', 'air conditioning', 'split ac', 'standing ac', 'chiller', 'refrigerant', 'compressor'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000003';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['generator', 'mikano', 'diesel', 'petrol', 'ats', 'avr', 'alternator', 'power plant'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000004';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['carpentry', 'doors', 'locks', 'security door', 'cabinetry', 'furniture', 'hinges'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000005';

UPDATE public.service_categories SET
  image_url = '/categories/cleaning-services.png',
  keywords = ARRAY['cleaning', 'deep clean', 'fumigation', 'post-construction', 'janitorial', 'pest control'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000006';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['painting', 'pop ceiling', 'screeding', 'damp treatment', 'wall finish'],
  is_featured = false, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000007';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['appliance repair', 'fridge', 'freezer', 'washing machine', 'microwave', 'oven'],
  is_featured = false, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000008';

UPDATE public.service_categories SET
  image_url = '/categories/cleaning-services.png',
  keywords = ARRAY['pest control', 'fumigation', 'termites', 'rodents', 'bedbugs', 'cockroaches'],
  is_featured = false, is_popular = true, show_on_homepage = false, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000009';

UPDATE public.service_categories SET
  image_url = '/categories/electrical-services.png',
  keywords = ARRAY['solar', 'solar panel', 'mppt', 'lithium battery', 'hybrid inverter', 'photovoltaic'],
  is_featured = true, is_popular = true, show_on_homepage = false, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000010';

UPDATE public.service_categories SET
  image_url = '/categories/home-repairs.png',
  keywords = ARRAY['tiling', 'porcelain', 'ceramic', 'granite', 'marble polishing', 'floor installation'],
  is_featured = false, is_popular = false, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000011';

UPDATE public.service_categories SET
  image_url = '/categories/automotive-services.png',
  keywords = ARRAY['auto electrical', 'obd scan', 'car battery', 'alternator', 'starter', 'car ac'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000012';

UPDATE public.service_categories SET
  image_url = '/categories/moving-relocation.png',
  keywords = ARRAY['moving', 'relocation', 'haulage', 'packing', 'apartment move', 'office move'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000013';

UPDATE public.service_categories SET
  image_url = '/categories/cleaning-services.png',
  keywords = ARRAY['laundry', 'dry cleaning', 'steam press', 'curtain wash', 'stain removal'],
  is_featured = false, is_popular = false, show_on_homepage = false, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000014';

UPDATE public.service_categories SET
  image_url = '/categories/beauty-personal-care.png',
  keywords = ARRAY['beauty', 'barber', 'hair braiding', 'makeup', 'bridal', 'grooming', 'nails'],
  is_featured = true, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000015';

UPDATE public.service_categories SET
  image_url = '/categories/professional-business.png',
  keywords = ARRAY['event planning', 'decoration', 'sound engineering', 'catering', 'corporate event'],
  is_featured = false, is_popular = false, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000016';

UPDATE public.service_categories SET
  image_url = '/categories/professional-business.png',
  keywords = ARRAY['everyday tasks', 'errands', 'furniture assembly', 'handyman', 'general help'],
  is_featured = false, is_popular = true, show_on_homepage = true, updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000017';

-- Seed structured Subcategories across all Main Categories (preserving ...0009 and ...0010)
INSERT INTO public.service_categories (
  id, parent_id, name, slug, description, icon_name, default_commission_bps,
  is_active, display_order, keywords, is_featured, is_popular, show_on_homepage
) VALUES
  ('10000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', 'Pipe Leaks & Sanitary Fittings', 'pipe-leaks-sanitary-fittings', 'Sink mixers, WC cisterns, PPR pipe leaks, shower sets, and bathroom/kitchen fittings.', 'wrench', 1000, true, 1, ARRAY['pipe leak', 'wc cistern', 'sink', 'mixer tap'], true, true, false),
  ('10000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', 'Borehole, Pumping & Water Storage', 'borehole-pumping-water-storage', 'Submersible pumps, pressure tanks, overhead tank scaffolds, and level switches.', 'droplets', 1000, true, 2, ARRAY['borehole', 'submersible pump', 'overhead tank', 'manifold'], true, true, false),
  ('10000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000001', 'Drainage & Water Heater Systems', 'drainage-water-heater-systems', 'Blocked drain clearing, grease traps, septic line rodding, and electric water heaters.', 'flame', 1000, true, 3, ARRAY['drain', 'sewage', 'water heater', 'blocked sink'], false, false, false),

  ('10000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000002', 'House Wiring & Distribution Boards', 'house-wiring-distribution-boards', 'Conduit wiring, 3-phase balancing, breakers, earthing pits, and socket circuits.', 'zap', 1000, true, 2, ARRAY['db', 'distribution box', 'wiring', 'breaker', 'earthing'], true, true, false),
  ('10000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000002', 'Inverters, Backup & Surge Protection', 'inverters-backup-surge-protection', 'Phase-failure protectors, AVS units, inverter banks, and automatic changeover setups.', 'battery-charging', 1000, true, 3, ARRAY['inverter', 'surge protector', 'phase failure', 'changeover'], true, true, false),

  ('10000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000003', 'Split & Window AC Servicing', 'split-window-ac-servicing', 'Chemical coil washing, refrigerant top-ups, outdoor brackets, and drain line clearing.', 'wind', 1000, true, 1, ARRAY['split ac', 'coil wash', 'freon', 'r410a', 'gas top-up'], true, true, false),
  ('10000000-0000-4000-8000-000000000107', '10000000-0000-4000-8000-000000000003', 'Commercial HVAC & Chiller Systems', 'commercial-hvac-chiller-systems', 'Standing package units, VRF/VRV servicing, compressor overhauls, and ducted HVAC.', 'snowflake', 1000, true, 2, ARRAY['chiller', 'standing ac', 'compressor', 'commercial hvac'], true, false, false),

  ('10000000-0000-4000-8000-000000000108', '10000000-0000-4000-8000-000000000004', 'Petrol & Diesel Generator Servicing', 'petrol-diesel-generator-servicing', 'Oil/filter changes, injector cleaning, valve lash tuning, and starter repairs.', 'settings', 1000, true, 1, ARRAY['generator service', 'diesel', 'mikano', 'oil filter'], true, true, false),
  ('10000000-0000-4000-8000-000000000109', '10000000-0000-4000-8000-000000000004', 'ATS Panels & Alternator Overhaul', 'ats-panels-alternator-overhaul', 'Automatic Transfer Switch (ATS) wiring, AVR calibration, and alternator rewinding.', 'cpu', 1000, true, 2, ARRAY['ats', 'avr', 'alternator', 'changeover panel'], false, true, false),

  ('10000000-0000-4000-8000-000000000110', '10000000-0000-4000-8000-000000000005', 'Security Doors & Locksmithing', 'security-doors-locksmithing', 'Armoured door hanging, mortise cylinders, smart locks, and hinge alignment.', 'lock', 1000, true, 1, ARRAY['security door', 'locksmith', 'smart lock', 'hinges'], true, false, false),
  ('10000000-0000-4000-8000-000000000111', '10000000-0000-4000-8000-000000000005', 'Custom Cabinetry & Furniture Works', 'custom-cabinetry-furniture-works', 'Kitchen cabinets, wardrobe carpentry, shelf mounting, and wooden frame repair.', 'hammer', 1000, true, 2, ARRAY['cabinet', 'wardrobe', 'furniture repair', 'woodwork'], false, true, false),

  ('10000000-0000-4000-8000-000000000112', '10000000-0000-4000-8000-000000000006', 'Residential & Post-Construction Cleaning', 'residential-post-construction-cleaning', 'Move-in/out deep cleaning, cement splatter removal, kitchen degreasing, and bathroom scrub.', 'sparkles', 1000, true, 2, ARRAY['deep cleaning', 'post-construction', 'move-in clean'], true, true, false),
  ('10000000-0000-4000-8000-000000000113', '10000000-0000-4000-8000-000000000006', 'Commercial Janitorial & Upholstery Care', 'commercial-janitorial-upholstery-care', 'Office contract janitorial, sofa steam extraction, and mattress sanitisation.', 'building', 1000, true, 3, ARRAY['office cleaning', 'sofa steam', 'upholstery', 'mattress'], false, true, false),

  ('10000000-0000-4000-8000-000000000114', '10000000-0000-4000-8000-000000000007', 'Interior & Exterior Painting', 'interior-exterior-painting', 'Emulsion, satin, silk, and weather-shield exterior building painting.', 'paintbrush', 1000, true, 1, ARRAY['interior painting', 'exterior painting', 'satin', 'emulsion'], false, true, false),
  ('10000000-0000-4000-8000-000000000115', '10000000-0000-4000-8000-000000000007', 'POP Ceilings, Screeding & Damp Treatment', 'pop-ceilings-screeding-damp-treatment', 'POP acoustic/gypsum repairs, wall putty screeding, and rising-damp waterproofing.', 'layers', 1000, true, 2, ARRAY['pop ceiling', 'screeding', 'damp proofing'], false, false, false),

  ('10000000-0000-4000-8000-000000000116', '10000000-0000-4000-8000-000000000008', 'Cooling & Laundry Appliances', 'cooling-laundry-appliances', 'Front/top-load washing machines, chest freezers, frost-free fridges, and dryers.', 'cpu', 1000, true, 1, ARRAY['washing machine', 'freezer', 'refrigerator'], true, true, false),
  ('10000000-0000-4000-8000-000000000117', '10000000-0000-4000-8000-000000000008', 'Kitchen & Small Domestic Appliances', 'kitchen-small-domestic-appliances', 'Gas/electric cookers, built-in ovens, extractors, microwaves, and water dispensers.', 'utensils', 1000, true, 2, ARRAY['microwave', 'oven', 'gas cooker', 'water dispenser'], false, false, false),

  ('10000000-0000-4000-8000-000000000118', '10000000-0000-4000-8000-000000000011', 'Ceramic, Porcelain & Granite Tiling', 'ceramic-porcelain-granite-tiling', 'Floor/wall tile installation, cracked tile replacement, regrouting, and marble polishing.', 'grid', 1000, true, 1, ARRAY['tiles', 'porcelain', 'granite', 'regrouting'], false, false, false),

  ('10000000-0000-4000-8000-000000000119', '10000000-0000-4000-8000-000000000012', 'Computerized OBD Diagnostics & Battery', 'computerized-obd-diagnostics-battery', 'On-site OBD-II engine fault scanning, battery testing, and parasitic drain checks.', 'car', 1000, true, 1, ARRAY['obd', 'car scan', 'battery', 'diagnostics'], true, true, false),
  ('10000000-0000-4000-8000-000000000120', '10000000-0000-4000-8000-000000000012', 'Alternators, Starters & Auto AC', 'alternators-starters-auto-ac', 'Starter motor solenoid replacement, alternator rebuilds, and auto AC cooling.', 'wrench', 1000, true, 2, ARRAY['alternator', 'starter', 'car ac', 'rewire'], false, false, false),

  ('10000000-0000-4000-8000-000000000121', '10000000-0000-4000-8000-000000000013', 'Home & Office Moving Crew', 'home-office-moving-crew', 'Bubble-wrap packing, furniture disassembly, enclosed truck loading, and relocation.', 'truck', 1000, true, 1, ARRAY['apartment move', 'office move', 'packing', 'haulage'], true, true, false),

  ('10000000-0000-4000-8000-000000000122', '10000000-0000-4000-8000-000000000014', 'Garment Pickup, Wash & Dry Cleaning', 'garment-pickup-wash-dry-cleaning', 'Suits, traditional attire, curtains, bedding, and stain-treated express pressing.', 'shirt', 1000, true, 1, ARRAY['dry cleaning', 'laundry', 'suits', 'curtains'], false, false, false),

  ('10000000-0000-4000-8000-000000000123', '10000000-0000-4000-8000-000000000015', 'Mobile Barbering, Hair & Styling', 'mobile-barbering-hair-styling', 'Home-visit executive haircuts, knotless braids, wig installations, and blowouts.', 'scissors', 1000, true, 1, ARRAY['mobile barber', 'hair braiding', 'wig install'], true, true, false),
  ('10000000-0000-4000-8000-000000000124', '10000000-0000-4000-8000-000000000015', 'Bridal Makeup & Personal Aesthetics', 'bridal-makeup-personal-aesthetics', 'Event/bridal glam makeup, manicure/pedicure home spa, and skincare prep.', 'sparkles', 1000, true, 2, ARRAY['bridal makeup', 'glam', 'nails', 'home spa'], false, true, false),

  ('10000000-0000-4000-8000-000000000125', '10000000-0000-4000-8000-000000000016', 'Event Setup, Sound & Catering Coordination', 'event-setup-sound-catering', 'Corporate & private event rigging, PA sound systems, lighting, and venue setup.', 'calendar', 1000, true, 1, ARRAY['pa system', 'event decor', 'corporate event'], false, false, false),

  ('10000000-0000-4000-8000-000000000126', '10000000-0000-4000-8000-000000000017', 'Errands, Assembly & General Assistance', 'errands-assembly-general-assistance', 'Flat-pack furniture assembly, TV wall mounting, market runs, and parcel errands.', 'check-circle', 1000, true, 1, ARRAY['tv mount', 'assembly', 'errand', 'handyman'], false, true, false)
ON CONFLICT (id) DO UPDATE
SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  keywords = EXCLUDED.keywords,
  is_featured = EXCLUDED.is_featured,
  is_popular = EXCLUDED.is_popular,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 7. Seed Canonical Individual Services (Including Legacy Matched Titles)
--    & Backfill professional_services.service_id Safely
-- -----------------------------------------------------------------------------
INSERT INTO public.services (
  id, category_id, subcategory_id, service_code, name, slug,
  short_description, description, icon_name, keywords,
  display_order, is_active, is_featured, is_popular, show_on_homepage,
  base_price_min_kobo, base_price_max_kobo, estimated_duration_minutes,
  requires_verified_identity, requires_trade_certification, requires_business_registration,
  requires_site_inspection, min_years_experience, eligible_provider_types, required_document_types
) VALUES
  -- Plumbing & Water Systems
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000102',
    'PLM-TNK-001',
    'Overhead Tank Scaffold & Pipe Manifold Plumbing',
    'overhead-tank-scaffold-pipe-manifold-plumbing',
    'Elevated tank mounting, manifold check valves, tank level switches, and non-return piping.',
    'Complete overhead water storage plumbing including scaffold pipework, multi-outlet distribution manifolds, pressure relief lines, and automated tank level valve installation.',
    'droplets',
    ARRAY['overhead tank', 'manifold', 'scaffold', 'level switch', 'check valve'],
    1, true, true, true, true,
    1800000, 6500000, 240,
    true, false, false, true, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000102',
    'PLM-BHP-002',
    'Submersible Borehole Pump & Pressure Tank Repair',
    'submersible-borehole-pump-pressure-tank-repair',
    'Pump extraction, control box rewiring, pressure switch calibration, and tank bladder service.',
    'Specialist diagnostics, extraction, and replacement for residential and commercial submersible borehole pumps, control boxes, booster pumps, and pressure vessels.',
    'wrench',
    ARRAY['borehole', 'submersible pump', 'booster pump', 'pressure tank', 'control box'],
    2, true, true, true, true,
    2500000, 9500000, 300,
    true, true, false, true, 3,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000101',
    'PLM-LEK-003',
    'Pipe Leak Tracing & Sink Mixer Replacement',
    'pipe-leak-tracing-sink-mixer-replacement',
    'PPR/PVC joint sealing, kitchen/bath mixer replacement, and WC flush mechanism repairs.',
    'Rapid detection and permanent repair of concealed or exposed wall/floor pipe leaks, kitchen sink traps, angle valves, and toilet flush cisterns.',
    'wrench',
    ARRAY['pipe leak', 'sink tap', 'mixer', 'wc cistern', 'toilet leak'],
    1, true, false, true, false,
    800000, 3000000, 120,
    true, false, false, false, 1,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000103',
    'PLM-DRN-004',
    'Water Heater Installation & Blocked Drain Clearing',
    'water-heater-installation-blocked-drain-clearing',
    'Ariston-style storage water heater installation and pressurised kitchen/bath drain unblocking.',
    'Safe mounting, thermostat check, and non-return valve installation for electric water heaters alongside mechanical drain clearing.',
    'flame',
    ARRAY['water heater', 'blocked drain', 'ariston', 'thermostat'],
    1, true, false, false, false,
    1000000, 3500000, 150,
    true, false, false, false, 1,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Electrical & Power Backup (including Solar Installation subcategory)
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000010',
    'ELC-SOL-001',
    'Hybrid Solar Panel Array & Inverter Setup',
    'hybrid-solar-panel-array-inverter-setup',
    'Roof rail mounting, MPPT/hybrid inverter wiring, lithium battery bank, and DC surge protection.',
    'End-to-end solar photovoltaic and hybrid inverter system installation with DC isolators, surge arrestors, battery management setup, and load segmentation.',
    'sun',
    ARRAY['hybrid inverter', 'solar panel', 'lithium battery', 'mppt', 'pv array'],
    1, true, true, true, true,
    2500000, 15000000, 480,
    true, true, false, true, 3,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000104',
    'ELC-DBW-002',
    'Full Distribution Box & House Wiring',
    'full-distribution-box-house-wiring',
    '3-phase DB dressing, RCBO safety breakers, conduit rewiring, and earthing continuity testing.',
    'Certified distribution board replacement, circuit labelling, earth-leakage protection, and full apartment or office conduit electrical wiring.',
    'zap',
    ARRAY['distribution box', 'house wiring', 'breakers', '3-phase', 'earthing'],
    1, true, true, true, true,
    1500000, 8500000, 360,
    true, true, false, true, 3,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000105',
    'ELC-SRG-003',
    'Dedicated AC Surge & Phase-Failure Protector Fitting',
    'dedicated-ac-surge-phase-failure-protector-fitting',
    'Voltage monitoring relays, AVS 30A protectors, and dedicated AC isolator circuits.',
    'Precision installation of industrial phase-failure relays, surge protection devices, and voltage stabiliser bypass switches for sensitive HVAC and home equipment.',
    'shield',
    ARRAY['surge protector', 'phase failure', 'avs', 'voltage guard', 'isolator'],
    1, true, true, true, false,
    1200000, 2800000, 120,
    true, true, false, false, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000105',
    'ELC-FLT-004',
    'Electrical Fault Tracing & Socket Repair',
    'electrical-fault-tracing-socket-repair',
    'Short-circuit diagnostics, burnt changeover repair, and wall switch/socket replacement.',
    'Prompt electrical troubleshooting for tripping breakers, partial phase blackouts, overheating sockets, and lighting circuit faults.',
    'zap',
    ARRAY['short circuit', 'tripping breaker', 'socket repair', 'fault tracing'],
    2, true, false, true, false,
    700000, 2500000, 90,
    true, false, false, false, 1,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- HVAC & Air Conditioning
  (
    '20000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000106',
    'HVC-SPL-001',
    'Split AC Chemical Coil Washing & Gas Top-up',
    'split-ac-chemical-coil-washing-gas-top-up',
    'High-pressure condenser/evaporator wash, drain flushing, and R410a/R32 gas balancing.',
    'Thorough split unit chemical wash using splash-proof catch bags, copper flare leak testing, fin combing, and refrigerant pressure top-up.',
    'wind',
    ARRAY['split ac', 'coil washing', 'r410a', 'gas top-up', 'ac servicing'],
    1, true, true, true, true,
    1800000, 3500000, 120,
    true, false, false, false, 1,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000107',
    'HVC-CHL-002',
    'Commercial Chiller & Standing AC Compressor Service',
    'commercial-chiller-standing-ac-compressor-service',
    'Floor-standing & package chiller maintenance, compressor capacitor/overload & contactor checks.',
    'Commercial HVAC preventative maintenance and breakdown recovery for standing 2HP-5HP units, ducted split systems, and rooftop chillers.',
    'snowflake',
    ARRAY['commercial chiller', 'standing ac', 'compressor', 'hvac maintenance'],
    1, true, true, true, false,
    3500000, 12000000, 240,
    true, true, true, true, 3,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate', 'cac_certificate']::public.document_type[]
  ),

  -- Generator Maintenance
  (
    '20000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000109',
    'GEN-ATS-001',
    'Automatic Transfer Switch (ATS) & Generator Link',
    'automatic-transfer-switch-ats-generator-link',
    'Contactor interlocking, timer relay wiring, and remote start signal integration.',
    'Safe design, mounting, and commissioning of automated generator-to-mains transfer panels with mechanical interlocks and voltage sensing.',
    'cpu',
    ARRAY['ats', 'transfer switch', 'generator link', 'interlock', 'contactor'],
    1, true, true, true, true,
    1800000, 6000000, 240,
    true, true, false, true, 3,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000108',
    'GEN-SRV-002',
    'Diesel & Petrol Generator Preventive Servicing',
    'diesel-petrol-generator-preventive-servicing',
    'Engine oil, fuel/oil/air filter replacement, radiator flush, and AVR output check.',
    'Scheduled generator servicing covering lubrication oil swap, primary/secondary fuel filter bleed, belt tensioning, and frequency/voltage load verification.',
    'settings',
    ARRAY['generator servicing', 'oil change', 'diesel generator', 'mikano'],
    1, true, false, true, false,
    1200000, 4500000, 120,
    true, false, false, false, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Carpentry, Doors & Locks
  (
    '20000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000110',
    'CRP-LCK-001',
    'Security Door Alignment & Smart Lock Fitting',
    'security-door-alignment-smart-lock-fitting',
    'Armoured door hinge re-anchoring, euro-cylinder swaps, and biometric/keypad lock fitting.',
    'Precision mortising, frame reinforcement, and multi-point cylinder or smart lock installation for residential and office security doors.',
    'lock',
    ARRAY['security door', 'smart lock', 'locksmith', 'cylinder'],
    1, true, true, true, false,
    1200000, 4000000, 150,
    true, false, false, false, 2,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000111',
    'CRP-CAB-002',
    'Kitchen Cabinet Hinges & Wardrobe Repair',
    'kitchen-cabinet-hinges-wardrobe-repair',
    'Hydraulic soft-close hinges, drawer runners, laminated edge repair, and shelf installation.',
    'Restore sagging kitchen cabinets, sliding wardrobe tracks, broken drawer channels, and custom wall shelving.',
    'hammer',
    ARRAY['kitchen cabinet', 'wardrobe', 'hinges', 'carpenter'],
    1, true, false, true, false,
    1000000, 3500000, 180,
    true, false, false, false, 1,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Cleaning & Fumigation (including Pest Control subcategory)
  (
    '20000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000112',
    'CLN-DEP-001',
    'Apartment Deep Cleaning & Move-In Sanitisation',
    'apartment-deep-cleaning-move-in-sanitisation',
    'Top-to-bottom kitchen degreasing, bathroom descaling, window tracks, and floor scrubbing.',
    'Comprehensive multi-room deep clean for apartments and duplexes before move-in or quarterly hygiene refresh.',
    'sparkles',
    ARRAY['deep cleaning', 'move-in clean', 'sanitisation', 'house cleaning'],
    1, true, true, true, true,
    2500000, 8500000, 360,
    true, false, false, false, 1,
    ARRAY['general_artisan', 'trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000016',
    '10000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000009',
    'CLN-PST-002',
    'Full Premises Fumigation & Termite Barrier Treatment',
    'full-premises-fumigation-termite-barrier-treatment',
    'Eco-certified residual spraying, gel baiting, and perimeter termite soil/wood treatment.',
    'Targeted indoor and perimeter pest control against cockroaches, rodents, bedbugs, mosquitoes, and subterranean termites with safety re-entry guidelines.',
    'shield',
    ARRAY['fumigation', 'pest control', 'termites', 'bedbugs', 'rodents'],
    1, true, true, true, true,
    2000000, 7500000, 180,
    true, true, true, true, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate', 'cac_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000017',
    '10000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000113',
    'CLN-UPH-003',
    'Sofa, Carpet & Mattress Steam Extraction',
    'sofa-carpet-mattress-steam-extraction',
    'Hot-water fabric extraction, odour neutralisation, and dust-mite removal.',
    'Deep upholstery wet-extraction cleaning for sectional sofas, office chairs, rugs, and mattresses.',
    'sparkles',
    ARRAY['sofa cleaning', 'carpet', 'mattress', 'steam extraction'],
    1, true, false, true, false,
    1500000, 4500000, 150,
    true, false, false, false, 1,
    ARRAY['general_artisan', 'trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Painting & Wall Finishing
  (
    '20000000-0000-4000-8000-000000000018',
    '10000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000114',
    'PNT-INT-001',
    'Interior Room Emulsion & Satin Repainting',
    'interior-room-emulsion-satin-repainting',
    'Masking, hairline crack filling, primer undercoat, and 2-coat low-VOC interior finish.',
    'Clean interior repainting for apartments and offices with floor masking, minor wall patching, and crisp cut-lines.',
    'paintbrush',
    ARRAY['interior painting', 'satin', 'emulsion', 'wall repaint'],
    1, true, false, true, false,
    2500000, 12000000, 480,
    true, false, false, true, 1,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000019',
    '10000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000115',
    'PNT-POP-002',
    'POP Ceiling Patchwork & Rising Damp Proofing',
    'pop-ceiling-patchwork-rising-damp-proofing',
    'Water-damaged POP ceiling restoration, anti-damp membrane coat, and smooth wall screeding.',
    'Repair sagging or stained POP plaster ceilings after roof/pipe leaks, scrape peeling paint, and apply moisture-blocking primer.',
    'layers',
    ARRAY['pop ceiling', 'damp treatment', 'screeding', 'plaster'],
    1, true, false, false, false,
    3000000, 14000000, 480,
    true, false, false, true, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Appliance Repair
  (
    '20000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000116',
    'APL-WSH-001',
    'Washing Machine & Refrigerator Diagnostics & Repair',
    'washing-machine-refrigerator-diagnostics-repair',
    'Drain pump, PCB error code, compressor relay, thermostat, and door seal repairs.',
    'On-site diagnostics and repair for inverter/standard washing machines, double-door refrigerators, and deep freezers.',
    'cpu',
    ARRAY['washing machine', 'fridge', 'freezer', 'pcb', 'thermostat'],
    1, true, true, true, false,
    1200000, 4800000, 120,
    true, true, false, false, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000021',
    '10000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000117',
    'APL-OVN-002',
    'Cooker Hob, Oven & Microwave Element Servicing',
    'cooker-hob-oven-microwave-element-servicing',
    'Auto-ignition switches, oven heating coils, magnetron checks, and gas leak testing.',
    'Safe servicing of built-in gas/electric hobs, commercial ovens, and countertop microwaves.',
    'utensils',
    ARRAY['gas cooker', 'oven', 'microwave', 'heating element'],
    1, true, false, false, false,
    1000000, 3200000, 90,
    true, false, false, false, 1,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Tiling & Floor Installation
  (
    '20000000-0000-4000-8000-000000000022',
    '10000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000118',
    'TIL-FLR-001',
    'Popped Floor Tile Replacement & Bathroom Regrouting',
    'popped-floor-tile-replacement-bathroom-regrouting',
    'Careful cracked/popped tile removal, adhesive bed reset, and waterproof epoxy grouting.',
    'Restore tented, cracked, or hollow floor tiles and renew mould-stained bathroom grout without breaking surrounding slabs.',
    'grid',
    ARRAY['tiling', 'popped tiles', 'regrouting', 'epoxy grout'],
    1, true, false, false, false,
    1500000, 6500000, 240,
    true, false, false, true, 2,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Auto Electrical Services
  (
    '20000000-0000-4000-8000-000000000023',
    '10000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000119',
    'AUT-OBD-001',
    'Mobile OBD-II Computerised Car Diagnostics & Battery Test',
    'mobile-obd-ii-computerised-car-diagnostics-battery-test',
    'Home/office check-engine fault scanning, ABS/airbag code reset, and alternator charge test.',
    'On-location full ECU diagnostic scan, live sensor check, battery CCA load test, and starter relay troubleshooting for sedans and SUVs.',
    'car',
    ARRAY['obd scan', 'check engine', 'car battery', 'ecu diagnostics'],
    1, true, true, true, true,
    1200000, 3500000, 90,
    true, true, false, false, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin', 'trade_certificate']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000024',
    '10000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000120',
    'AUT-ALT-002',
    'Starter Motor, Alternator & Car AC Electrical Repair',
    'starter-motor-alternator-car-ac-electrical-repair',
    'Alternator brush/diode pack, starter solenoid, cooling fan wiring, and auto AC blower.',
    'Repair non-cranking starters, undercharging alternators, and vehicle air-conditioning compressor clutch electrical faults.',
    'wrench',
    ARRAY['alternator', 'starter motor', 'car ac', 'auto rewire'],
    1, true, false, false, false,
    1500000, 5500000, 150,
    true, false, false, false, 2,
    ARRAY['trade_technician']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Moving & Relocation Services
  (
    '20000000-0000-4000-8000-000000000025',
    '10000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000121',
    'MOV-APT-001',
    'Residential Apartment Packing & City Moving',
    'residential-apartment-packing-city-moving',
    'Protective wrapping, bed/wardrobe disassembly, loading crew, and enclosed van transport.',
    'Full-service residential relocation within Port Harcourt, Lagos, or Abuja with padded blankets, straps, and trained movers.',
    'truck',
    ARRAY['house moving', 'packing', 'relocation', 'haulage'],
    1, true, true, true, true,
    5500000, 28000000, 480,
    true, false, false, false, 1,
    ARRAY['general_artisan', 'trade_technician', 'property_agent']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Laundry & Dry Cleaning
  (
    '20000000-0000-4000-8000-000000000026',
    '10000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000122',
    'LND-DRY-001',
    'Doorstep Laundry Bundle, Suit Dry Clean & Steam Press',
    'doorstep-laundry-bundle-suit-dry-clean-steam-press',
    'Scheduled pickup & return for formal wear, duvets, curtains, and weekly household laundry.',
    'Hygienic wash, spot-stain treatment, suit dry-cleaning, and crisp steam pressing with doorstep collection and delivery.',
    'shirt',
    ARRAY['dry cleaning', 'laundry pickup', 'suit press', 'duvet wash'],
    1, true, false, true, false,
    800000, 3000000, 1440,
    true, false, false, false, 0,
    ARRAY['general_artisan', 'dispatch_rider']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Beauty & Personal Care
  (
    '20000000-0000-4000-8000-000000000027',
    '10000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000123',
    'BTY-BRB-001',
    'Executive Home-Visit Haircut, Beard & Hair Styling',
    'executive-home-visit-haircut-beard-hair-styling',
    'Sanitised cordless clippers, crisp fades, beard grooming, or knotless braiding at home.',
    'Private, hygienic home grooming and hair styling sessions by vetted mobile barbers and hair stylists.',
    'scissors',
    ARRAY['home barber', 'haircut', 'braids', 'hair stylist'],
    1, true, true, true, true,
    800000, 3500000, 90,
    true, false, false, false, 1,
    ARRAY['general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),
  (
    '20000000-0000-4000-8000-000000000028',
    '10000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000124',
    'BTY-MKP-002',
    'Bridal & Event Glam Makeup Session',
    'bridal-event-glam-makeup-session',
    'HD skin prep, long-wear event glam, gele tying, and on-location bridal touch-ups.',
    'Professional makeup artistry brought to your home, hotel suite, or event dressing room.',
    'sparkles',
    ARRAY['bridal makeup', 'event glam', 'gele', 'makeup artist'],
    1, true, true, false, false,
    2500000, 12000000, 150,
    true, false, false, false, 2,
    ARRAY['general_artisan']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  ),

  -- Event Planning & Services
  (
    '20000000-0000-4000-8000-000000000029',
    '10000000-0000-4000-8000-000000000016',
    '10000000-0000-4000-8000-000000000125',
    'EVT-SND-001',
    'Corporate & Private Event Sound, Lighting & Setup',
    'corporate-private-event-sound-lighting-setup',
    'PA speaker arrays, wireless mics, ambient LED uplighting, and on-site sound engineer.',
    'Turnkey audio-visual rigging, live mixing, and venue stage decoration for conferences, launches, and celebrations.',
    'calendar',
    ARRAY['event sound', 'pa system', 'lighting', 'corporate event'],
    1, true, false, false, false,
    4500000, 25000000, 360,
    true, false, true, true, 2,
    ARRAY['trade_technician', 'general_artisan']::TEXT[],
    ARRAY['national_id_nin', 'cac_certificate']::public.document_type[]
  ),

  -- Everyday Tasks & Chores
  (
    '20000000-0000-4000-8000-000000000030',
    '10000000-0000-4000-8000-000000000017',
    '10000000-0000-4000-8000-000000000126',
    'EVD-MNT-001',
    'TV Wall Mounting, Curtain Rods & Furniture Assembly',
    'tv-wall-mounting-curtain-rods-furniture-assembly',
    'Laser-level wall drilling, heavy-duty TV brackets, curtain rail fitting, and flat-pack beds.',
    'Fast precision handyman service for mounting smart TVs, blinds, mirrors, floating shelves, and boxed furniture.',
    'check-circle',
    ARRAY['tv mounting', 'curtain rod', 'furniture assembly', 'handyman'],
    1, true, true, true, false,
    800000, 2500000, 90,
    true, false, false, false, 0,
    ARRAY['general_artisan', 'trade_technician', 'dispatch_rider', 'property_agent']::TEXT[],
    ARRAY['national_id_nin']::public.document_type[]
  )
ON CONFLICT (id) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  subcategory_id = EXCLUDED.subcategory_id,
  service_code = EXCLUDED.service_code,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  is_popular = EXCLUDED.is_popular,
  show_on_homepage = EXCLUDED.show_on_homepage,
  base_price_min_kobo = EXCLUDED.base_price_min_kobo,
  base_price_max_kobo = EXCLUDED.base_price_max_kobo,
  estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
  requires_verified_identity = EXCLUDED.requires_verified_identity,
  requires_trade_certification = EXCLUDED.requires_trade_certification,
  requires_business_registration = EXCLUDED.requires_business_registration,
  requires_site_inspection = EXCLUDED.requires_site_inspection,
  min_years_experience = EXCLUDED.min_years_experience,
  eligible_provider_types = EXCLUDED.eligible_provider_types,
  required_document_types = EXCLUDED.required_document_types,
  updated_at = now();

-- Backfill professional_services.service_id safely for matching existing service_title rows
-- Preserves all historical rows (legacy rows without service_title retain NULL service_id safely)
UPDATE public.professional_services ps
SET
  service_id = s.id,
  updated_at = now()
FROM public.services s
WHERE ps.service_id IS NULL
  AND ps.service_title IS NOT NULL
  AND lower(trim(ps.service_title)) = lower(trim(s.name))
  AND ps.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.professional_services dup
    WHERE dup.professional_id = ps.professional_id
      AND dup.service_id = s.id
      AND dup.deleted_at IS NULL
  );

-- Seed configurable service-specific requirements
INSERT INTO public.service_requirements (
  service_id, requirement_key, requirement_type, title, description,
  is_required, applies_to, config, display_order
) VALUES
  ('20000000-0000-4000-8000-000000000001', 'scaffold_height_access', 'site_access', 'Confirm Scaffold / Roof Tank Clearance', 'Customer specifies tank elevation (ground, 1st floor, or 2nd+ floor scaffold) and shutoff valve access.', true, 'customer', '{"input_type": "select", "options": ["Ground Stand", "First-Floor Scaffold", "Roof/High-Rise Scaffold"]}'::jsonb, 1),
  ('20000000-0000-4000-8000-000000000001', 'tank_manifold_photos', 'photo_evidence', 'Photo of Tank Stand & Existing Piping', 'Upload at least 1 photo showing tank outlet fittings and manifold space.', false, 'customer', '{"min_photos": 1, "max_photos": 4}'::jsonb, 2),

  ('20000000-0000-4000-8000-000000000002', 'borehole_trade_cert', 'provider_credential', 'Verified Borehole / Electro-Mechanical Experience', 'Technician must hold approved identity & trade certification and carry submersible continuity tester.', true, 'professional', '{"required_documents": ["national_id_nin", "trade_certificate"], "min_years_experience": 3}'::jsonb, 1),
  ('20000000-0000-4000-8000-000000000002', 'borehole_hp_spec', 'customer_input', 'Pump Horsepower & Control Box Type', 'Specify pump rating (e.g., 1HP, 1.5HP, 2HP) and whether water stops completely or trips breaker.', true, 'customer', '{"input_type": "text", "placeholder": "e.g., 1.5HP Sumo pump trips breaker after 10 seconds"}'::jsonb, 2),

  ('20000000-0000-4000-8000-000000000005', 'solar_load_audit', 'inspection', 'Pre-Installation Roof & Load Audit', 'Mandatory site measurement of roof orientation, shade clearance, and essential load wattage prior to final quotation.', true, 'both', '{"requires_site_inspection": true}'::jsonb, 1),
  ('20000000-0000-4000-8000-000000000005', 'solar_safety_ppe', 'safety_compliance', 'DC Isolation & Roof Harness Compliance', 'Provider must use insulated DC tools, MC4 crimpers, and rooftop fall protection.', true, 'professional', '{"mandatory_ppe": ["Insulated Gloves", "Roof Harness", "Multimeter"]}'::jsonb, 2),

  ('20000000-0000-4000-8000-000000000006', 'db_panel_photo', 'photo_evidence', 'Clear Photo of Distribution Box (Open Cover)', 'Allows technician to identify breaker count, earthing busbar, and phase configuration before arrival.', true, 'customer', '{"min_photos": 1}'::jsonb, 1),
  ('20000000-0000-4000-8000-000000000006', 'electrical_trade_cert', 'provider_credential', 'NEMSA / Trade Electrician Certification', 'Requires approved trade certificate and insulated lock-out/tag-out kit.', true, 'professional', '{"required_documents": ["national_id_nin", "trade_certificate"], "min_years_experience": 3}'::jsonb, 2),

  ('20000000-0000-4000-8000-000000000010', 'commercial_hvac_cac', 'provider_credential', 'Commercial HVAC Business Registration (CAC)', 'Commercial chiller servicing requires approved business registration alongside trade certification.', true, 'professional', '{"required_documents": ["national_id_nin", "trade_certificate", "cac_certificate"], "min_years_experience": 3}'::jsonb, 1),

  ('20000000-0000-4000-8000-000000000011', 'ats_power_isolation', 'safety_compliance', 'Dual-Source Lockout Before ATS Termination', 'Both grid mains and generator starter battery must be isolated prior to ATS busbar work.', true, 'professional', '{"safety_protocol": "dual_source_lockout"}'::jsonb, 1),

  ('20000000-0000-4000-8000-000000000016', 'fumigation_evacuation_window', 'safety_compliance', '4-Hour Premises Evacuation Notice', 'All occupants, pets, and uncovered food must vacate treated areas for at least 4 hours post-application.', true, 'both', '{"evacuation_hours": 4}'::jsonb, 1),
  ('20000000-0000-4000-8000-000000000016', 'fumigation_cac_credential', 'provider_credential', 'Accredited Pest Control Business & Trade Certificate', 'Chemical fumigation requires approved CAC certificate and trade qualification.', true, 'professional', '{"required_documents": ["national_id_nin", "trade_certificate", "cac_certificate"]}'::jsonb, 2),

  ('20000000-0000-4000-8000-000000000023', 'vehicle_make_model_year', 'customer_input', 'Vehicle Make, Model & Year', 'Required so technician brings compatible OBD-II interface software and wiring diagrams.', true, 'customer', '{"input_type": "text", "placeholder": "e.g., Toyota Camry 2015"}'::jsonb, 1),

  ('20000000-0000-4000-8000-000000000025', 'moving_inventory_floors', 'customer_input', 'Pickup & Drop-off Floor Levels + Large Items', 'List apartment size, staircase/elevator access, and heavy appliances (fridges, wardrobes, generators).', true, 'customer', '{"input_type": "textarea"}'::jsonb, 1),

  ('20000000-0000-4000-8000-000000000030', 'wall_type_disclosure', 'customer_input', 'Wall Material (Concrete/Brick vs Drywall)', 'Determines masonry anchors vs toggle bolts for safe TV bracket loading.', true, 'customer', '{"input_type": "select", "options": ["Concrete / Sandcrete Block", "Drywall / Plasterboard", "Wood Panel"]}'::jsonb, 1)
ON CONFLICT (service_id, requirement_key) DO UPDATE
SET
  requirement_type = EXCLUDED.requirement_type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_required = EXCLUDED.is_required,
  applies_to = EXCLUDED.applies_to,
  config = EXCLUDED.config,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 8. Scalable Catalogue Tree & Provider Eligibility Verification RPCs
-- -----------------------------------------------------------------------------

-- A. Hierarchical Catalogue Tree RPC: Main Category -> Subcategory -> Services -> Requirements
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
              'service_code', s.service_code,
              'name', s.name,
              'slug', s.slug,
              'short_description', s.short_description,
              'image_url', s.image_url,
              'icon_name', s.icon_name,
              'keywords', s.keywords,
              'base_price_min_kobo', s.base_price_min_kobo,
              'base_price_max_kobo', s.base_price_max_kobo,
              'estimated_duration_minutes', s.estimated_duration_minutes,
              'is_active', s.is_active,
              'is_featured', s.is_featured,
              'is_popular', s.is_popular,
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
            AND (v_allow_inactive OR s.is_active = true)
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
                    'service_code', s.service_code,
                    'name', s.name,
                    'slug', s.slug,
                    'short_description', s.short_description,
                    'image_url', s.image_url,
                    'icon_name', s.icon_name,
                    'keywords', s.keywords,
                    'base_price_min_kobo', s.base_price_min_kobo,
                    'base_price_max_kobo', s.base_price_max_kobo,
                    'estimated_duration_minutes', s.estimated_duration_minutes,
                    'is_active', s.is_active,
                    'is_featured', s.is_featured,
                    'is_popular', s.is_popular,
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
                  AND (v_allow_inactive OR s.is_active = true)
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

-- B. Per-Service Provider Eligibility & Verification Check RPC
CREATE OR REPLACE FUNCTION public.check_professional_service_eligibility(
  p_professional_id UUID,
  p_service_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro RECORD;
  v_srv RECORD;
  v_approved_docs public.document_type[];
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_doc public.document_type;
  v_identity_ok BOOLEAN := false;
  v_trade_cert_ok BOOLEAN := false;
  v_cac_ok BOOLEAN := false;
  v_provider_type_ok BOOLEAN := false;
  v_experience_ok BOOLEAN := false;
  v_has_any_id_doc BOOLEAN := false;
BEGIN
  SELECT pp.id, pp.user_id, pp.verification_status, pp.years_of_experience, pp.provider_type, pp.deleted_at
  INTO v_pro
  FROM public.professional_profiles pp
  WHERE pp.id = p_professional_id;

  IF NOT FOUND OR v_pro.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'PROFESSIONAL_NOT_FOUND',
      'missing_requirements', ARRAY['Active professional profile not found']
    );
  END IF;

  -- Restrict sensitive eligibility diagnostics to the profile owner or administrators / service_role
  IF auth.uid() IS NOT NULL
     OR (session_user NOT IN ('postgres', 'supabase_admin') AND COALESCE(auth.role(), '') <> 'service_role') THEN
    IF v_pro.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'FORBIDDEN: Only the profile owner or an administrator may inspect detailed eligibility requirements.';
    END IF;
  END IF;

  SELECT s.*
  INTO v_srv
  FROM public.services s
  WHERE s.id = p_service_id
    AND s.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'SERVICE_NOT_FOUND',
      'missing_requirements', ARRAY['Active catalogue service not found']
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT pd.document_type), ARRAY[]::public.document_type[])
  INTO v_approved_docs
  FROM public.professional_documents pd
  WHERE pd.professional_id = p_professional_id
    AND pd.deleted_at IS NULL
    AND pd.verification_status = 'approved'::public.verification_status
    AND (pd.expires_at IS NULL OR pd.expires_at > now());

  v_has_any_id_doc := v_approved_docs && ARRAY['national_id_nin', 'voters_card', 'drivers_license', 'international_passport']::public.document_type[];
  v_identity_ok := (NOT v_srv.requires_verified_identity) OR (v_pro.verification_status = 'approved'::public.verification_status);
  v_trade_cert_ok := (NOT v_srv.requires_trade_certification) OR ('trade_certificate'::public.document_type = ANY(v_approved_docs));
  v_cac_ok := (NOT v_srv.requires_business_registration) OR ('cac_certificate'::public.document_type = ANY(v_approved_docs));
  v_provider_type_ok := (v_pro.provider_type = ANY(v_srv.eligible_provider_types));
  v_experience_ok := (v_pro.years_of_experience >= v_srv.min_years_experience);

  IF NOT v_identity_ok THEN
    v_missing := array_append(v_missing, 'Approved account identity verification required');
  END IF;
  IF NOT v_provider_type_ok THEN
    v_missing := array_append(v_missing, format('Provider type "%s" is not eligible for this service', v_pro.provider_type));
  END IF;
  IF NOT v_experience_ok THEN
    v_missing := array_append(v_missing, format('Minimum %s years of experience required (current: %s)', v_srv.min_years_experience, v_pro.years_of_experience));
  END IF;
  IF NOT v_trade_cert_ok THEN
    v_missing := array_append(v_missing, 'Approved trade certificate document required');
  END IF;
  IF NOT v_cac_ok THEN
    v_missing := array_append(v_missing, 'Approved CAC business registration certificate required');
  END IF;

  -- Validate explicit required_document_types array (government IDs accept approved status or any approved govt ID doc)
  FOREACH v_doc IN ARRAY v_srv.required_document_types LOOP
    IF v_doc IN ('national_id_nin', 'voters_card', 'drivers_license', 'international_passport') THEN
      IF NOT (v_pro.verification_status = 'approved'::public.verification_status OR v_has_any_id_doc) THEN
        v_missing := array_append(v_missing, format('Approved government identity document (%s) required', v_doc::text));
      END IF;
    ELSIF NOT (v_doc = ANY(v_approved_docs)) THEN
      IF NOT (v_doc = 'trade_certificate' AND NOT v_trade_cert_ok)
         AND NOT (v_doc = 'cac_certificate' AND NOT v_cac_ok) THEN
        v_missing := array_append(v_missing, format('Approved document "%s" required', v_doc::text));
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'eligible', cardinality(v_missing) = 0,
    'professional_id', p_professional_id,
    'service_id', p_service_id,
    'service_name', v_srv.name,
    'missing_requirements', to_jsonb(v_missing),
    'checks', jsonb_build_object(
      'identity_verified', v_identity_ok,
      'provider_type_eligible', v_provider_type_ok,
      'experience_sufficient', v_experience_ok,
      'trade_certification_present', v_trade_cert_ok,
      'business_registration_present', v_cac_ok,
      'approved_document_types', to_jsonb(v_approved_docs)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_professional_service_eligibility(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_professional_service_eligibility(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_professional_service_eligibility(UUID, UUID) TO authenticated, service_role;

-- C. Extend match_service_professionals Backwards-Compatibly with Optional p_service_id
--    Keeps exact same 25-column output and supports existing 17-param callers seamlessly.
DROP FUNCTION IF EXISTS public.match_service_professionals CASCADE;

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
  v_srv_cat_id uuid := NULL;
  v_srv_sub_id uuid := NULL;
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
      COALESCE(ps.service_title, cs.name) AS ps_title,
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
        WHEN p_service_id IS NOT NULL AND ps.service_id = p_service_id THEN 105.0
        WHEN p_category_id IS NOT NULL AND ps.category_id = p_category_id THEN 100.0
        WHEN p_category_id IS NOT NULL AND sc.parent_id = p_category_id THEN 95.0
        WHEN v_category_slug IS NOT NULL AND sc.slug = v_category_slug THEN 100.0
        WHEN v_category_slug IS NOT NULL AND sc.parent_id IN (
          SELECT parent_sc.id FROM public.service_categories parent_sc WHERE parent_sc.slug = v_category_slug
        ) THEN 95.0
        WHEN p_service_id IS NOT NULL AND (
          ps.category_id = v_srv_sub_id OR ps.category_id = v_srv_cat_id
        ) THEN 90.0
        WHEN v_keyword IS NOT NULL AND (
          COALESCE(ps.service_title, '') ILIKE '%' || v_keyword || '%'
          OR COALESCE(cs.name, '') ILIKE '%' || v_keyword || '%'
          OR sc.name ILIKE '%' || v_keyword || '%'
        ) THEN 90.0
        WHEN v_keyword IS NOT NULL AND (
          pp.business_name ILIKE '%' || v_keyword || '%'
          OR pp.headline ILIKE '%' || v_keyword || '%'
          OR pp.bio ILIKE '%' || v_keyword || '%'
          OR COALESCE(ps.description, '') ILIKE '%' || v_keyword || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(COALESCE(cs.keywords, ARRAY[]::text[])) kw
            WHERE kw ILIKE '%' || v_keyword || '%'
          )
        ) THEN 80.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps
      ON ps.professional_id = pp.id AND ps.is_active = true AND ps.deleted_at IS NULL
    LEFT JOIN public.service_categories sc
      ON sc.id = ps.category_id AND sc.deleted_at IS NULL
    LEFT JOIN public.services cs
      ON cs.id = ps.service_id AND cs.deleted_at IS NULL
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
        OR (v_srv_sub_id IS NOT NULL AND ps.category_id = v_srv_sub_id)
        OR (v_srv_cat_id IS NOT NULL AND ps.category_id = v_srv_cat_id)
      )
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
        OR COALESCE(cs.name, '') ILIKE '%' || v_keyword || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(cs.keywords, ARRAY[]::text[])) kw
          WHERE kw ILIKE '%' || v_keyword || '%'
        )
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

GRANT EXECUTE ON FUNCTION public.match_service_professionals(
  uuid, text, text, text, text, text, numeric, numeric, numeric, date, time, numeric, boolean, boolean, text, integer, integer, uuid
) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
