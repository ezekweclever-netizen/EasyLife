import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDispatchRiders } from "@/lib/supabase/directories";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Delivery & Dispatch Services — Port Harcourt, Lagos & Abuja | EasyLife Nigeria",
  description:
    "Hire verified motorcycle dispatch riders and courier services for express same-day parcel delivery across Port Harcourt, Lagos, and Abuja.",
};

export default async function DispatchDirectoryPage() {
  const riders = await getDispatchRiders("All Cities");

  return (
    <PublicShell>
      <PageHero
        badge="Everyday Logistics &amp; Courier"
        title="Verified Dispatch Riders &amp; Express Delivery"
        description="Connect with vetted dispatch riders and transport couriers for same-day package pickup, errands, and secure doorstep delivery across Port Harcourt, Lagos, and Abuja."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner with Direct Request CTA */}
        <div className="bg-gradient-to-r from-[#1F2328] to-[#2E353D] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold">
              Need a Parcel Picked Up or Delivered Immediately?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
              Submit your pickup and drop-off locations, specify delivery instructions, and receive instant quotations from vetted local dispatch riders.
            </p>
          </div>
          <Link
            href="/book?cat=everyday-tasks&trade=dispatch"
            className="px-6 py-3 rounded-xl bg-white dark:bg-[#1F2328] text-[#1F2328] hover:bg-slate-100 dark:bg-slate-800 font-bold text-xs sm:text-sm transition shadow-md whitespace-nowrap"
          >
            Request a Dispatch Rider →
          </Link>
        </div>

        {/* Delivery Options Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 text-center space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Same-Day Express</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Urgent documents, parcels, and items delivered within 60–120 minutes across town.
            </p>
          </div>
          <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 text-center space-y-2">
            <div className="text-2xl">📦</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Scheduled Package Pickup</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Bulk e-commerce order pickups, marketplace item collection, and regular runs.
            </p>
          </div>
          <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 text-center space-y-2">
            <div className="text-2xl">🛡️</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Vetted &amp; Tracked</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Every rider submits verifiable NIN and bike credentials. Direct communication and phone verification.
            </p>
          </div>
        </div>

        {/* Vehicle Options Showcase */}
        <div className="bg-slate-50 dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supported Delivery Fleet &amp; Vehicle Options</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose the right vehicle capacity for your cargo or errand.</p>
            </div>
            <Link
              href="/book?cat=everyday-tasks&trade=dispatch"
              className="text-xs font-bold text-[#E8590C] hover:underline"
            >
              Book On-Demand Delivery →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">🛵 Express Motorcycle Dispatch</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Ideal for documents, food, parcels, pharmaceuticals, and small items up to 15kg.</p>
              <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Fastest in Traffic</span>
            </div>
            <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">🚗 Minivan &amp; Car Delivery</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Weather-protected transport for fragile gifts, bulk carton orders, cakes, and tech equipment up to 100kg.</p>
              <span className="inline-block text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">Weather-Protected</span>
            </div>
            <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] p-4 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">🚚 Cargo Haulage &amp; Moving</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Commercial light truck and haulage for moving home appliances, building materials, and bulk inventory.</p>
              <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Heavy Cargo</span>
            </div>
          </div>
        </div>

        {/* Riders Roster / Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Available Dispatch Professionals in Port Harcourt
            </h2>
            <Link
              href="/pro/register?type=dispatch"
              className="text-xs text-[#E8590C] hover:underline font-bold"
            >
              Are you a dispatch rider? Join EasyLife →
            </Link>
          </div>

          {riders.length === 0 ? (
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-10 text-center space-y-3">
              <div className="text-3xl">🏍️</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dispatch Riders Onboarding in Port Harcourt
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                No individual rider profiles are currently listed for instant direct call in this view. You can still submit a delivery request and our available network riders will quote your request immediately.
              </p>
              <Link
                href="/book?cat=everyday-tasks&trade=dispatch"
                className="inline-block px-5 py-2.5 bg-[#E8590C] hover:bg-[#E8590C] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Submit Delivery Request
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map((r) => (
                <div
                  key={r.professional_id}
                  className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-5 space-y-3 shadow-xs hover:border-[#E8590C]/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {r.business_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {r.headline || "Motorcycle Courier & Dispatch"}
                      </p>
                    </div>
                    {r.is_verified && (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>📍 {r.primary_city}, {r.primary_state}</p>
                    <p>★ {Number(r.average_rating).toFixed(1)} ({r.review_count} reviews) • {r.completed_jobs_count} trips</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      From ₦{(r.base_callout_fee_kobo / 100).toLocaleString()}/trip
                    </span>
                    <Link
                      href={`/book?cat=everyday-tasks&trade=dispatch&pro=${r.professional_id}`}
                      className="px-3 py-1.5 bg-[#E8590C] text-white rounded-lg text-xs font-bold hover:bg-[#E8590C]"
                    >
                      Book Delivery
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
