-- ============================================================================
-- EASYLIFE PLATFORM: BOOKING & APPOINTMENT MANAGEMENT ENGINE
-- Migration: 20261104000800_booking_and_appointment_engine.sql
-- ============================================================================

-- Note: Enum values for booking_status ('submitted', 'pending_pro_response', 'accepted', 'confirmed')
-- are added outside transaction or via idempotent checks.
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'submitted';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'pending_pro_response';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'accepted';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'confirmed';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

BEGIN;

-- ============================================================================
-- 1. APPOINTMENTS TABLE
-- Dedicated schedule records linked to bookings, quotations, customer & pro
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled')),
  notes TEXT,
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_range_chk CHECK (scheduled_end_at > scheduled_start_at)
);

CREATE INDEX IF NOT EXISTS idx_appointments_booking_id
  ON public.appointments(booking_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_professional_window
  ON public.appointments(professional_id, scheduled_start_at, scheduled_end_at)
  WHERE status IN ('requested', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_customer_id
  ON public.appointments(customer_id, scheduled_start_at DESC);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies on Appointments
DROP POLICY IF EXISTS "appointments_customer_select" ON public.appointments;
CREATE POLICY "appointments_customer_select" ON public.appointments
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "appointments_pro_select" ON public.appointments;
CREATE POLICY "appointments_pro_select" ON public.appointments
  FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "appointments_authenticated_insert" ON public.appointments;
CREATE POLICY "appointments_authenticated_insert" ON public.appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid())
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "appointments_participant_update" ON public.appointments;
CREATE POLICY "appointments_participant_update" ON public.appointments
  FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- ============================================================================
-- 2. APPOINTMENT CONFLICT CHECKING ENGINE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_appointment_conflict(
  p_professional_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INT;
BEGIN
  -- Overlap condition: existing.start < new.end AND existing.end > new.start
  SELECT count(*)
  INTO v_conflict_count
  FROM public.appointments
  WHERE professional_id = p_professional_id
    AND status IN ('requested', 'confirmed')
    AND (p_exclude_appointment_id IS NULL OR id <> p_exclude_appointment_id)
    AND scheduled_start_at < p_end
    AND scheduled_end_at > p_start;

  RETURN v_conflict_count > 0;
END;
$$;

-- ============================================================================
-- 3. DUPLICATE SUBMISSION CHECKING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_duplicate_booking(
  p_customer_id UUID,
  p_category_id UUID,
  p_service_address TEXT,
  p_title TEXT,
  p_window_seconds INT DEFAULT 180
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_booking_id UUID,
  existing_reference_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_ref TEXT;
BEGIN
  SELECT b.id, b.reference_code
  INTO v_id, v_ref
  FROM public.bookings b
  WHERE b.customer_id = p_customer_id
    AND b.category_id = p_category_id
    AND lower(trim(b.service_address)) = lower(trim(p_service_address))
    AND lower(trim(b.title)) = lower(trim(p_title))
    AND b.status IN ('draft', 'submitted', 'pending_pro_response', 'open')
    AND b.created_at > (now() - (p_window_seconds || ' seconds')::interval)
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_id, v_ref;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$;

-- ============================================================================
-- 4. ATOMIC QUOTATION ACCEPTANCE RPC
-- Atomically accepts quotation, declines competitors, updates booking,
-- and schedules appointment.
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
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_has_conflict BOOLEAN;
  v_new_status public.booking_status;
  v_appointment_id UUID;
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

  -- Verify permissions: must be customer or admin
  IF v_booking.customer_id <> v_caller_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the customer can accept quotations for this booking');
  END IF;

  -- Verify booking status allows accepting quote
  IF v_booking.status NOT IN ('quoted', 'open', 'submitted', 'pending_pro_response') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATE',
      'message', format('Cannot accept quotation when booking status is %s', v_booking.status)
    );
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
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE', 'message', 'Quotation is no longer pending');
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

  -- 6. Update the accepted quotation
  UPDATE public.quotations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = p_quotation_id;

  -- 7. Decline all other competing pending quotations for this booking
  UPDATE public.quotations
  SET status = 'declined',
      declined_at = now(),
      notes = coalesce(notes, '') || ' [Automated: Customer accepted another quotation]',
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND id <> p_quotation_id
    AND status = 'pending';

  -- 8. Determine target booking status
  -- If timing is confirmed, advance to 'confirmed' (or 'scheduled'); else 'accepted'
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
    'scheduled_start_at', v_start,
    'scheduled_end_at', v_end
  );
END;
$$;

-- ============================================================================
-- 5. APPOINTMENT CONFIRMATION & RESCHEDULE RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.confirm_booking_appointment(
  p_booking_id UUID,
  p_scheduled_start TIMESTAMPTZ,
  p_scheduled_end TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_caller_id UUID;
  v_is_customer BOOLEAN;
  v_is_pro BOOLEAN;
  v_is_admin BOOLEAN;
  v_has_conflict BOOLEAN;
  v_appointment_id UUID;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  v_is_customer := (v_booking.customer_id = v_caller_id);
  v_is_pro := EXISTS (
    SELECT 1 FROM public.professional_profiles
    WHERE id = v_booking.professional_id AND user_id = v_caller_id
  );

  IF NOT (v_is_customer OR v_is_pro OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Not authorized to confirm this appointment');
  END IF;

  -- REQUIRE QUOTATION ACCEPTANCE: A quoted job must be accepted before confirmed
  IF v_booking.status IN ('open', 'submitted', 'pending_pro_response', 'quoted') AND v_booking.accepted_quotation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'QUOTATION_ACCEPTANCE_REQUIRED',
      'message', 'A quotation must be accepted by the customer before the appointment can be confirmed.'
    );
  END IF;

  -- Validate timing
  IF p_scheduled_end <= p_scheduled_start THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TIME', 'message', 'End time must be after start time');
  END IF;

  -- Check conflict on professional's calendar
  IF v_booking.professional_id IS NOT NULL THEN
    v_has_conflict := public.check_appointment_conflict(
      v_booking.professional_id,
      p_scheduled_start,
      p_scheduled_end
    );
    IF v_has_conflict THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'APPOINTMENT_CONFLICT',
        'message', 'The professional has a conflicting confirmed appointment during this window.'
      );
    END IF;
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET status = 'confirmed'::public.booking_status,
      scheduled_start_at = p_scheduled_start,
      scheduled_end_at = p_scheduled_end,
      preferred_date = p_scheduled_start::date,
      updated_at = now()
  WHERE id = p_booking_id;

  -- Upsert appointment
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
    v_booking.accepted_quotation_id,
    v_booking.professional_id,
    v_booking.customer_id,
    p_scheduled_start::date,
    p_scheduled_start::time,
    p_scheduled_end::time,
    p_scheduled_start,
    p_scheduled_end,
    'confirmed',
    p_notes,
    now()
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'appointment_id', v_appointment_id,
    'status', 'confirmed',
    'scheduled_start_at', p_scheduled_start,
    'scheduled_end_at', p_scheduled_end
  );
END;
$$;

-- ============================================================================
-- 6. CONFIGURABLE CANCELLATION RPC
-- Enforces permissions, cancellation windows, and updates historical log
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_booking_with_policy(
  p_booking_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_caller_id UUID;
  v_is_customer BOOLEAN;
  v_is_pro BOOLEAN;
  v_is_admin BOOLEAN;
  v_hours_until_start NUMERIC;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  v_is_customer := (v_booking.customer_id = v_caller_id);
  v_is_pro := EXISTS (
    SELECT 1 FROM public.professional_profiles
    WHERE id = v_booking.professional_id AND user_id = v_caller_id
  );

  IF NOT (v_is_customer OR v_is_pro OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'You do not have permission to cancel this booking');
  END IF;

  -- Cancellation Policy: In-progress or completed cannot be directly cancelled
  IF v_booking.status IN ('in_progress') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'JOB_IN_PROGRESS',
      'message', 'Job is already in progress on site. If there is an issue, please raise a dispute instead of cancelling.'
    );
  END IF;

  IF v_booking.status IN ('completed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'JOB_COMPLETED',
      'message', 'Completed bookings cannot be cancelled.'
    );
  END IF;

  IF v_booking.status IN ('cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_CANCELLED',
      'message', 'This booking has already been cancelled.'
    );
  END IF;

  -- Calculate cancellation timing window
  IF v_booking.scheduled_start_at IS NOT NULL THEN
    v_hours_until_start := extract(EPOCH FROM (v_booking.scheduled_start_at - now())) / 3600.0;
  ELSE
    v_hours_until_start := 999;
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET status = 'cancelled'::public.booking_status,
      cancelled_at = now(),
      cancelled_by = v_caller_id,
      cancellation_reason = p_reason,
      updated_at = now()
  WHERE id = p_booking_id;

  -- Cancel related appointments
  UPDATE public.appointments
  SET status = 'cancelled',
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND status IN ('requested', 'confirmed');

  -- Update accepted quotation if any
  IF v_booking.accepted_quotation_id IS NOT NULL THEN
    UPDATE public.quotations
    SET status = 'withdrawn',
        withdrawn_at = now(),
        updated_at = now()
    WHERE id = v_booking.accepted_quotation_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'cancelled',
    'hours_before_schedule', v_hours_until_start,
    'reason', p_reason
  );
END;
$$;

-- ============================================================================
-- 7. JOB EXECUTION STATUS TRANSITION RPC
-- Allows professional to begin job and submit completion request
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_booking_job_execution(
  p_booking_id UUID,
  p_action TEXT, -- 'begin_job' | 'submit_completion'
  p_completion_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_caller_id UUID;
  v_is_pro BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  v_is_admin := public.is_admin();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  v_is_pro := EXISTS (
    SELECT 1 FROM public.professional_profiles
    WHERE id = v_booking.professional_id AND user_id = v_caller_id
  );

  IF NOT (v_is_pro OR v_is_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only the assigned professional can update job execution');
  END IF;

  IF p_action = 'begin_job' THEN
    IF v_booking.status NOT IN ('confirmed', 'accepted', 'scheduled') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INVALID_STATE',
        'message', format('Cannot start job from status: %s. Appointment must be confirmed.', v_booking.status)
      );
    END IF;

    UPDATE public.bookings
    SET status = 'in_progress'::public.booking_status,
        updated_at = now()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'in_progress');

  ELSIF p_action = 'submit_completion' THEN
    IF v_booking.status <> 'in_progress' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'INVALID_STATE',
        'message', format('Cannot complete job from status: %s. Job must be in progress.', v_booking.status)
      );
    END IF;

    UPDATE public.bookings
    SET status = 'completed'::public.booking_status,
        pro_marked_complete_at = now(),
        completed_at = now(),
        pro_completion_notes = p_completion_notes,
        updated_at = now()
    WHERE id = p_booking_id;

    -- Complete related appointment
    UPDATE public.appointments
    SET status = 'completed',
        updated_at = now()
    WHERE booking_id = p_booking_id
      AND status = 'confirmed';

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'completed');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTION', 'message', 'Unknown action');
  END IF;
END;
$$;

COMMIT;
