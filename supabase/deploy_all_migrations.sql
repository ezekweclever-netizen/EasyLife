-- ==============================================================================
-- EASYLIFE COMPLETE DATABASE SCHEMA DEPLOYMENT SCRIPT
-- Generated for Supabase Project: sakoffgcpsygqjgrgfbf
-- Includes: Extensions, Enums, 34 Relational Tables, Triggers, RPCs, Storage & RLS
-- ==============================================================================

BEGIN;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261104000100_extensions_enums_and_helpers.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Migration: 20261104000100_extensions_enums_and_helpers.sql
-- Description: Core PostgreSQL extensions, domain ENUM types, timestamp
--              triggers, reference code generators, and immutability guards.
-- ============================================================================
-- [BEGIN: 20261104000100_extensions_enums_and_helpers.sql]
-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain Enumerations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'customer',
      'professional',
      'business',
      'property_manager',
      'admin'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_platform') THEN
    CREATE TYPE public.device_platform AS ENUM (
      'web',
      'android',
      'ios'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM (
      'unsubmitted',
      'pending',
      'approved',
      'rejected',
      'suspended'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE public.document_type AS ENUM (
      'national_id_nin',
      'voters_card',
      'drivers_license',
      'international_passport',
      'trade_certificate',
      'cac_certificate',
      'utility_bill',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_member_role') THEN
    CREATE TYPE public.business_member_role AS ENUM (
      'owner',
      'admin',
      'facility_manager',
      'viewer'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'trialing',
      'active',
      'past_due',
      'cancelled',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE public.property_type AS ENUM (
      'residential',
      'commercial',
      'industrial',
      'mixed_use'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
    CREATE TYPE public.asset_status AS ENUM (
      'operational',
      'needs_maintenance',
      'under_repair',
      'decommissioned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
    CREATE TYPE public.urgency_level AS ENUM (
      'low',
      'normal',
      'high',
      'emergency'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'draft',
      'open',
      'quoted',
      'scheduled',
      'in_progress',
      'pro_marked_complete',
      'completed',
      'cancelled',
      'disputed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
    CREATE TYPE public.quotation_status AS ENUM (
      'pending',
      'accepted',
      'declined',
      'withdrawn',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_item_type') THEN
    CREATE TYPE public.quotation_item_type AS ENUM (
      'labor',
      'material',
      'callout',
      'transport',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'initiated',
      'pending',
      'succeeded',
      'failed',
      'refunded',
      'partially_refunded'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
    CREATE TYPE public.refund_status AS ENUM (
      'pending',
      'processed',
      'failed',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE public.dispute_status AS ENUM (
      'open',
      'under_review',
      'resolved_for_customer',
      'resolved_for_professional',
      'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_frequency') THEN
    CREATE TYPE public.maintenance_frequency AS ENUM (
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'biannual',
      'annual',
      'custom'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
    CREATE TYPE public.maintenance_type AS ENUM (
      'preventive',
      'corrective',
      'inspection',
      'emergency'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM (
      'open',
      'investigating',
      'action_taken',
      'dismissed'
    );
  END IF;
END
$$;

-- 3. Reusable Trigger Functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_row_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only and immutable. UPDATE and DELETE are prohibited.', TG_TABLE_NAME;
END;
$$;

-- 4. Human-Readable Reference Code Generator (e.g., EL-BK-20261104-A1B2C3)
CREATE OR REPLACE FUNCTION public.generate_reference_code(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  random_suffix TEXT;
BEGIN
  random_suffix := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  RETURN upper(prefix) || '-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || random_suffix;
END;
$$;
-- [COMMIT: 20261104000100_extensions_enums_and_helpers.sql]

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261104000200_identity_and_professionals.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Migration: 20261104000200_identity_and_professionals.sql
-- Description: Table Groups A (Identity & Access), Service Categories, and
--              B (Professional Management) with constraints, indexes, and
--              confidential/public data separation.
-- ============================================================================
-- [BEGIN: 20261104000200_identity_and_professionals.sql]
-- ============================================================================
-- GROUP A: IDENTITY AND ACCESS
-- ============================================================================

-- A1. profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  display_name TEXT,
  avatar_url TEXT,
  primary_role public.user_role NOT NULL DEFAULT 'customer',
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  address_line TEXT,
  preferred_currency CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (preferred_currency ~ '^[A-Z]{3}$'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_profiles_primary_role ON public.profiles(primary_role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- A2. user_roles (Explicit role assignments supporting multi-role accounts)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role) WHERE is_active = true;

-- A3. user_sessions (Session & device metadata for Web, Android, and iOS + FCM tokens)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform public.device_platform NOT NULL DEFAULT 'web',
  device_name TEXT,
  fcm_token TEXT,
  ip_address INET,
  user_agent TEXT,
  is_push_enabled BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_sessions_user_device_unique UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
  ON public.user_sessions(user_id, last_active_at DESC)
  WHERE revoked_at IS NULL;

CREATE TRIGGER trg_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth User Provisioning Trigger (Creates profile & user_roles row on signup)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested_role TEXT;
  v_safe_role public.user_role;
  v_full_name TEXT;
  v_city TEXT;
  v_state TEXT;
BEGIN
  v_requested_role := coalesce(NEW.raw_user_meta_data->>'role', 'customer');
  -- Prevent self-registration as 'admin'
  IF v_requested_role IN ('customer', 'professional', 'business', 'property_manager') THEN
    v_safe_role := v_requested_role::public.user_role;
  ELSE
    v_safe_role := 'customer';
  END IF;

  v_full_name := coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1));
  v_city := coalesce(nullif(trim(NEW.raw_user_meta_data->>'city'), ''), 'Port Harcourt');
  v_state := coalesce(nullif(trim(NEW.raw_user_meta_data->>'state'), ''), 'Rivers State');

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    display_name,
    primary_role,
    city,
    state
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_full_name,
    v_full_name,
    v_safe_role,
    v_city,
    v_state
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, v_safe_role, true)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- SERVICE CATEGORIES (Referenced by Professionals, Bookings & Assets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  default_commission_bps INTEGER NOT NULL DEFAULT 1000 CHECK (default_commission_bps BETWEEN 0 AND 5000),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_categories_slug_unique UNIQUE (slug),
  CONSTRAINT service_categories_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_active_order
  ON public.service_categories(is_active, display_order, name);

CREATE TRIGGER trg_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- GROUP B: PROFESSIONAL MANAGEMENT
-- ============================================================================

-- B1. professional_profiles (Public & operational professional attributes)
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL CHECK (char_length(trim(business_name)) >= 2),
  slug TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  years_of_experience SMALLINT NOT NULL DEFAULT 0 CHECK (years_of_experience BETWEEN 0 AND 70),
  verification_status public.verification_status NOT NULL DEFAULT 'unsubmitted',
  submitted_for_verification_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  base_callout_fee_kobo BIGINT NOT NULL DEFAULT 0 CHECK (base_callout_fee_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (average_rating BETWEEN 0.00 AND 5.00),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  completed_jobs_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_jobs_count >= 0),
  response_rate_pct SMALLINT NOT NULL DEFAULT 100 CHECK (response_rate_pct BETWEEN 0 AND 100),
  is_available BOOLEAN NOT NULL DEFAULT true,
  primary_city TEXT NOT NULL DEFAULT 'Port Harcourt',
  primary_state TEXT NOT NULL DEFAULT 'Rivers State',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT professional_profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT professional_profiles_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_pro_profiles_verification_city
  ON public.professional_profiles(verification_status, primary_city, is_available)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pro_profiles_rating
  ON public.professional_profiles(average_rating DESC, completed_jobs_count DESC)
  WHERE verification_status = 'approved' AND deleted_at IS NULL;

CREATE TRIGGER trg_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- B2. professional_services (Services offered & minor-unit pricing bounds)
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  min_price_kobo BIGINT NOT NULL DEFAULT 0 CHECK (min_price_kobo >= 0),
  max_price_kobo BIGINT CHECK (max_price_kobo IS NULL OR max_price_kobo >= min_price_kobo),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  description TEXT,
  is_primary_skill BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professional_services_pro_cat_unique UNIQUE (professional_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_pro_services_category
  ON public.professional_services(category_id, professional_id)
  WHERE is_active = true;

CREATE TRIGGER trg_professional_services_updated_at
  BEFORE UPDATE ON public.professional_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- B3. professional_service_areas (Geographic coverage in Port Harcourt, Lagos, Abuja, etc.)
CREATE TABLE IF NOT EXISTS public.professional_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lga_or_district TEXT NOT NULL DEFAULT 'All Districts',
  service_radius_km INTEGER NOT NULL DEFAULT 15 CHECK (service_radius_km BETWEEN 1 AND 200),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pro_service_areas_unique UNIQUE (professional_id, city, lga_or_district)
);

CREATE INDEX IF NOT EXISTS idx_pro_service_areas_city_district
  ON public.professional_service_areas(city, lga_or_district, professional_id)
  WHERE is_active = true;

CREATE TRIGGER trg_professional_service_areas_updated_at
  BEFORE UPDATE ON public.professional_service_areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- B4. professional_documents (Confidential KYC & trade documents in private storage)
CREATE TABLE IF NOT EXISTS public.professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  document_type public.document_type NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'verification-documents' CHECK (storage_bucket = 'verification-documents'),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  document_number_masked TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT professional_documents_storage_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_pro_documents_pro_status
  ON public.professional_documents(professional_id, verification_status)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_professional_documents_updated_at
  BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- B5. professional_availability (Recurring weekly schedule & specific date overrides)
CREATE TABLE IF NOT EXISTS public.professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pro_availability_time_order_chk CHECK (end_time > start_time),
  CONSTRAINT pro_availability_day_or_date_chk CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_pro_availability_lookup
  ON public.professional_availability(professional_id, day_of_week, specific_date);

CREATE TRIGGER trg_professional_availability_updated_at
  BEFORE UPDATE ON public.professional_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public Directory View (Separates public profile information from confidential PII/KYC)
CREATE OR REPLACE VIEW public.public_professional_directory AS
SELECT
  pp.id AS professional_id,
  pp.user_id,
  p.display_name,
  p.avatar_url,
  pp.business_name,
  pp.slug,
  pp.headline,
  pp.bio,
  pp.years_of_experience,
  pp.verification_status,
  pp.verified_at,
  pp.base_callout_fee_kobo,
  pp.currency_code,
  pp.average_rating,
  pp.review_count,
  pp.completed_jobs_count,
  pp.response_rate_pct,
  pp.is_available,
  pp.primary_city,
  pp.primary_state
FROM public.professional_profiles pp
JOIN public.profiles p ON p.id = pp.user_id
WHERE pp.verification_status = 'approved'
  AND pp.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND p.is_active = true
  AND p.is_suspended = false;
-- [COMMIT: 20261104000200_identity_and_professionals.sql]

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261104000300_business_and_marketplace.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Migration: 20261104000300_business_and_marketplace.sql
-- Description: Table Groups C (Business Management), Maintenance Schedules,
--              and D (Marketplace: Bookings, Quotations, Status History,
--              Conversations, Messages, Notifications).
-- ============================================================================
-- [BEGIN: 20261104000300_business_and_marketplace.sql]
-- ============================================================================
-- GROUP C: BUSINESS MANAGEMENT
-- ============================================================================

-- C1. businesses (SMBs, Property Management Companies, Corporate Accounts)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL,
  registration_number TEXT,
  tax_id_masked TEXT,
  industry TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  address TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unsubmitted',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT businesses_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_city_state ON public.businesses(city, state) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C2. business_members (Role-based team access to a business account)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role public.business_member_role NOT NULL DEFAULT 'facility_manager',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_members_unique UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user_id
  ON public.business_members(user_id, business_id)
  WHERE is_active = true;

CREATE TRIGGER trg_business_members_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C3. business_subscriptions (Subscription plans & capacity limits)
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  plan_code TEXT NOT NULL DEFAULT 'starter',
  plan_name TEXT NOT NULL DEFAULT 'EasyLife Business Starter',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  price_kobo BIGINT NOT NULL DEFAULT 0 CHECK (price_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'annual')),
  max_properties INTEGER NOT NULL DEFAULT 5 CHECK (max_properties > 0),
  max_assets INTEGER NOT NULL DEFAULT 50 CHECK (max_assets > 0),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  provider_subscription_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business_status
  ON public.business_subscriptions(business_id, status);

CREATE TRIGGER trg_business_subscriptions_updated_at
  BEFORE UPDATE ON public.business_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C4. properties (Facilities, estates, buildings, or branches managed by a business)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  manager_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  code TEXT NOT NULL,
  property_type public.property_type NOT NULL DEFAULT 'commercial',
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  lga_or_district TEXT,
  address TEXT NOT NULL,
  units_count INTEGER NOT NULL DEFAULT 1 CHECK (units_count > 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT properties_business_code_unique UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_properties_business_id
  ON public.properties(business_id, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_city
  ON public.properties(city, state)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C5. assets (Equipment records: generators, HVAC, pumps, solar inverters, electrical panels)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  asset_tag TEXT NOT NULL,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  location_in_property TEXT,
  status public.asset_status NOT NULL DEFAULT 'operational',
  purchase_date DATE,
  purchase_cost_kobo BIGINT CHECK (purchase_cost_kobo IS NULL OR purchase_cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  warranty_expires_at DATE,
  last_serviced_at TIMESTAMPTZ,
  next_service_due_at TIMESTAMPTZ,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT assets_business_tag_unique UNIQUE (business_id, asset_tag)
);

CREATE INDEX IF NOT EXISTS idx_assets_property_status
  ON public.assets(property_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_business_next_due
  ON public.assets(business_id, next_service_due_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E6 (Placed before bookings so bookings can reference maintenance_schedule_id):
-- maintenance_schedules (Preventive maintenance schedules for properties/assets)
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  assigned_professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT,
  frequency public.maintenance_frequency NOT NULL DEFAULT 'monthly',
  interval_days INTEGER NOT NULL DEFAULT 30 CHECK (interval_days > 0),
  estimated_cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (estimated_cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  next_due_date DATE NOT NULL,
  last_completed_at TIMESTAMPTZ,
  auto_create_booking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due
  ON public.maintenance_schedules(business_id, next_due_date, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset
  ON public.maintenance_schedules(asset_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- GROUP D: MARKETPLACE
-- ============================================================================

-- D1. bookings (Service requests, scheduled appointments & job lifecycle)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-BK'),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  maintenance_schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  ai_suggested_category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  ai_urgency public.urgency_level,
  ai_categorization_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  status public.booking_status NOT NULL DEFAULT 'open',
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  lga_or_district TEXT,
  service_address TEXT NOT NULL,
  preferred_date DATE,
  preferred_time_slot TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  accepted_quotation_id UUID,
  agreed_amount_kobo BIGINT CHECK (agreed_amount_kobo IS NULL OR agreed_amount_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  pro_marked_complete_at TIMESTAMPTZ,
  pro_completion_notes TEXT,
  customer_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT bookings_reference_code_unique UNIQUE (reference_code),
  CONSTRAINT bookings_scheduled_window_chk CHECK (
    scheduled_end_at IS NULL OR scheduled_start_at IS NULL OR scheduled_end_at >= scheduled_start_at
  )
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_status
  ON public.bookings(customer_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_professional_status
  ON public.bookings(professional_id, status, scheduled_start_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_marketplace_discovery
  ON public.bookings(city, category_id, status, urgency, created_at DESC)
  WHERE status IN ('open', 'quoted') AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_business_property
  ON public.bookings(business_id, property_id, asset_id)
  WHERE business_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- D2. booking_attachments (Private media uploaded for requests or job completion)
CREATE TABLE IF NOT EXISTS public.booking_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_bucket TEXT NOT NULL DEFAULT 'service-request-media' CHECK (storage_bucket = 'service-request-media'),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  attachment_stage TEXT NOT NULL DEFAULT 'request' CHECK (attachment_stage IN ('request', 'in_progress', 'completion')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_attachments_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_booking_attachments_booking_id
  ON public.booking_attachments(booking_id, attachment_stage);

-- D3. quotations (Formal price & schedule proposals submitted by verified professionals)
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-QT'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  status public.quotation_status NOT NULL DEFAULT 'pending',
  subtotal_kobo BIGINT NOT NULL CHECK (subtotal_kobo >= 0),
  tax_kobo BIGINT NOT NULL DEFAULT 0 CHECK (tax_kobo >= 0),
  total_amount_kobo BIGINT NOT NULL CHECK (total_amount_kobo = subtotal_kobo + tax_kobo),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (estimated_duration_minutes > 0),
  proposed_start_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  notes TEXT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quotations_reference_code_unique UNIQUE (reference_code)
);

-- Prevent duplicate active pending quotations by the same professional on the same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_one_pending_per_pro_booking
  ON public.quotations(booking_id, professional_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_quotations_booking_status
  ON public.quotations(booking_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_professional_status
  ON public.quotations(professional_id, status, created_at DESC);

CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add deferred FK from bookings.accepted_quotation_id to quotations.id
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_accepted_quotation_fk
  FOREIGN KEY (accepted_quotation_id) REFERENCES public.quotations(id) ON DELETE RESTRICT;

-- D4. quotation_items (Itemized breakdown of labor, materials, callout fees in kobo)
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_type public.quotation_item_type NOT NULL DEFAULT 'labor',
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 2),
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_price_kobo BIGINT NOT NULL CHECK (unit_price_kobo >= 0),
  line_total_kobo BIGINT NOT NULL CHECK (line_total_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id
  ON public.quotation_items(quotation_id, sort_order);

-- D5. booking_status_history (Immutable historical log of every booking status transition)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  from_status public.booking_status,
  to_status public.booking_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking
  ON public.booking_status_history(booking_id, created_at ASC);

CREATE TRIGGER trg_booking_status_history_immutable
  BEFORE UPDATE OR DELETE ON public.booking_status_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_modification();

-- Automatically record initial booking creation & subsequent status changes
CREATE OR REPLACE FUNCTION public.record_booking_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
       coalesce(auth.uid(), NEW.customer_id),
      'Booking created'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      coalesce(auth.uid(), NEW.cancelled_by, NEW.customer_id),
      coalesce(NEW.cancellation_reason, NEW.pro_completion_notes, 'Status updated')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_record_status_history
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.record_booking_status_transition();

-- D6. conversations (Messaging threads scoped to bookings)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived', 'locked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON public.conversations(last_message_at DESC NULLS LAST);

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- D7. conversation_members (Participants authorized in a conversation)
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role_in_conversation public.user_role NOT NULL,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_members_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user
  ON public.conversation_members(user_id, conversation_id);

-- D8. messages (Chat messages within a conversation)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 1),
  attachment_storage_path TEXT,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_last_message();

-- D9. notifications (In-app, email, and push notification persistence)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  entity_type TEXT,
  entity_id UUID,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);
-- [COMMIT: 20261104000300_business_and_marketplace.sql]

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261104000400_transactions_admin_and_rls.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Migration: 20261104000400_transactions_admin_and_rls.sql
-- Description: Table Groups E (Transactions & Accountability) and
--              F (Administration), Atomic Transactional RPCs, Storage Buckets,
--              and Row Level Security (RLS) across all tables.
-- ============================================================================
-- [BEGIN: 20261104000400_transactions_admin_and_rls.sql]
-- ============================================================================
-- GROUP E: TRANSACTIONS AND ACCOUNTABILITY
-- ============================================================================

-- E1. payments (Financial transactions stored in integer minor units / kobo)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL DEFAULT public.generate_reference_code('EL-PY'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE RESTRICT,
  payer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  gross_amount_kobo BIGINT NOT NULL CHECK (gross_amount_kobo > 0),
  platform_commission_kobo BIGINT NOT NULL DEFAULT 0 CHECK (platform_commission_kobo >= 0),
  professional_payout_kobo BIGINT NOT NULL CHECK (
    professional_payout_kobo >= 0
    AND gross_amount_kobo = platform_commission_kobo + professional_payout_kobo
  ),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  provider TEXT NOT NULL DEFAULT 'paystack' CHECK (provider IN ('paystack', 'manual_transfer')),
  provider_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'initiated',
  paid_at TIMESTAMPTZ,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_reference_unique UNIQUE (reference),
  CONSTRAINT payments_provider_reference_unique UNIQUE (provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_professional ON public.payments(professional_id, status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E2. refunds (Refund records linked to payments and optional disputes)
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL DEFAULT public.generate_reference_code('EL-RF'),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  dispute_id UUID,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  reason TEXT NOT NULL,
  status public.refund_status NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  processed_at TIMESTAMPTZ,
  provider_refund_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT refunds_reference_unique UNIQUE (reference)
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id, status);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON public.refunds(booking_id);

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E3. reviews (Verified customer reviews strictly gated to completed bookings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  reviewer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) >= 5),
  professional_response TEXT,
  responded_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_published
  ON public.reviews(professional_id, created_at DESC)
  WHERE is_published = true;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforce that reviews can ONLY be created for completed bookings by the booking's customer
CREATE OR REPLACE FUNCTION public.enforce_verified_review_and_recalculate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT id, customer_id, professional_id, status
    INTO v_booking
    FROM public.bookings
    WHERE id = NEW.booking_id;

    IF v_booking.id IS NULL THEN
      RAISE EXCEPTION 'Booking does not exist.';
    END IF;

    IF v_booking.status <> 'completed' THEN
      RAISE EXCEPTION 'Reviews can only be submitted for completed bookings.';
    END IF;

    IF v_booking.customer_id <> NEW.reviewer_user_id THEN
      RAISE EXCEPTION 'Only the customer who booked the service can submit a review.';
    END IF;

    IF v_booking.professional_id <> NEW.professional_id THEN
      RAISE EXCEPTION 'Review professional_id does not match the booking professional.';
    END IF;
  END IF;

  -- Recalculate professional rating summary
  UPDATE public.professional_profiles pp
  SET
    average_rating = coalesce((
      SELECT round(avg(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id AND r.is_published = true
    ), 0.00),
    review_count = (
      SELECT count(*)::integer
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id AND r.is_published = true
    ),
    updated_at = now()
  WHERE pp.id = NEW.professional_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_enforce_and_recalculate
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_review_and_recalculate();

-- E4. disputes (Formal booking disputes and administrative arbitration)
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-DP'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  opened_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  against_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN (
    'incomplete_work',
    'quality_issue',
    'no_show',
    'pricing_disagreement',
    'property_damage',
    'safety_concern',
    'other'
  )),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  disputed_amount_kobo BIGINT NOT NULL DEFAULT 0 CHECK (disputed_amount_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_summary TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT disputes_reference_code_unique UNIQUE (reference_code)
);

-- Prevent multiple simultaneous open/under_review disputes for the same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_one_active_per_booking
  ON public.disputes(booking_id)
  WHERE status IN ('open', 'under_review');

CREATE INDEX IF NOT EXISTS idx_disputes_status_created
  ON public.disputes(status, created_at DESC);

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.refunds
  ADD CONSTRAINT refunds_dispute_id_fk
  FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE RESTRICT;

-- E5. dispute_evidence (Private evidence files stored in 'maintenance-and-disputes' bucket)
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE RESTRICT,
  submitted_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_bucket TEXT NOT NULL DEFAULT 'maintenance-and-disputes' CHECK (storage_bucket = 'maintenance-and-disputes'),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dispute_evidence_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id
  ON public.dispute_evidence(dispute_id, created_at ASC);

-- E7. maintenance_records (Historical asset & property maintenance records)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  maintenance_schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  performed_by_professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  recorded_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  maintenance_type public.maintenance_type NOT NULL DEFAULT 'preventive',
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) >= 3),
  work_performed TEXT NOT NULL,
  parts_replaced TEXT,
  cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_recommended_service_date DATE,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset_date
  ON public.maintenance_records(asset_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_property_date
  ON public.maintenance_records(property_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_business_date
  ON public.maintenance_records(business_id, performed_at DESC);

CREATE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically update asset.last_serviced_at when a maintenance record is logged
CREATE OR REPLACE FUNCTION public.sync_asset_last_serviced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_id IS NOT NULL THEN
    UPDATE public.assets
    SET
      last_serviced_at = GREATEST(coalesce(last_serviced_at, NEW.performed_at), NEW.performed_at),
      next_service_due_at = COALESCE(
        NEW.next_recommended_service_date::timestamptz,
        next_service_due_at
      ),
      status = 'operational',
      updated_at = now()
    WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_records_sync_asset
  AFTER INSERT ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_asset_last_serviced();

-- ============================================================================
-- GROUP F: ADMINISTRATION
-- ============================================================================

-- F1. audit_logs (Immutable administrative and security audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role public.user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs(actor_user_id, created_at DESC);

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_modification();

-- F2. reports (User-submitted safety/abuse reports & moderation queue)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'professional_profile', 'booking', 'review', 'message')),
  target_id UUID NOT NULL,
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'fraud_or_scam',
    'harassment',
    'inappropriate_content',
    'off_platform_solicitation',
    'fake_credentials',
    'other'
  )),
  details TEXT NOT NULL CHECK (char_length(trim(details)) >= 5),
  status public.report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports(status, created_at DESC);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- F3. platform_settings (Central operational configuration)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- F4. commission_settings (Commission rates in basis points & flat minor-unit fees)
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  city TEXT,
  commission_bps INTEGER NOT NULL DEFAULT 1000 CHECK (commission_bps BETWEEN 0 AND 5000),
  flat_fee_kobo BIGINT NOT NULL DEFAULT 0 CHECK (flat_fee_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_settings_lookup
  ON public.commission_settings(category_id, city, is_active);

CREATE TRIGGER trg_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ATOMIC TRANSACTIONAL RPCs
-- ============================================================================

-- 1. Atomic Quotation Acceptance & Booking Scheduling
CREATE OR REPLACE FUNCTION public.accept_quotation_and_schedule(
  p_quotation_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_quotation public.quotations%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_pro_user_id UUID;
  v_conversation_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_quotation
  FROM public.quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF v_quotation.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF v_quotation.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending quotations can be accepted (current status: %).', v_quotation.status;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_quotation.booking_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Associated booking not found.';
  END IF;

  IF v_booking.customer_id <> v_actor_id THEN
    RAISE EXCEPTION 'Only the booking owner can accept a quotation.';
  END IF;

  IF v_booking.status NOT IN ('open', 'quoted') THEN
    RAISE EXCEPTION 'Booking cannot accept quotations in status %.', v_booking.status;
  END IF;

  -- Mark selected quotation accepted
  UPDATE public.quotations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = v_quotation.id;

  -- Decline all other pending quotations on this booking
  UPDATE public.quotations
  SET status = 'declined',
      declined_at = now(),
      updated_at = now()
  WHERE booking_id = v_booking.id
    AND id <> v_quotation.id
    AND status = 'pending';

  -- Update booking to scheduled with agreed amount and professional
  UPDATE public.bookings
  SET professional_id = v_quotation.professional_id,
      accepted_quotation_id = v_quotation.id,
      agreed_amount_kobo = v_quotation.total_amount_kobo,
      currency_code = v_quotation.currency_code,
      scheduled_start_at = coalesce(v_quotation.proposed_start_at, v_booking.scheduled_start_at, now() + INTERVAL '1 day'),
      scheduled_end_at = coalesce(v_quotation.proposed_start_at, v_booking.scheduled_start_at, now() + INTERVAL '1 day')
        + (v_quotation.estimated_duration_minutes || ' minutes')::interval,
      status = 'scheduled',
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Ensure a conversation exists between customer and professional
  SELECT user_id INTO v_pro_user_id
  FROM public.professional_profiles
  WHERE id = v_quotation.professional_id;

  INSERT INTO public.conversations (booking_id, subject, status)
  VALUES (v_booking.id, v_booking.title, 'open')
  ON CONFLICT (booking_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_members (conversation_id, user_id, role_in_conversation)
  VALUES
    (v_conversation_id, v_booking.customer_id, 'customer'),
    (v_conversation_id, v_pro_user_id, 'professional')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Record immutable audit log
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'quotation.accepted',
    'booking',
    v_booking.id::text,
    jsonb_build_object(
      'quotation_id', v_quotation.id,
      'professional_id', v_quotation.professional_id,
      'agreed_amount_kobo', v_quotation.total_amount_kobo,
      'currency_code', v_quotation.currency_code
    )
  );

  RETURN v_booking;
END;
$$;

-- 2. Atomic Job Completion & Maintenance Record Sync
CREATE OR REPLACE FUNCTION public.confirm_booking_completion(
  p_booking_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_pro_name TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_booking.customer_id <> v_actor_id THEN
    RAISE EXCEPTION 'Only the booking customer can confirm final job completion.';
  END IF;

  IF v_booking.status NOT IN ('in_progress', 'pro_marked_complete', 'scheduled') THEN
    RAISE EXCEPTION 'Booking cannot be completed from status %.', v_booking.status;
  END IF;

  UPDATE public.bookings
  SET status = 'completed',
      customer_confirmed_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Increment completed jobs count for the professional
  IF v_booking.professional_id IS NOT NULL THEN
    UPDATE public.professional_profiles
    SET completed_jobs_count = completed_jobs_count + 1,
        updated_at = now()
    WHERE id = v_booking.professional_id
    RETURNING business_name INTO v_pro_name;
  END IF;

  -- If linked to a business property/asset, automatically log a maintenance record
  IF v_booking.business_id IS NOT NULL AND v_booking.property_id IS NOT NULL THEN
    INSERT INTO public.maintenance_records (
      business_id,
      property_id,
      asset_id,
      maintenance_schedule_id,
      booking_id,
      performed_by_professional_id,
      performed_by_name,
      recorded_by_user_id,
      maintenance_type,
      summary,
      work_performed,
      cost_kobo,
      currency_code,
      performed_at
    ) VALUES (
      v_booking.business_id,
      v_booking.property_id,
      v_booking.asset_id,
      v_booking.maintenance_schedule_id,
      v_booking.id,
      v_booking.professional_id,
      coalesce(v_pro_name, 'Verified Professional'),
      v_actor_id,
      CASE WHEN v_booking.maintenance_schedule_id IS NOT NULL THEN 'preventive'::public.maintenance_type ELSE 'corrective'::public.maintenance_type END,
      v_booking.title,
      coalesce(v_booking.pro_completion_notes, v_booking.description),
      coalesce(v_booking.agreed_amount_kobo, 0),
      v_booking.currency_code,
      now()
    );
  END IF;

  -- Advance maintenance schedule if linked
  IF v_booking.maintenance_schedule_id IS NOT NULL THEN
    UPDATE public.maintenance_schedules
    SET last_completed_at = now(),
        next_due_date = (current_date + (interval_days || ' days')::interval)::date,
        updated_at = now()
    WHERE id = v_booking.maintenance_schedule_id;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'booking.completed',
    'booking',
    v_booking.id::text,
    jsonb_build_object(
      'professional_id', v_booking.professional_id,
      'agreed_amount_kobo', v_booking.agreed_amount_kobo
    )
  );

  RETURN v_booking;
END;
$$;

-- ============================================================================
-- SUPABASE STORAGE BUCKETS (Public vs Private Separation)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('portfolio-media', 'portfolio-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('verification-documents', 'verification-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      ('service-request-media', 'service-request-media', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      ('maintenance-and-disputes', 'maintenance-and-disputes', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & BASELINE POLICIES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id AND b.owner_id = auth.uid() AND b.deleted_at IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
  );
$$;

-- Enable RLS on all 30 public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Baseline RLS Policies
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_sessions_manage_own" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "service_categories_public_read" ON public.service_categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "service_categories_admin_write" ON public.service_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "pro_profiles_read_approved_or_own" ON public.professional_profiles
  FOR SELECT USING (
    (verification_status = 'approved' AND deleted_at IS NULL)
    OR user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "pro_profiles_write_own" ON public.professional_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "pro_profiles_update_own_or_admin" ON public.professional_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "pro_services_read_all" ON public.professional_services
  FOR SELECT USING (true);

CREATE POLICY "pro_services_manage_own" ON public.professional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_areas_read_all" ON public.professional_service_areas
  FOR SELECT USING (true);

CREATE POLICY "pro_areas_manage_own" ON public.professional_service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Confidential KYC Documents: strictly owner or admin ONLY
CREATE POLICY "pro_documents_confidential_access" ON public.professional_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_documents_insert_own" ON public.professional_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_availability_read_all" ON public.professional_availability
  FOR SELECT USING (true);

CREATE POLICY "pro_availability_manage_own" ON public.professional_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Businesses, Properties, Assets, Maintenance Schedules & Records
CREATE POLICY "businesses_member_or_admin" ON public.businesses
  FOR SELECT USING (owner_id = auth.uid() OR public.is_business_member(id) OR public.is_admin());

CREATE POLICY "businesses_insert_owner" ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "businesses_update_owner_or_admin" ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "business_members_access" ON public.business_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "business_subscriptions_access" ON public.business_subscriptions
  FOR SELECT USING (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "properties_business_access" ON public.properties
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "assets_business_access" ON public.assets
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "maintenance_schedules_business_access" ON public.maintenance_schedules
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "maintenance_records_business_access" ON public.maintenance_records
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

-- Marketplace: Bookings, Quotations, Conversations, Messages, Notifications
CREATE POLICY "bookings_select_authorized" ON public.bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR (business_id IS NOT NULL AND public.is_business_member(business_id))
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = auth.uid()
        AND (
          pp.id = bookings.professional_id
          OR (bookings.status IN ('open', 'quoted') AND pp.verification_status = 'approved')
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "bookings_insert_customer" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "bookings_update_participants" ON public.bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = bookings.professional_id AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "quotations_select_authorized" ON public.quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = quotations.professional_id AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = quotations.booking_id AND b.customer_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "quotations_insert_verified_pro" ON public.quotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = quotations.professional_id
        AND pp.user_id = auth.uid()
        AND pp.verification_status = 'approved'
    ) OR public.is_admin()
  );

CREATE POLICY "quotation_items_select_authorized" ON public.quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
    )
  );

CREATE POLICY "booking_status_history_select" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_status_history.booking_id
    )
  );

CREATE POLICY "conversations_member_access" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "conversation_members_select" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_own_access" ON public.notifications
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Transactions, Reviews, Disputes & Admin
CREATE POLICY "payments_select_participant" ON public.payments
  FOR SELECT USING (
    payer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = payments.professional_id AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "refunds_select_participant" ON public.refunds
  FOR SELECT USING (
    initiated_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = refunds.payment_id AND p.payer_user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (is_published = true OR reviewer_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reviews_insert_customer" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_user_id = auth.uid());

CREATE POLICY "disputes_participant_or_admin" ON public.disputes
  FOR SELECT USING (
    opened_by_user_id = auth.uid()
    OR against_user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "disputes_insert_participant" ON public.disputes
  FOR INSERT WITH CHECK (opened_by_user_id = auth.uid());

CREATE POLICY "dispute_evidence_participant_or_admin" ON public.dispute_evidence
  FOR SELECT USING (
    submitted_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_evidence.dispute_id
        AND (d.opened_by_user_id = auth.uid() OR d.against_user_id = auth.uid())
    )
    OR public.is_admin()
  );

CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "reports_own_or_admin" ON public.reports
  FOR SELECT USING (reporter_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reports_insert_authenticated" ON public.reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "platform_settings_read_public_or_admin" ON public.platform_settings
  FOR SELECT USING (is_public = true OR public.is_admin());

CREATE POLICY "commission_settings_read_authenticated" ON public.commission_settings
  FOR SELECT USING (auth.uid() IS NOT NULL OR public.is_admin());
-- [COMMIT: 20261104000400_transactions_admin_and_rls.sql]

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261104000500_comprehensive_rls_storage_and_admin_security.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- Migration: 20261104000500_comprehensive_rls_storage_and_admin_security.sql
-- Description: Comprehensive Row Level Security (RLS) policies, anti-privilege
--              escalation triggers, business owner vs. member role boundaries,
--              storage bucket policies, file validation, and admin RPCs.
-- ============================================================================
-- [BEGIN: 20261104000500_comprehensive_rls_storage_and_admin_security.sql]
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
-- [COMMIT: 20261104000500_comprehensive_rls_storage_and_admin_security.sql]

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: dev_seed.sql (Foundational Service Categories & Settings)
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- DEVELOPMENT SEED DATA: supabase/seed/dev_seed.sql
-- WARNING: DEVELOPMENT / TESTING ENVIRONMENT ONLY.
-- Contains foundational service categories, platform settings, and clearly
-- labelled [FICTIONAL DEV TEST] records using the RFC 2606 '.invalid' domain.
-- No real user PII, no fake customer reviews, and no fabricated transactions.
-- ============================================================================
-- [BEGIN: dev_seed.sql]
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'ABORT: dev_seed.sql must never be executed in a production environment.';
  END IF;
END
$$;

-- 1. Core Service Categories for Nigeria (Port Harcourt, Lagos, Abuja)
INSERT INTO public.service_categories (
  id,
  name,
  slug,
  description,
  icon_name,
  default_commission_bps,
  is_active,
  display_order
) VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'Plumbing & Water Systems',
    'plumbing-water-systems',
    'Pipe leaks, borehole pumps, water heaters, overhead tanks, and drainage repairs.',
    'wrench',
    1000,
    true,
    1
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Electrical & Power Backup',
    'electrical-power-backup',
    'Wiring, distribution boards, solar inverters, changeover switches, and fault tracing.',
    'zap',
    1000,
    true,
    2
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'HVAC & Air Conditioning',
    'hvac-air-conditioning',
    'Split and standing AC servicing, gas refilling, compressor repair, and commercial chillers.',
    'wind',
    1000,
    true,
    3
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Generator Maintenance',
    'generator-maintenance',
    'Diesel and petrol generator servicing, oil/filter replacement, AVR, and alternator repair.',
    'settings',
    1000,
    true,
    4
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'Carpentry, Doors & Locks',
    'carpentry-doors-locks',
    'Security doors, cabinetry, wooden roofing, locks, and furniture assembly.',
    'hammer',
    1000,
    true,
    5
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'Cleaning & Fumigation',
    'cleaning-fumigation',
    'Residential deep cleaning, post-construction cleaning, and licensed pest control.',
    'sparkles',
    1000,
    true,
    6
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'Painting & Wall Finishing',
    'painting-wall-finishing',
    'Interior and exterior painting, POP ceiling repair, dampness treatment, and screeding.',
    'paintbrush',
    1000,
    true,
    7
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'Appliance Repair',
    'appliance-repair',
    'Refrigerators, washing machines, gas cookers, microwaves, and water dispensers.',
    'cpu',
    1000,
    true,
    8
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  default_commission_bps = EXCLUDED.default_commission_bps,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- 2. Default Platform Settings
INSERT INTO public.platform_settings (key, value, description, is_public)
VALUES
  (
    'pilot_cities',
    '["Port Harcourt", "Lagos", "Abuja"]'::jsonb,
    'Active Nigerian pilot cities supported by EasyLife MVP.',
    true
  ),
  (
    'supported_currencies',
    '[{"code": "NGN", "symbol": "₦", "minor_unit": "kobo", "minor_per_major": 100}]'::jsonb,
    'Supported platform currencies and minor-unit conversion ratios.',
    true
  ),
  (
    'booking_quotation_expiry_hours',
    '48'::jsonb,
    'Default validity window in hours for submitted quotations.',
    true
  ),
  (
    'maintenance_mode',
    '{"enabled": false, "message": ""}'::jsonb,
    'Global maintenance banner toggle.',
    true
  )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- 3. Default Commission Settings (10% = 1000 bps across pilot cities)
INSERT INTO public.commission_settings (
  id,
  category_id,
  city,
  commission_bps,
  flat_fee_kobo,
  currency_code,
  is_active
) VALUES
  ('20000000-0000-4000-8000-000000000001', NULL, 'Port Harcourt', 1000, 0, 'NGN', true),
  ('20000000-0000-4000-8000-000000000002', NULL, 'Lagos', 1000, 0, 'NGN', true),
  ('20000000-0000-4000-8000-000000000003', NULL, 'Abuja', 1000, 0, 'NGN', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Clearly Labelled Fictional Test Accounts (Only inserted if auth.users is available in local dev)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    -- Insert fictional test auth users with RFC 2606 .invalid emails
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES
      (
        '00000000-0000-4000-a000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'fictional.customer@easylife-dev-test.invalid',
        crypt('DevTestOnly#2026!', gen_salt('bf')),
        now(),
        '{"full_name": "[FICTIONAL TEST] Amadi Test Customer", "role": "customer", "city": "Port Harcourt", "state": "Rivers State", "phone": "+2348000000001"}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-4000-a000-000000000002',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'fictional.pro@easylife-dev-test.invalid',
        crypt('DevTestOnly#2026!', gen_salt('bf')),
        now(),
        '{"full_name": "[FICTIONAL TEST] Tekena Test Technician", "role": "professional", "city": "Port Harcourt", "state": "Rivers State", "phone": "+2348000000002"}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-4000-a000-000000000003',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'fictional.business@easylife-dev-test.invalid',
        crypt('DevTestOnly#2026!', gen_salt('bf')),
        now(),
        '{"full_name": "[FICTIONAL TEST] Garden City Estates Test Manager", "role": "business", "city": "Port Harcourt", "state": "Rivers State", "phone": "+2348000000003"}'::jsonb,
        now(),
        now()
      ),
      (
        '00000000-0000-4000-a000-000000000004',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'fictional.admin@easylife-dev-test.invalid',
        crypt('DevTestOnly#2026!', gen_salt('bf')),
        now(),
        '{"full_name": "[FICTIONAL TEST] EasyLife System Admin", "role": "customer", "city": "Port Harcourt", "state": "Rivers State", "phone": "+2348000000004"}'::jsonb,
        now(),
        now()
      )
    ON CONFLICT (id) DO NOTHING;

    -- Elevate fictional admin account via backend migration rule
    UPDATE public.profiles
    SET primary_role = 'admin'
    WHERE id = '00000000-0000-4000-a000-000000000004';

    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES ('00000000-0000-4000-a000-000000000004', 'admin', true)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Fictional Pending Professional Profile (Not marked fake-verified; awaits real admin flow test)
    INSERT INTO public.professional_profiles (
      id,
      user_id,
      business_name,
      slug,
      headline,
      bio,
      years_of_experience,
      verification_status,
      base_callout_fee_kobo,
      currency_code,
      primary_city,
      primary_state
    ) VALUES (
      '30000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-a000-000000000002',
      '[FICTIONAL TEST] Tekena Technical Services (Dev Sandbox)',
      'fictional-test-tekena-technical-services',
      'Fictional sandbox electrical & HVAC technician record for development testing only.',
      'This is a clearly labelled fictional development record used to test onboarding and verification workflows.',
      5,
      'pending',
      500000, -- ₦5,000.00 in kobo
      'NGN',
      'Port Harcourt',
      'Rivers State'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Fictional Business, Property & Equipment Asset for B2B Maintenance Testing
    INSERT INTO public.businesses (
      id,
      owner_id,
      name,
      slug,
      industry,
      contact_email,
      contact_phone,
      city,
      state,
      address
    ) VALUES (
      '40000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-a000-000000000003',
      '[FICTIONAL TEST] Garden City Mock Facility Ltd',
      'fictional-test-garden-city-facility',
      'Property & Facility Management',
      'fictional.business@easylife-dev-test.invalid',
      '+2348000000003',
      'Port Harcourt',
      'Rivers State',
      'Plot 00 Fictional Sandbox Layout, Old GRA, Port Harcourt'
    )
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.business_members (business_id, user_id, member_role, is_active)
    VALUES ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-a000-000000000003', 'owner', true)
    ON CONFLICT (business_id, user_id) DO NOTHING;

    INSERT INTO public.properties (
      id,
      business_id,
      manager_user_id,
      name,
      code,
      property_type,
      city,
      state,
      lga_or_district,
      address,
      units_count
    ) VALUES (
      '50000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-a000-000000000003',
      '[FICTIONAL TEST] Sandbox Commercial Plaza PH',
      'TEST-PH-01',
      'commercial',
      'Port Harcourt',
      'Rivers State',
      'Port Harcourt City LGA',
      'Plot 00 Fictional Sandbox Layout, Old GRA, Port Harcourt',
      12
    )
    ON CONFLICT (business_id, code) DO NOTHING;

    INSERT INTO public.assets (
      id,
      business_id,
      property_id,
      category_id,
      name,
      asset_tag,
      brand,
      model_number,
      serial_number,
      location_in_property,
      status,
      purchase_cost_kobo,
      currency_code
    ) VALUES (
      '60000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000004',
      '[FICTIONAL TEST] 100kVA Standby Diesel Generator',
      'TEST-GEN-001',
      'Perkins (Fictional Test)',
      'PK-100-TEST',
      'SN-FICTIONAL-0001',
      'Ground Floor Generator House',
      'operational',
      1250000000, -- ₦12,500,000.00 in kobo
      'NGN'
    )
    ON CONFLICT (business_id, asset_tag) DO NOTHING;
  END IF;
END
$$;
-- [COMMIT: dev_seed.sql]

COMMIT;
