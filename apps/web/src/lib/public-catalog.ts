/**
 * EasyLife Public Service Categories, Navigation Registry & Keyword Search.
 * Mirrors the foundational categories in `supabase/seed/dev_seed.sql`.
 * Contains zero fabricated statistics, testimonials, or professional counts.
 *
 * NOTE: This module intentionally has no imports so it can be unit-tested
 * directly with Node's built-in TypeScript type stripping.
 */

export type PublicCategoryIcon =
  | "wrench"
  | "zap"
  | "wind"
  | "settings"
  | "hammer"
  | "sparkles"
  | "paintbrush"
  | "cpu"
  | "grid"
  | "car"
  | "truck"
  | "shirt"
  | "scissors"
  | "calendar"
  | "check-circle"
  | "shield"
  | "sun";

export interface PublicServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: PublicCategoryIcon;
  shortDescription: string;
  commonTasks: readonly string[];
  typicalClients: "Households & Businesses" | "Households" | "Businesses & Estates";
  parentSlug?: string;
}

export const PUBLIC_SERVICE_CATEGORIES: readonly PublicServiceCategory[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Plumbing & Water Systems",
    slug: "plumbing-water-systems",
    icon: "wrench",
    shortDescription:
      "Pipe leaks, borehole pumps, water heaters, overhead tank plumbing, and drainage repairs.",
    commonTasks: [
      "Borehole submersible pump diagnostics & replacement",
      "Concealed & surface pipe leak detection",
      "Water heater installation & pressure valve servicing",
      "Overhead tank float switch & water treatment plumbing",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Electrical & Power Backup",
    slug: "electrical-power-backup",
    icon: "zap",
    shortDescription:
      "Wiring, distribution boards, solar inverters, changeover switches, and fault tracing.",
    commonTasks: [
      "Distribution board (DB) load balancing & circuit breaker replacement",
      "Solar inverter & battery bank installation and diagnostics",
      "Automatic & manual changeover switch installation",
      "Earthing, surge protection, and fault tracing",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "HVAC & Air Conditioning",
    slug: "hvac-air-conditioning",
    icon: "wind",
    shortDescription:
      "Split and standing AC servicing, gas refilling, compressor repair, and commercial HVAC.",
    commonTasks: [
      "Preventive split & cassette AC coil and filter servicing",
      "Refrigerant leak repair and pressure testing",
      "Compressor, capacitor, and PCB board troubleshooting",
      "New AC unit mounting and copper piping installation",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Generator Maintenance",
    slug: "generator-maintenance",
    icon: "settings",
    shortDescription:
      "Diesel and petrol generator servicing, oil/filter replacement, AVR, and alternator repair.",
    commonTasks: [
      "Scheduled diesel generator oil, fuel, and air filter servicing",
      "AVR, actuator, and alternator output diagnostics",
      "Starter motor, radiator, and coolant system repair",
      "Preventive maintenance logs for estate & commercial standby units",
    ],
    typicalClients: "Businesses & Estates",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    name: "Carpentry, Doors & Locks",
    slug: "carpentry-doors-locks",
    icon: "hammer",
    shortDescription:
      "Security doors, cabinetry, wooden roofing, locks, and furniture assembly.",
    commonTasks: [
      "Security & interior door alignment, hinges, and lock cylinder replacement",
      "Kitchen cabinet, wardrobe, and shelving repair",
      "Wooden roof truss inspection and ceiling noggins",
      "Office workstation and residential furniture assembly",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    name: "Cleaning & Fumigation",
    slug: "cleaning-fumigation",
    icon: "sparkles",
    shortDescription:
      "Residential deep cleaning, post-construction cleaning, and pest control.",
    commonTasks: [
      "Move-in / move-out and post-renovation deep cleaning",
      "Residential and commercial office scheduled sanitation",
      "Targeted fumigation and integrated pest management",
      "Upholstery, floor polishing, and facade washing",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    name: "Painting & Wall Finishing",
    slug: "painting-wall-finishing",
    icon: "paintbrush",
    shortDescription:
      "Interior and exterior painting, POP ceiling repair, dampness treatment, and screeding.",
    commonTasks: [
      "Interior wall screeding, priming, and emulsion/satin painting",
      "Dampness and rising moisture wall treatment",
      "POP ceiling crack repair and cornice restoration",
      "Exterior weather-shield facade coating",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    name: "Appliance Repair",
    slug: "appliance-repair",
    icon: "cpu",
    shortDescription:
      "Refrigerators, washing machines, gas cookers, microwaves, and water dispensers.",
    commonTasks: [
      "Refrigerator and chest freezer cooling system repair",
      "Front-load and top-load washing machine servicing",
      "Gas/electric cooker burner and thermostat servicing",
      "Water dispenser heating and cooling unit repair",
    ],
    typicalClients: "Households",
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    name: "Tiling & Floor Installation",
    slug: "tiling-floor-installation",
    icon: "grid",
    shortDescription:
      "Ceramic, porcelain, marble, granite floor laying, screeding, and tile repair.",
    commonTasks: [
      "Porcelain and ceramic living room and bathroom floor tiling",
      "Granite slab installation and marble floor polishing",
      "Floor screeding and damp-proof subfloor preparation",
      "Broken tile replacement and silicone grout sealing",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    name: "Auto Electrical Services",
    slug: "auto-electrical-services",
    icon: "car",
    shortDescription:
      "Vehicle wiring, battery testing, alternator/starter repairs, auto AC, and ECU diagnostics.",
    commonTasks: [
      "Automotive computerized scanner diagnostics and fault clearing",
      "Alternator charging and starter motor refurbishment",
      "Vehicle air conditioning electricals and blower motor repair",
      "Car battery health testing and terminal rewiring",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000013",
    name: "Moving & Relocation Services",
    slug: "moving-relocation-services",
    icon: "truck",
    shortDescription:
      "Home and office moving, furniture dismantling, protective packing, and transit haulage.",
    commonTasks: [
      "Apartment and duplex house-to-house moving and transport",
      "Commercial office desk, server, and file cabinet relocation",
      "Fragile items bubble-wrapping and wooden crating",
      "Heavy appliance lifting, loading, and transit delivery",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000014",
    name: "Laundry & Dry Cleaning",
    slug: "laundry-dry-cleaning",
    icon: "shirt",
    shortDescription:
      "Doorstep garment laundry, dry cleaning, steam pressing, curtain cleaning, and stain removal.",
    commonTasks: [
      "Traditional native attire and formal suit delicate dry cleaning",
      "Bedding, duvet, and heavy curtain industrial washing",
      "Steam ironing, fabric crisping, and hanger packaging",
      "Pickup and scheduled doorstep delivery",
    ],
    typicalClients: "Households",
  },
  {
    id: "10000000-0000-4000-8000-000000000015",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "scissors",
    shortDescription:
      "Mobile barbers, professional hair stylists, bridal makeup artists, and grooming.",
    commonTasks: [
      "Home-visit executive barbering and beard trimming",
      "Ladies hair braiding, weaving, and wig revamping",
      "Bridal event makeup and photoshoot glam styling",
      "Manicure, pedicure, and aesthetic nail grooming",
    ],
    typicalClients: "Households",
  },
  {
    id: "10000000-0000-4000-8000-000000000016",
    name: "Event Planning & Services",
    slug: "event-planning-services",
    icon: "calendar",
    shortDescription:
      "Event decoration, sound and lighting engineering, canopy/stage rentals, and coordination.",
    commonTasks: [
      "Wedding, anniversary, and corporate hall balloon and floral decor",
      "PA sound system, wireless mic, and generator coordination",
      "Event ushering, guest management, and vendor liaison",
      "Chairs, tables, stage, and cooling fan rentals",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000017",
    name: "Everyday Tasks & Chores",
    slug: "everyday-tasks",
    icon: "check-circle",
    shortDescription:
      "General household errands, assembling items, market runs, and custom assistance.",
    commonTasks: [
      "Custom household errands and package collection",
      "Furniture and flat-pack assembly assistance",
      "Market grocery sourcing and delivery assistance",
      "General handyman assistance that doesn't fit a standard category",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    name: "Pest Control",
    slug: "pest-control",
    parentSlug: "cleaning-fumigation",
    icon: "shield",
    shortDescription:
      "Fumigation, rodent baiting, subterranean termite barriers, and insect eradication.",
    commonTasks: [
      "Whole-house fumigation for mosquitoes, bedbugs, and cockroaches",
      "Subterranean termite pre/post-construction chemical barrier",
      "Commercial warehouse rodent control and bait station setup",
    ],
    typicalClients: "Households & Businesses",
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    name: "Solar Installation",
    slug: "solar-installation",
    parentSlug: "electrical-power-backup",
    icon: "sun",
    shortDescription:
      "Solar PV array mounting, MPPT/hybrid inverter configuration, lithium battery banks, and audits.",
    commonTasks: [
      "Rooftop solar panel rail mounting and string wiring",
      "Hybrid/off-grid inverter setup and MPPT charge controller tuning",
      "Lithium (LiFePO4) and tubular battery bank balancing",
    ],
    typicalClients: "Households & Businesses",
  },
] as const;

export function getServiceCategoryBySlug(
  slug: string
): PublicServiceCategory | undefined {
  return PUBLIC_SERVICE_CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Everyday Nigerian terms mapped to categories (e.g. "gen", "NEPA", "AC").
 * This is a deterministic keyword matcher — not the AI categorization feature.
 */
const SEARCH_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  "plumbing-water-systems": [
    "plumber", "plumbing", "pipe", "pipes", "leak", "leaking", "tap", "borehole",
    "pump", "water", "toilet", "sink", "drain", "drainage", "heater", "tank",
  ],
  "electrical-power-backup": [
    "electrician", "electrical", "wiring", "wire", "light", "lights", "socket",
    "nepa", "phcn", "power", "inverter", "solar", "battery", "changeover",
    "breaker", "fuse", "bulb",
  ],
  "hvac-air-conditioning": [
    "ac", "a/c", "aircon", "air", "conditioner", "conditioning", "hvac",
    "cooling", "split", "compressor", "refrigerant",
  ],
  "generator-maintenance": [
    "generator", "gen", "genset", "diesel", "petrol", "avr", "alternator",
    "starter", "kva",
  ],
  "carpentry-doors-locks": [
    "carpenter", "carpentry", "door", "doors", "lock", "locks", "key",
    "cabinet", "wardrobe", "furniture", "wood", "wooden", "roof", "hinge",
  ],
  "cleaning-fumigation": [
    "cleaning", "cleaner", "clean", "fumigation", "fumigate", "pest",
    "cockroach", "cockroaches", "rodent", "rat", "rats", "termite", "sanitation",
  ],
  "painting-wall-finishing": [
    "painter", "painting", "paint", "wall", "walls", "screeding", "pop",
    "ceiling", "damp", "dampness", "crack",
  ],
  "appliance-repair": [
    "fridge", "refrigerator", "freezer", "washing", "washer", "machine",
    "cooker", "microwave", "dispenser", "appliance", "appliances",
  ],
  "tiling-floor-installation": [
    "tiler", "tiling", "tile", "tiles", "floor", "flooring", "granite",
    "marble", "porcelain", "ceramic", "grout", "screed",
  ],
  "auto-electrical-services": [
    "rewire", "car", "auto", "vehicle", "starter", "alternator", "battery",
    "ecu", "scanner", "dashboard", "car ac", "auto electrician",
  ],
  "moving-relocation-services": [
    "moving", "mover", "relocation", "relocate", "packing", "haulage",
    "truck", "van", "furniture moving", "shift",
  ],
  "laundry-dry-cleaning": [
    "laundry", "dry cleaning", "drycleaner", "washing", "ironing",
    "steam", "pressing", "suits", "native", "curtains", "duvet",
  ],
  "beauty-personal-care": [
    "barber", "hair", "haircut", "styling", "braids", "weaving", "makeup",
    "artist", "nails", "pedicure", "manicure", "grooming",
  ],
  "event-planning-services": [
    "event", "planner", "decorator", "decoration", "catering", "sound",
    "lighting", "dj", "mc", "usher", "canopy", "stage",
  ],
  "everyday-tasks": [
    "task", "errand", "errands", "chore", "chores", "assemble", "shopping",
    "helper", "handyman", "custom", "assist", "assistance",
  ],
  "pest-control": [
    "pest", "fumigation", "cockroach", "termite", "termites", "bedbug",
    "bedbugs", "rat", "rats", "rodent", "insect", "mosquito",
  ],
  "solar-installation": [
    "solar", "panel", "panels", "inverter", "battery", "lithium", "pv",
    "charge controller", "mppt", "offgrid", "clean energy",
  ],
};

const STOPWORDS = new Set([
  "the", "and", "for", "not", "my", "is", "an", "of", "in", "on", "to",
  "with", "has", "have", "it", "its", "need", "help", "fix", "repair",
  "broken", "working", "stopped", "please", "me", "our", "at", "home",
]);

export function tokeniseSearchQuery(query: string): string[] {
  return query
    .toLowerCase()
    .slice(0, 120)
    .split(/[^a-z0-9/]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function searchServiceCategories(
  query: string
): PublicServiceCategory[] {
  const tokens = tokeniseSearchQuery(query);
  if (tokens.length === 0) return [];

  return PUBLIC_SERVICE_CATEGORIES.map((category, index) => {
    const haystack = `${category.name} ${category.shortDescription} ${category.commonTasks.join(" ")}`.toLowerCase();
    const synonyms = SEARCH_SYNONYMS[category.slug] ?? [];
    let score = 0;
    for (const token of tokens) {
      if (synonyms.includes(token)) score += 3;
      else if (token.length >= 3 && haystack.includes(token)) score += 1;
    }
    return { category, score, index };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.category);
}

export const PUBLIC_PRIMARY_NAV_LINKS = [
  {
    label: "Home",
    href: "/",
    icon: "home" as const,
    description: "Everyday Problems. Smarter Solutions.",
  },
  {
    label: "Find Services",
    href: "/services",
    icon: "search" as const,
    description: "Verified professionals & trade services",
  },
  {
    label: "Post a Need",
    href: "/post-a-need",
    icon: "clipboard" as const,
    description: "Get competitive quotes from vetted pros",
  },
  {
    label: "Jobs & Opportunities",
    href: "/jobs",
    icon: "briefcase" as const,
    description: "Vacancies, gigs & apprenticeships",
  },
  {
    label: "Business Hub",
    href: "/business-hub",
    icon: "building" as const,
    description: "Directory, deals & corporate facilities",
  },
  {
    label: "Free Tools",
    href: "/tools",
    icon: "wrench" as const,
    description: "Cost estimators & power calculators",
  },
] as const;

export const PUBLIC_FOOTER_LINKS = {
  platform: [
    { label: "Home", href: "/" },
    { label: "Find Services", href: "/services" },
    { label: "Post a Need", href: "/post-a-need" },
    { label: "Jobs & Opportunities", href: "/jobs" },
    { label: "Business Hub", href: "/business-hub" },
    { label: "Free Tools", href: "/tools" },
    { label: "How It Works", href: "/how-it-works" },
  ],
  companyAndSupport: [
    { label: "About EasyLife", href: "/about" },
    { label: "Help Centre", href: "/help" },
    { label: "Contact Us", href: "/contact" },
  ],
  legalAndTrust: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Professional Verification Policy", href: "/verification-policy" },
  ],
  account: [
    { label: "Log In", href: "/login" },
    { label: "Create Account", href: "/register" },
    { label: "Register as a Professional", href: "/register?role=professional" },
    { label: "Register a Business", href: "/register?role=business" },
    { label: "Register as an Employer", href: "/register?role=employer" },
  ],
} as const;
