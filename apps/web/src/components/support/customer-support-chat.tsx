"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { sendCustomerSupportMessageAction } from "@/app/actions/ai-support";
import type { SupportEngineResult } from "@/lib/ai/support-engine";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: SupportEngineResult;
  timestamp: string;
}

const TOPIC_PRESETS = [
  { label: "📝 Registration", query: "How do I register and verify my account on EasyLife?" },
  { label: "🛠️ Booking", query: "How do I find and book an accredited professional?" },
  { label: "🛡️ Verification", query: "What background checks and badges do EasyLife professionals have?" },
  { label: "💰 Quotation & Escrow", query: "How does quotation review and secure escrow payment work?" },
  { label: "⏰ Completion PIN", query: "How does the 4-digit job completion PIN protect my funds?" },
  { label: "⚖️ Dispute Reporting", query: "How do I report incomplete work or poor workmanship?" },
  { label: "👤 Account & Security", query: "How do I manage my profile, notifications, and security settings?" },
  { label: "🚨 Speak to Human", query: "I have an urgent problem and need to escalate to a human support agent." },
];

export function CustomerSupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! I am the EasyLife AI Customer Support Specialist. I can answer questions about registration, booking procedures, professional verification, quotation acceptance, appointment management, dispute reporting, and account security. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sessionId] = useState(() => `sup-sess-${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isPending) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");

    startTransition(async () => {
      const history = messages
        .filter((m) => m.id !== "initial")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendCustomerSupportMessageAction({
        userMessage: text,
        conversationHistory: history,
        sessionId,
      });

      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          content: res.data.reply,
          result: res.data,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          content:
            res.error ||
            "We encountered a temporary connection issue. If this is urgent, please email support@easylife.ng directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px] max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold text-lg">
            ✨
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              EasyLife AI Customer Support
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Knowledge
              </span>
            </h2>
            <p className="text-xs text-teal-100/80">
              Instant answers on bookings, payments, escrow &amp; disputes. 24/7 human escalation available.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Topics Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Topics:
        </span>
        {TOPIC_PRESETS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => handleSend(t.query)}
            disabled={isPending}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-xs font-medium whitespace-nowrap shadow-2xs transition disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isEscalated = msg.result?.is_escalated;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? "bg-[#0D9488] text-white rounded-tr-xs"
                    : isEscalated
                    ? "bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-tl-xs"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                }`}
              >
                {/* Escalation Alert Badge */}
                {isEscalated && (
                  <div className="mb-2.5 pb-2 border-b border-amber-200 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider">
                      🚨 Case Escalated to Human Support
                    </span>
                    {msg.result?.ticket_ref && (
                      <span className="font-mono text-xs font-bold text-amber-900">
                        {msg.result.ticket_ref}
                      </span>
                    )}
                  </div>
                )}

                {/* Body Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Suggested Questions */}
                {!isUser && msg.result?.suggested_questions && msg.result.suggested_questions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Suggested follow-ups:
                    </span>
                    {msg.result.suggested_questions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q)}
                        disabled={isPending}
                        className="text-left text-xs text-teal-700 hover:text-teal-900 hover:underline font-medium flex items-center gap-1.5"
                      >
                        <span>→</span>
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    isUser ? "text-teal-100" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
            <span>Consulting EasyLife knowledge base...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question or describe your issue (e.g. How does escrow work?)..."
          disabled={isPending}
          className="flex-1 h-11 px-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isPending}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#0D9488] to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <span>Send</span>
          <span>→</span>
        </button>
      </form>
    </div>
  );
}
