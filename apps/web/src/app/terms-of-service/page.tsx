import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero, Section } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Terms of Service — EasyLife Nigeria",
  description:
    "Review the terms and conditions governing the use of the EasyLife everyday services marketplace and maintenance platform in Nigeria.",
};

export default function TermsOfServicePage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Legal &amp; Operating Agreement"
        title="Terms of Service"
        description="Effective Date: 1 January 2026. Please read these terms carefully before creating an account, requesting services, or offering technical services on EasyLife."
      />

      <Section tone="white">
        <div className="max-w-4xl mx-auto prose prose-slate prose-headings:text-[#1F2328] dark:prose-headings:text-[#FAF7F3] prose-a:text-[#E8590C]">
          <div className="p-6 rounded-2xl bg-[#FCEBDD] dark:bg-[#1F2328] border-2 border-[#E8590C]/30 text-sm text-[#1F2328] dark:text-[#FAF7F3] mb-8 shadow-xs">
            <h2 className="text-base font-bold text-[#E8590C] mb-2 flex items-center gap-2 not-prose">
              <span>📋</span>
              <span>Quick Plain-English Summary</span>
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm list-disc pl-5 leading-relaxed text-[#4A525C] dark:text-[#C3C8CF] not-prose">
              <li><strong>Safe payments:</strong> Your money is held securely in escrow and only paid to the technician after you inspect and approve the job.</li>
              <li><strong>Clear quotes:</strong> Technicians must list parts and labour costs separately before work begins. No surprise charges.</li>
              <li><strong>Stay on the platform:</strong> All messages, bookings, and payments must happen on EasyLife so our guarantees and support protect you.</li>
              <li><strong>Dispute help:</strong> If you are not satisfied with a job, our local support team will step in to inspect and resolve it fairly.</li>
            </ul>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Scope of the Platform</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            EasyLife provides a technology platform connecting household customers, property managers, and commercial businesses with independent, verified trade professionals for everyday home repairs, technical troubleshooting, and scheduled preventive maintenance across Nigeria.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Account Eligibility &amp; Representations</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            To register an account on EasyLife, you must be at least 18 years of age and legally capable of entering into binding contracts under Nigerian law. You represent that all information provided during registration—including your identity, Nigerian mobile phone number, operating address, and trade credentials—is truthful and current.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Quotation, Pricing &amp; Escrow Holding</h2>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-disc pl-5">
            <li>
              <strong>Itemised Quotations:</strong> All service quotes issued by professionals must itemise replacement materials/parts separately from artisan labour. No undisclosed lump sums or hidden surcharges are permitted.
            </li>
            <li>
              <strong>Escrow Funding:</strong> When a customer accepts a quotation, the customer must deposit 100% of the agreed sum into EasyLife&apos;s designated escrow account. Funds are securely locked and cannot be withdrawn by either party until work is completed or a formal dispute is resolved.
            </li>
            <li>
              <strong>Fund Disbursement:</strong> Once the professional marks the job complete and the customer inspects and clicks &ldquo;Approve Completion&rdquo;, the escrowed funds are automatically released to the professional minus EasyLife&apos;s platform commission.
            </li>
            <li>
              <strong>Inspection Window:</strong> If a customer fails to either approve or raise a dispute within 48 hours of a professional submitting photo proof of completion, EasyLife may issue reminder notifications and automatically release funds after a 72-hour grace period if no objection is registered.
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Cancellations &amp; Refund Policy</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Customers may cancel a booking prior to technician dispatch for a full refund. If the technician has already arrived on site or procured customized, non-refundable spare parts with documented customer approval, the parts remain the property of the customer, and reasonable call-out transportation costs may be deducted before escrow release.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Prohibition of Platform Circumvention</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            To protect users from fraud, theft, and substandard work, all communications, quotations, and payments for jobs initiated on EasyLife must be conducted exclusively through EasyLife. Attempting to solicit cash payments outside the escrow system constitutes a breach of contract and will result in immediate permanent account suspension and loss of verified professional badges.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Dispute Mediation &amp; Resolution</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            In the event of disagreement regarding work quality or parts installation, either party may raise a dispute before escrow release. EasyLife&apos;s local operations teams in Port Harcourt, Lagos, and Abuja will investigate submitted photographs, diagnostic notes, and agreed quote scopes to mediate an amicable resolution. If mediation fails, disputes shall be resolved through final binding arbitration under the Nigerian Arbitration and Mediation Act 2023.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Governing Law</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
          </p>
        </div>
      </Section>
    </PublicShell>
  );
}
