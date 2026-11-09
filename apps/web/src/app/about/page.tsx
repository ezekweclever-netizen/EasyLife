import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureCard,
  CheckList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About EasyLife — Everyday Problems. Smarter Solutions.",
  description:
    "Learn about EasyLife: Nigeria's AI-enabled everyday services marketplace and facility maintenance management platform founded to bring trust, safety, and escrow accountability.",
};

export default function AboutPage() {
  const coreValues = [
    {
      icon: "file-text" as const,
      title: "Radical Transparency",
      description:
        "No hidden charges, mysterious markups, or vague artisan estimates. Every quotation itemises replacement parts and technician labour before work starts.",
    },
    {
      icon: "shield" as const,
      title: "Safety Through Verification",
      description:
        "Every service provider must pass multi-stage vetting: national ID validation, residential and workshop verification, trade credentials, and credible guarantors.",
    },
    {
      icon: "lock" as const,
      title: "Escrow Financial Protection",
      description:
        "We eliminate the age-old risk of upfront abandonment and non-payment. Customer funds are held securely until the work is inspected and approved.",
    },
    {
      icon: "users" as const,
      title: "Dignity for Skilled Artisans",
      description:
        "Great technicians deserve steady, respectful work and guaranteed prompt payouts. We empower skilled tradespeople to build sustainable careers.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Our Mission &amp; Purpose"
        title="Everyday Problems. Smarter Solutions."
        description="EasyLife was built to bring structure, safety, and accountability to everyday home services and facility maintenance across Nigeria."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/explore-services" size="lg">
            Explore Services
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="outline-inverse">
            Contact Our Team
          </ButtonLink>
        </div>
      </PageHero>

      {/* The Context & Problem */}
      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              id="the-challenge"
              eyebrow="The Nigerian Context"
              title="Solving the Urban Maintenance Paradox"
              description="Across Nigeria's vibrant urban centres, households and business owners face constant friction with essential services."
            />
            <div className="mt-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                From sudden generator failures during power grid outages to leaking borehole pumps, failing air conditioners in intense heat, and unreliable electrical wiring — finding a skilled, honest, and punctual technician has historically been an exercise in frustration.
              </p>
              <p>
                At the same time, skilled Nigerian artisans face their own persistent hurdles: inconsistent work, unfair client bargaining, and frequent payment delays after delivering quality craftsmanship.
              </p>
              <p className="font-semibold text-[#0F172A]">
                EasyLife bridges this trust deficit. We connect households and businesses with thoroughly vetted trade professionals through an escrow-backed platform where both parties are completely protected.
              </p>
            </div>
          </div>

          <div className="bg-[#0A192F] text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
            <h3 className="text-xl font-bold text-teal-300">
              {EASYLIFE_BRAND.name} at a Glance
            </h3>
            <div className="mt-6 space-y-4 text-xs text-slate-300">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-slate-400 block mb-1">Official Identity</span>
                <span className="text-white font-semibold text-sm">
                  {EASYLIFE_BRAND.name} &bull; {EASYLIFE_BRAND.slogan}
                </span>
              </div>
              <div className="pb-3 border-b border-slate-800">
                <span className="text-slate-400 block mb-1">Active Pilot Markets</span>
                <span className="text-white font-semibold text-sm">
                  Port Harcourt (Rivers State) • Lagos State • Abuja (FCT)
                </span>
              </div>
              <div className="pb-3 border-b border-slate-800">
                <span className="text-slate-400 block mb-1">Primary Audiences</span>
                <span className="text-white font-semibold text-sm">
                  Households • Trade Professionals • SMEs • Property Managers
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Foundational Model</span>
                <span className="text-white font-semibold text-sm">
                  Multi-Tier Vetting + Escrow Payment Protection + Preventive Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Core Values */}
      <Section tone="grey">
        <SectionHeading
          id="values-heading"
          eyebrow="Our Commitments"
          title="The Principles That Guide EasyLife"
          description="How our platform operates daily to maintain trust, security, and exceptional service quality."
          align="center"
        />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((v) => (
            <FeatureCard
              key={v.title}
              icon={v.icon}
              title={v.title}
              description={v.description}
            />
          ))}
        </div>
      </Section>

      {/* Our Operating Footprint */}
      <Section tone="white">
        <SectionHeading
          id="pilot-cities"
          eyebrow="Strategic Deployment"
          title="Focused Local Operations in Three Pilot Hubs"
          description="We believe in deep local presence rather than distant algorithmic promises. Our field teams operate actively on the ground."
        />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Pilot City 1
            </span>
            <h3 className="text-lg font-bold text-[#0F172A] mt-1">
              Port Harcourt, Rivers State
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Serving the oil and gas commercial hub, industrial corridors, and residential estates from Old GRA to Peter Odili and Woji.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Pilot City 2
            </span>
            <h3 className="text-lg font-bold text-[#0F172A] mt-1">
              Lagos State
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Covering high-density residential and commercial clusters across the Island and Mainland: Lekki, VI, Ikoyi, Ikeja, and Surulere.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Pilot City 3
            </span>
            <h3 className="text-lg font-bold text-[#0F172A] mt-1">
              Abuja, Federal Capital Territory
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Providing dependable maintenance for government quarters, corporate offices, and private residential estates in Maitama, Wuse II, and Gwarinpa.
            </p>
          </div>
        </div>
      </Section>

      <CtaBanner
        id="about-cta"
        title="Experience the EasyLife Difference Today"
        description="Whether you need emergency help at home, want to join as a certified professional, or need a corporate facility partner, we are here."
        primary={{ label: "Explore Available Services", href: "/explore-services" }}
        secondary={{ label: "Register Your Account", href: "/register" }}
      />
    </PublicShell>
  );
}
