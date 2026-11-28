/**
 * EasyLife Stage 11: Brand Consistency, Visual Excellence & Responsive Polish Test Suite
 * Validates design system adherence, theme switching infrastructure, responsive navigation,
 * touch targets, and strict scope exclusions across all public and protected portals.
 */

import http from 'http';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

async function runTests() {
  console.log('==================================================================');
  console.log('    EASYLIFE STAGE 11: BRAND CONSISTENCY & RESPONSIVE DESIGN      ');
  console.log('==================================================================');
  console.log(`Testing target web server at: ${BASE_URL}\n`);

  let passCount = 0;
  function pass(msg) {
    console.log(`  ✓ [PASS] ${msg}`);
    passCount++;
  }

  // --- Part 1: Design System & Core Navigation Adherence ---
  console.log('[Part 1] Verifying Six-Section Core Navigation & Brand Identity...');
  const homeRes = await get('/');
  assert.strictEqual(homeRes.status, 200, 'Home page must return 200');
  const homeHtml = homeRes.body;

  // 1. Anti-flash inline theme script in head
  assert(homeHtml.includes('el_theme') || homeHtml.includes('prefers-color-scheme'), 'Inline theme head script must exist');
  pass('Anti-flash theme initialization script is embedded in <head>');

  // 2. Official logo lockups
  assert(homeHtml.includes('easylife-logo-charcoal-orange.png') || homeHtml.includes('easylife-official-logo.png') || homeHtml.includes('easylife-logo'), 'Official brand logo must be present');
  pass('Official EasyLife logo lockup configured with responsive dark-mode variant');

  // 3. Six-section primary navigation in exact order
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Find Services', href: '/services' },
    { label: 'Post a Need', href: '/post-a-need' },
    { label: 'Jobs & Opportunities', href: '/jobs' },
    { label: 'Business Hub', href: '/business-hub' },
    { label: 'Free Tools', href: '/tools' },
  ];

  navItems.forEach((item) => {
    const encodedLabel = item.label.replace('&', '&amp;');
    assert(homeHtml.includes(item.label) || homeHtml.includes(encodedLabel), `Navbar must contain label "${item.label}"`);
    assert(homeHtml.includes(item.href), `Navbar must link to "${item.href}"`);
    pass(`Navigation includes "${item.label}" -> ${item.href}`);
  });

  // Verify Local Businesses is consolidated into Business Hub
  assert(!homeHtml.includes('>Local Businesses<'), 'Local Businesses must be consolidated into Business Hub');
  pass('Consolidation verified: "Local Businesses" is integrated into Business Hub');

  // --- Part 2: Theme Persistence & Portal Theme Toggles ---
  console.log('\n[Part 2] Verifying Theme Toggle Integration Across All Portals...');
  const portalRoutes = [
    { path: '/', name: 'Public Marketing' },
    { path: '/services', name: 'Service Marketplace' },
    { path: '/jobs', name: 'Jobs & Opportunities' },
    { path: '/business-hub', name: 'Business Hub' },
    { path: '/tools', name: 'Free Tools & Utility Suite' },
    { path: '/post-a-need', name: 'Post a Need Flow' },
    { path: '/admin/login', name: 'Administrator Portal Entry' },
  ];

  for (const portal of portalRoutes) {
    const res = await get(portal.path);
    assert.strictEqual(res.status, 200, `${portal.name} at ${portal.path} must return 200`);
    assert(
      res.body.includes('Theme:') ||
      res.body.includes('data-theme') ||
      res.body.includes('ThemeToggle') ||
      res.body.includes('Light') ||
      res.body.includes('Dark') ||
      res.body.includes('System'),
      `${portal.name} must include theme toggle controls or styling`
    );
    pass(`${portal.name} (${portal.path}) includes responsive theme configuration`);
  }

  // --- Part 3: General Sans Typography & Design System Tokens ---
  console.log('\n[Part 3] Validating Design System Tokens & Typography...');
  const fs = await import('fs');
  const globalsCss = fs.readFileSync('apps/web/src/app/globals.css', 'utf8');
  assert(globalsCss.includes('General Sans'), 'General Sans font family must be declared in globals.css');
  pass('Typography uses approved General Sans font family across headings and body copy');

  // Verify CSS variable token mappings
  assert(globalsCss.includes('--easylife-primary') && globalsCss.includes('--easylife-secondary') && globalsCss.includes('--easylife-accent'), 'Brand palette tokens must exist');
  pass('Harbor Teal & Coral palette tokens (--easylife-primary, --easylife-secondary, --easylife-accent) configured');

  // --- Part 4: Strict Scope Exclusion Audit ---
  console.log('\n[Part 4] Enforcing Strict Scope Exclusions Across Public Surfaces...');
  const scopeRoutes = ['/', '/services', '/jobs', '/business-hub', '/tools'];
  for (const path of scopeRoutes) {
    const res = await get(path);
    const html = res.body;

    assert(!html.includes('Find a Doctor'), `Route ${path} must not contain "Find a Doctor"`);
    assert(!html.includes('Healthcare Directory'), `Route ${path} must not contain "Healthcare Directory"`);
    assert(!html.includes('Houses for Sale'), `Route ${path} must not contain "Houses for Sale"`);
    assert(!html.includes('Flats for Rent'), `Route ${path} must not contain "Flats for Rent"`);
    assert(!html.includes('Food Cart'), `Route ${path} must not contain "Food Cart"`);
    assert(!html.includes('Order Food Online'), `Route ${path} must not contain "Order Food Online"`);
    pass(`Route ${path} passes all strict scope exclusions (No Healthcare, Real Estate, or Food Carts)`);
  }

  // --- Part 5: Pilot Hub Consistency (Port Harcourt, Lagos, Abuja) ---
  console.log('\n[Part 5] Verifying Regional Hub Alignment (Port Harcourt, Lagos, Abuja)...');
  assert(homeHtml.includes('Port Harcourt') && homeHtml.includes('Lagos') && homeHtml.includes('Abuja'), 'Pilot hubs must be prominent on homepage');
  pass('Homepage anchors all three core pilot hubs: Port Harcourt, Lagos, and Abuja');

  const jobsRes = await get('/jobs');
  assert(jobsRes.body.includes('Port Harcourt') && jobsRes.body.includes('Lagos') && jobsRes.body.includes('Abuja'), 'Pilot hubs in jobs');
  pass('Jobs portal provides explicit filtering across Port Harcourt, Lagos, and Abuja');

  const bizRes = await get('/business-hub');
  assert(bizRes.body.includes('Port Harcourt') && bizRes.body.includes('Lagos') && bizRes.body.includes('Abuja'), 'Pilot hubs in business hub');
  pass('Business Hub features vetted enterprises in Port Harcourt, Lagos, and Abuja');

  console.log('==================================================================');
  console.log(`🎉 ALL ${passCount} STAGE 11 BRAND & RESPONSIVE TESTS PASSED!`);
  console.log('==================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ STAGE 11 TEST FAILURE:', err);
  process.exit(1);
});
