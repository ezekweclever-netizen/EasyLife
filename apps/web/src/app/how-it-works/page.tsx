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
      title: "1. Tell Us What You Need",
      description:
        "Select the service you need, describe the issue, choose your location, and add photos if you have them.",
    },
    {
      title: "2. Get Clear Quotes",
      description:
        "Verified technicians in your city review your request and send price quotes showing parts and labour costs.",
    },
    {
      title: "3. Pay Safely",
      description:
        "Accept the quote you prefer. Your money is held safely until the work is finished.",
    },
    {
      title: "4. Approve and Release Payment",
      description:
        "Inspect the completed job. Once you are satisfied, release payment to the technician.",
    },
  ];

  const proSteps = [
    {
      title: "1. Get Verified",
      description:
        "Submit your government ID, workshop address, trade credentials, and two guarantors.",
    },
    {
      title: "2. Get Matched to Jobs",
      description:
        "Receive instant job alerts in your city that match your trade skills.",
    },
    {
      title: "3. Send Clear Quotes",
      description:
        "Review job details, chat with the customer, and send a clear quote for parts and labour.",
    },
    {
      title: "4. Work and Get Paid",
      description:
        "Start work knowing the customer's funds are secured. Finish the job and receive fast bank payouts.",
    },
  ];

  const businessSteps = [
    {
      title: "1. Add Properties & Equipment",
      description:
        "Add your business locations and register equipment like generators, ACs, and water pumps.",
    },
    {
      title: "2. Set Routine Maintenance",
      description:
        "Set regular service schedules with automated reminders before equipment breaks down.",
    },
    {
      title: "3. Send Fast Service Requests",
      description:
        "Send work orders to verified technicians with fast response times and photo updates.",
    },
    {
      title: "4. One Monthly Invoice",
      description:
        "Review all completed maintenance and receive one clean, tax-ready monthly statement.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Simple & Protected"
        title="How EasyLife Works"
        description="Home repairs and maintenance should be simple and stress-free. EasyLife gives you verified pros, clear prices, and safe payments."
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
          title="For Customers: Safe, Clear, and In Control"
          description="Book everyday services with confidence knowing your money is safe until the job is done."
        />
        <div className="mt-10">
          <StepList steps={customerSteps} />
        </div>

        <div className="mt-12 rounded-2xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-8">
          <h3 className="text-base font-bold text-[#1F2328] dark:text-[#FAF7F3]">
            Why Escrow Protection Matters
          </h3>
          <p className="mt-2 text-sm text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
            Paying 100% upfront to technicians often leads to abandoned jobs or inflated fees. On EasyLife, your money is held safely until you confirm the job is done right. The technician knows funds are ready, and you stay in full control.
          </p>
        </div>
      </Section>

      {/* For Professionals */}
      <Section id="professionals" tone="grey">
        <SectionHeading
          id="pros-heading"
          eyebrow="Technicians &amp; Trade Specialists"
          title="For Professionals: Steady Jobs &amp; Guaranteed Pay"
          description="Grow your trade business with verified jobs and payments you can count on."
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
          title="For Businesses: Property &amp; Equipment Maintenance"
          description="Keep your facilities running with routine servicing and verified repair teams."
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
                Contact Facility Desk
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <CtaBanner
        id="how-cta"
        title="Ready to Get Started with EasyLife?"
        description="Join thousands of households, technicians, and businesses in Port Harcourt, Lagos, and Abuja solving everyday problems smarter."
        primary={{ label: "Create Account", href: "/register" }}
        secondary={{ label: "Find Services", href: "/services" }}
      />
    </PublicShell>
  );
}
