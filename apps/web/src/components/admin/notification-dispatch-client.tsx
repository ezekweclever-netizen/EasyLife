"use client";

import React, { useState } from "react";
import { adminSendNotificationAction } from "@/app/actions/admin";

interface NotificationLogItem {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  body?: string;
  type?: string;
  notification_type?: string;
  is_read: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface NotificationDispatchClientProps {
  initialLogs: NotificationLogItem[];
}

export function NotificationDispatchClient({
  initialLogs,
}: NotificationDispatchClientProps) {
  const [logs, setLogs] = useState<NotificationLogItem[]>(initialLogs);
  const [recipientUserId, setRecipientUserId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("system_alert");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("recipientUserId", recipientUserId);
    fd.append("title", title);
    fd.append("content", content);
    fd.append("type", type);

    const res = await adminSendNotificationAction(fd);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setSuccess(res.message);
    setLogs((prev) => [
      {
        id: (res.data?.id as string) || String(Date.now()),
        user_id: recipientUserId,
        title,
        content,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
        profiles: null,
      },
      ...prev,
    ]);

    setRecipientUserId("");
    setTitle("");
    setContent("");
  };

  return (
    <div className="space-y-8">
      {/* Dispatch Notification Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>📢 Dispatch Official Platform Notification</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send authenticated in-app messages and alerts directly to customers or service professionals.
          </p>
        </div>

        <form onSubmit={handleDispatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Recipient User ID (UUID) *
              </label>
              <input
                type="text"
                required
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Notification Category / Alert Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              >
                <option value="system_alert">System Alert (Operational)</option>
                <option value="compliance_notice">Compliance &amp; Policy Notice</option>
                <option value="security_warning">Security &amp; Account Warning</option>
                <option value="verification_update">KYC Accreditation Update</option>
                <option value="dispute_notice">Dispute Arbitration Notice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Important notice regarding your service verification status"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Detailed Message Content *
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the official text that will appear in the user's notification center..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
              {success}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Dispatching..." : "Dispatch System Notification"}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications History Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            System Notification Transmission Log ({logs.length})
          </div>
          <span className="text-2xs text-slate-400">
            Recorded in public.notifications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Title &amp; Type</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Message Body</th>
                <th className="py-3.5 px-4">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No notification transmission records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {log.title}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-2xs font-mono uppercase bg-slate-100 text-slate-700">
                        {log.notification_type || log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">
                        {log.profiles?.full_name || "User"}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {log.profiles?.email || log.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md">
                      <p className="line-clamp-2">{log.body || log.content}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
