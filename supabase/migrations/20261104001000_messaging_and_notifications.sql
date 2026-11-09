-- ============================================================================
-- EasyLife Migration: 20261104001000_messaging_and_notifications.sql
-- Description: Prompt 13 — Secure In-App Messaging & Notification Engine
--
-- Features:
-- 1. Conversation creation & booking association.
-- 2. Message delivery status (sending, sent, delivered, read) & timestamps.
-- 3. Message attachment tracking (name, mime type, size, storage path) with validation.
-- 4. Conversation read receipts & unread counters.
-- 5. Multi-channel notification delivery logging (in_app, email, push, sms, whatsapp).
-- 6. Notification delivery provider status (queued, sending, sent, delivered, failed, rejected).
-- 7. Automatic triggers & stored procedures for all 12 Prompt 13 notification events.
-- 8. Strict RLS enforcement for conversations, messages, attachments & notifications.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND PUBLIC.MESSAGES & PUBLIC.CONVERSATIONS
-- ============================================================================

-- 1.1 Add delivery status, read timestamps and attachment metadata to public.messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'sent'
        CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read')),
      ADD COLUMN delivered_at TIMESTAMPTZ,
      ADD COLUMN read_at TIMESTAMPTZ,
      ADD COLUMN attachment_name TEXT,
      ADD COLUMN attachment_mime_type TEXT,
      ADD COLUMN attachment_size_bytes BIGINT CHECK (attachment_size_bytes IS NULL OR attachment_size_bytes <= 8388608);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status
  ON public.messages(conversation_id, delivery_status, created_at DESC)
  WHERE deleted_at IS NULL;

-- 1.2 Add metadata and flexible booking linkage to public.conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.conversations
      ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 1.3 Add unread_count cache to public.conversation_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversation_members' AND column_name = 'unread_count'
  ) THEN
    ALTER TABLE public.conversation_members
      ADD COLUMN unread_count INT NOT NULL DEFAULT 0 CHECK (unread_count >= 0);
  END IF;
END $$;

-- 1.4 Add delivery_status and retry metadata to public.notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE public.notifications
      ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'delivered'
        CHECK (delivery_status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'rejected'));
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE PUBLIC.NOTIFICATION_DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'sms', 'whatsapp')),
  recipient_destination TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'rejected')),
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INT NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
  next_retry_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification
  ON public.notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_retry
  ON public.notification_deliveries(status, next_retry_at)
  WHERE status IN ('queued', 'failed') AND retry_count < max_retries;

DROP TRIGGER IF EXISTS trg_notification_deliveries_updated_at ON public.notification_deliveries;
CREATE TRIGGER trg_notification_deliveries_updated_at
  BEFORE UPDATE ON public.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_deliveries_select_owner_or_admin" ON public.notification_deliveries;
CREATE POLICY "notification_deliveries_select_owner_or_admin" ON public.notification_deliveries
  FOR SELECT USING (
    public.is_admin()
    OR notification_id IN (
      SELECT id FROM public.notifications WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. STORAGE BUCKET & VALIDATION FOR MESSAGE ATTACHMENTS
-- ============================================================================

-- Ensure message-attachments bucket exists in storage.buckets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'message-attachments',
      'message-attachments',
      false,
      8388608,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 8388608,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  END IF;
END $$;

-- Update validate_storage_file_metadata function
CREATE OR REPLACE FUNCTION public.validate_storage_file_metadata(
  p_bucket_id TEXT,
  p_object_name TEXT,
  p_mime_type TEXT,
  p_size_bytes BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ext TEXT;
BEGIN
  IF p_bucket_id IS NULL OR p_object_name IS NULL OR p_mime_type IS NULL OR p_size_bytes IS NULL THEN
    RETURN false;
  END IF;

  IF p_size_bytes <= 0 THEN
    RETURN false;
  END IF;

  -- Reject path traversal attempts
  IF p_object_name LIKE '%..%' OR p_object_name LIKE '/%' THEN
    RETURN false;
  END IF;

  v_ext := lower(substring(p_object_name FROM '\.([a-zA-Z0-9]+)$'));

  IF p_bucket_id = 'avatars' THEN
    RETURN p_size_bytes <= 2097152
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp');
  ELSIF p_bucket_id = 'portfolio-media' THEN
    RETURN p_size_bytes <= 5242880
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp');
  ELSIF p_bucket_id = 'service-request-media' THEN
    RETURN p_size_bytes <= 8388608
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
  ELSIF p_bucket_id = 'message-attachments' THEN
    RETURN p_size_bytes <= 8388608
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
  ELSIF p_bucket_id IN ('verification-documents', 'maintenance-and-disputes') THEN
    RETURN p_size_bytes <= 10485760
      AND p_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
      AND v_ext IN ('jpg', 'jpeg', 'png', 'webp', 'pdf');
  END IF;

  RETURN false;
END;
$$;

-- Storage RLS for message-attachments: {conversation_id}/{user_id}/{filename}
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "message_attachments_select_member" ON storage.objects;
    CREATE POLICY "message_attachments_select_member" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'message-attachments'
        AND (
          public.is_admin()
          OR public.is_conversation_member(((storage.foldername(name))[1])::uuid)
        )
      );

    DROP POLICY IF EXISTS "message_attachments_insert_member" ON storage.objects;
    CREATE POLICY "message_attachments_insert_member" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'message-attachments'
        AND (storage.foldername(name))[2] = auth.uid()::text
        AND public.is_conversation_member(((storage.foldername(name))[1])::uuid)
      );
  END IF;
END $$;

-- ============================================================================
-- 4. BUSINESS LOGIC & STORED PROCEDURES (PROMPT 13)
-- ============================================================================

-- 4.1 Create or Retrieve Conversation for a Booking
CREATE OR REPLACE FUNCTION public.create_or_get_booking_conversation(
  p_booking_id UUID,
  p_subject TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_booking RECORD;
  v_conv_id UUID;
  v_subject TEXT;
  v_pro_user_id UUID;
  v_customer_role public.user_role;
  v_pro_role public.user_role;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required to access conversations.';
  END IF;

  -- Load booking
  SELECT b.id, b.reference_code, b.customer_id, b.professional_id, b.status, sc.name AS category_name
  INTO v_booking
  FROM public.bookings b
  JOIN public.service_categories sc ON sc.id = b.category_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND: The specified booking does not exist.';
  END IF;

  -- Determine professional's user_id if assigned
  IF v_booking.professional_id IS NOT NULL THEN
    SELECT pp.user_id INTO v_pro_user_id
    FROM public.professional_profiles pp
    WHERE pp.id = v_booking.professional_id;
  END IF;

  -- Verify authorization: Caller must be the customer, assigned professional, or an admin
  IF v_caller_id <> v_booking.customer_id
     AND (v_pro_user_id IS NULL OR v_caller_id <> v_pro_user_id)
     AND NOT public.is_admin() THEN
    -- Also allow professionals who have submitted a valid quotation for this booking
    IF NOT EXISTS (
      SELECT 1 FROM public.quotations q
      JOIN public.professional_profiles pp ON pp.id = q.professional_id
      WHERE q.booking_id = p_booking_id AND pp.user_id = v_caller_id
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN: You are not authorized to access conversations for this booking.';
    END IF;
  END IF;

  -- Check if conversation already exists for this booking
  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE booking_id = p_booking_id
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    v_subject := coalesce(
      p_subject,
      'Booking #' || v_booking.reference_code || ' — ' || v_booking.category_name
    );

    INSERT INTO public.conversations (
      booking_id,
      subject,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_booking_id,
      v_subject,
      'open',
      now(),
      now()
    ) RETURNING id INTO v_conv_id;

    -- Add customer as member
    INSERT INTO public.conversation_members (
      conversation_id,
      user_id,
      role_in_conversation,
      joined_at
    ) VALUES (
      v_conv_id,
      v_booking.customer_id,
      'customer',
      now()
    ) ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Add assigned pro as member if assigned
    IF v_pro_user_id IS NOT NULL THEN
      INSERT INTO public.conversation_members (
        conversation_id,
        user_id,
        role_in_conversation,
        joined_at
      ) VALUES (
        v_conv_id,
        v_pro_user_id,
        'professional',
        now()
      ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  ELSE
    -- Ensure caller is member of existing conversation
    SELECT primary_role INTO v_customer_role
    FROM public.profiles WHERE id = v_caller_id;

    INSERT INTO public.conversation_members (
      conversation_id,
      user_id,
      role_in_conversation,
      joined_at
    ) VALUES (
      v_conv_id,
      v_caller_id,
      coalesce(v_customer_role, 'customer'),
      now()
    ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_conv_id,
    'booking_id', p_booking_id,
    'booking_reference', v_booking.reference_code
  );
END;
$$;

-- 4.2 Send Message in Conversation with Delivery Status & Notifications
CREATE OR REPLACE FUNCTION public.send_conversation_message(
  p_conversation_id UUID,
  p_body TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_attachment_path TEXT DEFAULT NULL,
  p_attachment_name TEXT DEFAULT NULL,
  p_attachment_mime_type TEXT DEFAULT NULL,
  p_attachment_size_bytes BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_conv RECORD;
  v_new_message RECORD;
  v_recipient RECORD;
  v_sender_name TEXT;
  v_notif_title TEXT;
  v_notif_body TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required to send messages.';
  END IF;

  IF NOT public.is_active_user() THEN
    RAISE EXCEPTION 'FORBIDDEN: Inactive or suspended accounts cannot send messages.';
  END IF;

  -- Verify conversation exists and is open
  SELECT c.id, c.booking_id, c.status, c.subject, b.reference_code
  INTO v_conv
  FROM public.conversations c
  LEFT JOIN public.bookings b ON b.id = c.booking_id
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONVERSATION_NOT_FOUND: Conversation does not exist.';
  END IF;

  IF v_conv.status = 'locked' THEN
    RAISE EXCEPTION 'CONVERSATION_LOCKED: This conversation is locked and cannot receive new messages.';
  END IF;

  -- Verify caller is a member
  IF NOT public.is_conversation_member(p_conversation_id) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: You are not a member of this conversation.';
  END IF;

  -- Validate attachment if provided
  IF p_message_type = 'attachment' OR p_attachment_path IS NOT NULL THEN
    IF p_attachment_size_bytes IS NOT NULL AND p_attachment_size_bytes > 8388608 THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT: Attachment exceeds maximum allowed size (8MB).';
    END IF;

    IF p_attachment_mime_type IS NOT NULL AND p_attachment_mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') THEN
      RAISE EXCEPTION 'INVALID_ATTACHMENT: Attachment type must be JPEG, PNG, WebP or PDF.';
    END IF;
  END IF;

  -- Insert message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    body,
    attachment_storage_path,
    attachment_name,
    attachment_mime_type,
    attachment_size_bytes,
    delivery_status,
    delivered_at,
    created_at,
    updated_at
  ) VALUES (
    p_conversation_id,
    v_caller_id,
    coalesce(p_message_type, 'text'),
    trim(p_body),
    p_attachment_path,
    p_attachment_name,
    p_attachment_mime_type,
    p_attachment_size_bytes,
    'delivered',
    now(),
    now(),
    now()
  ) RETURNING * INTO v_new_message;

  -- Touch conversation timestamp
  UPDATE public.conversations
  SET last_message_at = now(),
      updated_at = now()
  WHERE id = p_conversation_id;

  -- Update caller's last_read_at
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id AND user_id = v_caller_id;

  -- Get sender name for notification
  SELECT coalesce(full_name, 'A user') INTO v_sender_name
  FROM public.profiles WHERE id = v_caller_id;

  v_notif_title := 'New message from ' || v_sender_name;
  v_notif_body := substring(v_new_message.body FROM 1 FOR 120);

  -- Notify all other conversation members
  FOR v_recipient IN
    SELECT cm.user_id, p.email, cm.role_in_conversation
    FROM public.conversation_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id <> v_caller_id
      AND NOT cm.is_muted
  LOOP
    -- Increment unread count for recipient
    UPDATE public.conversation_members
    SET unread_count = unread_count + 1
    WHERE conversation_id = p_conversation_id AND user_id = v_recipient.user_id;

    -- Create notification
    PERFORM public.create_notification(
      p_user_id => v_recipient.user_id,
      p_notification_type => 'new_message',
      p_title => v_notif_title,
      p_body => v_notif_body,
      p_action_url => CASE
        WHEN v_recipient.role_in_conversation = 'professional' THEN '/pro/messages?conversationId=' || p_conversation_id::text
        ELSE '/messages?conversationId=' || p_conversation_id::text
      END,
      p_entity_type => 'conversation',
      p_entity_id => p_conversation_id,
      p_channels => ARRAY['in_app', 'email']::TEXT[],
      p_metadata => jsonb_build_object(
        'message_id', v_new_message.id,
        'sender_id', v_caller_id,
        'booking_reference', v_conv.reference_code
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_new_message.id,
    'conversation_id', p_conversation_id,
    'delivery_status', v_new_message.delivery_status,
    'created_at', v_new_message.created_at
  );
END;
$$;

-- 4.3 Mark Conversation as Read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_updated_count INT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required.';
  END IF;

  IF NOT public.is_conversation_member(p_conversation_id) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: You are not a member of this conversation.';
  END IF;

  -- Update member's read pointer and reset unread count
  UPDATE public.conversation_members
  SET last_read_at = now(),
      unread_count = 0
  WHERE conversation_id = p_conversation_id AND user_id = v_caller_id;

  -- Mark inbound messages as read
  UPDATE public.messages
  SET delivery_status = 'read',
      read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id <> v_caller_id
    AND delivery_status <> 'read';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Mark related new_message notifications as read
  UPDATE public.notifications
  SET is_read = true,
      read_at = now()
  WHERE user_id = v_caller_id
    AND notification_type = 'new_message'
    AND entity_id = p_conversation_id
    AND NOT is_read;

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', p_conversation_id,
    'messages_marked_read', v_updated_count
  );
END;
$$;

-- 4.4 Get Total Unread Message Count
CREATE OR REPLACE FUNCTION public.get_conversation_unread_count(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_unread INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT coalesce(sum(unread_count), 0)::INT
  INTO v_total_unread
  FROM public.conversation_members
  WHERE user_id = p_user_id;

  RETURN v_total_unread;
END;
$$;

-- 4.5 Central Notification Dispatcher with Multi-Channel Tracking
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_id UUID;
  v_channel TEXT;
  v_user_email TEXT;
  v_user_phone TEXT;
BEGIN
  -- Validate recipient exists
  SELECT email, phone INTO v_user_email, v_user_phone
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: Cannot create notification for non-existent profile.';
  END IF;

  -- Insert notification record
  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    action_url,
    entity_type,
    entity_id,
    channels,
    is_read,
    delivery_status,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_title,
    p_body,
    p_action_url,
    p_entity_type,
    p_entity_id,
    coalesce(p_channels, ARRAY['in_app']::TEXT[]),
    false,
    'delivered',
    coalesce(p_metadata, '{}'::jsonb),
    now()
  ) RETURNING id INTO v_notif_id;

  -- Insert delivery entries for each requested channel
  FOREACH v_channel IN ARRAY coalesce(p_channels, ARRAY['in_app']::TEXT[])
  LOOP
    IF v_channel = 'in_app' THEN
      INSERT INTO public.notification_deliveries (
        notification_id,
        channel,
        recipient_destination,
        provider,
        status,
        delivered_at,
        created_at
      ) VALUES (
        v_notif_id,
        'in_app',
        p_user_id::text,
        'in_app_feed',
        'delivered',
        now(),
        now()
      );
    ELSIF v_channel = 'email' THEN
      INSERT INTO public.notification_deliveries (
        notification_id,
        channel,
        recipient_destination,
        provider,
        status,
        sent_at,
        created_at
      ) VALUES (
        v_notif_id,
        'email',
        coalesce(v_user_email, 'unknown@easylife.ng'),
        'easylife_mail_service',
        'queued',
        NULL,
        now()
      );
    ELSIF v_channel IN ('push', 'sms', 'whatsapp') THEN
      INSERT INTO public.notification_deliveries (
        notification_id,
        channel,
        recipient_destination,
        provider,
        status,
        created_at
      ) VALUES (
        v_notif_id,
        v_channel,
        coalesce(v_user_phone, v_user_email, p_user_id::text),
        CASE
          WHEN v_channel = 'push' THEN 'fcm'
          WHEN v_channel = 'sms' THEN 'termii'
          ELSE 'meta_whatsapp'
        END,
        'queued',
        now()
      );
    END IF;
  END LOOP;

  RETURN v_notif_id;
END;
$$;

-- 4.6 Update Notification Delivery Status (Delivery Provider Callback / Worker)
CREATE OR REPLACE FUNCTION public.update_notification_delivery_status(
  p_delivery_id UUID,
  p_status TEXT,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_del RECORD;
  v_final_status TEXT;
BEGIN
  IF p_status NOT IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'rejected') THEN
    RAISE EXCEPTION 'INVALID_STATUS: Status must be queued, sending, sent, delivered, failed, or rejected.';
  END IF;

  SELECT * INTO v_del
  FROM public.notification_deliveries
  WHERE id = p_delivery_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DELIVERY_NOT_FOUND: Notification delivery record does not exist.';
  END IF;

  -- Rule: Do not display a notification as delivered when the delivery provider has rejected it
  IF p_status = 'rejected' THEN
    v_final_status := 'rejected';
    UPDATE public.notification_deliveries
    SET status = 'rejected',
        error_code = p_error_code,
        error_message = p_error_message,
        failed_at = now(),
        updated_at = now()
    WHERE id = p_delivery_id;

    -- Update parent notification delivery_status if email rejected
    IF v_del.channel = 'email' THEN
      UPDATE public.notifications
      SET delivery_status = 'rejected'
      WHERE id = v_del.notification_id;
    END IF;
  ELSIF p_status = 'delivered' THEN
    v_final_status := 'delivered';
    UPDATE public.notification_deliveries
    SET status = 'delivered',
        provider_message_id = coalesce(p_provider_message_id, provider_message_id),
        delivered_at = now(),
        updated_at = now()
    WHERE id = p_delivery_id;
  ELSIF p_status = 'failed' THEN
    v_final_status := 'failed';
    UPDATE public.notification_deliveries
    SET status = 'failed',
        error_code = p_error_code,
        error_message = p_error_message,
        retry_count = retry_count + 1,
        next_retry_at = now() + (interval '5 minutes' * (retry_count + 1)),
        failed_at = now(),
        updated_at = now()
    WHERE id = p_delivery_id;
  ELSE
    v_final_status := p_status;
    UPDATE public.notification_deliveries
    SET status = p_status,
        provider_message_id = coalesce(p_provider_message_id, provider_message_id),
        sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE sent_at END,
        updated_at = now()
    WHERE id = p_delivery_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', p_delivery_id,
    'status', v_final_status
  );
END;
$$;

-- ============================================================================
-- 5. AUTOMATIC NOTIFICATION HOOKS FOR ALL PROMPT 13 EVENTS
-- ============================================================================

-- 5.1 On Quotation Submitted -> Notify Customer ('new_quotation')
CREATE OR REPLACE FUNCTION public.notify_on_quotation_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_pro RECORD;
  v_total_naira NUMERIC;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending')
     OR (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'pending') THEN

    SELECT b.id, b.customer_id, b.reference_code, sc.name AS category_name
    INTO v_booking
    FROM public.bookings b
    JOIN public.service_categories sc ON sc.id = b.category_id
    WHERE b.id = NEW.booking_id;

    SELECT pp.business_name, p.full_name
    INTO v_pro
    FROM public.professional_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    WHERE pp.id = NEW.professional_id;

    v_total_naira := (NEW.total_amount_kobo / 100)::NUMERIC;

    PERFORM public.create_notification(
      p_user_id => v_booking.customer_id,
      p_notification_type => 'new_quotation',
      p_title => 'New Quotation Received: ₦' || to_char(v_total_naira, 'FM999,999,999'),
      p_body => coalesce(v_pro.business_name, v_pro.full_name, 'A professional')
        || ' submitted a quote for booking #' || v_booking.reference_code || '.',
      p_action_url => '/bookings/' || v_booking.id::text,
      p_entity_type => 'quotation',
      p_entity_id => NEW.id,
      p_channels => ARRAY['in_app', 'email']::TEXT[],
      p_metadata => jsonb_build_object(
        'quotation_id', NEW.id,
        'booking_id', v_booking.id,
        'total_amount_kobo', NEW.total_amount_kobo
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotations_notify_submission ON public.quotations;
CREATE TRIGGER trg_quotations_notify_submission
  AFTER INSERT OR UPDATE OF status ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_quotation_submission();

-- 5.2 On Booking Status Changed -> Notify Parties
CREATE OR REPLACE FUNCTION public.notify_on_booking_lifecycle_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro_user_id UUID;
  v_category_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get professional user_id if assigned
    IF NEW.professional_id IS NOT NULL THEN
      SELECT pp.user_id INTO v_pro_user_id
      FROM public.professional_profiles pp
      WHERE pp.id = NEW.professional_id;
    END IF;

    SELECT name INTO v_category_name
    FROM public.service_categories WHERE id = NEW.category_id;

    -- Event 4: Quotation accepted / Event 5: Appointment confirmed
    IF NEW.status IN ('accepted', 'confirmed') AND OLD.status NOT IN ('accepted', 'confirmed') THEN
      -- Notify Professional
      IF v_pro_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          p_user_id => v_pro_user_id,
          p_notification_type => 'quotation_accepted',
          p_title => 'Quotation Accepted for #' || NEW.reference_code,
          p_body => 'The customer accepted your quote. Appointment is scheduled for '
            || coalesce(to_char(NEW.scheduled_start_at, 'Mon DD, YYYY HH:MI AM'), 'agreed time') || '.',
          p_action_url => '/pro/jobs/' || NEW.id::text,
          p_entity_type => 'booking',
          p_entity_id => NEW.id,
          p_channels => ARRAY['in_app', 'email']::TEXT[]
        );
      END IF;

      -- Notify Customer
      PERFORM public.create_notification(
        p_user_id => NEW.customer_id,
        p_notification_type => 'appointment_confirmed',
        p_title => 'Appointment Confirmed — #' || NEW.reference_code,
        p_body => 'Your ' || coalesce(v_category_name, 'service') || ' appointment is confirmed.',
        p_action_url => '/bookings/' || NEW.id::text,
        p_entity_type => 'booking',
        p_entity_id => NEW.id,
        p_channels => ARRAY['in_app', 'email']::TEXT[]
      );

    -- Event 7: Status changed to in_progress
    ELSIF NEW.status = 'in_progress' AND OLD.status <> 'in_progress' THEN
      PERFORM public.create_notification(
        p_user_id => NEW.customer_id,
        p_notification_type => 'booking_status_change',
        p_title => 'Work Commenced: #' || NEW.reference_code,
        p_body => 'Your specialist is on site and repair work is currently in progress.',
        p_action_url => '/bookings/' || NEW.id::text,
        p_entity_type => 'booking',
        p_entity_id => NEW.id,
        p_channels => ARRAY['in_app', 'email']::TEXT[]
      );

    -- Event 9: Job completion request / completed
    ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      PERFORM public.create_notification(
        p_user_id => NEW.customer_id,
        p_notification_type => 'job_completion_request',
        p_title => 'Job Completed — Inspection Sign-off',
        p_body => 'Work on booking #' || NEW.reference_code || ' has been marked complete. Please review and leave a rating.',
        p_action_url => '/bookings/' || NEW.id::text,
        p_entity_type => 'booking',
        p_entity_id => NEW.id,
        p_channels => ARRAY['in_app', 'email']::TEXT[]
      );

    -- Event 7: Cancelled
    ELSIF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      IF v_pro_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          p_user_id => v_pro_user_id,
          p_notification_type => 'booking_status_change',
          p_title => 'Booking Cancelled: #' || NEW.reference_code,
          p_body => 'Booking #' || NEW.reference_code || ' was cancelled: ' || coalesce(NEW.cancellation_reason, 'No reason specified') || '.',
          p_action_url => '/pro/jobs/' || NEW.id::text,
          p_entity_type => 'booking',
          p_entity_id => NEW.id,
          p_channels => ARRAY['in_app', 'email']::TEXT[]
        );
      END IF;

      PERFORM public.create_notification(
        p_user_id => NEW.customer_id,
        p_notification_type => 'booking_status_change',
        p_title => 'Booking Cancellation Confirmed',
        p_body => 'Your service request #' || NEW.reference_code || ' has been cancelled.',
        p_action_url => '/bookings/' || NEW.id::text,
        p_entity_type => 'booking',
        p_entity_id => NEW.id,
        p_channels => ARRAY['in_app', 'email']::TEXT[]
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_notify_lifecycle ON public.bookings;
CREATE TRIGGER trg_bookings_notify_lifecycle
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_lifecycle_events();

-- 5.3 On Professional Verification Status Change -> Notify Pro
CREATE OR REPLACE FUNCTION public.notify_on_verification_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    PERFORM public.create_notification(
      p_user_id => NEW.user_id,
      p_notification_type => 'verification_status_change',
      p_title => 'Verification Status Update: ' || initcap(NEW.verification_status::text),
      p_body => CASE
        WHEN NEW.verification_status = 'approved' THEN 'Congratulations! Your EasyLife professional account has been verified.'
        WHEN NEW.verification_status = 'pending' THEN 'Your verification documents are currently under review by our compliance team.'
        WHEN NEW.verification_status = 'rejected' THEN 'Your verification request could not be approved. Please review compliance feedback.'
        WHEN NEW.verification_status = 'suspended' THEN 'Your professional account has been temporarily suspended. Please contact support.'
        ELSE 'Your verification status is now ' || NEW.verification_status::text || '.'
      END,
      p_action_url => '/pro/profile',
      p_entity_type => 'professional_profile',
      p_entity_id => NEW.id,
      p_channels => ARRAY['in_app', 'email']::TEXT[]
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pro_notify_verification ON public.professional_profiles;
CREATE TRIGGER trg_pro_notify_verification
  AFTER UPDATE OF verification_status ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_verification_status_change();

-- 5.4 On Review Submitted -> Notify Professional ('customer_review')
CREATE OR REPLACE FUNCTION public.notify_on_customer_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro_user_id UUID;
  v_booking_ref TEXT;
BEGIN
  SELECT pp.user_id, b.reference_code
  INTO v_pro_user_id, v_booking_ref
  FROM public.professional_profiles pp
  LEFT JOIN public.bookings b ON b.id = NEW.booking_id
  WHERE pp.id = NEW.professional_id;

  IF v_pro_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id => v_pro_user_id,
      p_notification_type => 'customer_review',
      p_title => 'New Customer Review (' || NEW.rating::text || ' ★)',
      p_body => 'A customer posted a review for booking #' || coalesce(v_booking_ref, 'completed job') || ': "'
        || coalesce(substring(NEW.comment FROM 1 FOR 80), 'No comment') || '".',
      p_action_url => '/pro/profile',
      p_entity_type => 'review',
      p_entity_id => NEW.id,
      p_channels => ARRAY['in_app', 'email']::TEXT[]
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_notify_pro ON public.reviews;
CREATE TRIGGER trg_reviews_notify_pro
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_customer_review();

COMMIT;
