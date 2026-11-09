"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/lib/supabase/notifications";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
}

export function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (notification: NotificationItem) => {
    if (!notification.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      startTransition(async () => {
        await markNotificationReadAction(notification.id);
      });
    }

    setIsOpen(false);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "new_quotation":
        return "💰";
      case "quotation_accepted":
        return "🤝";
      case "appointment_confirmed":
        return "📅";
      case "new_message":
        return "💬";
      case "job_completion_request":
        return "🛠️";
      case "booking_status_change":
        return "⚡";
      case "verification_status_change":
        return "🛡️";
      case "customer_review":
        return "⭐";
      case "dispute_update":
        return "⚖️";
      default:
        return "🔔";
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#0F172A]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E] font-extrabold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-[11px] font-bold text-[#0F766E] hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F1F5F9]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <span className="text-2xl">🔔</span>
                <p className="text-xs font-bold text-[#0F172A]">No notifications</p>
                <p className="text-[11px] text-[#64748B]">
                  Updates about quotes, messages, and appointments will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const isRejected = n.delivery_status === "rejected";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`p-3.5 cursor-pointer transition-colors space-y-1.5 ${
                      !n.is_read ? "bg-teal-50/40 hover:bg-teal-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">
                        {getEventIcon(n.notification_type)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs truncate ${
                              !n.is_read ? "font-bold text-[#0F172A]" : "font-medium text-[#475569]"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#94A3B8] shrink-0 font-medium">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>

                        {/* Delivery channels & status tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {n.channels.map((ch) => (
                            <span
                              key={ch}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isRejected && ch === "email"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-[#F1F5F9] text-[#64748B]"
                              }`}
                            >
                              {ch === "in_app" ? "In-App" : ch.toUpperCase()}
                              {isRejected && ch === "email" ? " (Rejected)" : ""}
                            </span>
                          ))}

                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#0F766E] hover:underline"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
