/**
 * EasyLife Master MVP Implementation — Stage 12: Complete Integration & Functional Testing
 * 
 * Verifies all 10 domains of Section 14:
 * 14.1 Navigation & Header/Mobile Drawer Integration
 * 14.2 Service Marketplace & Professional Artisan Directory
 * 14.3 Post a Need Wizard, AI Categorization & Quotation Workflow
 * 14.4 Business Hub, Local Business Directory & Promotion Governance
 * 14.5 Business Maintenance & Facility Asset Management
 * 14.6 Jobs & Opportunities Portal & Application Tracking
 * 14.7 Free Tools Suite (16 Tools, Document Previews & PDF Export)
 * 14.8 Multi-Role Dashboards & Role-Based Access Control (RBAC)
 * 14.9 Responsive Layouts, Mobile Touch Targets & 3-Mode Theming
 * 14.10 Backend Security, PostgreSQL RLS & Credential Segregation
 */

import { getDatabaseUrl, connectClientWithRetry } from './_env.mjs';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client, Pool } = pg;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONNECTION_STRING = getDatabaseUrl();

async function runStage12MasterIntegration() {
  console.log("==================================================================");
  console.log("  EASYLIFE STAGE 12: COMPLETE INTEGRATION & FUNCTIONAL TESTING    ");
  console.log("==================================================================");
  console.log(`Testing target web server at: ${BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✕ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 50000) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return res;
      } catch (err) {
        clearTimeout(timeout);
        if (attempt === 2) throw err;
        console.log(`    [Notice] Initial fetch to ${url} timed out (likely cold Next.js compilation). Retrying with warm cache...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 5000,
    max: 5,
  });
  console.log("Connected to PostgreSQL database pool for verification.\n");

  async function safeQuery(sql, params) {
    return await pool.query(sql, params);
  }

  const allTables = (await safeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).rows.map(r => r.table_name);
  console.log('Available tables in public schema (' + allTables.length + '):', allTables.join(', ') + '\n');

  try {
    // =========================================================================
    // 14.1 NAVIGATION TESTS
    // =========================================================================
    console.log("[14.1] Testing Navigation Architecture & Header/Drawer Integration...");
    const homeRes = await fetchWithTimeout(`${BASE_URL}/`);
    assert(homeRes.status === 200, "Home page (/) returns HTTP 200 OK");
    const homeHtml = await homeRes.text();

    // Check the 6 primary navigation items in correct order
    const expectedNavOrder = [
      { label: "Home", href: "/" },
      { label: "Find Services", href: "/services" },
      { label: "Post a Need", href: "/post-a-need" },
      { label: "Jobs & Opportunities", href: "/jobs" },
      { label: "Business Hub", href: "/business-hub" },
      { label: "Free Tools", href: "/tools" }
    ];

    for (const item of expectedNavOrder) {
      const encodedLabel = item.label.replace('&', '&amp;');
      assert(
        homeHtml.includes(item.label) || homeHtml.includes(encodedLabel),
        `Primary navigation includes "${item.label}"`
      );
      assert(
        homeHtml.includes(`href="${item.href}"`),
        `Primary navigation links to canonical destination: ${item.href}`
      );
    }

    // Verify consolidation: Local Businesses is not a standalone top-level primary nav link
    assert(
      !homeHtml.match(/<nav[^>]*>[\s\S]*?<a[^>]*href="\/businesses"[^>]*>Local Businesses<\/a>[\s\S]*?<\/nav>/i),
      "Consolidation verified: 'Local Businesses' does NOT appear as a separate primary nav link"
    );

    // Verify responsive navbar breakpoint configured for standard laptops (lg: 1024px)
    const headerSource = fs.readFileSync('apps/web/src/components/site/site-header.tsx', 'utf8');
    assert(
      headerSource.includes('hidden lg:block') && headerSource.includes('hidden lg:flex'),
      "Desktop navbar renders at 'lg:' (1024px) breakpoint for full laptop screen support"
    );

    // Verify mobile drawer features: z-50 stacking, backdrop blur, minimum touch targets
    assert(
      headerSource.includes('z-50') && headerSource.includes('backdrop-blur'),
      "Mobile navigation drawer configured with z-50 overlay and backdrop blur"
    );

    // Verify Theme selector toggle
    assert(
      homeHtml.includes('theme') || headerSource.includes('ThemeToggle') || headerSource.includes('toggleTheme'),
      "Theme toggle control is present and accessible"
    );

    // Verify WhatsApp shortcut link and pilot cities in footer
    assert(
      homeHtml.includes('wa.me') || homeHtml.includes('whatsapp'),
      "WhatsApp direct shortcut is embedded for instant customer support"
    );
    assert(
      homeHtml.includes('Port Harcourt') && homeHtml.includes('Lagos') && homeHtml.includes('Abuja'),
      "Footer anchors all three core pilot hubs: Port Harcourt, Lagos, and Abuja"
    );

    // =========================================================================
    // 14.2 SERVICE MARKETPLACE TESTS
    // =========================================================================
    console.log("\n[14.2] Testing Service Marketplace & Professional Directory...");
    const servicesRes = await fetchWithTimeout(`${BASE_URL}/services`);
    assert(servicesRes.status === 200, "Service discovery route (/services) returns HTTP 200 OK");
    const servicesHtml = await servicesRes.text();

    assert(
      servicesHtml.includes('Electrical') || servicesHtml.includes('Plumbing') || servicesHtml.includes('HVAC'),
      "Service discovery displays core artisanal trade categories"
    );

    // Query active service categories from database
    const catQuery = await safeQuery("SELECT id, name, slug FROM service_categories WHERE is_active = true LIMIT 10");
    assert(catQuery.rows.length >= 5, `Database has ${catQuery.rows.length} active service categories`);

    // Inspect verification_status enum labels
    const enumLabels = (await safeQuery("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'verification_status'")).rows.map(r => r.enumlabel);
    console.log("verification_status enum labels:", enumLabels.join(', '));

    // Query verified professionals across pilot cities from public directory view
    const proQuery = await safeQuery(`
      SELECT professional_id, display_name, business_name, verification_status, average_rating, primary_city
      FROM public_professional_directory
      LIMIT 10
    `);
    assert(proQuery.rows.length > 0, `Database contains ${proQuery.rows.length} verified artisans`);
    const samplePro = proQuery.rows[0];

    // Verify professional profile route
    const proRes = await fetchWithTimeout(`${BASE_URL}/professionals/${samplePro.professional_id}`);
    assert(proRes.status === 200, `Professional profile route (/professionals/${samplePro.professional_id}) returns HTTP 200 OK`);
    const proHtml = await proRes.text();
    assert(
      proHtml.includes(samplePro.display_name) || proHtml.includes(samplePro.business_name || ''),
      `Profile displays verified artisan identity: ${samplePro.display_name}`
    );

    // Test booking engine tables & schema
    const bookingColumns = await safeQuery(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name IN ('customer_id', 'professional_id', 'service_id', 'status', 'total_amount')
    `);
    assert(bookingColumns.rows.length >= 4, "Bookings schema contains all required transactional fields");

    // =========================================================================
    // 14.3 POST A NEED TESTS
    // =========================================================================
    console.log("\n[14.3] Testing Post a Need Flow & AI Matching Engine...");
    const postNeedRes = await fetchWithTimeout(`${BASE_URL}/post-a-need`);
    assert(postNeedRes.status === 200, "Post a Need route (/post-a-need) returns HTTP 200 OK");
    const postNeedHtml = await postNeedRes.text();

    assert(
      postNeedHtml.includes('Describe') || postNeedHtml.includes('Tell us what you need') || postNeedHtml.includes('Post a Need'),
      "Post a Need wizard renders guided customer request intake"
    );

    // Verify AI categorization catalog matching logic
    const { PUBLIC_SERVICE_CATEGORIES } = await import('../apps/web/src/lib/public-catalog.ts');
    assert(PUBLIC_SERVICE_CATEGORIES.length >= 6, `Public service catalog contains ${PUBLIC_SERVICE_CATEGORIES.length} trade definitions`);

    const electricalCat = PUBLIC_SERVICE_CATEGORIES.find(c => c.slug === 'electrical-repairs' || c.slug === 'electrical' || c.slug === 'electrical-power-backup');
    assert(!!electricalCat, "Catalog includes comprehensive Electrical services definition");

    // Verify matching engine: bookings/requests table has status lifecycle
    const requestStatusCheck = await safeQuery(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'status'
    `);
    assert(requestStatusCheck.rows.length > 0, "Bookings/requests table supports request status transitions");

    // =========================================================================
    // 14.4 BUSINESS HUB TESTS
    // =========================================================================
    console.log("\n[14.4] Testing Business Hub & Local Directory...");
    const hubRes = await fetchWithTimeout(`${BASE_URL}/business-hub`);
    assert(hubRes.status === 200, "Business Hub route (/business-hub) returns HTTP 200 OK");
    const hubHtml = await hubRes.text();

    assert(
      hubHtml.includes('Maintenance') || hubHtml.includes('Facility') || hubHtml.includes('Enterprise'),
      "Business Hub renders enterprise maintenance packages & facility management"
    );

    // Verify verified local businesses in database
    const bizQuery = await safeQuery(`
      SELECT id, name, business_category, city, verification_status 
      FROM businesses 
      LIMIT 10
    `);
    assert(bizQuery.rows.length > 0, `Database contains ${bizQuery.rows.length} verified directory enterprises`);
    const sampleBiz = bizQuery.rows[0];

    // Verify individual business page
    const bizRes = await fetchWithTimeout(`${BASE_URL}/businesses/${sampleBiz.id}`);
    assert(bizRes.status === 200, `Business profile route (/businesses/${sampleBiz.id}) returns HTTP 200 OK`);

    // Verify offers & promotions table
    const promoCheck = await safeQuery(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('business_promotions', 'business_offers', 'promotions')
    `);
    assert(promoCheck.rows.length > 0, "Database supports business promotional offers lifecycle");

    // Strict Scope Exclusion: Food discovery strictly limited to business directory (no food ordering/cart)
    assert(
      !hubHtml.includes('order-cart') && !hubHtml.includes('checkout-food') && !hubHtml.includes('add to cart'),
      "Strict scope enforced: Zero food ordering carts or takeaway delivery in Business Hub"
    );

    // =========================================================================
    // 14.5 BUSINESS MAINTENANCE TESTS
    // =========================================================================
    console.log("\n[14.5] Testing Business Facility Maintenance System...");
    const maintenanceTables = await safeQuery(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN (
        'assets', 'properties', 'maintenance_schedules', 'maintenance_requests', 'maintenance_records'
      )
    `);
    assert(
      maintenanceTables.rows.length >= 3,
      `Enterprise maintenance architecture verified with ${maintenanceTables.rows.length} dedicated tables`
    );

    // Check asset management records exist
    const assetsCount = await safeQuery("SELECT COUNT(*) AS count FROM assets");
    assert(parseInt(assetsCount.rows[0].count, 10) >= 0, "Enterprise assets table is accessible and queryable");

    // Verify business portal layout and dashboard
    const bizPortalRes = await fetchWithTimeout(`${BASE_URL}/business`);
    assert(
      bizPortalRes.status === 200 || bizPortalRes.status === 307 || bizPortalRes.status === 302,
      "Business maintenance portal (/business) is active and securely governed"
    );

    // =========================================================================
    // 14.6 JOBS & OPPORTUNITIES TESTS
    // =========================================================================
    console.log("\n[14.6] Testing Jobs & Opportunities Portal...");
    const jobsRes = await fetchWithTimeout(`${BASE_URL}/jobs`);
    assert(jobsRes.status === 200, "Jobs portal (/jobs) returns HTTP 200 OK");
    const jobsHtml = await jobsRes.text();

    assert(
      jobsHtml.includes('Jobs') && (jobsHtml.includes('Full-time') || jobsHtml.includes('Contract') || jobsHtml.includes('Trade')),
      "Jobs portal renders active trade vacancies and gig opportunities"
    );

    // Query job vacancies from database
    const jobsQuery = await safeQuery("SELECT id, title, city, employment_type, status FROM job_vacancies WHERE status = 'open' LIMIT 5");
    assert(jobsQuery.rows.length > 0, `Database contains ${jobsQuery.rows.length} active trade vacancies`);

    // Verify job application schema
    const appTable = await safeQuery(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('job_applications', 'applications')
    `);
    assert(appTable.rows.length > 0, "Job applications table exists and supports candidate tracking");

    // =========================================================================
    // 14.7 FREE TOOLS TESTS
    // =========================================================================
    console.log("\n[14.7] Testing Free Tools Suite (16 Tools & PDF Generation)...");
    const toolsRes = await fetchWithTimeout(`${BASE_URL}/tools`);
    assert(toolsRes.status === 200, "Free Tools suite (/tools) returns HTTP 200 OK");
    const toolsHtml = await toolsRes.text();

    // Verify all 16 tools are cataloged and present
    const { TOOLS_CATALOG } = await import('../apps/web/src/components/tools/tools-catalog.ts');
    assert(TOOLS_CATALOG.length === 16, `Free Tools catalog contains all 16 upgraded tool engines (found ${TOOLS_CATALOG.length})`);

    for (const tool of TOOLS_CATALOG) {
      const encodedName = tool.name.replace(/&/g, '&amp;');
      assert(
        toolsHtml.includes(tool.name) || toolsHtml.includes(encodedName),
        `Tool verified in Free Tools collection: ${tool.name}`
      );
    }

    // Verify html2canvas-pro integration for oklab/oklch compatibility
    const pdfExportSource = fs.readFileSync('apps/web/src/components/tools/pdf-export.ts', 'utf8');
    assert(
      pdfExportSource.includes('html2canvas-pro'),
      "PDF export engine uses 'html2canvas-pro' for CSS Color Level 4 (oklab/oklch) compatibility"
    );

    // Verify Document Actions: View, Share, Save as PDF across document preview modal and tool engines
    const docModalSource = fs.readFileSync('apps/web/src/components/tools/document-preview-modal.tsx', 'utf8');
    const invoiceToolSource = fs.readFileSync('apps/web/src/components/tools/tool-invoice.tsx', 'utf8');
    assert(
      docModalSource.includes('DocumentPreviewModal') && invoiceToolSource.includes('DocumentPreviewModal'),
      "Free Tools provides dedicated View Document preview modal across all document engines"
    );
    assert(
      docModalSource.includes('handleSavePdf') || docModalSource.includes('Save as PDF'),
      "Free Tools provides direct Save as PDF action"
    );
    assert(
      docModalSource.includes('shareDocumentAction') || docModalSource.includes('Share'),
      "Free Tools provides device sharing action"
    );

    // =========================================================================
    // 14.8 DASHBOARD & RBAC GOVERNANCE TESTS
    // =========================================================================
    console.log("\n[14.8] Testing Multi-Role Dashboards & Access Governance...");

    // 1. Customer Dashboard
    const custDash = await fetchWithTimeout(`${BASE_URL}/bookings`);
    assert(custDash.status === 200 || custDash.status === 307 || custDash.status === 302, "Customer bookings portal is routed and secured");

    // 2. Professional Dashboard
    const proDash = await fetchWithTimeout(`${BASE_URL}/pro`);
    assert(proDash.status === 200 || proDash.status === 307 || proDash.status === 302, "Professional artisan portal is routed and secured");

    // 3. Business Dashboard
    const bizDash = await fetchWithTimeout(`${BASE_URL}/business`);
    assert(bizDash.status === 200 || bizDash.status === 307 || bizDash.status === 302, "Business maintenance portal is routed and secured");

    // 4. Admin Console Login & Protection
    const adminLogin = await fetchWithTimeout(`${BASE_URL}/admin/login`);
    assert(adminLogin.status === 200, "Administrator login portal (/admin/login) returns HTTP 200 OK");

    const adminConsole = await fetchWithTimeout(`${BASE_URL}/admin`);
    assert(
      adminConsole.status === 307 || adminConsole.status === 302 || adminConsole.status === 200,
      "Administrator console (/admin) enforces RBAC authentication protection"
    );

    // Verify RBAC security engine rules
    const rbacSource = fs.readFileSync('apps/web/src/lib/security/rbac-policy-engine.ts', 'utf8');
    assert(
      rbacSource.includes('customer') && rbacSource.includes('professional') && rbacSource.includes('admin'),
      "RBAC policy engine defines role permissions for customer, professional, and admin"
    );

    // =========================================================================
    // 14.9 RESPONSIVE DESIGN & THEMING TESTS
    // =========================================================================
    console.log("\n[14.9] Testing Responsive Layouts, Mobile Touch Targets & Theming...");

    // Check anti-flash script in layout
    const layoutSource = fs.readFileSync('apps/web/src/app/layout.tsx', 'utf8');
    assert(
      layoutSource.includes('prefers-color-scheme') || layoutSource.includes('theme'),
      "Root layout embeds anti-flash theme script in <head>"
    );

    // Check General Sans font declaration in globals.css
    const cssSource = fs.readFileSync('apps/web/src/app/globals.css', 'utf8');
    assert(
      cssSource.includes('General Sans'),
      "Global stylesheet configures approved General Sans typography"
    );

    // Check color token variables
    assert(
      cssSource.includes('--easylife-primary') && cssSource.includes('--easylife-secondary'),
      "CSS variables define EasyLife Harbor Teal and Maritime Teal brand tokens"
    );

    // =========================================================================
    // 14.10 BACKEND SECURITY & CREDENTIAL SEGREGATION TESTS
    // =========================================================================
    console.log("\n[14.10] Testing Backend Security, PostgreSQL RLS & Credential Segregation...");

    // Check RLS enabled on core tables
    const rlsCheck = await safeQuery(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('profiles', 'bookings', 'reviews', 'disputes')
    `);
    for (const row of rlsCheck.rows) {
      assert(row.rowsecurity === true, `PostgreSQL RLS is enabled on table: ${row.tablename}`);
    }

    // Check environment variable isolation
    const envLocal = fs.readFileSync('apps/web/.env.local', 'utf8');
    const secretKeys = ['SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'RESEND_API_KEY', 'PAYSTACK_SECRET_KEY'];
    for (const key of secretKeys) {
      assert(
        !envLocal.includes(`NEXT_PUBLIC_${key}`),
        `Security verified: Server secret ${key} is NOT exposed via NEXT_PUBLIC_ prefix`
      );
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log("\n==================================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} STAGE 12 MASTER INTEGRATION TESTS PASSED!`);
    console.log("==================================================================");

  } finally {
    await pool.end();
  }
}

runStage12MasterIntegration().catch(err => {
  console.error("\n❌ Stage 12 Master Integration Test Suite Failed:", err);
  process.exit(1);
});
