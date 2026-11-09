import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureCard,
  CheckList,
  FaqList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Business Facility & Maintenance Solutions — EasyLife Nigeria",
  description:
    "Enterprise-grade facility maintenance, equipment asset tracking, and scheduled servicing for Nigerian SMEs, clinics, retail chains, and property managers.",
};

export default function BusinessSolutionsPage() {
  const businessFeatures = [
    {
      icon: "building" as const,
      title: "Multi-Property Central Oversight",
      description:
        "Manage maintenance for all your commercial branches, offices, or residential rental units across Port Harcourt, Lagos, and Abuja from one dashboard.",
    },
    {
      icon: "settings" as const,
      title: "Critical Equipment Tracking",
      description:
        "Maintain a complete digital logbook for heavy generators, HVAC systems, cold storage units, solar banks, and borehole filtration setups.",
    },
    {
      icon: "calendar" as const,
      title: "Scheduled Preventive Maintenance",
      description:
        "Prevent catastrophic business downtime with automated routine service triggers based on equipment runtime hours and calendar cycles.",
    },
    {
      icon: "file-text" as const,
      title: "Consolidated Tax-Ready Invoicing",
      description:
        "Eliminate messy artisan cash disbursements and lost receipts. Receive itemised, audit-compliant monthly statements with VAT breakdowns.",
    },
  ];

  const businessFaqs = [
    {
      question: "Which types of businesses benefit most from EasyLife Business?",
      answer:
        "Our platform is tailored for SMEs and institutions where equipment uptime is critical: private clinics and hospitals, schools, supermarkets and retail stores, restaurants, co-working spaces, corporate branch offices, and residential estate managers.",
    },
    {
      question: "Can multiple team members have access to the business portal?",
      answer:
        "Yes. EasyLife supports role-based access control (RBAC). You can configure Business Owners, Facility Managers, On-Site Supervisors, and Accounting/Viewer roles with tailored permissions for booking, quotation approval, and invoice viewing.",
    },
    {
      question: "How are spare parts and consumables handled for business clients?",
      answer:
        "Every quotation includes clear itemised line items for parts and labour. Invoices can include vendor receipts and warranty documents for audit compliance and inventory tracking.",
    },
    {
      question: "Do you offer Service Level Agreements (SLAs) for emergency breakdowns?",
      answer:
        "Yes. Commercial accounts can opt into priority SLA response tiers (e.g. 2-hour response for critical generator or power failure emergencies in our pilot cities).",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Commercial Facility &amp; Asset Management"
        title="Zero Downtime. Total Maintenance Visibility."
        description="Stop reacting to costly equipment breakdowns. EasyLife gives Nigerian businesses an organised digital maintenance management system with verified technical execution."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/register?role=business" size="lg">
            Create Business Account
          </ButtonLink>
          <ButtonLink href="/contact?topic=business_solutions" size="lg" variant="outline-inverse">
            Request Corporate Demo
          </ButtonLink>
        </div>
      </PageHero>

      {/* Core Business Capabilities */}
      <Section tone="white">
        <SectionHeading
          id="business-pillars"
          eyebrow="Enterprise Architecture"
          title="Designed for Everyday Operational Reliability"
          description="In Nigeria's challenging infrastructure environment, keeping your power, water, and cooling systems running is vital to your bottom line."
        />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessFeatures.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      </Section>

      {/* Comparison: Ad-hoc vs EasyLife */}
      <Section tone="grey">
        <SectionHeading
          id="comparison-heading"
          eyebrow="The Smart Shift"
          title="Ad-hoc Artisan Management vs. EasyLife Managed Maintenance"
          description="Why forward-thinking business owners and facility managers in Lagos, Abuja, and Port Harcourt are switching to EasyLife."
          align="center"
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-4">
              Traditional Ad-hoc Approach
            </div>
            <ul className="space-y-3.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Unvetted roadside technicians with unknown competence.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Emergency reactive repairs after equipment has already suffered catastrophic failure.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Inflated paper receipts and unverified parts purchases with no warranty.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Disorganised paper records and zero maintenance history when equipment changes hands.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-teal-300 p-6 sm:p-8 shadow-sm ring-1 ring-[#0D9488]/30">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-bold mb-4">
              EasyLife Business System
            </div>
            <ul className="space-y-3.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="text-[#0D9488] font-bold shrink-0">✓</span>
                <span>Strictly verified trade specialists backed by comprehensive background vetting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#0D9488] font-bold shrink-0">✓</span>
                <span>Automated preventive service schedules (250-hour oil changes, quarterly HVAC servicing).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#0D9488] font-bold shrink-0">✓</span>
                <span>Transparent digital quotations with line-item verification and escrow payment protection.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#0D9488] font-bold shrink-0">✓</span>
                <span>Centralised asset registries, service logs, and tax-compliant consolidated monthly statements.</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Target Commercial Sectors */}
      <Section tone="white">
        <SectionHeading
          id="sectors-heading"
          eyebrow="Industry Focus"
          title="Tailored for Nigeria's Essential Sectors"
          description="Flexible solutions configured to meet the specific compliance and uptime needs of diverse facilities."
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 p-6 bg-[#F8FAFC]">
            <h4 className="text-base font-bold text-[#0F172A]">Healthcare &amp; Diagnostics</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Uninterrupted cold-chain storage, medical oxygen booster pumps, and zero-flicker generator changeover calibration for clinics and laboratories.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-6 bg-[#F8FAFC]">
            <h4 className="text-base font-bold text-[#0F172A]">Hospitality &amp; Quick Service Retail</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Commercial kitchen exhaust extraction, refrigeration maintenance, deep cleaning, and rapid plumbing response to prevent customer disruption.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-6 bg-[#F8FAFC]">
            <h4 className="text-base font-bold text-[#0F172A]">Estates &amp; Property Managers</h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Central borehole treatment plant oversight, street lighting arrays, gate automation, and tenant reactive maintenance ticketing with complete billing transparency.
            </p>
          </div>
        </div>
      </Section>

      {/* Business FAQs */}
      <Section tone="grey">
        <SectionHeading
          id="biz-faq-heading"
          eyebrow="Commercial FAQ"
          title="Frequently Asked Questions by Businesses"
          description="Everything you need to know about corporate onboarding, SLAs, and consolidated billing."
          align="center"
        />
        <div className="mt-10 max-w-3xl mx-auto">
          <FaqList items={businessFaqs} />
        </div>
      </Section>

      <CtaBanner
        id="biz-cta"
        title="Modernise Your Company's Facility Management"
        description="Book a consultation with our Port Harcourt, Lagos, or Abuja commercial maintenance desk today."
        primary={{ label: "Sign Up as a Business", href: "/register?role=business" }}
        secondary={{ label: "Speak with Our Commercial Team", href: "/contact?topic=business_solutions" }}
      />
    </PublicShell>
  );
}
