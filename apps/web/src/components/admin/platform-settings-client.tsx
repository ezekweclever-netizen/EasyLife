"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  FinancialPlatformSettings,
  GeneralPlatformSettings,
  MarketplacePlatformSettings,
  NotificationPlatformSettings,
  PlatformSettingsSectionKey,
  RegistrationPlatformSettings,
  SecurityPlatformSettings,
  StructuredPlatformSettingsBundle,
} from "@easylife/shared-types";
import { adminSavePlatformSettingsSectionAction } from "@/app/actions/admin";

interface PlatformSettingsClientProps {
  initialBundle: StructuredPlatformSettingsBundle;
}

const SECTIONS: Array<{
  key: PlatformSettingsSectionKey;
  title: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: "general",
    title: "General Platform Settings",
    shortLabel: "General",
    description: "Brand identity, contact details, regional defaults, and operating cities.",
  },
  {
    key: "registration",
    title: "Registration & Account Settings",
    shortLabel: "Registration",
    description: "Control sign-ups, verification requirements, approvals, and password rules.",
  },
  {
    key: "marketplace",
    title: "Service Marketplace Settings",
    shortLabel: "Marketplace",
    description: "Bookings, quotations, provider applications, catalogue visibility, and maintenance.",
  },
  {
    key: "financial",
    title: "Financial Settings",
    shortLabel: "Financial",
    description: "Platform commission, callout thresholds, currencies, taxes, and payment provider status.",
  },
  {
    key: "notifications",
    title: "Notification Settings",
    shortLabel: "Notifications",
    description: "Email, push, SMS channels and operational notification triggers.",
  },
  {
    key: "security",
    title: "Security Settings",
    shortLabel: "Security",
    description: "Administrative access controls, sessions, login lockout, and audit logging.",
  },
];

const CURRENCY_OPTIONS = [
  { code: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GHS", label: "GHS — Ghanaian Cedi (₵)" },
  { code: "KES", label: "KES — Kenyan Shilling (KSh)" },
];

const TIMEZONE_OPTIONS = [
  { value: "Africa/Lagos", label: "West Africa Time (Africa/Lagos, UTC+1)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "Europe/London", label: "London (Europe/London)" },
  { value: "Africa/Accra", label: "Accra (Africa/Accra, UTC+0)" },
  { value: "Africa/Nairobi", label: "East Africa Time (Africa/Nairobi, UTC+3)" },
];

const COUNTRY_OPTIONS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
];

function SettingSwitchRow({
  id,
  label,
  description,
  checked,
  disabled,
  badge,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="space-y-0.5 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor={id}
            className={`text-sm font-semibold ${
              disabled ? "text-slate-400" : "text-slate-900 dark:text-white cursor-pointer"
            }`}
          >
            {label}
          </label>
          {badge}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
          disabled
            ? "bg-slate-200 cursor-not-allowed opacity-60"
            : checked
            ? "bg-teal-600 cursor-pointer"
            : "bg-slate-300 cursor-pointer"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#1F2328] shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function PlatformSettingsClient({
  initialBundle,
}: PlatformSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<PlatformSettingsSectionKey>("general");

  const [general, setGeneral] = useState<GeneralPlatformSettings>(initialBundle.general);
  const [registration, setRegistration] = useState<RegistrationPlatformSettings>(
    initialBundle.registration
  );
  const [marketplace, setMarketplace] = useState<MarketplacePlatformSettings>(
    initialBundle.marketplace
  );
  const [financial, setFinancial] = useState<FinancialPlatformSettings>(
    initialBundle.financial
  );
  const [notifications, setNotifications] = useState<NotificationPlatformSettings>(
    initialBundle.notifications
  );
  const [security, setSecurity] = useState<SecurityPlatformSettings>(initialBundle.security);

  const [updatedAt, setUpdatedAt] = useState<
    Partial<Record<PlatformSettingsSectionKey, string>>
  >(initialBundle.updatedAt);

  const [dirtySections, setDirtySections] = useState<
    Partial<Record<PlatformSettingsSectionKey, boolean>>
  >({});

  const [newCityInput, setNewCityInput] = useState("");
  const [savingSection, setSavingSection] = useState<PlatformSettingsSectionKey | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const integrations = initialBundle.integrations;

  const markDirty = (section: PlatformSettingsSectionKey) => {
    setDirtySections((prev) => ({ ...prev, [section]: true }));
    setFeedback(null);
  };

  const handleSaveSection = async (
    section: PlatformSettingsSectionKey,
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setSavingSection(section);
    setFeedback(null);

    try {
      let res;
      if (section === "general") {
        res = await adminSavePlatformSettingsSectionAction("general", general);
      } else if (section === "registration") {
        res = await adminSavePlatformSettingsSectionAction("registration", registration);
      } else if (section === "marketplace") {
        res = await adminSavePlatformSettingsSectionAction("marketplace", marketplace);
      } else if (section === "financial") {
        res = await adminSavePlatformSettingsSectionAction("financial", financial);
      } else if (section === "notifications") {
        res = await adminSavePlatformSettingsSectionAction("notifications", notifications);
      } else {
        res = await adminSavePlatformSettingsSectionAction("security", security);
      }

      if (!res.ok) {
        setFeedback({ type: "error", message: res.message });
      } else {
        setFeedback({ type: "success", message: res.message });
        setDirtySections((prev) => ({ ...prev, [section]: false }));
        const ts =
          typeof res.data?.updated_at === "string"
            ? res.data.updated_at
            : new Date().toISOString();
        setUpdatedAt((prev) => ({ ...prev, [section]: ts }));
      }
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected network error occurred while saving settings.",
      });
    } finally {
      setSavingSection(null);
    }
  };

  const addCity = () => {
    const cleaned = newCityInput.trim();
    if (!cleaned) return;
    if (general.supported_cities.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
      setNewCityInput("");
      return;
    }
    setGeneral((prev) => ({
      ...prev,
      supported_cities: [...prev.supported_cities, cleaned],
    }));
    setNewCityInput("");
    markDirty("general");
  };

  const removeCity = (city: string) => {
    if (general.supported_cities.length <= 1) return;
    setGeneral((prev) => ({
      ...prev,
      supported_cities: prev.supported_cities.filter((c) => c !== city),
    }));
    markDirty("general");
  };

  const toggleCurrency = (code: string) => {
    const exists = financial.supported_currencies.includes(code);
    if (exists && financial.supported_currencies.length <= 1) return;
    setFinancial((prev) => ({
      ...prev,
      supported_currencies: exists
        ? prev.supported_currencies.filter((c) => c !== code)
        : [...prev.supported_currencies, code],
    }));
    markDirty("financial");
  };

  const currentSectionMeta = SECTIONS.find((s) => s.key === activeTab)!;
  const lastUpdatedLabel = updatedAt[activeTab]
    ? new Date(updatedAt[activeTab]!).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not yet modified";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Navigation Menu */}
      <aside className="lg:col-span-3 bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs p-2 space-y-1 lg:sticky lg:top-24">
        <div className="px-3 py-2 text-2xs font-extrabold uppercase tracking-wider text-slate-400">
          Settings Sections
        </div>
        {SECTIONS.map((sec) => {
          const isActive = activeTab === sec.key;
          const isDirty = Boolean(dirtySections[sec.key]);
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => {
                setActiveTab(sec.key);
                setFeedback(null);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between gap-2 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <div>
                <div className="text-xs font-bold leading-tight">{sec.shortLabel}</div>
                <div
                  className={`text-2xs mt-0.5 line-clamp-1 ${
                    isActive ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {sec.title}
                </div>
              </div>
              {isDirty && (
                <span
                  title="Unsaved changes"
                  className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                />
              )}
            </button>
          );
        })}
      </aside>

      {/* Main Section Form Panel */}
      <div className="lg:col-span-9 space-y-4">
        {/* Status Toast Notification */}
        {feedback && (
          <div
            role="status"
            className={`rounded-2xl px-4 py-3.5 text-sm font-semibold border flex items-center justify-between gap-3 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => handleSaveSection(activeTab, e)}
          className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B]/80 shadow-xs overflow-hidden"
        >
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#1F2328]/60">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {currentSectionMeta.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentSectionMeta.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Last Saved
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{lastUpdatedLabel}</div>
            </div>
          </div>

          {/* Section Body */}
          <div className="p-6 space-y-6">
            {/* 1. GENERAL PLATFORM SETTINGS */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="platform_name"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Platform Name *
                    </label>
                    <input
                      id="platform_name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={general.platform_name}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, platform_name: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Displayed across the website header, emails, and customer receipts.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="website_url"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Website URL
                    </label>
                    <input
                      id="website_url"
                      type="url"
                      placeholder="https://easylife.ng"
                      value={general.website_url}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, website_url: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary public web address used in links and notifications.
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="platform_description"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Platform Description
                  </label>
                  <textarea
                    id="platform_description"
                    rows={3}
                    maxLength={500}
                    value={general.platform_description}
                    onChange={(e) => {
                      setGeneral((p) => ({ ...p, platform_description: e.target.value }));
                      markDirty("general");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                  />
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                    Short public summary describing EasyLife&apos;s marketplace mission.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="platform_logo_url"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Platform Logo Path or URL
                    </label>
                    <input
                      id="platform_logo_url"
                      type="text"
                      placeholder="/brand/easylife-logo-charcoal-orange.png"
                      value={general.platform_logo_url}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, platform_logo_url: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#E8590C]/30 focus:border-[#E8590C] focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Path to the official brand logo displayed in navigation bars.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="business_address"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Business Address
                    </label>
                    <input
                      id="business_address"
                      type="text"
                      placeholder="Enter registered office address"
                      value={general.business_address}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, business_address: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Shown on official correspondence and legal notices when configured.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact_email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Contact Email
                    </label>
                    <input
                      id="contact_email"
                      type="email"
                      placeholder="support@easylife.ng"
                      value={general.contact_email}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, contact_email: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary customer support and operations email address.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="contact_phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Contact Phone Number
                    </label>
                    <input
                      id="contact_phone"
                      type="tel"
                      placeholder="e.g. +234 800 000 0000"
                      value={general.contact_phone}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, contact_phone: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Official support phone number (leave blank if phone support is not active).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label
                      htmlFor="default_currency"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Default Platform Currency
                    </label>
                    <select
                      id="default_currency"
                      value={general.default_currency}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, default_currency: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1F2328] focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="default_country"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Default Country
                    </label>
                    <select
                      id="default_country"
                      value={general.default_country}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, default_country: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1F2328] focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    >
                      {COUNTRY_OPTIONS.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="default_timezone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Default Timezone
                    </label>
                    <select
                      id="default_timezone"
                      value={general.default_timezone}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, default_timezone: e.target.value }));
                        markDirty("general");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1F2328] focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supported Operating Cities */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Active Operating Cities
                  </label>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mb-3">
                    Cities where EasyLife customers can discover and request services.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {general.supported_cities.map((city) => (
                      <span
                        key={city}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#F06A1F] border border-teal-200 dark:border-teal-800"
                      >
                        {city}
                        {general.supported_cities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCity(city)}
                            className="text-teal-600 hover:text-red-600 font-bold ml-0.5"
                            aria-label={`Remove ${city}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={newCityInput}
                      onChange={(e) => setNewCityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCity();
                        }
                      }}
                      placeholder="Add a city (e.g. Enugu, Ibadan)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addCity}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-bold transition"
                    >
                      Add City
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REGISTRATION & ACCOUNT SETTINGS */}
            {activeTab === "registration" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Account Registration Controls
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                    <SettingSwitchRow
                      id="enable_customer_registration"
                      label="Enable Customer Registration"
                      description="Allow new customers to create EasyLife accounts and submit service requests."
                      checked={registration.enable_customer_registration}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, enable_customer_registration: v }));
                        markDirty("registration");
                      }}
                    />
                    <SettingSwitchRow
                      id="enable_professional_registration"
                      label="Enable Professional Registration"
                      description="Allow technicians, artisans, and independent professionals to register and onboard."
                      checked={registration.enable_professional_registration}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, enable_professional_registration: v }));
                        markDirty("registration");
                      }}
                    />
                    <SettingSwitchRow
                      id="enable_business_registration"
                      label="Enable Business Account Registration"
                      description="Allow commercial facility teams and companies to register business accounts."
                      checked={registration.enable_business_registration}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, enable_business_registration: v }));
                        markDirty("registration");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Verification &amp; Approval Requirements
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                    <SettingSwitchRow
                      id="require_email_verification"
                      label="Require Email Verification"
                      description="New users must confirm their email address before full account activation."
                      checked={registration.require_email_verification}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, require_email_verification: v }));
                        markDirty("registration");
                      }}
                    />
                    <SettingSwitchRow
                      id="require_phone_verification"
                      label="Require Phone Number Verification"
                      description="Require SMS/OTP confirmation of phone numbers during onboarding."
                      checked={registration.require_phone_verification}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, require_phone_verification: v }));
                        markDirty("registration");
                      }}
                    />
                    <SettingSwitchRow
                      id="require_professional_approval"
                      label="Require Administrator Approval for Professionals"
                      description="Service providers must pass KYC and credential review before appearing in customer discovery."
                      checked={registration.require_professional_approval}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, require_professional_approval: v }));
                        markDirty("registration");
                      }}
                    />
                    <SettingSwitchRow
                      id="require_business_approval"
                      label="Require Administrator Approval for Business Accounts"
                      description="Business registrations must be verified by an administrator before directory listing."
                      checked={registration.require_business_approval}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, require_business_approval: v }));
                        markDirty("registration");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Password &amp; Authentication Policies
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 p-4 space-y-4">
                    <div className="max-w-xs">
                      <label
                        htmlFor="min_password_length"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Minimum Password Length
                      </label>
                      <input
                        id="min_password_length"
                        type="number"
                        min={8}
                        max={64}
                        value={registration.min_password_length}
                        onChange={(e) => {
                          setRegistration((p) => ({
                            ...p,
                            min_password_length: Number(e.target.value) || 8,
                          }));
                          markDirty("registration");
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Recommended minimum is 8 to 12 characters.
                      </p>
                    </div>
                    <SettingSwitchRow
                      id="require_strong_password"
                      label="Require Strong Passwords"
                      description="Enforce a mix of uppercase, lowercase, numbers, and special characters on sign-up and password reset."
                      checked={registration.require_strong_password}
                      onChange={(v) => {
                        setRegistration((p) => ({ ...p, require_strong_password: v }));
                        markDirty("registration");
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. SERVICE MARKETPLACE SETTINGS */}
            {activeTab === "marketplace" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                  <SettingSwitchRow
                    id="enable_service_bookings"
                    label="Enable Service Bookings"
                    description="Allow customers to submit new service booking requests across active services. Disabling pauses all new bookings platform-wide."
                    checked={marketplace.enable_service_bookings}
                    onChange={(v) => {
                      setMarketplace((p) => ({ ...p, enable_service_bookings: v }));
                      markDirty("marketplace");
                    }}
                  />
                  <SettingSwitchRow
                    id="enable_quotation_requests"
                    label="Enable Quotation Requests"
                    description="Allow customers to request quotes and professionals to submit itemized quotations."
                    checked={marketplace.enable_quotation_requests}
                    onChange={(v) => {
                      setMarketplace((p) => ({ ...p, enable_quotation_requests: v }));
                      markDirty("marketplace");
                    }}
                  />
                  <SettingSwitchRow
                    id="enable_provider_applications"
                    label="Enable Service Provider Applications"
                    description="Allow professionals to apply to offer services listed in the EasyLife catalogue."
                    checked={marketplace.enable_provider_applications}
                    onChange={(v) => {
                      setMarketplace((p) => ({ ...p, enable_provider_applications: v }));
                      markDirty("marketplace");
                    }}
                  />
                  <SettingSwitchRow
                    id="require_service_approval"
                    label="Require Approval for Provider Service Listings"
                    description="Administrators must verify provider qualifications before activating newly added provider services."
                    checked={marketplace.require_service_approval}
                    onChange={(v) => {
                      setMarketplace((p) => ({ ...p, require_service_approval: v }));
                      markDirty("marketplace");
                    }}
                  />
                  <SettingSwitchRow
                    id="show_paused_services_in_catalogue"
                    label="Show Paused Services in Catalogue Search"
                    description="Display temporarily paused services with a non-bookable notice instead of hiding them from public search."
                    checked={marketplace.show_paused_services_in_catalogue}
                    onChange={(v) => {
                      setMarketplace((p) => ({
                        ...p,
                        show_paused_services_in_catalogue: v,
                      }));
                      markDirty("marketplace");
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="default_quotation_expiry_hours"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Quotation Validity Window (Hours)
                    </label>
                    <input
                      id="default_quotation_expiry_hours"
                      type="number"
                      min={1}
                      max={720}
                      value={marketplace.default_quotation_expiry_hours}
                      onChange={(e) => {
                        setMarketplace((p) => ({
                          ...p,
                          default_quotation_expiry_hours: Number(e.target.value) || 48,
                        }));
                        markDirty("marketplace");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Number of hours before an unaccepted quotation automatically expires.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="dispute_auto_escalate_hours"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Dispute Escalation Threshold (Hours)
                    </label>
                    <input
                      id="dispute_auto_escalate_hours"
                      type="number"
                      min={1}
                      max={720}
                      value={marketplace.dispute_auto_escalate_hours}
                      onChange={(e) => {
                        setMarketplace((p) => ({
                          ...p,
                          dispute_auto_escalate_hours: Number(e.target.value) || 48,
                        }));
                        markDirty("marketplace");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                    />
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                      Hours before an unreviewed customer dispute triggers a supervisor alert.
                    </p>
                  </div>
                </div>

                {/* Maintenance Mode Panel */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60/50 p-4 space-y-3">
                  <SettingSwitchRow
                    id="maintenance_mode_enabled"
                    label="Platform Maintenance Mode"
                    description="Temporarily display a scheduled maintenance notice across the platform."
                    checked={marketplace.maintenance_mode_enabled}
                    onChange={(v) => {
                      setMarketplace((p) => ({ ...p, maintenance_mode_enabled: v }));
                      markDirty("marketplace");
                    }}
                  />
                  {marketplace.maintenance_mode_enabled && (
                    <div>
                      <label
                        htmlFor="maintenance_mode_message"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Maintenance Banner Message
                      </label>
                      <input
                        id="maintenance_mode_message"
                        type="text"
                        placeholder="EasyLife is undergoing scheduled maintenance and will be right back."
                        value={marketplace.maintenance_mode_message}
                        onChange={(e) => {
                          setMarketplace((p) => ({
                            ...p,
                            maintenance_mode_message: e.target.value,
                          }));
                          markDirty("marketplace");
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1F2328] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Links to Catalogue Management */}
                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Service Categories &amp; Service Availability
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage individual service statuses (Active, Paused, Inactive), homepage visibility, and category structure.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/admin/categories"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] hover:bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      Manage Categories
                    </Link>
                    <Link
                      href="/admin/services"
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white transition"
                    >
                      Manage Services
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FINANCIAL SETTINGS */}
            {activeTab === "financial" && (
              <div className="space-y-6">
                {/* Payment Provider Status Card */}
                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 p-4 bg-slate-50 dark:bg-[#1F2328]/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Payment Provider Configuration Status
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Credentials are managed securely on the server and are never displayed in full.
                      </p>
                    </div>
                    {integrations.paystackConfigured ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Credentials Configured ({integrations.paystackKeyHint})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Not Configured
                      </span>
                    )}
                  </div>

                  <SettingSwitchRow
                    id="payment_provider_enabled"
                    label={`Activate Online Payments (${financial.payment_provider_name})`}
                    description={
                      integrations.paystackConfigured
                        ? "Enable live online checkout and payment collection through the configured payment provider."
                        : "Online payment collection cannot be activated until valid payment gateway credentials are configured in your server environment."
                    }
                    checked={financial.payment_provider_enabled}
                    disabled={!integrations.paystackConfigured}
                    onChange={(v) => {
                      setFinancial((p) => ({ ...p, payment_provider_enabled: v }));
                      markDirty("financial");
                    }}
                  />
                </div>

                {/* Commission Settings */}
                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 p-4 space-y-4">
                  <SettingSwitchRow
                    id="commission_enabled"
                    label="Enable Platform Commission"
                    description="Apply a configured platform service commission on completed bookings. Leave off while operating commission-free or configuring rates."
                    checked={financial.commission_enabled}
                    onChange={(v) => {
                      setFinancial((p) => ({ ...p, commission_enabled: v }));
                      markDirty("financial");
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label
                        htmlFor="default_commission_percent"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Default Platform Commission (%)
                      </label>
                      <input
                        id="default_commission_percent"
                        type="number"
                        step="0.5"
                        min={0}
                        max={50}
                        disabled={!financial.commission_enabled}
                        value={financial.default_commission_percent}
                        onChange={(e) => {
                          setFinancial((p) => ({
                            ...p,
                            default_commission_percent: Number(e.target.value) || 0,
                          }));
                          markDirty("financial");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-400 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Set between 0% and 50%. Only applied when commission is enabled.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="minimum_callout_fee_naira"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Minimum Diagnostic / Callout Fee (NGN)
                      </label>
                      <input
                        id="minimum_callout_fee_naira"
                        type="number"
                        step="100"
                        min={0}
                        value={financial.minimum_callout_fee_naira}
                        onChange={(e) => {
                          setFinancial((p) => ({
                            ...p,
                            minimum_callout_fee_naira: Number(e.target.value) || 0,
                          }));
                          markDirty("financial");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Leave at 0 if no platform-wide callout minimum is enforced.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supported Currencies */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Supported Platform Currencies
                  </label>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mb-3">
                    Select currencies permitted for quotations and invoices.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCY_OPTIONS.map((curr) => {
                      const selected = financial.supported_currencies.includes(curr.code);
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => toggleCurrency(curr.code)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            selected
                              ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#F06A1F] border-teal-300 dark:border-teal-700"
                              : "bg-white dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2E343B] hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {curr.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tax Configuration */}
                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 p-4 space-y-4">
                  <SettingSwitchRow
                    id="tax_enabled"
                    label="Enable Tax Calculation"
                    description="Include applicable tax lines (such as VAT) on generated invoices and service receipts."
                    checked={financial.tax_enabled}
                    onChange={(v) => {
                      setFinancial((p) => ({ ...p, tax_enabled: v }));
                      markDirty("financial");
                    }}
                  />
                  {financial.tax_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div>
                        <label
                          htmlFor="tax_label"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                        >
                          Tax Label
                        </label>
                        <input
                          id="tax_label"
                          type="text"
                          maxLength={30}
                          placeholder="VAT"
                          value={financial.tax_label}
                          onChange={(e) => {
                            setFinancial((p) => ({ ...p, tax_label: e.target.value }));
                            markDirty("financial");
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="tax_rate_percent"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                        >
                          Tax Rate (%)
                        </label>
                        <input
                          id="tax_rate_percent"
                          type="number"
                          step="0.25"
                          min={0}
                          max={100}
                          value={financial.tax_rate_percent}
                          onChange={(e) => {
                            setFinancial((p) => ({
                              ...p,
                              tax_rate_percent: Number(e.target.value) || 0,
                            }));
                            markDirty("financial");
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328] p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      City &amp; Category Commission Rules
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure targeted commission rules by city or service category.
                    </p>
                  </div>
                  <Link
                    href="/admin/commissions"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] hover:bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition shrink-0"
                  >
                    Open Commission Rules
                  </Link>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATION SETTINGS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Delivery Channels
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                    <SettingSwitchRow
                      id="email_notifications_enabled"
                      label="Email Notifications"
                      description="Send transactional emails for bookings, quotations, and account alerts."
                      checked={notifications.email_notifications_enabled}
                      badge={
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            integrations.emailProviderConfigured
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {integrations.emailProviderConfigured
                            ? "Provider Active"
                            : "Default Auth Mailer"}
                        </span>
                      }
                      onChange={(v) => {
                        setNotifications((p) => ({ ...p, email_notifications_enabled: v }));
                        markDirty("notifications");
                      }}
                    />
                    <SettingSwitchRow
                      id="push_notifications_enabled"
                      label="Push Notifications"
                      description="Deliver real-time alerts to mobile and web clients."
                      checked={notifications.push_notifications_enabled}
                      badge={
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            integrations.pushProviderConfigured
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {integrations.pushProviderConfigured
                            ? "Push Configured"
                            : "In-App Only"}
                        </span>
                      }
                      onChange={(v) => {
                        setNotifications((p) => ({ ...p, push_notifications_enabled: v }));
                        markDirty("notifications");
                      }}
                    />
                    <SettingSwitchRow
                      id="sms_notifications_enabled"
                      label="SMS Notifications"
                      description="Send SMS alerts for urgent dispatch updates and verification codes."
                      checked={notifications.sms_notifications_enabled}
                      badge={
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            integrations.smsProviderConfigured
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {integrations.smsProviderConfigured
                            ? "SMS Provider Active"
                            : "Gateway Not Configured"}
                        </span>
                      }
                      onChange={(v) => {
                        setNotifications((p) => ({ ...p, sms_notifications_enabled: v }));
                        markDirty("notifications");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Event Triggers
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                    <SettingSwitchRow
                      id="booking_notifications_enabled"
                      label="Booking &amp; Quotation Notifications"
                      description="Notify customers and professionals on new requests, quotes, appointments, and completion updates."
                      checked={notifications.booking_notifications_enabled}
                      onChange={(v) => {
                        setNotifications((p) => ({ ...p, booking_notifications_enabled: v }));
                        markDirty("notifications");
                      }}
                    />
                    <SettingSwitchRow
                      id="account_verification_notifications_enabled"
                      label="Account Verification Notifications"
                      description="Notify professionals and businesses when KYC documents or profiles are approved or need revision."
                      checked={notifications.account_verification_notifications_enabled}
                      onChange={(v) => {
                        setNotifications((p) => ({
                          ...p,
                          account_verification_notifications_enabled: v,
                        }));
                        markDirty("notifications");
                      }}
                    />
                    <SettingSwitchRow
                      id="admin_alert_notifications_enabled"
                      label="Administrative Alert Notifications"
                      description="Send operational alerts to administrators for new disputes, safety reports, and verification queues."
                      checked={notifications.admin_alert_notifications_enabled}
                      onChange={(v) => {
                        setNotifications((p) => ({
                          ...p,
                          admin_alert_notifications_enabled: v,
                        }));
                        markDirty("notifications");
                      }}
                    />
                  </div>
                </div>

                <div className="max-w-md">
                  <label
                    htmlFor="admin_alert_email"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Administrative Alert Recipient Email
                  </label>
                  <input
                    id="admin_alert_email"
                    type="email"
                    placeholder="support@easylife.ng"
                    value={notifications.admin_alert_email}
                    onChange={(e) => {
                      setNotifications((p) => ({ ...p, admin_alert_email: e.target.value }));
                      markDirty("notifications");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                  />
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                    Email address receiving escalated platform alerts and operational notices.
                  </p>
                </div>
              </div>
            )}

            {/* 6. SECURITY SETTINGS */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Administrative Access &amp; Governance
                  </h3>
                  <div className="rounded-xl border border-slate-200 dark:border-[#2E343B]/80 px-4">
                    <SettingSwitchRow
                      id="restrict_admin_registration"
                      label="Restrict Administrator Role Assignment"
                      description="Prevent self-registration as an administrator; admin roles may only be granted by existing platform owners."
                      checked={security.restrict_admin_registration}
                      onChange={(v) => {
                        setSecurity((p) => ({ ...p, restrict_admin_registration: v }));
                        markDirty("security");
                      }}
                    />
                    <SettingSwitchRow
                      id="enforce_admin_mfa"
                      label="Require Multi-Factor Authentication for Administrators"
                      description="Require administrators to enable two-factor verification on their login accounts."
                      checked={security.enforce_admin_mfa}
                      onChange={(v) => {
                        setSecurity((p) => ({ ...p, enforce_admin_mfa: v }));
                        markDirty("security");
                      }}
                    />
                    <SettingSwitchRow
                      id="audit_logging_enabled"
                      label="Immutable Administrative Audit Logging"
                      description="Record all administrative actions, settings changes, and service lifecycle transitions in the tamper-proof audit trail."
                      checked={security.audit_logging_enabled}
                      onChange={(v) => {
                        setSecurity((p) => ({ ...p, audit_logging_enabled: v }));
                        markDirty("security");
                      }}
                    />
                    <SettingSwitchRow
                      id="require_reason_for_suspension"
                      label="Require Written Reason for Account Suspension"
                      description="Administrators must document a clear compliance reason before suspending any customer or provider."
                      checked={security.require_reason_for_suspension}
                      onChange={(v) => {
                        setSecurity((p) => ({ ...p, require_reason_for_suspension: v }));
                        markDirty("security");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Session &amp; Login Security
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label
                        htmlFor="session_timeout_minutes"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Session Timeout (Minutes)
                      </label>
                      <input
                        id="session_timeout_minutes"
                        type="number"
                        min={15}
                        max={1440}
                        value={security.session_timeout_minutes}
                        onChange={(e) => {
                          setSecurity((p) => ({
                            ...p,
                            session_timeout_minutes: Number(e.target.value) || 60,
                          }));
                          markDirty("security");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Idle session timeout window (15 – 1,440 mins).
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="max_login_attempts"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Max Failed Login Attempts
                      </label>
                      <input
                        id="max_login_attempts"
                        type="number"
                        min={3}
                        max={20}
                        value={security.max_login_attempts}
                        onChange={(e) => {
                          setSecurity((p) => ({
                            ...p,
                            max_login_attempts: Number(e.target.value) || 5,
                          }));
                          markDirty("security");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Consecutive failures before temporary lockout.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="lockout_duration_minutes"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Lockout Duration (Minutes)
                      </label>
                      <input
                        id="lockout_duration_minutes"
                        type="number"
                        min={1}
                        max={1440}
                        value={security.lockout_duration_minutes}
                        onChange={(e) => {
                          setSecurity((p) => ({
                            ...p,
                            lockout_duration_minutes: Number(e.target.value) || 15,
                          }));
                          markDirty("security");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                      />
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        Cooldown period after repeated failed sign-ins.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Roles, Permissions &amp; Security Audit Trail
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review user access permissions and inspect immutable administrative logs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/admin/users"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] hover:bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                      Manage User Roles
                    </Link>
                    <Link
                      href="/admin/audit-logs"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition"
                    >
                      View Audit Logs
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Footer Save Bar */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#1F2328] border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {dirtySections[activeTab] ? (
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  You have unsaved changes in {currentSectionMeta.shortLabel}.
                </span>
              ) : (
                <span>All changes in this section are saved.</span>
              )}
            </div>
            <button
              type="submit"
              disabled={savingSection === activeTab}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-60 self-start sm:self-auto"
            >
              {savingSection === activeTab
                ? "Saving Changes..."
                : `Save ${currentSectionMeta.shortLabel} Settings`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
