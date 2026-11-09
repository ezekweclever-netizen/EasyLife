import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureCard,
  StepList,
  CheckList,
  FaqList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Become a Verified Service Professional — EasyLife Nigeria",
  description:
    "Join Nigeria's trusted network of verified technicians, electricians, plumbers, generator engineers, and HVAC specialists in Port Harcourt, Lagos, and Abuja.",
};

export default function BecomeAProfessionalPage() {
  const proAdvantages = [
    {
      icon: "briefcase" as const,
      title: "Quality Job Opportunities",
      description:
        "Connect directly with verified households, estate residents, and corporate facilities that need your technical expertise.",
    },
    {
      icon: "lock" as const,
      title: "Guaranteed Escrow Payouts",
      description:
        "Customer funds are locked in escrow before you begin work. No more unpaid balances, excuses, or delayed payments.",
    },
    {
      icon: "file-text" as const,
      title: "Digital Invoicing & Quotes",
      description:
        "Generate professional itemised quotes on your smartphone with clear breakdowns of materials, parts, and labour.",
    },
    {
      icon: "shield" as const,
      title: "Fair Mediation & Support",
      description:
        "Our local operations desk protects good technicians. If a client is unreasonable, our dispute team reviews photographic evidence.",
    },
  ];

  const onboardingSteps = [
    {
      title: "1. Create Professional Account",
      description:
        "Sign up online or via the EasyLife app. Select your trade specialties (plumbing, electrical, AC, generator, etc.) and primary operating cities.",
    },
    {
      title: "2. Submit Verification Documents",
      description:
        "Upload your national ID (NIN), verifiable residential or workshop address, trade apprenticeship credentials, and guarantor information.",
    },
    {
      title: "3. Complete Screening & Briefing",
      description:
        "Our local team in Port Harcourt, Lagos, or Abuja verifies your records and conducts a brief orientation on platform standards and customer etiquette.",
    },
    {
      title: "4. Receive Jobs & Build Reputation",
      description:
        "Start receiving qualified job alerts in your neighbourhood. Send itemised quotes, complete repairs, and earn verified ratings.",
    },
  ];

  const proFaqs = [
    {
      question: "How much does it cost to join EasyLife as a professional?",
      answer:
        "Registration and identity verification on EasyLife are completely free during our pilot phase. EasyLife only earns a modest transparent platform commission on successfully completed, paid jobs.",
    },
    {
      question: "How do I get paid after completing a job?",
      answer:
        "When the customer inspects and signs off on the completed work, the escrowed funds are automatically released to your EasyLife wallet and transferred directly to your registered Nigerian bank account.",
    },
    {
      question: "What if the customer refuses to sign off after I did good work?",
      answer:
        "EasyLife protects professionals. You can submit completion photos, job logs, and material receipts through the app to raise a dispute. Our local ground operations team will review the evidence and mediate a fair resolution.",
    },
    {
      question: "What qualifications are accepted for trade verification?",
      answer:
        "We accept formal apprenticeship freedom certificates, NABTEB certifications, Federal Ministry of Labour trade test certificates, technical college diplomas, or official membership endorsements from recognised artisan associations and trade guilds.",
    },
    {
      question: "Can registered artisan businesses or maintenance teams join?",
      answer:
        "Yes! Registered trade companies and maintenance workshops (CAC registered) can onboard their team members and manage multiple technicians under a single business profile.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="For Skilled Technicians &amp; Trade Specialists"
        title="Earn More, Work Smarter, and Get Paid on Time"
        description="EasyLife provides certified Nigerian technicians with genuine customer requests, structured digital quoting, and escrow payment protection in Port Harcourt, Lagos, and Abuja."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/pro/register" size="lg">
            Apply to Join as a Professional
          </ButtonLink>
          <ButtonLink href="/verification-policy" size="lg" variant="outline-inverse">
            Review Verification Standards
          </ButtonLink>
        </div>
      </PageHero>

      {/* Value Proposition */}
      <Section tone="white">
        <SectionHeading
          id="why-join"
          eyebrow="The EasyLife Advantage"
          title="Why Skilled Technicians Choose EasyLife"
          description="We understand the daily challenges Nigerian artisans face: delayed client payments, haggling, and unreliable job opportunities. EasyLife fixes all three."
        />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {proAdvantages.map((a) => (
            <FeatureCard
              key={a.title}
              icon={a.icon}
              title={a.title}
              description={a.description}
            />
          ))}
        </div>
      </Section>

      {/* Onboarding Roadmap */}
      <Section tone="grey">
        <SectionHeading
          id="onboarding-roadmap"
          eyebrow="Step-by-Step Onboarding"
          title="How to Get Verified and Start Receiving Jobs"
          description="Our 4-step onboarding process ensures only qualified, credible artisans serve EasyLife customers."
          align="center"
        />
        <div className="mt-12">
          <StepList steps={onboardingSteps} />
        </div>
      </Section>

      {/* Verification Requirements Breakdown */}
      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              id="verification-reqs"
              eyebrow="Mandatory Vetting"
              title="What You Need to Apply"
              description="To maintain the highest level of safety and customer confidence, every applicant must provide genuine documentation before receiving jobs."
            />
            <div className="mt-6">
              <CheckList
                items={[
                  "Valid Nigerian Government Identity (National Identity Number - NIN, Voter's Card, or Driver's Licence).",
                  "Verifiable proof of physical workshop or residential address in Port Harcourt, Lagos, or Abuja.",
                  "Proof of technical competence: Apprenticeship freedom letter, NABTEB certificate, or recognized trade guild card.",
                  "Two verified guarantors (respectable community members, employers, or registered trade colleagues).",
                  "Clean professional conduct record and commitment to fair, transparent parts pricing.",
                ]}
              />
            </div>
            <div className="mt-8">
              <Link
                href="/verification-policy"
                className="text-sm font-semibold text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                <span>Read our full Verification &amp; Vetting Policy</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#0A192F] text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
            <h3 className="text-lg font-bold text-white">
              Operating Pilot Locations
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              We are currently accepting professional onboarding applications across:
            </p>
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                <p className="text-sm font-bold text-teal-300">Port Harcourt &amp; Rivers State</p>
                <p className="text-xs text-slate-400 mt-1">Old GRA, New GRA, Peter Odili, Trans-Amadi, Woji, Rumuola, Choba</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                <p className="text-sm font-bold text-teal-300">Lagos State</p>
                <p className="text-xs text-slate-400 mt-1">Ikeja, Lekki, Victoria Island, Ikoyi, Surulere, Yaba, Gbagada, Magodo</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
                <p className="text-sm font-bold text-teal-300">Abuja (Federal Capital Territory)</p>
                <p className="text-xs text-slate-400 mt-1">Maitama, Asokoro, Wuse II, Garki, Jabi, Utako, Gwarinpa, Apo</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Frequently Asked Questions */}
      <Section tone="grey">
        <SectionHeading
          id="pro-faq-heading"
          eyebrow="Technician FAQ"
          title="Common Questions from Service Professionals"
          description="Everything you need to know about verification, job dispatch, fees, and payments."
          align="center"
        />
        <div className="mt-10 max-w-3xl mx-auto">
          <FaqList items={proFaqs} />
        </div>
      </Section>

      <CtaBanner
        id="pro-cta"
        title="Ready to Grow Your Trade Business?"
        description="Join thousands of skilled Nigerian technicians building sustainable businesses with guaranteed escrow payments."
        primary={{ label: "Apply Now as a Professional", href: "/pro/register" }}
        secondary={{ label: "Contact Professional Desk", href: "/contact?topic=professional_onboarding" }}
      />
    </PublicShell>
  );
}
