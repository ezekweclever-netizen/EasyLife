import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  StepList,
  CheckList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works — EasyLife Nigeria",
  description:
    "Learn how EasyLife connects households, verified trade professionals, and businesses with transparent pricing and escrow payment protection in Nigeria.",
};

export default function HowItWorksPage() {
  const customerSteps = [
    {
      title: "1. Post Your Request",
      description:
        "Select the relevant category, describe the issue, specify your location (Port Harcourt, Lagos, or Abuja), upload photos of the fault, and set your availability.",
    },
    {
      title: "2. Receive Itemised Quotes",
      description:
        "Verified professionals in your area review your requirements and submit structured quotations itemising spare parts, materials, and artisan labour.",
    },
    {
      title: "3. Fund the Escrow Account",
      description:
        "Accept the quote that meets your needs. Your payment is held safely in escrow — the professional is notified to begin work, but cannot claim funds yet.",
    },
    {
      title: "4. Inspect Work & Release Funds",
      description:
        "Once the technician completes the job, inspect the work thoroughly. When satisfied, approve the completion in-app to release the escrowed payment.",
    },
  ];

  const proSteps = [
    {
      title: "1. Complete Verification",
      description:
        "Submit your national ID (NIN), verifiable residential or workshop address, proof of trade competence (apprenticeship freedom letter or NABTEB), and two guarantors.",
    },
    {
      title: "2. Receive Targeted Job Leads",
      description:
        "Get instant notifications for service requests within your coverage radius in Port Harcourt, Lagos, or Abuja matching your verified skills.",
    },
    {
      title: "3. Send Clear Quotations",
      description:
        "Inspect the customer’s request, chat securely to clarify specifications, and send an itemised quote with transparent labour and materials costs.",
    },
    {
      title: "4. Work with Payment Security",
      description:
        "Only start work once EasyLife confirms the customer has funded escrow. Complete the job professionally, submit photo proof, and receive your bank payout.",
    },
  ];

  const businessSteps = [
    {
      title: "1. Register Facility & Assets",
      description:
        "Add your business locations, commercial properties, and critical equipment (diesel generators, central HVAC, water treatment plants, inverters).",
    },
    {
      title: "2. Configure Preventive Schedules",
      description:
        "Set recurring maintenance intervals (e.g. generator service every 250 engine hours, quarterly AC duct servicing) with automated reminders.",
    },
    {
      title: "3. Direct Dispatch & SLA Tracking",
      description:
        "Assign priority work orders to certified maintenance teams with strict response time commitments and photographic completion logs.",
    },
    {
      title: "4. Unified Monthly Invoicing",
      description:
        "Review comprehensive maintenance histories, approve digital work orders, and receive single, itemised tax-compliant monthly statements.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Process &amp; Protection"
        title="How EasyLife Delivers Reliability"
        description="Everyday repairs and maintenance should not be a gamble. EasyLife replaces uncertainty with verified vetting, itemised quotations, and escrow protection."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="#customers">For Customers</ButtonLink>
          <ButtonLink href="#professionals" variant="outline-inverse">
            For Professionals
          </ButtonLink>
          <ButtonLink href="#businesses" variant="outline-inverse">
            For Businesses
          </ButtonLink>
        </div>
      </PageHero>

      {/* For Customers */}
      <Section id="customers" tone="white">
        <SectionHeading
          id="customers-heading"
          eyebrow="Households &amp; Residents"
          title="The Customer Experience: Safe, Clear, and In Control"
          description="How to book everyday services with complete confidence that your hard-earned money is protected until the job is done right."
        />
        <div className="mt-10">
          <StepList steps={customerSteps} />
        </div>

        <div className="mt-12 rounded-2xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-8">
          <h3 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3]">
            Why Escrow Protection Matters in Nigeria
          </h3>
          <p className="mt-2 text-sm text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
            In Nigeria, paying 100% upfront to an unvetted technician often leads to abandoned jobs, substandard materials, or inflated extra charges. On EasyLife, your funds are safely locked in escrow. The technician knows you have paid and can afford the work, while you know they cannot collect payment until you verify that the problem is completely fixed.
          </p>
        </div>
      </Section>

      {/* For Professionals */}
      <Section id="professionals" tone="grey">
        <SectionHeading
          id="pros-heading"
          eyebrow="Service Technicians &amp; Trade Specialists"
          title="The Professional Workflow: Steady Jobs &amp; Guaranteed Payments"
          description="Build your trade business on a platform that respects your craft and guarantees you get paid once your work is done."
        />
        <div className="mt-10">
          <StepList steps={proSteps} />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 shadow-xs">
            <h4 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3] mb-3">
              What We Provide Every Verified Technician
            </h4>
            <CheckList
              items={[
                "A verified digital profile with your credentials and city coverage.",
                "Direct job notifications matching your specific skill set.",
                "Structured quote generation so you don't need manual invoices.",
                "Escrow confirmation before you spend money on transport or parts.",
                "Prompt direct bank transfer payouts upon job sign-off.",
              ]}
            />
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3] mb-3">
                Professional Conduct Standards
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                EasyLife holds all technicians to strict professional conduct: punctuality, respectful communication, honest sourcing of genuine replacement parts, and maintaining safe working conditions in homes and offices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E6E0D8] dark:border-[#2E343B]">
              <ButtonLink href="/become-a-professional" className="w-full text-center">
                Apply to Join as a Professional
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* For Businesses */}
      <Section id="businesses" tone="white">
        <SectionHeading
          id="biz-heading"
          eyebrow="Commercial &amp; Property Maintenance"
          title="The Business Workflow: Asset Oversight &amp; Routine Maintenance"
          description="How businesses, clinics, estates, and retail branches eliminate costly downtime with scheduled preventive care."
        />
        <div className="mt-10">
          <StepList steps={businessSteps} />
        </div>

        <div className="mt-12 rounded-2xl bg-[#1F2328] border border-[#2E343B] text-[#FAF7F3] p-6 sm:p-10">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-white">
              Looking for a Corporate Service Agreement?
            </h3>
            <p className="mt-2 text-sm text-[#C3C8CF] leading-relaxed">
              We offer customised facility maintenance packages for multi-branch organizations in Port Harcourt, Lagos, and Abuja, with dedicated SLA response times and designated account managers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/business-hub">
                Explore Business Hub
              </ButtonLink>
              <ButtonLink href="/contact?topic=business_solutions" variant="outline-inverse">
                Contact Enterprise Desk
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <CtaBanner
        id="how-cta"
        title="Ready to Get Started with EasyLife?"
        description="Join thousands of households, technicians, and businesses in Port Harcourt, Lagos, and Abuja solving everyday problems smarter."
        primary={{ label: "Register for EasyLife", href: "/register" }}
        secondary={{ label: "Explore Service Catalog", href: "/explore-services" }}
      />
    </PublicShell>
  );
}
