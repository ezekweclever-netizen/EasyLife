/**
 * test-business-portal.mjs
 * Comprehensive end-to-end test suite for Prompt 15:
 * Business and Property Maintenance Management Portal
 */

import pg from 'pg';
import { getDatabaseUrl } from './_env.mjs';
const { Pool } = pg;

const CONNECTION_STRING = getDatabaseUrl();

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

let testUserId;
let testBusinessId;
let propertyAId;
let propertyBId;
let assetAcId;
let assetGenId;
let assetSolarId;
let assetPumpId;
let maintenanceRequestId;
let scheduleUpcomingId;
let scheduleOverdueId;

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('🧪 RUNNING PROMPT 15 VERIFICATION: BUSINESS & PROPERTY MAINTENANCE');
  console.log('===============================================================\n');

  try {
    // 0. Setup a test owner user
    console.log('--- Step 0: Ensure Test User Exists ---');
    const userRes = await pool.query(`
      SELECT id, email FROM profiles LIMIT 1;
    `);
    if (userRes.rows.length === 0) {
      throw new Error('No user profiles found in database. Cannot run business tests without a user.');
    }
    testUserId = userRes.rows[0].id;
    console.log(`Using test owner user ID: ${testUserId} (${userRes.rows[0].email})\n`);

    // 1. Business Registration
    console.log('--- Step 1: Business Account Registration ---');
    const slug = `test-corp-${Date.now()}`;
    const createBizRes = await pool.query(
      `SELECT create_business_account(
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::text
      ) as res;`,
      [
        testUserId,
        'Apex Industrial & Facility Services Ltd',
        slug,
        'facilities@apex-industrial.ng',
        '+234 803 111 2233',
        'Commercial Facility Management',
        'RC-9876543',
        'Port Harcourt',
        'Rivers State',
        'Plot 18 Trans-Amadi Industrial Layout, Port Harcourt',
      ]
    );

    const bizResult = createBizRes.rows[0].res;
    testBusinessId = bizResult.business_id;
    assert(Boolean(testBusinessId), 'create_business_account returned a valid business ID');

    // Verify business record
    const bizCheck = await pool.query(
      `SELECT * FROM businesses WHERE id = $1`,
      [testBusinessId]
    );
    assert(bizCheck.rows.length === 1, 'Business record persisted in businesses table');
    assert(bizCheck.rows[0].name === 'Apex Industrial & Facility Services Ltd', 'Business name matches');
    assert(bizCheck.rows[0].owner_id === testUserId, 'Owner ID correctly set');

    // Verify owner was automatically added to business_members with owner role & all permissions
    const memberCheck = await pool.query(
      `SELECT * FROM business_members WHERE business_id = $1 AND user_id = $2`,
      [testBusinessId, testUserId]
    );
    assert(memberCheck.rows.length === 1, 'Owner is registered in business_members');
    assert(memberCheck.rows[0].member_role === 'owner', 'Owner role is correctly assigned');
    assert(Array.isArray(memberCheck.rows[0].permissions), 'Permissions JSONB is an array');

    // Verify default location in business_locations
    const locCheck = await pool.query(
      `SELECT * FROM business_locations WHERE business_id = $1`,
      [testBusinessId]
    );
    assert(locCheck.rows.length >= 1, 'Default business location created in business_locations');
    assert(locCheck.rows[0].is_headquarters === true, 'Headquarters location flag is set');
    assert(locCheck.rows[0].city === 'Port Harcourt', 'Location city is Port Harcourt');
    console.log('');

    // 2. Property Management
    console.log('--- Step 2: Property Management ---');
    // Create Property A (Commercial Hub)
    const propARes = await pool.query(
      `SELECT manage_business_property(
        null::uuid,
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::text,
        $5::property_type,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::int,
        $11::text
      ) as res;`,
      [
        testBusinessId,
        testUserId,
        'Apex Headquarters & Logistics Center',
        'APEX-HQ-01',
        'commercial',
        '14 Trans-Amadi Industrial Layout',
        'Port Harcourt',
        'Rivers State',
        'Port Harcourt City LGA',
        12,
        'Access badge required at gate 2. Dedicated transformer and generator house.',
      ]
    );
    propertyAId = propARes.rows[0].res.property_id;
    assert(Boolean(propertyAId), 'Property A created successfully');

    // Create Property B (Residential Complex)
    const propBRes = await pool.query(
      `SELECT manage_business_property(
        null::uuid,
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::text,
        $5::property_type,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::int,
        $11::text
      ) as res;`,
      [
        testBusinessId,
        testUserId,
        'Apex Executive Staff Residences',
        'APEX-RES-02',
        'residential',
        'Plot 45 Old GRA, Near Government House',
        'Port Harcourt',
        'Rivers State',
        'Port Harcourt City LGA',
        6,
        'Staff executive quarters with 24/7 central solar-inverter backup.',
      ]
    );
    propertyBId = propBRes.rows[0].res.property_id;
    assert(Boolean(propertyBId), 'Property B created successfully');

    // Update Property A details (e.g. increase units count and edit notes)
    const updatePropRes = await pool.query(
      `SELECT manage_business_property(
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::text,
        $5::text,
        $6::property_type,
        $7::text,
        $8::text,
        $9::text,
        $10::text,
        $11::int,
        $12::text
      ) as res;`,
      [
        propertyAId,
        testBusinessId,
        testUserId,
        'Apex Headquarters & Logistics Center',
        'APEX-HQ-01',
        'commercial',
        '14 Trans-Amadi Industrial Layout',
        'Port Harcourt',
        'Rivers State',
        'Port Harcourt City LGA',
        16, // updated from 12 to 16
        'Updated: 16 commercial office units and server room.',
      ]
    );
    assert(updatePropRes.rows[0].res.property_id === propertyAId, 'Property A updated without creating duplicate');

    const propACheck = await pool.query(`SELECT units_count, notes FROM properties WHERE id = $1`, [propertyAId]);
    assert(propACheck.rows[0].units_count === 16, 'Property units count updated to 16');
    console.log('');

    // 3. Asset Management (Equipment Registry)
    console.log('--- Step 3: Maintainable Asset Registration ---');
    // Asset 1: Generator
    const genRes = await pool.query(
      `SELECT manage_business_asset(
        null::uuid,
        $1::uuid,
        $2::uuid,
        null::uuid,
        $3::asset_category_type,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::asset_status,
        $11::date,
        $12::int,
        $13::jsonb,
        $14::jsonb,
        $15::text
      ) as res;`,
      [
        testBusinessId,
        propertyAId,
        'generator',
        '500kVA Cummins Heavy Duty Diesel Generator',
        'GEN-HQ-01',
        'Cummins',
        'C500D5e',
        'SN-CMNS-2024-8891',
        'Main Generator House, Bay 1',
        'operational',
        '2024-03-15',
        30, // 30-day service cycle
        JSON.stringify({ rated_kva: 500, fuel_type: 'Diesel', oil_capacity_litres: 45 }),
        JSON.stringify([
          { name: 'O&M Manual', url: 'https://cdn.apex.ng/docs/cummins-manual.pdf' },
          { name: 'Commissioning Certificate', url: 'https://cdn.apex.ng/docs/cummins-cert.pdf' },
        ]),
        'Primary power standby. Requires 250-hour oil & filter replacements.',
      ]
    );
    assetGenId = genRes.rows[0].res.asset_id;
    assert(Boolean(assetGenId), 'Generator asset registered successfully');

    // Asset 2: Air Conditioner
    const acRes = await pool.query(
      `SELECT manage_business_asset(
        null::uuid,
        $1::uuid,
        $2::uuid,
        null::uuid,
        $3::asset_category_type,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::asset_status,
        $11::date,
        $12::int,
        $13::jsonb,
        $14::jsonb,
        $15::text
      ) as res;`,
      [
        testBusinessId,
        propertyAId,
        'air_conditioner',
        'Server Room Precision AC Unit 1',
        'AC-SRV-01',
        'Daikin',
        'FTKM50',
        'SN-DKN-90214',
        'Server Room Level 2',
        'operational',
        '2024-06-01',
        60, // 60 days
        JSON.stringify({ cooling_capacity_btu: 24000, refrigerant: 'R32' }),
        JSON.stringify([]),
        'Critical 24/7 cooling for corporate data servers.',
      ]
    );
    assetAcId = acRes.rows[0].res.asset_id;
    assert(Boolean(assetAcId), 'Air conditioner asset registered successfully');

    // Asset 3: Solar & Inverter System
    const solarRes = await pool.query(
      `SELECT manage_business_asset(
        null::uuid,
        $1::uuid,
        $2::uuid,
        null::uuid,
        $3::asset_category_type,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::asset_status,
        $11::date,
        $12::int,
        $13::jsonb,
        $14::jsonb,
        $15::text
      ) as res;`,
      [
        testBusinessId,
        propertyBId,
        'solar_system',
        '15kVA Solar Hybrid Backup System',
        'SOLAR-RES-01',
        'Felicity Solar',
        'FL-IV-15K',
        'SN-FLC-2024-118',
        'Inverter Room & Rooftop Arrays',
        'operational',
        '2024-01-20',
        90, // 90 days
        JSON.stringify({ battery_capacity_kwh: 30, pv_watts: 8000 }),
        JSON.stringify([{ name: 'Solar Warranty', url: 'https://cdn.apex.ng/warranty-solar.pdf' }]),
        'Supplies 24hr quiet power to residence suites.',
      ]
    );
    assetSolarId = solarRes.rows[0].res.asset_id;
    assert(Boolean(assetSolarId), 'Solar system asset registered successfully');

    // Asset 4: Water Pump
    const pumpRes = await pool.query(
      `SELECT manage_business_asset(
        null::uuid,
        $1::uuid,
        $2::uuid,
        null::uuid,
        $3::asset_category_type,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::asset_status,
        $11::date,
        $12::int,
        $13::jsonb,
        $14::jsonb,
        $15::text
      ) as res;`,
      [
        testBusinessId,
        propertyAId,
        'pump',
        '3HP Submersible Borehole Pump & Pressure System',
        'PUMP-BH-01',
        'Grundfos',
        'SQFlex-3',
        'SN-GDF-78190',
        'Water Treatment Plant',
        'operational',
        '2024-02-10',
        180, // 180 days
        JSON.stringify({ horsepower: 3, flow_rate_lpm: 120 }),
        JSON.stringify([]),
        'Primary water supply for corporate office towers.',
      ]
    );
    assetPumpId = pumpRes.rows[0].res.asset_id;
    assert(Boolean(assetPumpId), 'Water pump asset registered successfully');

    // Verify Asset Categories & Attributes
    const assetsCheck = await pool.query(
      `SELECT id, name, asset_category, serial_number, maintenance_interval_days, documents FROM assets WHERE business_id = $1`,
      [testBusinessId]
    );
    assert(assetsCheck.rows.length === 4, 'All 4 equipment assets stored for business');
    const genCheck = assetsCheck.rows.find((a) => a.id === assetGenId);
    assert(genCheck.asset_category === 'generator', 'Asset category is generator');
    assert(genCheck.serial_number === 'SN-CMNS-2024-8891', 'Serial number preserved');
    assert(genCheck.maintenance_interval_days === 30, 'Maintenance interval days stored');
    assert(Array.isArray(genCheck.documents) && genCheck.documents.length === 2, 'Supporting documents stored');
    console.log('');

    // 4. Maintenance Management (Fault Reporting, Requests, Work & Invoice Recording)
    console.log('--- Step 4: Maintenance Management & Cost Recording ---');
    // Create Maintenance Request for Generator (no scheduled date initially -> status 'open')
    const reqRes = await pool.query(
      `SELECT create_business_maintenance_request(
        $1::uuid,
        $2::uuid,
        $3::uuid,
        null::uuid,
        $4::uuid,
        $5::text,
        $6::text,
        $7::fault_severity_level,
        null::uuid,
        null::timestamptz,
        $8::bigint,
        $9::jsonb
      ) as res;`,
      [
        testBusinessId,
        propertyAId,
        assetGenId,
        testUserId,
        'Generator starter motor clicking, low crank voltage',
        'Technician inspection noted starter solenoid sticking after rain. Generator failed to start on grid outage.',
        'high',
        7500000, // 75,000 NGN (in kobo)
        JSON.stringify(['https://cdn.apex.ng/photos/starter-motor-fault.jpg']),
      ]
    );
    maintenanceRequestId = reqRes.rows[0].res.maintenance_request_id;
    assert(Boolean(maintenanceRequestId), 'Maintenance request created successfully');

    const reqCheck = await pool.query(`SELECT * FROM maintenance_requests WHERE id = $1`, [maintenanceRequestId]);
    assert(reqCheck.rows[0].status === 'open', 'Initial maintenance request status is open');
    assert(reqCheck.rows[0].fault_severity === 'high', 'Severity recorded as high');
    assert(Number(reqCheck.rows[0].estimated_cost_kobo) === 7500000, 'Estimated cost in kobo is 7500000 (NGN 75,000)');

    // Record Maintenance Completion, Work Done, Invoice, and Cost
    const compRes = await pool.query(
      `SELECT record_business_maintenance_completion(
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::uuid,
        $5::uuid,
        $6::text,
        $7::text,
        $8::text,
        $9::bigint,
        $10::text,
        null::uuid,
        $11::text,
        $12::text,
        $13::jsonb
      ) as res;`,
      [
        maintenanceRequestId,
        testBusinessId,
        propertyAId,
        assetGenId,
        testUserId,
        'Engr. Chidi Amadi (Diesel Power Services PH)',
        'Cummins Starter Motor Replacement & Battery Bank Reconditioning',
        'Removed defective 24V Delco Remy starter motor. Installed brand new Cummins OEM solenoid and starter. Tested full load transfer: 420kW for 45 minutes.',
        8200000, // 82,000 NGN actual cost in kobo
        '1x 24V Starter Motor, 2x Battery Terminal Clamps',
        'INV-2026-APEX-049',
        'https://cdn.apex.ng/invoices/inv-049-starter-motor.pdf',
        JSON.stringify([{ name: 'Signed Job Card', url: 'https://cdn.apex.ng/job-card-049.pdf' }]),
      ]
    );
    const maintenanceRecordId = compRes.rows[0].res.maintenance_record_id;
    assert(Boolean(maintenanceRecordId), 'Maintenance record logged successfully');

    // Verify request transitioned to 'completed' and actual cost updated
    const reqUpdated = await pool.query(`SELECT status, actual_cost_kobo, invoice_number, invoice_url FROM maintenance_requests WHERE id = $1`, [
      maintenanceRequestId,
    ]);
    assert(reqUpdated.rows[0].status === 'completed', 'Request status transitioned to completed');
    assert(Number(reqUpdated.rows[0].actual_cost_kobo) === 8200000, 'Actual cost recorded as 8,200,000 kobo (NGN 82,000)');
    assert(reqUpdated.rows[0].invoice_number === 'INV-2026-APEX-049', 'Invoice number recorded on maintenance request');
    assert(reqUpdated.rows[0].invoice_url === 'https://cdn.apex.ng/invoices/inv-049-starter-motor.pdf', 'Invoice URL recorded on maintenance request');

    // Verify maintenance_record entry
    const recordCheck = await pool.query(`SELECT * FROM maintenance_records WHERE id = $1`, [maintenanceRecordId]);
    assert(recordCheck.rows.length === 1, 'Record persisted in maintenance_records');
    assert(Number(recordCheck.rows[0].cost_kobo) === 8200000, 'Cost in kobo recorded on history record');
    assert(Boolean(recordCheck.rows[0].performed_at), 'performed_at timestamp recorded');
    console.log('');

    // 5. Maintenance Reminders (Schedules: Upcoming, Overdue, Completed)
    console.log('--- Step 5: Maintenance Schedules & Reminders ---');
    // Schedule 1: Upcoming (due next week)
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const catRes = await pool.query(`SELECT id FROM service_categories LIMIT 1;`);
    const fallbackCatId = catRes.rows[0]?.id;

    const schedUpcomingRes = await pool.query(
      `INSERT INTO maintenance_schedules (
        business_id, property_id, asset_id, category_id, created_by,
        title, description, frequency, interval_days, estimated_cost_kobo, next_due_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING id;`,
      [
        testBusinessId,
        propertyAId,
        assetAcId,
        fallbackCatId,
        testUserId,
        'Server Room AC Monthly Filter Clean & Gas Check',
        'Routine preventive service: clean dust filters, inspect coils, measure R32 suction pressure.',
        'monthly',
        30,
        2500000, // 25,000 NGN
        futureDate,
      ]
    );
    scheduleUpcomingId = schedUpcomingRes.rows[0].id;
    assert(Boolean(scheduleUpcomingId), 'Upcoming maintenance schedule created');

    // Schedule 2: Overdue (due 5 days ago)
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    const schedOverdueRes = await pool.query(
      `INSERT INTO maintenance_schedules (
        business_id, property_id, asset_id, category_id, created_by,
        title, description, frequency, interval_days, estimated_cost_kobo, next_due_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING id;`,
      [
        testBusinessId,
        propertyAId,
        assetPumpId,
        fallbackCatId,
        testUserId,
        'Borehole Pressure Vessel Diaphragm Test',
        'Check pump cut-in pressure (2.5 bar) and cut-out pressure (4.0 bar).',
        'quarterly',
        90,
        1500000, // 15,000 NGN
        pastDate,
      ]
    );
    scheduleOverdueId = schedOverdueRes.rows[0].id;
    assert(Boolean(scheduleOverdueId), 'Overdue maintenance schedule created');

    // Verify overdue schedule detection
    const overdueQuery = await pool.query(
      `SELECT id, title, next_due_date FROM maintenance_schedules
       WHERE business_id = $1 AND is_active = true AND next_due_date < CURRENT_DATE`,
      [testBusinessId]
    );
    assert(overdueQuery.rows.length === 1, 'Exactly 1 overdue schedule identified');
    assert(overdueQuery.rows[0].id === scheduleOverdueId, 'Identified overdue schedule matches');

    // Verify upcoming schedule detection
    const upcomingQuery = await pool.query(
      `SELECT id, title, next_due_date FROM maintenance_schedules
       WHERE business_id = $1 AND is_active = true AND next_due_date >= CURRENT_DATE`,
      [testBusinessId]
    );
    assert(upcomingQuery.rows.length === 1, 'Exactly 1 upcoming schedule identified');
    assert(upcomingQuery.rows[0].id === scheduleUpcomingId, 'Identified upcoming schedule matches');
    console.log('');

    // 6. Dashboard Metrics
    console.log('--- Step 6: Business Dashboard Metrics Verification ---');
    const metricsRes = await pool.query(`SELECT get_business_dashboard_metrics($1::uuid) as metrics;`, [
      testBusinessId,
    ]);
    const metrics = metricsRes.rows[0].metrics;
    console.log('Computed Dashboard Metrics:', JSON.stringify(metrics, null, 2));

    assert(metrics.total_properties === 2, 'Total properties metric is 2');
    assert(metrics.registered_assets === 4, 'Registered assets metric is 4');
    assert(metrics.open_maintenance_requests === 0, 'Open requests is 0 (since our 1 request completed)');
    assert(metrics.upcoming_maintenance === 1, 'Upcoming maintenance count is 1');
    assert(metrics.overdue_maintenance === 1, 'Overdue maintenance count is 1');
    assert(Number(metrics.total_expenditure_kobo) === 8200000, 'Total expenditure in kobo is 8,200,000');
    assert(metrics.total_expenditure_naira === 82000, 'Total expenditure in Naira is 82,000');
    assert(Array.isArray(metrics.recent_activities) && metrics.recent_activities.length >= 1, 'Recent activities contains logs');
    console.log('');

    // 7. Team & Access Control
    console.log('--- Step 7: Team Members & Role Invitations ---');
    const inviteRes = await pool.query(
      `INSERT INTO business_invitations (
        business_id, email, role, permissions, invited_by, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, email, role, permissions, status;`,
      [
        testBusinessId,
        'facility.engineer@apex-industrial.ng',
        'facility_manager',
        JSON.stringify(['view', 'create_requests', 'manage_assets', 'approve_requests']),
        testUserId,
      ]
    );
    assert(inviteRes.rows.length === 1, 'Team invitation recorded');
    assert(inviteRes.rows[0].role === 'facility_manager', 'Role is facility_manager');
    assert(inviteRes.rows[0].status === 'pending', 'Status is pending');

    // Verify RLS membership helper
    const memberFunc = await pool.query(
      `SELECT is_business_member($1::uuid) as is_member;`,
      [testBusinessId]
    );
    console.log('is_business_member function callable:', memberFunc.rows[0]);
    console.log('');

    console.log('===============================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PROMPT 15 VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
