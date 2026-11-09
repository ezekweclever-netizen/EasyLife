# EasyLife

> **Everyday Problems. Smarter Solutions.**

EasyLife is an AI-enabled everyday services marketplace and maintenance management platform built for Nigeria (initial pilot cities: **Port Harcourt**, **Lagos**, and **Abuja**).

It connects four unified experiences over a single central Supabase backend:
1. **Customer Application** — Household service discovery, AI problem categorization, service requests, quotations, appointments, messaging, and verified reviews.
2. **Service Professional Application** — Professional onboarding, identity/credential verification, incoming leads, quotation authoring, job scheduling, and completion tracking.
3. **Business & Property Maintenance Portal** — Multi-property management, equipment registries, preventive maintenance scheduling, and historical maintenance logs for SMBs, landlords, and facility managers.
4. **Administrator Dashboard** — Professional verification workflows, user & business oversight, service category management, dispute arbitration, and platform health monitoring.

---

## Repository Structure

```text
easylife/
├── apps/
│   ├── web/                  # Next.js (App Router) + TypeScript web platform
│   └── mobile/               # Flutter (Android & iOS) mobile application
├── packages/
│   ├── shared-types/         # Shared TypeScript domain interfaces, enums & constants
│   └── shared-config/        # Design tokens (Navy/Teal palette), tsconfig & shared constants
├── supabase/
│   ├── config.toml           # Supabase local development configuration
│   ├── migrations/           # Versioned PostgreSQL schema & RLS migrations
│   ├── functions/            # Supabase Edge Functions (if needed)
│   └── seed/                 # Development-only seed scripts (clearly isolated)
├── docs/                     # Product specs, ADR records, and technical documentation
├── scripts/                  # Environment verification and workspace utility scripts
├── ARCHITECTURE.md           # System architecture, security boundaries, and data flows
├── DEVELOPMENT_ROADMAP.md    # Staged incremental implementation plan
├── ENVIRONMENT_SETUP.md      # Local setup, environment variables, and execution guide
├── PROJECT_STATUS.md         # Current repository audit and stage completion tracker
├── package.json              # Root npm workspace configuration (JS/TS packages only)
└── .gitignore                # Git ignore rules for Node, Next.js, Flutter, and Supabase
```

> **Note on Monorepo Boundaries:** JavaScript/TypeScript packages (`apps/web`, `packages/shared-types`, `packages/shared-config`) are managed via npm workspaces. `apps/mobile` (Flutter/Dart) lives alongside `apps/web` in the repository for unified version control and documentation, without forcing Dart/Flutter into the Node.js workspace dependency tree.

---

## Quick Start

See [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md) for full prerequisite details and Windows PowerShell notes.

```powershell
# 1. Install JavaScript/TypeScript workspace dependencies
npm.cmd install

# 2. Verify environment setup
npm.cmd run check:env

# 3. Copy web environment template and populate your Supabase keys
Copy-Item apps/web/.env.example apps/web/.env.local

# 4. Run typecheck across shared packages and web app
npm.cmd run typecheck

# 5. Start the Next.js development server
npm.cmd run dev
```
