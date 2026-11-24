-- ============================================================================
-- Migration: 20261124000100_master_mvp_consolidation.sql
-- Description: Master MVP Database Expansion:
--              1. Non-destructively extend user_role enum ('employer', 'moderator')
--              2. Enhance businesses and professional_profiles tables
--              3. Create employer_profiles, job_vacancies, job_applications,
--                 business_promotions tables
--              4. Add RLS policies, audit triggers, and helper functions
-- ============================================================================

BEGIN;

-- 1. Extend user_role ENUM (Must run outside multi-statement transactional conflict)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'employer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. Enhance businesses table for Business Hub & Local Business Directory
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_hub_dir ON public.businesses(is_directory_listed, is_active, verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_city_cat ON public.businesses(city, business_category) WHERE deleted_at IS NULL;

-- 3. Enhance professional_profiles table
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS hourly_rate_kobo BIGINT CHECK (hourly_rate_kobo >= 0);

-- 4. Create helper function for moderator and admin authorization
CREATE OR REPLACE FUNCTION public.is_moderator()
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

  -- 3. Check profiles & user_roles for admin or moderator
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.is_suspended = false
      AND p.deleted_at IS NULL
      AND ur.role IN ('admin', 'moderator')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
  );
END;
$$;

-- 5. Create employer_profiles table
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  company_description TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  address TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unsubmitted',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT employer_profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT employer_profiles_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user ON public.employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_slug ON public.employer_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_city ON public.employer_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_active ON public.employer_profiles(is_active) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_employer_profiles_updated_at ON public.employer_profiles;
CREATE TRIGGER trg_employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Create job_vacancies table
CREATE TABLE IF NOT EXISTS public.job_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE DEFAULT public.generate_reference_code('EL-JB'),
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  posted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Skilled Trades',
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (
    employment_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship', 'apprenticeship')
  ),
  workplace_type TEXT NOT NULL DEFAULT 'on_site' CHECK (
    workplace_type IN ('on_site', 'remote', 'hybrid')
  ),
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  address TEXT,
  min_salary_kobo BIGINT CHECK (min_salary_kobo >= 0),
  max_salary_kobo BIGINT CHECK (max_salary_kobo >= 0),
  salary_period TEXT NOT NULL DEFAULT 'month' CHECK (
    salary_period IN ('hour', 'day', 'week', 'month', 'project')
  ),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  is_negotiable BOOLEAN NOT NULL DEFAULT false,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  application_deadline TIMESTAMPTZ,
  positions_available INTEGER NOT NULL DEFAULT 1 CHECK (positions_available > 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('draft', 'open', 'paused', 'closed', 'filled', 'expired')
  ),
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (
    moderation_status IN ('pending', 'approved', 'rejected', 'flagged')
  ),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  applications_count INTEGER NOT NULL DEFAULT 0 CHECK (applications_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT job_vacancies_salary_range CHECK (
    min_salary_kobo IS NULL OR max_salary_kobo IS NULL OR min_salary_kobo <= max_salary_kobo
  )
);

CREATE INDEX IF NOT EXISTS idx_job_vacancies_employer ON public.job_vacancies(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_business ON public.job_vacancies(business_id);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_posted_by ON public.job_vacancies(posted_by);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_listing ON public.job_vacancies(status, moderation_status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_vacancies_search ON public.job_vacancies(city, category, employment_type);

DROP TRIGGER IF EXISTS trg_job_vacancies_updated_at ON public.job_vacancies;
CREATE TRIGGER trg_job_vacancies_updated_at
  BEFORE UPDATE ON public.job_vacancies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE DEFAULT public.generate_reference_code('EL-JA'),
  vacancy_id UUID NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_links TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'under_review', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn')
  ),
  employer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_applications_vacancy_applicant_unique UNIQUE (vacancy_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy ON public.job_applications(vacancy_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications(applicant_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER trg_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Auto-increment / sync applications count on job_vacancies
CREATE OR REPLACE FUNCTION public.sync_job_applications_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_vacancies
    SET applications_count = applications_count + 1,
        updated_at = now()
    WHERE id = NEW.vacancy_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_vacancies
    SET applications_count = GREATEST(0, applications_count - 1),
        updated_at = now()
    WHERE id = OLD.vacancy_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_applications_count_sync ON public.job_applications;
CREATE TRIGGER trg_job_applications_count_sync
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_applications_count();

-- 9. Create business_promotions table
CREATE TABLE IF NOT EXISTS public.business_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percentage NUMERIC(5, 2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount_kobo BIGINT CHECK (discount_amount_kobo >= 0),
  discount_code TEXT,
  conditions TEXT,
  banner_url TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (
    moderation_status IN ('pending', 'approved', 'rejected', 'flagged')
  ),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_promotions_biz ON public.business_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_promotions_active ON public.business_promotions(is_active, moderation_status, start_date) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_business_promotions_updated_at ON public.business_promotions;
CREATE TRIGGER trg_business_promotions_updated_at
  BEFORE UPDATE ON public.business_promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_promotions ENABLE ROW LEVEL SECURITY;

-- 11. Employer Profiles RLS Policies
DROP POLICY IF EXISTS "employer_profiles_public_read" ON public.employer_profiles;
CREATE POLICY "employer_profiles_public_read"
  ON public.employer_profiles
  FOR SELECT
  USING (
    (is_active = true AND deleted_at IS NULL)
    OR user_id = auth.uid()
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "employer_profiles_insert_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_insert_own"
  ON public.employer_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "employer_profiles_update_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_update_own"
  ON public.employer_profiles
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_moderator())
  WITH CHECK (user_id = auth.uid() OR public.is_moderator());

DROP POLICY IF EXISTS "employer_profiles_delete_own" ON public.employer_profiles;
CREATE POLICY "employer_profiles_delete_own"
  ON public.employer_profiles
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 12. Job Vacancies RLS Policies
DROP POLICY IF EXISTS "job_vacancies_public_read" ON public.job_vacancies;
CREATE POLICY "job_vacancies_public_read"
  ON public.job_vacancies
  FOR SELECT
  USING (
    (status = 'open' AND moderation_status = 'approved' AND deleted_at IS NULL)
    OR posted_by = auth.uid()
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "job_vacancies_insert_own" ON public.job_vacancies;
CREATE POLICY "job_vacancies_insert_own"
  ON public.job_vacancies
  FOR INSERT
  WITH CHECK (posted_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "job_vacancies_update_own" ON public.job_vacancies;
CREATE POLICY "job_vacancies_update_own"
  ON public.job_vacancies
  FOR UPDATE
  USING (posted_by = auth.uid() OR public.is_moderator())
  WITH CHECK (posted_by = auth.uid() OR public.is_moderator());

DROP POLICY IF EXISTS "job_vacancies_delete_own" ON public.job_vacancies;
CREATE POLICY "job_vacancies_delete_own"
  ON public.job_vacancies
  FOR DELETE
  USING (posted_by = auth.uid() OR public.is_admin());

-- 13. Job Applications RLS Policies
DROP POLICY IF EXISTS "job_applications_select_party_or_moderator" ON public.job_applications;
CREATE POLICY "job_applications_select_party_or_moderator"
  ON public.job_applications
  FOR SELECT
  USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_vacancies jv
      WHERE jv.id = vacancy_id AND jv.posted_by = auth.uid()
    )
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "job_applications_insert_applicant" ON public.job_applications;
CREATE POLICY "job_applications_insert_applicant"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (applicant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "job_applications_update_party_or_moderator" ON public.job_applications;
CREATE POLICY "job_applications_update_party_or_moderator"
  ON public.job_applications
  FOR UPDATE
  USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_vacancies jv
      WHERE jv.id = vacancy_id AND jv.posted_by = auth.uid()
    )
    OR public.is_moderator()
  )
  WITH CHECK (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_vacancies jv
      WHERE jv.id = vacancy_id AND jv.posted_by = auth.uid()
    )
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "job_applications_delete_own_or_admin" ON public.job_applications;
CREATE POLICY "job_applications_delete_own_or_admin"
  ON public.job_applications
  FOR DELETE
  USING (applicant_id = auth.uid() OR public.is_admin());

-- 14. Business Promotions RLS Policies
DROP POLICY IF EXISTS "business_promotions_public_read" ON public.business_promotions;
CREATE POLICY "business_promotions_public_read"
  ON public.business_promotions
  FOR SELECT
  USING (
    (is_active = true AND moderation_status = 'approved' AND deleted_at IS NULL)
    OR created_by = auth.uid()
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "business_promotions_insert_owner" ON public.business_promotions;
CREATE POLICY "business_promotions_insert_owner"
  ON public.business_promotions
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "business_promotions_update_owner" ON public.business_promotions;
CREATE POLICY "business_promotions_update_owner"
  ON public.business_promotions
  FOR UPDATE
  USING (created_by = auth.uid() OR public.is_moderator())
  WITH CHECK (created_by = auth.uid() OR public.is_moderator());

DROP POLICY IF EXISTS "business_promotions_delete_owner" ON public.business_promotions;
CREATE POLICY "business_promotions_delete_owner"
  ON public.business_promotions
  FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

COMMIT;

