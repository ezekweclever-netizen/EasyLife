/**
 * EasyLife AI Diagnostic & Request Generation Engine
 * Supports OpenAI API with automated fallback to domain-specific heuristic reasoning.
 */

import {
  AI_SYSTEM_PROMPT,
  sanitizeOutputForSafety,
  getStandardDiagnosisDisclaimer,
} from "./safety-rules";
import {
  validateAndResolveCategory,
  fetchActiveCategories,
  ServiceCategoryRecord,
} from "./categories";
import type {
  AIAssistantResponseData,
  AIAssistantCategoryRecommendation,
} from "@easylife/shared-types";

export interface AssistantExecutionOptions {
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  userId?: string | null;
  sessionId: string;
}

/**
 * Main AI Assistant Entrypoint
 */
export async function executeAIAssistant(
  options: AssistantExecutionOptions
): Promise<AIAssistantResponseData> {
  const { userMessage, conversationHistory = [] } = options;
  const categories = await fetchActiveCategories();

  // 1. Check if OpenAI API Key is configured
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (apiKey) {
    try {
      const openAIResult = await callOpenAIChatCompletion({
        apiKey,
        model,
        userMessage,
        conversationHistory,
        categories,
      });

      if (openAIResult) {
        return openAIResult;
      }
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to rule-based engine:", err);
    }
  }

  // 2. Rule-Based Domain Heuristic Fallback Engine
  return executeRuleBasedDiagnosticEngine(userMessage, categories);
}

/**
 * Call OpenAI Chat Completion with Structured JSON Output
 */
async function callOpenAIChatCompletion(params: {
  apiKey: string;
  model: string;
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  categories: ServiceCategoryRecord[];
}): Promise<AIAssistantResponseData | null> {
  const { apiKey, model, userMessage, conversationHistory, categories } = params;

  const categoryListPrompt = categories
    .map((c) => `- ${c.name} (slug: ${c.slug}, id: ${c.id})`)
    .join("\n");

  const systemContent = `${AI_SYSTEM_PROMPT}\n\nCURRENT ACCREDITED DATABASE CATEGORIES:\n${categoryListPrompt}`;

  const messages = [
    { role: "system", content: systemContent },
    ...conversationHistory.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1000,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const choice = json.choices?.[0]?.message?.content;
  if (!choice) return null;

  const parsed = JSON.parse(choice);

  // Validate Category with Database
  let validatedCategory: AIAssistantCategoryRecommendation | null = null;
  if (parsed.categoryRecommendation) {
    validatedCategory = await validateAndResolveCategory(
      parsed.categoryRecommendation.categoryId ||
        parsed.categoryRecommendation.categorySlug ||
        parsed.categoryRecommendation.categoryName ||
        userMessage
    );
  }

  const sanitizedUnderstanding = sanitizeOutputForSafety(
    parsed.understandingSummary || "Thank you for explaining the issue."
  );

  const promptTokens = json.usage?.prompt_tokens || 0;
  const completionTokens = json.usage?.completion_tokens || 0;
  const totalTokens = json.usage?.total_tokens || 0;
  // Cost: $0.15 / 1M prompt, $0.60 / 1M completion for gpt-4o-mini
  const estimatedCost = (promptTokens * 0.00000015) + (completionTokens * 0.0000006);

  const fallbackCategory = validatedCategory || {
    categoryId: categories[0]?.id || "10000000-0000-4000-8000-000000000001",
    categoryName: categories[0]?.name || "General Maintenance",
    categorySlug: categories[0]?.slug || "everyday-tasks",
    confidence: "medium",
    reasoning: "Assigned default active trade category.",
  };

  return {
    understandingSummary: sanitizedUnderstanding.sanitized,
    clarifyingQuestions: Array.isArray(parsed.clarifyingQuestions)
      ? parsed.clarifyingQuestions.slice(0, 3)
      : [
          "When did you first notice this problem?",
          "Has this equipment or fixture been serviced recently?",
        ],
    suggestedQuickReplies: Array.isArray(parsed.suggestedQuickReplies)
      ? parsed.suggestedQuickReplies.slice(0, 4)
      : ["Started today", "Happens intermittently", "Urgent assistance needed"],
    categoryRecommendation: validatedCategory,
    problemSummary: {
      reportedSymptoms: Array.isArray(parsed.problemSummary?.reportedSymptoms)
        ? parsed.problemSummary.reportedSymptoms
        : [userMessage],
      potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
      suggestedProfessionalType:
        parsed.problemSummary?.suggestedProfessionalType || "Accredited Trade Professional",
      safetyNotice:
        parsed.problemSummary?.safetyNotice ||
        "Always ensure safety. Do not attempt uncertified DIY repairs on electrical or high-pressure systems.",
    },
    structuredRequest: {
      suggestedTitle:
        parsed.structuredRequest?.suggestedTitle ||
        `Service Inspection for ${fallbackCategory.categoryName}`,
      categoryId: fallbackCategory.categoryId,
      categoryName: fallbackCategory.categoryName,
      categorySlug: fallbackCategory.categorySlug,
      urgency: parsed.structuredRequest?.urgency || "normal",
      recommendedDescription:
        parsed.structuredRequest?.recommendedDescription || userMessage,
    },
    requiresClarification: Boolean(parsed.requiresClarification),
    usage: {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: Number(estimatedCost.toFixed(6)),
    },
  };
}

const DEFAULT_FALLBACK_CATEGORY: ServiceCategoryRecord = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "General Maintenance",
  slug: "everyday-tasks",
  description: "General technical maintenance and handyman repairs.",
  is_active: true,
};

/**
 * Intelligent Rule-Based Diagnostic Engine (Fallback & Edge-Resilient)
 */
export function executeRuleBasedDiagnosticEngine(
  text: string,
  categories: ServiceCategoryRecord[]
): AIAssistantResponseData {
  const query = text.toLowerCase();

  // 1. Generator Diagnostics
  if (
    query.includes("generator") ||
    query.includes("gen") ||
    query.includes("lister") ||
    query.includes("mikano") ||
    query.includes("carburettor")
  ) {
    const cat = categories.find((c) => c.slug === "generator-maintenance") || categories[0] || DEFAULT_FALLBACK_CATEGORY;
    const isStalling =
      query.includes("switch") ||
      query.includes("off") ||
      query.includes("shut") ||
      query.includes("dies") ||
      query.includes("stop");

    return {
      understandingSummary: isStalling
        ? "I understand that your generator turns on normally but cuts out after running for a few minutes. This is a common issue often related to fuel starvation, an overheating automatic voltage regulator (AVR), or a low oil sensor alert."
        : "I understand you are experiencing an issue with your generator. Generator electrical and mechanical faults require accredited care to avoid engine knocking.",
      clarifyingQuestions: [
        "What brand and capacity (kVA) is your generator (e.g. 2.5kVA, 5kVA, 20kVA diesel)?",
        "Does the engine emit black smoke or make a sputtering sound right before shutting off?",
        "Have you checked if the engine oil level is between the minimum and maximum dipstick marks?",
      ],
      suggestedQuickReplies: [
        "Small petrol generator (2.5 - 3.5kVA)",
        "Large diesel plant (10kVA+)",
        "Sputters before cutting off",
        "Cuts off smoothly with no noise",
      ],
      categoryRecommendation: {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        confidence: "high",
        reasoning: "Matched to Generator Maintenance based on reported power plant operational symptoms.",
      },
      problemSummary: {
        reportedSymptoms: [
          "Generator ignites and runs initially",
          "Engine cuts off or switches off after several minutes",
          "Inability to sustain regular electrical load",
        ],
        potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
        suggestedProfessionalType: "Accredited Generator & Plant Mechanic",
        safetyNotice:
          "Safety Warning: Never open fuel caps or refuel a hot generator engine. Keep the generator in a well-ventilated outdoor area away from windows to prevent carbon monoxide poisoning.",
      },
      structuredRequest: {
        suggestedTitle: "Generator Ignition & Premature Stalling Inspection",
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        urgency: "normal",
        recommendedDescription: `Reported issue: Generator starts normally but cuts off after a few minutes of operation. Requires comprehensive check of carburettor/fuel filter, AVR voltage stability, and engine oil sensor. Customer input: "${text}"`,
      },
      requiresClarification: false,
      usage: {
        model: "rule-based-heuristic-v1",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.0,
      },
    };
  }

  // 2. Inverter & Electrical Diagnostics
  if (
    query.includes("inverter") ||
    query.includes("battery") ||
    query.includes("beep") ||
    query.includes("changeover") ||
    query.includes("wiring") ||
    query.includes("breaker") ||
    query.includes("spark") ||
    query.includes("electrical")
  ) {
    const cat = categories.find((c) => c.slug === "electrical-power-backup") || categories[0] || DEFAULT_FALLBACK_CATEGORY;
    const isBeeping = query.includes("beep") || query.includes("alarm") || query.includes("red");

    return {
      understandingSummary: isBeeping
        ? "I understand that your inverter is alerting or beeping with a fault indicator. Inverters typically signal when there is low battery voltage, an electrical overload, or an internal board fault."
        : "I understand that you have an electrical or power backup issue. Electrical systems require cautious handling by licensed electricians.",
      clarifyingQuestions: [
        "What is the inverter capacity (e.g., 1.5kVA, 3.5kVA, 5kVA) and how many batteries are connected?",
        "Does the beeping stop when heavy appliances (like refrigerators or irons) are switched off?",
        "Approximately how old are your inverter batteries?",
      ],
      suggestedQuickReplies: [
        "24V system (2 batteries)",
        "48V system (4 batteries)",
        "Beeps even with zero load",
        "Batteries are over 2 years old",
      ],
      categoryRecommendation: {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        confidence: "high",
        reasoning: "Matched to Electrical & Power Backup based on power electronics symptoms.",
      },
      problemSummary: {
        reportedSymptoms: [
          "Inverter audible alarm or beeping",
          "Failure to hold expected domestic load",
          "Potential battery cell degradation or charge controller imbalance",
        ],
        potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
        suggestedProfessionalType: "Certified Solar & Inverter Electrical Technician",
        safetyNotice:
          "High Voltage Safety Alert: Inverter battery banks carry high current DC hazards. Do not attempt to short or bridge battery terminals. Keep metal tools away from bare terminals.",
      },
      structuredRequest: {
        suggestedTitle: "Inverter Fault Alarm & Battery Bank Diagnostic",
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        urgency: "high",
        recommendedDescription: `Reported issue: Inverter unit experiencing continuous alarms or failing to sustain load. Requires battery state-of-health test, terminal inspection, and inverter charging circuit check. Customer input: "${text}"`,
      },
      requiresClarification: false,
      usage: {
        model: "rule-based-heuristic-v1",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.0,
      },
    };
  }

  // 3. Air Conditioning & HVAC
  if (
    query.includes("ac") ||
    query.includes("air conditioner") ||
    query.includes("cooling") ||
    query.includes("chiller") ||
    query.includes("compressor")
  ) {
    const cat = categories.find((c) => c.slug === "hvac-air-conditioning") || categories[0] || DEFAULT_FALLBACK_CATEGORY;
    return {
      understandingSummary:
        "I understand your air conditioner is having operational issues. AC systems often require gas pressure top-ups, filter cleaning, or capacitor/compressor diagnostic checks.",
      clarifyingQuestions: [
        "Is it a split AC or a standing floor unit, and what horse power (e.g. 1HP, 1.5HP, 2HP)?",
        "Is the outdoor condensing fan spinning when the AC is turned on?",
        "Do you notice any ice forming on the copper pipes or water dripping indoors?",
      ],
      suggestedQuickReplies: [
        "Split AC (1.5HP)",
        "Outdoor unit fan is not spinning",
        "Blowing warm air only",
        "Water leaking inside room",
      ],
      categoryRecommendation: {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        confidence: "high",
        reasoning: "Matched to HVAC & Air Conditioning based on refrigeration cooling cycle symptoms.",
      },
      problemSummary: {
        reportedSymptoms: [
          "Loss of cooling efficiency",
          "Potential refrigerant leak or faulty outdoor capacitor",
        ],
        potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
        suggestedProfessionalType: "Accredited HVAC & Cooling Systems Technician",
        safetyNotice:
          "Do not puncture copper pipes. High-pressure refrigerant gas must only be handled with professional pressure manifold gauges.",
      },
      structuredRequest: {
        suggestedTitle: "Air Conditioner Cooling Loss & Gas Pressure Diagnostic",
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        urgency: "normal",
        recommendedDescription: `Reported issue: Air conditioner failing to cool adequately. Requires refrigerant leak test, condenser cleaning, and compressor electrical checks. Customer description: "${text}"`,
      },
      requiresClarification: false,
      usage: {
        model: "rule-based-heuristic-v1",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.0,
      },
    };
  }

  // 4. Plumbing & Water Systems
  if (
    query.includes("pipe") ||
    query.includes("leak") ||
    query.includes("water") ||
    query.includes("plumb") ||
    query.includes("sink") ||
    query.includes("toilet") ||
    query.includes("tap") ||
    query.includes("borehole") ||
    query.includes("tank")
  ) {
    const cat = categories.find((c) => c.slug === "plumbing-water-systems") || categories[0] || DEFAULT_FALLBACK_CATEGORY;
    const isLeak = query.includes("leak") || query.includes("flood") || query.includes("burst");

    return {
      understandingSummary: isLeak
        ? "I understand you have a plumbing leak. Uncontrolled water leaks can damage wall screeding and wooden cabinetry, so prompt technician attendance is recommended."
        : "I understand you have a plumbing or water supply issue. Water reticulation and borehole pressure require experienced plumbers.",
      clarifyingQuestions: [
        "Where is the leak located (e.g. under kitchen sink, bathroom ceiling, or main supply line)?",
        "Is the water flow clean supply water or waste drainage?",
        "Have you been able to isolate or shut the main water stopcock?",
      ],
      suggestedQuickReplies: [
        "Under kitchen sink cabinet",
        "Overhead tank overflow",
        "Stopcock already shut off",
        "Water pump not lifting",
      ],
      categoryRecommendation: {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        confidence: "high",
        reasoning: "Matched to Plumbing & Water Systems based on hydraulic flow and pipework symptoms.",
      },
      problemSummary: {
        reportedSymptoms: [
          "Uncontrolled pipe leak or supply failure",
          "Potential joint seal failure, burst PPR pipe, or valve wear",
        ],
        potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
        suggestedProfessionalType: "Licensed Plumber & Water Reticulation Artisan",
        safetyNotice:
          "Flooding Notice: If the leak is active and causing water pooling, shut off the main borehole pump or council water meter immediately.",
      },
      structuredRequest: {
        suggestedTitle: "Plumbing Pipe Leak Isolation & Repair",
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        urgency: isLeak ? "high" : "normal",
        recommendedDescription: `Reported issue: Plumbing leak or pressure failure. Requires pipe replacement, pressure testing, and valve repair. Customer notes: "${text}"`,
      },
      requiresClarification: false,
      usage: {
        model: "rule-based-heuristic-v1",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.0,
      },
    };
  }

  // 5. Default General Diagnostic
  const defaultCat = categories[0] || DEFAULT_FALLBACK_CATEGORY;

  return {
    understandingSummary:
      "Thank you for sharing your issue. I've noted down your description to help pair you with the best accredited professional for the job.",
    clarifyingQuestions: [
      "Can you specify which room, fixture, or piece of equipment is affected?",
      "Are there any specific error codes, visible damages, or strange noises?",
      "How soon would you like an accredited professional to visit your premises?",
    ],
    suggestedQuickReplies: [
      "At my residence",
      "Commercial office site",
      "Immediate urgent service",
      "Flexible schedule this week",
    ],
    categoryRecommendation: {
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      categorySlug: defaultCat.slug,
      confidence: "medium",
      reasoning: "Recommended trade category based on your problem description.",
    },
    problemSummary: {
      reportedSymptoms: [text],
      potentialCausesDisclaimer: getStandardDiagnosisDisclaimer(),
      suggestedProfessionalType: "Verified Trade Technician",
      safetyNotice:
        "Please avoid tampering with any damaged electrical wiring or hazardous machinery before inspection.",
    },
    structuredRequest: {
      suggestedTitle: `Service Inspection Request: ${text.slice(0, 40)}...`,
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      categorySlug: defaultCat.slug,
      urgency: "normal",
      recommendedDescription: `Customer reported service need: "${text}". Accredited professional requested for diagnostic and transparent quote.`,
    },
    requiresClarification: true,
    usage: {
      model: "rule-based-heuristic-v1",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0.0,
    },
  };
}
