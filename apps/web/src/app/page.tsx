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
      title: "Tell Us What Needs Fixing",
      description:
        "Select a category or describe your issue. Add photos, location in Port Harcourt, Lagos, or Abuja, and preferred timing.",
    },
    {
      title: "Receive Transparent Quotes",
      description:
        "Vetted professionals review your request and send itemised quotes detailing parts, labour, and expected completion time.",
    },
    {
      title: "Secure Escrow Funding",
      description:
        "Accept the quote that fits your budget. Your payment is held securely in escrow and is not released until the job is done.",
    },
    {
      title: "Inspect & Release Payment",
      description:
        "Once work is completed to your satisfaction, confirm sign-off to release funds and leave an honest verified rating.",
    },
  ];

  const customerBenefits = [
    {
      icon: "shield" as const,
      title: "Strictly Vetted Professionals",
      description:
        "Every technician submits government ID, verified proof of address, trade competence credentials, and credible guarantors.",
    },
    {
      icon: "lock" as const,
      title: "Safe Escrow Protection",
      description:
        "No paying 100% upfront to unvetted artisans. Your money stays locked in escrow until you inspect and approve the completed job.",
    },
    {
      icon: "file-text" as const,
      title: "Itemised, Transparent Pricing",
      description:
        "Eliminate surprise billings. Quotes clearly separate materials cost from technician labour before work begins.",
    },
    {
      icon: "clock" as const,
      title: "Prompt Local Response",
      description:
        "Available in our pilot locations across Port Harcourt, Lagos, and Abuja with responsive customer support and dispute resolution.",
    },
  ];

  const proBenefits = [
    {
      icon: "briefcase" as const,
      title: "Steady Stream of Genuine Jobs",
      description:
        "Stop chasing leads on street corners. Get matched directly with homeowners, facility managers, and businesses that need your skills.",
    },
    {
      icon: "check" as const,
      title: "Guaranteed Payouts on Completion",
      description:
        "Never argue about getting paid after doing great work. The customer's funds are secured before you pick up your tools.",
    },
    {
      icon: "file-text" as const,
      title: "Professional Digital Invoicing",
      description:
        "Send structured itemised quotations directly from your phone. Build a digital portfolio and verified reputation.",
    },
    {
      icon: "users" as const,
      title: "Fair Dispute Resolution",
      description:
        "Our local operations desk ensures fair mediation with photo and job milestone evidence if misunderstandings arise.",
    },
  ];

  const homepageFaqs = [
    {
      question: "Which cities does EasyLife currently operate in?",
      answer:
        "EasyLife is currently deployed across three major Nigerian pilot markets: Port Harcourt (Rivers State), Lagos State, and Abuja (FCT). Service coverage is being expanded systematically across residential neighbourhoods and commercial districts.",
    },
    {
      question: "How are trade professionals verified?",
      answer:
        "Every artisan and technician undergoes a 3-tier vetting process: government identity validation (NIN, Driver’s Licence, or Voter’s Card), in-person verification of their workshop or residential address, and practical competence review with guarantor sign-off.",
    },
    {
      question: "How does the escrow payment system protect customers?",
      answer:
        "When you accept a quotation, your payment is held in a protected escrow account. The funds are only released to the professional after you inspect the completed work, approve the milestone, and provide your 4-digit completion PIN.",
    },
    {
      question: "Can businesses manage multiple properties on EasyLife?",
      answer:
        "Yes. EasyLife Business allows property managers, corporate offices, clinics, and hospitality businesses to register multiple facilities, catalog maintainable equipment (generators, HVAC, solar, inverters), and schedule preventive servicing.",
    },
    {
      question: "What happens if I'm not satisfied with a job?",
      answer:
        "You can request immediate rework through the platform or file a formal dispute with photo evidence. Escrow funds remain frozen while our regional operations resolution desk inspects the case and issues a binding resolution.",
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
          eyebrow="Accredited Trade Services"
          title="Popular Everyday Services Across Our Hubs"
          description="Browse vetted professionals in Port Harcourt, Lagos, and Abuja. Fixed quotes, vetted pros, and escrow-protected milestones."
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
              className="group p-5 rounded-2xl border border-slate-200/90 dark:border-[#163654] bg-[#F8FAFA] dark:bg-[#0D223A] hover:bg-white dark:hover:bg-[#102D4C] hover:border-[#24989A] dark:hover:border-[#24989A] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-teal-100 dark:border-teal-900/60">
                  <Icon name={cat.icon} className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#24989A] dark:group-hover:text-[#5CD3D5] transition-colors leading-snug">
                  {cat.title}
                </h3>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-between">
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
          eyebrow="Simple & Transparent"
          title="How EasyLife Works for Customers"
          description="A clear 4-step process built around safety, fair pricing, and escrow accountability."
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
            See the Complete Process for Pros &amp; Businesses →
          </ButtonLink>
        </div>
      </Section>

      {/* 4b. Free Everyday Tools & Calculators Showcase */}
      <Section id="free-tools-preview" tone="white">
        <div className="rounded-3xl border border-slate-200/90 dark:border-[#163654] bg-[#F8FAFA] dark:bg-[#0D223A] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#24989A] dark:text-[#5CD3D5] uppercase">
                100% Free Everyday Utilities
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                Smart Calculators for Nigerian Homes &amp; Businesses
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Get instant estimates with zero sign-up required. Benchmark repair costs, calculate generator load sizing, and plan maintenance schedules.
              </p>
            </div>
            <ButtonLink href="/tools" size="md" className="shrink-0">
              Open All Free Tools &rarr;
            </ButtonLink>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tools"
              className="bg-white dark:bg-[#071526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#24989A] dark:hover:border-[#24989A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon name="receipt" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#24989A] dark:group-hover:text-[#5CD3D5] transition-colors">
                Service Cost Estimator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Instant price benchmarks for AC, generator, plumbing &amp; electrical repairs by city.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#071526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#24989A] dark:hover:border-[#24989A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon name="zap" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#24989A] dark:group-hover:text-[#5CD3D5] transition-colors">
                Generator Sizing Tool
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Check appliances in your home and calculate the exact kVA rating needed.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#071526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#24989A] dark:hover:border-[#24989A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon name="truck" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#24989A] dark:group-hover:text-[#5CD3D5] transition-colors">
                Relocation &amp; Van Haulage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apartment moving cost calculator with truck sizing and distance rates.
              </p>
            </Link>

            <Link
              href="/tools"
              className="bg-white dark:bg-[#071526] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#24989A] dark:hover:border-[#24989A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#24989A] dark:text-[#5CD3D5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon name="calendar" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#24989A] dark:group-hover:text-[#5CD3D5] transition-colors">
                Maintenance Planner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
          title="Why Households Rely on EasyLife"
          description="We solve the persistent problems of artisanal unreliability, opaque pricing, and upfront payment risks."
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
              title="Grow Your Trade Business with Dignity & Security"
              description="Join an organised network of electricians, plumbers, HVAC technicians, and generator engineers. Earn predictable income without chasing unpaid balances."
              tone="dark"
            />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proBenefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl bg-[#0D282E] border border-[#24989A]/30 p-5 shadow-xs"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#24989A]/20 border border-[#24989A]/40 text-[#24989A] flex items-center justify-center mb-3.5">
                    <Icon name={b.icon} className="h-5 w-5" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">{b.title}</h4>
                  <p className="mt-2 text-sm sm:text-base text-[#DAE7E7] leading-relaxed">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink href="/become-a-professional" size="lg">
                Learn About Professional Onboarding
              </ButtonLink>
            </div>
          </div>

          <div className="lg:max-w-md w-full bg-[#0D282E] border border-[#24989A]/30 rounded-3xl p-7 sm:p-9 shadow-lg">
            <h3 className="text-xl font-bold text-white">
              Vetting Requirements
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#DAE7E7] leading-relaxed">
              To protect both customers and great technicians, every applicant
              must provide:
            </p>
            <ul className="mt-5 space-y-3.5 text-sm sm:text-base text-[#DAE7E7]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#24989A] font-bold">✓</span>
                <span>Valid Government ID (NIN, Driver’s Licence, or Voter’s Card)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#24989A] font-bold">✓</span>
                <span>Trade certificate or formal apprenticeship credential</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#24989A] font-bold">✓</span>
                <span>Verifiable workshop or operating address</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#24989A] font-bold">✓</span>
                <span>Two credible guarantors or trade association reference</span>
              </li>
            </ul>
            <div className="mt-6 pt-5 border-t border-[#24989A]/20">
              <Link
                href="/verification-policy"
                className="text-sm font-semibold text-[#24989A] hover:text-white underline underline-offset-4 transition-colors"
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
              title="Keep Your Operations Running Smoothly"
              description="Whether you run a clinic, restaurant, school, or manage residential estates, EasyLife gives your team complete visibility over assets and maintenance."
            />
            <div className="mt-7 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 border border-[#DAE7E7] dark:border-teal-800 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="building" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#154752] dark:text-white">
                    Multi-Property Asset Tracking
                  </h4>
                  <p className="text-sm sm:text-base text-[#68797C] dark:text-slate-300 mt-1 leading-relaxed">
                    Track generators, commercial ACs, cold rooms, and borehole pumps across multiple branches from one central dashboard.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 border border-[#DAE7E7] dark:border-teal-800 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="calendar" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#154752] dark:text-white">
                    Preventive Maintenance Schedules
                  </h4>
                  <p className="text-sm sm:text-base text-[#68797C] dark:text-slate-300 mt-1 leading-relaxed">
                    Avoid expensive emergency breakdowns with automated servicing reminders and contracted routine visits.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 border border-[#DAE7E7] dark:border-teal-800 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="file-text" className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#154752] dark:text-white">
                    Consolidated Monthly Invoicing
                  </h4>
                  <p className="text-sm sm:text-base text-[#68797C] dark:text-slate-300 mt-1 leading-relaxed">
                    Eliminate chaotic paper receipts. Receive clear VAT-compliant statements with full audit trails.
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

          <div className="bg-[#F3F8F8] dark:bg-[#0D223A] border border-[#DAE7E7] dark:border-[#163654] rounded-3xl p-7 sm:p-9">
            <h4 className="text-sm font-bold text-[#154752] dark:text-white uppercase tracking-wider mb-4">
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
                  className="bg-white dark:bg-[#071526] rounded-xl p-4 sm:p-5 border border-[#DAE7E7] dark:border-[#163654] flex items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#1F2F34] dark:text-white">{item.name}</p>
                    <p className="text-xs sm:text-sm text-[#68797C] dark:text-slate-300 mt-0.5">Routine schedule: {item.cycle}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-[#F3F8F8] dark:bg-teal-950/60 text-[#154752] dark:text-[#5CD3D5] px-3 py-1 rounded-full border border-[#24989A]/30 dark:border-teal-800">
                    Covered
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Trust and Verification Explanation */}
      <Section id="trust-and-safety" tone="grey">
        <SectionHeading
          id="trust-heading"
          eyebrow="Uncompromising Standards"
          title="Accountability at Every Step"
          description="How EasyLife builds real trust in a market often plagued by uncertainty."
          align="center"
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-[#DAE7E7] dark:border-[#163654] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center font-bold text-base border border-[#DAE7E7] dark:border-teal-800">
              01
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#154752] dark:text-white">
              Three-Tier Identity Verification
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#68797C] dark:text-slate-300 leading-relaxed">
              We physically verify identity, NIN, address, and artisan apprenticeship credentials before any technician can accept jobs on our platform.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-[#DAE7E7] dark:border-[#163654] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center font-bold text-base border border-[#DAE7E7] dark:border-teal-800">
              02
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#154752] dark:text-white">
              Escrow-Locked Milestone Payments
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#68797C] dark:text-slate-300 leading-relaxed">
              Your money is never sent directly to a technician upfront. It stays secure in escrow until you verify the work is completely done.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-[#DAE7E7] dark:border-[#163654] p-7 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-[#F3F8F8] dark:bg-teal-950/60 text-[#154752] dark:text-[#5CD3D5] flex items-center justify-center font-bold text-base border border-[#DAE7E7] dark:border-teal-800">
              03
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-[#154752] dark:text-white">
              Local Ground Operations Support
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#68797C] dark:text-slate-300 leading-relaxed">
              Our regional operations teams in Port Harcourt, Lagos, and Abuja actively monitor disputes, service quality, and rapid response.
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
            <p className="text-base text-[#68797C]">
              Have another question? Visit our{" "}
              <Link
                href="/help"
                className="text-[#24989A] font-semibold hover:underline"
              >
                Help Centre
              </Link>{" "}
              or{" "}
              <Link
                href="/contact"
                className="text-[#24989A] font-semibold hover:underline"
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
        title="Ready to Experience Smarter Service Delivery?"
        description="Whether you have an urgent electrical repair, need a trusted plumber, want to hire trade talent, or register your local business, EasyLife is ready."
        primary={{ label: "Find Services", href: "/services" }}
        secondary={{ label: "Post a Need", href: "/post-a-need" }}
      />
    </PublicShell>
  );
}
