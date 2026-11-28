import React from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { getPublicPlatformSettings } from "@/lib/supabase/platform-settings";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";

/** Shared public website frame: skip link, floating sticky header, main landmark, footer, WhatsApp CTA. */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const settings = await getPublicPlatformSettings();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F3] text-[#1F2328] dark:bg-[#15181C] dark:text-[#FAF7F3] transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#E8590C] focus:px-4 focus:py-2 focus:text-base focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Global Maintenance Alert Banner if activated in Platform Settings */}
      {settings.maintenanceModeEnabled && (
        <div
          role="alert"
          className="bg-amber-500 text-slate-950 px-4 py-2.5 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs z-50 sticky top-0"
        >
          <span className="text-base">⚠️</span>
          <span>{settings.maintenanceModeMessage}</span>
        </div>
      )}

      <SiteHeader />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <SiteFooter settings={settings} />

      {/* Floating Direct WhatsApp Support Launcher */}
      <WhatsAppFloatingButton phone={settings.contactPhone.replace(/\D/g, "") || "2347049948582"} />
    </div>
  );
}
