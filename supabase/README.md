# EasyLife Central Supabase Backend

This directory holds the single central backend configuration for both the Next.js Web Platform (`apps/web`) and the Flutter Mobile Application (`apps/mobile`).

## Structure

- `config.toml` — Local Supabase CLI settings.
- `migrations/` — Timestamped SQL migrations defining tables, enums, indexes, triggers, storage buckets, and Row Level Security (RLS) policies.
- `functions/` — Supabase Edge Functions.
- `seed/` — Clearly isolated development-only seed scripts (never executed against production).
