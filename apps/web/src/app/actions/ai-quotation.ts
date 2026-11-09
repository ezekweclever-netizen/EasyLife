"use server";

import { executeAIQuotationEngine, AIQuotationSuggestionResult } from "@/lib/ai/quotation-engine";

export interface GenerateAIQuotationInput {
  bookingId?: string;
  jobTitle: string;
  categorySlug?: string;
  categoryName?: string;
  problemDescription: string;
  scopeNotes?: string;
  locationCity?: string;
}

export interface GenerateAIQuotationResponse {
  success: boolean;
  data?: AIQuotationSuggestionResult;
  error?: string;
}

export async function generateAIQuotationSuggestionAction(
  input: GenerateAIQuotationInput
): Promise<GenerateAIQuotationResponse> {
  try {
    if (!input.jobTitle && !input.problemDescription) {
      return {
        success: false,
        error: "Please provide a job title or problem description.",
      };
    }

    const result = await executeAIQuotationEngine({
      bookingId: input.bookingId,
      jobTitle: input.jobTitle || "Repair Service",
      categorySlug: input.categorySlug,
      categoryName: input.categoryName,
      problemDescription: input.problemDescription || input.jobTitle,
      scopeNotes: input.scopeNotes,
      locationCity: input.locationCity || "Port Harcourt",
      sessionId: `quote-${Date.now()}`,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error("generateAIQuotationSuggestionAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate quotation suggestion.",
    };
  }
}
