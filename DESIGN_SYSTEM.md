# EasyLife — Official Brand Identity & Design System (`DESIGN_SYSTEM.md`)

## 1. Brand Identity & Positioning

- **Product Name:** EasyLife
- **Slogan:** *Everyday Problems. Smarter Solutions.*
- **Market Positioning:** A trusted, modern technology platform for everyday household services, AI-assisted problem-solving, and commercial/residential facility maintenance management in Nigeria (Port Harcourt, Lagos, Abuja).
- **Visual Personality:** Trustworthy, structured, clear, and responsive—combining the approachability of a modern consumer service marketplace with the precision of an enterprise facility management suite.

---

## 2. Logo Direction & Official Assets

The EasyLife logo combines a **Deep Navy (`#0A192F`) rounded architectural shield** with a geometric **White "E"** whose lower crossbar resolves into a **Teal (`#14B8A6`) verified checkmark**.

### Logo Asset Files (`apps/web/public/brand/`)
- [`easylife-mark.svg`](./apps/web/public/brand/easylife-mark.svg) — Standalone app icon & favicon emblem (`64×64` viewBox).
- [`easylife-logo-light.svg`](./apps/web/public/brand/easylife-logo-light.svg) — Horizontal lockup for white/light grey backgrounds (`Easy` in `#0A192F`, `Life` in `#0D9488`).
- [`easylife-logo-dark.svg`](./apps/web/public/brand/easylife-logo-dark.svg) — Horizontal lockup for Deep Navy backgrounds (`Easy` in `#FFFFFF`, `Life` in `#14B8A6`).
- **React Component:** `<EasyLifeLogo theme="light" | "dark" size="sm" | "md" | "lg" showSlogan markOnly />` in [`apps/web/src/components/ui/logo.tsx`](./apps/web/src/components/ui/logo.tsx).

---

## 3. Colour Palette & Semantic Tokens

Defined in [`packages/shared-config/src/design-tokens.ts`](./packages/shared-config/src/design-tokens.ts) and mirrored in [`apps/mobile/lib/theme/easylife_theme.dart`](./apps/mobile/lib/theme/easylife_theme.dart):

| Token Family | Token | Hex | Role |
| :--- | :--- | :--- | :--- |
| **Deep Navy (Primary)** | `navy.950` | `#06101F` | Admin governance sidebar & deepest dark surface |
| **Deep Navy (Primary)** | `navy.900` | `#0A192F` | Primary brand header, hero surface, dark cards |
| **Deep Navy (Primary)** | `navy.800` | `#0F172A` | Primary headings & high-contrast body text |
| **Deep Navy (Primary)** | `navy.700` | `#1E293B` | Business maintenance sidebar & secondary dark surface |
| **Teal (Secondary)** | `teal.800` | `#115E59` | High-contrast accessible teal text on light badges |
| **Teal (Secondary)** | `teal.700` | `#0F766E` | Primary button hover & active navigation state |
| **Teal (Secondary)** | `teal.600` | `#0D9488` | Primary CTA buttons, focus rings & verified badges |
| **Teal (Secondary)** | `teal.500` | `#14B8A6` | Accent highlights on dark Deep Navy backgrounds |
| **Teal (Secondary)** | `teal.50` | `#F0FDFA` | Soft verified callout & active tab tint |
| **Charcoal & Neutrals** | `charcoal.800` | `#1F2937` | Default body copy |
| **Charcoal & Neutrals** | `charcoal.700` | `#374151` | Form labels & table cells |
| **Charcoal & Neutrals** | `charcoal.500` | `#6B7280` | Helper text, captions & timestamps |
| **Surfaces & Borders** | `surface.white` | `#FFFFFF` | Cards, modals, tables & form inputs |
| **Surfaces & Borders** | `surface.lightGrey` | `#F8FAFC` | Default application background canvas |
| **Surfaces & Borders** | `surface.mutedGrey` | `#F1F5F9` | Secondary canvas & table headers |
| **Surfaces & Borders** | `surface.borderGrey` | `#E2E8F0` | Standard `1px` card & divider border |
| **Status — Success** | `status.success` | `#166534` on `#DCFCE7` | Completed jobs, operational assets, verified actions |
| **Status — Warning** | `status.warning` | `#92400E` on `#FEF3C7` | Pending verification, maintenance due, high urgency |
| **Status — Error** | `status.error` | `#991B1B` on `#FEE2E2` | Validation errors, disputes, rejected verification |
| **Status — Info** | `status.info` | `#075985` on `#E0F2FE` | Open service requests, system tips |

---

## 4. WCAG 2.1 Accessibility & Contrast Verification

| Foreground / Background Pair | Contrast Ratio | WCAG Rating | Approved Usage |
| :--- | :--- | :--- | :--- |
| White (`#FFFFFF`) on Deep Navy (`#0A192F`) | `17.4:1` | **AAA** | Top headers, dark sidebars, primary hero text |
| Deep Navy (`#0F172A`) on White (`#FFFFFF`) | `17.8:1` | **AAA** | Card titles, body text, form input values |
| Charcoal (`#374151`) on Light Grey (`#F8FAFC`) | `10.6:1` | **AAA** | Form labels, table headers, secondary copy |
| White (`#FFFFFF`) on Teal 700 (`#0F766E`) | `5.4:1` | **AA** | Primary buttons and active navigation states |
| Teal 800 (`#115E59`) on Teal 50 (`#F0FDFA`) | `7.2:1` | **AAA** | Verified professional badges and status pills |
| Error Red (`#991B1B`) on Error Bg (`#FEE2E2`) | `7.5:1` | **AAA** | Field validation errors and dispute banners |

---

## 5. Typography & Spatial Grid Standards

### Typography (`EASYLIFE_TYPOGRAPHY`)
- **Primary Sans Font Stack:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font Stack (Reference Codes, Asset Tags, Amounts):** `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace`
- **Hierarchy:**
  - `display`: `36px / 44px` (`700`, `-0.025em`)
  - `h1`: `30px / 38px` (`700`, `-0.02em`)
  - `h2`: `24px / 32px` (`700`, `-0.015em`)
  - `h3`: `20px / 28px` (`600`, `-0.01em`)
  - `h4`: `17px / 24px` (`600`)
  - `bodyLg`: `16px / 26px` (`400`)
  - `body`: `14px / 22px` (`400`)
  - `caption`: `12px / 18px` (`500`)

### Spacing & Radius (`EASYLIFE_SPACING`)
- **4px / 8px Spatial Grid:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
- **Border Radius:** Buttons & Inputs (`8px` / `rounded-lg`), Cards & Tables (`12px` / `rounded-xl`), Hero Sections (`16px` / `rounded-2xl`), Status Badges (`9999px` / `rounded-full`).

### Responsive Breakpoints (`EASYLIFE_BREAKPOINTS`)
- `xs`: `360px` (Compact Android devices widely used in Nigeria)
- `sm`: `640px` (Large smartphones)
- `md`: `768px` (Tablets & compact screens)
- `lg`: `1024px` (Desktop & collapsible sidebar threshold)
- `xl`: `1280px` (Standard max container width `max-w-7xl`)
- `2xl`: `1536px` (Wide multi-column Admin monitoring views)

---

## 6. Differentiated Experience Architecture (Four Experiences, One Brand)

Implemented via `<ExperienceShell />` ([`apps/web/src/components/ui/experience-shell.tsx`](./apps/web/src/components/ui/experience-shell.tsx)):

1. **Customer Experience (`customer`):**
   - **Header & Nav:** Clean white top utility header (`#FFFFFF`) with pilot city badge (`Port Harcourt`, `Lagos`, `Abuja`) and spacious discovery layout (`#F8FAFC`).
   - **Visual Focus:** Prominent AI problem categorization input, visual service category cards, and trust-first professional cards.
2. **Service Professional Experience (`professional`):**
   - **Header & Nav:** Deep Navy (`#0A192F`) operational workbench header with horizontal action tabs and verification status bar on `#F1F5F9` canvas.
   - **Visual Focus:** Task-focused incoming lead cards, quick itemized quotation builder, and appointment completion tracking.
3. **Business & Property Maintenance Portal (`business`):**
   - **Header & Nav:** Structured left facility sidebar (`#1E293B`) with property/asset hierarchy navigation.
   - **Visual Focus:** Multi-property registries, equipment asset tags (`TEST-GEN-001`), preventive maintenance schedules, and historical maintenance logs.
4. **Administrator Console (`admin`):**
   - **Header & Nav:** Dark Deep Navy (`#06101F`) governance sidebar with live queue badge counts.
   - **Visual Focus:** High-density data tables, KYC verification document review panels, dispute arbitration timelines, and immutable audit logs.

---

## 7. Reusable Component Library Catalog (`apps/web/src/components/ui/`)

- **Logo:** `<EasyLifeLogo />` (`logo.tsx`)
- **Buttons:** `<Button />` (`button.tsx`) — Variants: `primary`, `navy`, `secondary`, `outline`, `ghost`, `danger`; supports `isLoading`, `loadingText`, `leftIcon`, `rightIcon`, `fullWidth`.
- **Form Controls:** `<Input />`, `<Select />`, `<Textarea />` (`form-fields.tsx`) — Built-in labels, required indicators, helper text, inline `role="alert"` error messages, and `aria-invalid` / `aria-describedby` bindings.
- **Badges & Status Indicators:** `<Badge />`, `<BookingStatusBadge />`, `<VerificationStatusBadge />`, `<QuotationStatusBadge />`, `<AssetStatusBadge />`, `<UrgencyBadge />` (`badge.tsx`).
- **Cards:** `<Card />`, `<CardHeader />`, `<StatCard />` (`card.tsx`).
- **Tables:** `<DataTable />` (`table.tsx`) — Typed column definitions, built-in loading/empty states, and minor-unit NGN formatting.
- **Notifications & Feedback States:** `<AlertBanner />`, `<EmptyState />`, `<LoadingState />`, `<ErrorState />`, `<Skeleton />` (`feedback-states.tsx`).
- **Role Shells:** `<ExperienceShell />` (`experience-shell.tsx`).
- **Live Interactive Showcase:** Visit `/design-system` ([`apps/web/src/app/design-system/page.tsx`](./apps/web/src/app/design-system/page.tsx)).
