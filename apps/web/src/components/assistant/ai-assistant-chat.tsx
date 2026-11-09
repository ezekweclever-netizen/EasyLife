"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendAssistantMessageAction } from "@/app/actions/ai-assistant";
import type {
  AIAssistantMessage,
  AIAssistantResponseData,
  AIAssistantStructuredRequest,
} from "@easylife/shared-types";

interface ServiceCategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface AIAssistantChatProps {
  initialCategories: ServiceCategoryOption[];
  userEmail?: string | null;
  userName?: string | null;
}

const STARTER_SUGGESTIONS = [
  "My generator starts normally but switches off after a few minutes.",
  "Water is leaking under my kitchen sink and soaking the wooden cabinet.",
  "My split AC is blowing warm air and the outdoor unit fan isn't spinning.",
  "My inverter is beeping continuously and the red fault light is on.",
  "The bathroom ceiling has damp water marks and paint is peeling off.",
];

export function AIAssistantChat({
  initialCategories,
  userEmail,
  userName,
}: AIAssistantChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your EasyLife AI Problem Assistant. Describe whatever is broken, leaking, beeping, or not working in your home or facility. I will help analyze the symptoms, recommend the accredited trade category, and format a service request for you to review.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [latestResponse, setLatestResponse] = useState<AIAssistantResponseData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorText, setErrorText] = useState<string | null>(null);

  // Edit Structured Request Modal State
  const [editingRequest, setEditingRequest] = useState<AIAssistantStructuredRequest | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [editUrgency, setEditUrgency] = useState<"normal" | "high" | "emergency">("normal");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestResponse, isPending]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isPending) return;

    setErrorText(null);
    setInputMessage("");

    const userMsg: AIAssistantMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    startTransition(async () => {
      const result = await sendAssistantMessageAction({
        sessionId,
        userMessage: text,
        conversationHistory: updatedHistory,
      });

      if (!result.ok) {
        setErrorText(result.message || "Failed to process message.");
        if (result.data) {
          setLatestResponse(result.data);
        }
        return;
      }

      if (result.data) {
        setLatestResponse(result.data);
        const assistantMsg: AIAssistantMessage = {
          role: "assistant",
          content: result.data.understandingSummary,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          structuredData: result.data,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Preset edit state
        if (result.data.structuredRequest) {
          setEditingRequest(result.data.structuredRequest);
          setEditTitle(result.data.structuredRequest.suggestedTitle);
          setEditDesc(result.data.structuredRequest.recommendedDescription);
          setEditCategorySlug(result.data.structuredRequest.categorySlug);
          setEditUrgency(result.data.structuredRequest.urgency);
        }
      }
    });
  };

  const handleContinueToBooking = (req?: AIAssistantStructuredRequest | null) => {
    const target = req || editingRequest || latestResponse?.structuredRequest;
    if (!target) {
      router.push("/book");
      return;
    }

    const query = new URLSearchParams({
      category: target.categoryId,
      title: target.suggestedTitle,
      description: target.recommendedDescription,
      urgency: target.urgency,
    });

    router.push(`/book?${query.toString()}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const matchedCat = initialCategories.find((c) => c.slug === editCategorySlug);
    const updated: AIAssistantStructuredRequest = {
      suggestedTitle: editTitle,
      categoryId: matchedCat?.id || editingRequest.categoryId,
      categoryName: matchedCat?.name || editingRequest.categoryName,
      categorySlug: editCategorySlug,
      urgency: editUrgency,
      recommendedDescription: editDesc,
    };

    setEditingRequest(updated);
    if (latestResponse) {
      setLatestResponse({
        ...latestResponse,
        structuredRequest: updated,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Advisory Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-800/40 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          EasyLife AI Problem Assistant
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Describe Your Problem in Everyday Language
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Tell us what happened in plain English or local context. Our AI identifies the likely trade category, asks targeted clarifying questions, and prepares a structured service request for you to review before booking.
        </p>

        <div className="pt-1 flex flex-wrap items-center gap-3 text-2xs text-teal-200">
          <span className="flex items-center gap-1">
            <span>🛡️</span> Zero Unconfirmed Bookings
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>⚙️</span> Validated Category Verification
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>🚫</span> No Dangerous DIY Instructions
          </span>
        </div>
      </div>

      {/* Starter Suggestions Carousel / Pills */}
      {messages.length === 1 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Common Fault Examples (Tap to Try)</span>
            <span className="text-teal-600 font-semibold">1-Click Quick Fill</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STARTER_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className="text-left px-3.5 py-2 rounded-xl text-xs bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition text-slate-700 leading-snug"
              >
                "{s}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Conversation & Assistant Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col min-h-[480px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[620px]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              } space-y-1.5`}
            >
              <div className="flex items-center gap-2 text-2xs text-slate-400 px-1">
                <span className="font-bold">
                  {msg.role === "user" ? userName || "You" : "EasyLife AI"}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-2xl px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-tr-xs shadow-xs"
                    : "bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60"
                }`}
              >
                {msg.content}
              </div>

              {/* Structured Output Card when Assistant responds */}
              {msg.role === "assistant" && msg.structuredData && (
                <div className="w-full max-w-2xl mt-3 space-y-3">
                  {/* Category Recommendation Pill */}
                  {msg.structuredData.categoryRecommendation && (
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xs font-extrabold uppercase tracking-wider text-teal-800">
                            Recommended Category
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-2xs font-black uppercase ${
                              msg.structuredData.categoryRecommendation.confidence === "high"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {msg.structuredData.categoryRecommendation.confidence} Confidence
                          </span>
                        </div>
                        <div className="text-base font-extrabold text-teal-950 mt-0.5">
                          {msg.structuredData.categoryRecommendation.categoryName}
                        </div>
                        <p className="text-2xs text-teal-800 mt-0.5">
                          {msg.structuredData.categoryRecommendation.reasoning}
                        </p>
                      </div>

                      <div className="shrink-0 text-2xs font-bold text-teal-700 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
                        Trade: {msg.structuredData.problemSummary.suggestedProfessionalType}
                      </div>
                    </div>
                  )}

                  {/* Problem Summary & Diagnosis Disclaimer */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">
                      Reported Symptoms Summary
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                      {msg.structuredData.problemSummary.reportedSymptoms.map((symp, sIdx) => (
                        <li key={sIdx}>{symp}</li>
                      ))}
                    </ul>

                    {/* Crucial Safety & Diagnosis Rule */}
                    <div className="mt-2 pt-2 border-t border-slate-200 text-2xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      ⚠️ <strong>Note on Diagnosis:</strong>{" "}
                      {msg.structuredData.problemSummary.potentialCausesDisclaimer}
                    </div>

                    {msg.structuredData.problemSummary.safetyNotice && (
                      <div className="text-2xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                        🛡️ {msg.structuredData.problemSummary.safetyNotice}
                      </div>
                    )}
                  </div>

                  {/* Clarifying Questions & Quick Reply Buttons */}
                  {msg.structuredData.clarifyingQuestions.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                      <div className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <span>❓ Clarifying Details for the Technician</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {msg.structuredData.clarifyingQuestions.map((q, qIdx) => (
                          <li key={qIdx} className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>

                      {msg.structuredData.suggestedQuickReplies.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-2xs text-slate-400 block mb-1.5 font-semibold">
                            Tap to reply:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.structuredData.suggestedQuickReplies.map((reply, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleSendMessage(reply)}
                                className="px-3 py-1.5 rounded-xl text-2xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 transition text-slate-700"
                              >
                                {reply}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Structured Service Request Card & Review/Confirm Action */}
                  {msg.structuredData.structuredRequest && (
                    <div className="bg-gradient-to-br from-white to-slate-50 border-2 border-teal-500 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            Ready-To-Review Service Request
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider ${
                            msg.structuredData.structuredRequest.urgency === "emergency"
                              ? "bg-rose-100 text-rose-800"
                              : msg.structuredData.structuredRequest.urgency === "high"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {msg.structuredData.structuredRequest.urgency} Urgency
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {editingRequest?.suggestedTitle ||
                            msg.structuredData.structuredRequest.suggestedTitle}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {editingRequest?.recommendedDescription ||
                            msg.structuredData.structuredRequest.recommendedDescription}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.structuredData?.structuredRequest) {
                              setEditingRequest(msg.structuredData.structuredRequest);
                              setEditTitle(msg.structuredData.structuredRequest.suggestedTitle);
                              setEditDesc(msg.structuredData.structuredRequest.recommendedDescription);
                              setEditCategorySlug(msg.structuredData.structuredRequest.categorySlug);
                              setEditUrgency(msg.structuredData.structuredRequest.urgency);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-2xs"
                        >
                          ✏️ Edit Request Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleContinueToBooking(
                              editingRequest || msg.structuredData?.structuredRequest
                            )
                          }
                          className="px-5 py-2 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-700 shadow-md transition flex items-center gap-1.5"
                        >
                          <span>Review &amp; Confirm Booking →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pending Typing Indicator */}
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl w-fit border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>Analyzing problem description and checking accredited trade categories...</span>
            </div>
          )}

          {errorText && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200 font-semibold">
              ⚠️ {errorText}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex-1 flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="E.g. My generator starts normally but switches off after a few minutes..."
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !inputMessage.trim()}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-40 shrink-0"
            >
              {isPending ? "Analyzing..." : "Send"}
            </button>
          </form>

          {/* Fallback Manual Category Selection Button */}
          <Link
            href="/explore-services"
            className="text-2xs font-bold text-slate-600 hover:text-teal-700 hover:underline px-2 py-1 shrink-0 self-start sm:self-center"
          >
            Prefer manual selection? Browse Categories →
          </Link>
        </div>
      </div>

      {/* Edit Request Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>✏️ Customise Service Request Details</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Job Request Title *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Service Category *
                </label>
                <select
                  value={editCategorySlug}
                  onChange={(e) => setEditCategorySlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                >
                  {initialCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Urgency Level *
                </label>
                <select
                  value={editUrgency}
                  onChange={(e) => setEditUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                >
                  <option value="normal">Normal (Within 24-48 hours)</option>
                  <option value="high">High (Same day)</option>
                  <option value="emergency">Emergency (Immediate dispatch)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Problem Description &amp; Location Details *
              </label>
              <textarea
                required
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close Without Saving
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveEdit({ preventDefault: () => {} } as any);
                    handleContinueToBooking();
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
                >
                  Save &amp; Continue to Booking →
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
