-- ============================================================================
-- EasyLife Security Hardening Migration (Prompt 23 Pilot Pre-Launch Audit)
-- Hardens SECURITY DEFINER RPCs and PostgreSQL EXECUTE privileges so:
--   1. Internal/admin provisioning, risk, AI logging, and delivery webhooks
--      cannot be invoked by anon or ordinary authenticated users via PostgREST.
--   2. Every admin SECURITY DEFINER RPC enforces is_admin() unless invoked by
--      service_role / database owner.
--   3. Every Business Portal SECURITY DEFINER RPC enforces business ownership/
--      membership (has_business_read_access / has_business_write_access) and
--      prevents actor/tenant spoofing across companies.
--   4. Booking/messaging helper RPCs reject anon calls and cross-user spoofing.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. CRITICAL: Lock down provision_initial_admin to service_role / DB owner
-- ----------------------------------------------------------------------------
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
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_active, assigned_at)
  VALUES (v_user_id, 'admin', true, now())
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_active = true,
      revoked_at = NULL,
      assigned_at = now();

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
$function$;

REVOKE ALL ON FUNCTION public.provision_initial_admin(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_initial_admin(text, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. Harden Admin SECURITY DEFINER RPCs missing explicit is_admin() checks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_total_customers
  FROM public.profiles
  WHERE deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_total_professionals
  FROM public.professional_profiles
  WHERE deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_verified_professionals
  FROM public.professional_profiles
  WHERE verification_status = 'approved' AND deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_pending_verifications
  FROM public.professional_profiles
  WHERE verification_status = 'pending' AND deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_total_businesses
  FROM public.businesses
  WHERE deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_total_bookings
  FROM public.bookings;

  SELECT COUNT(*)::INTEGER INTO v_active_bookings
  FROM public.bookings
  WHERE status IN ('confirmed', 'in_progress');

  SELECT COUNT(*)::INTEGER INTO v_completed_bookings
  FROM public.bookings
  WHERE status = 'completed';

  SELECT COUNT(*)::INTEGER INTO v_open_disputes
  FROM public.disputes
  WHERE status NOT IN ('resolved_for_customer', 'resolved_for_professional', 'closed');

  SELECT COALESCE(SUM(platform_commission_kobo), 0)::BIGINT INTO v_platform_revenue_kobo
  FROM public.payments
  WHERE status = 'succeeded';

  IF v_platform_revenue_kobo = 0 THEN
    SELECT COALESCE(SUM(agreed_amount_kobo * 10 / 100), 0)::BIGINT INTO v_platform_revenue_kobo
    FROM public.bookings
    WHERE status = 'completed';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.admin_record_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_values jsonb DEFAULT NULL::jsonb,
  p_new_values jsonb DEFAULT NULL::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_log_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.admin_review_professional_document(
  p_document_id uuid,
  p_status public.verification_status,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_prof_id UUID;
  v_old_status public.verification_status;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to review documents.';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.admin_send_notification(
  p_recipient_user_id uuid,
  p_title text,
  p_content text,
  p_notification_type text DEFAULT 'system_alert'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notif_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

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
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_platform_setting(
  p_key text,
  p_value jsonb,
  p_description text DEFAULT NULL::text,
  p_is_public boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_val JSONB;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required.';
  END IF;

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
$function$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_ai_assistant_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_assistant_metrics() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_record_audit_log(text, text, text, jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_audit_log(text, text, text, jsonb, jsonb, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_review_professional_document(uuid, public.verification_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_professional_document(uuid, public.verification_status, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_review_professional_verification(uuid, public.verification_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_professional_verification(uuid, public.verification_status, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_moderate_review(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_review(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_resolve_dispute(uuid, public.dispute_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_dispute(uuid, public.dispute_status, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_update_dispute(uuid, public.dispute_status, uuid, text, text, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_dispute(uuid, public.dispute_status, uuid, text, text, text, bigint) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_set_user_suspension(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_suspension(uuid, boolean, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_send_notification(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_notification(uuid, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_set_commission_setting(uuid, text, integer, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_commission_setting(uuid, text, integer, integer, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_set_platform_setting(text, jsonb, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_platform_setting(text, jsonb, text, boolean) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Harden Business Portal SECURITY DEFINER RPCs (Tenant & Role Isolation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_business_account(
  p_owner_id uuid,
  p_name text,
  p_slug text,
  p_contact_email text,
  p_contact_phone text DEFAULT NULL::text,
  p_industry text DEFAULT NULL::text,
  p_registration_number text DEFAULT NULL::text,
  p_city text DEFAULT 'Port Harcourt'::text,
  p_state text DEFAULT 'Rivers State'::text,
  p_address text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_id UUID;
  v_existing UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'FORBIDDEN: Authentication required to create a business account.';
    END IF;
    IF p_owner_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'FORBIDDEN: Cannot create a business account for another user.';
    END IF;
  END IF;

  SELECT id INTO v_existing FROM public.businesses WHERE slug = lower(trim(p_slug));
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'A business with slug "%" already exists.', p_slug;
  END IF;

  INSERT INTO public.businesses (
    owner_id,
    name,
    slug,
    contact_email,
    contact_phone,
    industry,
    registration_number,
    city,
    state,
    address,
    verification_status,
    is_active
  ) VALUES (
    p_owner_id,
    trim(p_name),
    lower(trim(p_slug)),
    lower(trim(p_contact_email)),
    p_contact_phone,
    p_industry,
    p_registration_number,
    p_city,
    p_state,
    p_address,
    'approved',
    true
  ) RETURNING id INTO v_business_id;

  INSERT INTO public.business_members (
    business_id,
    user_id,
    member_role,
    permissions,
    is_active
  ) VALUES (
    v_business_id,
    p_owner_id,
    'owner',
    '["all"]'::jsonb,
    true
  ) ON CONFLICT (business_id, user_id) DO NOTHING;

  INSERT INTO public.business_locations (
    business_id,
    name,
    address,
    city,
    state,
    contact_phone,
    is_headquarters
  ) VALUES (
    v_business_id,
    'Headquarters',
    COALESCE(p_address, 'Main Office, ' || p_city),
    p_city,
    p_state,
    p_contact_phone,
    true
  );

  RETURN jsonb_build_object(
    'success', true,
    'business_id', v_business_id,
    'name', p_name,
    'slug', p_slug
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_business_property(
  p_property_id uuid,
  p_business_id uuid,
  p_manager_user_id uuid,
  p_name text,
  p_code text,
  p_property_type public.property_type,
  p_address text,
  p_city text DEFAULT 'Port Harcourt'::text,
  p_state text DEFAULT 'Rivers State'::text,
  p_lga_or_district text DEFAULT NULL::text,
  p_units_count integer DEFAULT 1,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_res_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_write_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to manage properties for this business.';
    END IF;
    IF p_manager_user_id IS NOT NULL AND p_manager_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'FORBIDDEN: Manager identity mismatch.';
    END IF;
  END IF;

  IF p_property_id IS NULL THEN
    INSERT INTO public.properties (
      business_id,
      manager_user_id,
      name,
      code,
      property_type,
      address,
      city,
      state,
      lga_or_district,
      units_count,
      notes,
      is_active
    ) VALUES (
      p_business_id,
      p_manager_user_id,
      trim(p_name),
      upper(trim(p_code)),
      p_property_type,
      trim(p_address),
      p_city,
      p_state,
      p_lga_or_district,
      GREATEST(1, p_units_count),
      p_notes,
      true
    ) RETURNING id INTO v_res_id;
  ELSE
    UPDATE public.properties SET
      manager_user_id = COALESCE(p_manager_user_id, manager_user_id),
      name = trim(p_name),
      code = upper(trim(p_code)),
      property_type = p_property_type,
      address = trim(p_address),
      city = p_city,
      state = p_state,
      lga_or_district = p_lga_or_district,
      units_count = GREATEST(1, p_units_count),
      notes = p_notes,
      updated_at = now()
    WHERE id = p_property_id AND business_id = p_business_id
    RETURNING id INTO v_res_id;

    IF v_res_id IS NULL THEN
      RAISE EXCEPTION 'Property % not found for business %', p_property_id, p_business_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'property_id', v_res_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_business_asset(
  p_asset_id uuid,
  p_business_id uuid,
  p_property_id uuid,
  p_category_id uuid,
  p_asset_category public.asset_category_type,
  p_name text,
  p_asset_tag text,
  p_brand text DEFAULT NULL::text,
  p_model_number text DEFAULT NULL::text,
  p_serial_number text DEFAULT NULL::text,
  p_location_in_property text DEFAULT NULL::text,
  p_status public.asset_status DEFAULT 'operational'::public.asset_status,
  p_installation_date date DEFAULT NULL::date,
  p_maintenance_interval_days integer DEFAULT 90,
  p_specifications jsonb DEFAULT '{}'::jsonb,
  p_documents jsonb DEFAULT '[]'::jsonb,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_res_id UUID;
  v_next_due TIMESTAMPTZ;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_write_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to manage assets for this business.';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Property % does not belong to business %', p_property_id, p_business_id;
  END IF;

  v_next_due := now() + (COALESCE(p_maintenance_interval_days, 90) || ' days')::interval;

  IF p_asset_id IS NULL THEN
    INSERT INTO public.assets (
      business_id,
      property_id,
      category_id,
      asset_category,
      name,
      asset_tag,
      brand,
      model_number,
      serial_number,
      location_in_property,
      status,
      installation_date,
      purchase_date,
      maintenance_interval_days,
      next_service_due_at,
      specifications,
      documents,
      notes
    ) VALUES (
      p_business_id,
      p_property_id,
      p_category_id,
      p_asset_category,
      trim(p_name),
      upper(trim(p_asset_tag)),
      p_brand,
      p_model_number,
      p_serial_number,
      p_location_in_property,
      p_status,
      p_installation_date,
      p_installation_date,
      COALESCE(p_maintenance_interval_days, 90),
      v_next_due,
      p_specifications,
      p_documents,
      p_notes
    ) RETURNING id INTO v_res_id;
  ELSE
    UPDATE public.assets SET
      property_id = p_property_id,
      category_id = COALESCE(p_category_id, category_id),
      asset_category = p_asset_category,
      name = trim(p_name),
      asset_tag = upper(trim(p_asset_tag)),
      brand = p_brand,
      model_number = p_model_number,
      serial_number = p_serial_number,
      location_in_property = p_location_in_property,
      status = p_status,
      installation_date = COALESCE(p_installation_date, installation_date),
      maintenance_interval_days = COALESCE(p_maintenance_interval_days, maintenance_interval_days),
      specifications = p_specifications,
      documents = p_documents,
      notes = p_notes,
      updated_at = now()
    WHERE id = p_asset_id AND business_id = p_business_id
    RETURNING id INTO v_res_id;

    IF v_res_id IS NULL THEN
      RAISE EXCEPTION 'Asset % not found for business %', p_asset_id, p_business_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'asset_id', v_res_id
  );
END;
$function$;

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
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_write_access(p_business_id) OR public.is_business_member(p_business_id) OR public.is_admin()) THEN
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

CREATE OR REPLACE FUNCTION public.record_business_maintenance_completion(
  p_request_id uuid,
  p_business_id uuid,
  p_property_id uuid,
  p_asset_id uuid,
  p_recorded_by_user_id uuid,
  p_performed_by_name text,
  p_summary text,
  p_work_performed text,
  p_cost_kobo bigint,
  p_parts_replaced text DEFAULT NULL::text,
  p_performed_by_professional_id uuid DEFAULT NULL::uuid,
  p_invoice_number text DEFAULT NULL::text,
  p_invoice_url text DEFAULT NULL::text,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_write_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to record maintenance completion for this business.';
    END IF;
    IF p_recorded_by_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'FORBIDDEN: Recorder identity mismatch.';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Property % does not belong to business %', p_property_id, p_business_id;
  END IF;

  IF p_asset_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.assets WHERE id = p_asset_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Asset % does not belong to business %', p_asset_id, p_business_id;
  END IF;

  INSERT INTO public.maintenance_records (
    business_id,
    property_id,
    asset_id,
    performed_by_professional_id,
    performed_by_name,
    recorded_by_user_id,
    maintenance_type,
    summary,
    work_performed,
    parts_replaced,
    cost_kobo,
    performed_at,
    attachments
  ) VALUES (
    p_business_id,
    p_property_id,
    p_asset_id,
    p_performed_by_professional_id,
    trim(p_performed_by_name),
    p_recorded_by_user_id,
    'corrective',
    trim(p_summary),
    trim(p_work_performed),
    p_parts_replaced,
    COALESCE(p_cost_kobo, 0),
    now(),
    COALESCE(p_attachments, '[]'::jsonb)
  ) RETURNING id INTO v_record_id;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.maintenance_requests SET
      status = 'completed',
      actual_cost_kobo = COALESCE(p_cost_kobo, actual_cost_kobo),
      invoice_number = COALESCE(p_invoice_number, invoice_number),
      invoice_url = COALESCE(p_invoice_url, invoice_url),
      resolution_notes = p_work_performed,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_request_id AND business_id = p_business_id;
  END IF;

  IF p_asset_id IS NOT NULL THEN
    UPDATE public.assets SET
      status = 'operational',
      last_serviced_at = now(),
      next_service_due_at = now() + (maintenance_interval_days || ' days')::interval,
      updated_at = now()
    WHERE id = p_asset_id AND business_id = p_business_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'maintenance_record_id', v_record_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_business_dashboard_metrics(
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_properties INTEGER;
  v_registered_assets INTEGER;
  v_open_requests INTEGER;
  v_upcoming_maintenance INTEGER;
  v_overdue_maintenance INTEGER;
  v_total_expenditure_kobo BIGINT;
  v_recent_activities JSONB;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_read_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to view business metrics.';
    END IF;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_total_properties
  FROM public.properties
  WHERE business_id = p_business_id AND deleted_at IS NULL AND is_active = true;

  SELECT COUNT(*)::INTEGER INTO v_registered_assets
  FROM public.assets
  WHERE business_id = p_business_id AND deleted_at IS NULL;

  SELECT COUNT(*)::INTEGER INTO v_open_requests
  FROM public.maintenance_requests
  WHERE business_id = p_business_id AND status IN ('open', 'quote_requested', 'scheduled', 'in_progress');

  SELECT COUNT(*)::INTEGER INTO v_upcoming_maintenance
  FROM public.maintenance_schedules
  WHERE business_id = p_business_id
    AND is_active = true
    AND next_due_date >= CURRENT_DATE
    AND next_due_date <= (CURRENT_DATE + INTERVAL '30 days');

  SELECT COUNT(*)::INTEGER INTO v_overdue_maintenance
  FROM public.maintenance_schedules
  WHERE business_id = p_business_id
    AND is_active = true
    AND next_due_date < CURRENT_DATE;

  SELECT COALESCE(SUM(cost_kobo), 0)::BIGINT INTO v_total_expenditure_kobo
  FROM public.maintenance_records
  WHERE business_id = p_business_id;

  SELECT COALESCE(jsonb_agg(act), '[]'::jsonb) INTO v_recent_activities
  FROM (
    SELECT
      r.id,
      'record' AS activity_type,
      r.summary AS title,
      p.name AS property_name,
      COALESCE(a.name, 'General Property') AS asset_name,
      r.cost_kobo,
      r.performed_at AS activity_date,
      'completed' AS status
    FROM public.maintenance_records r
    JOIN public.properties p ON p.id = r.property_id
    LEFT JOIN public.assets a ON a.id = r.asset_id
    WHERE r.business_id = p_business_id
    UNION ALL
    SELECT
      req.id,
      'request' AS activity_type,
      req.title,
      p.name AS property_name,
      COALESCE(a.name, 'General Property') AS asset_name,
      req.estimated_cost_kobo AS cost_kobo,
      req.created_at AS activity_date,
      req.status::TEXT AS status
    FROM public.maintenance_requests req
    JOIN public.properties p ON p.id = req.property_id
    LEFT JOIN public.assets a ON a.id = req.asset_id
    WHERE req.business_id = p_business_id AND req.status != 'completed'
    ORDER BY activity_date DESC
    LIMIT 8
  ) act;

  RETURN jsonb_build_object(
    'total_properties', v_total_properties,
    'registered_assets', v_registered_assets,
    'open_maintenance_requests', v_open_requests,
    'upcoming_maintenance', v_upcoming_maintenance,
    'overdue_maintenance', v_overdue_maintenance,
    'total_expenditure_kobo', v_total_expenditure_kobo,
    'total_expenditure_naira', v_total_expenditure_kobo / 100.0,
    'recent_activities', v_recent_activities
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_intelligent_maintenance_reminders(
  p_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reminders JSONB := '[]'::jsonb;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR NOT (public.has_business_read_access(p_business_id) OR public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient permissions to view maintenance reminders.';
    END IF;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'schedule_id', s.id,
        'title', s.title,
        'description', s.description,
        'frequency', s.frequency,
        'interval_days', s.interval_days,
        'next_due_date', s.next_due_date,
        'last_completed_at', s.last_completed_at,
        'status', CASE
          WHEN s.next_due_date < CURRENT_DATE THEN 'overdue'
          WHEN s.next_due_date = CURRENT_DATE THEN 'due_today'
          WHEN s.next_due_date <= (CURRENT_DATE + INTERVAL '14 days') THEN 'upcoming'
          ELSE 'scheduled'
        END,
        'days_remaining', (s.next_due_date - CURRENT_DATE),
        'property_id', p.id,
        'property_name', p.name,
        'property_address', p.address,
        'asset_id', a.id,
        'asset_name', a.name,
        'asset_category', a.asset_category,
        'asset_brand', a.brand,
        'asset_model', a.model_number,
        'category_name', c.name,
        'category_slug', c.slug,
        'reminder_basis', 'Configured interval: Every ' || s.interval_days || ' days (Manual configuration)',
        'non_predictive_disclaimer', 'This schedule reminder is strictly calculated from your configured maintenance interval and equipment records. It does not predict mechanical failure.'
      )
      ORDER BY s.next_due_date ASC
    ),
    '[]'::jsonb
  )
  INTO v_reminders
  FROM public.maintenance_schedules s
  JOIN public.properties p ON s.property_id = p.id
  JOIN public.service_categories c ON s.category_id = c.id
  LEFT JOIN public.assets a ON s.asset_id = a.id
  WHERE s.business_id = p_business_id
    AND s.is_active = true
    AND s.deleted_at IS NULL;

  RETURN v_reminders;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_business_account(uuid, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_account(uuid, text, text, text, text, text, text, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.manage_business_property(uuid, uuid, uuid, text, text, public.property_type, text, text, text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_business_property(uuid, uuid, uuid, text, text, public.property_type, text, text, text, text, integer, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.manage_business_asset(uuid, uuid, uuid, uuid, public.asset_category_type, text, text, text, text, text, text, public.asset_status, date, integer, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_business_asset(uuid, uuid, uuid, uuid, public.asset_category_type, text, text, text, text, text, text, public.asset_status, date, integer, jsonb, jsonb, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_business_maintenance_request(uuid, uuid, uuid, uuid, uuid, text, text, public.fault_severity_level, uuid, timestamp with time zone, bigint, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_maintenance_request(uuid, uuid, uuid, uuid, uuid, text, text, public.fault_severity_level, uuid, timestamp with time zone, bigint, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_business_maintenance_completion(uuid, uuid, uuid, uuid, uuid, text, text, text, bigint, text, uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_business_maintenance_completion(uuid, uuid, uuid, uuid, uuid, text, text, text, bigint, text, uuid, text, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_business_dashboard_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_dashboard_metrics(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_intelligent_maintenance_reminders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_intelligent_maintenance_reminders(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Lock down internal/system RPCs & Harden user-scoped helper RPCs
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid, text[], jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid, text[], jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.update_notification_delivery_status(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_notification_delivery_status(uuid, text, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_risk_flag(text, uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_risk_flag(text, uuid, text, text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.evaluate_account_risk_rules(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_account_risk_rules(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.evaluate_review_risk_rules(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_review_risk_rules(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(text, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(text, uuid, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.record_ai_assistant_log(text, text, uuid, text, text, text, integer, integer, integer, numeric, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_assistant_log(text, text, uuid, text, text, text, integer, integer, integer, numeric, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.create_support_ticket(text, text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text, text, text, text, text, text, uuid) TO service_role;

-- User-scoped RPCs: allow only owner user / admin / service_role / db owner
CREATE OR REPLACE FUNCTION public.register_user_device_token(
  p_user_id uuid,
  p_device_token text,
  p_platform text,
  p_device_name text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR (p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Cannot register device token for another user.';
    END IF;
  END IF;

  INSERT INTO public.user_device_tokens (
    user_id,
    device_token,
    platform,
    device_name,
    is_active,
    last_used_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_device_token,
    p_platform,
    p_device_name,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id, device_token) DO UPDATE
  SET is_active = true,
      last_used_at = now(),
      device_name = COALESCE(p_device_name, public.user_device_tokens.device_name),
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_duplicate_booking(
  p_customer_id uuid,
  p_category_id uuid,
  p_service_address text,
  p_title text,
  p_window_seconds integer DEFAULT 180
)
RETURNS TABLE(
  is_duplicate boolean,
  existing_booking_id uuid,
  existing_reference_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
  v_ref TEXT;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR (p_customer_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Cannot query another customer booking state.';
    END IF;
  END IF;

  SELECT b.id, b.reference_code
  INTO v_id, v_ref
  FROM public.bookings b
  WHERE b.customer_id = p_customer_id
    AND b.category_id = p_category_id
    AND lower(trim(b.service_address)) = lower(trim(p_service_address))
    AND lower(trim(b.title)) = lower(trim(p_title))
    AND b.status IN ('draft', 'submitted', 'pending_pro_response', 'open')
    AND b.created_at > (now() - (p_window_seconds || ' seconds')::interval)
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_id, v_ref;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_appointment_conflict(
  p_professional_id uuid,
  p_start timestamp with time zone,
  p_end timestamp with time zone,
  p_exclude_appointment_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conflict_count INT;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: Authentication required.';
  END IF;

  SELECT count(*)
  INTO v_conflict_count
  FROM public.appointments
  WHERE professional_id = p_professional_id
    AND status IN ('requested', 'confirmed')
    AND (p_exclude_appointment_id IS NULL OR id <> p_exclude_appointment_id)
    AND scheduled_start_at < p_end
    AND scheduled_end_at > p_start;

  RETURN v_conflict_count > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_unread_count(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_unread INT;
BEGIN
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR (p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
      RAISE EXCEPTION 'FORBIDDEN: Cannot inspect another user unread count.';
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT coalesce(sum(unread_count), 0)::INT
  INTO v_total_unread
  FROM public.conversation_members
  WHERE user_id = p_user_id;

  RETURN v_total_unread;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_user_device_token(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_user_device_token(uuid, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_duplicate_booking(uuid, uuid, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_duplicate_booking(uuid, uuid, text, text, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_appointment_conflict(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_appointment_conflict(uuid, timestamp with time zone, timestamp with time zone, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_conversation_unread_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conversation_unread_count(uuid) TO authenticated, service_role;

-- Also ensure remaining authenticated-only transactional RPCs are revoked from anon
-- while preserving EXECUTE for authenticated users and service_role
REVOKE ALL ON FUNCTION public.accept_booking_quotation(uuid, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_quotation(uuid, uuid, timestamp with time zone, timestamp with time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_quotation_and_schedule(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_quotation_and_schedule(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_booking_with_policy(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_policy(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirm_booking_appointment(uuid, timestamp with time zone, timestamp with time zone, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_booking_appointment(uuid, timestamp with time zone, timestamp with time zone, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirm_booking_completion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_booking_completion(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_or_get_booking_conversation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_or_get_booking_conversation(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.customer_report_incomplete_work(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_report_incomplete_work(uuid, text, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.decline_booking_quotation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_booking_quotation(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.mark_conversation_as_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.pro_submit_job_completion(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pro_submit_job_completion(uuid, text, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.request_quotation_clarification(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_quotation_clarification(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.send_conversation_message(uuid, text, text, text, text, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_conversation_message(uuid, text, text, text, text, text, bigint) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_account_deletion_request(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_account_deletion_request(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_booking_dispute(uuid, text, text, bigint, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_booking_dispute(uuid, text, text, bigint, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_booking_review(uuid, smallint, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_booking_review(uuid, smallint, text, text, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_or_revise_quotation(uuid, uuid, text, integer, timestamp with time zone, timestamp with time zone, text, boolean, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_or_revise_quotation(uuid, uuid, text, integer, timestamp with time zone, timestamp with time zone, text, boolean, jsonb, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_booking_job_execution(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_booking_job_execution(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.withdraw_quotation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_quotation(uuid, text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
