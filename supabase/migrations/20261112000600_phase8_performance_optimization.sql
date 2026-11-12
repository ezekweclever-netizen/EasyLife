-- =============================================================================
-- Migration: Phase 8 — Database Performance, Indexes & Catalogue Tree Optimization
-- Purpose:
--   1. Add targeted indexes for high-frequency foreign keys, admin listings,
--      customer bookings, and catalogue joins surfaced during the Phase 8 audit.
--   2. Remove strict duplicate index idx_quotations_pro_status (covered by
--      idx_quotations_professional_status).
--   3. Upgrade get_service_catalogue_tree(BOOLEAN) to include category_id,
--      subcategory_id, description, show_on_homepage, and display_order on each
--      service object, eliminating the redundant 500-row REST fetch on homepage
--      and discovery loads and removing the 500-service truncation limit.
--   4. Refresh PostgreSQL planner statistics via ANALYZE across core tables.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Targeted Indexes for Unindexed Hot Foreign Keys & Frequent Orderings
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_services_subcategory_active
  ON public.services (subcategory_id, display_order, name)
  WHERE deleted_at IS NULL AND subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_created_desc
  ON public.bookings (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_accepted_quotation_id
  ON public.bookings (accepted_quotation_id)
  WHERE accepted_quotation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_property_id
  ON public.bookings (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_asset_id
  ON public.bookings (asset_id)
  WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_maintenance_schedule_id
  ON public.bookings (maintenance_schedule_id)
  WHERE maintenance_schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_quotation_id
  ON public.appointments (quotation_id)
  WHERE quotation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_payments_quotation_id
  ON public.payments (quotation_id)
  WHERE quotation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_business_id
  ON public.payments (business_id)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_documents_pro_status
  ON public.professional_documents (professional_id, verification_status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_professional_documents_reviewed_by
  ON public.professional_documents (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_profiles_verified_by
  ON public.professional_profiles (verified_by)
  WHERE verified_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_profiles_approved_city
  ON public.professional_profiles (verification_status, primary_city, is_available, completed_jobs_count DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_user_id
  ON public.reviews (reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_disputes_opened_by_user_id
  ON public.disputes (opened_by_user_id);

CREATE INDEX IF NOT EXISTS idx_disputes_against_user_id
  ON public.disputes (against_user_id);

CREATE INDEX IF NOT EXISTS idx_booking_attachments_uploaded_by
  ON public.booking_attachments (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_profiles_created_desc
  ON public.profiles (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc
  ON public.audit_logs (created_at DESC);

-- Remove strict duplicate prefix index (idx_quotations_professional_status covers (professional_id, status, created_at DESC))
DROP INDEX IF EXISTS public.idx_quotations_pro_status;

-- -----------------------------------------------------------------------------
-- 2. Enrich get_service_catalogue_tree(BOOLEAN) to Eliminate Redundant Queries
-- -----------------------------------------------------------------------------
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

NOTIFY pgrst, 'reload schema';

COMMIT;

ANALYZE public.service_categories;
ANALYZE public.services;
ANALYZE public.service_requirements;
ANALYZE public.professional_profiles;
ANALYZE public.professional_services;
ANALYZE public.professional_service_areas;
ANALYZE public.professional_documents;
ANALYZE public.bookings;
ANALYZE public.quotations;
ANALYZE public.messages;
ANALYZE public.reviews;
ANALYZE public.disputes;
ANALYZE public.operating_neighbourhoods;
ANALYZE public.catalogue_search_metrics;
