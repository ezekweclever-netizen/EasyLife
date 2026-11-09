-- ============================================================================
-- Migration: 20261104001600_prompt19_third_party_integrations.sql
-- Prompt 19: EasyLife Third-Party Integrations
-- (Device Tokens, Payments & Refunds, and Supabase Storage Buckets)
-- ============================================================================

BEGIN;

-- 1. USER DEVICE TOKENS TABLE (Firebase Cloud Messaging)
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_device_token_unique UNIQUE (user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_active ON public.user_device_tokens(is_active) WHERE is_active = true;

ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.user_device_tokens;
CREATE POLICY "Users can manage own device tokens"
  ON public.user_device_tokens
  FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- RPC to register / update device token
CREATE OR REPLACE FUNCTION public.register_user_device_token(
  p_user_id UUID,
  p_device_token TEXT,
  p_platform TEXT,
  p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.user_device_tokens (
    user_id,
    device_token,
    platform,
    device_name,
    is_active,
    last_used_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_device_token,
    p_platform,
    p_device_name,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id, device_token) DO UPDATE
  SET is_active = true,
      last_used_at = now(),
      device_name = COALESCE(p_device_name, public.user_device_tokens.device_name),
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- 2. PAYMENT TRANSACTIONS TABLE (Paystack Gateway Integration)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  channel TEXT NOT NULL DEFAULT 'paystack',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'successful',
    'failed',
    'refunded',
    'abandoned'
  )),
  paystack_reference TEXT,
  gateway_response TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount_kobo BIGINT NOT NULL DEFAULT 0,
  refund_reason TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref ON public.payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can update payment transactions"
  ON public.payment_transactions
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can insert payment transactions" ON public.payment_transactions;
CREATE POLICY "Service role can insert payment transactions"
  ON public.payment_transactions
  FOR INSERT
  WITH CHECK (true);


-- 3. STORAGE BUCKETS & ACCESS POLICIES
-- Setup standard buckets in storage.buckets if storage schema is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    -- Public Buckets
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('avatars', 'avatars', true),
      ('portfolio-media', 'portfolio-media', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    -- Private Buckets
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('booking-attachments', 'booking-attachments', false),
      ('verification-documents', 'verification-documents', false),
      ('maintenance-invoices', 'maintenance-invoices', false),
      ('dispute-evidence', 'dispute-evidence', false)
    ON CONFLICT (id) DO UPDATE SET public = false;
  END IF;
END $$;

-- Policies on storage.objects for Public vs Private Separation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN

    -- (A) Public Read for Avatars and Portfolio Media
    DROP POLICY IF EXISTS "easylife_public_buckets_read" ON storage.objects;
    CREATE POLICY "easylife_public_buckets_read" ON storage.objects
      FOR SELECT USING (bucket_id IN ('avatars', 'portfolio-media'));

    -- (B) Authenticated Upload to Avatars / Portfolio Media (Folder owner)
    DROP POLICY IF EXISTS "easylife_public_buckets_insert" ON storage.objects;
    CREATE POLICY "easylife_public_buckets_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('avatars', 'portfolio-media')
        AND (auth.uid() IS NOT NULL)
      );

    -- (C) Private Booking Attachments (Uploader or Admin)
    DROP POLICY IF EXISTS "easylife_booking_attachments_read" ON storage.objects;
    CREATE POLICY "easylife_booking_attachments_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'booking-attachments'
        AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_booking_attachments_insert" ON storage.objects;
    CREATE POLICY "easylife_booking_attachments_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'booking-attachments'
        AND (auth.uid() IS NOT NULL)
      );

    -- (D) Private Verification Documents (Owner or Admin)
    DROP POLICY IF EXISTS "easylife_verification_docs_p19_read" ON storage.objects;
    CREATE POLICY "easylife_verification_docs_p19_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'verification-documents'
        AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_verification_docs_p19_insert" ON storage.objects;
    CREATE POLICY "easylife_verification_docs_p19_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'verification-documents'
        AND (auth.uid() IS NOT NULL)
      );

    -- (E) Private Maintenance Invoices (Business Member or Admin)
    DROP POLICY IF EXISTS "easylife_maintenance_invoices_read" ON storage.objects;
    CREATE POLICY "easylife_maintenance_invoices_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'maintenance-invoices'
        AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_maintenance_invoices_insert" ON storage.objects;
    CREATE POLICY "easylife_maintenance_invoices_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'maintenance-invoices'
        AND (auth.uid() IS NOT NULL)
      );

    -- (F) Private Dispute Evidence (Dispute parties or Admin)
    DROP POLICY IF EXISTS "easylife_dispute_evidence_read" ON storage.objects;
    CREATE POLICY "easylife_dispute_evidence_read" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'dispute-evidence'
        AND (
          auth.uid()::text = (storage.foldername(name))[1]
          OR public.is_admin()
        )
      );

    DROP POLICY IF EXISTS "easylife_dispute_evidence_insert" ON storage.objects;
    CREATE POLICY "easylife_dispute_evidence_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'dispute-evidence'
        AND (auth.uid() IS NOT NULL)
      );

  END IF;
END $$;

COMMIT;
