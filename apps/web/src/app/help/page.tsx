import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { CustomerSupportChat } from "@/components/support/customer-support-chat";
import {
  PageHero,
  Section,
  SectionHeading,
  FaqList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Help Centre & Support — EasyLife Nigeria",
  description:
    "Find answers to common questions about booking services, escrow payments, technician verification, and account management on EasyLife.",
};

export default function HelpCentrePage() {
  const customerFaqs = [
    {
      question: "How do I request a service on EasyLife?",
      answer:
        "You can explore categories on our website or mobile app, select the trade needed, provide a detailed description and photos of the problem, and submit your request. Vetted technicians in your city will review your request and submit itemised quotations.",
    },
    {
      question: "How does the escrow payment system work?",
      answer:
        "When you accept a quote, you deposit the agreed sum into EasyLife's secure escrow. The technician is alerted that funds are locked, and work begins. The money is never released to the technician until you inspect the finished work and click 'Approve Completion'.",
    },
    {
      question: "What if the technician does substandard work or does not finish?",
      answer:
        "Do not click 'Approve Completion'. Instead, select 'Raise a Dispute' within your booking view. You will be prompted to attach photos and notes. Our local resolution team in Port Harcourt, Lagos, or Abuja will review the case, inspect if necessary, and ensure either the work is corrected or your escrowed funds are refunded.",
    },
    {
      question: "Can I cancel a booking after accepting a quote?",
      answer:
        "Yes. If the technician has not yet purchased approved custom materials or travelled to the site, a full refund of your escrow deposit is issued. If custom non-refundable parts were already procured with your explicit approval, those parts belong to you and only labour is refunded.",
    },
  ];

  const proFaqs = [
    {
      question: "How long does professional verification take?",
      answer:
        "Once you submit your NIN, workshop or residential address proof, trade credentials, and guarantor information, our compliance team reviews and verifies your documents within 2 to 3 business days.",
    },
    {
      question: "How and when do I receive my earnings?",
      answer:
        "Funds are disbursed to your registered Nigerian bank account within 24 hours of the customer approving the completed job. EasyLife deducts a modest platform commission, and the balance is sent via direct bank transfer.",
    },
    {
      question: "How do I quote for unforeseen repairs discovered on site?",
      answer:
        "If a hidden problem is discovered during execution, you can submit an amended quotation through the app. The customer must review and fund the additional milestone in escrow before you proceed with the extra work.",
    },
  ];

  const businessFaqs = [
    {
      question: "How do I onboard multiple corporate branches?",
      answer:
        "In your Business Dashboard under 'Properties', click 'Add Property'. You can register branches in Port Harcourt, Lagos, or Abuja, assign local facility supervisors, and catalog the specific generators and AC units located at each site.",
    },
    {
      question: "Can our accounting department receive monthly tax invoices?",
      answer:
        "Yes. Commercial accounts receive consolidated monthly statements itemising all routine maintenance visits, reactive repairs, replacement parts, and VAT.",
    },
  ];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Support &amp; Answers"
        title="EasyLife Help Centre"
        description="Clear guidance on how to book services, manage escrow payments, complete professional verification, and resolve disputes."
      >
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="#interactive-assistant">AI Support Assistant</ButtonLink>
          <ButtonLink href="#customer-help" variant="outline-inverse">
            Customer Help
          </ButtonLink>
          <ButtonLink href="#pro-help" variant="outline-inverse">
            Professional Help
          </ButtonLink>
          <ButtonLink href="#business-help" variant="outline-inverse">
            Business Help
          </ButtonLink>
        </div>
      </PageHero>

      {/* Interactive AI Support Assistant */}
      <Section id="interactive-assistant" tone="grey">
        <SectionHeading
          id="ai-support-heading"
          eyebrow="Real-Time Knowledge &amp; Inquiries"
          title="Ask the EasyLife Support Assistant"
          description="Get immediate guidance on bookings, escrow payments, verified technicians, and account policies. Complex inquiries are instantly escalated to our human support team."
        />
        <div className="mt-8">
          <CustomerSupportChat />
        </div>
      </Section>

      {/* Customer Help */}
      <Section id="customer-help" tone="white">
        <SectionHeading
          id="cust-help-heading"
          eyebrow="For Households &amp; Residents"
          title="Customer Booking &amp; Escrow Payments"
          description="Everything you need to know about placing service requests, paying safely, and approving jobs."
        />
        <div className="mt-8 max-w-3xl">
          <FaqList items={customerFaqs} />
        </div>
      </Section>

      {/* Professional Help */}
      <Section id="pro-help" tone="grey">
        <SectionHeading
          id="pro-help-heading"
          eyebrow="For Service Technicians"
          title="Technician Verification, Quotes &amp; Payouts"
          description="Answers for artisans and technical contractors growing their businesses on EasyLife."
        />
        <div className="mt-8 max-w-3xl">
          <FaqList items={proFaqs} />
        </div>
      </Section>

      {/* Business Help */}
      <Section id="business-help" tone="white">
        <SectionHeading
          id="biz-help-heading"
          eyebrow="For Facilities &amp; Property Managers"
          title="Business Facilities &amp; Multi-Property Maintenance"
          description="Guidance on setting up asset trackers, preventive schedules, and team roles."
        />
        <div className="mt-8 max-w-3xl">
          <FaqList items={businessFaqs} />
        </div>
      </Section>

      {/* Still need help */}
      <Section tone="grey" className="border-t border-slate-200 dark:border-[#163654]">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-xl font-bold text-[#0F172A]">
            Still have an unanswered question?
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Our customer and technical support teams in Port Harcourt, Lagos, and Abuja are available to assist you Monday through Saturday.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/contact">
              Send Us a Message
            </ButtonLink>
            <ButtonLink href="/verification-policy" variant="outline">
              Review Verification Policy
            </ButtonLink>
          </div>
        </div>
      </Section>

      <CtaBanner
        id="help-cta"
        title="Ready to Get Started?"
        description="Experience the convenience and peace of mind of vetted technicians and escrow payment protection."
        primary={{ label: "Explore Services", href: "/explore-services" }}
        secondary={{ label: "Create an Account", href: "/register" }}
      />
    </PublicShell>
  );
}
