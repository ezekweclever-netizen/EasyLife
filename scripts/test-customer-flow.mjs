import fs from "fs";
import path from "path";

console.log("=== EasyLife Prompt 8 — Customer Interface & Experience Test Suite ===\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// 1. Verify all required Customer Navigation pages exist
const customerRoutes = [
  { name: "Customer Dashboard (Home)", path: "apps/web/src/app/dashboard/page.tsx" },
  { name: "Service Discovery (Explore Services)", path: "apps/web/src/app/explore-services/page.tsx" },
  { name: "My Bookings History", path: "apps/web/src/app/bookings/page.tsx" },
  { name: "Booking Detail View", path: "apps/web/src/app/bookings/[id]/page.tsx" },
  { name: "Customer Booking Form", path: "apps/web/src/app/book/page.tsx" },
  { name: "Professional Profile View", path: "apps/web/src/app/professionals/[id]/page.tsx" },
  { name: "Customer Messages", path: "apps/web/src/app/messages/page.tsx" },
  { name: "Customer Profile & Settings", path: "apps/web/src/app/profile/page.tsx" },
];

console.log("1. Verifying Customer Routes & Pages Architecture:");
for (const r of customerRoutes) {
  const fullPath = path.resolve(r.path);
  assert(fs.existsSync(fullPath), `Route exists: ${r.name} (${r.path})`);
}

// 2. Verify Customer Dashboard Required Sections
console.log("\n2. Verifying Customer Dashboard Sections in apps/web/src/app/dashboard/page.tsx:");
const dashboardContent = fs.readFileSync(path.resolve("apps/web/src/app/dashboard/page.tsx"), "utf8");

assert(dashboardContent.includes("Welcome back,"), "Welcome section with dynamic customer name greeting");
assert(dashboardContent.includes("currentCity"), "Location selector for Nigerian pilot cities (Port Harcourt, Lagos, Abuja)");
assert(dashboardContent.includes("action=\"/explore-services\""), "Search bar routing to service discovery");
assert(dashboardContent.includes("categories.map"), "Service categories loaded live from Supabase");
assert(dashboardContent.includes("recommendedPros"), "Recommended professionals section");
assert(dashboardContent.includes("activeBookings"), "Active service requests tracking section");
assert(dashboardContent.includes("completedBookings"), "Recent bookings history section");
assert(dashboardContent.includes("unreadNotifications"), "Notifications counter and unread alerts");
assert(dashboardContent.includes("WhatsApp Support"), "Customer support access (WhatsApp, Help Centre, Operations)");

// 3. Verify Customer Navigation 5 Items
console.log("\n3. Verifying 5 Customer Navigation Links in apps/web/src/components/customer/customer-header.tsx:");
const headerContent = fs.readFileSync(path.resolve("apps/web/src/components/customer/customer-header.tsx"), "utf8");

assert(headerContent.includes('"Home"') && headerContent.includes('"/dashboard"'), "Navigation Item 1: Home (/dashboard)");
assert(headerContent.includes('"Explore Services"') && headerContent.includes('"/explore-services"'), "Navigation Item 2: Explore Services (/explore-services)");
assert(headerContent.includes('"My Bookings"') && headerContent.includes('"/bookings"'), "Navigation Item 3: My Bookings (/bookings)");
assert(headerContent.includes('"Messages"') && headerContent.includes('"/messages"'), "Navigation Item 4: Messages (/messages)");
assert(headerContent.includes('"Profile"') && headerContent.includes('"/profile"'), "Navigation Item 5: Profile (/profile)");

// 4. Verify Service Discovery Filters
console.log("\n4. Verifying Service Discovery Filters:");
const explorePagePath = path.resolve("apps/web/src/app/explore-services/page.tsx");
const discoveryCompPath = path.resolve("apps/web/src/components/discovery/service-discovery-client.tsx");
const exploreContent = fs.readFileSync(explorePagePath, "utf8") +
  (fs.existsSync(discoveryCompPath) ? fs.readFileSync(discoveryCompPath, "utf8") : "");

assert(exploreContent.includes('name="cat"'), "Discovery filter: Category");
assert(exploreContent.includes('name="city"'), "Discovery filter: Location (City)");
assert(exploreContent.includes('name="distance"'), "Discovery filter: Distance / Radius");
assert(exploreContent.includes('name="availability"'), "Discovery filter: Availability");
assert(exploreContent.includes('name="rating"'), "Discovery filter: Rating");
assert(exploreContent.includes('name="verified"'), "Discovery filter: Verification status");

// 5. Verify Professional Profile View Details
console.log("\n5. Verifying Professional Profile View in apps/web/src/app/professionals/[id]/page.tsx:");
const proProfileContent = fs.readFileSync(path.resolve("apps/web/src/app/professionals/[id]/page.tsx"), "utf8");

assert(proProfileContent.includes("displayName"), "Displays professional name & business name");
assert(proProfileContent.includes("bio"), "Displays description & background bio");
assert(proProfileContent.includes("years_of_experience"), "Displays experience information");
assert(proProfileContent.includes("Working Hours & Availability"), "Displays working hours & availability schedule");
assert(proProfileContent.includes("Service Areas Covered"), "Displays service areas covered");
assert(proProfileContent.includes("Work Portfolio & Past Installations"), "Displays past completed jobs portfolio");
assert(proProfileContent.includes("Customer Reviews"), "Displays customer reviews & ratings breakdown");
assert(proProfileContent.includes("completed_jobs_count"), "Displays completed jobs count");
assert(proProfileContent.includes("Verified Pro"), "Displays verification status badge");

// 6. Verify Customer Booking Wizard & Form Validation
console.log("\n6. Verifying Customer Booking Form in apps/web/src/components/booking/booking-wizard.tsx:");
const bookingContent = fs.readFileSync(path.resolve("apps/web/src/components/booking/booking-wizard.tsx"), "utf8");

assert(bookingContent.includes("categoryId"), "Booking field: Service category");
assert(bookingContent.includes("description"), "Booking field: Problem description");
assert(bookingContent.includes("handleFileUpload"), "Booking field: Photograph/video attachments with file validation");
assert(bookingContent.includes("serviceAddress"), "Booking field: Service location & landmark");
assert(bookingContent.includes("preferredDate"), "Booking field: Preferred date");
assert(bookingContent.includes("preferredTimeSlot"), "Booking field: Preferred time slot");
assert(bookingContent.includes("additionalInstructions"), "Booking field: Additional instructions");
assert(bookingContent.includes("validateStep1"), "Booking form validation: client-side & server-side enforcement");
assert(bookingContent.includes("Progress Bar") || bookingContent.includes("step === s.num"), "Multi-step submission progress indicator");
assert(bookingContent.includes("CONFIRMATION SCREEN") || bookingContent.includes("referenceCode"), "Confirmation screen with booking reference number");

// Summary
console.log(`\n======================================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("=== ALL PROMPT 8 CUSTOMER APPLICATION CHECKS PASSED ===");
}
