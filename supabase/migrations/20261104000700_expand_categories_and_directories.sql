-- ============================================================================
-- EASYLIFE PLATFORM EXPANSION: PILOT CATEGORIES, SUB-SERVICES & EVERYDAY DIRECTORIES
-- Migration: 20261104000700_expand_categories_and_directories.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRESERVE & RESTORE THE 8 FOUNDATIONAL PILOT CATEGORIES (EXACT SLUGS)
-- ============================================================================

-- 1. Plumbing & Water Systems
UPDATE public.service_categories
SET
  name = 'Plumbing & Water Systems',
  slug = 'plumbing-water-systems',
  description = 'Pipe leaks, borehole submersible pumps, overhead tanks, water heaters, and bathroom/kitchen plumbing.',
  icon_name = 'wrench',
  display_order = 1,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000001';

-- 2. Electrical & Power Backup
UPDATE public.service_categories
SET
  name = 'Electrical & Power Backup',
  slug = 'electrical-power-backup',
  description = 'Conduit wiring, distribution boards, solar inverters, changeover switches, and electrical fault tracing.',
  icon_name = 'zap',
  display_order = 2,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000002';

-- 3. HVAC & Air Conditioning
UPDATE public.service_categories
SET
  name = 'HVAC & Air Conditioning',
  slug = 'hvac-air-conditioning',
  description = 'Split and standing AC servicing, refrigerant gas refilling, compressor repairs, and commercial HVAC.',
  icon_name = 'wind',
  display_order = 3,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000003';

-- 4. Generator Maintenance
UPDATE public.service_categories
SET
  name = 'Generator Maintenance',
  slug = 'generator-maintenance',
  description = 'Diesel and petrol generator mechanics, oil and filter servicing, AVR replacements, and alternator repairs.',
  icon_name = 'settings',
  display_order = 4,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000004';

-- 5. Carpentry, Doors & Locks
UPDATE public.service_categories
SET
  name = 'Carpentry, Doors & Locks',
  slug = 'carpentry-doors-locks',
  description = 'Security doors, wooden roofing, kitchen cabinetry, lock cylinders, hinges, and furniture assembly.',
  icon_name = 'hammer',
  display_order = 5,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000005';

-- 6. Cleaning & Fumigation
UPDATE public.service_categories
SET
  name = 'Cleaning & Fumigation',
  slug = 'cleaning-fumigation',
  description = 'Residential deep cleaning, post-construction cleanup, commercial office janitorial, and fumigation.',
  icon_name = 'sparkles',
  display_order = 6,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000006';

-- 7. Painting & Wall Finishing
UPDATE public.service_categories
SET
  name = 'Painting & Wall Finishing',
  slug = 'painting-wall-finishing',
  description = 'Interior and exterior painting, POP ceiling plaster repairs, wall screeding, and damp treatment.',
  icon_name = 'paintbrush',
  display_order = 7,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000007';

-- 8. Appliance Repair
UPDATE public.service_categories
SET
  name = 'Appliance Repair',
  slug = 'appliance-repair',
  description = 'Washing machines, microwaves, deep freezers, commercial ovens, and kitchen appliance diagnostics.',
  icon_name = 'cpu',
  display_order = 8,
  parent_id = NULL,
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000008';

-- ============================================================================
-- 2. SUBCATEGORIES UNDER EXISTING PARENTS (REUSING parent_id)
-- ============================================================================

-- Pest Control under Cleaning & Fumigation (parent_id = ...0006)
UPDATE public.service_categories
SET
  name = 'Pest Control',
  slug = 'pest-control',
  description = 'Fumigation, rodent baiting, subterranean termite barriers, and insect eradication.',
  icon_name = 'shield',
  display_order = 1,
  parent_id = '10000000-0000-4000-8000-000000000006',
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000009';

-- Solar Installation under Electrical & Power Backup (parent_id = ...0002)
UPDATE public.service_categories
SET
  name = 'Solar Installation',
  slug = 'solar-installation',
  description = 'Solar PV array mounting, MPPT/hybrid inverter configuration, lithium battery banks, and energy audits.',
  icon_name = 'sun',
  display_order = 1,
  parent_id = '10000000-0000-4000-8000-000000000002',
  is_active = true,
  updated_at = now()
WHERE id = '10000000-0000-4000-8000-000000000010';

-- ============================================================================
-- 3. ADDITIONAL TOP-LEVEL EVERYDAY SERVICE CATEGORIES
-- ============================================================================

-- Tiling & Floor Installation
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000011',
  'Tiling & Floor Installation',
  'tiling-floor-installation',
  'Ceramic and porcelain floor tiling, granite laying, marble polishing, screeding, and tile restoration.',
  'grid',
  1000,
  true,
  9,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Auto Electrical Services
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000012',
  'Auto Electrical Services',
  'auto-electrical-services',
  'Automotive ECU diagnostics, battery testing, alternator/starter rewiring, car alarms, and auto AC electricals.',
  'car',
  1000,
  true,
  10,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Moving & Relocation Services
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000013',
  'Moving & Relocation Services',
  'moving-relocation-services',
  'Residential house moving, office relocation, heavy appliance moving, packing, and transit haulage.',
  'truck',
  1000,
  true,
  11,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Laundry & Dry Cleaning
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000014',
  'Laundry & Dry Cleaning',
  'laundry-dry-cleaning',
  'Doorstep garment laundry, dry cleaning, steam pressing, curtain wash, and fabric stain removal.',
  'shirt',
  1000,
  true,
  12,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Beauty & Personal Care
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000015',
  'Beauty & Personal Care',
  'beauty-personal-care',
  'Mobile barbering, hair styling, bridal makeup, nail grooming, massage therapy, and personal aesthetics.',
  'scissors',
  1000,
  true,
  13,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Event Planning & Services
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000016',
  'Event Planning & Services',
  'event-planning-services',
  'Event decoration, sound and lighting engineering, catering coordination, ushering, and stage rentals.',
  'calendar',
  1000,
  true,
  14,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- Everyday Tasks (Custom Tasks & Errands)
INSERT INTO public.service_categories (id, name, slug, description, icon_name, default_commission_bps, is_active, display_order, parent_id)
VALUES (
  '10000000-0000-4000-8000-000000000017',
  'Everyday Tasks & Chores',
  'everyday-tasks',
  'General household errands, assembling furniture, grocery/market shopping, and custom assistance.',
  'check-circle',
  1000,
  true,
  15,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 4. PROVIDER ROLES & PROFESSIONAL PROFILES EXTENSION
-- Technicians, agents, dispatch riders & artisans register as service providers
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_profiles'
      AND column_name = 'provider_type'
  ) THEN
    ALTER TABLE public.professional_profiles
      ADD COLUMN provider_type text NOT NULL DEFAULT 'trade_technician'
      CHECK (provider_type IN ('trade_technician', 'dispatch_rider', 'property_agent', 'general_artisan'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_profiles'
      AND column_name = 'dispatch_details'
  ) THEN
    ALTER TABLE public.professional_profiles
      ADD COLUMN dispatch_details jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_profiles'
      AND column_name = 'agent_services'
  ) THEN
    ALTER TABLE public.professional_profiles
      ADD COLUMN agent_services text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'professional_profiles'
      AND column_name = 'agent_disclaimer_accepted'
  ) THEN
    ALTER TABLE public.professional_profiles
      ADD COLUMN agent_disclaimer_accepted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 5. LOCAL BUSINESS DIRECTORY EXTENSION
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE public.businesses
      ADD COLUMN description text,
      ADD COLUMN business_category text DEFAULT 'General Services',
      ADD COLUMN operating_hours jsonb DEFAULT '{"monday_to_friday": "8:00 AM - 6:00 PM", "saturday": "9:00 AM - 4:00 PM"}'::jsonb,
      ADD COLUMN services_offered text[] DEFAULT '{}'::text[],
      ADD COLUMN photos text[] DEFAULT '{}'::text[],
      ADD COLUMN is_directory_listed boolean NOT NULL DEFAULT true,
      ADD COLUMN latitude numeric(10,6),
      ADD COLUMN longitude numeric(10,6);
  END IF;
END $$;

-- Policy: Allow public read of active, approved, directory-listed businesses
DROP POLICY IF EXISTS "businesses_public_directory_read" ON public.businesses;
CREATE POLICY "businesses_public_directory_read" ON public.businesses
  FOR SELECT
  USING (
    is_active = true
    AND is_directory_listed = true
    AND (verification_status = 'approved' OR verification_status = 'pending')
  );

-- ============================================================================
-- 6. HEALTHCARE DIRECTORY (GENUINE PORT HARCOURT FACILITIES)
-- Strictly an informational directory — EasyLife is NOT a healthcare provider
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.healthcare_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) >= 3),
  slug text NOT NULL UNIQUE,
  facility_type text NOT NULL CHECK (facility_type IN ('hospital', 'clinic', 'pharmacy')),
  description text,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Port Harcourt',
  state text NOT NULL DEFAULT 'Rivers State',
  lga text NOT NULL,
  neighbourhood text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  contact_phone text NOT NULL,
  contact_email text,
  website text,
  operating_hours text NOT NULL DEFAULT 'Mon - Sat: 8:00 AM - 8:00 PM',
  is_emergency_24_7 boolean NOT NULL DEFAULT false,
  services_offered text[] NOT NULL DEFAULT '{}'::text[],
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'healthcare_facilities'
      AND column_name = 'geom'
  ) THEN
    ALTER TABLE public.healthcare_facilities
      ADD COLUMN geom geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_type_city
  ON public.healthcare_facilities(facility_type, city) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_geom
  ON public.healthcare_facilities USING GIST (geom);

ALTER TABLE public.healthcare_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "healthcare_public_read" ON public.healthcare_facilities;
CREATE POLICY "healthcare_public_read" ON public.healthcare_facilities
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "healthcare_admin_all" ON public.healthcare_facilities;
CREATE POLICY "healthcare_admin_all" ON public.healthcare_facilities
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed Genuine Port Harcourt Healthcare Facilities & Pharmacies
INSERT INTO public.healthcare_facilities (
  name, slug, facility_type, description, address, city, state, lga, neighbourhood,
  latitude, longitude, contact_phone, website, operating_hours, is_emergency_24_7,
  services_offered, verification_status
)
VALUES
  (
    'University of Port Harcourt Teaching Hospital (UPTH)',
    'upth-choba',
    'hospital',
    'Tertiary teaching hospital providing specialized multi-disciplinary care, emergency surgery, intensive care, and diagnostic laboratories.',
    'East-West Road, Choba',
    'Port Harcourt',
    'Rivers State',
    'Obio/Akpor',
    'Choba & Alakahia',
    4.8950,
    6.9150,
    '+2348039001122',
    'https://upthng.org',
    '24 Hours / 7 Days',
    true,
    ARRAY['Emergency & Trauma Care', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Radiology', 'Laboratory Diagnostics'],
    'approved'
  ),
  (
    'Rivers State University Teaching Hospital (RSUTH)',
    'rsuth-old-gra',
    'hospital',
    'State teaching hospital offering comprehensive primary, secondary, and tertiary clinical services, maternal health, and trauma support.',
    '6-8 Harley Street, Old GRA',
    'Port Harcourt',
    'Rivers State',
    'Port Harcourt City',
    'Old GRA',
    4.8180,
    7.0060,
    '+23484232145',
    'https://rsuth.ng',
    '24 Hours / 7 Days',
    true,
    ARRAY['Accident & Emergency', 'Cardiology', 'General Surgery', 'Specialist Clinics', 'Diagnostic Imaging', 'Blood Bank'],
    'approved'
  ),
  (
    'Meridian Hospital',
    'meridian-hospital-dline',
    'hospital',
    'Private multi-specialist medical hospital equipped with modern intensive care units, laparoscopic surgery, and 24-hour outpatient services.',
    '21 Igbokwe Street, D-Line',
    'Port Harcourt',
    'Rivers State',
    'Port Harcourt City',
    'D-Line',
    4.8080,
    7.0120,
    '+2348033104567',
    'https://meridianhospitals.net',
    '24 Hours / 7 Days',
    true,
    ARRAY['General Medicine', 'Maternity', 'In Vitro Fertilisation (IVF)', 'Neonatal Care', 'Pharmacy', 'Ultrasound & X-Ray'],
    'approved'
  ),
  (
    'Medbury Medical Services Clinic',
    'medbury-clinic-trans-amadi',
    'clinic',
    'Occupational health and general outpatient medical clinic offering workplace health surveillance, routine checks, and immunizations.',
    'Plot 140 Trans-Amadi Industrial Layout',
    'Port Harcourt',
    'Rivers State',
    'Port Harcourt City',
    'Peter Odili / Trans-Amadi',
    4.8050,
    7.0380,
    '+2348092224455',
    'https://medburymedical.com',
    'Mon - Sat: 8:00 AM - 6:00 PM',
    false,
    ARRAY['Occupational Health', 'Routine Medical Exams', 'Vaccinations', 'Blood Chemistry', 'Drug & Alcohol Screening'],
    'approved'
  ),
  (
    'Alpha Pharmacy & Stores',
    'alpha-pharmacy-old-gra',
    'pharmacy',
    'Registered community pharmacy offering prescription dispensing, cold-chain medication storage, over-the-counter wellness, and medical supplies.',
    '15 Forces Avenue, Old GRA',
    'Port Harcourt',
    'Rivers State',
    'Port Harcourt City',
    'Old GRA',
    4.8185,
    7.0070,
    '+2348023004411',
    'https://alphapharmacy.com.ng',
    'Mon - Sat: 8:00 AM - 9:00 PM; Sun: 12:00 PM - 7:00 PM',
    false,
    ARRAY['Prescription Dispensing', 'Blood Pressure & Sugar Checks', 'Pediatric Formulations', 'Patient Drug Counseling', 'Surgical Supplies'],
    'approved'
  ),
  (
    'HealthPlus Pharmacy',
    'healthplus-pharmacy-peter-odili',
    'pharmacy',
    'Neighborhood community retail pharmacy and wellness shop offering certified medications, infant care, and first-aid kits.',
    'Genesis Centre, Peter Odili Road',
    'Port Harcourt',
    'Rivers State',
    'Port Harcourt City',
    'Peter Odili / Trans-Amadi',
    4.8060,
    7.0390,
    '+2348149802233',
    'https://healthplus.com.ng',
    'Mon - Sun: 8:00 AM - 10:00 PM',
    false,
    ARRAY['Ethical Medicines', 'Vitamins & Dietary Supplements', 'Baby Care', 'Personal Hygiene', 'First Aid'],
    'approved'
  ),
  (
    'Emel Pharmacy & Supermarket',
    'emel-pharmacy-rumuokoro',
    'pharmacy',
    'Prominent junction community pharmacy providing reliable generic and branded pharmaceuticals, antimalarials, and diagnostics kits.',
    '14 East-West Road by Rumuokoro Junction',
    'Port Harcourt',
    'Rivers State',
    'Obio/Akpor',
    'Rumuokoro & Eliozu',
    4.8680,
    6.9850,
    '+2348035511223',
    NULL,
    'Mon - Sat: 7:30 AM - 9:30 PM',
    false,
    ARRAY['Antimalarials & Antibiotics', 'Diagnostic Rapid Tests', 'Prescription Verification', 'Emergency First-Aid'],
    'approved'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  contact_phone = EXCLUDED.contact_phone,
  operating_hours = EXCLUDED.operating_hours,
  services_offered = EXCLUDED.services_offered;

-- ============================================================================
-- 7. DIRECTORY REPORTS & SUSPICIOUS LISTING AUDIT
-- Allows customers and providers to flag suspicious entries or policy violations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.directory_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('professional', 'business', 'healthcare_facility', 'general_listing')),
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'misrepresentation',
    'suspicious_activity',
    'unlicensed_practice',
    'property_advertising_violation',
    'inaccurate_contact_info',
    'other'
  )),
  details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directory_reports_status
  ON public.directory_reports(status, created_at DESC);

ALTER TABLE public.directory_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert reports
DROP POLICY IF EXISTS "directory_reports_insert_auth" ON public.directory_reports;
CREATE POLICY "directory_reports_insert_auth" ON public.directory_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can view their own reports
DROP POLICY IF EXISTS "directory_reports_select_owner" ON public.directory_reports;
CREATE POLICY "directory_reports_select_owner" ON public.directory_reports
  FOR SELECT USING (reporter_id = auth.uid() OR public.is_admin());

-- Policy: Admins can update/manage reports
DROP POLICY IF EXISTS "directory_reports_admin_update" ON public.directory_reports;
CREATE POLICY "directory_reports_admin_update" ON public.directory_reports
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. EVERYDAY TASKS INTEGRATION IN BOOKINGS
-- Reuses existing booking, quotation, and escrow architecture
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'is_custom_task'
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN is_custom_task boolean NOT NULL DEFAULT false,
      ADD COLUMN budget_estimate_kobo bigint;
  END IF;
END $$;

-- ============================================================================
-- 9. UPDATED MATCHING ENGINE RPC
-- Supports subcategories (parent_id) and provider_type filters
-- ============================================================================

DROP FUNCTION IF EXISTS public.match_service_professionals CASCADE;

CREATE OR REPLACE FUNCTION public.match_service_professionals(
  p_category_id uuid DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_city text DEFAULT 'Port Harcourt',
  p_lga text DEFAULT NULL,
  p_neighbourhood text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_max_distance_km numeric DEFAULT NULL,
  p_target_date date DEFAULT NULL,
  p_target_time time DEFAULT NULL,
  p_min_rating numeric DEFAULT 0.0,
  p_verified_only boolean DEFAULT false,
  p_available_only boolean DEFAULT false,
  p_provider_type text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
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
  provider_type text,
  match_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_ref_geom geography(Point, 4326) := NULL;
  v_day_of_week smallint := NULL;
BEGIN
  -- If coordinates supplied, construct reference point
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_ref_geom := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  -- Determine day of week if date provided (0 = Sunday .. 6 = Saturday)
  IF p_target_date IS NOT NULL THEN
    v_day_of_week := EXTRACT(DOW FROM p_target_date)::smallint;
  END IF;

  RETURN QUERY
  WITH matched_pros AS (
    SELECT DISTINCT ON (pp.id)
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
      pp.provider_type AS pro_type,
      -- Check calendar schedule availability
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
      -- Compute distance using PostGIS ST_Distance (in meters -> km)
      CASE
        WHEN v_ref_geom IS NOT NULL AND psa.geom IS NOT NULL
        THEN ST_Distance(psa.geom, v_ref_geom) / 1000.0
        WHEN v_ref_geom IS NOT NULL AND pp.primary_city = 'Port Harcourt'
        -- Approximate fallback to PH city center (4.8156, 7.0498) if pro area has no GPS
        THEN ST_Distance(ST_SetSRID(ST_MakePoint(7.0498, 4.8156), 4326)::geography, v_ref_geom) / 1000.0
        ELSE NULL
      END AS calc_dist_km,
      -- Check coverage match
      CASE
        WHEN p_neighbourhood IS NOT NULL AND psa.neighbourhood ILIKE '%' || p_neighbourhood || '%' THEN true
        WHEN p_lga IS NOT NULL AND psa.lga_or_district ILIKE '%' || p_lga || '%' THEN true
        WHEN p_city IS NOT NULL AND (psa.city ILIKE '%' || p_city || '%' OR pp.primary_city ILIKE '%' || p_city || '%') THEN true
        ELSE false
      END AS is_area_match,
      -- Category Relevance (including parent/child category hierarchy)
      CASE
        WHEN p_category_id IS NOT NULL AND (ps.category_id = p_category_id OR sc.parent_id = p_category_id) THEN 100.0
        WHEN p_category_slug IS NOT NULL AND (sc.slug = p_category_slug OR sc.parent_id IN (SELECT parent_sc.id FROM public.service_categories parent_sc WHERE parent_sc.slug = p_category_slug)) THEN 100.0
        WHEN p_keyword IS NOT NULL AND (
          sc.name ILIKE '%' || p_keyword || '%'
          OR pp.headline ILIKE '%' || p_keyword || '%'
          OR pp.bio ILIKE '%' || p_keyword || '%'
        ) THEN 80.0
        ELSE 50.0
      END AS cat_score
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    LEFT JOIN public.professional_services ps ON ps.professional_id = pp.id AND ps.is_active = true
    LEFT JOIN public.service_categories sc ON sc.id = ps.category_id
    LEFT JOIN public.professional_service_areas psa ON psa.professional_id = pp.id AND psa.is_active = true
    WHERE pp.deleted_at IS NULL
      -- Verification filter if specified
      AND (NOT p_verified_only OR pp.verification_status = 'approved')
      -- Rating filter
      AND (pp.average_rating >= p_min_rating)
      -- Provider Type Filter (e.g. dispatch_rider, property_agent)
      AND (p_provider_type IS NULL OR pp.provider_type = p_provider_type)
      -- Category filter (including subcategory resolution)
      AND (
        (p_category_id IS NULL AND p_category_slug IS NULL)
        OR (p_category_id IS NOT NULL AND (ps.category_id = p_category_id OR sc.parent_id = p_category_id))
        OR (p_category_slug IS NOT NULL AND (sc.slug = p_category_slug OR sc.parent_id IN (SELECT parent_sc.id FROM public.service_categories parent_sc WHERE parent_sc.slug = p_category_slug)))
      )
      -- Keyword filter
      AND (
        p_keyword IS NULL
        OR p_keyword = ''
        OR pp.business_name ILIKE '%' || p_keyword || '%'
        OR pp.headline ILIKE '%' || p_keyword || '%'
        OR pp.bio ILIKE '%' || p_keyword || '%'
        OR sc.name ILIKE '%' || p_keyword || '%'
      )
      -- City / Area Filter
      AND (
        p_city IS NULL
        OR p_city = 'All Cities'
        OR pp.primary_city ILIKE '%' || p_city || '%'
        OR (psa.city IS NOT NULL AND psa.city ILIKE '%' || p_city || '%')
      )
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
    mp.pro_type AS provider_type,
    -- Match score weighting:
    -- 1. Category relevance (35%)
    -- 2. Location & distance proximity (25%)
    -- 3. Availability verification (15%)
    -- 4. Customer Rating & reviews (15%)
    -- 5. Relevant experience (5%)
    -- 6. Verification trust tier (5%)
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
    -- Availability filter
    (NOT p_available_only OR (mp.pro_is_avail = true AND mp.sched_avail = true))
    -- Distance filter
    AND (p_max_distance_km IS NULL OR mp.calc_dist_km IS NULL OR mp.calc_dist_km <= p_max_distance_km)
  ORDER BY
    match_score DESC,
    mp.pro_rating DESC,
    mp.pro_completed_jobs DESC,
    distance_km ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_service_professionals TO anon, authenticated;

COMMIT;
