async function testRoutes() {
  console.log('=== EASYLIFE STAGE 3 NAVIGATION & ROUTES VERIFICATION ===\n');
  const baseUrl = 'http://localhost:3000';

  const canonicalRoutes = [
    { name: '1. Home', path: '/' },
    { name: '2. Find Services', path: '/services' },
    { name: '3. Post a Need', path: '/post-a-need' },
    { name: '4. Jobs & Opportunities', path: '/jobs' },
    { name: '5. Business Hub', path: '/business-hub' },
    { name: '6. Free Tools', path: '/tools' },
  ];

  console.log('--- Testing Six Canonical Routes ---');
  for (const route of canonicalRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route.path}`, { redirect: 'manual' });
      console.log(`  [${res.status === 200 ? 'PASS' : 'FAIL'}] ${route.name} (${route.path}) -> HTTP ${res.status}`);
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200 on ${route.path}, got ${res.status}`);
      }
    } catch (err) {
      console.error(`  [ERROR] Failed to fetch ${route.path}:`, err.message);
      process.exit(1);
    }
  }

  const redirectRoutes = [
    { from: '/businesses', to: '/business-hub' },
    { from: '/post-task', to: '/post-a-need' },
    { from: '/tasks', to: '/post-a-need' },
  ];

  console.log('\n--- Testing Aliases & Redirects ---');
  for (const r of redirectRoutes) {
    try {
      const res = await fetch(`${baseUrl}${r.from}`, { redirect: 'manual' });
      const location = res.headers.get('location');
      const isRedirect = res.status === 307 || res.status === 308 || res.status === 302 || res.status === 301;
      const matched = location && location.includes(r.to);
      console.log(`  [${isRedirect && matched ? 'PASS' : 'FAIL'}] Redirect ${r.from} -> HTTP ${res.status} (Location: ${location})`);
      if (!isRedirect || !matched) {
        throw new Error(`Expected redirect from ${r.from} to ${r.to}, got status ${res.status}, location ${location}`);
      }
    } catch (err) {
      console.error(`  [ERROR] Failed redirect ${r.from}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n=== ALL SIX CANONICAL ROUTES AND REDIRECTS VERIFIED SUCCESSFULLY! ===\n');
}

testRoutes().catch(console.error);
