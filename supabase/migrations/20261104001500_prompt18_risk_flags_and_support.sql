-- ============================================================================
-- Migration: 20261104001500_prompt18_risk_flags_and_support.sql
-- Prompt 18: EasyLife AI Quotation, Customer Support, Risk Flags & Maintenance
-- ============================================================================

BEGIN;

-- 1. AI Assistant Logs Enhancement (Support multiple AI features)
ALTER TABLE public.ai_assistant_logs 
  ADD COLUMN IF NOT EXISTS feature_type TEXT DEFAULT 'problem_assistant';

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_feature ON public.ai_assistant_logs(feature_type);

-- 2. Basic Risk Flags Table (Administrative Review Only - No Auto-Suspension)
CREATE TABLE IF NOT EXISTS public.risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'professional', 'booking', 'review')),
  entity_id UUID NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'duplicate_account',
    'repeated_suspicious_activity',
    'unusual_booking_pattern',
    'repeated_complaints',
    'suspicious_review_activity'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'investigating', 'dismissed', 'resolved')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_flags_status ON public.risk_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_flags_entity ON public.risk_flags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_risk_flags_type ON public.risk_flags(flag_type);

-- Enable RLS for risk_flags
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all risk flags" ON public.risk_flags;
CREATE POLICY "Admins can view all risk flags"
  ON public.risk_flags
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update risk flags" ON public.risk_flags;
CREATE POLICY "Admins can update risk flags"
  ON public.risk_flags
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert risk flags" ON public.risk_flags;
CREATE POLICY "System can insert risk flags"
  ON public.risk_flags
  FOR INSERT
  WITH CHECK (true);

-- 3. Customer Support Escalation Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general',
    'booking',
    'verification',
    'quotation',
    'dispute',
    'account',
    'escalation'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL,
  ai_summary TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ref ON public.support_tickets(ticket_ref);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can insert support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (public.is_admin());

-- 4. Helper Function: Record Risk Flag (Idempotent within 24h per entity/flag_type)
CREATE OR REPLACE FUNCTION public.record_risk_flag(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_flag_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing pending flag for same entity and type in last 24h
  SELECT id INTO v_existing_id
  FROM public.risk_flags
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND flag_type = p_flag_type
    AND status IN ('pending_review', 'investigating')
    AND created_at >= (now() - INTERVAL '24 hours')
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  INSERT INTO public.risk_flags (
    entity_type,
    entity_id,
    flag_type,
    severity,
    description,
    details,
    status
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_flag_type,
    p_severity,
    p_description,
    COALESCE(p_details, '{}'::jsonb),
    'pending_review'
  ) RETURNING id INTO v_flag_id;

  RETURN v_flag_id;
END;
$$;

-- 5. Helper Function: Evaluate Account Risk Rules
-- Examines user profile for suspicious rules without auto-suspending
CREATE OR REPLACE FUNCTION public.evaluate_account_risk_rules(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_dup_count INTEGER := 0;
  v_dup_ids JSONB := '[]'::jsonb;
  v_cancelled_bookings INTEGER := 0;
  v_total_bookings INTEGER := 0;
  v_recent_booking_velocity INTEGER := 0;
  v_dispute_count INTEGER := 0;
  v_flag_count INTEGER := 0;
  v_flags_generated JSONB := '[]'::jsonb;
  v_flag_id UUID;
BEGIN
  SELECT id, email, phone, full_name, primary_role, is_suspended
  INTO v_user
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Rule 1: Duplicate Accounts Check (Shared Phone Number)
  IF v_user.phone IS NOT NULL AND length(trim(v_user.phone)) >= 10 THEN
    SELECT COUNT(*)::INTEGER, COALESCE(jsonb_agg(id), '[]'::jsonb)
    INTO v_dup_count, v_dup_ids
    FROM public.profiles
    WHERE id <> p_user_id
      AND phone IS NOT NULL
      AND regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(v_user.phone, '[^0-9]', '', 'g');

    IF v_dup_count > 0 THEN
      v_flag_id := public.record_risk_flag(
        'user',
        p_user_id,
        'duplicate_account',
        'medium',
        'Potential duplicate profile sharing phone number with ' || v_dup_count || ' other account(s).',
        jsonb_build_object('matched_user_ids', v_dup_ids, 'phone', v_user.phone)
      );
      v_flag_count := v_flag_count + 1;
      v_flags_generated := v_flags_generated || jsonb_build_object('type', 'duplicate_account', 'id', v_flag_id);
    END IF;
  END IF;

  -- Rule 2: Repeated Suspicious Activity (Cancellation Spike)
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER
  INTO v_total_bookings, v_cancelled_bookings
  FROM public.bookings
  WHERE customer_id = p_user_id;

  IF v_total_bookings >= 3 AND (v_cancelled_bookings::NUMERIC / v_total_bookings::NUMERIC) >= 0.60 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'repeated_suspicious_activity',
      'medium',
      'High booking cancellation rate (' || v_cancelled_bookings || ' of ' || v_total_bookings || ' bookings cancelled).',
      jsonb_build_object('total_bookings', v_total_bookings, 'cancelled_bookings', v_cancelled_bookings)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'repeated_suspicious_activity', 'id', v_flag_id);
  END IF;

  -- Rule 3: Unusual Booking Velocity (> 4 bookings in past 15 minutes)
  SELECT COUNT(*)::INTEGER
  INTO v_recent_booking_velocity
  FROM public.bookings
  WHERE customer_id = p_user_id
    AND created_at >= (now() - INTERVAL '15 minutes');

  IF v_recent_booking_velocity >= 4 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'unusual_booking_pattern',
      'high',
      'Rapid booking creation pattern (' || v_recent_booking_velocity || ' requests created within 15 minutes).',
      jsonb_build_object('velocity_count', v_recent_booking_velocity, 'window_minutes', 15)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'unusual_booking_pattern', 'id', v_flag_id);
  END IF;

  -- Rule 4: Repeated Complaints (Disputes raised by or against user in past 30 days)
  SELECT COUNT(*)::INTEGER
  INTO v_dispute_count
  FROM public.disputes d
  JOIN public.bookings b ON d.booking_id = b.id
  WHERE (b.customer_id = p_user_id OR b.professional_id = p_user_id)
    AND d.created_at >= (now() - INTERVAL '30 days');

  IF v_dispute_count >= 2 THEN
    v_flag_id := public.record_risk_flag(
      'user',
      p_user_id,
      'repeated_complaints',
      'high',
      'Repeated dispute involvement (' || v_dispute_count || ' disputes in the last 30 days).',
      jsonb_build_object('dispute_count', v_dispute_count, 'window_days', 30)
    );
    v_flag_count := v_flag_count + 1;
    v_flags_generated := v_flags_generated || jsonb_build_object('type', 'repeated_complaints', 'id', v_flag_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'flags_count', v_flag_count,
    'flags', v_flags_generated,
    'administrative_review_only', true
  );
END;
$$;

-- 6. Helper Function: Evaluate Review Risk Rules
CREATE OR REPLACE FUNCTION public.evaluate_review_risk_rules(
  p_review_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rev RECORD;
  v_booking RECORD;
  v_identical_count INTEGER := 0;
  v_flags JSONB := '[]'::jsonb;
  v_flag_id UUID;
BEGIN
  SELECT id, booking_id, customer_id, professional_id, rating, comment, created_at
  INTO v_rev
  FROM public.reviews
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Review not found');
  END IF;

  SELECT id, status, customer_id, professional_id
  INTO v_booking
  FROM public.bookings
  WHERE id = v_rev.booking_id;

  -- Check 1: Self-Review Attempt (Same customer and professional profile)
  IF v_rev.customer_id = v_rev.professional_id THEN
    v_flag_id := public.record_risk_flag(
      'review',
      p_review_id,
      'suspicious_review_activity',
      'high',
      'Self-review detected: Reviewer and Professional profiles match.',
      jsonb_build_object('customer_id', v_rev.customer_id, 'professional_id', v_rev.professional_id)
    );
    v_flags := v_flags || jsonb_build_object('type', 'self_review', 'id', v_flag_id);
  END IF;

  -- Check 2: Identical Review Comment Repeated across multiple bookings
  IF v_rev.comment IS NOT NULL AND length(trim(v_rev.comment)) > 15 THEN
    SELECT COUNT(*)::INTEGER
    INTO v_identical_count
    FROM public.reviews
    WHERE customer_id = v_rev.customer_id
      AND trim(lower(comment)) = trim(lower(v_rev.comment))
      AND id <> p_review_id;

    IF v_identical_count >= 2 THEN
      v_flag_id := public.record_risk_flag(
        'review',
        p_review_id,
        'suspicious_review_activity',
        'medium',
        'Duplicate review text repeated across ' || v_identical_count || ' other bookings.',
        jsonb_build_object('identical_count', v_identical_count, 'comment_snippet', substr(v_rev.comment, 1, 60))
      );
      v_flags := v_flags || jsonb_build_object('type', 'duplicate_text', 'id', v_flag_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', p_review_id,
    'flags', v_flags,
    'administrative_review_only', true
  );
END;
$$;

-- 7. Helper Function: Create Support Ticket with Escalation
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_session_id TEXT,
  p_subject TEXT,
  p_category TEXT,
  p_priority TEXT,
  p_user_message TEXT,
  p_ai_summary TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_ref TEXT;
  v_ticket_id UUID;
BEGIN
  -- Generate user-friendly reference SUP-YYYYMMDD-XXXX
  v_ref := 'SUP-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5));

  INSERT INTO public.support_tickets (
    ticket_ref,
    user_id,
    session_id,
    subject,
    category,
    priority,
    status,
    user_message,
    ai_summary,
    created_at,
    updated_at
  ) VALUES (
    v_ref,
    v_effective_user_id,
    p_session_id,
    p_subject,
    COALESCE(p_category, 'general'),
    COALESCE(p_priority, 'medium'),
    'open',
    p_user_message,
    p_ai_summary,
    now(),
    now()
  ) RETURNING id INTO v_ticket_id;

  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'ticket_ref', v_ref,
    'status', 'open',
    'created_at', now()
  );
END;
$$;

-- 8. Helper Function: Get Intelligent Maintenance Reminders
CREATE OR REPLACE FUNCTION public.get_intelligent_maintenance_reminders(
  p_business_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reminders JSONB := '[]'::jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'schedule_id', s.id,
        'title', s.title,
        'description', s.description,
        'frequency', s.frequency,
        'interval_days', s.interval_days,
        'next_due_date', s.next_due_date,
        'last_completed_at', s.last_completed_at,
        'status', CASE 
          WHEN s.next_due_date < CURRENT_DATE THEN 'overdue'
          WHEN s.next_due_date = CURRENT_DATE THEN 'due_today'
          WHEN s.next_due_date <= (CURRENT_DATE + INTERVAL '14 days') THEN 'upcoming'
          ELSE 'scheduled'
        END,
        'days_remaining', (s.next_due_date - CURRENT_DATE),
        'property_id', p.id,
        'property_name', p.name,
        'property_address', p.address,
        'asset_id', a.id,
        'asset_name', a.name,
        'asset_category', a.asset_category,
        'asset_brand', a.brand,
        'asset_model', a.model_number,
        'category_name', c.name,
        'category_slug', c.slug,
        'reminder_basis', 'Configured interval: Every ' || s.interval_days || ' days (Manual configuration)',
        'non_predictive_disclaimer', 'This schedule reminder is strictly calculated from your configured maintenance interval and equipment records. It does not predict mechanical failure.'
      )
      ORDER BY s.next_due_date ASC
    ),
    '[]'::jsonb
  )
  INTO v_reminders
  FROM public.maintenance_schedules s
  JOIN public.properties p ON s.property_id = p.id
  JOIN public.service_categories c ON s.category_id = c.id
  LEFT JOIN public.assets a ON s.asset_id = a.id
  WHERE s.business_id = p_business_id
    AND s.is_active = true
    AND s.deleted_at IS NULL;

  RETURN v_reminders;
END;
$$;

COMMIT;
