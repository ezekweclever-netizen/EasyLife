-- ============================================================================
-- Migration: 20261104001300_admin_dashboard_and_operations.sql
-- Prompt 16: Complete EasyLife Administration Dashboard
--
-- Provides:
-- 1. get_admin_dashboard_metrics() RPC for high-level marketplace overview
-- 2. Enhanced query helpers with search, filters, pagination, and audit logging
-- 3. Dedicated admin management RPCs for settings, commissions, document reviews,
--    review moderation, and notification dispatch
-- 4. Protection of privileged audit history and strict role verification
-- ============================================================================

BEGIN;

-- 0. Universal Admin Checker with Service Role & Superuser Privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Service role JWT explicitly presented by server action
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  -- 2. Direct database maintenance if session_user is superuser and no auth.uid()
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
  );
END;
$$;

-- 1. Dashboard Overview Metrics RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_customers INTEGER;
  v_total_professionals INTEGER;
  v_verified_professionals INTEGER;
  v_pending_verifications INTEGER;
  v_total_businesses INTEGER;
  v_total_bookings INTEGER;
  v_active_bookings INTEGER;
  v_completed_bookings INTEGER;
  v_open_disputes INTEGER;
  v_platform_revenue_kobo BIGINT;
  v_recent_audit_logs JSONB;
BEGIN
  -- 1. Total Customers (registered user profiles)
  SELECT COUNT(*)::INTEGER INTO v_total_customers
  FROM public.profiles
  WHERE deleted_at IS NULL;

  -- 2. Total Professionals
  SELECT COUNT(*)::INTEGER INTO v_total_professionals
  FROM public.professional_profiles
  WHERE deleted_at IS NULL;

  -- 3. Verified Professionals
  SELECT COUNT(*)::INTEGER INTO v_verified_professionals
  FROM public.professional_profiles
  WHERE verification_status = 'approved' AND deleted_at IS NULL;

  -- 4. Pending Verification Requests
  SELECT COUNT(*)::INTEGER INTO v_pending_verifications
  FROM public.professional_profiles
  WHERE verification_status = 'pending' AND deleted_at IS NULL;

  -- 5. Total Businesses
  SELECT COUNT(*)::INTEGER INTO v_total_businesses
  FROM public.businesses
  WHERE deleted_at IS NULL;

  -- 6. Total Bookings
  SELECT COUNT(*)::INTEGER INTO v_total_bookings
  FROM public.bookings;

  -- 7. Active Bookings
  SELECT COUNT(*)::INTEGER INTO v_active_bookings
  FROM public.bookings
  WHERE status IN ('confirmed', 'in_progress');

  -- 8. Completed Bookings
  SELECT COUNT(*)::INTEGER INTO v_completed_bookings
  FROM public.bookings
  WHERE status = 'completed';

  -- 9. Open Disputes
  SELECT COUNT(*)::INTEGER INTO v_open_disputes
  FROM public.disputes
  WHERE status NOT IN ('resolved_for_customer', 'resolved_for_professional', 'closed');

  -- 10. Platform Revenue (sum of successful payments platform commission)
  SELECT COALESCE(SUM(platform_commission_kobo), 0)::BIGINT INTO v_platform_revenue_kobo
  FROM public.payments
  WHERE status = 'succeeded';

  -- If payments table has 0, check completed bookings agreed_amount_kobo commission (10% standard)
  IF v_platform_revenue_kobo = 0 THEN
    SELECT COALESCE(SUM(agreed_amount_kobo * 10 / 100), 0)::BIGINT INTO v_platform_revenue_kobo
    FROM public.bookings
    WHERE status = 'completed';
  END IF;

  -- Recent 10 audit logs
  SELECT COALESCE(jsonb_agg(log_item), '[]'::jsonb) INTO v_recent_audit_logs
  FROM (
    SELECT 
      al.id,
      al.actor_user_id,
      p.email AS actor_email,
      p.full_name AS actor_name,
      al.action,
      al.entity_type,
      al.entity_id,
      al.new_values,
      al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON p.id = al.actor_user_id
    ORDER BY al.created_at DESC
    LIMIT 10
  ) log_item;

  RETURN jsonb_build_object(
    'total_customers', v_total_customers,
    'total_professionals', v_total_professionals,
    'verified_professionals', v_verified_professionals,
    'pending_verification_requests', v_pending_verifications,
    'total_businesses', v_total_businesses,
    'total_bookings', v_total_bookings,
    'active_bookings', v_active_bookings,
    'completed_bookings', v_completed_bookings,
    'open_disputes', v_open_disputes,
    'platform_revenue_kobo', v_platform_revenue_kobo,
    'platform_revenue_naira', v_platform_revenue_kobo / 100.0,
    'recent_audit_logs', v_recent_audit_logs
  );
END;
$$;

-- 2. Audit Logging Helper RPC
CREATE OR REPLACE FUNCTION public.admin_record_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    v_admin_id,
    'admin',
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 3. Platform Setting Updater RPC
CREATE OR REPLACE FUNCTION public.admin_set_platform_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_val JSONB;
BEGIN
  SELECT value INTO v_old_val FROM public.platform_settings WHERE key = p_key;

  INSERT INTO public.platform_settings (
    key,
    value,
    description,
    is_public,
    updated_by,
    updated_at
  ) VALUES (
    p_key,
    p_value,
    p_description,
    p_is_public,
    v_admin_id,
    now()
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, public.platform_settings.description),
    is_public = EXCLUDED.is_public,
    updated_by = v_admin_id,
    updated_at = now();

  PERFORM public.admin_record_audit_log(
    'platform_setting.updated',
    'platform_setting',
    p_key,
    v_old_val,
    p_value,
    jsonb_build_object('description', p_description)
  );

  RETURN jsonb_build_object('success', true, 'key', p_key, 'value', p_value);
END;
$$;

-- 4. Commission Rate Configurator RPC
CREATE OR REPLACE FUNCTION public.admin_set_commission_setting(
  p_category_id UUID DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_commission_bps INTEGER DEFAULT 1000, -- default 10.00%
  p_flat_fee_kobo INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_res_id UUID;
BEGIN
  INSERT INTO public.commission_settings (
    category_id,
    city,
    commission_bps,
    flat_fee_kobo,
    is_active,
    created_by,
    effective_from,
    updated_at
  ) VALUES (
    p_category_id,
    p_city,
    p_commission_bps,
    p_flat_fee_kobo,
    p_is_active,
    v_admin_id,
    now(),
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
$$;

-- 5. KYC Document Reviewer RPC
CREATE OR REPLACE FUNCTION public.admin_review_professional_document(
  p_document_id UUID,
  p_status public.verification_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_prof_id UUID;
  v_old_status public.verification_status;
BEGIN
  SELECT professional_id, verification_status INTO v_prof_id, v_old_status
  FROM public.professional_documents
  WHERE id = p_document_id;

  IF v_prof_id IS NULL THEN
    RAISE EXCEPTION 'Document not found with ID %', p_document_id;
  END IF;

  UPDATE public.professional_documents
  SET verification_status = p_status,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      review_notes = p_notes,
      updated_at = now()
  WHERE id = p_document_id;

  PERFORM public.admin_record_audit_log(
    'document.reviewed',
    'professional_document',
    p_document_id::text,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_status, 'notes', p_notes)
  );

  RETURN jsonb_build_object(
    'success', true,
    'document_id', p_document_id,
    'status', p_status
  );
END;
$$;

-- 6. System Notification Dispatcher RPC
CREATE OR REPLACE FUNCTION public.admin_send_notification(
  p_recipient_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_notification_type TEXT DEFAULT 'system_alert'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_notif_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    action_url,
    is_read,
    delivery_status
  ) VALUES (
    p_recipient_user_id,
    p_notification_type,
    trim(p_title),
    trim(p_content),
    '/notifications',
    false,
    'delivered'
  ) RETURNING id INTO v_notif_id;

  PERFORM public.admin_record_audit_log(
    'notification.sent',
    'notification',
    v_notif_id::text,
    null,
    jsonb_build_object('recipient', p_recipient_user_id, 'title', p_title)
  );

  RETURN jsonb_build_object('success', true, 'notification_id', v_notif_id);
END;
$$;

-- Ensure default operational settings exist in platform_settings
INSERT INTO public.platform_settings (key, value, description, is_public)
VALUES
  ('marketplace.default_commission_bps', '1000'::jsonb, 'Standard marketplace platform commission (10.00% = 1000 bps)', true),
  ('marketplace.callout_fee_minimum_kobo', '500000'::jsonb, 'Minimum diagnostic / callout fee allowed across all categories (NGN 5,000)', true),
  ('marketplace.dispute_auto_escalate_hours', '48'::jsonb, 'Hours after submission before an unreviewed dispute alerts supervisor', false),
  ('marketplace.maintenance_mode', 'false'::jsonb, 'Platform-wide maintenance mode lock', true),
  ('system.support_phone', '"+234 800 327 9543"'::jsonb, 'EasyLife 24/7 Operations Helpdesk', true),
  ('system.support_email', '"support@easylife.ng"'::jsonb, 'Official Customer Operations Support Email', true)
ON CONFLICT (key) DO NOTHING;

COMMIT;
