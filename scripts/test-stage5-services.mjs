// Stage 5 Services and Professional Marketplace automated verification script
const BASE_URL = 'http://localhost:3000';

async function testEndpoint(url, expectedStatus, description, checkBody) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    let bodyCheckPassed = true;
    let bodySnippet = '';
    if (checkBody && res.status === 200) {
      const text = await res.text();
      bodyCheckPassed = checkBody(text);
      bodySnippet = text.substring(0, 200).replace(/\s+/g, ' ');
    }

    const passed = isExpected && bodyCheckPassed;
    console.log(
      (passed ? '✓ PASS' : '✗ FAIL') +
      ` [${res.status}] ${description} -> ${url}`
    );
    if (!isExpected) {
      console.log(`  Expected ${JSON.stringify(expectedStatus)}, got ${res.status}`);
    }
    if (!bodyCheckPassed) {
      console.log(`  Body check failed! Snippet: ${bodySnippet}`);
    }
    return passed;
  } catch (err) {
    console.log(`✗ ERROR [CONN] ${description} -> ${url}: ${err.message}`);
    return false;
  }
}

async function runStage5Tests() {
  console.log('======================================================');
  console.log('STAGE 5: FIND SERVICES & MARKETPLACE VERIFICATION');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('======================================================\n');

  let allPassed = true;

  // 1. Primary Find Services route
  allPassed = (await testEndpoint(
    `${BASE_URL}/services`,
    200,
    'Find Services default page',
    (body) => body.includes('Find &amp; Book Verified Service Professionals') || body.includes('Verified Professionals')
  )) && allPassed;

  // 2. City Filtering (Port Harcourt, Lagos, Abuja)
  allPassed = (await testEndpoint(
    `${BASE_URL}/services?city=Port+Harcourt`,
    200,
    'City filter: Port Harcourt',
    (body) => body.includes('Port Harcourt')
  )) && allPassed;

  allPassed = (await testEndpoint(
    `${BASE_URL}/services?city=Lagos`,
    200,
    'City filter: Lagos',
    (body) => body.includes('Lagos')
  )) && allPassed;

  allPassed = (await testEndpoint(
    `${BASE_URL}/services?city=Abuja`,
    200,
    'City filter: Abuja',
    (body) => body.includes('Abuja')
  )) && allPassed;

  // 3. Category Filtering
  allPassed = (await testEndpoint(
    `${BASE_URL}/services?cat=plumbing-water-systems`,
    200,
    'Category filter: Plumbing',
    (body) => body.includes('Plumbing')
  )) && allPassed;

  // 4. Mode Switcher: Catalogue View
  allPassed = (await testEndpoint(
    `${BASE_URL}/services?view=catalogue`,
    200,
    'Services view mode: Standard Catalogue',
    (body) => body.includes('Standardised Services') || body.includes('Standard Service Catalogue')
  )) && allPassed;

  // 5. Keyword search query
  allPassed = (await testEndpoint(
    `${BASE_URL}/services?q=generator`,
    200,
    'Keyword search: generator',
    (body) => body.includes('generator') || body.includes('Generator')
  )) && allPassed;

  // 6. Route consolidation: /explore-services redirects to /services
  allPassed = (await testEndpoint(
    `${BASE_URL}/explore-services?cat=electrical-power-backup`,
    [307, 308],
    'Legacy /explore-services redirect preservation'
  )) && allPassed;

  // 7. Booking route access check
  allPassed = (await testEndpoint(
    `${BASE_URL}/book?category=plumbing-water-systems`,
    [200, 307, 308],
    'Booking request flow endpoint'
  )) && allPassed;

  // 8. Bookings dashboard access check
  allPassed = (await testEndpoint(
    `${BASE_URL}/bookings`,
    [200, 307, 308],
    'Customer bookings tracking endpoint'
  )) && allPassed;

  console.log('\n======================================================');
  if (allPassed) {
    console.log('ALL STAGE 5 ROUTE & INTEGRATION TESTS PASSED ✓');
  } else {
    console.log('SOME STAGE 5 TESTS FAILED ✗');
  }
  console.log('======================================================');
}

runStage5Tests();
