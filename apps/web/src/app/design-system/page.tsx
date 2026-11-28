import Link from "next/link";
import {
  ACCESSIBLE_COLOR_COMBINATIONS,
  EASYLIFE_BRAND,
  EASYLIFE_BREAKPOINTS,
  EASYLIFE_COLOR_PALETTE,
  EASYLIFE_EXPERIENCE_DESIGN_PROFILES,
  EASYLIFE_TYPOGRAPHY,
} from "@easylife/shared-config";
import { formatMinorUnits } from "@easylife/shared-types";
import {
  AlertBanner,
  AssetStatusBadge,
  BookingStatusBadge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EasyLifeLogo,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  QuotationStatusBadge,
  Select,
  Skeleton,
  StatCard,
  Textarea,
  UrgencyBadge,
  VerificationStatusBadge,
} from "@/components/ui";

interface SampleMaintenanceRow {
  id: string;
  reference: string;
  facility: string;
  assetName: string;
  city: string;
  costKobo: number;
  status: "scheduled" | "in_progress" | "completed";
}

const SAMPLE_TABLE_ROWS: readonly SampleMaintenanceRow[] = [
  {
    id: "1",
    reference: "EL-BK-20261104-PH01",
    facility: "Old GRA Commercial Plaza",
    assetName: "100kVA Standby Diesel Generator",
    city: "Port Harcourt",
    costKobo: 4500000, // ₦45,000.00
    status: "scheduled",
  },
  {
    id: "2",
    reference: "EL-BK-20261104-LG02",
    facility: "Victoria Island Office Block",
    assetName: "Central Split HVAC Unit #4",
    city: "Lagos",
    costKobo: 2800000, // ₦28,000.00
    status: "in_progress",
  },
  {
    id: "3",
    reference: "EL-BK-20261104-AB03",
    facility: "Maitama Residential Court",
    assetName: "Submersible Borehole Pump",
    city: "Abuja",
    costKobo: 3500000, // ₦35,000.00
    status: "completed",
  },
];

export default function DesignSystemShowcasePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#1F2328]">
      {/* Header */}
      <header className="bg-[#1F2328] text-white border-b border-[#1F2328]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <EasyLifeLogo theme="dark" size="sm" showSlogan />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-teal-300 hover:text-white px-3 py-1.5 rounded-lg border border-teal-800/70 bg-teal-950/50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* 1. Brand Identity & Logo Direction */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-[#1F2328]">
            EasyLife Official Design System
          </h1>
          <p className="mt-2 text-sm text-[#4B5563] max-w-3xl">
            {EASYLIFE_BRAND.slogan} — Unified visual language, accessible tokens,
            and reusable UI components shared across Next.js Web and Flutter
            Mobile (Android &amp; iOS).
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="md" className="flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-4">
                Light Surface Lockup
              </p>
              <EasyLifeLogo theme="light" size="lg" showSlogan />
            </Card>

            <Card
              variant="navy"
              padding="md"
              className="flex flex-col justify-between"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Deep Navy Surface Lockup
              </p>
              <EasyLifeLogo theme="dark" size="lg" showSlogan />
            </Card>

            <Card padding="md" className="flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-4">
                App Icon / Emblem Mark
              </p>
              <div className="flex items-center gap-4">
                <EasyLifeLogo theme="light" size="lg" markOnly />
                <EasyLifeLogo theme="dark" size="lg" markOnly />
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Experience Differentiation (4 Connected Experiences) */}
        <section>
          <h2 className="text-xl font-bold text-[#1F2328]">
            Differentiated Experience Profiles (One Brand, Four Tailored Layouts)
          </h2>
          <p className="text-sm text-[#4B5563] mt-1">
            Each role experience uses a purpose-built navigation pattern and
            information density rather than a generic clone layout.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(EASYLIFE_EXPERIENCE_DESIGN_PROFILES).map((prof) => (
              <Card key={prof.id} padding="md">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E8590C]">
                    {prof.id} experience
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#FAF7F3] text-[#4A525C] font-mono">
                    density: {prof.layoutDensity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1F2328]">
                  {prof.label}
                </h3>
                <p className="text-xs text-[#4B5563] mt-1">
                  <strong>Navigation:</strong> {prof.navigationPattern}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {prof.signatureCharacteristics.map((item) => (
                    <li
                      key={item}
                      className="text-xs text-[#374151] flex items-start gap-2"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#E8590C] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* 3. Colour Palette & WCAG Accessibility */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <CardHeader
              title="Core Brand & Supporting Colour Palette"
              subtitle="Deep Navy, Teal, White, Light Grey, Charcoal & Status Tokens"
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {Object.entries(EASYLIFE_COLOR_PALETTE.navy).map(([shade, hex]) => (
                <div
                  key={`navy-${shade}`}
                  className="p-3 rounded-lg border border-[#E6E0D8]"
                >
                  <div
                    className="h-8 w-full rounded mb-2"
                    style={{ backgroundColor: hex }}
                  />
                  <p className="font-semibold">Navy {shade}</p>
                  <p className="font-mono text-[#6B7280]">{hex}</p>
                </div>
              ))}
              {Object.entries(EASYLIFE_COLOR_PALETTE.teal).map(([shade, hex]) => (
                <div
                  key={`teal-${shade}`}
                  className="p-3 rounded-lg border border-[#E6E0D8]"
                >
                  <div
                    className="h-8 w-full rounded mb-2 border border-black/5"
                    style={{ backgroundColor: hex }}
                  />
                  <p className="font-semibold">Teal {shade}</p>
                  <p className="font-mono text-[#6B7280]">{hex}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardHeader
              title="WCAG 2.1 Accessible Colour Combinations"
              subtitle="Verified contrast ratios for readability across web and mobile"
            />
            <div className="mt-4 space-y-3">
              {ACCESSIBLE_COLOR_COMBINATIONS.map((combo) => (
                <div
                  key={combo.pair}
                  className="p-3 rounded-lg bg-[#FAF7F3] border border-[#E6E0D8] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#1F2328]">
                      {combo.pair}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      {combo.usage}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] text-xs font-bold">
                      {combo.wcagLevel} ({combo.contrastRatio})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* 4. Buttons & Status Indicators */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <CardHeader
              title="Buttons & Interactive States"
              subtitle="Primary Teal, Deep Navy, Secondary, Outline, Ghost, Danger & Loading"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="navy">Deep Navy</Button>
              <Button variant="secondary">Secondary Teal</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading loadingText="Submitting...">
                Submit
              </Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </Card>

          <Card padding="md">
            <CardHeader
              title="Domain Status Indicators & Badges"
              subtitle="Semantic badges for bookings, verification, quotations, assets & urgency"
            />
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <BookingStatusBadge status="open" />
                <BookingStatusBadge status="quoted" />
                <BookingStatusBadge status="scheduled" />
                <BookingStatusBadge status="in_progress" />
                <BookingStatusBadge status="completed" />
                <BookingStatusBadge status="disputed" />
              </div>
              <div className="flex flex-wrap gap-2">
                <VerificationStatusBadge status="approved" />
                <VerificationStatusBadge status="pending" />
                <VerificationStatusBadge status="rejected" />
                <QuotationStatusBadge status="accepted" />
                <AssetStatusBadge status="operational" />
                <AssetStatusBadge status="needs_maintenance" />
                <UrgencyBadge urgency="emergency" />
              </div>
            </div>
          </Card>
        </section>

        {/* 5. Form Elements */}
        <section>
          <Card padding="md">
            <CardHeader
              title="Validated Form Controls"
              subtitle="Accessible labels, helper guidance, and field-level validation error states"
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                id="demo-title"
                label="Service Request Title"
                placeholder="e.g. Borehole pump not pumping water"
                helperText="Be specific so verified technicians can quote accurately."
                required
              />
              <Select
                id="demo-city"
                label="Pilot City"
                required
                defaultValue="Port Harcourt"
                options={[
                  { value: "Port Harcourt", label: "Port Harcourt, Rivers State" },
                  { value: "Lagos", label: "Lagos, Lagos State" },
                  { value: "Abuja", label: "Abuja, FCT" },
                ]}
              />
              <Input
                id="demo-phone-error"
                label="Phone Number"
                defaultValue="080123"
                error="Enter a valid Nigerian phone number (e.g. +2348030000000)."
                required
              />
              <div className="md:col-span-3">
                <Textarea
                  id="demo-description"
                  label="Describe the Problem (AI Categorization Ready)"
                  rows={3}
                  placeholder="Describe what happened, when it started, and any equipment brand/model..."
                />
              </div>
            </div>
          </Card>
        </section>

        {/* 6. Cards & Responsive Tables */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Service Requests"
              value="14"
              subtext="Port Harcourt • Lagos • Abuja"
              accent="teal"
            />
            <StatCard
              label="Verified Professionals"
              value="100% KYC Checked"
              subtext="Approved by Admin Audit"
              accent="navy"
            />
            <StatCard
              label="Scheduled Maintenance"
              value="6 Due This Week"
              subtext="Across 3 Commercial Properties"
              accent="warning"
            />
            <StatCard
              label="Open Disputes"
              value="0 Active"
              subtext="All jobs within SLA"
              accent="teal"
            />
          </div>

          <DataTable
            caption="Sample Facility & Marketplace Bookings"
            getRowKey={(r) => r.id}
            rows={SAMPLE_TABLE_ROWS}
            columns={[
              {
                key: "reference",
                header: "Booking Ref",
                render: (r) => (
                  <span className="font-mono text-xs font-semibold text-[#1F2328]">
                    {r.reference}
                  </span>
                ),
              },
              {
                key: "facility",
                header: "Property / Facility",
                render: (r) => <span className="font-medium">{r.facility}</span>,
              },
              {
                key: "asset",
                header: "Equipment / Service",
                render: (r) => r.assetName,
              },
              {
                key: "city",
                header: "City",
                render: (r) => r.city,
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <BookingStatusBadge status={r.status} />,
              },
              {
                key: "cost",
                header: "Agreed Amount",
                align: "right",
                render: (r) => (
                  <span className="font-semibold">
                    {formatMinorUnits(r.costKobo, "NGN")}
                  </span>
                ),
              },
            ]}
          />
        </section>

        {/* 7. Notifications, Loading, Empty & Error States */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F2328]">
            Notifications, Empty, Loading &amp; Error States (Rule 14)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertBanner
              tone="info"
              title="AI Problem Categorization Available"
              description="Describe your household or facility issue in plain English and EasyLife will suggest the right service category and urgency."
            />
            <AlertBanner
              tone="success"
              title="Quotation Accepted & Scheduled"
              description="Confirmed via atomic PostgreSQL transaction (Reference: EL-BK-20261104-PH01)."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EmptyState
              title="No quotations received yet"
              description="Verified professionals in Port Harcourt have been notified and will submit itemized quotations shortly."
            />
            <div className="space-y-3">
              <LoadingState label="Fetching verified professionals..." />
              <Card padding="sm">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">
                  Skeleton Placeholders
                </p>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            </div>
            <ErrorState
              title="Unable to submit quotation"
              message="Your professional verification is currently Pending Review. Only approved professionals can submit quotations."
              requestId="req_sec_rls_004"
            />
          </div>
        </section>

        {/* 8. Typography & Responsive Breakpoints Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <CardHeader
              title="Typography Scale"
              subtitle="Clean geometric hierarchy for high legibility"
            />
            <div className="mt-4 space-y-2 text-xs">
              {Object.entries(EASYLIFE_TYPOGRAPHY.scale).map(([name, spec]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-1.5 border-b border-[#FAF7F3]"
                >
                  <span className="font-semibold uppercase text-[#1F2328]">
                    {name}
                  </span>
                  <span className="font-mono text-[#6B7280]">
                    size: {spec.fontSize} • line: {spec.lineHeight} • weight:{" "}
                    {spec.fontWeight}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardHeader
              title="Responsive Breakpoints"
              subtitle="Mobile-first from 360px Nigerian Android screens up to 1536px Admin displays"
            />
            <div className="mt-4 space-y-2 text-xs">
              {Object.entries(EASYLIFE_BREAKPOINTS).map(([bp, px]) => (
                <div
                  key={bp}
                  className="flex items-center justify-between py-1.5 border-b border-[#FAF7F3]"
                >
                  <span className="font-mono font-bold text-[#E8590C]">
                    {bp}
                  </span>
                  <span className="font-mono text-[#1F2328]">{px}px</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
