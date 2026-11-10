"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/lib/supabase/notifications";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const filtered = notifications.filter((n) => {
    if (selectedChannel === "all") return true;
    if (selectedChannel === "unread") return !n.is_read;
    return n.channels.includes(selectedChannel);
  });

  const handleMarkAsRead = (n: NotificationItem) => {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      startTransition(async () => {
        await markNotificationReadAction(n.id);
      });
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
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
      const date = new Date(isoString);
      if (!hasMounted) {
        return date.toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          timeZone: "Africa/Lagos",
        });
      }
      const diffMs = Date.now() - date.getTime();
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
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Alerts" },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "in_app", label: "In-App" },
            { id: "email", label: "Email" },
            { id: "sms", label: "SMS / WhatsApp" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedChannel(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedChannel === tab.id
                  ? "bg-[#0F766E] text-white shadow-xs"
                  : "bg-slate-100 text-[#64748B] hover:bg-slate-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs font-bold text-[#0F766E] hover:underline self-end sm:self-auto disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden divide-y divide-[#F1F5F9]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl">🔔</span>
            <p className="text-sm font-bold text-[#0F172A]">No notifications found</p>
            <p className="text-xs text-[#64748B]">
              You are all caught up with your service appointments and communications.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const isRejected = n.delivery_status === "rejected";
            const isDeliveriesExpanded = expandedDeliveryId === n.id;

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 transition-colors space-y-3 ${
                  !n.is_read ? "bg-teal-50/30" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center text-lg shrink-0">
                      {getEventIcon(n.notification_type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm ${
                            !n.is_read ? "font-bold text-[#0F172A]" : "font-semibold text-[#334155]"
                          }`}
                        >
                          {n.title}
                        </h3>
                        {!n.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F766E] text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">{n.body}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-[#94A3B8] font-medium shrink-0">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>

                {/* Footer bar with Channel Delivery Badges & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9]">
                  {/* Delivery Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Delivery:
                    </span>
                    {n.channels.map((ch) => {
                      const delivery = n.deliveries?.find((d) => d.channel === ch);
                      const isDelivered = delivery?.status === "delivered";
                      const isChannelRejected = delivery?.status === "rejected";

                      return (
                        <span
                          key={ch}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isChannelRejected
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : isDelivered
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span>{ch === "in_app" ? "In-App" : ch.toUpperCase()}</span>
                          <span className="text-[9px] opacity-80">
                            ({delivery?.status || "delivered"})
                          </span>
                        </span>
                      );
                    })}

                    {n.deliveries && n.deliveries.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDeliveryId(isDeliveriesExpanded ? null : n.id)
                        }
                        className="text-[11px] font-semibold text-[#0F766E] hover:underline"
                      >
                        {isDeliveriesExpanded ? "Hide Audit Details" : "View Delivery Audit"}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n)}
                        className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                      >
                        Mark as read
                      </button>
                    )}

                    {n.action_url && (
                      <Link
                        href={n.action_url}
                        onClick={() => handleMarkAsRead(n)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white font-bold text-xs shadow-xs transition"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Expandable Delivery Audit Panel */}
                {isDeliveriesExpanded && n.deliveries && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 mt-2">
                    <p className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider">
                      Multi-Channel Delivery Audit Record
                    </p>
                    <div className="divide-y divide-slate-200">
                      {n.deliveries.map((del) => (
                        <div key={del.id} className="py-2 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold uppercase text-slate-900 mr-2">
                              {del.channel}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              To: {del.recipient_destination} • Provider: {del.provider}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                del.status === "delivered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : del.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {del.status.toUpperCase()}
                            </span>
                            {del.error_message && (
                              <p className="text-[10px] text-red-600 mt-0.5">
                                Reason: {del.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
