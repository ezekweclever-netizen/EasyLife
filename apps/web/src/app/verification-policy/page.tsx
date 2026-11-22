import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero, Section, SectionHeading, StepList, CheckList, CtaBanner } from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Professional Verification Policy — EasyLife Nigeria",
  description:
    "Learn about EasyLife's three-tier vetting, KYC standards, and background checks for technicians and trade specialists in Nigeria.",
};

export default function VerificationPolicyPage() {
  const verificationTiers = [
    {
      title: "Tier 1: Identity & Legal Vetting",
      description:
        "Every applicant must provide a verified National Identification Number (NIN), a government-issued photo identity document, and complete biometric phone OTP verification.",
    },
    {
      title: "Tier 2: Trade Competence & Address Check",
      description:
        "Applicants must submit documentary proof of technical skills (apprenticeship freedom letter, NABTEB, or trade guild certificate) and undergo physical workshop or residential address verification.",
    },
    {
      title: "Tier 3: Guarantor & Character References",
      description:
        "Two verified guarantors (such as registered business owners, senior trade guild executives, or corporate employers) must sign an accountability endorsement.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Safety &amp; Trust Standards"
        title="Professional Verification Policy"
        description="We believe homes and commercial facilities should only be entered by verified, honest, and technically qualified technicians. Here is how we enforce that standard."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/become-a-professional" size="lg">
            Apply for Verification
          </ButtonLink>
          <ButtonLink href="/help" size="lg" variant="outline-inverse">
            Verification FAQs
          </ButtonLink>
        </div>
      </PageHero>

      {/* 3-Tier Overview */}
      <Section tone="white">
        <SectionHeading
          id="three-tiers"
          eyebrow="Our 3-Tier Architecture"
          title="The Multi-Layer Vetting Process"
          description="Technicians cannot receive jobs on EasyLife by simply creating an account. They must pass all three stages."
        />
        <div className="mt-10">
          <StepList steps={verificationTiers} />
        </div>
      </Section>

      {/* Deep Dive into Each Tier */}
      <Section tone="grey">
        <div className="space-y-12">
          {/* Tier 1 Detail */}
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-6 sm:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Stage 1
            </span>
            <h3 className="text-xl font-bold text-[#0F172A] mt-1 mb-3">
              Tier 1: Government Identity &amp; Contact Verification
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              We eliminate anonymous or alias accounts through rigorous legal validation:
            </p>
            <CheckList
              items={[
                "National Identification Number (NIN) verified against the National Identity Management Commission (NIMC) database.",
                "Valid Nigerian Government Photo ID: NIN Card, Voter's Card, International Passport, or Federal Road Safety Commission (FRSC) Driver's Licence.",
                "Live selfie facial match against submitted ID documentation to prevent impersonation.",
                "Active Nigerian mobile number verified via SMS One-Time Password (OTP).",
              ]}
            />
          </div>

          {/* Tier 2 Detail */}
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-6 sm:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Stage 2
            </span>
            <h3 className="text-xl font-bold text-[#0F172A] mt-1 mb-3">
              Tier 2: Trade Competence &amp; Operating Address
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              We ensure every technician possesses genuine trade craftsmanship and a verifiable physical base:
            </p>
            <CheckList
              items={[
                "Documentary proof of vocational qualification: Formal Apprenticeship Freedom Certificate, National Business and Technical Examinations Board (NABTEB) certificate, Federal Ministry of Labour Trade Test (Grade 1, 2, or 3), or Technical College Diploma.",
                "Trade Association & Guild Endorsements: Active membership with recognised bodies (e.g. Nigerian Association of Refrigeration and Air Conditioning Practitioners, Electrical Contractors Association of Nigeria, Plumbers Association of Nigeria).",
                "Verifiable operating location in Port Harcourt, Lagos, or Abuja, backed by utility bills or geo-tagged workshop inspection.",
              ]}
            />
          </div>

          {/* Tier 3 Detail */}
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-6 sm:p-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              Stage 3
            </span>
            <h3 className="text-xl font-bold text-[#0F172A] mt-1 mb-3">
              Tier 3: Guarantor &amp; Professional Reference
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Accountability requires reputable community backing:
            </p>
            <CheckList
              items={[
                "Two independent guarantors: Each guarantor must be a credible Nigerian resident (e.g. registered business proprietor, senior civil servant, community elder, or senior artisan guild official).",
                "Guarantor identification and proof of address verified by our local operations desk.",
                "Signed guarantor undertaking confirming the applicant's character, physical residence, and trade integrity.",
              ]}
            />
          </div>
        </div>
      </Section>

      {/* De-verification and Suspension */}
      <Section tone="white">
        <SectionHeading
          id="suspension-policy"
          eyebrow="Continuous Monitoring"
          title="De-Verification &amp; Safety Enforcement"
          description="Verification is not a one-time stamp. Technicians are continuously monitored to ensure consistent quality and safety."
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-red-200 dark:border-red-800 rounded-xl p-6 bg-red-50 dark:bg-red-950/60/30">
            <h4 className="text-base font-bold text-red-950 mb-3">
              Immediate Grounds for Account Suspension
            </h4>
            <ul className="space-y-2.5 text-xs text-red-900 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">✕</span>
                <span>Soliciting off-platform direct cash payments to bypass escrow.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">✕</span>
                <span>Installing deliberately counterfeit or stolen spare parts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">✕</span>
                <span>Sending unverified apprentices or unlisted substitutes to client premises.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">✕</span>
                <span>Verbal hostility, harassment, or unsafe technical practices on site.</span>
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 dark:border-[#163654] rounded-xl p-6 bg-[#F8FAFC]">
            <h4 className="text-base font-bold text-[#0F172A] mb-3">
              Customer Feedback &amp; Re-audits
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every completed job requires mutual customer and technician ratings. Technicians who maintain consistently high quality and customer satisfaction are awarded Priority Pro status. Technicians whose ratings fall below platform benchmarks are temporarily suspended and required to complete refresher orientation.
            </p>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#163654]">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To report a safety or conduct concern, contact our dedicated operations team immediately at{" "}
                <Link href="/contact" className="text-[#0D9488] font-semibold underline">
                  Safety &amp; Compliance Desk
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </Section>

      <CtaBanner
        id="verification-cta"
        title="Ready to Build Your Verified Reputation?"
        description="If you are a skilled, honest technician in Port Harcourt, Lagos, or Abuja, join the platform that values your expertise."
        primary={{ label: "Apply for Professional Verification", href: "/register?role=professional" }}
        secondary={{ label: "Explore Platform Services", href: "/explore-services" }}
      />
    </PublicShell>
  );
}
