"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBookingAction,
  getMatchingProfessionalsAction,
} from "@/app/actions/booking";
import { uploadFileAction } from "@/app/actions/storage";
import { sendAssistantMessageAction } from "@/app/actions/ai-assistant";
import { Icon } from "@/components/site/icons";
import type {
  ServiceCategoryItem,
  PublicProfessionalItem,
} from "@/lib/supabase/customer";
import type { CatalogueServiceItem } from "@easylife/shared-types";
import type { AIAssistantResponseData } from "@easylife/shared-types";

export interface PostANeedWizardProps {
  categories: ServiceCategoryItem[];
  initialCategory?: string;
  initialSubcategory?: string;
  initialService?: CatalogueServiceItem | null;
  initialPro?: PublicProfessionalItem | null;
  initialCity?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialUrgency?: "normal" | "high" | "emergency";
  user: {
    id: string;
    email?: string;
    fullName?: string;
  } | null;
  preloadedPros?: PublicProfessionalItem[];
}

const PILOT_CITIES_CONFIG = [
  {
    name: "Port Harcourt",
    state: "Rivers State",
    districts: [
      "Obio-Akpor (GRA Phase 1-3, Woji, Rumuola, Choba)",
      "Port Harcourt City (Old GRA, D-Line, Borokiri, Town)",
      "Peter Odili & Trans-Amadi Corridor",
      "Eleme & Petrochemical Area",
      "Oyigbo & Environs",
      "Other Port Harcourt Area",
    ],
  },
  {
    name: "Lagos",
    state: "Lagos State",
    districts: [
      "Eti-Osa (Lekki Phase 1, Victoria Island, Ikoyi, Chevron)",
      "Ikeja (GRA, Maryland, Allen, Opebi)",
      "Surulere & Bode Thomas",
      "Yaba & Lagos Mainland (Akoka, Ebute Metta)",
      "Alimosho (Egbeda, Ipaja)",
      "Other Lagos Area",
    ],
  },
  {
    name: "Abuja",
    state: "Federal Capital Territory",
    districts: [
      "Abuja Municipal (Maitama, Wuse 2, Garki, Asokoro)",
      "Guzape, Jabi & Utako",
      "Bwari (Kubwa, Bwari Town)",
      "Gwagwalada & Lugbe (Airport Road)",
      "Other FCT Area",
    ],
  },
];

export function PostANeedWizard({
  categories,
  initialCategory,
  initialSubcategory,
  initialService,
  initialPro,
  initialCity = "Port Harcourt",
  initialTitle = "",
  initialDescription = "",
  initialUrgency = "normal",
  user,
  preloadedPros = [],
}: PostANeedWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [categoryId, setCategoryId] = useState(
    initialCategory || (categories[0]?.id || "")
  );
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategory || "");
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [urgency, setUrgency] = useState<"normal" | "high" | "emergency">(
    initialUrgency
  );

  // Pilot Location State
  const [city, setCity] = useState(initialCity);
  const [neighbourhood, setNeighbourhood] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");

  // Timing State
  const [preferredDate, setPreferredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(
    "Morning (8:00 AM – 12:00 PM)"
  );

  // Budget & Preferences
  const [targetBudgetNaira, setTargetBudgetNaira] = useState("");
  const [contactPreference, setContactPreference] = useState<
    "in_app" | "whatsapp" | "phone"
  >("in_app");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Direct Pro Selection
  const [selectedPro, setSelectedPro] = useState<PublicProfessionalItem | null>(
    initialPro || null
  );
  const [matchingPros, setMatchingPros] =
    useState<PublicProfessionalItem[]>(preloadedPros);
  const [loadingPros, setLoadingPros] = useState(false);

  // Attachments State
  const [attachments, setAttachments] = useState<
    Array<{ name: string; size: number; type: string; file: File }>
  >([]);

  // AI Assistant Diagnostics State
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `need_session_${Date.now()}`
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAssistantResponseData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasAppliedAiCategory, setHasAppliedAiCategory] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    referenceCode: string;
  } | null>(null);

  // Inline Auth State (when user is unauthenticated)
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Resolve current active city config
  const currentCityConfig =
    PILOT_CITIES_CONFIG.find((c) => c.name === city) || PILOT_CITIES_CONFIG[0]!;

  // Refresh matching professionals when city or category changes
  useEffect(() => {
    let active = true;
    async function loadPros() {
      setLoadingPros(true);
      try {
        const pros = await getMatchingProfessionalsAction({
          city,
          categoryId: categoryId || undefined,
          limit: 4,
        });
        if (active) {
          setMatchingPros(pros);
        }
      } catch (err) {
        console.warn("Could not load matching pros:", err);
      } finally {
        if (active) setLoadingPros(false);
      }
    }
    loadPros();
    return () => {
      active = false;
    };
  }, [city, categoryId]);

  // Handle AI Problem Diagnosis
  const handleAnalyzeWithAI = async () => {
    if (!description.trim() || description.trim().length < 8) {
      setFieldErrors((prev) => ({
        ...prev,
        description:
          "Please type a few more words about your problem first so the AI can diagnose it.",
      }));
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.description;
      return next;
    });

    setIsAiAnalyzing(true);
    setAiError(null);

    try {
      const res = await sendAssistantMessageAction({
        sessionId,
        userMessage: description.trim(),
      });

      if (res.ok && res.data) {
        setAiResult(res.data);

        // Auto-generate a concise, professional title if title is currently empty
        if (!title) {
          const recName = res.data.categoryRecommendation?.categoryName;
          const proType = res.data.problemSummary?.suggestedProfessionalType;
          if (recName) {
            setTitle(`${recName} Repair & Service Request`);
          } else if (proType) {
            setTitle(`${proType} Service Needed`);
          } else if (res.data.understandingSummary) {
            const cleaned = res.data.understandingSummary
              .replace(/^I understand that you have a(?:n)?\s*/i, "")
              .replace(/^Thank you for explaining.*?\.\s*/i, "")
              .trim();
            const firstSentence = cleaned.split(".")[0] || cleaned;
            setTitle(firstSentence.slice(0, 65));
          }
        }

        // Check if a category was recommended
        if (res.data.categoryRecommendation?.categoryId) {
          const matched = categories.find(
            (c) =>
              c.id === res.data?.categoryRecommendation?.categoryId ||
              c.slug === res.data?.categoryRecommendation?.categorySlug
          );
          if (matched) {
            setCategoryId(matched.id);
            setHasAppliedAiCategory(true);
          }
        }
      } else {
        setAiError(
          res.message ||
            "AI assistant was temporarily unable to parse this request. You can select your category manually below."
        );
      }
    } catch (err) {
      setAiError(
        "Could not connect to AI diagnostic engine. Please proceed by selecting your service category below."
      );
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // File Upload Handler (JPEG, PNG, WebP, PDF up to 8MB each, max 5 files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSubmissionError(null);
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);
    const maxBytes = 8 * 1024 * 1024;
    const files = Array.from(e.target.files);
    const rejected: string[] = [];
    const valid = files
      .filter((f) => {
        const mime = (f.type || "").toLowerCase();
        const ext = f.name.toLowerCase().split(".").pop() || "";
        const validExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);
        if (
          (!allowedTypes.has(mime) && !validExt) ||
          f.size <= 0 ||
          f.size > maxBytes
        ) {
          rejected.push(f.name);
          return false;
        }
        return true;
      })
      .slice(0, 5)
      .map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
      }));

    if (rejected.length > 0) {
      setSubmissionError(
        `Skipped invalid or oversized file(s): ${rejected.join(
          ", "
        )}. Only JPEG, PNG, WebP, or PDF up to 8MB are supported.`
      );
    }

    setAttachments((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Validations
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!categoryId) {
      errs.categoryId = "Please choose a service category or select 'Other Custom Need'.";
    }
    if (!title.trim() || title.trim().length < 5) {
      errs.title = "Please provide a brief title (at least 5 characters).";
    }
    if (!description.trim() || description.trim().length < 15) {
      errs.description =
        "Please describe your problem or need in at least 15 characters so professionals understand the scope.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!serviceAddress.trim() || serviceAddress.trim().length < 5) {
      errs.serviceAddress =
        "Please enter your full property street address or estate name with landmark.";
    }
    if (!preferredDate) {
      errs.preferredDate = "Please choose a preferred service date.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
    }
  };

  // Final Submission
  const handleSubmit = async () => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    // 1. Upload Attachments if any
    const uploadedAttachments: Array<{
      storage_bucket: string;
      storage_path: string;
      file_name: string;
      mime_type: string;
      file_size_bytes: number;
    }> = [];

    for (const item of attachments) {
      const uploadForm = new FormData();
      uploadForm.append("file", item.file);
      uploadForm.append("bucketId", "booking-attachments");
      const upRes = await uploadFileAction(uploadForm);
      if (!upRes.success || !upRes.path) {
        setSubmissionError(
          upRes.error || `Failed to upload attachment "${item.name}".`
        );
        setIsSubmitting(false);
        return;
      }
      uploadedAttachments.push({
        storage_bucket: "booking-attachments",
        storage_path: upRes.path,
        file_name: item.name,
        mime_type: item.type || "application/octet-stream",
        file_size_bytes: item.size,
      });
    }

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append("categoryId", categoryId || "");
    if (subcategoryId) {
      formData.append("subcategoryId", subcategoryId);
    }
    if (initialService?.id) {
      formData.append("serviceId", initialService.id);
    }
    formData.append("title", title || "");
    formData.append("description", description || "");
    formData.append("urgency", urgency || "normal");
    formData.append("city", city || "Port Harcourt");
    formData.append("lgaOrDistrict", neighbourhood || "");
    formData.append("neighbourhood", neighbourhood || "");
    formData.append("serviceAddress", serviceAddress || "");
    formData.append("preferredDate", preferredDate || "");
    formData.append("preferredTimeSlot", preferredTimeSlot || "");
    formData.append("additionalInstructions", additionalInstructions.trim());
    formData.append("contactPreference", contactPreference);

    if (targetBudgetNaira.trim()) {
      formData.append("budgetEstimateNaira", targetBudgetNaira.trim());
    }

    if (uploadedAttachments.length > 0) {
      formData.append("attachmentsJson", JSON.stringify(uploadedAttachments));
    }

    if (selectedPro?.professional_id) {
      formData.append("professionalId", selectedPro.professional_id);
    }

    // AI Metadata
    if (aiResult?.categoryRecommendation?.categoryId) {
      formData.append(
        "aiSuggestedCategoryId",
        aiResult.categoryRecommendation.categoryId
      );
    }
    if (aiResult) {
      formData.append("aiCategorizationMeta", JSON.stringify(aiResult));
    }

    try {
      const result = await createBookingAction(
        { status: "idle", message: "" },
        formData
      );

      if (
        result.status === "success" &&
        result.bookingId &&
        result.referenceCode
      ) {
        setCreatedBooking({
          id: result.bookingId,
          referenceCode: result.referenceCode,
        });
      } else {
        setSubmissionError(result.message || "Failed to submit request.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CONFIRMATION SCREEN
  // ==========================================
  if (createdBooking) {
    const selectedCategoryObj = categories.find((c) => c.id === categoryId);

    return (
      <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 sm:p-10 shadow-xl space-y-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-[#5CD3D5] mx-auto flex items-center justify-center text-4xl shadow-inner border border-teal-100 dark:border-teal-800">
          ✓
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-[#5CD3D5] border border-teal-200 dark:border-teal-800">
            Request Successfully Broadcast
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Your Need Has Been Posted!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Accredited professionals in {city} have been notified. You will
            receive itemized quotations with breakdown of labour and materials
            shortly.
          </p>
        </div>

        {/* Reference Number Box */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-slate-800 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Booking Reference Code</span>
            <span className="font-semibold text-[#0F766E] dark:text-[#5CD3D5]">
              Save this reference
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#0F766E] dark:text-[#5CD3D5] tracking-wider">
              {createdBooking.referenceCode}
            </span>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(createdBooking.referenceCode)
              }
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-[#0D223A] text-slate-700 dark:text-slate-200 transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* Next Steps Timeline */}
        <div className="text-left space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            What happens next:
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Technicians Review & Quote
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Verified pros review your fault description and submit
                  itemized estimates.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Compare & Accept Quote
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Inspect the parts and labour breakdown, compare ratings, and
                  choose your professional.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Protected Escrow & Job Sign-Off
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Funds are secured in escrow and only released after the technician completes the work and you inspect it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/bookings/${createdBooking.id}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm"
          >
            View Request & Track Quotations &rarr;
          </Link>
          <Link
            href="/bookings"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            My Bookings History
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROGRESS WIZARD SHELL
  // ==========================================
  return (
    <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Wizard Progress Bar */}
      <div className="bg-slate-50 dark:bg-[#071526] border-b border-slate-200/80 dark:border-[#163654] px-6 py-4">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {[
            { num: 1, label: "Problem & AI" },
            { num: 2, label: "Fault Photos" },
            { num: 3, label: "Location & Schedule" },
            { num: 4, label: "Review & Broadcast" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num as any)}
                  disabled={s.num > step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step === s.num
                      ? "bg-[#0F766E] text-white shadow-xs"
                      : step > s.num
                      ? "bg-[#CCFBF1] text-[#0F766E] dark:bg-teal-950 dark:text-teal-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </button>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${
                    step > s.num
                      ? "bg-[#0F766E]"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs sm:text-sm flex items-start gap-2">
            <span className="shrink-0 text-base">⚠️</span>
            <span>{submissionError}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: NATURAL LANGUAGE PROBLEM & AI DIAGNOSIS
        ======================================================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Step 1 of 4: Describe Your Problem in Plain English
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Tell us what needs fixing or doing
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                You don't need to know technical terms or trade classifications. Describe what's happening and our AI will identify the right service and specialist.
              </p>
            </div>

            {/* Problem Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="problem-description"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Problem or Repair Description <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">
                  {description.length} / 1000
                </span>
              </div>
              <textarea
                id="problem-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. My distribution box keeps tripping whenever the living room AC turns on. I also smell a faint electrical burn near the changeover switch..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {/* AI Diagnosis Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E] dark:text-[#5CD3D5]">
                  <Icon name="sparkles" className="w-4 h-4 text-amber-500" />
                  <span>AI Problem Diagnosis &amp; Scoping</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  Let EasyLife AI analyze your fault, recommend categories, and check for missing details.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={isAiAnalyzing || !description.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#0F766E] text-white hover:bg-[#0D655E] disabled:opacity-50 transition-all shrink-0 shadow-xs"
              >
                {isAiAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Fault...</span>
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Analyze with AI</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                {aiError}
              </p>
            )}

            {/* AI Diagnosis Results Card */}
            {aiResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#071526] border border-teal-300 dark:border-teal-800/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-[#0D9488]">
                      <Icon name="sparkles" className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      AI Diagnostic Insights
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#0F766E] dark:text-[#5CD3D5]">
                    OpenAI Analysis
                  </span>
                </div>

                {/* Problem Summary */}
                {aiResult.understandingSummary && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Problem Summary:
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {aiResult.understandingSummary}
                    </p>
                  </div>
                )}

                {/* Recommended Category */}
                {aiResult.categoryRecommendation && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Recommended Trade Category
                      </span>
                      <p className="text-sm font-bold text-[#0F766E] dark:text-[#5CD3D5] mt-0.5">
                        {aiResult.categoryRecommendation.categoryName}
                      </p>
                    </div>
                    {hasAppliedAiCategory ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>✓ Category Applied</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const matched = categories.find(
                            (c) =>
                              c.id ===
                                aiResult.categoryRecommendation?.categoryId ||
                              c.slug ===
                                aiResult.categoryRecommendation?.categorySlug
                          );
                          if (matched) {
                            setCategoryId(matched.id);
                            setHasAppliedAiCategory(true);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] transition"
                      >
                        Apply Recommended Category
                      </button>
                    )}
                  </div>
                )}

                {/* Clarifying Questions / Missing Details */}
                {aiResult.clarifyingQuestions &&
                  aiResult.clarifyingQuestions.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Helpful Details to Note in Your Description:
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                        {aiResult.clarifyingQuestions.map((q, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Mandatory AI Disclaimer */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Disclaimer: EasyLife AI provides preliminary diagnostic
                    categorization and scoping. On-site technical inspection by an
                    accredited tradesperson is required for final diagnosis and
                    itemized quotations.
                  </p>
                </div>
              </div>
            )}

            {/* Title / Summary Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="need-title"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Brief Title / Need Summary <span className="text-red-500">*</span>
              </label>
              <input
                id="need-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Electrical trip & inverter bypass repair"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Category Override Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="need-category"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Service Category <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manual Override Available
                </span>
              </div>
              <select
                id="need-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setHasAppliedAiCategory(false);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.categoryId}
                </p>
              )}
            </div>

            {/* Matched Verified Professionals Preview */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Verified Professionals Ready in {city}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Vetted Trades
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {matchingPros.length} available
                </span>
              </div>

              {/* Pro Matching Radio Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Broadcast Option */}
                <div
                  onClick={() => setSelectedPro(null)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPro === null
                      ? "border-[#0F766E] bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-[#0F766E]"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-[#071526]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Broadcast to All Verified Pros
                    </span>
                    <span className="text-[10px] font-bold text-[#0F766E] dark:text-[#5CD3D5]">
                      Fastest Quotes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Your request is sent to all verified trade specialists in your area to submit competitive quotes.
                  </p>
                </div>

                {/* Specific Pro Options */}
                {matchingPros.slice(0, 3).map((pro) => (
                  <div
                    key={pro.professional_id}
                    onClick={() => setSelectedPro(pro)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedPro?.professional_id === pro.professional_id
                        ? "border-[#0F766E] bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-[#0F766E]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-[#071526]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-[10px]">
                          {pro.display_name ? pro.display_name[0] : "P"}
                        </div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {pro.business_name || pro.display_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ★ {pro.average_rating ? pro.average_rating.toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {pro.completed_jobs_count || 0} completed jobs • {pro.primary_city || city}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Step CTA */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Next: Attach Photos</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: MEDIA & ATTACHMENTS
        ======================================================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Step 2 of 4: Fault Photos &amp; Documents
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Upload photos of what needs fixing
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Technicians provide significantly more accurate, itemized quotations when they can inspect clear photos of the fault or appliance model label.
              </p>
            </div>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 dark:bg-[#071526]/50 hover:bg-slate-50 dark:hover:bg-[#071526] transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 text-[#0F766E] dark:text-[#5CD3D5] text-2xl mx-auto flex items-center justify-center shadow-inner">
                📷
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Drag and drop fault photographs or device labels
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports JPEG, PNG, WebP, and PDF (Up to 5 files, 8MB each)
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] cursor-pointer transition-colors shadow-xs">
                <span>Browse Files from Device</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Grid */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Attached Media ({attachments.length} / 5)
                </span>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#071526] border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">
                          {file.type === "application/pdf" ? "📄" : "🖼️"}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </span>
                        <span className="text-slate-400 shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 font-semibold text-xs ml-3 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Next: Location &amp; Schedule</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: LOCATION, SCHEDULE, BUDGET & PREFERENCES
        ======================================================== */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Step 3 of 4: Service Location &amp; Preferred Timing
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Where and when should the pro arrive?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Operating in Port Harcourt, Lagos, and Abuja. Select your neighbourhood and preferred time slot.
              </p>
            </div>

            {/* City Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="city-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Pilot City <span className="text-red-500">*</span>
                </label>
                <select
                  id="city-select"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setNeighbourhood("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  {PILOT_CITIES_CONFIG.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* LGA / District Selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="district-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Neighbourhood / District
                </label>
                <select
                  id="district-select"
                  value={neighbourhood}
                  onChange={(e) => setNeighbourhood(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Select Operating Neighbourhood</option>
                  {currentCityConfig.districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Physical Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="street-address"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Street Address, Flat / House Number &amp; Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="street-address"
                type="text"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="e.g. Flat 3B, Plot 14 Peter Odili Road, Opposite Total Filling Station"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              {fieldErrors.serviceAddress && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.serviceAddress}
                </p>
              )}
            </div>

            {/* Date & Preferred Arrival Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="pref-date"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="pref-date"
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
                {fieldErrors.preferredDate && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {fieldErrors.preferredDate}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="time-slot"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Preferred Arrival Slot
                </label>
                <select
                  id="time-slot"
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="Morning (8:00 AM – 12:00 PM)">
                    Morning (8:00 AM – 12:00 PM)
                  </option>
                  <option value="Afternoon (12:00 PM – 4:00 PM)">
                    Afternoon (12:00 PM – 4:00 PM)
                  </option>
                  <option value="Evening (4:00 PM – 7:00 PM)">
                    Evening (4:00 PM – 7:00 PM)
                  </option>
                  <option value="Emergency (Immediate 2-Hour Response)">
                    Emergency (Immediate 2-Hour Response)
                  </option>
                </select>
              </div>
            </div>

            {/* Urgency Level Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Urgency Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "normal",
                    label: "Standard",
                    desc: "Within scheduled date/time",
                    badge: "Regular",
                  },
                  {
                    id: "high",
                    label: "Urgent",
                    desc: "Priority same-day dispatch",
                    badge: "Same Day",
                  },
                  {
                    id: "emergency",
                    label: "Emergency",
                    desc: "🚨 Immediate 2-hour dispatch",
                    badge: "24/7 Priority",
                  },
                ].map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrgency(u.id as any)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      urgency === u.id
                        ? "border-[#0F766E] bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-[#0F766E]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-[#071526]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {u.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#0F766E] dark:text-[#5CD3D5]">
                        {u.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {u.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Budget & Contact Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="budget-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Target Budget (₦ Naira) — Optional
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-400">
                    ₦
                  </span>
                  <input
                    id="budget-input"
                    type="text"
                    value={targetBudgetNaira}
                    onChange={(e) => setTargetBudgetNaira(e.target.value)}
                    placeholder="e.g. 25,000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Leave blank if you prefer technicians to submit unrestricted quotes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-pref"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Contact Preference
                </label>
                <select
                  id="contact-pref"
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="in_app">In-App Chat &amp; Notification (Default)</option>
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="phone">Direct Phone Call</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Next: Review &amp; Broadcast</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: REVIEW & BROADCAST REQUEST
        ======================================================== */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                Step 4 of 4: Review &amp; Broadcast Request
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Verify your need details before broadcasting
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Verified trade professionals in {city} will receive your request and prepare itemized quotes.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    Trade Category
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {categories.find((c) => c.id === categoryId)?.name ||
                      "General Maintenance"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    Urgency
                  </span>
                  <span className="font-bold capitalize text-[#0F766E] dark:text-[#5CD3D5]">
                    {urgency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    Preferred Schedule
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {preferredDate} — {preferredTimeSlot}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    Service Location
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {city} {neighbourhood ? `(${neighbourhood})` : ""}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">
                  Summary Title
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {title}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">
                  Problem Description
                </span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line bg-white dark:bg-[#0D223A] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mt-1">
                  {description}
                </p>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">
                  Address &amp; Landmark
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {serviceAddress}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                {targetBudgetNaira && (
                  <div>
                    <span className="text-slate-400 block">Target Budget</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₦{Number(targetBudgetNaira.replace(/[^0-9.]/g, "")).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block">Contact Method</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {contactPreference === "in_app" ? "In-App Chat" : contactPreference}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dispatch Mode</span>
                  <span className="font-bold text-[#0F766E] dark:text-[#5CD3D5]">
                    {selectedPro
                      ? `Direct to ${selectedPro.business_name || selectedPro.display_name}`
                      : `Broadcast to all verified ${city} pros`}
                  </span>
                </div>
                {attachments.length > 0 && (
                  <div>
                    <span className="text-slate-400 block">Attached Media</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {attachments.length} file(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Zero Upfront Risk & Escrow Guarantee */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 text-xs text-[#0F766E] dark:text-[#5CD3D5] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️ Zero Upfront Risk &amp; Escrow Guarantee</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Submitting this request is 100% free with zero upfront charges. Accredited professionals will review your request and send itemized quotations. Funds are deposited into protected EasyLife escrow only when you approve a quotation, and released upon your final inspection.
              </p>
            </div>

            {/* Unauthenticated Inline Auth Gate */}
            {!user && (
              <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Sign in or create an account to broadcast your need
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Your draft is saved! Please sign in or register to connect with accredited technicians and receive quotations directly in your dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={`/login?next=${encodeURIComponent("/post-a-need")}`}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0F766E] text-white hover:bg-[#0D655E] transition shadow-xs"
                  >
                    Log In to Existing Account
                  </Link>
                  <Link
                    href={`/register?next=${encodeURIComponent("/post-a-need")}`}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#0D223A] text-slate-800 dark:text-slate-100 hover:bg-slate-50 transition"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={isSubmitting}
              >
                &larr; Back
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting to Dispatch...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Broadcast Need ✓</span>
                  )}
                </button>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent("/post-a-need")}`}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-md flex items-center gap-2"
                >
                  <span>Log In to Broadcast &rarr;</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
