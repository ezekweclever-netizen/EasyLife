import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPropertyServiceAgents } from "@/lib/supabase/directories";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Property & Estate Services — Port Harcourt, Lagos & Abuja | EasyLife Nigeria",
  description:
    "Hire verified property management professionals, letting advisors, and real estate consultants across Port Harcourt, Lagos, and Abuja.",
};

export default async function PropertyServicesPage() {
  const agents = await getPropertyServiceAgents("All Cities");

  return (
    <PublicShell>
      <PageHero
        badge="Accommodation &amp; Property Services"
        title="Verified Estate Agents &amp; Property Consultants"
        description="Connect with professional letting agents, facility managers, and real estate advisors for rental assistance, property sourcing, and tenancy consultancy."
      />

      {/* STRICT PLATFORM POLICY BANNER */}
      <section className="bg-slate-900 border-y border-slate-800 py-4 px-4 sm:px-6 text-white">
        <div className="max-w-7xl mx-auto flex items-start gap-3 text-xs leading-relaxed">
          <span className="text-base text-amber-400">🛡️</span>
          <div>
            <strong className="text-amber-300 font-bold">Platform Property Policy &amp; Anti-Listing Notice:</strong>{" "}
            EasyLife is strictly a professional services directory. In compliance with platform standards and consumer trust protections, <strong>EasyLife does NOT host property listings, houses for rent/sale, or land advertisements.</strong> Agents on this platform register as vetted service professionals to provide bespoke property management, rental search assistance, tenancy agreement preparation, and real estate advisory services.
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Services Showcase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 space-y-2 shadow-xs">
            <div className="text-2xl">🔍</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Property Sourcing</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Engage an agent to inspect and locate vetted residential or commercial spaces matching your budget and requirements.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 space-y-2 shadow-xs">
            <div className="text-2xl">🤝</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Rental Assistance</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Tenancy negotiation, landlord liaison, move-in handover condition reports, and inventory documentation.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 space-y-2 shadow-xs">
            <div className="text-2xl">🏢</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Property Management</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Day-to-day facility oversight, service charge collection, tenant relations, and preventive maintenance coordination.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 space-y-2 shadow-xs">
            <div className="text-2xl">📜</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Real Estate Consultancy</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Title document verification guidance, deed preparation advisory, land registry checks, and investment appraisal.
            </p>
          </div>
        </div>

        {/* Directory of Agents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Verified Property Consultants Across Port Harcourt, Lagos &amp; Abuja
            </h2>
            <Link
              href="/pro/register?type=agent"
              className="text-xs text-[#E8590C] hover:underline font-bold"
            >
              Are you an estate agent or consultant? Register here →
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-10 text-center space-y-3">
              <div className="text-3xl">🏠</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Property Agents Currently Onboarding
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                No individual agent profiles are currently listed in this specific view. You can submit an everyday task or service inquiry, and a verified property professional will respond with a quotation.
              </p>
              <Link
                href="/book?cat=everyday-tasks&trade=property-sourcing"
                className="inline-block px-5 py-2.5 bg-[#E8590C] hover:bg-[#C84A06] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Request Rental or Property Assistance
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((ag) => (
                <div
                  key={ag.professional_id}
                  className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Property Consultant
                      </span>
                      {ag.is_verified && (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                          ✓ Verified Agent
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ag.business_name}
                    </h4>

                    {ag.headline && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ag.headline}
                      </p>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p>📍 {ag.primary_city}, {ag.primary_state}</p>
                      <p>⏳ {ag.years_of_experience} years professional experience</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Consultation: ₦{(ag.base_callout_fee_kobo / 100).toLocaleString()}
                    </span>
                    <Link
                      href={`/professionals/${ag.professional_id}`}
                      className="px-3 py-1.5 bg-[#1F2328] hover:bg-[#2E343B] text-white rounded-lg text-xs font-bold transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
