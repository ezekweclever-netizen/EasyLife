import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfessionalProfile } from "@/lib/supabase/pro";
import {
  getUserConversations,
  getConversationWithMessages,
  createOrGetBookingConversation,
} from "@/lib/supabase/messages";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { ChatClient } from "@/components/messaging/chat-client";

export const metadata: Metadata = {
  title: "Customer & Support Messages — EasyLife Pro",
  description: "Clarify repair requirements with customers and coordinate site arrivals.",
};

interface ProMessagesPageProps {
  searchParams: Promise<{
    conversationId?: string;
    bookingRef?: string;
  }>;
}

export default async function ProMessagesPage({ searchParams }: ProMessagesPageProps) {
  const { conversationId, bookingRef } = await searchParams;
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/pro/messages");
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);
  if (!profile) {
    redirect("/pro/register");
  }

  let conversations = await getUserConversations(auth.user.id, auth.accessToken);

  let targetConvId = conversationId || null;

  if (!targetConvId && bookingRef) {
    const match = conversations.find((c) => c.booking_reference === bookingRef);
    if (match) {
      targetConvId = match.id;
    } else {
      // Find booking id by reference_code and create thread
      const config = getSupabasePublicConfig();
      if (config) {
        const bookingRes = await supabaseFetch<Array<{ id: string }>>(
          config,
          `/rest/v1/bookings?select=id&reference_code=eq.${encodeURIComponent(
            bookingRef
          )}&limit=1`,
          {
            method: "GET",
            accessToken: auth.accessToken,
          }
        );

        if (bookingRes.ok && bookingRes.data && bookingRes.data.length > 0 && bookingRes.data[0]) {
          const created = await createOrGetBookingConversation(
            bookingRes.data[0].id,
            auth.accessToken
          );
          if (created.success && created.conversationId) {
            targetConvId = created.conversationId;
            conversations = await getUserConversations(auth.user.id, auth.accessToken);
          }
        }
      }
    }
  }

  if (!targetConvId && conversations.length > 0) {
    targetConvId = conversations[0]?.id || null;
  }

  const activeConversation = targetConvId
    ? await getConversationWithMessages(targetConvId, auth.user.id, auth.accessToken)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#E8590C]">
          Communications Desk
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          Customer &amp; Support Messages
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ask customers for additional fault photos, clarify electrical/plumbing specs, and coordinate site access in Port Harcourt, Lagos, or Abuja.
        </p>
      </div>

      <ChatClient
        currentUserId={auth.user.id}
        initialConversations={conversations}
        activeConversation={activeConversation}
        basePath="/pro/messages"
      />
    </div>
  );
}
