import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import {
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_MARKETPLACE_SETTINGS,
} from "@/lib/platform-settings";
import type {
  GeneralPlatformSettings,
  MarketplacePlatformSettings,
} from "@easylife/shared-types";
import { EASYLIFE_BRAND } from "@easylife/shared-config";

export interface PublicPlatformSettings {
  platformName: string;
  platformDescription: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  businessAddress: string;
  defaultCurrency: string;
  defaultCountry: string;
  supportedCities: string[];
  maintenanceModeEnabled: boolean;
  maintenanceModeMessage: string;
  defaultQuotationExpiryHours: number;
}

const FALLBACK_PUBLIC_SETTINGS: PublicPlatformSettings = {
  platformName: EASYLIFE_BRAND.name,
  platformDescription: EASYLIFE_BRAND.description,
  contactEmail: "support@easylife.ng",
  contactPhone: "07049948582",
  websiteUrl: "https://easylife.vercel.app",
  businessAddress: "Trans-Amadi Commercial Layout, Port Harcourt, Rivers State",
  defaultCurrency: EASYLIFE_BRAND.currency.code,
  defaultCountry: EASYLIFE_BRAND.country,
  supportedCities: EASYLIFE_BRAND.pilotCities.map((c) => c.name),
  maintenanceModeEnabled: false,
  maintenanceModeMessage: "",
  defaultQuotationExpiryHours: 48,
};

/**
 * Retrieves public platform settings directly from Supabase with no-store/revalidation,
 * falling back to configured defaults if database is unreachable.
 */
export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  const config = getSupabasePublicConfig();
  if (!config) {
    return FALLBACK_PUBLIC_SETTINGS;
  }

  try {
    const res = await supabaseFetch<
      Array<{
        key: string;
        value: unknown;
        is_public: boolean;
      }>
    >(config, "/rest/v1/platform_settings?is_public=eq.true&select=key,value,is_public", {
      timeoutMs: 5000,
      retryOnNetworkError: true,
    });

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      return FALLBACK_PUBLIC_SETTINGS;
    }

    const map = new Map<string, unknown>();
    for (const row of res.data) {
      if (row && typeof row.key === "string") {
        map.set(row.key, row.value);
      }
    }

    // Extract structured settings.general if present, or individual keys
    const rawGeneral = (
      typeof map.get("settings.general") === "object" && map.get("settings.general") !== null
        ? map.get("settings.general")
        : {}
    ) as Partial<GeneralPlatformSettings>;

    const rawMarketplace = (
      typeof map.get("settings.marketplace") === "object" && map.get("settings.marketplace") !== null
        ? map.get("settings.marketplace")
        : {}
    ) as Partial<MarketplacePlatformSettings>;

    const platformName =
      (typeof rawGeneral.platform_name === "string" && rawGeneral.platform_name.trim()) ||
      (typeof map.get("system.platform_name") === "string" && String(map.get("system.platform_name")).trim()) ||
      FALLBACK_PUBLIC_SETTINGS.platformName;

    const platformDescription =
      (typeof rawGeneral.platform_description === "string" && rawGeneral.platform_description.trim()) ||
      (typeof map.get("system.platform_description") === "string" && String(map.get("system.platform_description")).trim()) ||
      FALLBACK_PUBLIC_SETTINGS.platformDescription;

    const contactEmail =
      (typeof rawGeneral.contact_email === "string" && rawGeneral.contact_email.trim()) ||
      (typeof map.get("system.support_email") === "string" && String(map.get("system.support_email")).trim()) ||
      FALLBACK_PUBLIC_SETTINGS.contactEmail;

    const contactPhone =
      (typeof rawGeneral.contact_phone === "string" && rawGeneral.contact_phone.trim()) ||
      (typeof map.get("system.support_phone") === "string" && String(map.get("system.support_phone")).trim()) ||
      FALLBACK_PUBLIC_SETTINGS.contactPhone;

    const websiteUrl =
      (typeof rawGeneral.website_url === "string" && rawGeneral.website_url.trim()) ||
      FALLBACK_PUBLIC_SETTINGS.websiteUrl;

    const businessAddress =
      (typeof rawGeneral.business_address === "string" && rawGeneral.business_address.trim()) ||
      FALLBACK_PUBLIC_SETTINGS.businessAddress;

    const defaultCurrency =
      (typeof rawGeneral.default_currency === "string" && rawGeneral.default_currency.trim()) ||
      FALLBACK_PUBLIC_SETTINGS.defaultCurrency;

    const defaultCountry =
      (typeof rawGeneral.default_country === "string" && rawGeneral.default_country.trim()) ||
      FALLBACK_PUBLIC_SETTINGS.defaultCountry;

    let supportedCities: string[] = FALLBACK_PUBLIC_SETTINGS.supportedCities;
    if (Array.isArray(rawGeneral.supported_cities) && rawGeneral.supported_cities.length > 0) {
      supportedCities = Array.from(new Set(rawGeneral.supported_cities.map((c: unknown) => String(c).trim()).filter(Boolean)));
    } else if (Array.isArray(map.get("pilot_cities")) && (map.get("pilot_cities") as unknown[]).length > 0) {
      supportedCities = Array.from(new Set((map.get("pilot_cities") as unknown[]).map((c: unknown) => String(c).trim()).filter(Boolean)));
    }

    const maintenanceModeEnabled =
      Boolean(rawMarketplace.maintenance_mode_enabled) ||
      Boolean((map.get("maintenance_mode") as Record<string, unknown> | undefined)?.enabled) ||
      Boolean(map.get("marketplace.maintenance_mode"));

    const maintenanceModeMessage =
      (typeof rawMarketplace.maintenance_mode_message === "string" && rawMarketplace.maintenance_mode_message.trim()) ||
      (typeof (map.get("maintenance_mode") as Record<string, unknown> | undefined)?.message === "string"
        ? String((map.get("maintenance_mode") as Record<string, unknown>).message).trim()
        : "") ||
      "EasyLife is currently undergoing brief scheduled maintenance. Essential systems will resume momentarily.";

    const defaultQuotationExpiryHours =
      typeof rawMarketplace.default_quotation_expiry_hours === "number"
        ? rawMarketplace.default_quotation_expiry_hours
        : typeof map.get("booking_quotation_expiry_hours") === "number"
        ? Number(map.get("booking_quotation_expiry_hours"))
        : 48;

    return {
      platformName,
      platformDescription,
      contactEmail,
      contactPhone,
      websiteUrl,
      businessAddress,
      defaultCurrency,
      defaultCountry,
      supportedCities,
      maintenanceModeEnabled,
      maintenanceModeMessage,
      defaultQuotationExpiryHours,
    };
  } catch {
    return FALLBACK_PUBLIC_SETTINGS;
  }
}
