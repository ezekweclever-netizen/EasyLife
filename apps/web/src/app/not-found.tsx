import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";

export default function NotFoundPage() {
  return (
    <PublicShell>
      <section className="bg-[#FCEBDD] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E6E0D8]">
        <div className="max-w-xl mx-auto rounded-3xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] p-8 sm:p-10 text-center space-y-5 shadow-xs">
          <span className="inline-flex items-center rounded-full bg-[#FCEBDD] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#E8590C]">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2328] tracking-tight">
            We couldn&apos;t find that EasyLife page
          </h1>
          <p className="text-sm sm:text-base text-[#4A525C] leading-relaxed">
            The link may have moved, expired, or the service URL may have changed. Explore our active marketplace catalogue or return home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/services"
              className="rounded-xl bg-[#E8590C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C84A06] transition-colors"
            >
              Browse Full Service Catalogue
            </Link>
            <Link
              href="/explore-services"
              className="rounded-xl border border-[#E6E0D8] px-5 py-2.5 text-sm font-semibold text-[#1F2328] hover:bg-[#FAF7F3] transition-colors"
            >
              Explore Specialists
            </Link>
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4A525C] hover:text-[#1F2328]"
            >
              Home
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
