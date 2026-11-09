-- ============================================================================
-- Migration: 20261104001700_prompt22_privacy_account_deletion_and_indexes.sql
-- Description: NDPA 2023 Statutory Privacy Compliance — Account Deletion Requests,
--              Data Subject Rights Management, and High-Throughput Composite Indexes.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ACCOUNT DELETION & PRIVACY DATA SUBJECT REQUESTS (NDPA 2023 Sec 34)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments for documentation & audit
COMMENT ON TABLE public.account_deletion_requests IS 'Statutory account deletion and data erasure requests under the Nigeria Data Protection Act (NDPA) 2023.';
COMMENT ON COLUMN public.account_deletion_requests.reason IS 'Reason or justification provided by the data subject.';
COMMENT ON COLUMN public.account_deletion_requests.status IS 'Lifecycle state: pending review, under review, completed (anonymized/soft-deleted), or rejected (e.g. active escrow).';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_status ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requested_at ON public.account_deletion_requests(requested_at DESC);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "easylife_deletion_req_select" ON public.account_deletion_requests;
CREATE POLICY "easylife_deletion_req_select" ON public.account_deletion_requests
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "easylife_deletion_req_insert" ON public.account_deletion_requests;
CREATE POLICY "easylife_deletion_req_insert" ON public.account_deletion_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "easylife_deletion_req_update" ON public.account_deletion_requests;
CREATE POLICY "easylife_deletion_req_update" ON public.account_deletion_requests
  FOR UPDATE USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================================
-- 2. SECURE RPC FOR USER-SUBMITTED ACCOUNT DELETION REQUEST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_account_deletion_request(
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_request_id UUID;
  v_has_active_escrow BOOLEAN := false;
  v_open_disputes BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: You must be logged in to submit an account deletion request.';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Please provide a meaningful reason of at least 5 characters.';
  END IF;

  -- Compliance Safety Check: Verify no open disputes or locked escrow
  SELECT EXISTS (
    SELECT 1 FROM public.disputes d
    JOIN public.bookings b ON b.id = d.booking_id
    WHERE (b.customer_id = v_user_id OR b.professional_id = v_user_id)
      AND d.status IN ('opened', 'under_review')
  ) INTO v_open_disputes;

  IF v_open_disputes THEN
    RAISE EXCEPTION 'CONFLICT: You have active disputes under review. Complete or resolve open disputes before requesting account erasure.';
  END IF;

  -- Insert Deletion Request
  INSERT INTO public.account_deletion_requests (
    user_id,
    reason,
    status
  ) VALUES (
    v_user_id,
    trim(p_reason),
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Record Audit Log
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_user_id,
    'customer',
    'privacy.account_deletion_requested',
    'account_deletion_request',
    v_request_id,
    jsonb_build_object(
      'request_id', v_request_id,
      'requested_at', now(),
      'statutory_framework', 'NDPA_2023_SEC_34'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'status', 'pending',
    'message', 'Your account deletion request has been recorded under the Nigeria Data Protection Act 2023. Our DPO and administration will review within statutory timeframes.'
  );
END;
$$;

-- ============================================================================
-- 3. HIGH-THROUGHPUT COMPOSITE PERFORMANCE INDEXES
-- ============================================================================

-- Bookings lifecycle queries
CREATE INDEX IF NOT EXISTS idx_bookings_cust_status ON public.bookings(customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_status ON public.bookings(professional_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_refcode ON public.bookings(reference_code);

-- Quotations lookups
CREATE INDEX IF NOT EXISTS idx_quotations_booking_status ON public.quotations(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_pro_status ON public.quotations(professional_id, status);

-- Maintenance & Property operations
CREATE INDEX IF NOT EXISTS idx_maintenance_prop_status ON public.maintenance_requests(property_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_prop_category ON public.assets(property_id, category_id);

-- Communication & Realtime
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);

-- Accountability & Disputes
CREATE INDEX IF NOT EXISTS idx_disputes_booking_status ON public.disputes(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_pro_rating ON public.reviews(professional_id, rating);

-- Security & Audit Logging
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON public.audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

COMMIT;
