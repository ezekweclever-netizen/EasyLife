import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { getUserConversations, getConversationWithMessages } from "@/lib/supabase/messages";
import { getUnreadNotificationCount } from "@/lib/supabase/notifications";
import { CustomerHeader } from "@/components/customer/customer-header";
import { ChatClient } from "@/components/messaging/chat-client";

export const metadata: Metadata = {
  title: "Messages — EasyLife",
  description: "Chat securely with assigned professionals and EasyLife support desk.",
};

interface CustomerMessagesPageProps {
  searchParams: Promise<{
    conversationId?: string;
  }>;
}

export default async function CustomerMessagesPage({ searchParams }: CustomerMessagesPageProps) {
  const { conversationId } = await searchParams;
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/messages");
  }

  const [profile, conversations, unreadNotifs] = await Promise.all([
    getCustomerProfile(auth.user.id, auth.accessToken),
    getUserConversations(auth.user.id, auth.accessToken),
    getUnreadNotificationCount(auth.user.id, auth.accessToken),
  ]);

  const targetConvId = conversationId || (conversations.length > 0 ? conversations[0]?.id || null : null);

  const activeConversation = targetConvId
    ? await getConversationWithMessages(targetConvId, auth.user.id, auth.accessToken)
    : null;

  return (
    <div className="min-h-screen bg-[#FAF7F3] pb-24 md:pb-12 text-[#1F2328]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        unreadNotificationsCount={unreadNotifs}
        selectedCity={profile?.city || "Port Harcourt"}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8590C]">
            Secure Communications
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2328] tracking-tight mt-0.5">
            Messages &amp; Direct Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Direct communication with your assigned professionals and platform support
          </p>
        </div>

        <ChatClient
          currentUserId={auth.user.id}
          initialConversations={conversations}
          activeConversation={activeConversation}
          basePath="/messages"
        />
      </main>
    </div>
  );
}
