-- ============================================================================
-- Migration: 20261104000400_transactions_admin_and_rls.sql
-- Description: Table Groups E (Transactions & Accountability) and
--              F (Administration), Atomic Transactional RPCs, Storage Buckets,
--              and Row Level Security (RLS) across all tables.
-- ============================================================================

BEGIN;

-- ============================================================================
-- GROUP E: TRANSACTIONS AND ACCOUNTABILITY
-- ============================================================================

-- E1. payments (Financial transactions stored in integer minor units / kobo)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL DEFAULT public.generate_reference_code('EL-PY'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE RESTRICT,
  payer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  gross_amount_kobo BIGINT NOT NULL CHECK (gross_amount_kobo > 0),
  platform_commission_kobo BIGINT NOT NULL DEFAULT 0 CHECK (platform_commission_kobo >= 0),
  professional_payout_kobo BIGINT NOT NULL CHECK (
    professional_payout_kobo >= 0
    AND gross_amount_kobo = platform_commission_kobo + professional_payout_kobo
  ),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  provider TEXT NOT NULL DEFAULT 'paystack' CHECK (provider IN ('paystack', 'manual_transfer')),
  provider_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'initiated',
  paid_at TIMESTAMPTZ,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_reference_unique UNIQUE (reference),
  CONSTRAINT payments_provider_reference_unique UNIQUE (provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_professional ON public.payments(professional_id, status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E2. refunds (Refund records linked to payments and optional disputes)
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL DEFAULT public.generate_reference_code('EL-RF'),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  dispute_id UUID,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  reason TEXT NOT NULL,
  status public.refund_status NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  processed_at TIMESTAMPTZ,
  provider_refund_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT refunds_reference_unique UNIQUE (reference)
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id, status);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON public.refunds(booking_id);

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E3. reviews (Verified customer reviews strictly gated to completed bookings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  reviewer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) >= 5),
  professional_response TEXT,
  responded_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_published
  ON public.reviews(professional_id, created_at DESC)
  WHERE is_published = true;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforce that reviews can ONLY be created for completed bookings by the booking's customer
CREATE OR REPLACE FUNCTION public.enforce_verified_review_and_recalculate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT id, customer_id, professional_id, status
    INTO v_booking
    FROM public.bookings
    WHERE id = NEW.booking_id;

    IF v_booking.id IS NULL THEN
      RAISE EXCEPTION 'Booking does not exist.';
    END IF;

    IF v_booking.status <> 'completed' THEN
      RAISE EXCEPTION 'Reviews can only be submitted for completed bookings.';
    END IF;

    IF v_booking.customer_id <> NEW.reviewer_user_id THEN
      RAISE EXCEPTION 'Only the customer who booked the service can submit a review.';
    END IF;

    IF v_booking.professional_id <> NEW.professional_id THEN
      RAISE EXCEPTION 'Review professional_id does not match the booking professional.';
    END IF;
  END IF;

  -- Recalculate professional rating summary
  UPDATE public.professional_profiles pp
  SET
    average_rating = coalesce((
      SELECT round(avg(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id AND r.is_published = true
    ), 0.00),
    review_count = (
      SELECT count(*)::integer
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id AND r.is_published = true
    ),
    updated_at = now()
  WHERE pp.id = NEW.professional_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_enforce_and_recalculate
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_review_and_recalculate();

-- E4. disputes (Formal booking disputes and administrative arbitration)
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-DP'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  opened_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  against_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN (
    'incomplete_work',
    'quality_issue',
    'no_show',
    'pricing_disagreement',
    'property_damage',
    'safety_concern',
    'other'
  )),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  disputed_amount_kobo BIGINT NOT NULL DEFAULT 0 CHECK (disputed_amount_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_summary TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT disputes_reference_code_unique UNIQUE (reference_code)
);

-- Prevent multiple simultaneous open/under_review disputes for the same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_one_active_per_booking
  ON public.disputes(booking_id)
  WHERE status IN ('open', 'under_review');

CREATE INDEX IF NOT EXISTS idx_disputes_status_created
  ON public.disputes(status, created_at DESC);

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.refunds
  ADD CONSTRAINT refunds_dispute_id_fk
  FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE RESTRICT;

-- E5. dispute_evidence (Private evidence files stored in 'maintenance-and-disputes' bucket)
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE RESTRICT,
  submitted_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_bucket TEXT NOT NULL DEFAULT 'maintenance-and-disputes' CHECK (storage_bucket = 'maintenance-and-disputes'),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dispute_evidence_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id
  ON public.dispute_evidence(dispute_id, created_at ASC);

-- E7. maintenance_records (Historical asset & property maintenance records)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  maintenance_schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  performed_by_professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  recorded_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  maintenance_type public.maintenance_type NOT NULL DEFAULT 'preventive',
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) >= 3),
  work_performed TEXT NOT NULL,
  parts_replaced TEXT,
  cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_recommended_service_date DATE,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset_date
  ON public.maintenance_records(asset_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_property_date
  ON public.maintenance_records(property_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_business_date
  ON public.maintenance_records(business_id, performed_at DESC);

CREATE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically update asset.last_serviced_at when a maintenance record is logged
CREATE OR REPLACE FUNCTION public.sync_asset_last_serviced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_id IS NOT NULL THEN
    UPDATE public.assets
    SET
      last_serviced_at = GREATEST(coalesce(last_serviced_at, NEW.performed_at), NEW.performed_at),
      next_service_due_at = COALESCE(
        NEW.next_recommended_service_date::timestamptz,
        next_service_due_at
      ),
      status = 'operational',
      updated_at = now()
    WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_records_sync_asset
  AFTER INSERT ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_asset_last_serviced();

-- ============================================================================
-- GROUP F: ADMINISTRATION
-- ============================================================================

-- F1. audit_logs (Immutable administrative and security audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role public.user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs(actor_user_id, created_at DESC);

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_modification();

-- F2. reports (User-submitted safety/abuse reports & moderation queue)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'professional_profile', 'booking', 'review', 'message')),
  target_id UUID NOT NULL,
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'fraud_or_scam',
    'harassment',
    'inappropriate_content',
    'off_platform_solicitation',
    'fake_credentials',
    'other'
  )),
  details TEXT NOT NULL CHECK (char_length(trim(details)) >= 5),
  status public.report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports(status, created_at DESC);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- F3. platform_settings (Central operational configuration)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- F4. commission_settings (Commission rates in basis points & flat minor-unit fees)
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  city TEXT,
  commission_bps INTEGER NOT NULL DEFAULT 1000 CHECK (commission_bps BETWEEN 0 AND 5000),
  flat_fee_kobo BIGINT NOT NULL DEFAULT 0 CHECK (flat_fee_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_settings_lookup
  ON public.commission_settings(category_id, city, is_active);

CREATE TRIGGER trg_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ATOMIC TRANSACTIONAL RPCs
-- ============================================================================

-- 1. Atomic Quotation Acceptance & Booking Scheduling
CREATE OR REPLACE FUNCTION public.accept_quotation_and_schedule(
  p_quotation_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_quotation public.quotations%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_pro_user_id UUID;
  v_conversation_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_quotation
  FROM public.quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF v_quotation.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF v_quotation.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending quotations can be accepted (current status: %).', v_quotation.status;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_quotation.booking_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Associated booking not found.';
  END IF;

  IF v_booking.customer_id <> v_actor_id THEN
    RAISE EXCEPTION 'Only the booking owner can accept a quotation.';
  END IF;

  IF v_booking.status NOT IN ('open', 'quoted') THEN
    RAISE EXCEPTION 'Booking cannot accept quotations in status %.', v_booking.status;
  END IF;

  -- Mark selected quotation accepted
  UPDATE public.quotations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = v_quotation.id;

  -- Decline all other pending quotations on this booking
  UPDATE public.quotations
  SET status = 'declined',
      declined_at = now(),
      updated_at = now()
  WHERE booking_id = v_booking.id
    AND id <> v_quotation.id
    AND status = 'pending';

  -- Update booking to scheduled with agreed amount and professional
  UPDATE public.bookings
  SET professional_id = v_quotation.professional_id,
      accepted_quotation_id = v_quotation.id,
      agreed_amount_kobo = v_quotation.total_amount_kobo,
      currency_code = v_quotation.currency_code,
      scheduled_start_at = coalesce(v_quotation.proposed_start_at, v_booking.scheduled_start_at, now() + INTERVAL '1 day'),
      scheduled_end_at = coalesce(v_quotation.proposed_start_at, v_booking.scheduled_start_at, now() + INTERVAL '1 day')
        + (v_quotation.estimated_duration_minutes || ' minutes')::interval,
      status = 'scheduled',
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Ensure a conversation exists between customer and professional
  SELECT user_id INTO v_pro_user_id
  FROM public.professional_profiles
  WHERE id = v_quotation.professional_id;

  INSERT INTO public.conversations (booking_id, subject, status)
  VALUES (v_booking.id, v_booking.title, 'open')
  ON CONFLICT (booking_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_members (conversation_id, user_id, role_in_conversation)
  VALUES
    (v_conversation_id, v_booking.customer_id, 'customer'),
    (v_conversation_id, v_pro_user_id, 'professional')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Record immutable audit log
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'quotation.accepted',
    'booking',
    v_booking.id::text,
    jsonb_build_object(
      'quotation_id', v_quotation.id,
      'professional_id', v_quotation.professional_id,
      'agreed_amount_kobo', v_quotation.total_amount_kobo,
      'currency_code', v_quotation.currency_code
    )
  );

  RETURN v_booking;
END;
$$;

-- 2. Atomic Job Completion & Maintenance Record Sync
CREATE OR REPLACE FUNCTION public.confirm_booking_completion(
  p_booking_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_pro_name TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_booking.customer_id <> v_actor_id THEN
    RAISE EXCEPTION 'Only the booking customer can confirm final job completion.';
  END IF;

  IF v_booking.status NOT IN ('in_progress', 'pro_marked_complete', 'scheduled') THEN
    RAISE EXCEPTION 'Booking cannot be completed from status %.', v_booking.status;
  END IF;

  UPDATE public.bookings
  SET status = 'completed',
      customer_confirmed_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Increment completed jobs count for the professional
  IF v_booking.professional_id IS NOT NULL THEN
    UPDATE public.professional_profiles
    SET completed_jobs_count = completed_jobs_count + 1,
        updated_at = now()
    WHERE id = v_booking.professional_id
    RETURNING business_name INTO v_pro_name;
  END IF;

  -- If linked to a business property/asset, automatically log a maintenance record
  IF v_booking.business_id IS NOT NULL AND v_booking.property_id IS NOT NULL THEN
    INSERT INTO public.maintenance_records (
      business_id,
      property_id,
      asset_id,
      maintenance_schedule_id,
      booking_id,
      performed_by_professional_id,
      performed_by_name,
      recorded_by_user_id,
      maintenance_type,
      summary,
      work_performed,
      cost_kobo,
      currency_code,
      performed_at
    ) VALUES (
      v_booking.business_id,
      v_booking.property_id,
      v_booking.asset_id,
      v_booking.maintenance_schedule_id,
      v_booking.id,
      v_booking.professional_id,
      coalesce(v_pro_name, 'Verified Professional'),
      v_actor_id,
      CASE WHEN v_booking.maintenance_schedule_id IS NOT NULL THEN 'preventive'::public.maintenance_type ELSE 'corrective'::public.maintenance_type END,
      v_booking.title,
      coalesce(v_booking.pro_completion_notes, v_booking.description),
      coalesce(v_booking.agreed_amount_kobo, 0),
      v_booking.currency_code,
      now()
    );
  END IF;

  -- Advance maintenance schedule if linked
  IF v_booking.maintenance_schedule_id IS NOT NULL THEN
    UPDATE public.maintenance_schedules
    SET last_completed_at = now(),
        next_due_date = (current_date + (interval_days || ' days')::interval)::date,
        updated_at = now()
    WHERE id = v_booking.maintenance_schedule_id;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'booking.completed',
    'booking',
    v_booking.id::text,
    jsonb_build_object(
      'professional_id', v_booking.professional_id,
      'agreed_amount_kobo', v_booking.agreed_amount_kobo
    )
  );

  RETURN v_booking;
END;
$$;

-- ============================================================================
-- SUPABASE STORAGE BUCKETS (Public vs Private Separation)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('portfolio-media', 'portfolio-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('verification-documents', 'verification-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      ('service-request-media', 'service-request-media', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      ('maintenance-and-disputes', 'maintenance-and-disputes', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & BASELINE POLICIES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id AND b.owner_id = auth.uid() AND b.deleted_at IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
  );
$$;

-- Enable RLS on all 30 public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Baseline RLS Policies
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_sessions_manage_own" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "service_categories_public_read" ON public.service_categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "service_categories_admin_write" ON public.service_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "pro_profiles_read_approved_or_own" ON public.professional_profiles
  FOR SELECT USING (
    (verification_status = 'approved' AND deleted_at IS NULL)
    OR user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "pro_profiles_write_own" ON public.professional_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "pro_profiles_update_own_or_admin" ON public.professional_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "pro_services_read_all" ON public.professional_services
  FOR SELECT USING (true);

CREATE POLICY "pro_services_manage_own" ON public.professional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_areas_read_all" ON public.professional_service_areas
  FOR SELECT USING (true);

CREATE POLICY "pro_areas_manage_own" ON public.professional_service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Confidential KYC Documents: strictly owner or admin ONLY
CREATE POLICY "pro_documents_confidential_access" ON public.professional_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_documents_insert_own" ON public.professional_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "pro_availability_read_all" ON public.professional_availability
  FOR SELECT USING (true);

CREATE POLICY "pro_availability_manage_own" ON public.professional_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = professional_id AND pp.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Businesses, Properties, Assets, Maintenance Schedules & Records
CREATE POLICY "businesses_member_or_admin" ON public.businesses
  FOR SELECT USING (owner_id = auth.uid() OR public.is_business_member(id) OR public.is_admin());

CREATE POLICY "businesses_insert_owner" ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "businesses_update_owner_or_admin" ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "business_members_access" ON public.business_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "business_subscriptions_access" ON public.business_subscriptions
  FOR SELECT USING (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "properties_business_access" ON public.properties
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "assets_business_access" ON public.assets
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "maintenance_schedules_business_access" ON public.maintenance_schedules
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

CREATE POLICY "maintenance_records_business_access" ON public.maintenance_records
  FOR ALL USING (public.is_business_member(business_id) OR public.is_admin())
  WITH CHECK (public.is_business_member(business_id) OR public.is_admin());

-- Marketplace: Bookings, Quotations, Conversations, Messages, Notifications
CREATE POLICY "bookings_select_authorized" ON public.bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR (business_id IS NOT NULL AND public.is_business_member(business_id))
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = auth.uid()
        AND (
          pp.id = bookings.professional_id
          OR (bookings.status IN ('open', 'quoted') AND pp.verification_status = 'approved')
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "bookings_insert_customer" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "bookings_update_participants" ON public.bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = bookings.professional_id AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "quotations_select_authorized" ON public.quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = quotations.professional_id AND pp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = quotations.booking_id AND b.customer_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "quotations_insert_verified_pro" ON public.quotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = quotations.professional_id
        AND pp.user_id = auth.uid()
        AND pp.verification_status = 'approved'
    ) OR public.is_admin()
  );

CREATE POLICY "quotation_items_select_authorized" ON public.quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
    )
  );

CREATE POLICY "booking_status_history_select" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_status_history.booking_id
    )
  );

CREATE POLICY "conversations_member_access" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "conversation_members_select" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_own_access" ON public.notifications
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Transactions, Reviews, Disputes & Admin
CREATE POLICY "payments_select_participant" ON public.payments
  FOR SELECT USING (
    payer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.id = payments.professional_id AND pp.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "refunds_select_participant" ON public.refunds
  FOR SELECT USING (
    initiated_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = refunds.payment_id AND p.payer_user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (is_published = true OR reviewer_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reviews_insert_customer" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_user_id = auth.uid());

CREATE POLICY "disputes_participant_or_admin" ON public.disputes
  FOR SELECT USING (
    opened_by_user_id = auth.uid()
    OR against_user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "disputes_insert_participant" ON public.disputes
  FOR INSERT WITH CHECK (opened_by_user_id = auth.uid());

CREATE POLICY "dispute_evidence_participant_or_admin" ON public.dispute_evidence
  FOR SELECT USING (
    submitted_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_evidence.dispute_id
        AND (d.opened_by_user_id = auth.uid() OR d.against_user_id = auth.uid())
    )
    OR public.is_admin()
  );

CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "reports_own_or_admin" ON public.reports
  FOR SELECT USING (reporter_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reports_insert_authenticated" ON public.reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "platform_settings_read_public_or_admin" ON public.platform_settings
  FOR SELECT USING (is_public = true OR public.is_admin());

CREATE POLICY "commission_settings_read_authenticated" ON public.commission_settings
  FOR SELECT USING (auth.uid() IS NOT NULL OR public.is_admin());

COMMIT;
