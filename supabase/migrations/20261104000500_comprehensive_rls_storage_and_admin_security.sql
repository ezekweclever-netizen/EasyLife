-- ============================================================================
-- Migration: 20261104000500_comprehensive_rls_storage_and_admin_security.sql
-- Description: Comprehensive Row Level Security (RLS) policies, anti-privilege
--              escalation triggers, business owner vs. member role boundaries,
--              storage bucket policies, file validation, and admin RPCs.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SECURITY HELPER FUNCTIONS (SECURITY DEFINER, SAFE SEARCH_PATH)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.is_suspended = false
      AND p.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.primary_role
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true
    AND p.is_suspended = false
    AND p.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
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
$$;

CREATE OR REPLACE FUNCTION public.is_verified_professional()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    WHERE pp.user_id = auth.uid()
      AND pp.verification_status = 'approved'
      AND pp.deleted_at IS NULL
      AND p.is_active = true
      AND p.is_suspended = false
      AND p.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = auth.uid()
      AND b.is_active = true
      AND b.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.has_business_read_access(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_business_owner(p_business_id)
  OR EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.businesses b ON b.id = bm.business_id
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND b.is_active = true
      AND b.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.has_business_write_access(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_business_owner(p_business_id)
  OR EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.businesses b ON b.id = bm.business_id
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND bm.member_role IN ('owner', 'admin', 'facility_manager')
      AND b.is_active = true
      AND b.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_booking(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = p_booking_id
      AND b.deleted_at IS NULL
      AND (
        b.customer_id = auth.uid()
        OR (b.business_id IS NOT NULL AND public.has_business_read_access(b.business_id))
        OR EXISTS (
          SELECT 1
          FROM public.professional_profiles pp
          WHERE pp.user_id = auth.uid()
            AND pp.deleted_at IS NULL
            AND (
              pp.id = b.professional_id
              OR EXISTS (
                SELECT 1
                FROM public.quotations q
                WHERE q.booking_id = b.id AND q.professional_id = pp.id
              )
              OR (b.status IN ('open', 'quoted') AND pp.verification_status = 'approved')
            )
        )
        OR public.is_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_quotation(p_quotation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotations q
    JOIN public.bookings b ON b.id = q.booking_id
    WHERE q.id = p_quotation_id
      AND (
        b.customer_id = auth.uid()
        OR (b.business_id IS NOT NULL AND public.has_business_read_access(b.business_id))
        OR EXISTS (
          SELECT 1
          FROM public.professional_profiles pp
          WHERE pp.id = q.professional_id AND pp.user_id = auth.uid()
        )
        OR public.is_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dispute_participant(p_dispute_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.disputes d
    WHERE d.id = p_dispute_id
      AND (
        d.opened_by_user_id = auth.uid()
        OR d.against_user_id = auth.uid()
        OR public.is_admin()
      )
  );
$$;

-- ============================================================================
-- 2. ANTI-PRIVILEGE-ESCALATION & TAMPER PROTECTION TRIGGERS
-- ============================================================================

-- 2.1 Prevent users from granting themselves 'admin' or altering suspension status on profiles
CREATE OR REPLACE FUNCTION public.enforce_profile_security_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow trusted internal RPCs or superuser/service_role migrations
  IF current_setting('easylife.trusted_admin_rpc', true) = 'true'
     OR auth.uid() IS NULL
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.primary_role IS DISTINCT FROM OLD.primary_role THEN
    RAISE EXCEPTION 'FORBIDDEN: Users cannot change their own primary_role.';
  END IF;

  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'FORBIDDEN: Users cannot modify account suspension or active flags.';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'FORBIDDEN: Email must be updated through Supabase Auth verification.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_security_guard ON public.profiles;
CREATE TRIGGER trg_profiles_security_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_security_constraints();

-- 2.2 Prevent users from inserting or updating 'admin' role in user_roles
CREATE OR REPLACE FUNCTION public.enforce_user_roles_security()
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

  RAISE EXCEPTION 'FORBIDDEN: Only administrators can modify user_roles records.';
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_security_guard ON public.user_roles;
CREATE TRIGGER trg_user_roles_security_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_roles_security();

-- 2.3 Prevent professionals from self-approving verification or tampering with rating/job counters
CREATE OR REPLACE FUNCTION public.enforce_professional_profile_security()
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
      RAISE EXCEPTION 'FORBIDDEN: New professional profiles cannot be created as approved.';
    END IF;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.average_rating := 0.00;
    NEW.review_count := 0;
    NEW.completed_jobs_count := 0;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- A professional may only transition their own status from 'unsubmitted' or 'rejected' to 'pending'
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF NOT (OLD.verification_status IN ('unsubmitted', 'rejected') AND NEW.verification_status = 'pending') THEN
        RAISE EXCEPTION 'FORBIDDEN: Only administrators can approve or suspend professional verification.';
      END IF;
      NEW.submitted_for_verification_at := now();
    END IF;

    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
       OR NEW.review_count IS DISTINCT FROM OLD.review_count
       OR NEW.completed_jobs_count IS DISTINCT FROM OLD.completed_jobs_count THEN
      RAISE EXCEPTION 'FORBIDDEN: Verification metadata, ratings, and completed job counts are system-managed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_professional_profiles_security_guard ON public.professional_profiles;
CREATE TRIGGER trg_professional_profiles_security_guard
  BEFORE INSERT OR UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_professional_profile_security();

-- ============================================================================
-- 3. FINE-GRAINED ROW LEVEL SECURITY POLICIES (REFINING ALL 6 GROUPS)
-- ============================================================================

-- 3.1 Group A: user_roles (Strict Admin-Only Write)
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3.2 Group B: Professional Documents (Owner can only upload/view own; only Admin can update review status)
DROP POLICY IF EXISTS "pro_documents_update_admin_only" ON public.professional_documents;
CREATE POLICY "pro_documents_update_admin_only" ON public.professional_documents
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pro_documents_delete_owner_pending" ON public.professional_documents;
CREATE POLICY "pro_documents_delete_owner_pending" ON public.professional_documents
  FOR DELETE USING (
    (
      verification_status IN ('unsubmitted', 'pending', 'rejected')
      AND EXISTS (
        SELECT 1 FROM public.professional_profiles pp
        WHERE pp.id = professional_id AND pp.user_id = auth.uid()
      )
    ) OR public.is_admin()
  );

-- 3.3 Group C: Business Owners vs. Authorised Business Members vs. Viewers
DROP POLICY IF EXISTS "businesses_member_or_admin" ON public.businesses;
CREATE POLICY "businesses_select_member_or_admin" ON public.businesses
  FOR SELECT USING (public.has_business_read_access(id) OR public.is_admin());

DROP POLICY IF EXISTS "business_members_access" ON public.business_members;
CREATE POLICY "business_members_select_member_or_admin" ON public.business_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.has_business_read_access(business_id)
    OR public.is_admin()
  );

CREATE POLICY "business_members_manage_owner_or_admin" ON public.business_members
  FOR ALL USING (public.is_business_owner(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_owner(business_id) OR public.is_admin());

DROP POLICY IF EXISTS "business_subscriptions_access" ON public.business_subscriptions;
CREATE POLICY "business_subscriptions_select_member" ON public.business_subscriptions
  FOR SELECT USING (public.has_business_read_access(business_id) OR public.is_admin());

CREATE POLICY "business_subscriptions_manage_owner_or_admin" ON public.business_subscriptions
  FOR ALL USING (public.is_business_owner(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_owner(business_id) OR public.is_admin());

-- Properties: Viewers can SELECT; only Owner/Admin/Facility Manager can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "properties_business_access" ON public.properties;
CREATE POLICY "properties_select_authorised_member" ON public.properties
  FOR SELECT USING (public.has_business_read_access(business_id) OR public.is_admin());

CREATE POLICY "properties_write_authorised_manager" ON public.properties
  FOR INSERT WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "properties_update_authorised_manager" ON public.properties
  FOR UPDATE USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "properties_delete_owner_or_admin" ON public.properties
  FOR DELETE USING (public.is_business_owner(business_id) OR public.is_admin());

-- Assets: Viewers can SELECT; only Owner/Admin/Facility Manager can INSERT/UPDATE
DROP POLICY IF EXISTS "assets_business_access" ON public.assets;
CREATE POLICY "assets_select_authorised_member" ON public.assets
  FOR SELECT USING (public.has_business_read_access(business_id) OR public.is_admin());

CREATE POLICY "assets_write_authorised_manager" ON public.assets
  FOR INSERT WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "assets_update_authorised_manager" ON public.assets
  FOR UPDATE USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "assets_delete_owner_or_admin" ON public.assets
  FOR DELETE USING (public.is_business_owner(business_id) OR public.is_admin());

-- Maintenance Schedules & Records: Viewers can SELECT; only Owner/Admin/Facility Manager can write
DROP POLICY IF EXISTS "maintenance_schedules_business_access" ON public.maintenance_schedules;
CREATE POLICY "maintenance_schedules_select_member" ON public.maintenance_schedules
  FOR SELECT USING (public.has_business_read_access(business_id) OR public.is_admin());

CREATE POLICY "maintenance_schedules_write_manager" ON public.maintenance_schedules
  FOR INSERT WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "maintenance_schedules_update_manager" ON public.maintenance_schedules
  FOR UPDATE USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

DROP POLICY IF EXISTS "maintenance_records_business_access" ON public.maintenance_records;
CREATE POLICY "maintenance_records_select_member" ON public.maintenance_records
  FOR SELECT USING (public.has_business_read_access(business_id) OR public.is_admin());

CREATE POLICY "maintenance_records_write_manager" ON public.maintenance_records
  FOR INSERT WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

CREATE POLICY "maintenance_records_update_manager" ON public.maintenance_records
  FOR UPDATE USING (public.has_business_write_access(business_id) OR public.is_admin())
  WITH CHECK (public.has_business_write_access(business_id) OR public.is_admin());

-- 3.4 Group D: Private Booking Attachments, Quotations, Quotation Items, Status History & Chat
DROP POLICY IF EXISTS "booking_attachments_select_authorized" ON public.booking_attachments;
CREATE POLICY "booking_attachments_select_authorized" ON public.booking_attachments
  FOR SELECT USING (public.can_access_booking(booking_id));

DROP POLICY IF EXISTS "booking_attachments_insert_participant" ON public.booking_attachments;
CREATE POLICY "booking_attachments_insert_participant" ON public.booking_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND public.can_access_booking(booking_id)
  );

DROP POLICY IF EXISTS "booking_attachments_delete_uploader_or_admin" ON public.booking_attachments;
CREATE POLICY "booking_attachments_delete_uploader_or_admin" ON public.booking_attachments
  FOR DELETE USING (uploaded_by = auth.uid() OR public.is_admin());

-- Tighten quotation_items & booking_status_history policies to use explicit helper functions
DROP POLICY IF EXISTS "quotation_items_select_authorized" ON public.quotation_items;
CREATE POLICY "quotation_items_select_authorized" ON public.quotation_items
  FOR SELECT USING (public.can_access_quotation(quotation_id));

DROP POLICY IF EXISTS "quotation_items_insert_verified_pro" ON public.quotation_items;
CREATE POLICY "quotation_items_insert_verified_pro" ON public.quotation_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotations q
      JOIN public.professional_profiles pp ON pp.id = q.professional_id
      WHERE q.id = quotation_items.quotation_id
        AND q.status = 'pending'
        AND pp.user_id = auth.uid()
        AND pp.verification_status = 'approved'
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "booking_status_history_select" ON public.booking_status_history;
CREATE POLICY "booking_status_history_select_authorized" ON public.booking_status_history
  FOR SELECT USING (public.can_access_booking(booking_id));

-- Tighten Conversation & Message policies using SECURITY DEFINER helper
DROP POLICY IF EXISTS "conversations_member_access" ON public.conversations;
CREATE POLICY "conversations_select_member_or_admin" ON public.conversations
  FOR SELECT USING (public.is_conversation_member(id) OR public.is_admin());

DROP POLICY IF EXISTS "conversation_members_select" ON public.conversation_members;
CREATE POLICY "conversation_members_select_member_or_admin" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_conversation_member(conversation_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member_or_admin" ON public.messages
  FOR SELECT USING (
    (deleted_at IS NULL AND public.is_conversation_member(conversation_id))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_active_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.is_active_user()
    AND public.is_conversation_member(conversation_id)
  );

-- 3.5 Group E & F: Dispute Evidence, Payments, Platform & Commission Settings
DROP POLICY IF EXISTS "dispute_evidence_insert_participant" ON public.dispute_evidence;
CREATE POLICY "dispute_evidence_insert_participant" ON public.dispute_evidence
  FOR INSERT WITH CHECK (
    submitted_by_user_id = auth.uid()
    AND public.is_dispute_participant(dispute_id)
  );

DROP POLICY IF EXISTS "platform_settings_admin_write" ON public.platform_settings;
CREATE POLICY "platform_settings_admin_write" ON public.platform_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "commission_settings_admin_write" ON public.commission_settings;
CREATE POLICY "commission_settings_admin_write" ON public.commission_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. STORAGE BUCKET SECURITY & UPLOAD FILE VALIDATION (Tasks 7, 8, 14)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_storage_file_metadata(
  p_bucket_id TEXT,
  p_object_name TEXT,
  p_mime_type TEXT,
  p_size_bytes BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ext TEXT;
BEGIN
  IF p_bucket_id IS NULL OR p_object_name IS NULL OR p_mime_type IS NULL OR p_size_bytes IS NULL THEN
    RETURN false;
  END IF;

  IF p_size_bytes <= 0 THEN
    RETURN false;
  END IF;

  -- Reject path traversal attempts
  IF p_object_name LIKE '%..%' OR p_object_name LIKE '/%' THEN
    RETURN false;
  END IF;

  v_ext := lower(substring(p_object_name FROM '\.([a-zA-Z0-9]+)$'));

  IF p_bucket_id = 'avatars' THEN
    RETURN p_size_bytes <= 2097152
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp');
  ELSIF p_bucket_id = 'portfolio-media' THEN
    RETURN p_size_bytes <= 5242880
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp');
  ELSIF p_bucket_id = 'service-request-media' THEN
    RETURN p_size_bytes <= 8388608
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
  ELSIF p_bucket_id IN ('verification-documents', 'maintenance-and-disputes') THEN
    RETURN p_size_bytes <= 10485760
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
  END IF;

  RETURN false;
END;
$$;

-- Apply Storage Object RLS Policies when storage.objects is present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- 1. Public Avatars & Portfolio Media: Anyone can read; only folder owner ({user_id}/*) can upload/update/delete
    DROP POLICY IF EXISTS "easylife_public_media_read" ON storage.objects;
    CREATE POLICY "easylife_public_media_read" ON storage.objects
      FOR SELECT USING (bucket_id IN ('avatars', 'portfolio-media'));

    DROP POLICY IF EXISTS "easylife_public_media_owner_write" ON storage.objects;
    CREATE POLICY "easylife_public_media_owner_write" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('avatars', 'portfolio-media')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- 2. Private Verification Documents: Only uploading professional ({user_id}/*) or Admin can read/upload
    DROP POLICY IF EXISTS "easylife_verification_docs_read" ON storage.objects;
    CREATE POLICY "easylife_verification_docs_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'verification-documents'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_verification_docs_insert" ON storage.objects;
    CREATE POLICY "easylife_verification_docs_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'verification-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- 3. Private Service Request Media: Path format {booking_id}/{user_id}/{filename}
    DROP POLICY IF EXISTS "easylife_service_request_media_read" ON storage.objects;
    CREATE POLICY "easylife_service_request_media_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'service-request-media'
        AND (
          (storage.foldername(name))[2] = auth.uid()::text
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_service_request_media_insert" ON storage.objects;
    CREATE POLICY "easylife_service_request_media_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'service-request-media'
        AND (storage.foldername(name))[2] = auth.uid()::text
      );

    -- 4. Private Maintenance & Dispute Evidence: Path format {entity_id}/{user_id}/{filename}
    DROP POLICY IF EXISTS "easylife_maintenance_disputes_read" ON storage.objects;
    CREATE POLICY "easylife_maintenance_disputes_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'maintenance-and-disputes'
        AND (
          (storage.foldername(name))[2] = auth.uid()::text
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_maintenance_disputes_insert" ON storage.objects;
    CREATE POLICY "easylife_maintenance_disputes_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'maintenance-and-disputes'
        AND (storage.foldername(name))[2] = auth.uid()::text
      );
  END IF;
END
$$;

-- ============================================================================
-- 5. SECURE ADMINISTRATIVE OPERATIONS (SERVER / ADMIN ONLY RPCs — Task 13)
-- ============================================================================

-- 5.1 Approve or Reject Professional Verification
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
  v_updated public.professional_profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to review professional verifications.';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'INVALID_DECISION: Decision must be approved, rejected, or suspended.';
  END IF;

  IF p_decision IN ('rejected', 'suspended') AND (p_reason IS NULL OR char_length(trim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: A reason of at least 5 characters is required when rejecting or suspending.';
  END IF;

  SELECT verification_status INTO v_old_status
  FROM public.professional_profiles
  WHERE id = p_professional_id
  FOR UPDATE;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Professional profile not found.';
  END IF;

  PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

  UPDATE public.professional_profiles
  SET verification_status = p_decision,
      verified_at = CASE WHEN p_decision = 'approved' THEN now() ELSE verified_at END,
      verified_by = v_admin_id,
      rejection_reason = CASE WHEN p_decision IN ('rejected', 'suspended') THEN p_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_professional_id
  RETURNING * INTO v_updated;

  -- Also mark pending KYC documents for this professional as reviewed
  UPDATE public.professional_documents
  SET verification_status = p_decision,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      review_notes = p_reason,
      updated_at = now()
  WHERE professional_id = p_professional_id
    AND verification_status = 'pending'
    AND deleted_at IS NULL;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    v_admin_id,
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

-- 5.2 Suspend or Reinstate User Account
CREATE OR REPLACE FUNCTION public.admin_set_user_suspension(
  p_target_user_id UUID,
  p_suspend BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_updated public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  IF p_target_user_id = v_admin_id THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Administrators cannot suspend their own account.';
  END IF;

  IF p_suspend AND (p_reason IS NULL OR char_length(trim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Suspension reason is required.';
  END IF;

  PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

  UPDATE public.profiles
  SET is_suspended = p_suspend,
      suspension_reason = CASE WHEN p_suspend THEN p_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated;

  IF v_updated.id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Target user profile not found.';
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_admin_id,
    'admin',
    CASE WHEN p_suspend THEN 'user.suspended' ELSE 'user.reinstated' END,
    'profile',
    p_target_user_id::text,
    jsonb_build_object('is_suspended', p_suspend, 'reason', p_reason)
  );

  RETURN v_updated;
END;
$$;

-- 5.3 Resolve Booking Dispute
CREATE OR REPLACE FUNCTION public.admin_resolve_dispute(
  p_dispute_id UUID,
  p_resolution_status public.dispute_status,
  p_resolution_summary TEXT
)
RETURNS public.disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_dispute public.disputes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to resolve disputes.';
  END IF;

  IF p_resolution_status NOT IN ('resolved_for_customer', 'resolved_for_professional', 'closed') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid terminal dispute resolution status.';
  END IF;

  IF p_resolution_summary IS NULL OR char_length(trim(p_resolution_summary)) < 10 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Resolution summary must be at least 10 characters.';
  END IF;

  UPDATE public.disputes
  SET status = p_resolution_status,
      resolution_summary = p_resolution_summary,
      resolved_by = v_admin_id,
      resolved_at = now(),
      updated_at = now()
  WHERE id = p_dispute_id
  RETURNING * INTO v_dispute;

  IF v_dispute.id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Dispute not found.';
  END IF;

  -- Synchronize parent booking status based on dispute outcome
  IF p_resolution_status = 'resolved_for_professional' THEN
    UPDATE public.bookings
    SET status = 'completed',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    WHERE id = v_dispute.booking_id;
  ELSIF p_resolution_status = 'resolved_for_customer' THEN
    UPDATE public.bookings
    SET status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now()),
        cancellation_reason = 'Resolved in favor of customer via dispute ' || v_dispute.reference_code,
        updated_at = now()
    WHERE id = v_dispute.booking_id;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_admin_id,
    'admin',
    'dispute.resolved',
    'dispute',
    p_dispute_id::text,
    jsonb_build_object(
      'status', p_resolution_status,
      'resolution_summary', p_resolution_summary,
      'booking_id', v_dispute.booking_id
    )
  );

  RETURN v_dispute;
END;
$$;

COMMIT;
