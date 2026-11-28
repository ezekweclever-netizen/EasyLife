import React from "react";
import type { Metadata } from "next";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero, Section, SectionHeading } from "@/components/site/sections";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact Us — EasyLife Nigeria",
  description:
    "Get in touch with EasyLife's customer support and operations desks in Port Harcourt, Lagos, and Abuja. We're here to help with bookings, verification, and business solutions.",
};

interface ContactPageProps {
  searchParams: Promise<{
    topic?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { topic } = await searchParams;

  return (
    <PublicShell>
      <PageHero
        eyebrow="Support &amp; Inquiries"
        title="We're Here to Help"
        description="Reach out to our local operations and customer care teams in Port Harcourt, Lagos, and Abuja. We typically respond within one business day."
      />

      <Section tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details & Operating Hubs */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <SectionHeading
                id="contact-info-heading"
                eyebrow="Operating Hubs"
                title="Our Regional Offices"
                description="EasyLife maintains active local ground presence to supervise service quality and technician vetting."
              />

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 bg-white dark:bg-[#1F2328]">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E8590C]">
                    Port Harcourt Hub (Rivers State)
                  </p>
                  <p className="text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mt-1">
                    EasyLife Operations Desk
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Trans-Amadi Commercial Layout, Port Harcourt, Rivers State
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 bg-white dark:bg-[#1F2328]">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E8590C]">
                    Lagos Hub
                  </p>
                  <p className="text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mt-1">
                    EasyLife Operations Desk
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Admiralty Way, Lekki Phase 1, Lagos State
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 bg-white dark:bg-[#1F2328]">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E8590C]">
                    Abuja Hub (FCT)
                  </p>
                  <p className="text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mt-1">
                    EasyLife Operations Desk
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Central Business District, Abuja, Federal Capital Territory
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#1F2328] text-white p-6 border border-[#2E343B]">
              <h4 className="text-sm sm:text-base font-bold text-[#E8590C] uppercase tracking-wider">
                Support Hours &amp; Channels
              </h4>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Monday &ndash; Friday</span>
                  <span className="font-semibold text-white">8:00 AM &ndash; 6:00 PM WAT</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Saturday</span>
                  <span className="font-semibold text-white">9:00 AM &ndash; 4:00 PM WAT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Escalations</span>
                  <span className="font-semibold text-[#E8590C]">24/7 In-App Ticketing</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 items-center">
                  <span className="text-slate-400">Direct WhatsApp</span>
                  <a
                    href="https://wa.me/2347049948582"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#25D366] hover:underline inline-flex items-center gap-1"
                  >
                    <span>07049948582</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5">
              Send Us a Message
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6">
              Fill out the form below. If your message relates to an active booking, please mention your Booking Reference.
            </p>
            <ContactForm defaultTopic={topic} />
          </div>
        </div>
      </Section>
    </PublicShell>
  );
}
