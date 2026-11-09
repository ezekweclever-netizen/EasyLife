import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { EasyLifeLogo } from "@/components/ui/logo";
import { PUBLIC_FOOTER_LINKS } from "@/lib/public-catalog";

const FOOTER_COLUMNS = [
  { heading: "Platform", links: PUBLIC_FOOTER_LINKS.platform },
  { heading: "Company & Support", links: PUBLIC_FOOTER_LINKS.companyAndSupport },
  { heading: "Legal & Trust", links: PUBLIC_FOOTER_LINKS.legalAndTrust },
  { heading: "Account", links: PUBLIC_FOOTER_LINKS.account },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#0D282E] text-[#DAE7E7]" aria-labelledby="site-footer-heading">
      <h2 id="site-footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <EasyLifeLogo theme="dark" size="md" showSlogan />
            <p className="mt-5 text-sm leading-relaxed text-[#DAE7E7]/80">
              EasyLife helps people and businesses find reliable everyday services
              and manage essential maintenance with less effort — operating across{" "}
              {EASYLIFE_BRAND.pilotCities.map((c) => c.name).join(", ").replace(/, ([^,]*)$/, " and $1")}.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#DAE7E7]/70 hover:text-[#24989A] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-[#DAE7E7]/60">
          <p>
            © {new Date().getFullYear()} {EASYLIFE_BRAND.name}. All rights reserved.
          </p>
          <p>Prices on EasyLife are shown in Nigerian Naira ({EASYLIFE_BRAND.currency.symbol}).</p>
        </div>
      </div>
    </footer>
  );
}
