import Link from "next/link";
import { redirect } from "next/navigation";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import { PublicShell } from "@/components/site/public-shell";
import { ScrollHeroSection } from "@/components/site/scroll-hero-section";
import { StackedCategoriesSection } from "@/components/site/stacked-categories-section";
import {
  Section,
  SectionHeading,
  FeatureCard,
  StepList,
  FaqList,
  CtaBanner,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/site/icons";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  if (resolvedParams && (resolvedParams.code || resolvedParams.error)) {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(resolvedParams)) {
      if (typeof val === "string") qs.set(key, val);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const customerSteps = [
    {
      title: "Tell Us What You Need",
      description:
        "Select a service, describe the issue, and choose your city and preferred time.",
    },
    {
      title: "Get Clear Quotes",
      description:
        "Verified technicians send you price quotes showing parts and labour costs upfront.",
    },
    {
      title: "Pay Safely",
      description:
        "Accept the quote you like. Your money is held safely until the job is done.",
    },
    {
      title: "Approve and Release Payment",
      description:
        "Check the completed work. Once satisfied, release payment to the pro.",
    },
  ];

  const customerBenefits = [
    {
      icon: "shield" as const,
      title: "Verified Professionals",
      description:
        "Every technician has a verified government ID, physical address, proven skills, and trusted guarantors.",
    },
    {
      icon: "lock" as const,
      title: "Safe Escrow Payments",
      description:
        "Your money stays safe with us. We only pay the technician after you approve their work.",
    },
    {
      icon: "file-text" as const,
      title: "Clear Upfront Prices",
      description:
        "No hidden charges. Quotes clearly separate materials from labour before work begins.",
    },
    {
      icon: "clock" as const,
      title: "Fast Local Support",
      description:
        "Active in Port Harcourt, Lagos, and Abuja with quick support and fair dispute resolution.",
    },
  ];

  const proBenefits = [
    {
      icon: "briefcase" as const,
      title: "Steady Stream of Real Jobs",
      description:
        "Get matched directly with customers and businesses in your area who need your skills.",
    },
    {
      icon: "check" as const,
      title: "Guaranteed Payment",
      description:
        "No more arguing over payments. The customer's money is secured before you start work.",
    },
    {
      icon: "file-text" as const,
      title: "Simple Invoices",
      description:
        "Send clear quotes and invoices from your phone to build your verified reputation.",
    },
    {
      icon: "users" as const,
      title: "Fair Dispute Support",
      description:
        "Our local team steps in with clear photo evidence if any misunderstanding happens.",
    },
  ];

  const homepageFaqs = [
    {
      question: "Which cities does EasyLife currently operate in?",
      answer:
        "EasyLife is active in Port Harcourt, Lagos, and Abuja. We are actively expanding to more areas.",
    },
    {
      question: "How are professionals verified?",
      answer:
        "Every technician passes three checks: government ID verification, in-person workshop check, and a test of their skills with trusted guarantors.",
    },
    {
      question: "How does the escrow payment protect me?",
      answer:
        "Your money is held safely until the job is done. We only release funds after you inspect the work and confirm you are satisfied.",
    },
    {
      question: "Can businesses manage multiple properties on EasyLife?",
      answer:
        "Yes. Business accounts can register multiple properties, track equipment like generators and ACs, and schedule routine servicing.",
    },
    {
      question: "What happens if I'm not satisfied with a job?",
      answer:
        "You can request free corrections or report a problem with photos. Your payment stays frozen until our support team resolves it fairly.",
    },
  ];

  return (
    <PublicShell>
      {/* 1. Full-Bleed Hero Section & Main Service Search */}
      <ScrollHeroSection />

      {/* 3. 3-Step Sticky Purpose Card Stack (Find Services, Jobs & Opportunities, Business Hub) */}
      <StackedCategoriesSection />

      {/* 3b. Quick Category Grid: Core Everyday Trade Services */}
      <Section id="core-services" tone="white">
        <SectionHeading
          id="services-heading"
          eyebrow="Verified Services"
          title="Popular Everyday Services"
          description="Find verified pros in Port Harcourt, Lagos, and Abuja. Clear prices and safe payments."
          align="center"
        />
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              title: "Plumbing & Borehole",
              href: "/services?cat=plumbing-services",
              icon: "wrench" as const,
              count: "Vetted Pros",
            },
            {
              title: "Electrical & Solar",
              href: "/services?cat=electrical-services",
              icon: "zap" as const,
              count: "Certified Technicians",
            },
            {
              title: "AC & Refrigeration",
              href: "/services?cat=ac-refrigeration-services",
              icon: "wind" as const,
              count: "Deep Servicing",
            },
            {
              title: "Generator Servicing",
              href: "/services?cat=generator-services",
              icon: "settings" as const,
              count: "Perkins / Firman",
            },
            {
              title: "Carpentry & Woodwork",
              href: "/services?cat=carpentry-woodwork-services",
              icon: "hammer" as const,
              count: "Cabinet & Doors",
            },
            {
              title: "Home & Deep Cleaning",
              href: "/services?cat=cleaning-waste-services",
              icon: "sparkles" as const,
              count: "Post-Construction",
            },
            {
              title: "Apartment Relocation",
              href: "/post-a-need?category=moving",
              icon: "truck" as const,
              count: "Haulage Trucks",
            },
            {
              title: "Painting & Screeding",
              href: "/services?cat=painting-wall-services",
              icon: "paintbrush" as const,
              count: "Interior / Exterior",
            },
          ].map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group p-5 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] hover:bg-white dark:hover:bg-[#1F2328] hover:border-[#E8590C] dark:hover:border-[#E8590C] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-[#E8590C]/30">
                  <Icon name={cat.icon} className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F2328] dark:text-[#FAF7F3] group-hover:text-[#E8590C] transition-colors leading-snug">
                  {cat.title}
                </h3>
              </div>
              <div className="mt-4 pt-2 border-t border-[#E6E0D8] dark:border-[#2E343B] text-[11px] font-semibold text-[#E8590C] flex items-center justify-between">
                <span>{cat.count}</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/services" size="md">
            View All Service Categories &rarr;
          </ButtonLink>
        </div>
      </Section>

      {/* 4. How EasyLife Works */}
      <Section id="how-it-works" tone="grey">
        <SectionHeading
          id="how-heading"
          eyebrow="Simple Process"
          title="How EasyLife Works"
          description="A simple 4-step process designed for safety, fair prices, and guaranteed quality."
          align="center"
        />
        <div className="mt-12">
          <StepList steps={customerSteps} />
        </div>
        <div className="mt-10 text-center">
          <ButtonLink
            href="/how-it-works"
            variant="outline"
            className="whitespace-normal! h-auto! py-3 text-center max-w-full"
          >
            See How It Works for Pros &amp; Businesses →
          </ButtonLink>
        </div>
      </Section>

      {/* 4b. Free Everyday Tools & Calculators Showcase */}
      <Section id="free-tools-preview" tone="peach">
        <div className="rounded-3xl border border-[#E6E0D8] dark:border-[#2E343B] bg-[#FAF7F3] dark:bg-[#1F2328] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E6E0D8] dark:border-[#2E343B]">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#E8590C] uppercase">
                100% Free Tools
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1F2328] dark:text-[#FAF7F3] mt-1">
                Free Calculators for Homes and Businesses
              </h2>
              <p className="text-xs sm:text-sm text-[#4A525C] dark:text-[#C3C8CF] mt-1 max-w-xl">
                Get instant estimates with no sign-up. Check repair costs, calculate generator size, and plan maintenance.
              </p>
            </div>
            <ButtonLink href="/tools" size="md" className="shrink-0">
              Open All Free Tools &rarr;
            </ButtonLink>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tools"
              className="bg-white dark:bg-[#1F2328] p-5 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#E8590C] dark:hover:border-[#E8590C] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-[#E8590C]/30">
                <Icon name="receipt" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] group-hover:text-[#E8590C] transition-colors">
                Service Cost Estimator
              </h3>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
                Instant price benchmarks for AC, generator, plumbing &amp; electrical repairs by city.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#1F2328] p-5 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#E8590C] dark:hover:border-[#E8590C] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-[#E8590C]/30">
                <Icon name="zap" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] group-hover:text-[#E8590C] transition-colors">
                Generator Sizing Tool
              </h3>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
                Check appliances in your home and calculate the exact kVA rating needed.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#1F2328] p-5 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#E8590C] dark:hover:border-[#E8590C] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-[#E8590C]/30">
                <Icon name="truck" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] group-hover:text-[#E8590C] transition-colors">
                Relocation &amp; Van Haulage
              </h3>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
                Apartment moving cost calculator with truck sizing and distance rates.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#1F2328] p-5 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#E8590C] dark:hover:border-[#E8590C] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-[#E8590C]/30">
                <Icon name="calendar" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] group-hover:text-[#E8590C] transition-colors">
                Maintenance Planner
              </h3>
              <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
                Preventive servicing cycles for inverters, ACs, and water pumps.
              </p>
            </Link>
          </div>
        </div>
      </Section>

      {/* 5. Why Customers Use EasyLife */}
      <Section id="why-customers" tone="white">
        <SectionHeading
          id="why-heading"
          eyebrow="Built for Trust"
          title="Why Customers Choose EasyLife"
          description="We take the stress out of home repairs with verified pros, clear prices, and safe payments."
        />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {customerBenefits.map((b) => (
            <FeatureCard
              key={b.title}
              icon={b.icon}
              title={b.title}
              description={b.description}
            />
          ))}
        </div>
      </Section>

      {/* 6. Benefits for Professionals */}
      <Section id="for-professionals" tone="navy">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-2xl">
            <SectionHeading
              id="pros-heading"
              eyebrow="For Skilled Technicians"
              title="Grow Your Trade Business with Confidence"
              description="Join our network of verified technicians. Get steady jobs and guaranteed payments."
              tone="dark"
            />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proBenefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl bg-[#15181C] border border-[#2E343B] p-5 shadow-xs"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#E8590C]/20 border border-[#E8590C]/40 text-[#E8590C] flex items-center justify-center mb-3.5">
                    <Icon name={b.icon} className="h-5 w-5" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">{b.title}</h4>
                  <p className="mt-2 text-sm sm:text-base text-[#C3C8CF] leading-relaxed">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink href="/become-a-professional" size="lg">
                Join as a Professional
              </ButtonLink>
            </div>
          </div>

          <div className="lg:max-w-md w-full bg-[#15181C] border border-[#2E343B] rounded-3xl p-7 sm:p-9 shadow-lg">
            <h3 className="text-xl font-bold text-white">
              Vetting Requirements
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#C3C8CF] leading-relaxed">
              To protect both customers and great technicians, every applicant
              must provide:
            </p>
            <ul className="mt-5 space-y-3.5 text-sm sm:text-base text-[#C3C8CF]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#E8590C] font-bold">✓</span>
                <span>Valid Government ID (NIN, Driver’s Licence, or Voter’s Card)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E8590C] font-bold">✓</span>
                <span>Trade certificate or formal apprenticeship credential</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E8590C] font-bold">✓</span>
                <span>Verifiable workshop or operating address</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E8590C] font-bold">✓</span>
                <span>Two credible guarantors or trade association reference</span>
              </li>
            </ul>
            <div className="mt-6 pt-5 border-t border-[#2E343B]">
              <Link
                href="/verification-policy"
                className="text-sm font-semibold text-[#E8590C] hover:text-white underline underline-offset-4 transition-colors"
              >
                Read our complete Professional Verification Policy →
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* 7. Business Maintenance Solutions */}
      <Section id="business-solutions" tone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              id="business-heading"
              eyebrow="Commercial & Facility Management"
              title="Keep Your Business Running Smoothly"
              description="Manage your properties, track equipment, and schedule repairs from one simple dashboard."
            />
            <div className="mt-7 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E8590C]/30 text-[#E8590C] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="building" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    Track Your Equipment
                  </h4>
                  <p className="text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] mt-1 leading-relaxed">
                    Track generators, ACs, and water pumps across all your locations in one place.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E8590C]/30 text-[#E8590C] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="calendar" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    Routine Maintenance
                  </h4>
                  <p className="text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] mt-1 leading-relaxed">
                    Avoid costly breakdowns with automatic servicing reminders and regular checkups.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#FCEBDD] dark:bg-[#1F2328] border border-[#E8590C]/30 text-[#E8590C] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="file-text" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3]">
                    One Monthly Invoice
                  </h4>
                  <p className="text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] mt-1 leading-relaxed">
                    No more paper receipts. Get one clean, tax-ready statement each month.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/business-hub">
                Explore Business Hub
              </ButtonLink>
              <ButtonLink href="/contact?topic=business_solutions" variant="outline">
                Contact Facility Desk
              </ButtonLink>
            </div>
          </div>

          <div className="bg-[#FAF7F3] dark:bg-[#1F2328] border border-[#E6E0D8] dark:border-[#2E343B] rounded-3xl p-7 sm:p-9">
            <h4 className="text-sm font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider mb-4">
              Typical Business Equipment Managed
            </h4>
            <div className="space-y-3.5">
              {[
                { name: "Heavy Duty Diesel Generators (20kVA - 500kVA)", cycle: "Every 250 runtime hours" },
                { name: "Commercial Cassette & VRF Air Conditioners", cycle: "Monthly coil & filter checks" },
                { name: "Solar Inverter Arrays & Industrial Batteries", cycle: "Quarterly cell balancing" },
                { name: "Commercial Water Treatment & Borehole Rigging", cycle: "Bimonthly filtration service" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-white dark:bg-[#1F2328] rounded-xl p-4 sm:p-5 border border-[#E6E0D8] dark:border-[#2E343B] flex items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3]">{item.name}</p>
                    <p className="text-xs sm:text-sm text-[#4A525C] dark:text-[#C3C8CF] mt-0.5">Routine schedule: {item.cycle}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-[#FCEBDD] text-[#E8590C] px-3 py-1 rounded-full border border-[#E8590C]/30">
                    Covered
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Trust and Verification Explanation */}
      <Section id="trust-and-safety" tone="cream">
        <SectionHeading
          id="trust-heading"
          eyebrow="Uncompromising Standards"
          title="Safety and Protection at Every Step"
          description="How EasyLife protects both customers and technicians on every job."
          align="center"
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center font-bold text-base border border-[#E8590C]/30">
              01
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
              Verified Technicians
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
              We check government ID, physical address, and trade skills before any pro can take jobs.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center font-bold text-base border border-[#E8590C]/30">
              02
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
              Safe Escrow Payments
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
              Your money is held safely until the job is done. We only release funds after you inspect the work.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#FCEBDD] text-[#E8590C] flex items-center justify-center font-bold text-base border border-[#E8590C]/30">
              03
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#1F2328] dark:text-[#FAF7F3]">
              Local Support Teams
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#4A525C] dark:text-[#C3C8CF] leading-relaxed">
              Our local teams in Port Harcourt, Lagos, and Abuja help with questions and ensure fast support.
            </p>
          </div>
        </div>
      </Section>

      {/* 9. Frequently Asked Questions */}
      <Section id="faq" tone="white">
        <SectionHeading
          id="faq-heading"
          eyebrow="Got Questions?"
          title="Frequently Asked Questions"
          description="Everything you need to know about booking, payments, verification, and business services."
          align="center"
        />
        <div className="mt-10 max-w-3xl mx-auto">
          <FaqList items={homepageFaqs} />
          <div className="mt-7 text-center">
            <p className="text-base text-[#4A525C] dark:text-[#C3C8CF]">
              Have another question? Visit our{" "}
              <Link
                href="/help"
                className="text-[#E8590C] font-semibold hover:underline"
              >
                Help Centre
              </Link>{" "}
              or{" "}
              <Link
                href="/contact"
                className="text-[#E8590C] font-semibold hover:underline"
              >
                Contact Support
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      {/* 10. Call-to-Action Section */}
      <CtaBanner
        id="home-cta"
        title="Ready to Get Started?"
        description="Book a repair, post a job, or register your business in minutes."
        primary={{ label: "Find Services", href: "/services" }}
        secondary={{ label: "Post a Need", href: "/post-a-need" }}
      />
    </PublicShell>
  );
}
