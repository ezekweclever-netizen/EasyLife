/**
 * EasyLife Official Design System Tokens
 * Shared source of truth for Next.js (TypeScript/Tailwind) and mirrored in Flutter (`easylife_theme.dart`).
 */

export const EASYLIFE_COLOR_PALETTE = {
  // Official Centralized EasyLife Global Design System Palette
  foundation: {
    charcoal: "#1F2328",
    steelGrey: "#4A525C",
    burntOrange: "#E8590C",
    orangeHover: "#C84A06",
    peach: "#FCEBDD",
    cream: "#FAF7F3",
    white: "#FFFFFF",
    borders: "#E6E0D8",
    darkSurfaceText: "#FAF7F3",
    secondaryDarkText: "#C3C8CF",
  },
  semantic: {
    success: "#2E7D4F",
    warning: "#B7791F",
    error: "#C53030",
    information: "#4A525C",
  },
  brand: {
    primary: "#E8590C", // Burnt Orange
    primaryDark: "#C84A06", // Orange Hover
    primaryHover: "#C84A06", // Orange Hover
    secondary: "#4A525C", // Steel Grey
    secondaryHover: "#1F2328", // Charcoal
    accent: "#E8590C", // Burnt Orange
    accentHover: "#C84A06", // Orange Hover
    accentSoft: "#FCEBDD", // Peach
    background: "#FAF7F3", // Cream
    surface: "#FFFFFF", // White
    text: "#1F2328", // Charcoal
    textSecondary: "#4A525C", // Steel Grey
    muted: "#4A525C", // Steel Grey
    border: "#E6E0D8", // Borders
    strongBorder: "#C3C8CF", // Secondary Dark Text
    darkSurfaceText: "#FAF7F3",
    secondaryDarkText: "#C3C8CF",
  },
  // Backwards-compatible mapped structures
  navy: {
    950: "#14171A",
    900: "#1F2328",
    800: "#262B32",
    700: "#353B44",
    600: "#4A525C",
  },
  teal: {
    800: "#C84A06",
    700: "#C84A06",
    600: "#E8590C",
    500: "#E8590C",
    100: "#FCEBDD",
    50: "#FAF7F3",
  },
  charcoal: {
    900: "#14171A",
    800: "#1F2328",
    700: "#353B44",
    600: "#4A525C",
    500: "#6B7582",
    400: "#C3C8CF",
  },
  surface: {
    white: "#FFFFFF",
    lightGrey: "#FAF7F3",
    mutedGrey: "#F2EDE6",
    borderGrey: "#E6E0D8",
    strongBorder: "#C3C8CF",
  },
  status: {
    success: {
      text: "#2E7D4F",
      icon: "#2E7D4F",
      bg: "#E8F5ED",
      border: "#A3D9B5",
    },
    warning: {
      text: "#B7791F",
      icon: "#B7791F",
      bg: "#FEF7EC",
      border: "#F5D499",
    },
    error: {
      text: "#C53030",
      icon: "#C53030",
      bg: "#FDE8E8",
      border: "#F8B4B4",
    },
    info: {
      text: "#4A525C",
      icon: "#4A525C",
      bg: "#EBF0F5",
      border: "#C3C8CF",
    },
    neutral: {
      text: "#4A525C",
      icon: "#4A525C",
      bg: "#FAF7F3",
      border: "#E6E0D8",
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
    accentColor: "#E8590C",
    surfaceCanvas: "#FAF7F3",
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
    headerBackground: "#1F2328",
    accentColor: "#E8590C",
    surfaceCanvas: "#FAF7F3",
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
      "Left collapsible facility sidebar (#1F2328) with Property/Branch context switcher",
    layoutDensity: "structured",
    headerBackground: "#1F2328",
    accentColor: "#E8590C",
    surfaceCanvas: "#FAF7F3",
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
      "Dark Deep Navy (#1F2328) governance sidebar with queue counters & audit trail header",
    layoutDensity: "compact-high-density",
    headerBackground: "#1F2328",
    accentColor: "#E8590C",
    surfaceCanvas: "#FAF7F3",
    signatureCharacteristics: [
      "High-density data tables with multi-column filtering and instant status pills",
      "Side-by-side KYC document inspection & verification decision panel",
      "Dispute arbitration timeline and immutable audit log inspector",
    ],
  },
} as const;

export const EASYLIFE_DARK_MODE_TOKENS = {
  background: "#15181C",
  surface: "#1F2328",
  primaryText: "#FAF7F3",
  secondaryText: "#C3C8CF",
  accent: "#F06A1F",
  border: "#2E343B",
  borderStrong: "#4A525C",
  focusRing: "#F06A1F",
} as const;

export const ACCESSIBLE_COLOR_COMBINATIONS = [
  {
    pair: "Dark Primary Text (#FAF7F3) on Dark Background (#15181C)",
    contrastRatio: "16.8:1",
    wcagLevel: "AAA",
    usage: "Dark mode body text, titles, headings, modal text",
  },
  {
    pair: "Dark Primary Text (#FAF7F3) on Dark Surface (#1F2328)",
    contrastRatio: "14.7:1",
    wcagLevel: "AAA",
    usage: "Dark mode card titles, inputs, buttons, table cell text",
  },
  {
    pair: "Dark Secondary Text (#C3C8CF) on Dark Surface (#1F2328)",
    contrastRatio: "9.3:1",
    wcagLevel: "AAA",
    usage: "Dark mode secondary descriptions, subtitles, table headers, captions",
  },
  {
    pair: "Dark Accent (#F06A1F) on Dark Surface (#1F2328)",
    contrastRatio: "5.8:1",
    wcagLevel: "AA",
    usage: "Dark mode focus rings, active badges, key highlights, primary buttons",
  },
  {
    pair: "Charcoal (#1F2328) on Cream Canvas (#FAF7F3)",
    contrastRatio: "14.7:1",
    wcagLevel: "AAA",
    usage: "Light mode body text, headings, form labels",
  },
  {
    pair: "White (#FFFFFF) on Burnt Orange (#E8590C)",
    contrastRatio: "3.5:1",
    wcagLevel: "AA Large",
    usage: "Primary action buttons with bold typography",
  },
  {
    pair: "Error Red (#C53030) on Error Bg (#FDE8E8)",
    contrastRatio: "6.8:1",
    wcagLevel: "AA",
    usage: "Form validation errors, rejected status pills, dispute alerts",
  },
] as const;
