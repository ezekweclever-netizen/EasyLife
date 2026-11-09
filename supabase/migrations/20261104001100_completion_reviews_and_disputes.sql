-- ============================================================================
-- EasyLife Migration: 20261104001100_completion_reviews_and_disputes.sql
-- Prompt 14: Job Completion, Reviews, and Dispute Management System
-- ============================================================================

BEGIN;

-- 1. EXTEND DISPUTE STATUS ENUM & DISPUTES TABLE
-- Add missing Prompt 14 dispute statuses: 'awaiting_information', 'resolved', 'rejected'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dispute_status' AND e.enumlabel = 'awaiting_information'
  ) THEN
    ALTER TYPE public.dispute_status ADD VALUE 'awaiting_information';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dispute_status' AND e.enumlabel = 'resolved'
  ) THEN
    ALTER TYPE public.dispute_status ADD VALUE 'resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dispute_status' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE public.dispute_status ADD VALUE 'rejected';
  END IF;
END $$;

-- Expand category check constraint on public.disputes to match Prompt 14 categories
DO $$
BEGIN
  -- Drop existing check constraint if present
  ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_category_check;

  -- Add updated check constraint supporting all explicit Prompt 14 dispute categories
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_category_check CHECK (
    category IN (
      'incomplete_work',
      'poor_workmanship',
      'quality_issue',
      'unapproved_charges',
      'pricing_disagreement',
      'missed_appointment',
      'no_show',
      'property_damage',
      'safety_concern',
      'other'
    )
  );
END $$;

-- Add assigned_admin_id, internal_notes, resolution_type, refund_amount_kobo to disputes
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolution_type TEXT CHECK (
    resolution_type IS NULL OR resolution_type IN (
      'full_refund',
      'partial_refund',
      'release_to_professional',
      'rework_required',
      'rejected_unfounded',
      'mutual_agreement'
    )
  ),
  ADD COLUMN IF NOT EXISTS refund_amount_kobo BIGINT NOT NULL DEFAULT 0 CHECK (refund_amount_kobo >= 0);

CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin
  ON public.disputes(assigned_admin_id)
  WHERE assigned_admin_id IS NOT NULL;

-- 2. CREATE DISPUTE INTERNAL NOTES TABLE (Private administrator investigation log)
CREATE TABLE IF NOT EXISTS public.dispute_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note TEXT NOT NULL CHECK (char_length(trim(note)) >= 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_internal_notes_dispute
  ON public.dispute_internal_notes(dispute_id, created_at ASC);

ALTER TABLE public.dispute_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dispute_internal_notes_admin_all" ON public.dispute_internal_notes;
CREATE POLICY "dispute_internal_notes_admin_all" ON public.dispute_internal_notes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. EXTEND REVIEWS TABLE WITH MODERATION & HISTORY SUPPORT
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (
    moderation_status IN ('approved', 'pending', 'flagged', 'rejected')
  ),
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS original_comment TEXT,
  ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reviews_moderation
  ON public.reviews(moderation_status, is_flagged);

-- 4. CREATE REVIEW HISTORY TABLE (Preserves review edits and moderation logs)
CREATE TABLE IF NOT EXISTS public.review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_history_review
  ON public.review_history(review_id, created_at DESC);

ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_history_select_parties" ON public.review_history;
CREATE POLICY "review_history_select_parties" ON public.review_history
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND (r.reviewer_user_id = auth.uid() OR r.professional_id = auth.uid())
    )
  );

-- Trigger to automatically capture review history on update
CREATE OR REPLACE FUNCTION public.capture_review_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.comment <> NEW.comment OR
    OLD.rating <> NEW.rating OR
    OLD.title IS DISTINCT FROM NEW.title
  ) THEN
    INSERT INTO public.review_history (
      review_id,
      booking_id,
      rating,
      title,
      comment,
      photos,
      changed_by,
      change_reason
    ) VALUES (
      OLD.id,
      OLD.booking_id,
      OLD.rating,
      OLD.title,
      OLD.comment,
      OLD.photos,
      coalesce(auth.uid(), OLD.reviewer_user_id),
      'Customer edited review feedback'
    );
    NEW.edit_count := OLD.edit_count + 1;
    IF NEW.original_comment IS NULL THEN
      NEW.original_comment := OLD.comment;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_capture_history ON public.reviews;
CREATE TRIGGER trg_reviews_capture_history
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.capture_review_history();

-- 5. EXTEND BOOKINGS TABLE FOR REWORK & DISPUTE BLOCKING
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rework_notes TEXT,
  ADD COLUMN IF NOT EXISTS rework_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rework_count INT NOT NULL DEFAULT 0;

-- Ensure disputed bookings cannot transition to completed
CREATE OR REPLACE FUNCTION public.prevent_disputed_booking_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'disputed' THEN
    RAISE EXCEPTION 'A disputed booking cannot be directly marked as completed without administrative dispute resolution.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_prevent_disputed_completion ON public.bookings;
CREATE TRIGGER trg_bookings_prevent_disputed_completion
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_disputed_booking_completion();

-- 6. STORED PROCEDURES / RPCs FOR JOB COMPLETION, REVIEWS & DISPUTES

-- 6.1 Professional Submit Completion Request
CREATE OR REPLACE FUNCTION public.pro_submit_job_completion(
  p_booking_id UUID,
  p_notes TEXT,
  p_photos TEXT[] DEFAULT '{}'::text[]
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_pro_profile public.professional_profiles%ROWTYPE;
  v_photo_url TEXT;
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

  -- Verify actor is assigned professional
  SELECT * INTO v_pro_profile
  FROM public.professional_profiles
  WHERE id = v_booking.professional_id AND user_id = v_actor_id;

  IF v_pro_profile.id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the assigned professional can submit job completion.';
  END IF;

  IF v_booking.status = 'disputed' THEN
    RAISE EXCEPTION 'Cannot submit completion on a disputed booking.';
  END IF;

  IF v_booking.status NOT IN ('in_progress', 'scheduled', 'confirmed') THEN
    RAISE EXCEPTION 'Completion can only be submitted for in-progress or scheduled bookings. Current status: %', v_booking.status;
  END IF;

  UPDATE public.bookings
  SET status = 'pro_marked_complete',
      pro_marked_complete_at = now(),
      pro_completion_notes = p_notes,
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Store completion photos in booking_attachments
  IF p_photos IS NOT NULL AND array_length(p_photos, 1) > 0 THEN
    FOREACH v_photo_url IN ARRAY p_photos LOOP
      INSERT INTO public.booking_attachments (
        booking_id,
        uploaded_by,
        storage_bucket,
        storage_path,
        file_name,
        mime_type,
        file_size_bytes,
        attachment_stage,
        caption
      ) VALUES (
        v_booking.id,
        v_actor_id,
        'service-request-media',
        v_photo_url,
        coalesce(split_part(v_photo_url, '/', -1), 'completion_proof.jpg'),
        'image/jpeg',
        1048576,
        'completion',
        'Professional completion proof photograph'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Status progression history
  INSERT INTO public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    changed_by,
    reason
  ) VALUES (
    v_booking.id,
    'in_progress',
    'pro_marked_complete',
    v_actor_id,
    coalesce(p_notes, 'Professional submitted completion request for customer inspection.')
  );

  -- Send notification to customer
  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    action_url,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_booking.customer_id,
    'job_completion_request',
    'Job Completion Request Submitted',
    coalesce(v_pro_profile.business_name, 'Specialist') || ' has requested your inspection and completion approval for booking #' || v_booking.reference_code || '.',
    '/bookings/' || v_booking.id,
    'booking',
    v_booking.id,
    jsonb_build_object('booking_id', v_booking.id, 'reference_code', v_booking.reference_code, 'actor_user_id', v_actor_id)
  );

  RETURN v_booking;
END;
$$;

-- 6.2 Customer Report Incomplete Work (Rework Request)
CREATE OR REPLACE FUNCTION public.customer_report_incomplete_work(
  p_booking_id UUID,
  p_reason TEXT,
  p_photos TEXT[] DEFAULT '{}'::text[]
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_pro_user_id UUID;
  v_photo_url TEXT;
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
    RAISE EXCEPTION 'FORBIDDEN: Only the customer who booked the service can report incomplete work.';
  END IF;

  IF v_booking.status <> 'pro_marked_complete' THEN
    RAISE EXCEPTION 'Incomplete work can only be reported after a professional submits completion. Current status: %', v_booking.status;
  END IF;

  IF length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Please provide a clear description (at least 5 characters) of the incomplete tasks.';
  END IF;

  SELECT user_id INTO v_pro_user_id
  FROM public.professional_profiles
  WHERE id = v_booking.professional_id;

  -- Revert status to in_progress with rework notes
  UPDATE public.bookings
  SET status = 'in_progress',
      rework_notes = p_reason,
      rework_requested_at = now(),
      rework_count = rework_count + 1,
      updated_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Store customer's supporting incomplete work photographs
  IF p_photos IS NOT NULL AND array_length(p_photos, 1) > 0 THEN
    FOREACH v_photo_url IN ARRAY p_photos LOOP
      INSERT INTO public.booking_attachments (
        booking_id,
        uploaded_by,
        storage_bucket,
        storage_path,
        file_name,
        mime_type,
        file_size_bytes,
        attachment_stage,
        caption
      ) VALUES (
        v_booking.id,
        v_actor_id,
        'service-request-media',
        v_photo_url,
        coalesce(split_part(v_photo_url, '/', -1), 'incomplete_work_evidence.jpg'),
        'image/jpeg',
        1048576,
        'completion',
        'Customer reported incomplete work'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Log status history
  INSERT INTO public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    changed_by,
    reason
  ) VALUES (
    v_booking.id,
    'pro_marked_complete',
    'in_progress',
    v_actor_id,
    'Customer reported incomplete work: ' || p_reason
  );

  -- Notify professional with customer feedback
  IF v_pro_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_pro_user_id,
      'booking_status_change',
      'Incomplete Work Reported by Customer',
      'Customer reported that tasks remain unfinished on booking #' || v_booking.reference_code || ': "' || left(p_reason, 120) || '". Please review and complete.',
      '/pro/jobs/' || v_booking.id,
      'booking',
      v_booking.id,
      jsonb_build_object('booking_id', v_booking.id, 'rework_reason', p_reason, 'actor_user_id', v_actor_id)
    );
  END IF;

  RETURN v_booking;
END;
$$;

-- 6.3 Submit Formal Booking Dispute
CREATE OR REPLACE FUNCTION public.submit_booking_dispute(
  p_booking_id UUID,
  p_category TEXT,
  p_description TEXT,
  p_disputed_amount_kobo BIGINT DEFAULT 0,
  p_evidence JSONB DEFAULT '[]'::jsonb
)
RETURNS public.disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_dispute public.disputes%ROWTYPE;
  v_against_user_id UUID;
  v_ev JSONB;
  v_reference_code TEXT;
  v_admin_id UUID;
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

  -- Determine target user and validate eligibility
  IF v_booking.customer_id = v_actor_id THEN
    -- Customer filing dispute against professional
    SELECT user_id INTO v_against_user_id
    FROM public.professional_profiles
    WHERE id = v_booking.professional_id;
  ELSE
    -- Professional or business filing dispute
    SELECT user_id INTO v_against_user_id
    FROM public.professional_profiles
    WHERE id = v_booking.professional_id;

    IF v_against_user_id = v_actor_id THEN
      v_against_user_id := v_booking.customer_id;
    ELSE
      RAISE EXCEPTION 'FORBIDDEN: You are not an authorised party to this booking.';
    END IF;
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot open a dispute on a cancelled booking.';
  END IF;

  -- Check for existing active dispute
  IF EXISTS (
    SELECT 1 FROM public.disputes
    WHERE booking_id = v_booking.id AND status IN ('open', 'under_review', 'awaiting_information')
  ) THEN
    RAISE EXCEPTION 'An active dispute is already open for this booking.';
  END IF;

  IF length(trim(p_description)) < 10 THEN
    RAISE EXCEPTION 'Please provide a detailed dispute description (minimum 10 characters).';
  END IF;

  -- Generate reference code
  v_reference_code := public.generate_reference_code('EL-DP');

  -- Create dispute record
  INSERT INTO public.disputes (
    reference_code,
    booking_id,
    opened_by_user_id,
    against_user_id,
    category,
    description,
    disputed_amount_kobo,
    currency_code,
    status
  ) VALUES (
    v_reference_code,
    v_booking.id,
    v_actor_id,
    coalesce(v_against_user_id, v_booking.customer_id),
    p_category,
    p_description,
    coalesce(p_disputed_amount_kobo, v_booking.agreed_amount_kobo, 0),
    v_booking.currency_code,
    'open'
  ) RETURNING * INTO v_dispute;

  -- Insert evidence if provided
  IF p_evidence IS NOT NULL AND jsonb_array_length(p_evidence) > 0 THEN
    FOR v_ev IN SELECT * FROM jsonb_array_elements(p_evidence) LOOP
      INSERT INTO public.dispute_evidence (
        dispute_id,
        submitted_by_user_id,
        storage_bucket,
        storage_path,
        file_name,
        mime_type,
        file_size_bytes,
        description
      ) VALUES (
        v_dispute.id,
        v_actor_id,
        'maintenance-and-disputes',
        coalesce(v_ev->>'storage_path', v_ev->>'url', 'evidence.jpg'),
        coalesce(v_ev->>'file_name', 'dispute_evidence.jpg'),
        coalesce(v_ev->>'mime_type', 'image/jpeg'),
        coalesce((v_ev->>'file_size_bytes')::bigint, 1048576),
        v_ev->>'description'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Transition parent booking status to 'disputed'
  UPDATE public.bookings
  SET status = 'disputed',
      updated_at = now()
  WHERE id = v_booking.id;

  -- Log status history
  INSERT INTO public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    changed_by,
    reason
  ) VALUES (
    v_booking.id,
    v_booking.status,
    'disputed',
    v_actor_id,
    'Formal dispute opened (' || v_reference_code || '): ' || p_category || ' — ' || left(p_description, 100)
  );

  -- Notify recipient
  IF v_against_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_against_user_id,
      'dispute_update',
      'Dispute Opened for Booking #' || v_booking.reference_code,
      'A formal complaint has been filed regarding this service (' || replace(p_category, '_', ' ') || '). EasyLife administrative arbitration has been initiated.',
      '/bookings/' || v_booking.id,
      'booking',
      v_booking.id,
      jsonb_build_object('dispute_id', v_dispute.id, 'reference_code', v_reference_code, 'actor_user_id', v_actor_id)
    );
  END IF;

  -- Alert active administrators
  FOR v_admin_id IN (
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.is_active = true
    LIMIT 5
  ) LOOP
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_admin_id,
      'dispute_update',
      'New Dispute Filed: ' || v_reference_code,
      'Customer opened dispute on booking #' || v_booking.reference_code || ' (' || replace(p_category, '_', ' ') || ').',
      '/admin/disputes/' || v_dispute.id,
      'dispute',
      v_dispute.id,
      jsonb_build_object('dispute_id', v_dispute.id, 'reference_code', v_reference_code, 'actor_user_id', v_actor_id)
    );
  END LOOP;

  RETURN v_dispute;
END;
$$;

-- 6.4 Submit Verified Customer Review
CREATE OR REPLACE FUNCTION public.submit_booking_review(
  p_booking_id UUID,
  p_rating SMALLINT,
  p_title TEXT,
  p_comment TEXT,
  p_photos TEXT[] DEFAULT '{}'::text[]
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_review public.reviews%ROWTYPE;
  v_pro_user_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND deleted_at IS NULL;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- Rule 1: Restrict reviews to eligible customers
  IF v_booking.customer_id <> v_actor_id THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the customer who booked the service can submit a review.';
  END IF;

  -- Rule 2: Gated strictly to completed bookings
  IF v_booking.status <> 'completed' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for completed bookings. Current status: %', v_booking.status;
  END IF;

  -- Rule 3: Prevent professionals from reviewing their own jobs
  SELECT user_id INTO v_pro_user_id
  FROM public.professional_profiles
  WHERE id = v_booking.professional_id;

  IF v_pro_user_id = v_actor_id THEN
    RAISE EXCEPTION 'FORBIDDEN: Professionals cannot review their own jobs.';
  END IF;

  -- Rule 4: Prevent duplicate reviews
  IF EXISTS (SELECT 1 FROM public.reviews WHERE booking_id = v_booking.id) THEN
    RAISE EXCEPTION 'A review has already been submitted for this booking.';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5 stars.';
  END IF;

  IF length(trim(p_comment)) < 5 THEN
    RAISE EXCEPTION 'Please provide constructive written feedback (at least 5 characters).';
  END IF;

  INSERT INTO public.reviews (
    booking_id,
    reviewer_user_id,
    professional_id,
    rating,
    title,
    comment,
    photos,
    is_published,
    moderation_status
  ) VALUES (
    v_booking.id,
    v_actor_id,
    v_booking.professional_id,
    p_rating,
    p_title,
    p_comment,
    coalesce(p_photos, '{}'::text[]),
    true,
    'approved'
  ) RETURNING * INTO v_review;

  -- Notify professional of new review
  IF v_pro_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_pro_user_id,
      'customer_review',
      'New Customer Review (' || p_rating || '★)',
      'Customer left a ' || p_rating || '-star rating for booking #' || v_booking.reference_code || ': "' || left(p_comment, 80) || '".',
      '/pro/jobs/' || v_booking.id,
      'review',
      v_review.id,
      jsonb_build_object('review_id', v_review.id, 'rating', p_rating, 'actor_user_id', v_actor_id)
    );
  END IF;

  RETURN v_review;
END;
$$;

-- 6.5 Admin Update & Resolve Dispute (Arbitration Decision)
CREATE OR REPLACE FUNCTION public.admin_update_dispute(
  p_dispute_id UUID,
  p_status public.dispute_status,
  p_assigned_admin_id UUID DEFAULT NULL,
  p_internal_note TEXT DEFAULT NULL,
  p_resolution_type TEXT DEFAULT NULL,
  p_resolution_summary TEXT DEFAULT NULL,
  p_refund_amount_kobo BIGINT DEFAULT 0
)
RETURNS public.disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_dispute public.disputes%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to manage disputes.';
  END IF;

  SELECT * INTO v_dispute
  FROM public.disputes
  WHERE id = p_dispute_id
  FOR UPDATE;

  IF v_dispute.id IS NULL THEN
    RAISE EXCEPTION 'Dispute not found.';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_dispute.booking_id
  FOR UPDATE;

  -- Record internal note if provided
  IF p_internal_note IS NOT NULL AND length(trim(p_internal_note)) > 0 THEN
    INSERT INTO public.dispute_internal_notes (
      dispute_id,
      admin_user_id,
      note
    ) VALUES (
      v_dispute.id,
      v_admin_id,
      p_internal_note
    );
  END IF;

  -- Update dispute record
  UPDATE public.disputes
  SET status = p_status,
      assigned_admin_id = coalesce(p_assigned_admin_id, assigned_admin_id, v_admin_id),
      internal_notes = CASE
        WHEN p_internal_note IS NOT NULL THEN
          coalesce(internal_notes || E'\n===\n', '') || '[' || now()::text || '] ' || p_internal_note
        ELSE internal_notes
      END,
      resolution_type = coalesce(p_resolution_type, resolution_type),
      resolution_summary = coalesce(p_resolution_summary, resolution_summary),
      refund_amount_kobo = coalesce(p_refund_amount_kobo, refund_amount_kobo),
      resolved_by = CASE WHEN p_status IN ('resolved', 'rejected', 'closed', 'resolved_for_customer', 'resolved_for_professional') THEN v_admin_id ELSE resolved_by END,
      resolved_at = CASE WHEN p_status IN ('resolved', 'rejected', 'closed', 'resolved_for_customer', 'resolved_for_professional') THEN now() ELSE resolved_at END,
      updated_at = now()
  WHERE id = v_dispute.id
  RETURNING * INTO v_dispute;

  -- Synchronize parent booking status based on dispute outcome
  IF p_status IN ('resolved', 'resolved_for_customer') THEN
    IF p_resolution_type IN ('full_refund', 'partial_refund') THEN
      UPDATE public.bookings
      SET status = 'cancelled',
          cancellation_reason = 'Dispute resolved in customer favor (' || v_dispute.reference_code || '): ' || coalesce(p_resolution_summary, 'Refund granted'),
          updated_at = now()
      WHERE id = v_booking.id;
    ELSIF p_resolution_type = 'rework_required' THEN
      UPDATE public.bookings
      SET status = 'in_progress',
          rework_notes = coalesce(p_resolution_summary, 'Rework ordered by dispute arbitration'),
          updated_at = now()
      WHERE id = v_booking.id;
    ELSE
      UPDATE public.bookings
      SET status = 'completed',
          completed_at = now(),
          updated_at = now()
      WHERE id = v_booking.id;
    END IF;
  ELSIF p_status IN ('rejected', 'closed', 'resolved_for_professional') THEN
    IF p_resolution_type = 'release_to_professional' OR p_status = 'resolved_for_professional' THEN
      UPDATE public.bookings
      SET status = 'completed',
          completed_at = now(),
          updated_at = now()
      WHERE id = v_booking.id;
    ELSE
      -- Rejected unfounded complaint returns to pro_marked_complete or completed
      UPDATE public.bookings
      SET status = 'pro_marked_complete',
          updated_at = now()
      WHERE id = v_booking.id;
    END IF;
  END IF;

  -- Record audit log
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_admin_id,
    'dispute.updated',
    'dispute',
    v_dispute.id::text,
    jsonb_build_object(
      'status', p_status,
      'resolution_type', p_resolution_type,
      'resolution_summary', p_resolution_summary,
      'refund_amount_kobo', p_refund_amount_kobo
    )
  );

  -- Notify both parties of dispute update / outcome
  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    action_url,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_dispute.opened_by_user_id,
    'dispute_update',
    'Dispute Status: ' || replace(p_status::text, '_', ' '),
    'Case ' || v_dispute.reference_code || ' updated to ' || replace(p_status::text, '_', ' ') || '. ' || coalesce(p_resolution_summary, ''),
    '/bookings/' || v_dispute.booking_id,
    'dispute',
    v_dispute.id,
    jsonb_build_object('dispute_id', v_dispute.id, 'status', p_status, 'actor_user_id', v_admin_id)
  );

  IF v_dispute.against_user_id IS NOT NULL AND v_dispute.against_user_id <> v_dispute.opened_by_user_id THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      body,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      v_dispute.against_user_id,
      'dispute_update',
      'Dispute Status: ' || replace(p_status::text, '_', ' '),
      'Case ' || v_dispute.reference_code || ' updated to ' || replace(p_status::text, '_', ' ') || '. ' || coalesce(p_resolution_summary, ''),
      '/bookings/' || v_dispute.booking_id,
      'dispute',
      v_dispute.id,
      jsonb_build_object('dispute_id', v_dispute.id, 'status', p_status, 'actor_user_id', v_admin_id)
    );
  END IF;

  RETURN v_dispute;
END;
$$;

-- 6.6 Admin Moderate Review (Content Moderation & Fraud Prevention)
CREATE OR REPLACE FUNCTION public.admin_moderate_review(
  p_review_id UUID,
  p_action TEXT,
  p_moderation_notes TEXT DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_review public.reviews%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: Administrator privileges required to moderate reviews.';
  END IF;

  SELECT * INTO v_review
  FROM public.reviews
  WHERE id = p_review_id
  FOR UPDATE;

  IF v_review.id IS NULL THEN
    RAISE EXCEPTION 'Review not found.';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.reviews
    SET is_published = true,
        is_flagged = false,
        moderation_status = 'approved',
        moderated_by = v_admin_id,
        moderated_at = now(),
        moderation_notes = p_moderation_notes,
        updated_at = now()
    WHERE id = v_review.id
    RETURNING * INTO v_review;
  ELSIF p_action = 'flag' THEN
    UPDATE public.reviews
    SET is_flagged = true,
        moderation_status = 'flagged',
        moderated_by = v_admin_id,
        moderated_at = now(),
        moderation_notes = p_moderation_notes,
        updated_at = now()
    WHERE id = v_review.id
    RETURNING * INTO v_review;
  ELSIF p_action = 'reject' THEN
    UPDATE public.reviews
    SET is_published = false,
        is_flagged = false,
        moderation_status = 'rejected',
        moderated_by = v_admin_id,
        moderated_at = now(),
        moderation_notes = p_moderation_notes,
        updated_at = now()
    WHERE id = v_review.id
    RETURNING * INTO v_review;
  ELSE
    RAISE EXCEPTION 'Invalid moderation action: %', p_action;
  END IF;

  -- Recompute professional rating summary excluding unapproved/rejected reviews
  UPDATE public.professional_profiles pp
  SET
    average_rating = coalesce((
      SELECT round(avg(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.professional_id = v_review.professional_id AND r.is_published = true
    ), 0.00),
    review_count = (
      SELECT count(*)::integer
      FROM public.reviews r
      WHERE r.professional_id = v_review.professional_id AND r.is_published = true
    ),
    updated_at = now()
  WHERE pp.id = v_review.professional_id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_admin_id,
    'review.moderated',
    'review',
    v_review.id::text,
    jsonb_build_object('action', p_action, 'notes', p_moderation_notes)
  );

  RETURN v_review;
END;
$$;

COMMIT;
