import type {
  FinancialPlatformSettings,
  GeneralPlatformSettings,
  MarketplacePlatformSettings,
  NotificationPlatformSettings,
  PlatformIntegrationHealth,
  PlatformSettingsSectionKey,
  RegistrationPlatformSettings,
  SecurityPlatformSettings,
  StructuredPlatformSettingsBundle,
} from "@easylife/shared-types";

export const DEFAULT_GENERAL_SETTINGS: GeneralPlatformSettings = {
  platform_name: "EasyLife",
  platform_description:
    "Trusted home, facility, and business service marketplace connecting verified professionals with customers across Nigeria.",
  platform_logo_url: "/brand/easylife-logo-charcoal-orange.png",
  contact_email: "support@easylife.ng",
  contact_phone: "",
  website_url: "https://easylife.ng",
  business_address: "",
  default_currency: "NGN",
  default_country: "Nigeria",
  default_timezone: "Africa/Lagos",
  supported_cities: ["Port Harcourt", "Lagos", "Abuja"],
};

export const DEFAULT_REGISTRATION_SETTINGS: RegistrationPlatformSettings = {
  enable_customer_registration: true,
  enable_professional_registration: true,
  enable_business_registration: true,
  require_email_verification: true,
  require_phone_verification: false,
  require_professional_approval: true,
  require_business_approval: true,
  min_password_length: 8,
  require_strong_password: true,
};

export const DEFAULT_MARKETPLACE_SETTINGS: MarketplacePlatformSettings = {
  enable_service_bookings: true,
  enable_quotation_requests: true,
  enable_provider_applications: true,
  require_service_approval: true,
  show_paused_services_in_catalogue: false,
  default_quotation_expiry_hours: 48,
  dispute_auto_escalate_hours: 48,
  maintenance_mode_enabled: false,
  maintenance_mode_message: "",
};

export const DEFAULT_FINANCIAL_SETTINGS: FinancialPlatformSettings = {
  commission_enabled: false,
  default_commission_percent: 0,
  minimum_callout_fee_naira: 0,
  supported_currencies: ["NGN"],
  tax_enabled: false,
  tax_rate_percent: 0,
  tax_label: "VAT",
  payment_provider_enabled: false,
  payment_provider_name: "Paystack",
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationPlatformSettings = {
  email_notifications_enabled: true,
  push_notifications_enabled: true,
  sms_notifications_enabled: false,
  booking_notifications_enabled: true,
  account_verification_notifications_enabled: true,
  admin_alert_notifications_enabled: true,
  admin_alert_email: "support@easylife.ng",
};

export const DEFAULT_SECURITY_SETTINGS: SecurityPlatformSettings = {
  enforce_admin_mfa: false,
  session_timeout_minutes: 60,
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
  audit_logging_enabled: true,
  require_reason_for_suspension: true,
  restrict_admin_registration: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : fallback;
}

export function detectIntegrationHealthServer(): PlatformIntegrationHealth {
  const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  const paystackPublic = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "").trim();
  const paystackConfigured = Boolean(paystackSecret && paystackPublic);

  let paystackKeyHint: string | null = null;
  if (paystackSecret) {
    const prefix = paystackSecret.slice(0, 7);
    paystackKeyHint = `${prefix}••••••••`;
  }

  const emailProviderConfigured = Boolean(
    process.env.RESEND_API_KEY ||
      process.env.SMTP_HOST ||
      process.env.SENDGRID_API_KEY
  );
  const pushProviderConfigured = Boolean(
    process.env.FCM_SERVER_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
  const smsProviderConfigured = Boolean(
    process.env.TERMII_API_KEY || process.env.TWILIO_ACCOUNT_SID
  );

  return {
    paystackConfigured,
    paystackKeyHint,
    emailProviderConfigured,
    pushProviderConfigured,
    smsProviderConfigured,
  };
}

export function buildStructuredPlatformSettings(
  rows: Array<{ key: string; value: unknown; updated_at?: string }>
): StructuredPlatformSettingsBundle {
  const map = new Map<string, { value: unknown; updated_at?: string }>();
  for (const row of rows) {
    if (row && typeof row.key === "string") {
      map.set(row.key, { value: row.value, updated_at: row.updated_at });
    }
  }

  const rawGeneral = isRecord(map.get("settings.general")?.value)
    ? (map.get("settings.general")!.value as Record<string, unknown>)
    : {};
  const rawReg = isRecord(map.get("settings.registration")?.value)
    ? (map.get("settings.registration")!.value as Record<string, unknown>)
    : {};
  const rawMkt = isRecord(map.get("settings.marketplace")?.value)
    ? (map.get("settings.marketplace")!.value as Record<string, unknown>)
    : {};
  const rawFin = isRecord(map.get("settings.financial")?.value)
    ? (map.get("settings.financial")!.value as Record<string, unknown>)
    : {};
  const rawNotif = isRecord(map.get("settings.notifications")?.value)
    ? (map.get("settings.notifications")!.value as Record<string, unknown>)
    : {};
  const rawSec = isRecord(map.get("settings.security")?.value)
    ? (map.get("settings.security")!.value as Record<string, unknown>)
    : {};

  const integrations = detectIntegrationHealthServer();

  const general: GeneralPlatformSettings = {
    platform_name: asString(rawGeneral.platform_name, DEFAULT_GENERAL_SETTINGS.platform_name),
    platform_description: asString(
      rawGeneral.platform_description,
      DEFAULT_GENERAL_SETTINGS.platform_description
    ),
    platform_logo_url: asString(
      rawGeneral.platform_logo_url,
      DEFAULT_GENERAL_SETTINGS.platform_logo_url
    ),
    contact_email: asString(rawGeneral.contact_email, DEFAULT_GENERAL_SETTINGS.contact_email),
    contact_phone: asString(rawGeneral.contact_phone, DEFAULT_GENERAL_SETTINGS.contact_phone),
    website_url: asString(rawGeneral.website_url, DEFAULT_GENERAL_SETTINGS.website_url),
    business_address: asString(
      rawGeneral.business_address,
      DEFAULT_GENERAL_SETTINGS.business_address
    ),
    default_currency: asString(
      rawGeneral.default_currency,
      DEFAULT_GENERAL_SETTINGS.default_currency
    ),
    default_country: asString(
      rawGeneral.default_country,
      DEFAULT_GENERAL_SETTINGS.default_country
    ),
    default_timezone: asString(
      rawGeneral.default_timezone,
      DEFAULT_GENERAL_SETTINGS.default_timezone
    ),
    supported_cities: asStringArray(
      rawGeneral.supported_cities,
      DEFAULT_GENERAL_SETTINGS.supported_cities
    ),
  };

  const registration: RegistrationPlatformSettings = {
    enable_customer_registration: asBool(
      rawReg.enable_customer_registration,
      DEFAULT_REGISTRATION_SETTINGS.enable_customer_registration
    ),
    enable_professional_registration: asBool(
      rawReg.enable_professional_registration,
      DEFAULT_REGISTRATION_SETTINGS.enable_professional_registration
    ),
    enable_business_registration: asBool(
      rawReg.enable_business_registration,
      DEFAULT_REGISTRATION_SETTINGS.enable_business_registration
    ),
    require_email_verification: asBool(
      rawReg.require_email_verification,
      DEFAULT_REGISTRATION_SETTINGS.require_email_verification
    ),
    require_phone_verification: asBool(
      rawReg.require_phone_verification,
      DEFAULT_REGISTRATION_SETTINGS.require_phone_verification
    ),
    require_professional_approval: asBool(
      rawReg.require_professional_approval,
      DEFAULT_REGISTRATION_SETTINGS.require_professional_approval
    ),
    require_business_approval: asBool(
      rawReg.require_business_approval,
      DEFAULT_REGISTRATION_SETTINGS.require_business_approval
    ),
    min_password_length: asNumber(
      rawReg.min_password_length,
      DEFAULT_REGISTRATION_SETTINGS.min_password_length
    ),
    require_strong_password: asBool(
      rawReg.require_strong_password,
      DEFAULT_REGISTRATION_SETTINGS.require_strong_password
    ),
  };

  const marketplace: MarketplacePlatformSettings = {
    enable_service_bookings: asBool(
      rawMkt.enable_service_bookings,
      DEFAULT_MARKETPLACE_SETTINGS.enable_service_bookings
    ),
    enable_quotation_requests: asBool(
      rawMkt.enable_quotation_requests,
      DEFAULT_MARKETPLACE_SETTINGS.enable_quotation_requests
    ),
    enable_provider_applications: asBool(
      rawMkt.enable_provider_applications,
      DEFAULT_MARKETPLACE_SETTINGS.enable_provider_applications
    ),
    require_service_approval: asBool(
      rawMkt.require_service_approval,
      DEFAULT_MARKETPLACE_SETTINGS.require_service_approval
    ),
    show_paused_services_in_catalogue: asBool(
      rawMkt.show_paused_services_in_catalogue,
      DEFAULT_MARKETPLACE_SETTINGS.show_paused_services_in_catalogue
    ),
    default_quotation_expiry_hours: asNumber(
      rawMkt.default_quotation_expiry_hours,
      DEFAULT_MARKETPLACE_SETTINGS.default_quotation_expiry_hours
    ),
    dispute_auto_escalate_hours: asNumber(
      rawMkt.dispute_auto_escalate_hours,
      DEFAULT_MARKETPLACE_SETTINGS.dispute_auto_escalate_hours
    ),
    maintenance_mode_enabled: asBool(
      rawMkt.maintenance_mode_enabled,
      DEFAULT_MARKETPLACE_SETTINGS.maintenance_mode_enabled
    ),
    maintenance_mode_message: asString(
      rawMkt.maintenance_mode_message,
      DEFAULT_MARKETPLACE_SETTINGS.maintenance_mode_message
    ),
  };

  const financial: FinancialPlatformSettings = {
    commission_enabled: asBool(
      rawFin.commission_enabled,
      DEFAULT_FINANCIAL_SETTINGS.commission_enabled
    ),
    default_commission_percent: asNumber(
      rawFin.default_commission_percent,
      DEFAULT_FINANCIAL_SETTINGS.default_commission_percent
    ),
    minimum_callout_fee_naira: asNumber(
      rawFin.minimum_callout_fee_naira,
      DEFAULT_FINANCIAL_SETTINGS.minimum_callout_fee_naira
    ),
    supported_currencies: asStringArray(
      rawFin.supported_currencies,
      DEFAULT_FINANCIAL_SETTINGS.supported_currencies
    ),
    tax_enabled: asBool(rawFin.tax_enabled, DEFAULT_FINANCIAL_SETTINGS.tax_enabled),
    tax_rate_percent: asNumber(
      rawFin.tax_rate_percent,
      DEFAULT_FINANCIAL_SETTINGS.tax_rate_percent
    ),
    tax_label: asString(rawFin.tax_label, DEFAULT_FINANCIAL_SETTINGS.tax_label),
    payment_provider_enabled:
      integrations.paystackConfigured &&
      asBool(rawFin.payment_provider_enabled, DEFAULT_FINANCIAL_SETTINGS.payment_provider_enabled),
    payment_provider_name: asString(
      rawFin.payment_provider_name,
      DEFAULT_FINANCIAL_SETTINGS.payment_provider_name
    ),
  };

  const notifications: NotificationPlatformSettings = {
    email_notifications_enabled: asBool(
      rawNotif.email_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.email_notifications_enabled
    ),
    push_notifications_enabled: asBool(
      rawNotif.push_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.push_notifications_enabled
    ),
    sms_notifications_enabled: asBool(
      rawNotif.sms_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.sms_notifications_enabled
    ),
    booking_notifications_enabled: asBool(
      rawNotif.booking_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.booking_notifications_enabled
    ),
    account_verification_notifications_enabled: asBool(
      rawNotif.account_verification_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.account_verification_notifications_enabled
    ),
    admin_alert_notifications_enabled: asBool(
      rawNotif.admin_alert_notifications_enabled,
      DEFAULT_NOTIFICATION_SETTINGS.admin_alert_notifications_enabled
    ),
    admin_alert_email: asString(
      rawNotif.admin_alert_email,
      DEFAULT_NOTIFICATION_SETTINGS.admin_alert_email
    ),
  };

  const security: SecurityPlatformSettings = {
    enforce_admin_mfa: asBool(
      rawSec.enforce_admin_mfa,
      DEFAULT_SECURITY_SETTINGS.enforce_admin_mfa
    ),
    session_timeout_minutes: asNumber(
      rawSec.session_timeout_minutes,
      DEFAULT_SECURITY_SETTINGS.session_timeout_minutes
    ),
    max_login_attempts: asNumber(
      rawSec.max_login_attempts,
      DEFAULT_SECURITY_SETTINGS.max_login_attempts
    ),
    lockout_duration_minutes: asNumber(
      rawSec.lockout_duration_minutes,
      DEFAULT_SECURITY_SETTINGS.lockout_duration_minutes
    ),
    audit_logging_enabled: asBool(
      rawSec.audit_logging_enabled,
      DEFAULT_SECURITY_SETTINGS.audit_logging_enabled
    ),
    require_reason_for_suspension: asBool(
      rawSec.require_reason_for_suspension,
      DEFAULT_SECURITY_SETTINGS.require_reason_for_suspension
    ),
    restrict_admin_registration: asBool(
      rawSec.restrict_admin_registration,
      DEFAULT_SECURITY_SETTINGS.restrict_admin_registration
    ),
  };

  const updatedAt: Partial<Record<PlatformSettingsSectionKey, string>> = {
    general: map.get("settings.general")?.updated_at,
    registration: map.get("settings.registration")?.updated_at,
    marketplace: map.get("settings.marketplace")?.updated_at,
    financial: map.get("settings.financial")?.updated_at,
    notifications: map.get("settings.notifications")?.updated_at,
    security: map.get("settings.security")?.updated_at,
  };

  return {
    general,
    registration,
    marketplace,
    financial,
    notifications,
    security,
    updatedAt,
    integrations,
  };
}

export const PLATFORM_SETTING_SECTION_META: Record<
  PlatformSettingsSectionKey,
  { dbKey: string; description: string; isPublic: boolean; label: string }
> = {
  general: {
    dbKey: "settings.general",
    description:
      "General platform identity, contact details, currency, country, and timezone settings.",
    isPublic: true,
    label: "General Platform Settings",
  },
  registration: {
    dbKey: "settings.registration",
    description:
      "Customer, professional, and business registration, verification, approval, and password policies.",
    isPublic: false,
    label: "Registration & Account Settings",
  },
  marketplace: {
    dbKey: "settings.marketplace",
    description:
      "Service marketplace operational switches, quotation windows, and visibility controls.",
    isPublic: true,
    label: "Service Marketplace Settings",
  },
  financial: {
    dbKey: "settings.financial",
    description:
      "Commission structure, transaction controls, supported currencies, tax, and payment gateway settings.",
    isPublic: false,
    label: "Financial Settings",
  },
  notifications: {
    dbKey: "settings.notifications",
    description:
      "Email, push, SMS, booking, verification, and administrative notification toggles.",
    isPublic: false,
    label: "Notification Settings",
  },
  security: {
    dbKey: "settings.security",
    description:
      "Administrative access controls, session policies, login protection, and audit logging settings.",
    isPublic: false,
    label: "Security Settings",
  },
};
