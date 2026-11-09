-- ============================================================================
-- DEVELOPMENT SEED DATA: supabase/seed/dev_seed.sql
-- WARNING: DEVELOPMENT / TESTING ENVIRONMENT ONLY.
-- Contains foundational service categories, platform settings, and clearly
-- labelled [FICTIONAL DEV TEST] records using the RFC 2606 '.invalid' domain.
-- No real user PII, no fake customer reviews, and no fabricated transactions.
-- ============================================================================

BEGIN;

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

COMMIT;
