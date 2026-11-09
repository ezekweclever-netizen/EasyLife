"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface MessageActionState {
  status: "idle" | "success" | "error";
  message: string;
  data?: any;
}

/**
 * Send a message in a conversation (text or attachment)
 */
export async function sendMessageAction(
  _prevState: MessageActionState,
  formData: FormData
): Promise<MessageActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "Please sign in to send messages.",
    };
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const messageType = String(formData.get("messageType") || "text").trim();
  const attachmentPath = formData.get("attachmentPath") ? String(formData.get("attachmentPath")).trim() : null;
  const attachmentName = formData.get("attachmentName") ? String(formData.get("attachmentName")).trim() : null;
  const attachmentMimeType = formData.get("attachmentMimeType") ? String(formData.get("attachmentMimeType")).trim() : null;
  const attachmentSizeBytes = formData.get("attachmentSizeBytes") ? Number(formData.get("attachmentSizeBytes")) : null;

  if (!conversationId) {
    return {
      status: "error",
      message: "Conversation ID is required.",
    };
  }

  if (!body && !attachmentPath) {
    return {
      status: "error",
      message: "Message text or an attachment is required.",
    };
  }

  // File size validation if attachment is provided
  if (attachmentSizeBytes && attachmentSizeBytes > 8388608) {
    return {
      status: "error",
      message: "Attachment exceeds the maximum allowed size of 8 MB.",
    };
  }

  // MIME type validation
  const validMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (attachmentMimeType && !validMimes.includes(attachmentMimeType)) {
    return {
      status: "error",
      message: "Unsupported attachment type. Allowed formats: JPG, PNG, WebP, PDF.",
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Database service temporarily unavailable.",
    };
  }

  // Call trusted RPC: send_conversation_message
  const res = await supabaseFetch<{
    success: boolean;
    message_id: string;
    conversation_id: string;
    delivery_status: string;
    created_at: string;
  }>(
    config,
    "/rest/v1/rpc/send_conversation_message",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_conversation_id: conversationId,
        p_body: body || (attachmentName ? `Attachment: ${attachmentName}` : "Attachment"),
        p_message_type: attachmentPath ? "attachment" : messageType,
        p_attachment_path: attachmentPath,
        p_attachment_name: attachmentName,
        p_attachment_mime_type: attachmentMimeType,
        p_attachment_size_bytes: attachmentSizeBytes,
      },
    }
  );

  if (!res.ok) {
    return {
      status: "error",
      message: res.message || "Failed to send message.",
    };
  }

  revalidatePath("/messages");
  revalidatePath("/pro/messages");

  return {
    status: "success",
    message: "Message sent.",
    data: res.data,
  };
}

/**
 * Mark a conversation as read and reset unread counts
 */
export async function markConversationReadAction(
  conversationId: string
): Promise<{ success: boolean; message?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { success: false, message: "Authentication required." };
  }

  if (!conversationId) {
    return { success: false, message: "Conversation ID is required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { success: false, message: "Database service temporarily unavailable." };
  }

  const res = await supabaseFetch<{
    success: boolean;
    conversation_id: string;
    messages_marked_read: number;
  }>(
    config,
    "/rest/v1/rpc/mark_conversation_as_read",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_conversation_id: conversationId,
      },
    }
  );

  if (!res.ok) {
    return { success: false, message: res.message };
  }

  revalidatePath("/messages");
  revalidatePath("/pro/messages");
  return { success: true };
}

/**
 * Create or retrieve an existing conversation thread for a booking
 */
export async function getOrCreateBookingConversationAction(
  bookingId: string
): Promise<{ success: boolean; conversationId?: string; message?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { success: false, message: "Authentication required." };
  }

  if (!bookingId) {
    return { success: false, message: "Booking ID is required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { success: false, message: "Database service temporarily unavailable." };
  }

  const res = await supabaseFetch<{
    success: boolean;
    conversation_id: string;
    booking_id: string;
    booking_reference: string;
  }>(
    config,
    "/rest/v1/rpc/create_or_get_booking_conversation",
    {
      method: "POST",
      accessToken: auth.accessToken,
      body: {
        p_booking_id: bookingId,
      },
    }
  );

  if (!res.ok) {
    return { success: false, message: res.message };
  }

  return {
    success: true,
    conversationId: res.data.conversation_id,
  };
}
