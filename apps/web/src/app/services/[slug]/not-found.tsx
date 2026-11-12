import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { ServiceSearchForm } from "@/components/site/service-search-form";

export default function ServiceNotFound() {
  return (
    <PublicShell>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="inline-flex items-center rounded-full bg-[#EEF6F7] border border-[#DAE7E7] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#154752]">
          Service Unavailable or Not Found
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#154752]">
          We couldn&rsquo;t find that specific service
        </h1>
        <p className="text-base text-[#4E6065] max-w-xl mx-auto">
          The requested service may have been renamed, deactivated, or typed with an outdated link. Search our live catalogue below or request a custom job.
        </p>

        <div className="max-w-xl mx-auto">
          <ServiceSearchForm id="service-not-found-search" tone="light" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/services"
            className="rounded-xl bg-[#154752] px-5 py-3 text-sm font-bold text-white hover:bg-[#0D282E]"
          >
            Browse Full Service Catalogue
          </Link>
          <Link
            href="/explore-services"
            className="rounded-xl border border-[#DAE7E7] bg-white px-5 py-3 text-sm font-semibold text-[#154752] hover:bg-[#F3F8F8]"
          >
            Explore Verified Specialists
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
