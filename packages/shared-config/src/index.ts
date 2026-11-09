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
  palette: "Option C — Harbor Teal & Coral",
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
  primary: "#154752",
  secondary: "#24989A",
  accent: "#EE9277",
  background: "#F3F8F8",
  surface: "#FFFFFF",
  text: "#1F2F34",
  muted: "#68797C",
  border: "#DAE7E7",

  // Legacy mappings for backwards-compatibility
  navy: {
    950: "#0D282E",
    900: "#154752",
    800: "#1A5663",
    700: "#206776",
  },
  teal: {
    700: "#1D7E80",
    600: "#24989A",
    500: "#2DC0C2",
    50: "#EEF9F9",
  },
  surfaceTokens: {
    white: "#FFFFFF",
    lightGrey: "#F3F8F8",
    mutedGrey: "#E7F0F0",
    borderGrey: "#DAE7E7",
  },
} as const;

export * from "./design-tokens";
