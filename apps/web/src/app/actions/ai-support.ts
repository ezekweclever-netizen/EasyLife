"use server";

import { executeSupportEngine, SupportEngineResult } from "@/lib/ai/support-engine";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export interface SendSupportMessageInput {
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  sessionId?: string;
  userId?: string | null;
}

export interface SendSupportMessageResponse {
  success: boolean;
  data?: SupportEngineResult;
  error?: string;
}

export async function sendCustomerSupportMessageAction(
  input: SendSupportMessageInput
): Promise<SendSupportMessageResponse> {
  try {
    if (!input.userMessage || !input.userMessage.trim()) {
      return {
        success: false,
        error: "Message cannot be empty.",
      };
    }

    const auth = await getAuthenticatedUser();
    const sessionId = input.sessionId || `sup-sess-${Date.now()}`;

    const result = await executeSupportEngine({
      userMessage: input.userMessage.trim(),
      conversationHistory: input.conversationHistory,
      sessionId,
      userId: auth?.user?.id || null,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error("sendCustomerSupportMessageAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to process support message.",
    };
  }
}

export async function fetchUserSupportTicketsAction(userId?: string) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth?.user) {
      return { success: false, tickets: [], error: "Authentication required." };
    }

    const adminCheck = await verifyAdminSession();
    const scopedUserId =
      adminCheck.ok && userId ? userId : auth.user.id;

    const path =
      "/rest/v1/support_tickets?select=id,ticket_ref,subject,category,priority,status,user_message,ai_summary,created_at,updated_at&user_id=eq." +
      encodeURIComponent(scopedUserId) +
      "&order=created_at.desc&limit=20";

    const res = await supabaseAdminFetch<any[]>(path);
    if (!res.ok) throw new Error(res.message);

    return { success: true, tickets: res.data || [] };
  } catch (err: any) {
    console.error("fetchUserSupportTicketsAction error:", err);
    return { success: false, tickets: [], error: err.message };
  }
}
