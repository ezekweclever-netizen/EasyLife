-- ============================================================================
-- Migration: 20261104001400_ai_assistant_and_usage_logs.sql
-- Prompt 17: EasyLife AI Assistant Usage Monitoring, Rate Limiting & Logs
--
-- Provides:
-- 1. ai_assistant_logs table to track queries, tokens, and estimated costs
-- 2. check_ai_rate_limit() RPC to guard against abuse
-- 3. record_ai_assistant_log() RPC to record queries safely
-- 4. get_ai_assistant_metrics() RPC for admin oversight
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  customer_message TEXT NOT NULL,
  recommended_category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  recommended_category_name TEXT,
  confidence TEXT DEFAULT 'high',
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookup, rate limiting, and analytics
CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_user_id ON public.ai_assistant_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_session_id ON public.ai_assistant_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_created_at ON public.ai_assistant_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_assistant_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users see their own; Admins see all; Inserts allowed
DROP POLICY IF EXISTS "Users view own ai logs" ON public.ai_assistant_logs;
CREATE POLICY "Users view own ai logs"
  ON public.ai_assistant_logs
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Anyone can insert ai logs" ON public.ai_assistant_logs;
CREATE POLICY "Anyone can insert ai logs"
  ON public.ai_assistant_logs
  FOR INSERT
  WITH CHECK (true);

-- 1. Rate Limiting Function
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.ai_assistant_logs
    WHERE (user_id = p_user_id OR session_id = p_session_id)
      AND created_at >= (now() - (p_window_seconds || ' seconds')::INTERVAL);
  ELSE
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.ai_assistant_logs
    WHERE session_id = p_session_id
      AND created_at >= (now() - (p_window_seconds || ' seconds')::INTERVAL);
  END IF;

  -- Return true if within rate limits, false if rate limit exceeded
  RETURN v_count < p_max_requests;
END;
$$;

-- 2. Log Recording Function
CREATE OR REPLACE FUNCTION public.record_ai_assistant_log(
  p_session_id TEXT,
  p_customer_message TEXT,
  p_category_id UUID DEFAULT NULL,
  p_category_name TEXT DEFAULT NULL,
  p_confidence TEXT DEFAULT 'high',
  p_model_name TEXT DEFAULT 'gpt-4o-mini',
  p_prompt_tokens INTEGER DEFAULT 0,
  p_completion_tokens INTEGER DEFAULT 0,
  p_total_tokens INTEGER DEFAULT 0,
  p_estimated_cost_usd NUMERIC DEFAULT 0.000000,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_id UUID;
BEGIN
  INSERT INTO public.ai_assistant_logs (
    user_id,
    session_id,
    customer_message,
    recommended_category_id,
    recommended_category_name,
    confidence,
    model_name,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost_usd,
    created_at
  ) VALUES (
    v_effective_user_id,
    p_session_id,
    p_customer_message,
    p_category_id,
    p_category_name,
    p_confidence,
    p_model_name,
    COALESCE(p_prompt_tokens, 0),
    COALESCE(p_completion_tokens, 0),
    COALESCE(p_total_tokens, 0),
    COALESCE(p_estimated_cost_usd, 0.000000),
    now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3. AI Usage Analytics Metrics RPC
CREATE OR REPLACE FUNCTION public.get_ai_assistant_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_queries INTEGER;
  v_total_prompt_tokens BIGINT;
  v_total_completion_tokens BIGINT;
  v_total_tokens BIGINT;
  v_total_cost_usd NUMERIC(10, 4);
  v_top_categories JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COALESCE(SUM(prompt_tokens), 0)::BIGINT,
    COALESCE(SUM(completion_tokens), 0)::BIGINT,
    COALESCE(SUM(total_tokens), 0)::BIGINT,
    COALESCE(SUM(estimated_cost_usd), 0)::NUMERIC(10, 4)
  INTO
    v_total_queries,
    v_total_prompt_tokens,
    v_total_completion_tokens,
    v_total_tokens,
    v_total_cost_usd
  FROM public.ai_assistant_logs;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'category_name', category_name,
        'count', cat_count
      )
    ),
    '[]'::jsonb
  )
  INTO v_top_categories
  FROM (
    SELECT recommended_category_name AS category_name, COUNT(*) AS cat_count
    FROM public.ai_assistant_logs
    WHERE recommended_category_name IS NOT NULL
    GROUP BY recommended_category_name
    ORDER BY cat_count DESC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'total_queries', v_total_queries,
    'total_prompt_tokens', v_total_prompt_tokens,
    'total_completion_tokens', v_total_completion_tokens,
    'total_tokens', v_total_tokens,
    'total_cost_usd', v_total_cost_usd,
    'top_categories', v_top_categories
  );
END;
$$;

COMMIT;
