/**
 * EasyLife Shared Brand, Design System, and Platform Configuration
 */

export const EASYLIFE_BRAND = {
  name: "EasyLife",
  slogan: "Everyday Problems. Smarter Solutions.",
  description:
    "EasyLife helps people and businesses find reliable everyday services and manage essential maintenance with less effort.",
  country: "Nigeria",
  currency: {
    code: "NGN",
    symbol: "₦",
    locale: "en-NG",
  },
  palette: "EasyLife Centralized Palette (Charcoal, Burnt Orange, Cream)",
  pilotCities: [
    {
      id: "port-harcourt",
      name: "Port Harcourt",
      state: "Rivers State",
      isPrimaryPilot: true,
    },
    {
      id: "lagos",
      name: "Lagos",
      state: "Lagos State",
      isPrimaryPilot: false,
    },
    {
      id: "abuja",
      name: "Abuja",
      state: "FCT",
      isPrimaryPilot: false,
    },
  ],
} as const;

export const EASYLIFE_THEME_COLORS = {
  // Official Centralized Palette Foundation
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

  // Semantic
  semantic: {
    success: "#2E7D4F",
    warning: "#B7791F",
    error: "#C53030",
    information: "#4A525C",
  },

  // Functional Role Mappings
  primary: "#E8590C",
  primaryHover: "#C84A06",
  secondary: "#4A525C",
  accent: "#E8590C",
  accentSoft: "#FCEBDD",
  background: "#FAF7F3",
  surface: "#FFFFFF",
  text: "#1F2328",
  muted: "#4A525C",
  border: "#E6E0D8",

  // Legacy mappings for backwards-compatibility
  navy: {
    950: "#14171A",
    900: "#1F2328",
    800: "#262B32",
    700: "#353B44",
  },
  teal: {
    700: "#C84A06",
    600: "#E8590C",
    500: "#E8590C",
    50: "#FAF7F3",
  },
  surfaceTokens: {
    white: "#FFFFFF",
    lightGrey: "#FAF7F3",
    mutedGrey: "#F2EDE6",
    borderGrey: "#E6E0D8",
  },
} as const;

export * from "./design-tokens";
