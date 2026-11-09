"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConversationSummary, ConversationDetail, MessageItem } from "@/lib/supabase/messages";
import { sendMessageAction, markConversationReadAction } from "@/app/actions/messages";

interface ChatClientProps {
  currentUserId: string;
  initialConversations: ConversationSummary[];
  activeConversation: ConversationDetail | null;
  basePath: "/messages" | "/pro/messages";
}

export function ChatClient({
  currentUserId,
  initialConversations,
  activeConversation,
  basePath,
}: ChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(activeConversation);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConv?.messages]);

  // When activeConversation changes from server
  useEffect(() => {
    if (activeConversation) {
      setSelectedConv(activeConversation);
      // Mark as read
      if (activeConversation.unread_count > 0) {
        markConversationReadAction(activeConversation.id);
      }
    }
  }, [activeConversation]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const otherName = c.other_party?.full_name?.toLowerCase() || "";
    const bizName = c.other_party?.business_name?.toLowerCase() || "";
    const ref = c.booking_reference?.toLowerCase() || "";
    const subj = c.subject?.toLowerCase() || "";
    const cat = c.category_name?.toLowerCase() || "";
    return otherName.includes(q) || bizName.includes(q) || ref.includes(q) || subj.includes(q) || cat.includes(q);
  });

  const handleSelectConversation = (convId: string) => {
    setErrorMsg(null);
    router.push(`${basePath}?conversationId=${convId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8388608) {
      setErrorMsg("File size exceeds 8 MB limit.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Allowed formats: JPEG, PNG, WebP or PDF.");
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv) return;
    if (!messageText.trim() && !selectedFile) return;

    setErrorMsg(null);
    const textToSend = messageText.trim();
    const fileToSend = selectedFile;

    // Clear composer
    setMessageText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Optimistic message
    const tempId = "temp-" + Date.now();
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversation_id: selectedConv.id,
      sender_id: currentUserId,
      message_type: fileToSend ? "attachment" : "text",
      body: textToSend || (fileToSend ? `Attached: ${fileToSend.name}` : ""),
      attachment_storage_path: fileToSend ? URL.createObjectURL(fileToSend) : null,
      attachment_name: fileToSend?.name || null,
      attachment_mime_type: fileToSend?.type || null,
      attachment_size_bytes: fileToSend?.size || null,
      delivery_status: "sending",
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSelectedConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, optimisticMsg],
          }
        : null
    );

    const formData = new FormData();
    formData.append("conversationId", selectedConv.id);
    formData.append("body", textToSend);
    if (fileToSend) {
      formData.append("messageType", "attachment");
      formData.append("attachmentName", fileToSend.name);
      formData.append("attachmentMimeType", fileToSend.type);
      formData.append("attachmentSizeBytes", String(fileToSend.size));
      formData.append("attachmentPath", `messages/${selectedConv.id}/${Date.now()}_${fileToSend.name}`);
    }

    startTransition(async () => {
      const res = await sendMessageAction({ status: "idle", message: "" }, formData);
      if (res.status === "error") {
        setErrorMsg(res.message);
        // Remove optimistic message
        setSelectedConv((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== tempId),
              }
            : null
        );
      } else {
        router.refresh();
      }
    });
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatListDate = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
      {/* Thread List Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E2E8F0] bg-[#F8FAFC] flex flex-col">
        {/* Search header */}
        <div className="p-4 border-b border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <span>Conversations</span>
            <span>{filteredConversations.length} Active</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats, reference, pro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-8 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <svg
              className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] max-h-[520px]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#E2E8F0] text-[#64748B] mx-auto flex items-center justify-center text-sm font-bold">
                💬
              </div>
              <p className="text-xs font-bold text-[#0F172A]">No conversations yet</p>
              <p className="text-[11px] text-[#64748B]">
                Messages related to your bookings and quotes will appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              const partyName =
                c.other_party?.business_name || c.other_party?.full_name || "EasyLife Support";

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1.5 ${
                    isSelected
                      ? "bg-teal-50/70 border-l-4 border-l-[#0F766E]"
                      : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#0F172A] truncate flex items-center gap-1.5">
                      {c.other_party?.is_verified && (
                        <span className="text-teal-600 font-extrabold text-[11px]" title="Verified Specialist">
                          ✓
                        </span>
                      )}
                      {partyName}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] shrink-0 font-medium">
                      {formatListDate(c.last_message_at)}
                    </span>
                  </div>

                  {c.booking_reference && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E2E8F0] text-[#475569]">
                        #{c.booking_reference}
                      </span>
                      {c.category_name && (
                        <span className="text-[10px] text-[#64748B] font-medium truncate">
                          {c.category_name}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <p className="text-xs text-[#64748B] line-clamp-1 flex-1">
                      {c.last_message ? (
                        <>
                          {c.last_message.sender_id === currentUserId && (
                            <span className="text-[#94A3B8] font-medium mr-1">You:</span>
                          )}
                          {c.last_message.body}
                        </>
                      ) : (
                        <span className="italic text-[#94A3B8]">Thread opened</span>
                      )}
                    </p>

                    {c.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#0F766E] text-white font-extrabold text-[10px] shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col justify-between min-h-[500px]">
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F766E] to-teal-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {(
                    selectedConv.other_party?.business_name ||
                    selectedConv.other_party?.full_name ||
                    "EL"
                  ).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#0F172A] truncate">
                      {selectedConv.other_party?.business_name ||
                        selectedConv.other_party?.full_name ||
                        "EasyLife Support"}
                    </h2>
                    {selectedConv.other_party?.is_verified && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {selectedConv.booking_reference
                      ? `Booking #${selectedConv.booking_reference} • ${selectedConv.category_name || "Service"}`
                      : selectedConv.subject || "Direct Conversation"}
                  </p>
                </div>
              </div>

              {selectedConv.booking_id && (
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={
                      basePath === "/pro/messages"
                        ? `/pro/jobs/${selectedConv.booking_id}`
                        : `/bookings/${selectedConv.booking_id}`
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] hover:bg-slate-50 text-[11px] font-bold text-[#0F766E] transition"
                  >
                    View Booking Details →
                  </Link>
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {errorMsg}
                </div>
              )}

              {selectedConv.messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs font-bold text-[#64748B]">No messages in this conversation yet</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Send a message below to clarify repair details, site arrival, or parts costs.
                  </p>
                </div>
              ) : (
                selectedConv.messages.map((m) => {
                  const isMine = m.sender_id === currentUserId;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"} space-y-1`}
                    >
                      <div
                        className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm space-y-2 shadow-xs ${
                          isMine
                            ? "bg-[#0F766E] text-white rounded-br-none"
                            : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-none"
                        }`}
                      >
                        {/* Body */}
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>

                        {/* Attachment display if present */}
                        {m.attachment_storage_path && (
                          <div
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-3 ${
                              isMine
                                ? "bg-teal-800/40 border-teal-600 text-teal-100"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <span className="text-lg">📎</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate text-[11px]">
                                {m.attachment_name || "Attachment File"}
                              </p>
                              {m.attachment_size_bytes && (
                                <p className="text-[10px] opacity-80">
                                  {(m.attachment_size_bytes / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] font-bold underline cursor-pointer">
                              View
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Message meta: time and delivery status */}
                      <div className="flex items-center gap-1.5 px-1 text-[10px] text-[#94A3B8]">
                        <span>{formatMessageTime(m.created_at)}</span>
                        {isMine && (
                          <span title={`Status: ${m.delivery_status}`}>
                            {m.delivery_status === "sending" && "⏱"}
                            {m.delivery_status === "sent" && "✓"}
                            {m.delivery_status === "delivered" && "✓✓"}
                            {m.delivery_status === "read" && (
                              <span className="text-teal-600 font-bold">✓✓</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Composer */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-white space-y-2">
              {selectedFile && (
                <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5 text-xs text-teal-900">
                  <span className="truncate flex items-center gap-1.5">
                    📎 <strong className="truncate">{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-teal-700 hover:text-red-600 font-bold text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach fault photo or document (max 8MB)"
                  className="w-10 h-10 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-slate-100 flex items-center justify-center transition shrink-0"
                >
                  📎
                </button>

                <input
                  type="text"
                  placeholder="Type a message or inquiry..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />

                <button
                  type="submit"
                  disabled={isPending || (!messageText.trim() && !selectedFile)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0F766E] text-white hover:bg-[#0D655E] transition disabled:opacity-50 shrink-0 shadow-xs"
                >
                  {isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl font-bold">
              ✉️
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Select a Conversation</h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              Choose an active booking thread from the left to read messages, send fault photos, or coordinate appointments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
