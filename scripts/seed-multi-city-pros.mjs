import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function seedMultiCityData() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL.");

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('easylife.trusted_admin_rpc', 'true', true);");

    // 1. Promote Authorized Project Owner (Clever Ezekwe) to System Administrator
    console.log("Promoting project owner ezekweclever@gmail.com to administrator...");
    await client.query(`
      UPDATE public.profiles
      SET primary_role = 'admin',
          is_active = true,
          is_suspended = false,
          updated_at = now()
      WHERE email = 'ezekweclever@gmail.com';

      INSERT INTO public.user_roles (user_id, role, is_active)
      SELECT id, 'admin', true
      FROM public.profiles
      WHERE email = 'ezekweclever@gmail.com'
      ON CONFLICT (user_id, role) DO UPDATE
      SET is_active = true, revoked_at = NULL;
    `);
    console.log("✅ ezekweclever@gmail.com successfully assigned active 'admin' role in profiles and user_roles!");

    // 2. Seed Lagos Verified Professional in auth.users + profiles
    console.log("Seeding Lagos verified professional...");
    const lagosUid = '20000000-0000-4000-8000-000000000001';
    await client.query(`
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        '${lagosUid}',
        'authenticated',
        'authenticated',
        'lagos.electric@easylife.ng',
        'hashed_pro_pass',
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Engr. Babatunde Adeleke"}',
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, email, full_name, primary_role, is_active, city, state, phone)
      VALUES (
        '${lagosUid}',
        'lagos.electric@easylife.ng',
        'Engr. Babatunde Adeleke',
        'professional',
        true,
        'Lagos',
        'Lagos State',
        '+234 802 111 2233'
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        primary_role = 'professional';

      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES ('${lagosUid}', 'professional', true)
      ON CONFLICT (user_id, role) DO NOTHING;
    `);

    const lagosProRes = await client.query(`
      INSERT INTO public.professional_profiles (
        user_id, business_name, slug, headline, bio,
        years_of_experience, verification_status, is_available,
        average_rating, review_count, completed_jobs_count,
        base_callout_fee_kobo, primary_city, primary_state, verified_at
      ) VALUES (
        '${lagosUid}',
        'Lagos Prime Energy & Solar Solutions',
        'lagos-prime-energy-solar',
        'Certified Industrial & Residential Electrical Engineer',
        'Over 12 years of specialized experience in commercial electrical installations, hybrid solar arrays, and inverter battery management across Lagos metropolis.',
        12, 'approved', true, 4.9, 38, 52,
        800000, 'Lagos', 'Lagos State', now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        primary_city = EXCLUDED.primary_city,
        primary_state = EXCLUDED.primary_state,
        verification_status = 'approved',
        is_available = true
      RETURNING id;
    `);
    const lagosProId = lagosProRes.rows[0].id;

    // Multiple Services for Lagos Pro
    console.log("Seeding multiple services for Lagos Pro (ID: " + lagosProId + ")...");
    await client.query(`
      INSERT INTO public.professional_services (
        professional_id, category_id, service_title, min_price_kobo, max_price_kobo, description, is_primary_skill, is_active
      ) VALUES
      (
        '${lagosProId}',
        '10000000-0000-4000-8000-000000000002',
        'Full Distribution Box & House Wiring',
        1500000, 8500000,
        'Complete DB board upgrade, conduit inspection, circuit breakers, and load balancing.',
        true, true
      ),
      (
        '${lagosProId}',
        '10000000-0000-4000-8000-000000000010',
        'Hybrid Solar Panel Array & Inverter Setup',
        2500000, 15000000,
        'High-efficiency monocrystalline solar panels, MPPT charge controllers, and lithium-ion storage integration.',
        false, true
      ),
      (
        '${lagosProId}',
        '10000000-0000-4000-8000-000000000004',
        'Automatic Transfer Switch (ATS) & Generator Link',
        1800000, 6000000,
        'Seamless automatic power changeover switches connecting generator, solar inverter, and public utility.',
        false, true
      )
      ON CONFLICT (professional_id, category_id, COALESCE(service_title, '')) DO NOTHING;
    `);

    // Multiple Service Areas for Lagos Pro
    await client.query(`
      INSERT INTO public.professional_service_areas (
        professional_id, city, state, lga_or_district, neighbourhood, service_radius_km, is_primary, is_active
      ) VALUES
      ('${lagosProId}', 'Lagos', 'Lagos State', 'Ikeja', 'Ikeja GRA & Alausa', 20, true, true),
      ('${lagosProId}', 'Lagos', 'Lagos State', 'Eti-Osa', 'Victoria Island & Ikoyi', 25, false, true),
      ('${lagosProId}', 'Lagos', 'Lagos State', 'Eti-Osa', 'Lekki Phase 1 & 2', 30, false, true),
      ('${lagosProId}', 'Lagos', 'Lagos State', 'Surulere', 'Surulere Axis', 15, false, true)
      ON CONFLICT DO NOTHING;
    `);

    // 3. Seed Abuja Verified Professional in auth.users + profiles
    console.log("Seeding Abuja verified professional...");
    const abujaUid = '20000000-0000-4000-8000-000000000002';
    await client.query(`
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        '${abujaUid}',
        'authenticated',
        'authenticated',
        'abuja.hvac@easylife.ng',
        'hashed_pro_pass',
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Engr. Usman Bello"}',
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.profiles (id, email, full_name, primary_role, is_active, city, state, phone)
      VALUES (
        '${abujaUid}',
        'abuja.hvac@easylife.ng',
        'Engr. Usman Bello',
        'professional',
        true,
        'Abuja',
        'FCT',
        '+234 809 333 4455'
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        primary_role = 'professional';

      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES ('${abujaUid}', 'professional', true)
      ON CONFLICT (user_id, role) DO NOTHING;
    `);

    const abujaProRes = await client.query(`
      INSERT INTO public.professional_profiles (
        user_id, business_name, slug, headline, bio,
        years_of_experience, verification_status, is_available,
        average_rating, review_count, completed_jobs_count,
        base_callout_fee_kobo, primary_city, primary_state, verified_at
      ) VALUES (
        '${abujaUid}',
        'Abuja Capital HVAC & Cooling Masters',
        'abuja-capital-hvac-cooling',
        'Certified Air Conditioning, Chiller & Refrigeration Specialist',
        'Over 10 years serving diplomatic missions, residential estates, and commercial plazas across the Federal Capital Territory with certified HVAC diagnostics and maintenance.',
        10, 'approved', true, 5.0, 44, 68,
        750000, 'Abuja', 'FCT', now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        primary_city = EXCLUDED.primary_city,
        primary_state = EXCLUDED.primary_state,
        verification_status = 'approved',
        is_available = true
      RETURNING id;
    `);
    const abujaProId = abujaProRes.rows[0].id;

    // Multiple Services for Abuja Pro
    console.log("Seeding multiple services for Abuja Pro (ID: " + abujaProId + ")...");
    await client.query(`
      INSERT INTO public.professional_services (
        professional_id, category_id, service_title, min_price_kobo, max_price_kobo, description, is_primary_skill, is_active
      ) VALUES
      (
        '${abujaProId}',
        '10000000-0000-4000-8000-000000000003',
        'Split AC Chemical Coil Washing & Gas Top-up',
        1800000, 3500000,
        'High-pressure chemical coil wash, drain unclogging, and virgin R410a/R22 refrigerant recharge.',
        true, true
      ),
      (
        '${abujaProId}',
        '10000000-0000-4000-8000-000000000003',
        'Commercial Chiller & Standing AC Compressor Service',
        3500000, 12000000,
        'Heavy-duty floor-standing and central duct chiller system diagnostics, relay repairs, and compressor replacement.',
        false, true
      ),
      (
        '${abujaProId}',
        '10000000-0000-4000-8000-000000000002',
        'Dedicated AC Surge & Phase-Failure Protector Fitting',
        1200000, 2800000,
        'Installation of industrial voltage monitor protectors to shield cooling compressors from grid brownouts.',
        false, true
      )
      ON CONFLICT (professional_id, category_id, COALESCE(service_title, '')) DO NOTHING;
    `);

    // Multiple Service Areas for Abuja Pro
    await client.query(`
      INSERT INTO public.professional_service_areas (
        professional_id, city, state, lga_or_district, neighbourhood, service_radius_km, is_primary, is_active
      ) VALUES
      ('${abujaProId}', 'Abuja', 'FCT', 'Abuja Municipal', 'Maitama & Asokoro', 20, true, true),
      ('${abujaProId}', 'Abuja', 'FCT', 'Abuja Municipal', 'Wuse 2 & Central Area', 20, false, true),
      ('${abujaProId}', 'Abuja', 'FCT', 'Abuja Municipal', 'Jabi, Utako & Life Camp', 20, false, true),
      ('${abujaProId}', 'Abuja', 'FCT', 'Abuja Municipal', 'Gwarinpa Estate', 25, false, true),
      ('${abujaProId}', 'Abuja', 'FCT', 'Bwari', 'Kubwa Satellite Town', 30, false, true)
      ON CONFLICT DO NOTHING;
    `);

    // 4. Update Port Harcourt Pro to also have multiple services
    console.log("Adding multiple services to Port Harcourt existing Pro...");
    const phProRes = await client.query(`
      SELECT id FROM public.professional_profiles WHERE primary_city = 'Port Harcourt' LIMIT 1;
    `);
    if (phProRes.rows.length > 0) {
      const phProId = phProRes.rows[0].id;
      await client.query(`
        INSERT INTO public.professional_services (
          professional_id, category_id, service_title, min_price_kobo, max_price_kobo, description, is_primary_skill, is_active
        ) VALUES
        (
          '${phProId}',
          '10000000-0000-4000-8000-000000000001',
          'Submersible Borehole Pump & Pressure Tank Repair',
          2500000, 9500000,
          'Control box diagnosis, capacitor replacement, and high-head submersible pump retrieval/installation.',
          false, true
        ),
        (
          '${phProId}',
          '10000000-0000-4000-8000-000000000001',
          'Overhead Tank Scaffold & Pipe Manifold Plumbing',
          1800000, 6500000,
          'PPR/PVC piping, float switch automation, and bypass distribution manifolds for multi-tenant homes.',
          false, true
        )
        ON CONFLICT (professional_id, category_id, COALESCE(service_title, '')) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO public.professional_service_areas (
          professional_id, city, state, lga_or_district, neighbourhood, service_radius_km, is_primary, is_active
        ) VALUES
        ('${phProId}', 'Port Harcourt', 'Rivers State', 'Port Harcourt City', 'Peter Odili Road & Trans-Amadi', 15, true, true),
        ('${phProId}', 'Port Harcourt', 'Rivers State', 'Port Harcourt City', 'Old & New GRA', 20, false, true),
        ('${phProId}', 'Port Harcourt', 'Rivers State', 'Obio/Akpor', 'Woji & Rumuokoro', 20, false, true),
        ('${phProId}', 'Port Harcourt', 'Rivers State', 'Eleme', 'Aleto & Onne', 25, false, true)
        ON CONFLICT DO NOTHING;
      `);
    }

    await client.query("COMMIT;");
    console.log("✅ Successfully seeded multi-city verified providers, multiple services, and official admin account!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Seeding error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

seedMultiCityData().catch(console.error);
