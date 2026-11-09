import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== EasyLife Prompt 9 — Professional Registration & Dashboard Test Suite ===\n');

let passedCount = 0;
let failedCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

const rootDir = process.cwd();
const webDir = path.join(rootDir, 'apps', 'web', 'src');

// 1. Routes & Pages Verification
console.log('1. Verifying Professional Navigation & Route Pages:');
const requiredRoutes = [
  { name: 'Professional Dashboard (1. Dashboard)', file: 'app/pro/dashboard/page.tsx' },
  { name: 'Job Requests Management (2. Job Requests)', file: 'app/pro/jobs/page.tsx' },
  { name: 'Single Job Inspection & Handover', file: 'app/pro/jobs/[id]/page.tsx' },
  { name: 'Quotations Management (3. Quotations)', file: 'app/pro/quotations/page.tsx' },
  { name: 'Customer & Support Messages (4. Messages)', file: 'app/pro/messages/page.tsx' },
  { name: 'Escrow Earnings & Ledger (5. Earnings)', file: 'app/pro/earnings/page.tsx' },
  { name: 'Professional Profile & KYC (6. Profile)', file: 'app/pro/profile/page.tsx' },
  { name: 'Professional Registration Wizard', file: 'app/pro/register/page.tsx' },
  { name: 'Professional Layout Shell', file: 'app/pro/layout.tsx' },
];

for (const r of requiredRoutes) {
  test(`Route exists: ${r.name} (${r.file})`, () => {
    const fullPath = path.join(webDir, r.file);
    assert.ok(fs.existsSync(fullPath), `Missing file: ${r.file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.length > 50, `File is too small: ${r.file}`);
  });
}

// 2. Navigation Header (All 6 Required Items)
console.log('\n2. Verifying Professional Header (6 Required Navigation Items):');
const headerPath = path.join(webDir, 'components', 'pro', 'pro-header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

const navItems = [
  { label: 'Dashboard', href: '/pro/dashboard' },
  { label: 'Job Requests', href: '/pro/jobs' },
  { label: 'Quotations', href: '/pro/quotations' },
  { label: 'Messages', href: '/pro/messages' },
  { label: 'Earnings', href: '/pro/earnings' },
  { label: 'Profile', href: '/pro/profile' },
];

for (const it of navItems) {
  test(`Navigation contains item: ${it.label} -> ${it.href}`, () => {
    assert.ok(
      headerContent.includes(it.label) && headerContent.includes(it.href),
      `Header missing nav item ${it.label}`
    );
  });
}

test('Header displays dynamic Verification Status Badge', () => {
  assert.ok(
    headerContent.includes('verificationStatus') &&
    headerContent.includes('Verified Pro') &&
    headerContent.includes('Under Review') &&
    headerContent.includes('Unverified'),
    'Header missing verification status badge logic'
  );
});

// 3. Registration Requirements
console.log('\n3. Verifying Professional Registration Fields Collected:');
const wizardPath = path.join(webDir, 'components', 'pro', 'pro-register-wizard.tsx');
const wizardContent = fs.readFileSync(wizardPath, 'utf8');

const registrationFields = [
  { name: 'Business or trade brand name', token: 'businessName' },
  { name: 'Description / trade bio', token: 'bio' },
  { name: 'Years of experience', token: 'yearsExperience' },
  { name: 'Service categories selection', token: 'categoryIds' },
  { name: 'Residential / workshop location (pilot city)', token: 'city' },
  { name: 'Service areas (LGA / district)', token: 'lgaOrDistrict' },
  { name: 'Working hours (start and end times)', token: 'startTime' },
  { name: 'Base callout / diagnosis fee', token: 'baseCalloutFee' },
];

for (const field of registrationFields) {
  test(`Registration collects: ${field.name}`, () => {
    assert.ok(wizardContent.includes(field.token), `Wizard missing field: ${field.name}`);
  });
}

// 4. Secure Document Submission & Verification Statuses
console.log('\n4. Verifying Secure Document Submission & Verification Statuses:');
const docUploadPath = path.join(webDir, 'components', 'pro', 'document-upload-card.tsx');
const docUploadContent = fs.readFileSync(docUploadPath, 'utf8');

const documentTypes = [
  { name: 'Identity: National ID (NIN)', token: 'national_id_nin' },
  { name: "Identity: Voter's Card", token: 'voters_card' },
  { name: "Identity: Driver's License", token: 'drivers_license' },
  { name: 'Identity: International Passport', token: 'international_passport' },
  { name: 'Business: CAC Registration Certificate', token: 'cac_certificate' },
  { name: 'Qualifications: Trade Certificate / NABTEB', token: 'trade_certificate' },
  { name: 'Supporting Evidence: Proof of Address / Endorsement', token: 'utility_bill' },
];

for (const doc of documentTypes) {
  test(`Document submission supports: ${doc.name}`, () => {
    assert.ok(docUploadContent.includes(doc.token), `Missing document type: ${doc.token}`);
  });
}

test('Document number is masked for NDPA compliance & privacy', () => {
  assert.ok(
    docUploadContent.includes('document_number_masked') || docUploadContent.includes('documentNumber'),
    'Document upload missing masking support'
  );
});

const bannerPath = path.join(webDir, 'components', 'pro', 'verification-banner.tsx');
const bannerContent = fs.readFileSync(bannerPath, 'utf8');

const verificationStatuses = [
  'unsubmitted',
  'pending',
  'approved',
  'rejected',
  'suspended',
];

for (const st of verificationStatuses) {
  test(`Verification status handled in UI: ${st}`, () => {
    assert.ok(bannerContent.includes(st), `Banner missing status handler: ${st}`);
  });
}

// 5. Professional Dashboard Sections
console.log('\n5. Verifying Professional Dashboard Sections:');
const dashPath = path.join(webDir, 'app', 'pro', 'dashboard', 'page.tsx');
const dashContent = fs.readFileSync(dashPath, 'utf8');

const dashboardSections = [
  { name: 'New service requests list', token: 'openRequests' },
  { name: 'Pending quotations section', token: 'pendingQuotations' },
  { name: 'Active jobs section', token: 'activeJobs' },
  { name: 'Upcoming appointments tracker', token: 'upcomingAppointments' },
  { name: 'Completed jobs tracking & count', token: 'completed_jobs_count' },
  { name: 'Performance statistics', token: 'PerformanceStats' },
  { name: 'Profile completion progress meter', token: 'ProfileCompletionMeter' },
  { name: 'Verification status banner', token: 'VerificationBanner' },
];

for (const sec of dashboardSections) {
  test(`Dashboard displays: ${sec.name}`, () => {
    assert.ok(dashContent.includes(sec.token), `Dashboard missing: ${sec.name}`);
  });
}

// 6. Job Management, Privacy Protection & Anti-Escalation
console.log('\n6. Verifying Job Management, Customer Privacy & Database Guards:');
const proSupabasePath = path.join(webDir, 'lib', 'supabase', 'pro.ts');
const proSupabaseContent = fs.readFileSync(proSupabasePath, 'utf8');

test('Customer privacy: street address masked on unassigned open requests', () => {
  assert.ok(
    proSupabaseContent.includes('Street address protected until quotation accepted') ||
    proSupabaseContent.includes('[Street address protected'),
    'Missing customer address masking for open requests'
  );
});

test('Customer privacy: phone number masked for unrelated professionals', () => {
  assert.ok(
    proSupabaseContent.includes('customer_phone_masked'),
    'Missing customer phone masking'
  );
});

const quoteModalPath = path.join(webDir, 'components', 'pro', 'quotation-modal.tsx');
const quoteModalContent = fs.readFileSync(quoteModalPath, 'utf8');

test('Quotation preparation: itemized labor, parts, callout, transport', () => {
  assert.ok(
    quoteModalContent.includes('labor') &&
    quoteModalContent.includes('parts') &&
    quoteModalContent.includes('callout') &&
    quoteModalContent.includes('transport'),
    'Quotation modal missing required line item types'
  );
});

test('Quotation preparation: live total amount calculation & duration', () => {
  assert.ok(
    quoteModalContent.includes('subtotalNaira') &&
    quoteModalContent.includes('estimatedDurationMinutes'),
    'Quotation modal missing calculation and duration'
  );
});

const jobActionsPath = path.join(webDir, 'components', 'pro', 'job-status-actions.tsx');
const jobActionsContent = fs.readFileSync(jobActionsPath, 'utf8');

test('Job management actions: Start accepted job (in_progress)', () => {
  assert.ok(
    jobActionsContent.includes('start_job') && jobActionsContent.includes('in_progress'),
    'Missing start job action'
  );
});

test('Job management actions: Submit completion request with notes (pro_marked_complete)', () => {
  assert.ok(
    jobActionsContent.includes('submit_completion') &&
    jobActionsContent.includes('pro_marked_complete') &&
    jobActionsContent.includes('completionNotes'),
    'Missing completion request action'
  );
});

test('Job management actions: Update appointment information', () => {
  assert.ok(
    jobActionsContent.includes('update_appointment') && jobActionsContent.includes('scheduledStartAt'),
    'Missing update appointment action'
  );
});

// 7. Security Trigger Verification
console.log('\n7. Verifying Database Security Trigger for Pro Verification Guard:');
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261104000500_comprehensive_rls_storage_and_admin_security.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

test('Anti-tamper: Pro cannot set verification_status to approved without admin approval', () => {
  assert.ok(
    migrationContent.includes('FORBIDDEN: Only administrators can approve or suspend professional verification.') &&
    migrationContent.includes('trg_professional_profiles_security_guard'),
    'Missing DB trigger enforcing admin-only approval'
  );
});

console.log('\n======================================================');
console.log(`Results: ${passedCount} passed, ${failedCount} failed`);

if (failedCount > 0) {
  console.error('=== SOME PROMPT 9 TESTS FAILED ===');
  process.exit(1);
} else {
  console.log('=== ALL PROMPT 9 PROFESSIONAL EXPERIENCE CHECKS PASSED ===');
}
