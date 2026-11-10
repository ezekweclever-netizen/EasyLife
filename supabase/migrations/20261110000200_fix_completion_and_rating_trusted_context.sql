-- ============================================================================
-- EasyLife Migration: 20261110000200_fix_completion_and_rating_trusted_context.sql
-- Fixes customer completion confirmation & verified review recalculation so
-- SECURITY DEFINER RPCs/triggers can update system-managed counters on
-- professional_profiles while direct user writes remain strictly blocked.
-- ============================================================================

BEGIN;

-- 1. Allow enforce_verified_review_and_recalculate() to update pro ratings safely
CREATE OR REPLACE FUNCTION public.enforce_verified_review_and_recalculate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_prev_trusted TEXT;
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

  v_prev_trusted := current_setting('easylife.trusted_admin_rpc', true);
  PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

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

  PERFORM set_config('easylife.trusted_admin_rpc', coalesce(nullif(v_prev_trusted, ''), 'false'), true);

  RETURN NEW;
END;
$$;

-- 2. Allow confirm_booking_completion() to increment completed_jobs_count safely
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
  v_prev_trusted TEXT;
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

  IF v_booking.professional_id IS NOT NULL THEN
    v_prev_trusted := current_setting('easylife.trusted_admin_rpc', true);
    PERFORM set_config('easylife.trusted_admin_rpc', 'true', true);

    UPDATE public.professional_profiles
    SET completed_jobs_count = completed_jobs_count + 1,
        updated_at = now()
    WHERE id = v_booking.professional_id
    RETURNING business_name INTO v_pro_name;

    PERFORM set_config('easylife.trusted_admin_rpc', coalesce(nullif(v_prev_trusted, ''), 'false'), true);
  END IF;

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

REVOKE ALL ON FUNCTION public.confirm_booking_completion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_booking_completion(uuid) TO authenticated, service_role;

COMMIT;
