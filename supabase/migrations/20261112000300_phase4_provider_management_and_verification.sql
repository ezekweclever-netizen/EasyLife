-- =============================================================================
-- Migration: Phase 4 — Provider Management, Service Qualifications & Verification
-- Target Project: EasyLife Service Marketplace
-- Purpose:
--   1. Adds structured service-specific qualification columns on
--      public.professional_services and refines the catalogue sync trigger.
--   2. Deduplicates and indexes weekly public.professional_availability rows.
--   3. Strengthens check_professional_service_eligibility with per-service
--      experience awareness and hardens admin_review_professional_verification
--      to require KYC document evidence before accreditation.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Service-Specific Qualifications on public.professional_services
-- -----------------------------------------------------------------------------
ALTER TABLE public.professional_services
  ADD COLUMN IF NOT EXISTS qualification_notes TEXT,
  ADD COLUMN IF NOT EXISTS certification_reference TEXT,
  ADD COLUMN IF NOT EXISTS years_experience_in_service SMALLINT,
  ADD COLUMN IF NOT EXISTS qualifications JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'professional_services'
      AND constraint_name = 'professional_services_years_exp_chk'
  ) THEN
    ALTER TABLE public.professional_services
      ADD CONSTRAINT professional_services_years_exp_chk
      CHECK (
        years_experience_in_service IS NULL
        OR (years_experience_in_service BETWEEN 0 AND 70)
      );
  END IF;
END $$;

-- Update catalogue sync trigger so soft-archival / pricing updates on existing rows
-- remain safe even if a referenced catalogue service is later deactivated or archived.
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
    IF TG_OP = 'INSERT' OR NEW.service_id IS DISTINCT FROM OLD.service_id THEN
      SELECT id, category_id, subcategory_id, name, is_active, deleted_at
      INTO v_srv
      FROM public.services
      WHERE id = NEW.service_id;

      IF NOT FOUND OR v_srv.deleted_at IS NOT NULL OR NOT v_srv.is_active THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Referenced catalogue service % is not active.', NEW.service_id;
      END IF;

      IF NEW.category_id IS DISTINCT FROM v_srv.category_id
         AND (v_srv.subcategory_id IS NULL OR NEW.category_id IS DISTINCT FROM v_srv.subcategory_id) THEN
        NEW.category_id := COALESCE(v_srv.subcategory_id, v_srv.category_id);
      END IF;

      IF NEW.service_title IS NULL OR char_length(trim(NEW.service_title)) = 0 THEN
        NEW.service_title := v_srv.name;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Weekly Availability Deduplication & Unique Constraint
-- -----------------------------------------------------------------------------
WITH ranked_avail AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY professional_id, day_of_week
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.professional_availability
  WHERE day_of_week IS NOT NULL
    AND specific_date IS NULL
)
DELETE FROM public.professional_availability pa
USING ranked_avail ra
WHERE pa.id = ra.id
  AND ra.rn > 1;

DROP INDEX IF EXISTS public.uq_pro_availability_pro_weekday;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_availability_pro_weekday
  ON public.professional_availability (professional_id, day_of_week);

-- -----------------------------------------------------------------------------
-- 3. Service Eligibility Check Incorporating Per-Service Qualifications
-- -----------------------------------------------------------------------------
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
  v_ps_years SMALLINT := NULL;
  v_effective_years SMALLINT := 0;
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

  SELECT ps.years_experience_in_service
  INTO v_ps_years
  FROM public.professional_services ps
  WHERE ps.professional_id = p_professional_id
    AND ps.service_id = p_service_id
    AND ps.deleted_at IS NULL
  LIMIT 1;

  v_effective_years := GREATEST(COALESCE(v_pro.years_of_experience, 0), COALESCE(v_ps_years, 0));

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
  v_experience_ok := (v_effective_years >= v_srv.min_years_experience);

  IF NOT v_identity_ok THEN
    v_missing := array_append(v_missing, 'Approved account identity verification required');
  END IF;
  IF NOT v_provider_type_ok THEN
    v_missing := array_append(v_missing, format('Provider type "%s" is not eligible for this service', v_pro.provider_type));
  END IF;
  IF NOT v_experience_ok THEN
    v_missing := array_append(v_missing, format('Minimum %s years of experience required (current: %s)', v_srv.min_years_experience, v_effective_years));
  END IF;
  IF NOT v_trade_cert_ok THEN
    v_missing := array_append(v_missing, 'Approved trade certificate document required');
  END IF;
  IF NOT v_cac_ok THEN
    v_missing := array_append(v_missing, 'Approved CAC business registration certificate required');
  END IF;

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

-- -----------------------------------------------------------------------------
-- 4. Strengthen Admin Verification Review Enforcement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_review_professional_verification(
  p_professional_id UUID,
  p_decision public.verification_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.professional_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_status public.verification_status;
  v_pro_user_id UUID;
  v_deleted_at TIMESTAMPTZ;
  v_has_reviewable_doc BOOLEAN := false;
  v_updated public.professional_profiles%ROWTYPE;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to review professional verifications.';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'INVALID_DECISION: Decision must be approved, rejected, or suspended.';
  END IF;

  IF p_decision IN ('rejected', 'suspended') AND (p_reason IS NULL OR char_length(trim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: A reason of at least 5 characters is required when rejecting or suspending.';
  END IF;

  SELECT verification_status, user_id, deleted_at
  INTO v_old_status, v_pro_user_id, v_deleted_at
  FROM public.professional_profiles
  WHERE id = p_professional_id
  FOR UPDATE;

  IF v_old_status IS NULL OR v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Active professional profile not found.';
  END IF;

  IF p_decision = 'approved' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.professional_documents pd
      WHERE pd.professional_id = p_professional_id
        AND pd.deleted_at IS NULL
        AND pd.verification_status IN ('pending', 'approved')
    ) INTO v_has_reviewable_doc;

    IF NOT v_has_reviewable_doc THEN
      RAISE EXCEPTION 'VERIFICATION_PREREQUISITE_MISSING: Cannot accredit a professional with zero active or approved KYC documents.';
    END IF;
  END IF;

  PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

  UPDATE public.professional_profiles
  SET verification_status = p_decision,
      verified_at = CASE WHEN p_decision = 'approved' THEN now() ELSE verified_at END,
      verified_by = COALESCE(v_admin_id, verified_by),
      rejection_reason = CASE WHEN p_decision IN ('rejected', 'suspended') THEN trim(p_reason) ELSE NULL END,
      updated_at = now()
  WHERE id = p_professional_id
  RETURNING * INTO v_updated;

  -- Keep pending KYC documents synchronized on approval or rejection (preserve approved docs when suspending)
  IF p_decision IN ('approved', 'rejected') THEN
    UPDATE public.professional_documents
    SET verification_status = p_decision,
        reviewed_by = COALESCE(v_admin_id, reviewed_by),
        reviewed_at = now(),
        review_notes = COALESCE(NULLIF(trim(p_reason), ''), review_notes),
        updated_at = now()
    WHERE professional_id = p_professional_id
      AND verification_status = 'pending'
      AND deleted_at IS NULL;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(v_admin_id, v_pro_user_id),
    'admin',
    'professional.verification_reviewed',
    'professional_profile',
    p_professional_id::text,
    jsonb_build_object('verification_status', v_old_status),
    jsonb_build_object('verification_status', p_decision, 'reason', p_reason)
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_professional_verification(UUID, public.verification_status, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_professional_verification(UUID, public.verification_status, TEXT) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Defense-in-Depth Security Guard on public.professional_documents
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_professional_document_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('easylife.trusted_admin_rpc', true) = 'true'
     OR auth.uid() IS NULL
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.verification_status NOT IN ('unsubmitted', 'pending') THEN
      RAISE EXCEPTION 'FORBIDDEN: New verification documents cannot be pre-approved or reviewed.';
    END IF;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.review_notes := NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only administrators may modify submitted verification documents.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_professional_documents_security_guard ON public.professional_documents;
CREATE TRIGGER trg_professional_documents_security_guard
  BEFORE INSERT OR UPDATE ON public.professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_professional_document_security();

NOTIFY pgrst, 'reload schema';

COMMIT;
