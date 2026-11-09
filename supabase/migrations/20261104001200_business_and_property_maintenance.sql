-- =============================================================================
-- Migration: 20261104001200_business_and_property_maintenance.sql
-- Prompt 15: EasyLife Business Management Portal & Property Maintenance
-- =============================================================================

BEGIN;

-- 1. Create Enums for Business & Asset Management
DO $$ BEGIN
  CREATE TYPE public.asset_category_type AS ENUM (
    'air_conditioner',
    'generator',
    'inverter',
    'solar_system',
    'refrigeration',
    'pump',
    'electrical',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fault_severity_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.maintenance_request_status_type AS ENUM (
    'open',
    'quote_requested',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invitation_status_type AS ENUM (
    'pending',
    'accepted',
    'revoked',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enhance assets table with Prompt 15 fields
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS asset_category public.asset_category_type NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS installation_date DATE,
  ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER NOT NULL DEFAULT 90 CHECK (maintenance_interval_days > 0),
  ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Create Business Locations table (branches, operating sites)
CREATE TABLE IF NOT EXISTS public.business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  lga TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_locations_business_id ON public.business_locations(business_id);

-- 4. Create Business Team Invitations table
CREATE TABLE IF NOT EXISTS public.business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role public.business_member_role NOT NULL DEFAULT 'facility_manager',
  permissions JSONB NOT NULL DEFAULT '["view", "create_requests"]'::jsonb,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status public.invitation_status_type NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_invitations_business ON public.business_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_token ON public.business_invitations(token);

-- 5. Create Maintenance Requests (Fault reports & maintenance jobs)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 5),
  fault_severity public.fault_severity_level NOT NULL DEFAULT 'medium',
  status public.maintenance_request_status_type NOT NULL DEFAULT 'open',
  scheduled_date TIMESTAMPTZ,
  estimated_cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (estimated_cost_kobo >= 0),
  actual_cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (actual_cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  invoice_url TEXT,
  invoice_number TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_business ON public.maintenance_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_asset ON public.maintenance_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

-- 6. Enhance Business Members with Custom Permissions JSON
ALTER TABLE public.business_members
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '["all"]'::jsonb;

-- 7. Stored Procedures / RPCs for Business Management Portal

-- A. Register or Update Business Account
CREATE OR REPLACE FUNCTION public.create_business_account(
  p_owner_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_registration_number TEXT DEFAULT NULL,
  p_city TEXT DEFAULT 'Port Harcourt',
  p_state TEXT DEFAULT 'Rivers State',
  p_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_existing UUID;
BEGIN
  -- Check if user already owns a business with this slug or name
  SELECT id INTO v_existing FROM public.businesses WHERE slug = p_slug;
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

  -- Add owner as the primary business member
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

  -- Register primary headquarters location
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
$$;

-- B. Create or Edit Property
CREATE OR REPLACE FUNCTION public.manage_business_property(
  p_property_id UUID,
  p_business_id UUID,
  p_manager_user_id UUID,
  p_name TEXT,
  p_code TEXT,
  p_property_type public.property_type,
  p_address TEXT,
  p_city TEXT DEFAULT 'Port Harcourt',
  p_state TEXT DEFAULT 'Rivers State',
  p_lga_or_district TEXT DEFAULT NULL,
  p_units_count INTEGER DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res_id UUID;
BEGIN
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
$$;

-- C. Register or Edit Maintainable Asset
CREATE OR REPLACE FUNCTION public.manage_business_asset(
  p_asset_id UUID,
  p_business_id UUID,
  p_property_id UUID,
  p_category_id UUID,
  p_asset_category public.asset_category_type,
  p_name TEXT,
  p_asset_tag TEXT,
  p_brand TEXT DEFAULT NULL,
  p_model_number TEXT DEFAULT NULL,
  p_serial_number TEXT DEFAULT NULL,
  p_location_in_property TEXT DEFAULT NULL,
  p_status public.asset_status DEFAULT 'operational',
  p_installation_date DATE DEFAULT NULL,
  p_maintenance_interval_days INTEGER DEFAULT 90,
  p_specifications JSONB DEFAULT '{}'::jsonb,
  p_documents JSONB DEFAULT '[]'::jsonb,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res_id UUID;
  v_next_due TIMESTAMPTZ;
BEGIN
  -- Verify property belongs to business
  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Property % does not belong to business %', p_property_id, p_business_id;
  END IF;

  -- Compute next service due date
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
$$;

-- D. Report Fault & Create Maintenance Request
CREATE OR REPLACE FUNCTION public.create_business_maintenance_request(
  p_business_id UUID,
  p_property_id UUID,
  p_asset_id UUID,
  p_category_id UUID,
  p_requested_by UUID,
  p_title TEXT,
  p_description TEXT,
  p_fault_severity public.fault_severity_level DEFAULT 'medium',
  p_assigned_professional_id UUID DEFAULT NULL,
  p_scheduled_date TIMESTAMPTZ DEFAULT NULL,
  p_estimated_cost_kobo BIGINT DEFAULT 0,
  p_photos JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_initial_status public.maintenance_request_status_type;
BEGIN
  -- Verify property
  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Property % does not belong to business %', p_property_id, p_business_id;
  END IF;

  -- If asset provided, verify asset
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

  -- If asset status is affected by high/critical fault, update asset status to needs_maintenance
  IF p_asset_id IS NOT NULL AND p_fault_severity IN ('high', 'critical') THEN
    UPDATE public.assets SET status = 'needs_maintenance', updated_at = now()
    WHERE id = p_asset_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'maintenance_request_id', v_request_id,
    'status', v_initial_status
  );
END;
$$;

-- E. Record Maintenance Activity & Cost with Invoice
CREATE OR REPLACE FUNCTION public.record_business_maintenance_completion(
  p_request_id UUID,
  p_business_id UUID,
  p_property_id UUID,
  p_asset_id UUID,
  p_recorded_by_user_id UUID,
  p_performed_by_name TEXT,
  p_summary TEXT,
  p_work_performed TEXT,
  p_cost_kobo BIGINT,
  p_parts_replaced TEXT DEFAULT NULL,
  p_performed_by_professional_id UUID DEFAULT NULL,
  p_invoice_number TEXT DEFAULT NULL,
  p_invoice_url TEXT DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Insert into maintenance_records
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

  -- If linked to maintenance_request, mark request as completed
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

  -- Update asset's last serviced timestamp and return to operational
  IF p_asset_id IS NOT NULL THEN
    UPDATE public.assets SET
      status = 'operational',
      last_serviced_at = now(),
      next_service_due_at = now() + (maintenance_interval_days || ' days')::interval,
      updated_at = now()
    WHERE id = p_asset_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'maintenance_record_id', v_record_id
  );
END;
$$;

-- F. Dashboard Aggregation Engine
CREATE OR REPLACE FUNCTION public.get_business_dashboard_metrics(
  p_business_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_properties INTEGER;
  v_registered_assets INTEGER;
  v_open_requests INTEGER;
  v_upcoming_maintenance INTEGER;
  v_overdue_maintenance INTEGER;
  v_total_expenditure_kobo BIGINT;
  v_recent_activities JSONB;
BEGIN
  -- 1. Total Properties
  SELECT COUNT(*)::INTEGER INTO v_total_properties
  FROM public.properties
  WHERE business_id = p_business_id AND deleted_at IS NULL AND is_active = true;

  -- 2. Registered Assets
  SELECT COUNT(*)::INTEGER INTO v_registered_assets
  FROM public.assets
  WHERE business_id = p_business_id AND deleted_at IS NULL;

  -- 3. Open Maintenance Requests
  SELECT COUNT(*)::INTEGER INTO v_open_requests
  FROM public.maintenance_requests
  WHERE business_id = p_business_id AND status IN ('open', 'quote_requested', 'scheduled', 'in_progress');

  -- 4. Upcoming Maintenance (Next 30 days)
  SELECT COUNT(*)::INTEGER INTO v_upcoming_maintenance
  FROM public.maintenance_schedules
  WHERE business_id = p_business_id 
    AND is_active = true 
    AND next_due_date >= CURRENT_DATE 
    AND next_due_date <= (CURRENT_DATE + INTERVAL '30 days');

  -- 5. Overdue Maintenance
  SELECT COUNT(*)::INTEGER INTO v_overdue_maintenance
  FROM public.maintenance_schedules
  WHERE business_id = p_business_id 
    AND is_active = true 
    AND next_due_date < CURRENT_DATE;

  -- 6. Total Maintenance Expenditure
  SELECT COALESCE(SUM(cost_kobo), 0)::BIGINT INTO v_total_expenditure_kobo
  FROM public.maintenance_records
  WHERE business_id = p_business_id;

  -- 7. Recent Maintenance Activities (Top 8 combined from records & requests)
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
$$;

-- 8. Row Level Security Policies for Prompt 15 Tables

ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS: business_locations
DROP POLICY IF EXISTS "Business members can view business locations" ON public.business_locations;
CREATE POLICY "Business members can view business locations"
  ON public.business_locations
  FOR SELECT
  USING (
    public.is_business_member(business_id) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Business managers can manage business locations" ON public.business_locations;
CREATE POLICY "Business managers can manage business locations"
  ON public.business_locations
  FOR ALL
  USING (
    public.is_business_member(business_id) OR
    public.is_admin()
  );

-- RLS: business_invitations
DROP POLICY IF EXISTS "Business members can view invitations" ON public.business_invitations;
CREATE POLICY "Business members can view invitations"
  ON public.business_invitations
  FOR SELECT
  USING (
    public.is_business_member(business_id) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Business owners can manage invitations" ON public.business_invitations;
CREATE POLICY "Business owners can manage invitations"
  ON public.business_invitations
  FOR ALL
  USING (
    public.is_business_member(business_id) OR
    public.is_admin()
  );

-- RLS: maintenance_requests
DROP POLICY IF EXISTS "Business members can view maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Business members can view maintenance requests"
  ON public.maintenance_requests
  FOR SELECT
  USING (
    public.is_business_member(business_id) OR
    assigned_professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Business members can create/manage maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Business members can create/manage maintenance requests"
  ON public.maintenance_requests
  FOR ALL
  USING (
    public.is_business_member(business_id) OR
    public.is_admin()
  );

COMMIT;
