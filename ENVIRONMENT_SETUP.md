# EasyLife — Environment Setup & Execution Guide

This document provides exact instructions for setting up and running the EasyLife monorepo locally on Windows, macOS, or Linux.

---

## 1. Host Environment Audit & Prerequisites

| Tool | Required Version | Detected on Host (`2026-11-03`) | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.x` | `v24.15.0` | Installed and ready |
| **npm** | `>= 10.x` | Installed with Node | On Windows PowerShell, use `npm.cmd` (see note below) |
| **Git** | `>= 2.40` | `2.50.1.windows.1` | Installed and ready |
| **Supabase CLI** | `>= 1.180` | Run via `npx.cmd supabase` | Or install globally via Scoop/npm |
| **Flutter SDK** | `>= 3.22` (Dart `>= 3.4`) | Not currently in `PATH` | Required when building/running `apps/mobile` |

### Important Note for Windows PowerShell Users
By default, Windows PowerShell may block `.ps1` wrapper scripts (`npm.ps1 cannot be loaded because running scripts is disabled on this system`). You have two simple options:
1. Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` at the start of your PowerShell terminal session, **or**
2. Invoke `npm.cmd` and `npx.cmd` directly (all commands below use `npm.cmd` so they work out of the box regardless of ExecutionPolicy).

---

## 2. Environment Variables (`apps/web/.env.local`)

Copy the template file before starting the web app:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

### Variable Reference (Never Commit Real Secrets)

| Variable Name | Scope | Required for MVP | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Yes | Base URL of the web application (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Yes | Your Supabase public anonymous API key (enforced by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | Yes (Admin/Server) | Supabase service role key. **Never expose in client code.** |
| `OPENAI_API_KEY` | **Server Only** | Optional (AI) | OpenAI API key for AI problem categorization |
| `OPENAI_MODEL` | **Server Only** | Optional (AI) | Defaults to `gpt-4o-mini` |
| `RESEND_API_KEY` | **Server Only** | Optional (Email) | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | **Server Only** | Optional (Email) | Verified sender address |
| `PAYSTACK_SECRET_KEY` | **Server Only** | Future / Optional | Paystack secret key for payment processing |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client & Server | Future / Optional | Paystack public key |
| `FIREBASE_PROJECT_ID` | **Server Only** | Optional (Push) | Firebase project ID for FCM push notifications |
| `FIREBASE_CLIENT_EMAIL` | **Server Only** | Optional (Push) | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | **Server Only** | Optional (Push) | Firebase service account private key |

To verify which environment variables are configured without exposing their values in terminal logs, run:

```powershell
npm.cmd run check:env
```

---

## 3. Exact Setup & Execution Commands

### A. Install Dependencies
From the repository root (`c:\Users\HP\Documents\EasyLife`):

```powershell
npm.cmd install
```

### B. Verify Environment & Type Safety
```powershell
npm.cmd run check:env
npm.cmd run typecheck
```

### C. Start the Web Platform (`apps/web`)
```powershell
npm.cmd run dev
```
Open `http://localhost:3000` in your browser.

### D. Production Build Test (`apps/web`)
```powershell
npm.cmd run build
npm.cmd run start
```

### E. Supabase Local / Linked Workflow
```powershell
# Check Supabase CLI via npx
npx.cmd supabase --version

# Link to your remote Supabase project (when ready)
npx.cmd supabase link --project-ref <your-project-ref>
```

### F. Flutter Mobile Application (`apps/mobile`)
Once the Flutter SDK is added to your system `PATH`:
```powershell
cd apps/mobile
flutter pub get
flutter analyze
flutter run --dart-define=SUPABASE_URL=<your-url> --dart-define=SUPABASE_ANON_KEY=<your-anon-key>
```
