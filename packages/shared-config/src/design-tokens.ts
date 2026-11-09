/**
 * EasyLife Official Design System Tokens
 * Shared source of truth for Next.js (TypeScript/Tailwind) and mirrored in Flutter (`easylife_theme.dart`).
 */

export const EASYLIFE_COLOR_PALETTE = {
  // Option C — Harbor Teal & Coral Official Tokens
  brand: {
    primary: "#154752", // Deep Harbor Teal
    primaryDark: "#0D282E", // Darkest Harbor Navy
    secondary: "#24989A", // Maritime Teal
    secondaryHover: "#1D7E80", // Deep Maritime Teal
    accent: "#EE9277", // Warm Coral Accent
    accentHover: "#E77858", // Vibrant Coral
    background: "#F3F8F8", // Airy Pale Teal Background
    surface: "#FFFFFF", // Crisp White Surface
    text: "#1F2F34", // High-Contrast Deep Charcoal Teal
    muted: "#68797C", // Balanced Slate Muted Text
    border: "#DAE7E7", // Structural Hairline Border
    strongBorder: "#C2D4D4", // Active Input Border
  },
  // Backwards-compatible mapped structures
  navy: {
    950: "#0D282E", // Deepest brand background
    900: "#154752", // Primary Harbor Teal surface & navigation
    800: "#1A5663", // Primary heading & high-contrast body text
    700: "#206776", // Secondary dark surface
    600: "#2B7A8A", // Interactive secondary
  },
  teal: {
    800: "#186869", // High-contrast accessible teal text
    700: "#1D7E80", // Hover state for primary buttons
    600: "#24989A", // Secondary brand Teal CTA & verified badge fill
    500: "#2DC0C2", // Accent highlight on dark surfaces
    100: "#D6F2F2", // Soft badge border
    50: "#EEF9F9", // Tinted surface for active states
  },
  charcoal: {
    900: "#142024", // Deep charcoal text
    800: "#1F2F34", // Primary body copy
    700: "#35474C", // Form label & table cell text
    600: "#4E6065", // Secondary body text
    500: "#68797C", // Helper text & metadata timestamps
    400: "#9CA3AF", // Disabled text / placeholder
  },
  surface: {
    white: "#FFFFFF", // Primary card & input background
    lightGrey: "#F3F8F8", // Default application canvas
    mutedGrey: "#E7F0F0", // Secondary section background & table header
    borderGrey: "#DAE7E7", // Standard 1px card & divider border
    strongBorder: "#C2D4D4", // Form input border
  },
  status: {
    success: {
      text: "#127A5B",
      icon: "#127A5B",
      bg: "#E7F7F1",
      border: "#A3E5D0",
    },
    warning: {
      text: "#B25E0A",
      icon: "#B25E0A",
      bg: "#FEF5E7",
      border: "#FCD9A5",
    },
    error: {
      text: "#C53030",
      icon: "#C53030",
      bg: "#FDF0F0",
      border: "#F8B4B4",
    },
    info: {
      text: "#1A6E84",
      icon: "#1A6E84",
      bg: "#EBF6F9",
      border: "#A9DCE7",
    },
    neutral: {
      text: "#4E6065",
      icon: "#68797C",
      bg: "#E7F0F0",
      border: "#DAE7E7",
    },
  },
} as const;

export const EASYLIFE_TYPOGRAPHY = {
  fontFamily: {
    sans: "'General Sans', ui-sans-serif, sans-serif",
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  scale: {
    display: {
      fontSize: "2.25rem", // 36px
      lineHeight: "2.75rem", // 44px
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h1: {
      fontSize: "1.875rem", // 30px
      lineHeight: "2.375rem", // 38px
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.5rem", // 24px
      lineHeight: "2rem", // 32px
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontSize: "1.25rem", // 20px
      lineHeight: "1.75rem", // 28px
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontSize: "1.0625rem", // 17px
      lineHeight: "1.5rem", // 24px
      fontWeight: 600,
      letterSpacing: "0em",
    },
    bodyLg: {
      fontSize: "1rem", // 16px
      lineHeight: "1.625rem", // 26px
      fontWeight: 400,
    },
    body: {
      fontSize: "0.875rem", // 14px
      lineHeight: "1.375rem", // 22px
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.75rem", // 12px
      lineHeight: "1.125rem", // 18px
      fontWeight: 500,
    },
  },
} as const;

export const EASYLIFE_SPACING = {
  baseUnitPx: 4,
  scale: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
} as const;

export const EASYLIFE_BREAKPOINTS = {
  xs: 360, // Entry-level Android handsets common in Nigeria
  sm: 640, // Large phones / Phablets
  md: 768, // Tablets & compact laptops
  lg: 1024, // Standard desktop & Business sidebar layout
  xl: 1280, // Wide desktop workspace
  "2xl": 1536, // High-density Admin monitoring screens
} as const;

export interface ExperienceDesignProfile {
  id: "customer" | "professional" | "business" | "admin";
  label: string;
  navigationPattern: string;
  layoutDensity: "comfortable" | "task-focused" | "structured" | "compact-high-density";
  headerBackground: string;
  accentColor: string;
  surfaceCanvas: string;
  signatureCharacteristics: readonly string[];
}

/**
 * Ensures the four connected experiences share the EasyLife brand identity
 * without looking like identical clones.
 */
export const EASYLIFE_EXPERIENCE_DESIGN_PROFILES: Record<
  ExperienceDesignProfile["id"],
  ExperienceDesignProfile
> = {
  customer: {
    id: "customer",
    label: "Customer Marketplace Experience",
    navigationPattern:
      "Clean top utility bar on desktop + bottom 4-tab bar on mobile with prominent AI Problem Finder",
    layoutDensity: "comfortable",
    headerBackground: "#FFFFFF",
    accentColor: "#0D9488",
    surfaceCanvas: "#F8FAFC",
    signatureCharacteristics: [
      "Warm, spacious white cards with visual category icons and clear NGN pricing",
      "Prominent natural-language AI Problem Categorization search box",
      "Trust-first professional cards highlighting Verified badges and real completed job counts",
    ],
  },
  professional: {
    id: "professional",
    label: "Service Professional Workbench",
    navigationPattern:
      "Deep Navy operational header with live Availability Toggle + verification status strip",
    layoutDensity: "task-focused",
    headerBackground: "#0A192F",
    accentColor: "#14B8A6",
    surfaceCanvas: "#F1F5F9",
    signatureCharacteristics: [
      "Action-oriented job queue cards prioritizing urgency, district location, and customer schedule",
      "Fast itemized quotation builder (Labor, Materials, Callout Fee in NGN)",
      "One-tap appointment status progression and completion sign-off",
    ],
  },
  business: {
    id: "business",
    label: "Business & Property Maintenance Portal",
    navigationPattern:
      "Left collapsible facility sidebar (#1E293B) with Property/Branch context switcher",
    layoutDensity: "structured",
    headerBackground: "#1E293B",
    accentColor: "#0D9488",
    surfaceCanvas: "#F8FAFC",
    signatureCharacteristics: [
      "Multi-property & unit hierarchy views with equipment asset tags and serial numbers",
      "Preventive maintenance calendar & due-date countdown indicators",
      "Structured asset maintenance history tables and cost tracking",
    ],
  },
  admin: {
    id: "admin",
    label: "Platform Administrator Console",
    navigationPattern:
      "Dark Deep Navy (#06101F) governance sidebar with queue counters & audit trail header",
    layoutDensity: "compact-high-density",
    headerBackground: "#06101F",
    accentColor: "#0D9488",
    surfaceCanvas: "#F1F5F9",
    signatureCharacteristics: [
      "High-density data tables with multi-column filtering and instant status pills",
      "Side-by-side KYC document inspection & verification decision panel",
      "Dispute arbitration timeline and immutable audit log inspector",
    ],
  },
} as const;

export const ACCESSIBLE_COLOR_COMBINATIONS = [
  {
    pair: "White (#FFFFFF) on Deep Navy (#0A192F)",
    contrastRatio: "17.4:1",
    wcagLevel: "AAA",
    usage: "Primary navigation headers, hero banners, dark sidebar text",
  },
  {
    pair: "Deep Navy (#0F172A) on White (#FFFFFF)",
    contrastRatio: "17.8:1",
    wcagLevel: "AAA",
    usage: "Card headings, body copy, form input text, table cells",
  },
  {
    pair: "Charcoal (#374151) on Light Grey (#F8FAFC)",
    contrastRatio: "10.6:1",
    wcagLevel: "AAA",
    usage: "Secondary descriptions, form labels, table headers",
  },
  {
    pair: "White (#FFFFFF) on Teal 700 (#0F766E)",
    contrastRatio: "5.4:1",
    wcagLevel: "AA",
    usage: "Primary action buttons and active navigation pills",
  },
  {
    pair: "Teal 800 (#115E59) on Teal 50 (#F0FDFA)",
    contrastRatio: "7.2:1",
    wcagLevel: "AAA",
    usage: "Verified professional badges and highlighted status callouts",
  },
  {
    pair: "Error Red (#991B1B) on Error Bg (#FEE2E2)",
    contrastRatio: "7.5:1",
    wcagLevel: "AAA",
    usage: "Form validation errors, rejected status pills, dispute alerts",
  },
] as const;
