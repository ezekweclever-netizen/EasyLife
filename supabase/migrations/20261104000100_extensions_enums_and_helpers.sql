-- ============================================================================
-- Migration: 20261104000100_extensions_enums_and_helpers.sql
-- Description: Core PostgreSQL extensions, domain ENUM types, timestamp
--              triggers, reference code generators, and immutability guards.
-- ============================================================================

BEGIN;

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain Enumerations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'customer',
      'professional',
      'business',
      'property_manager',
      'admin'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_platform') THEN
    CREATE TYPE public.device_platform AS ENUM (
      'web',
      'android',
      'ios'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM (
      'unsubmitted',
      'pending',
      'approved',
      'rejected',
      'suspended'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE public.document_type AS ENUM (
      'national_id_nin',
      'voters_card',
      'drivers_license',
      'international_passport',
      'trade_certificate',
      'cac_certificate',
      'utility_bill',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_member_role') THEN
    CREATE TYPE public.business_member_role AS ENUM (
      'owner',
      'admin',
      'facility_manager',
      'viewer'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'trialing',
      'active',
      'past_due',
      'cancelled',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE public.property_type AS ENUM (
      'residential',
      'commercial',
      'industrial',
      'mixed_use'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
    CREATE TYPE public.asset_status AS ENUM (
      'operational',
      'needs_maintenance',
      'under_repair',
      'decommissioned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
    CREATE TYPE public.urgency_level AS ENUM (
      'low',
      'normal',
      'high',
      'emergency'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'draft',
      'open',
      'quoted',
      'scheduled',
      'in_progress',
      'pro_marked_complete',
      'completed',
      'cancelled',
      'disputed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
    CREATE TYPE public.quotation_status AS ENUM (
      'pending',
      'accepted',
      'declined',
      'withdrawn',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_item_type') THEN
    CREATE TYPE public.quotation_item_type AS ENUM (
      'labor',
      'material',
      'callout',
      'transport',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'initiated',
      'pending',
      'succeeded',
      'failed',
      'refunded',
      'partially_refunded'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
    CREATE TYPE public.refund_status AS ENUM (
      'pending',
      'processed',
      'failed',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE public.dispute_status AS ENUM (
      'open',
      'under_review',
      'resolved_for_customer',
      'resolved_for_professional',
      'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_frequency') THEN
    CREATE TYPE public.maintenance_frequency AS ENUM (
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'biannual',
      'annual',
      'custom'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
    CREATE TYPE public.maintenance_type AS ENUM (
      'preventive',
      'corrective',
      'inspection',
      'emergency'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM (
      'open',
      'investigating',
      'action_taken',
      'dismissed'
    );
  END IF;
END
$$;

-- 3. Reusable Trigger Functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_row_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only and immutable. UPDATE and DELETE are prohibited.', TG_TABLE_NAME;
END;
$$;

-- 4. Human-Readable Reference Code Generator (e.g., EL-BK-20261104-A1B2C3)
CREATE OR REPLACE FUNCTION public.generate_reference_code(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  random_suffix TEXT;
BEGIN
  random_suffix := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  RETURN upper(prefix) || '-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || random_suffix;
END;
$$;

COMMIT;
