"use server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { executeAIAssistant } from "@/lib/ai/assistant-engine";
import { fetchActiveCategories } from "@/lib/ai/categories";
import type {
  AIAssistantResponseData,
  AIAssistantMessage,
} from "@easylife/shared-types";

export interface SendAssistantMessageInput {
  sessionId: string;
  userMessage: string;
  conversationHistory?: AIAssistantMessage[];
}

export interface SendAssistantMessageResult {
  ok: boolean;
  message?: string;
  data?: AIAssistantResponseData;
}

/**
 * 1. Process Customer Natural Language Problem Description
 */
export async function sendAssistantMessageAction(
  input: SendAssistantMessageInput
): Promise<SendAssistantMessageResult> {
  const { sessionId, userMessage, conversationHistory = [] } = input;

  if (!userMessage || !userMessage.trim()) {
    return { ok: false, message: "Please provide a description of the problem." };
  }

  const auth = await getAuthenticatedUser();
  const userId = auth?.user?.id || null;

  // 1. Rate Limit Enforcement (Max 15 queries per 60-second window)
  try {
    const rateCheckRes = await supabaseAdminFetch<boolean>(
      "/rest/v1/rpc/check_ai_rate_limit",
      {
        method: "POST",
        timeoutMs: 4000,
        body: {
          p_session_id: sessionId,
          p_user_id: userId,
          p_window_seconds: 60,
          p_max_requests: 15,
        },
      }
    );

    if (rateCheckRes.ok && rateCheckRes.data === false) {
      return {
        ok: false,
        message:
          "You have sent multiple messages in quick succession. Please pause for a moment before continuing, or select your service category manually.",
        data: {
          understandingSummary:
            "Rate limit pause: Please wait a moment before sending another message to prevent automated query flooding.",
          clarifyingQuestions: [],
          suggestedQuickReplies: ["Browse services manually"],
          categoryRecommendation: null,
          problemSummary: {
            reportedSymptoms: [userMessage],
            potentialCausesDisclaimer:
              "Query temporarily throttled. You can proceed directly to manual booking or wait a moment.",
            suggestedProfessionalType: "Accredited Trade Professional",
          },
          structuredRequest: null,
          requiresClarification: true,
          rateLimitExceeded: true,
        },
      };
    }
  } catch (err) {
    console.warn("Rate limit check error, proceeding safely:", err);
  }

  // 2. Execute AI Engine (OpenAI + Domain Heuristic Fallback)
  const historyFormatted = conversationHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiResult = await executeAIAssistant({
    userMessage: userMessage.trim(),
    conversationHistory: historyFormatted,
    userId,
    sessionId,
  });

  // 3. Record Usage & Audit Metrics in PostgreSQL
  try {
    await supabaseAdminFetch("/rest/v1/rpc/record_ai_assistant_log", {
      method: "POST",
      timeoutMs: 4000,
      body: {
        p_session_id: sessionId,
        p_customer_message: userMessage.trim(),
        p_category_id: aiResult.categoryRecommendation?.categoryId || null,
        p_category_name: aiResult.categoryRecommendation?.categoryName || null,
        p_confidence: aiResult.categoryRecommendation?.confidence || "medium",
        p_model_name: aiResult.usage?.model || "rule-based-heuristic-v1",
        p_prompt_tokens: aiResult.usage?.promptTokens || 0,
        p_completion_tokens: aiResult.usage?.completionTokens || 0,
        p_total_tokens: aiResult.usage?.totalTokens || 0,
        p_estimated_cost_usd: aiResult.usage?.estimatedCostUsd || 0.0,
        p_user_id: userId,
      },
    });
  } catch (logErr) {
    console.warn("Failed to record AI log:", logErr);
  }

  return {
    ok: true,
    data: aiResult,
  };
}

/**
 * 2. Fetch Active Categories for Fallback Selector
 */
export async function getAIAssistantCategories() {
  return fetchActiveCategories();
}

/**
 * 3. Fetch Admin Metrics on AI Usage & Estimated Costs
 */
export async function getAIAssistantMetricsAction() {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return null;
  }

  const res = await supabaseAdminFetch<Record<string, unknown>>(
    "/rest/v1/rpc/get_ai_assistant_metrics",
    { method: "POST" }
  );

  return res.ok ? res.data : null;
}
