-- ============================================================================
-- Migration: 20261104000200_identity_and_professionals.sql
-- Description: Table Groups A (Identity & Access), Service Categories, and
--              B (Professional Management) with constraints, indexes, and
--              confidential/public data separation.
-- ============================================================================

BEGIN;

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

COMMIT;
