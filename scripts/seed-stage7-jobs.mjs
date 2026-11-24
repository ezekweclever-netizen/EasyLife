import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 1. Fetch an admin or default profile to be the poster
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
const posterId = profiles[0]?.id;
if (!posterId) {
  console.error("No profile found to associate job postings with.");
  process.exit(1);
}

console.log(`Using poster profile: ${profiles[0].email} (${posterId})`);

const PILOT_VACANCIES = [
  {
    title: "Senior Solar Inverter & Battery Storage Technician",
    slug: "senior-solar-inverter-battery-technician-ph",
    category: "Electrical & Solar",
    employment_type: "full_time",
    workplace_type: "on_site",
    city: "Port Harcourt",
    state: "Rivers State",
    address: "Plot 14 Peter Odili Road, Trans-Amadi Corridor, Port Harcourt",
    min_salary_kobo: 22000000,
    max_salary_kobo: 30000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: true,
    positions_available: 2,
    benefits: ["Health insurance", "Transport allowance", "Tools provision", "Overtime bonus"],
    description: "Lead technician required for residential and corporate solar inverter deployments (5kVA to 30kVA systems) across Port Harcourt, including lithium battery rack wiring, charge controller programming, and grid-tied switchboards.",
    requirements: "3+ years professional solar and inverter installation experience; valid electrical trade test or vocational diploma; strong safety track record with DC high voltage.",
    responsibilities: "Survey sites, install racking, wire inverter units and lithium batteries, program hybrid charge controllers, and conduct final customer handover testing.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
  {
    title: "Commercial Chiller & HVAC Maintenance Specialist",
    slug: "commercial-hvac-maintenance-specialist-lagos",
    category: "AC & Refrigeration",
    employment_type: "contract",
    workplace_type: "on_site",
    city: "Lagos",
    state: "Lagos State",
    address: "Adeola Odeku Street, Victoria Island, Lagos",
    min_salary_kobo: 25000000,
    max_salary_kobo: 35000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: false,
    positions_available: 3,
    benefits: ["Quarterly performance bonus", "PPE & safety gear", "Official transport"],
    description: "Experienced HVAC technician sought for scheduled quarterly maintenance, multi-split chemical deep cleaning, and chiller troubleshooting for corporate banking headquarters in Victoria Island.",
    requirements: "Trade test 1/2 in Refrigeration & Air Conditioning, 4+ years on VRF/VRV systems, diagnostic mastery with R410A and R32 manifolds.",
    responsibilities: "Execute scheduled preventive maintenance, leak detection, compressor coil testing, electronic thermostat calibration, and emergency breakdown repairs.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
  {
    title: "Heavy Duty Diesel Generator Overhaul Engineer",
    slug: "heavy-duty-diesel-generator-engineer-abuja",
    category: "Generator & Mechanical",
    employment_type: "full_time",
    workplace_type: "on_site",
    city: "Abuja",
    state: "Federal Capital Territory",
    address: "Maitama District, Adjacent Ministers Hill, Abuja",
    min_salary_kobo: 28000000,
    max_salary_kobo: 38000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: true,
    positions_available: 1,
    benefits: ["On-call emergency allowance", "Housing allowance subsidy", "Pension contribution"],
    description: "Direct mechanical responsibility for a fleet of 100kVA – 800kVA backup power plants (Perkins, Cummins, FG Wilson) across multiple diplomatic and executive residences in Maitama & Wuse 2.",
    requirements: "5+ years diesel plant maintenance, fuel injection timing, AVR calibration, ATS synchronization panel diagnostics.",
    responsibilities: "Conduct routine oil and filter servicing, top-end overhauls, injector testing, radiator flushing, and automatic transfer switch inspection.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
  {
    title: "Vocational Apprentice: PPR Pipefitting & Sanitary Plumbing",
    slug: "vocational-plumbing-apprentice-ph",
    category: "Apprenticeship & Vocational",
    employment_type: "apprenticeship",
    workplace_type: "on_site",
    city: "Port Harcourt",
    state: "Rivers State",
    address: "Old GRA & D-Line Service Workshop, Port Harcourt",
    min_salary_kobo: 8000000,
    max_salary_kobo: 12000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: false,
    positions_available: 4,
    benefits: ["Daily transport stipend", "Safety boots & tool set provided", "Trade test sponsorship"],
    description: "Paid vocational apprenticeship program for aspiring young plumbers. Work alongside licensed master plumbers learning PPR thermal fusion, domestic water filtration, pressure pump installation, and concealed bathroom piping.",
    requirements: "Minimum SSCE/WASSCE, high mechanical aptitude, disciplined timekeeping, and eagerness to build a trade career.",
    responsibilities: "Assist master plumber on site, prepare piping joints, manage job tools and materials, practice pipe threading and test lines for pressure leaks.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
  {
    title: "Industrial Facility Electrician & Motor Control Technician",
    slug: "industrial-facility-electrician-lagos",
    category: "Electrical & Solar",
    employment_type: "full_time",
    workplace_type: "on_site",
    city: "Lagos",
    state: "Lagos State",
    address: "Ikeja Industrial Estate, Near Oba Akran, Lagos",
    min_salary_kobo: 24000000,
    max_salary_kobo: 32000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: true,
    positions_available: 2,
    benefits: ["Health HMO", "Lunch subsidy", "Annual leave allowance"],
    description: "Facility maintenance electrician to oversee 3-phase industrial power distribution, water pumping control panels, star-delta starters, and plant lighting systems.",
    requirements: "Trade qualification or OND Electrical Engineering, 3+ years in industrial or commercial facility maintenance, multimeter and megger insulation testing proficiency.",
    responsibilities: "Maintain main distribution boards, troubleshoot tripped breaker lines, inspect induction motors, wire changeover switches, and verify earthing resistance.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
  {
    title: "Finishing Screeder, Tiler & Decorative Painter",
    slug: "finishing-tiler-decorative-painter-abuja",
    category: "Skilled Trades",
    employment_type: "contract",
    workplace_type: "on_site",
    city: "Abuja",
    state: "Federal Capital Territory",
    address: "Guzape Diplomatic Zone, Abuja",
    min_salary_kobo: 18000000,
    max_salary_kobo: 24000000,
    salary_period: "month",
    currency_code: "NGN",
    is_negotiable: true,
    positions_available: 3,
    benefits: ["Site lunch", "Weekly milestone disbursement", "Protective equipment"],
    description: "Skilled artisan needed for high-end interior screeding, damp-proof base application, porcelain tile laying (60x60 / 60x120), and satin/matte emulsion finishing for luxury villas.",
    requirements: "3+ years specialized finishing experience, laser leveling proficiency, clean edging, and high attention to detail.",
    responsibilities: "Wall surface preparation, plaster skimming, tile laser alignment, grouting, and multi-coat spray or roller painting.",
    status: "open",
    moderation_status: "approved",
    posted_by: posterId,
  },
];

console.log(`Seeding ${PILOT_VACANCIES.length} pilot vacancies...`);

for (const vac of PILOT_VACANCIES) {
  // Check if already exists by slug
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/job_vacancies?slug=eq.${vac.slug}&select=id`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const existing = await checkRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`  [EXISTS] ${vac.title} (${vac.slug})`);
    continue;
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/job_vacancies`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(vac),
  });

  if (insertRes.ok) {
    const inserted = await insertRes.json();
    console.log(`  [SEEDED] ${vac.title} (${inserted[0]?.id})`);
  } else {
    console.error(`  [FAILED] ${vac.title}:`, await insertRes.text());
  }
}

console.log("Stage 7 Job Vacancies Seeding Complete!");
