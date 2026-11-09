-- ============================================================================
-- Migration: 20261104000300_business_and_marketplace.sql
-- Description: Table Groups C (Business Management), Maintenance Schedules,
--              and D (Marketplace: Bookings, Quotations, Status History,
--              Conversations, Messages, Notifications).
-- ============================================================================

BEGIN;

-- ============================================================================
-- GROUP C: BUSINESS MANAGEMENT
-- ============================================================================

-- C1. businesses (SMBs, Property Management Companies, Corporate Accounts)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL,
  registration_number TEXT,
  tax_id_masked TEXT,
  industry TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  address TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unsubmitted',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT businesses_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_city_state ON public.businesses(city, state) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C2. business_members (Role-based team access to a business account)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role public.business_member_role NOT NULL DEFAULT 'facility_manager',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_members_unique UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user_id
  ON public.business_members(user_id, business_id)
  WHERE is_active = true;

CREATE TRIGGER trg_business_members_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C3. business_subscriptions (Subscription plans & capacity limits)
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  plan_code TEXT NOT NULL DEFAULT 'starter',
  plan_name TEXT NOT NULL DEFAULT 'EasyLife Business Starter',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  price_kobo BIGINT NOT NULL DEFAULT 0 CHECK (price_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'annual')),
  max_properties INTEGER NOT NULL DEFAULT 5 CHECK (max_properties > 0),
  max_assets INTEGER NOT NULL DEFAULT 50 CHECK (max_assets > 0),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  provider_subscription_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business_status
  ON public.business_subscriptions(business_id, status);

CREATE TRIGGER trg_business_subscriptions_updated_at
  BEFORE UPDATE ON public.business_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C4. properties (Facilities, estates, buildings, or branches managed by a business)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  manager_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  code TEXT NOT NULL,
  property_type public.property_type NOT NULL DEFAULT 'commercial',
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  lga_or_district TEXT,
  address TEXT NOT NULL,
  units_count INTEGER NOT NULL DEFAULT 1 CHECK (units_count > 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT properties_business_code_unique UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_properties_business_id
  ON public.properties(business_id, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_city
  ON public.properties(city, state)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C5. assets (Equipment records: generators, HVAC, pumps, solar inverters, electrical panels)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  asset_tag TEXT NOT NULL,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  location_in_property TEXT,
  status public.asset_status NOT NULL DEFAULT 'operational',
  purchase_date DATE,
  purchase_cost_kobo BIGINT CHECK (purchase_cost_kobo IS NULL OR purchase_cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  warranty_expires_at DATE,
  last_serviced_at TIMESTAMPTZ,
  next_service_due_at TIMESTAMPTZ,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT assets_business_tag_unique UNIQUE (business_id, asset_tag)
);

CREATE INDEX IF NOT EXISTS idx_assets_property_status
  ON public.assets(property_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_business_next_due
  ON public.assets(business_id, next_service_due_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- E6 (Placed before bookings so bookings can reference maintenance_schedule_id):
-- maintenance_schedules (Preventive maintenance schedules for properties/assets)
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  assigned_professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT,
  frequency public.maintenance_frequency NOT NULL DEFAULT 'monthly',
  interval_days INTEGER NOT NULL DEFAULT 30 CHECK (interval_days > 0),
  estimated_cost_kobo BIGINT NOT NULL DEFAULT 0 CHECK (estimated_cost_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  next_due_date DATE NOT NULL,
  last_completed_at TIMESTAMPTZ,
  auto_create_booking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due
  ON public.maintenance_schedules(business_id, next_due_date, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset
  ON public.maintenance_schedules(asset_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- GROUP D: MARKETPLACE
-- ============================================================================

-- D1. bookings (Service requests, scheduled appointments & job lifecycle)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-BK'),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE RESTRICT,
  property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE RESTRICT,
  maintenance_schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  ai_suggested_category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  ai_urgency public.urgency_level,
  ai_categorization_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  status public.booking_status NOT NULL DEFAULT 'open',
  city TEXT NOT NULL DEFAULT 'Port Harcourt',
  state TEXT NOT NULL DEFAULT 'Rivers State',
  lga_or_district TEXT,
  service_address TEXT NOT NULL,
  preferred_date DATE,
  preferred_time_slot TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  accepted_quotation_id UUID,
  agreed_amount_kobo BIGINT CHECK (agreed_amount_kobo IS NULL OR agreed_amount_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  pro_marked_complete_at TIMESTAMPTZ,
  pro_completion_notes TEXT,
  customer_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT bookings_reference_code_unique UNIQUE (reference_code),
  CONSTRAINT bookings_scheduled_window_chk CHECK (
    scheduled_end_at IS NULL OR scheduled_start_at IS NULL OR scheduled_end_at >= scheduled_start_at
  )
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_status
  ON public.bookings(customer_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_professional_status
  ON public.bookings(professional_id, status, scheduled_start_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_marketplace_discovery
  ON public.bookings(city, category_id, status, urgency, created_at DESC)
  WHERE status IN ('open', 'quoted') AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_business_property
  ON public.bookings(business_id, property_id, asset_id)
  WHERE business_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- D2. booking_attachments (Private media uploaded for requests or job completion)
CREATE TABLE IF NOT EXISTS public.booking_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_bucket TEXT NOT NULL DEFAULT 'service-request-media' CHECK (storage_bucket = 'service-request-media'),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  attachment_stage TEXT NOT NULL DEFAULT 'request' CHECK (attachment_stage IN ('request', 'in_progress', 'completion')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_attachments_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_booking_attachments_booking_id
  ON public.booking_attachments(booking_id, attachment_stage);

-- D3. quotations (Formal price & schedule proposals submitted by verified professionals)
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL DEFAULT public.generate_reference_code('EL-QT'),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE RESTRICT,
  status public.quotation_status NOT NULL DEFAULT 'pending',
  subtotal_kobo BIGINT NOT NULL CHECK (subtotal_kobo >= 0),
  tax_kobo BIGINT NOT NULL DEFAULT 0 CHECK (tax_kobo >= 0),
  total_amount_kobo BIGINT NOT NULL CHECK (total_amount_kobo = subtotal_kobo + tax_kobo),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (estimated_duration_minutes > 0),
  proposed_start_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  notes TEXT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quotations_reference_code_unique UNIQUE (reference_code)
);

-- Prevent duplicate active pending quotations by the same professional on the same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_one_pending_per_pro_booking
  ON public.quotations(booking_id, professional_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_quotations_booking_status
  ON public.quotations(booking_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_professional_status
  ON public.quotations(professional_id, status, created_at DESC);

CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add deferred FK from bookings.accepted_quotation_id to quotations.id
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_accepted_quotation_fk
  FOREIGN KEY (accepted_quotation_id) REFERENCES public.quotations(id) ON DELETE RESTRICT;

-- D4. quotation_items (Itemized breakdown of labor, materials, callout fees in kobo)
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_type public.quotation_item_type NOT NULL DEFAULT 'labor',
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 2),
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_price_kobo BIGINT NOT NULL CHECK (unit_price_kobo >= 0),
  line_total_kobo BIGINT NOT NULL CHECK (line_total_kobo >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency_code ~ '^[A-Z]{3}$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id
  ON public.quotation_items(quotation_id, sort_order);

-- D5. booking_status_history (Immutable historical log of every booking status transition)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  from_status public.booking_status,
  to_status public.booking_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking
  ON public.booking_status_history(booking_id, created_at ASC);

CREATE TRIGGER trg_booking_status_history_immutable
  BEFORE UPDATE OR DELETE ON public.booking_status_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_modification();

-- Automatically record initial booking creation & subsequent status changes
CREATE OR REPLACE FUNCTION public.record_booking_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
       coalesce(auth.uid(), NEW.customer_id),
      'Booking created'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      coalesce(auth.uid(), NEW.cancelled_by, NEW.customer_id),
      coalesce(NEW.cancellation_reason, NEW.pro_completion_notes, 'Status updated')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_record_status_history
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.record_booking_status_transition();

-- D6. conversations (Messaging threads scoped to bookings)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived', 'locked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON public.conversations(last_message_at DESC NULLS LAST);

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- D7. conversation_members (Participants authorized in a conversation)
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role_in_conversation public.user_role NOT NULL,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_members_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user
  ON public.conversation_members(user_id, conversation_id);

-- D8. messages (Chat messages within a conversation)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 1),
  attachment_storage_path TEXT,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_last_message();

-- D9. notifications (In-app, email, and push notification persistence)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  entity_type TEXT,
  entity_id UUID,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

COMMIT;
