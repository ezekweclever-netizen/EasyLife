import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { EasyLifeLogo } from "@/components/ui/logo";
import { PUBLIC_FOOTER_LINKS } from "@/lib/public-catalog";
import { getPublicPlatformSettings, type PublicPlatformSettings } from "@/lib/supabase/platform-settings";

const FOOTER_COLUMNS = [
  { heading: "Platform", links: PUBLIC_FOOTER_LINKS.platform },
  { heading: "Company & Support", links: PUBLIC_FOOTER_LINKS.companyAndSupport },
  { heading: "Legal & Trust", links: PUBLIC_FOOTER_LINKS.legalAndTrust },
  { heading: "Account", links: PUBLIC_FOOTER_LINKS.account },
] as const;

export async function SiteFooter({
  settings: initialSettings,
}: {
  settings?: PublicPlatformSettings;
} = {}) {
  const settings = initialSettings || (await getPublicPlatformSettings());
  const pilotCities = ["Port Harcourt", "Lagos", "Abuja"];
  const activeCities = (settings.supportedCities || []).filter((c) => pilotCities.includes(c));
  const citiesList = activeCities.length > 0 ? activeCities : pilotCities;
  const citiesText = citiesList.join(", ").replace(/, ([^,]*)$/, " and $1");
  const displayPhone = settings.contactPhone || "+234 704 994 8582";

  return (
    <footer className="bg-[#15181C] text-[#C3C8CF] border-t border-[#2E343B]" aria-labelledby="site-footer-heading">
      <h2 id="site-footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <EasyLifeLogo theme="dark" size="md" />
            <p className="mt-5 text-base leading-relaxed text-[#C3C8CF]/85">
              {settings.platformDescription || EASYLIFE_BRAND.description} — operating across{" "}
              {citiesText}.
            </p>
            {displayPhone && (
              <p className="mt-3 text-sm text-[#C3C8CF]/70">
                Support:{" "}
                <a
                  href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                  className="text-[#E8590C] hover:underline"
                >
                  {displayPhone}
                </a>
              </p>
            )}
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#FAF7F3]">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-[#C3C8CF]/75 hover:text-[#E8590C] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#2E343B] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-[#C3C8CF]/70 sm:pr-44">
          <p>
            © {new Date().getFullYear()} {settings.platformName || EASYLIFE_BRAND.name}. All rights reserved.
          </p>
          <p className="max-w-md sm:text-right">Prices on {settings.platformName || EASYLIFE_BRAND.name} are shown in {settings.defaultCurrency === "NGN" ? "Nigerian Naira (₦)" : settings.defaultCurrency}.</p>
        </div>
      </div>
    </footer>
  );
}
