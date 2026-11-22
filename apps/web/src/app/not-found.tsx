import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";

export default function NotFoundPage() {
  return (
    <PublicShell>
      <section className="bg-[#EEF6F7] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#DAE7E7]">
        <div className="max-w-xl mx-auto rounded-3xl bg-white dark:bg-[#0D223A] border border-[#DAE7E7] p-8 sm:p-10 text-center space-y-5 shadow-xs">
          <span className="inline-flex items-center rounded-full bg-[#EEF6F7] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#24989A]">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#154752] tracking-tight">
            We couldn&apos;t find that EasyLife page
          </h1>
          <p className="text-sm sm:text-base text-[#4E6065] leading-relaxed">
            The link may have moved, expired, or the service URL may have changed. Explore our active marketplace catalogue or return home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/services"
              className="rounded-xl bg-[#24989A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D7E80] transition-colors"
            >
              Browse Full Service Catalogue
            </Link>
            <Link
              href="/explore-services"
              className="rounded-xl border border-[#DAE7E7] px-5 py-2.5 text-sm font-semibold text-[#154752] hover:bg-[#F8FAFC] transition-colors"
            >
              Explore Specialists
            </Link>
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4E6065] hover:text-[#154752]"
            >
              Home
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
