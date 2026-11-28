import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero, Section } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Privacy Policy — EasyLife Nigeria",
  description:
    "Learn how EasyLife collects, uses, and safeguards personal data under the Nigeria Data Protection Act (NDPA) 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Data Protection &amp; Privacy"
        title="EasyLife Privacy Policy"
        description="Effective Date: 1 January 2026. This policy governs how EasyLife processes and protects personal information in accordance with the Nigeria Data Protection Act (NDPA) 2023."
      />

      <Section tone="white">
        <div className="max-w-4xl mx-auto prose prose-slate prose-headings:text-[#1F2328] dark:prose-headings:text-[#FAF7F3] prose-a:text-[#E8590C]">
          <div className="p-4 rounded-xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] mb-8 leading-relaxed">
            <strong>Summary:</strong> We collect only the information necessary to match you with verified technicians, secure your payments in escrow, and safeguard our community. We never sell your personal data to third parties.
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Introduction &amp; Data Controller</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            EasyLife (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the EasyLife marketplace and maintenance management platform across our pilot cities: Port Harcourt (Rivers State), Lagos State, and Abuja (FCT), Nigeria. EasyLife acts as the Data Controller under the Nigeria Data Protection Act (NDPA) 2023 and the Nigeria Data Protection Regulation (NDPR).
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Depending on your relationship with EasyLife (household customer, trade professional, business facility manager, or property manager), we collect:
          </p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-disc pl-5 mt-2">
            <li>
              <strong>Account Information:</strong> Full name, verified email address, Nigerian mobile telephone number, account type, and designated operating city.
            </li>
            <li>
              <strong>Identity &amp; KYC Verification Data (Professionals):</strong> National Identification Number (NIN), scanned copies of valid government-issued identification cards, proof of residential/workshop address, trade qualification credentials (NABTEB, apprenticeship freedom certificates), and contact details of verified guarantors.
            </li>
            <li>
              <strong>Service Request &amp; Maintenance Data:</strong> Property service addresses, diagnostic descriptions, photographs of faulty equipment (generators, HVAC, plumbing, inverters), itemised quotations, milestone status, and customer-artisan communication transcripts.
            </li>
            <li>
              <strong>Financial &amp; Transactional Data:</strong> Escrow payment records, payment gateway reference tokens (Paystack), and Nigerian bank account numbers (NUBAN) for technician payout disbursements. <em>Note: EasyLife does not store complete debit/credit card numbers or card CVV codes.</em>
            </li>
            <li>
              <strong>Technical &amp; Log Data:</strong> Internet Protocol (IP) addresses, device identifiers, session cookies, and security audit logs to protect platform integrity and prevent fraud.
            </li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Lawful Bases for Processing</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            We process your personal information strictly under the following legal bases:
          </p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-disc pl-5 mt-2">
            <li><strong>Performance of a Contract:</strong> To match requests with technicians, generate itemised quotations, hold escrow funds, and disburse payouts.</li>
            <li><strong>Legal &amp; Regulatory Obligation:</strong> To satisfy anti-money laundering (AML), customer vetting (KYC), tax compliance, and commercial disclosure requirements in Nigeria.</li>
            <li><strong>Legitimate Interests:</strong> To detect fraudulent bookings, prevent harassment, ensure on-site physical safety, and improve system reliability.</li>
            <li><strong>Explicit Consent:</strong> Where you provide consent for optional communications or specialized data sharing.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Disclosure &amp; Sharing of Data</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            We share information only under controlled and necessary conditions:
          </p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-disc pl-5 mt-2">
            <li><strong>Between Customer and Assigned Professional:</strong> Once a quotation is accepted and escrow funded, service location and direct telephone contact details are shared to coordinate on-site execution.</li>
            <li><strong>Payment &amp; Escrow Infrastructure:</strong> Licensed Nigerian payment service providers (e.g., Paystack) to securely process card payments, bank transfers, and payouts.</li>
            <li><strong>Law Enforcement &amp; Regulatory Authorities:</strong> When required by a valid court order or statutory request under Nigerian law.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Data Retention &amp; Security Measures</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Personal data is encrypted in transit using TLS 1.3 and at rest within our hardened Supabase PostgreSQL database protected by strict Row Level Security (RLS). Professional KYC identity documents are segregated in private, access-controlled cloud storage buckets. We retain account and transaction records for six (6) years following transaction completion in accordance with Nigerian commercial record-keeping obligations.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Your Data Subject Rights</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Under the Nigeria Data Protection Act 2023, you have the right to:
          </p>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-disc pl-5 mt-2">
            <li>Request a copy of the personal data we hold about you.</li>
            <li>Request correction or rectification of incomplete or inaccurate data.</li>
            <li>Request erasure of your data where no overriding legal obligation exists.</li>
            <li>Object to or restrict the processing of your data in specific circumstances.</li>
            <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC).</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Contact the Data Protection Officer (DPO)</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            If you have questions regarding this Privacy Policy or wish to exercise your statutory rights, please contact our Data Protection Officer via email at <span className="font-semibold text-[#1F2328]">privacy@easylife.ng</span> or submit an inquiry through our{" "}
            <Link href="/contact?topic=privacy_request" className="text-[#E8590C] font-semibold underline">
              Contact Portal
            </Link>
            .
          </p>
        </div>
      </Section>
    </PublicShell>
  );
}
