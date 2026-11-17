import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { MessageDeliveryStatus } from "@easylife/shared-types";

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: "text" | "system" | "attachment";
  body: string;
  attachment_storage_path: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  attachment_size_bytes: number | null;
  delivery_status: MessageDeliveryStatus;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  user_id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  business_name?: string | null;
  is_verified?: boolean;
}

export interface ConversationSummary {
  id: string;
  booking_id: string | null;
  booking_reference: string | null;
  booking_status: string | null;
  category_name: string | null;
  subject: string | null;
  status: "open" | "archived" | "locked";
  last_message_at: string | null;
  unread_count: number;
  last_message: {
    body: string;
    created_at: string;
    sender_id: string;
    delivery_status: MessageDeliveryStatus;
  } | null;
  other_party: ConversationParticipant | null;
  participants: ConversationParticipant[];
}

export interface ConversationDetail extends ConversationSummary {
  messages: MessageItem[];
}

/**
 * Fetch all active conversations for the authenticated user
 */
export async function getUserConversations(
  userId: string,
  accessToken: string
): Promise<ConversationSummary[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  // 1. Get conversation memberships for user
  const memberRes = await supabaseFetch<
    Array<{
      conversation_id: string;
      unread_count: number;
      last_read_at: string | null;
      role_in_conversation: string;
      conversations: {
        id: string;
        booking_id: string | null;
        subject: string | null;
        status: "open" | "archived" | "locked";
        last_message_at: string | null;
        created_at: string;
        bookings: {
          id: string;
          reference_code: string;
          status: string;
          service_categories: {
            name: string;
          } | null;
        } | null;
      } | null;
    }>
  >(
    config,
    "/rest/v1/conversation_members?select=conversation_id,unread_count,last_read_at,role_in_conversation,conversations(id,booking_id,subject,status,last_message_at,created_at,bookings(id,reference_code,status,service_categories!bookings_category_id_fkey(name)))&user_id=eq." +
      encodeURIComponent(userId) +
      "&order=joined_at.desc",
    {
      method: "GET",
      accessToken,
    }
  );

  if (!memberRes.ok || !Array.isArray(memberRes.data) || memberRes.data.length === 0) {
    return [];
  }

  const convIds = memberRes.data.map((m) => m.conversation_id);

  // 2. Fetch all members across these conversations to identify the other party
  const allMembersRes = await supabaseFetch<
    Array<{
      conversation_id: string;
      user_id: string;
      role_in_conversation: string;
      profiles: {
        id: string;
        full_name: string | null;
        primary_role: string;
        avatar_url: string | null;
        professional_profiles?: Array<{
          business_name: string | null;
          verification_status: string;
        }>;
      } | null;
    }>
  >(
    config,
    "/rest/v1/conversation_members?select=conversation_id,user_id,role_in_conversation,profiles(id,full_name,primary_role,avatar_url,professional_profiles(business_name,verification_status))&conversation_id=in.(" +
      convIds.map((id) => `"${id}"`).join(",") +
      ")",
    {
      method: "GET",
      accessToken,
    }
  );

  const membersByConv = new Map<string, ConversationParticipant[]>();
  if (allMembersRes.ok && Array.isArray(allMembersRes.data)) {
    for (const row of allMembersRes.data) {
      const prof = row.profiles;
      const proProfile = prof?.professional_profiles?.[0];
      const participant: ConversationParticipant = {
        user_id: row.user_id,
        full_name: prof?.full_name || null,
        role: row.role_in_conversation,
        avatar_url: prof?.avatar_url || null,
        business_name: proProfile?.business_name || null,
        is_verified:
          proProfile?.verification_status === "approved" ||
          proProfile?.verification_status === "verified",
      };
      const list = membersByConv.get(row.conversation_id) || [];
      list.push(participant);
      membersByConv.set(row.conversation_id, list);
    }
  }

  // 3. Fetch latest message for each conversation
  const messagesRes = await supabaseFetch<
    Array<{
      id: string;
      conversation_id: string;
      body: string;
      created_at: string;
      sender_id: string;
      delivery_status: MessageDeliveryStatus;
    }>
  >(
    config,
    "/rest/v1/messages?select=id,conversation_id,body,created_at,sender_id,delivery_status&conversation_id=in.(" +
      convIds.map((id) => `"${id}"`).join(",") +
      ")&deleted_at=is.null&order=created_at.desc&limit=50",
    {
      method: "GET",
      accessToken,
    }
  );

  const latestMessageByConv = new Map<string, any>();
  if (messagesRes.ok && Array.isArray(messagesRes.data)) {
    for (const msg of messagesRes.data) {
      if (!latestMessageByConv.has(msg.conversation_id)) {
        latestMessageByConv.set(msg.conversation_id, msg);
      }
    }
  }

  // 4. Combine into ConversationSummary
  const summaries: ConversationSummary[] = [];

  for (const row of memberRes.data) {
    const conv = row.conversations;
    if (!conv) continue;

    const participants = membersByConv.get(conv.id) || [];
    const otherParty = participants.find((p) => p.user_id !== userId) || null;
    const lastMsg = latestMessageByConv.get(conv.id) || null;

    summaries.push({
      id: conv.id,
      booking_id: conv.booking_id,
      booking_reference: conv.bookings?.reference_code || null,
      booking_status: conv.bookings?.status || null,
      category_name: conv.bookings?.service_categories?.name || null,
      subject: conv.subject,
      status: conv.status,
      last_message_at: conv.last_message_at || conv.created_at,
      unread_count: row.unread_count || 0,
      last_message: lastMsg
        ? {
            body: lastMsg.body,
            created_at: lastMsg.created_at,
            sender_id: lastMsg.sender_id,
            delivery_status: lastMsg.delivery_status || "sent",
          }
        : null,
      other_party: otherParty,
      participants,
    });
  }

  // Sort by last_message_at descending
  return summaries.sort((a, b) => {
    const timeA = new Date(a.last_message_at || 0).getTime();
    const timeB = new Date(b.last_message_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Fetch detailed conversation thread with full message history
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string,
  accessToken: string
): Promise<ConversationDetail | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  // 1. Fetch conversation and booking
  const convRes = await supabaseFetch<
    Array<{
      id: string;
      booking_id: string | null;
      subject: string | null;
      status: "open" | "archived" | "locked";
      last_message_at: string | null;
      created_at: string;
      bookings: {
        id: string;
        reference_code: string;
        status: string;
        service_categories: {
          name: string;
        } | null;
      } | null;
    }>
  >(
    config,
    `/rest/v1/conversations?select=id,booking_id,subject,status,last_message_at,created_at,bookings(id,reference_code,status,service_categories!bookings_category_id_fkey(name))&id=eq.${encodeURIComponent(
      conversationId
    )}&limit=1`,
    {
      method: "GET",
      accessToken,
    }
  );

  if (!convRes.ok || !convRes.data || convRes.data.length === 0 || !convRes.data[0]) {
    return null;
  }

  const conv = convRes.data[0];

  // 2. Fetch conversation members & profiles
  const membersRes = await supabaseFetch<
    Array<{
      conversation_id: string;
      user_id: string;
      role_in_conversation: string;
      unread_count: number;
      profiles: {
        id: string;
        full_name: string | null;
        primary_role: string;
        avatar_url: string | null;
        professional_profiles?: Array<{
          business_name: string | null;
          verification_status: string;
        }>;
      } | null;
    }>
  >(
    config,
    `/rest/v1/conversation_members?select=conversation_id,user_id,role_in_conversation,unread_count,profiles(id,full_name,primary_role,avatar_url,professional_profiles(business_name,verification_status))&conversation_id=eq.${encodeURIComponent(
      conversationId
    )}`,
    {
      method: "GET",
      accessToken,
    }
  );

  const participants: ConversationParticipant[] = [];
  let userUnread = 0;

  if (membersRes.ok && Array.isArray(membersRes.data)) {
    for (const row of membersRes.data) {
      if (row.user_id === userId) {
        userUnread = row.unread_count || 0;
      }
      const prof = row.profiles;
      const proProfile = prof?.professional_profiles?.[0];
      participants.push({
        user_id: row.user_id,
        full_name: prof?.full_name || null,
        role: row.role_in_conversation,
        avatar_url: prof?.avatar_url || null,
        business_name: proProfile?.business_name || null,
        is_verified:
          proProfile?.verification_status === "approved" ||
          proProfile?.verification_status === "verified",
      });
    }
  }

  const otherParty = participants.find((p) => p.user_id !== userId) || null;

  // 3. Fetch messages ordered ascending for conversation thread
  const messagesRes = await supabaseFetch<MessageItem[]>(
    config,
    `/rest/v1/messages?select=id,conversation_id,sender_id,message_type,body,attachment_storage_path,attachment_name,attachment_mime_type,attachment_size_bytes,delivery_status,delivered_at,read_at,created_at,updated_at&conversation_id=eq.${encodeURIComponent(
      conversationId
    )}&deleted_at=is.null&order=created_at.asc&limit=100`,
    {
      method: "GET",
      accessToken,
    }
  );

  const messages = messagesRes.ok && Array.isArray(messagesRes.data) ? messagesRes.data : [];

  return {
    id: conv.id,
    booking_id: conv.booking_id,
    booking_reference: conv.bookings?.reference_code || null,
    booking_status: conv.bookings?.status || null,
    category_name: conv.bookings?.service_categories?.name || null,
    subject: conv.subject,
    status: conv.status,
    last_message_at: conv.last_message_at || conv.created_at,
    unread_count: userUnread,
    last_message:
      messages.length > 0 && messages[messages.length - 1]
        ? {
            body: messages[messages.length - 1]!.body,
            created_at: messages[messages.length - 1]!.created_at,
            sender_id: messages[messages.length - 1]!.sender_id,
            delivery_status: messages[messages.length - 1]!.delivery_status,
          }
        : null,
    other_party: otherParty,
    participants,
    messages,
  };
}

/**
 * Server-side helper to create or retrieve a booking conversation
 */
export async function createOrGetBookingConversation(
  bookingId: string,
  accessToken: string
): Promise<{ success: boolean; conversationId?: string; message?: string }> {
  const config = getSupabasePublicConfig();
  if (!config) return { success: false, message: "Configuration unavailable." };

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
      accessToken,
      body: {
        p_booking_id: bookingId,
      },
    }
  );

  if (!res.ok) {
    return { success: false, message: res.message };
  }

  return { success: true, conversationId: res.data.conversation_id };
}

