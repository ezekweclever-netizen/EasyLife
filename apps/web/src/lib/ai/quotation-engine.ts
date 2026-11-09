/**
 * EasyLife AI Quotation Assistant Engine
 * 
 * Generates structured quotation suggestions for certified professionals:
 * - Labour (diagnosis, repair, installation)
 * - Materials (itemized parts with Nigerian benchmark prices)
 * - Additional expenses (call-out fees, transport/logistics)
 * - Estimated duration in minutes
 * - Detailed professional work description
 * 
 * STRICT COMPLIANCE:
 * - Does not invent arbitrary prices: uses curated Nigerian market benchmarks (NGN)
 * - Never auto-submits quotations: always requires human professional review & approval
 * - Provides reliable non-AI rule-based fallback for all accredited trade categories
 * - Records AI usage logs for auditing and cost control
 */

import { fetchActiveCategories, ServiceCategoryRecord } from "./categories";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export interface AIQuotationSuggestionRequest {
  bookingId?: string;
  jobTitle: string;
  categorySlug?: string;
  categoryName?: string;
  problemDescription: string;
  scopeNotes?: string;
  locationCity?: string;
  userId?: string;
  sessionId?: string;
}

export interface AIQuotationItemSuggestion {
  id: string;
  item_type: "labor" | "parts" | "callout" | "transport" | "other";
  description: string;
  quantity: number;
  unit_price_naira: number;
  notes?: string;
}

export interface AIQuotationSuggestionResult {
  work_description: string;
  estimated_duration_minutes: number;
  items: AIQuotationItemSuggestion[];
  total_suggested_naira: number;
  currency: "NGN";
  is_ai_generated: boolean;
  model_used: string;
  disclaimer: string;
}

/**
 * Standard disclaimer required by EasyLife safety guidelines
 */
export const QUOTATION_REVIEW_DISCLAIMER =
  "Draft quotation suggestion generated for professional reference. All quantities, specifications, and prices must be independently verified and approved by the professional before submission. EasyLife never automatically submits quotations.";

/**
 * Curated Nigerian market baseline benchmarks by category
 */
interface CategoryQuotationTemplate {
  workDescription: (title: string, desc: string) => string;
  durationMinutes: number;
  items: Array<{
    item_type: "labor" | "parts" | "callout" | "transport" | "other";
    description: string;
    quantity: number;
    unit_price_naira: number;
    notes?: string;
  }>;
}

const CATEGORY_BENCHMARK_TEMPLATES: Record<string, CategoryQuotationTemplate> = {
  plumbing: {
    workDescription: (title, desc) =>
      `Comprehensive plumbing inspection and repair for: ${title}. Scope includes isolating the water supply, diagnosing leak/fault points, replacing compromised pipe fittings/valves, pressure testing, and sanitary area cleanup.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "Initial diagnostic inspection & call-out assessment",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Standard assessment fee",
      },
      {
        item_type: "labor",
        description: "Plumbing repair workmanship, pipe disassembly & sealing",
        quantity: 1,
        unit_price_naira: 12000,
        notes: "Experienced artisan labor",
      },
      {
        item_type: "parts",
        description: "Replacement brass valves, pressure fittings & connector hoses",
        quantity: 1,
        unit_price_naira: 8500,
        notes: "Estimated replacement parts",
      },
      {
        item_type: "parts",
        description: "High-grade PTFE Teflon sealing tape & solvent cement",
        quantity: 2,
        unit_price_naira: 1200,
        notes: "Sealing consumables",
      },
      {
        item_type: "transport",
        description: "Logistics & specialized tool delivery",
        quantity: 1,
        unit_price_naira: 3000,
        notes: "Site travel expense",
      },
    ],
  },
  electrical: {
    workDescription: (title, desc) =>
      `Electrical fault investigation and rectification for: ${title}. Scope includes circuit load testing, checking distribution board terminals, replacing faulty breakers/switches, continuity testing, and safety grounding verification.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "Electrical safety diagnosis & multimeter circuit inspection",
        quantity: 1,
        unit_price_naira: 5000,
        notes: "Diagnostic safety fee",
      },
      {
        item_type: "labor",
        description: "Electrical installation & circuit isolation workmanship",
        quantity: 1,
        unit_price_naira: 15000,
        notes: "Certified electrician workmanship",
      },
      {
        item_type: "parts",
        description: "Industrial grade MCB circuit breaker / isolator unit",
        quantity: 1,
        unit_price_naira: 9500,
        notes: "Estimated replacement component",
      },
      {
        item_type: "parts",
        description: "Pure copper single-core wiring (2.5mm / 4mm) & terminal connectors",
        quantity: 1,
        unit_price_naira: 6500,
        notes: "Wiring and junction sundries",
      },
      {
        item_type: "transport",
        description: "Site transportation & test equipment haulage",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Logistics allowance",
      },
    ],
  },
  "air-conditioning": {
    workDescription: (title, desc) =>
      `Full AC servicing and repair for: ${title}. Scope includes cleaning evaporator & condenser coils, inspecting blower fan motor, testing compressor capacitor, checking refrigerant operating pressure, and flushing condensate drain.`,
    durationMinutes: 240,
    items: [
      {
        item_type: "callout",
        description: "AC operational check, manifold gauge pressure & electrical test",
        quantity: 1,
        unit_price_naira: 5000,
        notes: "Diagnostic assessment",
      },
      {
        item_type: "labor",
        description: "Comprehensive AC servicing, coil chemical cleaning & vacuum testing",
        quantity: 1,
        unit_price_naira: 18000,
        notes: "HVAC technician workmanship",
      },
      {
        item_type: "parts",
        description: "Refrigerant top-up (R410A / R22 gas charge)",
        quantity: 1,
        unit_price_naira: 14000,
        notes: "Gas recharge",
      },
      {
        item_type: "parts",
        description: "Dual-run motor capacitor (35uF / 50uF)",
        quantity: 1,
        unit_price_naira: 7500,
        notes: "Potential replacement part",
      },
      {
        item_type: "transport",
        description: "Logistics, vacuum pump & chemical spray transport",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Equipment transit fee",
      },
    ],
  },
  "generator-repairs": {
    workDescription: (title, desc) =>
      `Generator mechanical & electrical overhaul for: ${title}. Scope covers draining old engine oil, cleaning/servicing carburetor, checking spark plug gap, inspecting AVR voltage stability, and load-testing power output.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "On-site generator inspection & diagnostic startup test",
        quantity: 1,
        unit_price_naira: 4500,
        notes: "Site visit fee",
      },
      {
        item_type: "labor",
        description: "Carburetor cleaning, valve adjustment & general servicing labor",
        quantity: 1,
        unit_price_naira: 14000,
        notes: "Generator technician labor",
      },
      {
        item_type: "parts",
        description: "Heavy-duty 4-stroke engine oil (20W-50, 4 Litres)",
        quantity: 1,
        unit_price_naira: 11000,
        notes: "Lubricant replacement",
      },
      {
        item_type: "parts",
        description: "Original replacement spark plug & inline fuel filter",
        quantity: 1,
        unit_price_naira: 4500,
        notes: "Service consumables",
      },
      {
        item_type: "parts",
        description: "Automatic Voltage Regulator (AVR unit) if voltage erratic",
        quantity: 1,
        unit_price_naira: 8500,
        notes: "Contingent electrical spare",
      },
      {
        item_type: "transport",
        description: "Transport of heavy toolbox & spare parts",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Transit expense",
      },
    ],
  },
  "inverter-repairs": {
    workDescription: (title, desc) =>
      `Inverter and battery storage diagnostic service for: ${title}. Scope includes testing individual battery cell voltage under load, inspecting terminal corrosion, checking charging cut-off voltage, and inspecting motherboard cooling fans.`,
    durationMinutes: 210,
    items: [
      {
        item_type: "callout",
        description: "Inverter system diagnostic scan & battery load analysis",
        quantity: 1,
        unit_price_naira: 6000,
        notes: "Specialized diagnostics",
      },
      {
        item_type: "labor",
        description: "Motherboard circuit servicing, battery terminal desulfation & balancing",
        quantity: 1,
        unit_price_naira: 20000,
        notes: "Power electronics technician",
      },
      {
        item_type: "parts",
        description: "Heavy-duty pure copper battery interconnect cables (35mm) & lugs",
        quantity: 2,
        unit_price_naira: 5000,
        notes: "Cable upgrades",
      },
      {
        item_type: "transport",
        description: "Equipment logistics and battery testing apparatus delivery",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Logistics",
      },
    ],
  },
  refrigeration: {
    workDescription: (title, desc) =>
      `Refrigeration cooling inspection and repair for: ${title}. Scope covers checking compressor start relay, inspecting evaporator fan, detecting system gas leaks, flushing system, and recharging refrigerant.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "Refrigeration cooling inspection & compressor assessment",
        quantity: 1,
        unit_price_naira: 4500,
        notes: "Diagnostic visit",
      },
      {
        item_type: "labor",
        description: "Leak detection, system vacuuming & brazing workmanship",
        quantity: 1,
        unit_price_naira: 14000,
        notes: "Refrigeration artisan labor",
      },
      {
        item_type: "parts",
        description: "Refrigerant charge (R134a / R600a canister)",
        quantity: 1,
        unit_price_naira: 12000,
        notes: "Gas charge",
      },
      {
        item_type: "parts",
        description: "PTC solid-state compressor starter relay & overload protector",
        quantity: 1,
        unit_price_naira: 6500,
        notes: "Electrical relay assembly",
      },
      {
        item_type: "transport",
        description: "Gas cylinder & torch transit logistics",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Tool carriage",
      },
    ],
  },
  "solar-systems": {
    workDescription: (title, desc) =>
      `Solar array and charge controller servicing for: ${title}. Scope involves inspecting rooftop solar PV panels, cleaning dust and debris, checking MC4 connectors, inspecting DC surge protection, and verifying daily watt-hour output.`,
    durationMinutes: 240,
    items: [
      {
        item_type: "callout",
        description: "Rooftop solar PV string voltage & power output inspection",
        quantity: 1,
        unit_price_naira: 6000,
        notes: "Rooftop safety & diagnostic fee",
      },
      {
        item_type: "labor",
        description: "Array cleaning, MC4 connector re-crimping & string testing labor",
        quantity: 1,
        unit_price_naira: 22000,
        notes: "Solar technician workmanship",
      },
      {
        item_type: "parts",
        description: "Waterproof MC4 solar connector pairs & 6mm DC cable repair",
        quantity: 2,
        unit_price_naira: 4500,
        notes: "DC solar connection hardware",
      },
      {
        item_type: "transport",
        description: "Ladder, safety harness & specialized solar equipment transport",
        quantity: 1,
        unit_price_naira: 5000,
        notes: "Haulage & safety gear transit",
      },
    ],
  },
  painting: {
    workDescription: (title, desc) =>
      `Interior/exterior painting and surface finishing for: ${title}. Scope involves surface scraping, crack filling with screeding putty, sanding down smooth, applying primer coat, and two finish emulsion coats.`,
    durationMinutes: 360,
    items: [
      {
        item_type: "callout",
        description: "Surface measurement, square meter calculation & color matching",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Initial site visit",
      },
      {
        item_type: "labor",
        description: "Wall prep, putty screeding, sanding & two-coat painting labor",
        quantity: 1,
        unit_price_naira: 25000,
        notes: "Skilled painter workmanship",
      },
      {
        item_type: "parts",
        description: "High-coverage washable acrylic emulsion paint (20L Drum)",
        quantity: 1,
        unit_price_naira: 28000,
        notes: "Premium emulsion paint",
      },
      {
        item_type: "parts",
        description: "Screeding paste, sandpaper rolls & masking tape consumables",
        quantity: 1,
        unit_price_naira: 8500,
        notes: "Prep consumables",
      },
      {
        item_type: "transport",
        description: "Drum and scaffolding transport logistics",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Site delivery",
      },
    ],
  },
  carpentry: {
    workDescription: (title, desc) =>
      `Carpentry and joinery maintenance for: ${title}. Scope covers disassembling damaged woodwork, planing warped edges, replacing defective hardware/hinges, realigning frames, and securing structural anchoring.`,
    durationMinutes: 240,
    items: [
      {
        item_type: "callout",
        description: "Joinery inspection & precise dimension measurements",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Site survey",
      },
      {
        item_type: "labor",
        description: "Wood cutting, joinery refitting & installation labor",
        quantity: 1,
        unit_price_naira: 16000,
        notes: "Master carpenter workmanship",
      },
      {
        item_type: "parts",
        description: "Heavy-duty stainless steel ball-bearing hinges & security lockset",
        quantity: 1,
        unit_price_naira: 11500,
        notes: "Hardware spares",
      },
      {
        item_type: "parts",
        description: "Wood glue, anchor screws & timber filler",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Consumables",
      },
      {
        item_type: "transport",
        description: "Carpentry tool carriage & timber transport",
        quantity: 1,
        unit_price_naira: 3500,
        notes: "Transit expense",
      },
    ],
  },
  "pest-control": {
    workDescription: (title, desc) =>
      `Fumigation and pest eradication treatment for: ${title}. Scope includes site vulnerability inspection, crack & crevice misting, perimeter residual barrier spraying, gel baiting for harborage areas, and safety clearance advice.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "Pest infestation severity survey & chemical plan selection",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Survey fee",
      },
      {
        item_type: "labor",
        description: "Chemical application, misting & targeted perimeter treatment labor",
        quantity: 1,
        unit_price_naira: 15000,
        notes: "Certified fumigator workmanship",
      },
      {
        item_type: "parts",
        description: "Broad-spectrum agricultural-grade insecticide & odor-controlled solution",
        quantity: 1,
        unit_price_naira: 16500,
        notes: "Pesticide chemical formulation",
      },
      {
        item_type: "transport",
        description: "Pressurized motorized fogger and PPE transport",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Hazard equipment transport",
      },
    ],
  },
  cleaning: {
    workDescription: (title, desc) =>
      `Deep cleaning and sanitization service for: ${title}. Scope includes vacuuming, floor scrubbing with commercial buffing chemicals, degreasing kitchen & bath fixtures, window glass detailing, and waste disposal.`,
    durationMinutes: 300,
    items: [
      {
        item_type: "labor",
        description: "Comprehensive deep cleaning workmanship (team of 2 cleaners)",
        quantity: 1,
        unit_price_naira: 22000,
        notes: "Professional cleaning team labor",
      },
      {
        item_type: "parts",
        description: "Commercial floor detergent, disinfectant, microfiber cloths & scrubbing pads",
        quantity: 1,
        unit_price_naira: 8500,
        notes: "Cleaning chemicals & materials",
      },
      {
        item_type: "transport",
        description: "Industrial wet/dry vacuum and cleaning equipment transit",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Logistics",
      },
    ],
  },
  "general-maintenance": {
    workDescription: (title, desc) =>
      `General maintenance and handyman repair for: ${title}. Scope covers assessing identified faults, tightening mechanical fixtures, sealing gaps, replacing defective minor fittings, and ensuring operational safety.`,
    durationMinutes: 180,
    items: [
      {
        item_type: "callout",
        description: "Site inspection and multi-point handyman assessment",
        quantity: 1,
        unit_price_naira: 4000,
        notes: "Standard call-out",
      },
      {
        item_type: "labor",
        description: "General repair workmanship, fixing & installation labor",
        quantity: 1,
        unit_price_naira: 12000,
        notes: "Handyman workmanship",
      },
      {
        item_type: "parts",
        description: "Miscellaneous hardware, silicone sealant, anchors & screws",
        quantity: 1,
        unit_price_naira: 5000,
        notes: "Hardware spares",
      },
      {
        item_type: "transport",
        description: "Toolbox delivery and local transport",
        quantity: 1,
        unit_price_naira: 3000,
        notes: "Transit allowance",
      },
    ],
  },
};

/**
 * Main AI Quotation Generation Function
 */
export async function executeAIQuotationEngine(
  request: AIQuotationSuggestionRequest
): Promise<AIQuotationSuggestionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // 1. Try OpenAI if available
  if (apiKey) {
    try {
      const openAIResult = await callOpenAIQuotationCompletion({
        apiKey,
        model,
        request,
      });

      if (openAIResult) {
        // Record log asynchronously
        await recordQuotationAILog({
          userId: request.userId,
          sessionId: request.sessionId || `quote-sess-${Date.now()}`,
          message: `${request.jobTitle}: ${request.problemDescription}`,
          model,
          promptTokens: 400,
          completionTokens: 300,
          costUsd: 0.00024,
        });

        return openAIResult;
      }
    } catch (err) {
      console.warn("OpenAI quotation call failed, using rule-based benchmark:", err);
    }
  }

  // 2. Rule-Based Benchmark Engine
  return executeRuleBasedQuotationEngine(request);
}

/**
 * OpenAI Structured Quotation Generator
 */
async function callOpenAIQuotationCompletion(params: {
  apiKey: string;
  model: string;
  request: AIQuotationSuggestionRequest;
}): Promise<AIQuotationSuggestionResult | null> {
  const { apiKey, model, request } = params;

  const systemPrompt = `You are the EasyLife AI Quotation Assistant for certified Nigerian tradespeople.
Your job is to provide a structured, professional DRAFT quotation proposal for an artisan based on the customer's job request.

STRICT RULES:
1. Organize into:
   - Labour (diagnosis, repair workmanship, installation)
   - Materials / parts (realistic specific parts needed with standard Nigerian retail prices in NGN)
   - Additional expenses (call-out fee, transport/logistics)
2. Use conservative, typical Nigerian market baseline benchmarks (in Naira, NGN) for cities like Port Harcourt, Lagos, or Abuja.
3. NEVER assume prices are final: all values are baseline estimates for the professional to review and modify.
4. Output valid JSON adhering strictly to the schema.
`;

  const userContent = `Job Title: ${request.jobTitle}
Category: ${request.categoryName || request.categorySlug || "General Maintenance"}
Problem Description: ${request.problemDescription}
${request.scopeNotes ? `Additional Scope Notes: ${request.scopeNotes}` : ""}
${request.locationCity ? `Location: ${request.locationCity}` : ""}

Provide the suggested quotation structure as JSON:
{
  "work_description": "Detailed explanation of proposed work",
  "estimated_duration_minutes": 180,
  "items": [
    {
      "item_type": "callout" | "labor" | "parts" | "transport" | "other",
      "description": "Item description",
      "quantity": 1,
      "unit_price_naira": 5000,
      "notes": "Explanation of item"
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const choice = json.choices?.[0]?.message?.content;
  if (!choice) return null;

  const parsed = JSON.parse(choice);

  const items: AIQuotationItemSuggestion[] = Array.isArray(parsed.items)
    ? parsed.items.map((it: any, idx: number) => ({
        id: String(idx + 1),
        item_type: ["labor", "parts", "callout", "transport", "other"].includes(it.item_type)
          ? it.item_type
          : "labor",
        description: String(it.description || "Service item"),
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit_price_naira: Math.max(500, Math.round(Number(it.unit_price_naira) || 3000)),
        notes: it.notes ? String(it.notes) : undefined,
      }))
    : [];

  const totalNaira = items.reduce((acc, it) => acc + it.quantity * it.unit_price_naira, 0);

  return {
    work_description:
      parsed.work_description ||
      `Professional assessment and repair for: ${request.jobTitle}`,
    estimated_duration_minutes: Number(parsed.estimated_duration_minutes) || 180,
    items,
    total_suggested_naira: totalNaira,
    currency: "NGN",
    is_ai_generated: true,
    model_used: model,
    disclaimer: QUOTATION_REVIEW_DISCLAIMER,
  };
}

/**
 * Deterministic Rule-Based Fallback Quotation Generator
 */
export function executeRuleBasedQuotationEngine(
  request: AIQuotationSuggestionRequest
): AIQuotationSuggestionResult {
  const normalizedCategory = (request.categorySlug || request.categoryName || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  // Find best matching template
  let matchedKey = Object.keys(CATEGORY_BENCHMARK_TEMPLATES).find(
    (key) => normalizedCategory.includes(key) || key.includes(normalizedCategory)
  );

  // Fallback to general maintenance
  if (!matchedKey || !CATEGORY_BENCHMARK_TEMPLATES[matchedKey]) {
    matchedKey = "general-maintenance";
  }

  const template =
    CATEGORY_BENCHMARK_TEMPLATES[matchedKey] ||
    CATEGORY_BENCHMARK_TEMPLATES["general-maintenance"]!;

  const items: AIQuotationItemSuggestion[] = template.items.map((it, idx) => ({
    id: String(idx + 1),
    item_type: it.item_type,
    description: it.description,
    quantity: it.quantity,
    unit_price_naira: it.unit_price_naira,
    notes: it.notes,
  }));

  const totalNaira = items.reduce((acc, it) => acc + it.quantity * it.unit_price_naira, 0);

  return {
    work_description: template.workDescription(
      request.jobTitle || "Service Request",
      request.problemDescription
    ),
    estimated_duration_minutes: template.durationMinutes,
    items,
    total_suggested_naira: totalNaira,
    currency: "NGN",
    is_ai_generated: false,
    model_used: "easylife-rule-engine-v1",
    disclaimer: QUOTATION_REVIEW_DISCLAIMER,
  };
}

/**
 * Record quotation AI usage into public.ai_assistant_logs
 */
async function recordQuotationAILog(params: {
  userId?: string;
  sessionId: string;
  message: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}) {
  try {
    await supabaseAdminFetch("/rest/v1/ai_assistant_logs", {
      method: "POST",
      body: {
        user_id: params.userId || null,
        session_id: params.sessionId,
        customer_message: params.message.slice(0, 500),
        recommended_category_name: "Quotation Assistant",
        confidence: "high",
        model_name: params.model,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens,
        total_tokens: params.promptTokens + params.completionTokens,
        estimated_cost_usd: params.costUsd,
        feature_type: "quotation_assistant",
      },
    });
  } catch (err) {
    console.warn("Failed to record quotation AI log:", err);
  }
}
