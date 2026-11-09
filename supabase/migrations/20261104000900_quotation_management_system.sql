-- ============================================================================
-- EASYLIFE PLATFORM: QUOTATION MANAGEMENT SYSTEM
-- Migration: 20261104000900_quotation_management_system.sql
-- ============================================================================

-- Note: Enum value 'draft' for quotation_status
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'draft';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

BEGIN;

-- ============================================================================
-- 1. REFERENCE CODE GENERATOR HELPER
-- Uses gen_random_uuid() for portability without search_path / pgcrypto issues
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_reference_code(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  random_suffix TEXT;
BEGIN
  random_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  RETURN upper(prefix) || '-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || random_suffix;
END;
$$;

-- ============================================================================
-- 2. EXTEND PUBLIC.QUOTATIONS TABLE
-- Add structured quotation fields, versioning, customer responses, and audit tracking
-- ============================================================================

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  ADD COLUMN IF NOT EXISTS work_description TEXT,
  ADD COLUMN IF NOT EXISTS labour_charges_kobo BIGINT NOT NULL DEFAULT 0 CHECK (labour_charges_kobo >= 0),
  ADD COLUMN IF NOT EXISTS materials_costs_kobo BIGINT NOT NULL DEFAULT 0 CHECK (materials_costs_kobo >= 0),
  ADD COLUMN IF NOT EXISTS additional_expenses_kobo BIGINT NOT NULL DEFAULT 0 CHECK (additional_expenses_kobo >= 0),
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS clarification_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clarification_notes TEXT,
  ADD COLUMN IF NOT EXISTS clarification_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clarification_response TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_quotations_version
  ON public.quotations(booking_id, professional_id, version);

CREATE INDEX IF NOT EXISTS idx_quotations_valid_until
  ON public.quotations(status, valid_until)
  WHERE status = 'pending';

-- ============================================================================
-- 2. QUOTATION VERSIONS TABLE (Rule 4: Preserve quotation versions)
-- Immutable version history snapshots of quotations and line items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  status public.quotation_status NOT NULL,
  subtotal_kobo BIGINT NOT NULL CHECK (subtotal_kobo >= 0),
  labour_charges_kobo BIGINT NOT NULL DEFAULT 0 CHECK (labour_charges_kobo >= 0),
  materials_costs_kobo BIGINT NOT NULL DEFAULT 0 CHECK (materials_costs_kobo >= 0),
  additional_expenses_kobo BIGINT NOT NULL DEFAULT 0 CHECK (additional_expenses_kobo >= 0),
  tax_kobo BIGINT NOT NULL DEFAULT 0 CHECK (tax_kobo >= 0),
  total_amount_kobo BIGINT NOT NULL CHECK (total_amount_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (estimated_duration_minutes > 0),
  proposed_start_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  work_description TEXT,
  notes TEXT,
  items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quotation_versions_unique_version UNIQUE (quotation_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_quotation_versions_quote_id
  ON public.quotation_versions(quotation_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_quotation_versions_booking_id
  ON public.quotation_versions(booking_id, created_at DESC);

-- Enable RLS on quotation_versions
ALTER TABLE public.quotation_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotation_versions_customer_select" ON public.quotation_versions;
CREATE POLICY "quotation_versions_customer_select" ON public.quotation_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = quotation_versions.booking_id
        AND b.customer_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "quotation_versions_pro_select" ON public.quotation_versions;
CREATE POLICY "quotation_versions_pro_select" ON public.quotation_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles p
      WHERE p.id = quotation_versions.professional_id
        AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ============================================================================
-- 3. STORED PROCEDURE: SUBMIT OR REVISE QUOTATION
-- Trusted Backend Total Calculation (Rules 1, 2, 3)
-- Customer Approval for Changes to Accepted Quotation (Rule 5)
-- Version History Preservation (Rule 4)
-- Authorization Checks (Rule 8)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_or_revise_quotation(
  p_booking_id UUID,
  p_professional_id UUID,
  p_work_description TEXT,
  p_estimated_duration_minutes INTEGER,
  p_valid_until TIMESTAMPTZ,
  p_proposed_start_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_draft BOOLEAN DEFAULT false,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_quotation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_pro_owner BOOLEAN;
  v_is_admin BOOLEAN;
  v_existing_quote RECORD;
  v_booking RECORD;
  v_target_status public.quotation_status;
  v_target_version INTEGER := 1;
  v_target_quote_id UUID;
  v_reference_code TEXT;

  -- Trusted calculated totals in kobo
  v_labour_charges_kobo BIGINT := 0;
  v_materials_costs_kobo BIGINT := 0;
  v_additional_expenses_kobo BIGINT := 0;
  v_subtotal_kobo BIGINT := 0;
  v_tax_kobo BIGINT := 0;
  v_total_amount_kobo BIGINT := 0;

  v_item JSONB;
  v_item_type public.quotation_item_type;
  v_desc TEXT;
  v_qty NUMERIC(10,2);
  v_unit_kobo BIGINT;
  v_line_kobo BIGINT;
  v_idx INTEGER := 0;
  v_item_list JSONB := '[]'::jsonb;
  v_is_revision_of_accepted BOOLEAN := false;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  -- Verify calling user owns this professional profile or is admin (Rule 8)
  SELECT (user_id = v_caller_id) INTO v_is_pro_owner
  FROM public.professional_profiles
  WHERE id = p_professional_id;

  IF NOT (v_is_pro_owner IS TRUE OR v_is_admin) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Not authorized to create or modify quotations for this professional profile.'
    );
  END IF;

  -- Fetch & validate booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BOOKING_NOT_FOUND',
      'message', 'Booking service request not found.'
    );
  END IF;

  -- Validate estimated duration
  IF p_estimated_duration_minutes IS NULL OR p_estimated_duration_minutes <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_DURATION',
      'message', 'Estimated duration must be greater than zero minutes.'
    );
  END IF;

  -- Validate validity timestamp
  IF p_valid_until IS NOT NULL AND p_valid_until <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_VALIDITY',
      'message', 'Quotation validity period must be in the future.'
    );
  END IF;

  -- TRUSTED BACKEND CALCULATION (Rules 1 & 2):
  -- Loop through provided line items, validate quantities and unit prices, and calculate sums strictly on server.
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    IF NOT p_is_draft THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'EMPTY_LINE_ITEMS',
        'message', 'At least one itemized quotation line item is required for submission.'
      );
    END IF;
  ELSE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_idx := v_idx + 1;
      v_desc := coalesce(trim(v_item->>'description'), 'Service item');
      IF char_length(v_desc) < 2 THEN
        v_desc := 'Item ' || v_idx;
      END IF;

      -- Determine item type safely
      BEGIN
        v_item_type := (v_item->>'item_type')::public.quotation_item_type;
      EXCEPTION WHEN OTHERS THEN
        v_item_type := 'labor'::public.quotation_item_type;
      END;

      v_qty := coalesce((v_item->>'quantity')::numeric, 1.00);
      IF v_qty <= 0 THEN
        v_qty := 1.00;
      END IF;

      -- Unit price in kobo (if passed as naira, caller or backend converts; expects kobo)
      v_unit_kobo := coalesce((v_item->>'unit_price_kobo')::bigint, 0);
      IF v_unit_kobo < 0 THEN
        v_unit_kobo := 0;
      END IF;

      -- Server-side line total calculation
      v_line_kobo := round(v_qty * v_unit_kobo);

      IF v_item_type = 'labor' THEN
        v_labour_charges_kobo := v_labour_charges_kobo + v_line_kobo;
      ELSIF v_item_type = 'material' THEN
        v_materials_costs_kobo := v_materials_costs_kobo + v_line_kobo;
      ELSE
        v_additional_expenses_kobo := v_additional_expenses_kobo + v_line_kobo;
      END IF;

      v_item_list := v_item_list || jsonb_build_object(
        'sort_order', v_idx,
        'item_type', v_item_type,
        'description', v_desc,
        'quantity', v_qty,
        'unit_price_kobo', v_unit_kobo,
        'line_total_kobo', v_line_kobo,
        'currency_code', 'NGN'
      );
    END LOOP;
  END IF;

  v_subtotal_kobo := v_labour_charges_kobo + v_materials_costs_kobo + v_additional_expenses_kobo;
  v_tax_kobo := 0; -- Future platform tax / VAT can be calculated here
  v_total_amount_kobo := v_subtotal_kobo + v_tax_kobo;

  IF NOT p_is_draft AND v_total_amount_kobo <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ZERO_AMOUNT',
      'message', 'Submitted quotation total amount must be greater than zero.'
    );
  END IF;

  -- Determine initial/target status
  IF p_is_draft THEN
    v_target_status := 'draft'::public.quotation_status;
  ELSE
    v_target_status := 'pending'::public.quotation_status;
  END IF;

  -- Check existing quotation if provided
  IF p_quotation_id IS NOT NULL THEN
    SELECT * INTO v_existing_quote
    FROM public.quotations
    WHERE id = p_quotation_id AND professional_id = p_professional_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'QUOTATION_NOT_FOUND',
        'message', 'Specified quotation to edit or revise was not found.'
      );
    END IF;

    -- RULE 5: Require customer approval for changes to an accepted quotation
    -- If quotation is already accepted, cannot mutate accepted quote in place!
    -- Create a pending revision and bump version number.
    IF v_existing_quote.status = 'accepted' THEN
      v_is_revision_of_accepted := true;
      v_target_version := v_existing_quote.version + 1;
      v_target_status := 'pending'::public.quotation_status; -- revisions must be submitted for customer approval
    ELSE
      v_target_version := v_existing_quote.version;
    END IF;

    v_target_quote_id := p_quotation_id;
  ELSE
    -- Check if professional already has an active pending or draft quote on this booking
    SELECT * INTO v_existing_quote
    FROM public.quotations
    WHERE booking_id = p_booking_id
      AND professional_id = p_professional_id
      AND status IN ('draft', 'pending')
    LIMIT 1;

    IF FOUND THEN
      v_target_quote_id := v_existing_quote.id;
      v_target_version := v_existing_quote.version;
    END IF;
  END IF;

  -- Upsert quotation record
  IF v_target_quote_id IS NOT NULL THEN
    -- Updating draft, pending quotation, or revising accepted quotation to new pending version
    UPDATE public.quotations
    SET status = v_target_status,
        version = v_target_version,
        subtotal_kobo = v_subtotal_kobo,
        labour_charges_kobo = v_labour_charges_kobo,
        materials_costs_kobo = v_materials_costs_kobo,
        additional_expenses_kobo = v_additional_expenses_kobo,
        tax_kobo = v_tax_kobo,
        total_amount_kobo = v_total_amount_kobo,
        estimated_duration_minutes = p_estimated_duration_minutes,
        work_description = p_work_description,
        proposed_start_at = p_proposed_start_at,
        valid_until = coalesce(p_valid_until, now() + interval '7 days'),
        notes = p_notes,
        updated_at = now()
    WHERE id = v_target_quote_id
    RETURNING reference_code INTO v_reference_code;

    -- Replace quotation line items
    DELETE FROM public.quotation_items WHERE quotation_id = v_target_quote_id;
  ELSE
    -- Insert new quotation
    INSERT INTO public.quotations (
      booking_id,
      professional_id,
      status,
      version,
      subtotal_kobo,
      labour_charges_kobo,
      materials_costs_kobo,
      additional_expenses_kobo,
      tax_kobo,
      total_amount_kobo,
      currency_code,
      estimated_duration_minutes,
      proposed_start_at,
      valid_until,
      work_description,
      notes
    ) VALUES (
      p_booking_id,
      p_professional_id,
      v_target_status,
      v_target_version,
      v_subtotal_kobo,
      v_labour_charges_kobo,
      v_materials_costs_kobo,
      v_additional_expenses_kobo,
      v_tax_kobo,
      v_total_amount_kobo,
      'NGN',
      p_estimated_duration_minutes,
      p_proposed_start_at,
      coalesce(p_valid_until, now() + interval '7 days'),
      p_work_description,
      p_notes
    )
    RETURNING id, reference_code INTO v_target_quote_id, v_reference_code;
  END IF;

  -- Insert current quotation items into public.quotation_items
  IF jsonb_array_length(v_item_list) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_item_list)
    LOOP
      INSERT INTO public.quotation_items (
        quotation_id,
        item_type,
        description,
        quantity,
        unit_price_kobo,
        line_total_kobo,
        currency_code,
        sort_order
      ) VALUES (
        v_target_quote_id,
        (v_item->>'item_type')::public.quotation_item_type,
        v_item->>'description',
        (v_item->>'quantity')::numeric,
        (v_item->>'unit_price_kobo')::bigint,
        (v_item->>'line_total_kobo')::bigint,
        'NGN',
        (v_item->>'sort_order')::integer
      );
    END LOOP;
  END IF;

  -- RULE 4: Preserve quotation versions in public.quotation_versions
  INSERT INTO public.quotation_versions (
    quotation_id,
    booking_id,
    professional_id,
    version_number,
    status,
    subtotal_kobo,
    labour_charges_kobo,
    materials_costs_kobo,
    additional_expenses_kobo,
    tax_kobo,
    total_amount_kobo,
    currency_code,
    estimated_duration_minutes,
    proposed_start_at,
    valid_until,
    work_description,
    notes,
    items_snapshot,
    change_summary,
    created_by
  ) VALUES (
    v_target_quote_id,
    p_booking_id,
    p_professional_id,
    v_target_version,
    v_target_status,
    v_subtotal_kobo,
    v_labour_charges_kobo,
    v_materials_costs_kobo,
    v_additional_expenses_kobo,
    v_tax_kobo,
    v_total_amount_kobo,
    'NGN',
    p_estimated_duration_minutes,
    p_proposed_start_at,
    coalesce(p_valid_until, now() + interval '7 days'),
    p_work_description,
    p_notes,
    v_item_list,
    CASE
      WHEN v_is_revision_of_accepted THEN 'Quotation revision proposed by professional; requires customer acceptance.'
      WHEN p_is_draft THEN 'Quotation saved as draft.'
      ELSE 'Quotation submitted to customer.'
    END,
    v_caller_id
  )
  ON CONFLICT (quotation_id, version_number) DO UPDATE
  SET status = EXCLUDED.status,
      subtotal_kobo = EXCLUDED.subtotal_kobo,
      labour_charges_kobo = EXCLUDED.labour_charges_kobo,
      materials_costs_kobo = EXCLUDED.materials_costs_kobo,
      additional_expenses_kobo = EXCLUDED.additional_expenses_kobo,
      tax_kobo = EXCLUDED.tax_kobo,
      total_amount_kobo = EXCLUDED.total_amount_kobo,
      estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
      work_description = EXCLUDED.work_description,
      notes = EXCLUDED.notes,
      items_snapshot = EXCLUDED.items_snapshot,
      created_at = now();

  -- If status is 'pending', advance booking to 'quoted' if eligible
  IF v_target_status = 'pending' AND v_booking.status IN ('draft', 'submitted', 'open', 'pending_pro_response') THEN
    UPDATE public.bookings
    SET status = 'quoted',
        updated_at = now()
    WHERE id = p_booking_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'quotation_id', v_target_quote_id,
    'reference_code', v_reference_code,
    'version', v_target_version,
    'status', v_target_status,
    'subtotal_kobo', v_subtotal_kobo,
    'labour_charges_kobo', v_labour_charges_kobo,
    'materials_costs_kobo', v_materials_costs_kobo,
    'additional_expenses_kobo', v_additional_expenses_kobo,
    'total_amount_kobo', v_total_amount_kobo,
    'is_revision_of_accepted', v_is_revision_of_accepted,
    'items_count', jsonb_array_length(v_item_list)
  );
END;
$$;

-- ============================================================================
-- 4. STORED PROCEDURE: WITHDRAW QUOTATION
-- Professional withdraws an unaccepted quotation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.withdraw_quotation(
  p_quotation_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_quote RECORD;
  v_is_pro_owner BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_quote
  FROM public.quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Quotation not found');
  END IF;

  -- Check professional ownership
  SELECT (user_id = v_caller_id) INTO v_is_pro_owner
  FROM public.professional_profiles
  WHERE id = v_quote.professional_id;

  IF NOT (v_is_pro_owner IS TRUE OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Not authorized to withdraw this quotation');
  END IF;

  IF v_quote.status = 'accepted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_ACCEPTED',
      'message', 'Accepted quotations cannot be withdrawn. Please communicate with the customer or contact platform support.'
    );
  END IF;

  IF v_quote.status = 'withdrawn' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Quotation is already withdrawn', 'quotation_id', p_quotation_id);
  END IF;

  UPDATE public.quotations
  SET status = 'withdrawn',
      withdrawn_at = now(),
      withdrawal_reason = p_reason,
      updated_at = now()
  WHERE id = p_quotation_id;

  -- Record in version history
  INSERT INTO public.quotation_versions (
    quotation_id,
    booking_id,
    professional_id,
    version_number,
    status,
    subtotal_kobo,
    labour_charges_kobo,
    materials_costs_kobo,
    additional_expenses_kobo,
    tax_kobo,
    total_amount_kobo,
    currency_code,
    estimated_duration_minutes,
    work_description,
    notes,
    change_summary,
    created_by
  ) VALUES (
    p_quotation_id,
    v_quote.booking_id,
    v_quote.professional_id,
    v_quote.version,
    'withdrawn',
    v_quote.subtotal_kobo,
    v_quote.labour_charges_kobo,
    v_quote.materials_costs_kobo,
    v_quote.additional_expenses_kobo,
    v_quote.tax_kobo,
    v_quote.total_amount_kobo,
    v_quote.currency_code,
    v_quote.estimated_duration_minutes,
    v_quote.work_description,
    v_quote.notes,
    'Quotation withdrawn by professional. Reason: ' || coalesce(p_reason, 'No reason specified'),
    v_caller_id
  )
  ON CONFLICT (quotation_id, version_number) DO UPDATE
  SET status = 'withdrawn',
      change_summary = EXCLUDED.change_summary;

  RETURN jsonb_build_object(
    'success', true,
    'quotation_id', p_quotation_id,
    'status', 'withdrawn',
    'withdrawn_at', now()
  );
END;
$$;

-- ============================================================================
-- 5. STORED PROCEDURE: DECLINE BOOKING QUOTATION
-- Customer declines a quotation and provides reason
-- ============================================================================

CREATE OR REPLACE FUNCTION public.decline_booking_quotation(
  p_quotation_id UUID,
  p_decline_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_quote RECORD;
  v_booking RECORD;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_quote
  FROM public.quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Quotation not found');
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_quote.booking_id;

  IF NOT (v_booking.customer_id = v_caller_id OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the customer can decline quotations for this booking');
  END IF;

  IF v_quote.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_ACCEPTED', 'message', 'Cannot decline an already accepted quotation');
  END IF;

  UPDATE public.quotations
  SET status = 'declined',
      declined_at = now(),
      decline_reason = p_decline_reason,
      updated_at = now()
  WHERE id = p_quotation_id;

  -- Record in version history
  INSERT INTO public.quotation_versions (
    quotation_id,
    booking_id,
    professional_id,
    version_number,
    status,
    subtotal_kobo,
    labour_charges_kobo,
    materials_costs_kobo,
    additional_expenses_kobo,
    tax_kobo,
    total_amount_kobo,
    currency_code,
    estimated_duration_minutes,
    work_description,
    notes,
    change_summary,
    created_by
  ) VALUES (
    p_quotation_id,
    v_quote.booking_id,
    v_quote.professional_id,
    v_quote.version,
    'declined',
    v_quote.subtotal_kobo,
    v_quote.labour_charges_kobo,
    v_quote.materials_costs_kobo,
    v_quote.additional_expenses_kobo,
    v_quote.tax_kobo,
    v_quote.total_amount_kobo,
    v_quote.currency_code,
    v_quote.estimated_duration_minutes,
    v_quote.work_description,
    v_quote.notes,
    'Quotation declined by customer. Reason: ' || coalesce(p_decline_reason, 'No reason specified'),
    v_caller_id
  )
  ON CONFLICT (quotation_id, version_number) DO UPDATE
  SET status = 'declined',
      change_summary = EXCLUDED.change_summary;

  RETURN jsonb_build_object(
    'success', true,
    'quotation_id', p_quotation_id,
    'status', 'declined',
    'declined_at', now()
  );
END;
$$;

-- ============================================================================
-- 6. STORED PROCEDURE: REQUEST QUOTATION CLARIFICATION
-- Customer requests clarification or details regarding quotation line items
-- ============================================================================

CREATE OR REPLACE FUNCTION public.request_quotation_clarification(
  p_quotation_id UUID,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_quote RECORD;
  v_booking RECORD;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  IF p_notes IS NULL OR char_length(trim(p_notes)) < 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'VALIDATION_ERROR',
      'message', 'Please provide a clear question or clarification note (at least 5 characters).'
    );
  END IF;

  SELECT * INTO v_quote
  FROM public.quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Quotation not found');
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_quote.booking_id;

  IF NOT (v_booking.customer_id = v_caller_id OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the customer can request clarification on this quotation');
  END IF;

  UPDATE public.quotations
  SET clarification_requested_at = now(),
      clarification_notes = trim(p_notes),
      updated_at = now()
  WHERE id = p_quotation_id;

  RETURN jsonb_build_object(
    'success', true,
    'quotation_id', p_quotation_id,
    'clarification_requested_at', now(),
    'clarification_notes', trim(p_notes)
  );
END;
$$;

-- ============================================================================
-- 7. UPDATE ACCEPT_BOOKING_QUOTATION WITH EXPIRATION CHECK (Rule 6)
-- Expired quotations cannot be accepted
-- Acceptance timestamps recorded (Rule 7)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_booking_quotation(
  p_booking_id UUID,
  p_quotation_id UUID,
  p_scheduled_start TIMESTAMPTZ DEFAULT NULL,
  p_scheduled_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_quotation RECORD;
  v_pro RECORD;
  v_caller_id UUID;
  v_is_admin BOOLEAN;
  v_has_conflict BOOLEAN;
  v_appointment_id UUID;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_new_status public.booking_status;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  -- 1. Fetch & lock booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  -- Customer authorization
  IF NOT (v_booking.customer_id = v_caller_id OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the customer can accept quotations for this booking');
  END IF;

  -- 2. Fetch & lock quotation
  SELECT * INTO v_quotation
  FROM public.quotations
  WHERE id = p_quotation_id AND booking_id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Quotation not found for this booking');
  END IF;

  IF v_quotation.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE', 'message', 'Quotation is not in pending status');
  END IF;

  -- RULE 6: Expired quotations cannot be accepted
  IF v_quotation.valid_until IS NOT NULL AND v_quotation.valid_until < now() THEN
    -- Mark quotation as expired
    UPDATE public.quotations
    SET status = 'expired',
        updated_at = now()
    WHERE id = p_quotation_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'QUOTATION_EXPIRED',
      'message', 'This quotation has expired and can no longer be accepted. Please request a new quote from the professional.'
    );
  END IF;

  -- 3. Validate professional eligibility
  SELECT * INTO v_pro
  FROM public.professional_profiles
  WHERE id = v_quotation.professional_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Quoting professional profile not found');
  END IF;

  IF v_pro.verification_status IN ('rejected', 'suspended') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PRO_INELIGIBLE',
      'message', 'This professional is currently not eligible to accept jobs'
    );
  END IF;

  -- 4. Calculate appointment timing
  v_start := coalesce(p_scheduled_start, v_quotation.proposed_start_at, (v_booking.preferred_date::text || ' 09:00:00')::timestamptz);
  v_end := coalesce(p_scheduled_end, v_start + (v_quotation.estimated_duration_minutes || ' minutes')::interval);

  -- 5. Prevent conflicting appointment confirmations
  v_has_conflict := public.check_appointment_conflict(v_quotation.professional_id, v_start, v_end);
  IF v_has_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'APPOINTMENT_CONFLICT',
      'message', 'The professional has an existing confirmed appointment during this proposed time slot. Please select an alternate time.'
    );
  END IF;

  -- 6. Update the accepted quotation (RULE 7: Record acceptance timestamp)
  UPDATE public.quotations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = p_quotation_id;

  -- Snapshot accepted state in quotation_versions
  INSERT INTO public.quotation_versions (
    quotation_id,
    booking_id,
    professional_id,
    version_number,
    status,
    subtotal_kobo,
    labour_charges_kobo,
    materials_costs_kobo,
    additional_expenses_kobo,
    tax_kobo,
    total_amount_kobo,
    currency_code,
    estimated_duration_minutes,
    proposed_start_at,
    valid_until,
    work_description,
    notes,
    change_summary,
    created_by
  ) VALUES (
    p_quotation_id,
    p_booking_id,
    v_quotation.professional_id,
    v_quotation.version,
    'accepted',
    v_quotation.subtotal_kobo,
    v_quotation.labour_charges_kobo,
    v_quotation.materials_costs_kobo,
    v_quotation.additional_expenses_kobo,
    v_quotation.tax_kobo,
    v_quotation.total_amount_kobo,
    v_quotation.currency_code,
    v_quotation.estimated_duration_minutes,
    v_quotation.proposed_start_at,
    v_quotation.valid_until,
    v_quotation.work_description,
    v_quotation.notes,
    'Quotation officially accepted by customer. Acceptance timestamp recorded.',
    v_caller_id
  )
  ON CONFLICT (quotation_id, version_number) DO UPDATE
  SET status = 'accepted',
      change_summary = EXCLUDED.change_summary;

  -- 7. Decline all other competing pending quotations for this booking
  UPDATE public.quotations
  SET status = 'declined',
      declined_at = now(),
      decline_reason = 'Automated: Customer accepted another quotation',
      notes = coalesce(notes, '') || ' [Automated: Customer accepted another quotation]',
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND id <> p_quotation_id
    AND status IN ('pending', 'draft');

  -- 8. Determine target booking status
  v_new_status := 'confirmed'::public.booking_status;

  -- 9. Update the booking
  UPDATE public.bookings
  SET status = v_new_status,
      professional_id = v_quotation.professional_id,
      accepted_quotation_id = p_quotation_id,
      agreed_amount_kobo = v_quotation.total_amount_kobo,
      scheduled_start_at = v_start,
      scheduled_end_at = v_end,
      updated_at = now()
  WHERE id = p_booking_id;

  -- 10. Insert appointment record
  INSERT INTO public.appointments (
    booking_id,
    quotation_id,
    professional_id,
    customer_id,
    scheduled_date,
    start_time,
    end_time,
    scheduled_start_at,
    scheduled_end_at,
    status,
    notes,
    confirmed_at
  ) VALUES (
    p_booking_id,
    p_quotation_id,
    v_quotation.professional_id,
    v_booking.customer_id,
    v_start::date,
    v_start::time,
    v_end::time,
    v_start,
    v_end,
    'confirmed',
    'Appointment confirmed upon quotation acceptance',
    now()
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'quotation_id', p_quotation_id,
    'appointment_id', v_appointment_id,
    'status', v_new_status,
    'agreed_amount_kobo', v_quotation.total_amount_kobo,
    'accepted_at', now(),
    'scheduled_start_at', v_start,
    'scheduled_end_at', v_end
  );
END;
$$;

COMMIT;
