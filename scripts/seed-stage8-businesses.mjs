import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 1. Fetch an admin or default profile to be the business owner
const profileRes = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email&limit=1`,
  {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  }
);
const profiles = await profileRes.json();
const ownerId = profiles[0]?.id;
if (!ownerId) {
  console.error("No profile found to associate businesses with.");
  process.exit(1);
}

console.log(`Using owner profile: ${profiles[0].email} (${ownerId})`);

const PILOT_BUSINESSES = [
  {
    name: "Bole & Fish King Spot",
    slug: "bole-fish-king-ph",
    business_category: "Restaurants & Food",
    industry: "Food & Hospitality",
    description: "Iconic authentic Port Harcourt roasted plantain, fresh coal-grilled fish, pepper sauce, and traditional delicacy dining. Dine-in and takeaway service with hygienic packaging.",
    contact_email: "orders@bolekingph.ng",
    contact_phone: "08034567891",
    city: "Port Harcourt",
    state: "Rivers State",
    address: "18 Birabi Street, GRA Phase 2, Port Harcourt",
    operating_hours: {
      monday_to_friday: "10:00 AM - 9:00 PM",
      saturday: "11:00 AM - 10:00 PM",
      sunday: "1:00 PM - 8:00 PM",
    },
    services_offered: [
      "Authentic PH Bole & Fish",
      "Grilled Catfish & Croaker",
      "Utazi Pepper Sauce",
      "Executive Event Catering Trays",
      "Outdoor Dining & Takeaway",
    ],
    website: "https://bolekingph.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Flourish Artisan Bakehouse",
    slug: "flourish-artisan-bakehouse-lagos",
    business_category: "Bakeries & Confectionery",
    industry: "Bakery & Confectionery",
    description: "Specialist sourdough, fresh butter brioche, custom wedding cakes, and savory meat pies baked fresh daily with zero artificial preservatives in Lekki.",
    contact_email: "hello@flourishbakehouse.ng",
    contact_phone: "08023456781",
    city: "Lagos",
    state: "Lagos State",
    address: "Block 8 Admiralty Way, Lekki Phase 1, Lagos",
    operating_hours: {
      monday_to_friday: "7:00 AM - 7:00 PM",
      saturday: "8:00 AM - 7:00 PM",
      sunday: "9:00 AM - 5:00 PM",
    },
    services_offered: [
      "Artisan Sourdough & Baguettes",
      "Custom Celebration & Wedding Cakes",
      "Breakfast Pastries & Croissants",
      "Corporate Brunch Platters",
    ],
    website: "https://flourishbakehouse.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Maitama Green Grocer & Supermarket",
    slug: "maitama-green-grocer-abuja",
    business_category: "Supermarkets & Groceries",
    industry: "Retail & Groceries",
    description: "Modern neighborhood supermarket offering farm-fresh organic vegetables, premium imported pantry staples, household cleaning essentials, and dairy products.",
    contact_email: "service@maitamagrocer.ng",
    contact_phone: "08098765432",
    city: "Abuja",
    state: "Federal Capital Territory",
    address: "Plot 302 Gana Street, Maitama District, Abuja",
    operating_hours: {
      monday_to_friday: "8:00 AM - 9:30 PM",
      saturday: "8:00 AM - 9:30 PM",
      sunday: "10:00 AM - 8:00 PM",
    },
    services_offered: [
      "Fresh Farm Produce",
      "Imported & Local Groceries",
      "Household Cleaning Goods",
      "Chilled Dairy & Beverages",
      "Plaza Bulk Orders",
    ],
    website: "https://maitamagrocer.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Trans-Amadi Central Pharmacy & Health Store",
    slug: "trans-amadi-central-pharmacy-ph",
    business_category: "Pharmacies & Health Stores",
    industry: "Retail Pharmacy & Wellness",
    description: "Licensed retail community pharmacy providing genuine prescription medications, pediatric care essentials, first-aid kits, blood pressure monitoring, and general wellness supplies.",
    contact_email: "dispensary@transamadipharmacy.ng",
    contact_phone: "08055667788",
    city: "Port Harcourt",
    state: "Rivers State",
    address: "Plot 7 Trans-Amadi Industrial Layout, Near Slaughter Roundabout, Port Harcourt",
    operating_hours: {
      monday_to_friday: "7:30 AM - 10:00 PM",
      saturday: "8:00 AM - 10:00 PM",
      sunday: "12:00 PM - 8:00 PM",
    },
    services_offered: [
      "Prescription Dispensing",
      "Over-the-Counter Healthcare",
      "Blood Pressure & Sugar Check",
      "First Aid & Surgical Supplies",
      "Baby & Mother Wellness",
    ],
    website: "https://transamadipharmacy.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Benchmark Facilities & Commercial Maintenance Co.",
    slug: "benchmark-facilities-maintenance-lagos",
    business_category: "Commercial Facility Maintenance",
    industry: "Facility Management & Engineering",
    description: "Turnkey commercial property maintenance provider for corporate headquarters, bank branches, and business plazas. Services include central chiller servicing, power switchboards, and water plant maintenance.",
    contact_email: "operations@benchmarkfacilities.ng",
    contact_phone: "08033221100",
    city: "Lagos",
    state: "Lagos State",
    address: "Adeola Odeku Street, Victoria Island, Lagos",
    operating_hours: {
      monday_to_friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 2:00 PM",
    },
    services_offered: [
      "Commercial Building Audits",
      "VRF & Central HVAC Maintenance",
      "Transformer & Switchgear Overhaul",
      "Sewage & Water Treatment Operation",
      "Asset QR Code Tagging & SLA Retainers",
    ],
    website: "https://benchmarkfacilities.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Apex Solar & Industrial Power Systems Ltd.",
    slug: "apex-solar-power-systems-abuja",
    business_category: "Solar & Electrical Contractors",
    industry: "Renewable Energy & Power Engineering",
    description: "Certified solar engineering firm specializing in commercial rooftop solar PV arrays, lithium energy storage, grid-tie synchronization, and backup diesel generator hybrids.",
    contact_email: "info@apexpowerabuja.ng",
    contact_phone: "08077889900",
    city: "Abuja",
    state: "Federal Capital Territory",
    address: "Aminu Kano Crescent, Wuse 2, Abuja",
    operating_hours: {
      monday_to_friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 4:00 PM",
    },
    services_offered: [
      "Commercial Solar EPC (10kW - 100kW)",
      "High-Voltage Lithium Storage",
      "Industrial Power Quality Audits",
      "Annual Generator Overhaul Contracts",
      "Hybrid Inverter Calibration",
    ],
    website: "https://apexpowerabuja.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
  {
    name: "Niger Delta Corporate & Legal Support Partners",
    slug: "niger-delta-corporate-support-ph",
    business_category: "Business & Corporate Services",
    industry: "Corporate & Professional Services",
    description: "Professional business advisory, CAC annual returns filing, corporate secretarial services, tax compliance, and business plan documentation for emerging and established enterprises.",
    contact_email: "contact@ndcorporatesupport.ng",
    contact_phone: "08031122334",
    city: "Port Harcourt",
    state: "Rivers State",
    address: "Forces Avenue, Old GRA, Port Harcourt",
    operating_hours: {
      monday_to_friday: "8:30 AM - 5:00 PM",
    },
    services_offered: [
      "Corporate Regulatory Filings",
      "Business Structuring & Licencing",
      "Commercial Contract Vetting",
      "Tax Clearance & Compliance Support",
      "Corporate Governance Advisory",
    ],
    website: "https://ndcorporatesupport.ng",
    is_directory_listed: true,
    is_active: true,
    verification_status: "approved",
    owner_id: ownerId,
  },
];

console.log(`Seeding ${PILOT_BUSINESSES.length} pilot businesses...`);

const seededBusinesses = [];

for (const biz of PILOT_BUSINESSES) {
  // Check if already exists
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/businesses?slug=eq.${biz.slug}&select=id,slug,name`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const existing = await checkRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`  [EXISTS] ${biz.name} (${existing[0].id})`);
    seededBusinesses.push(existing[0]);
    continue;
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(biz),
  });

  if (insertRes.ok) {
    const inserted = await insertRes.json();
    console.log(`  [SEEDED] ${biz.name} (${inserted[0]?.id})`);
    seededBusinesses.push(inserted[0]);
  } else {
    console.error(`  [FAILED] ${biz.name}:`, await insertRes.text());
  }
}

// 2. Seed pilot promotions for these businesses
const PROMOTIONS = [
  {
    business_slug: "benchmark-facilities-maintenance-lagos",
    title: "15% Off Generator Periodic Servicing & Diagnostics",
    slug: "15-off-generator-servicing-lagos",
    description: "Includes complete lube check, fuel filter replacement, and alternator performance calibration for 20kVA+ sets.",
    discount_percentage: 15,
    discount_code: "EASYPOWER15",
    conditions: "Valid on corporate sets 20kVA and above in Lagos.",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    moderation_status: "approved",
  },
  {
    business_slug: "flourish-artisan-bakehouse-lagos",
    title: "Free Custom Message Plaque with Celebration Cakes",
    slug: "free-cake-message-plaque-flourish",
    description: "Order any 2-tier or larger celebration cake and receive a hand-crafted fondant calligraphy message plaque complimentary.",
    discount_percentage: 10,
    discount_code: "BAKEPLAQUE",
    conditions: "Must book at least 48 hours in advance.",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    moderation_status: "approved",
  },
  {
    business_slug: "apex-solar-power-systems-abuja",
    title: "Complimentary Thermal Imaging & Energy Audit",
    slug: "free-solar-energy-audit-abuja",
    description: "Free FLIR infrared thermal panel inspection and circuit load survey for residential and commercial solar installations in Abuja.",
    discount_percentage: 20,
    discount_code: "SOLARAUDIT20",
    conditions: "Available across Abuja Municipal and Maitama districts.",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    moderation_status: "approved",
  },
  {
    business_slug: "trans-Amadi Central Pharmacy & Health Store",
    title: "Free Blood Pressure & Vitals Check Every Wednesday",
    slug: "free-vitals-check-ph",
    description: "Complimentary digital blood pressure, pulse, and BMI check by a licensed pharmacist every Wednesday morning.",
    discount_percentage: 100,
    discount_code: "WELLNESSWED",
    conditions: "In-store at Trans-Amadi branch between 9:00 AM and 1:00 PM.",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    moderation_status: "approved",
  },
];

console.log("\nSeeding pilot business promotions...");

for (const promo of PROMOTIONS) {
  // Find associated business
  const biz = seededBusinesses.find(
    (b) => b.slug === promo.business_slug || b.name.toLowerCase() === promo.business_slug.toLowerCase()
  );
  if (!biz) {
    console.warn(`  [SKIP] Associated business not found for promo: ${promo.title}`);
    continue;
  }

  // Check if exists
  const checkPromo = await fetch(
    `${SUPABASE_URL}/rest/v1/business_promotions?slug=eq.${promo.slug}&select=id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const existingPromo = await checkPromo.json();
  if (Array.isArray(existingPromo) && existingPromo.length > 0) {
    console.log(`  [EXISTS PROMO] ${promo.title}`);
    continue;
  }

  const payload = {
    business_id: biz.id,
    created_by: ownerId,
    title: promo.title,
    slug: promo.slug,
    description: promo.description,
    discount_percentage: promo.discount_percentage,
    discount_code: promo.discount_code,
    conditions: promo.conditions,
    start_date: promo.start_date,
    end_date: promo.end_date,
    is_active: promo.is_active,
    moderation_status: promo.moderation_status,
  };

  const insertPromoRes = await fetch(`${SUPABASE_URL}/rest/v1/business_promotions`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (insertPromoRes.ok) {
    console.log(`  [SEEDED PROMO] ${promo.title}`);
  } else {
    console.error(`  [FAILED PROMO] ${promo.title}:`, await insertPromoRes.text());
  }
}

console.log("\nStage 8 Seeding Complete!");
