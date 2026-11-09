"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type {
  IntelligentMaintenanceReminder,
  MaintenanceRemindersSummary,
} from "@/lib/maintenance/maintenance-engine";
import { completeMaintenanceScheduleAction } from "@/app/actions/maintenance-reminders";

interface IntelligentMaintenanceWidgetProps {
  initialSummary: MaintenanceRemindersSummary;
  businessId: string;
}

export function IntelligentMaintenanceWidget({
  initialSummary,
  businessId,
}: IntelligentMaintenanceWidgetProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [statusTab, setStatusTab] = useState<"all" | "overdue" | "upcoming" | "completed">("all");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleMarkCompleted = (scheduleId: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await completeMaintenanceScheduleAction(scheduleId);
      if (res.success) {
        setMessage("Maintenance marked as completed. Next due date recalculated based on your interval.");
        // Optimistically update
        setSummary((prev) => ({
          ...prev,
          reminders: prev.reminders.map((r) =>
            r.schedule_id === scheduleId ? { ...r, status: "completed" as const, days_remaining: r.interval_days } : r
          ),
          completed_count: prev.completed_count + 1,
          overdue_count: Math.max(0, prev.overdue_count - 1),
        }));
      } else {
        setMessage(res.error || "Failed to update schedule.");
      }
    });
  };

  const filteredReminders = summary.reminders.filter((r) => {
    if (statusTab === "all") return true;
    if (statusTab === "overdue") return r.status === "overdue";
    if (statusTab === "upcoming") return r.status === "upcoming" || r.status === "due_today";
    if (statusTab === "completed") return r.status === "completed";
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-2xs font-bold uppercase tracking-wider text-[#0D9488]">
              Automated Operations Assistant
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Intelligent Maintenance Reminders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rule-based schedules configured for air conditioners, generators, inverters, pumps, and facility assets.
          </p>
        </div>

        {/* Explicit Policy Disclaimer */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm">
          <strong className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
            ⚙️ Non-Predictive Interval Policy
          </strong>
          Reminders are strictly calculated from your configured service intervals. EasyLife does not claim to predict hardware failure or mechanical wear.
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusTab("all")}
          className={`p-4 rounded-2xl text-left border transition ${
            statusTab === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
          }`}
        >
          <span className="text-2xs font-bold uppercase tracking-wider block opacity-80">
            Total Schedules
          </span>
          <span className="text-2xl font-black mt-1 block">
            {summary.total_schedules}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("overdue")}
          className={`p-4 rounded-2xl text-left border transition ${
            statusTab === "overdue"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100"
          }`}
        >
          <span className="text-2xs font-bold uppercase tracking-wider block opacity-80">
            Overdue Maintenance
          </span>
          <span className="text-2xl font-black mt-1 block">
            {summary.overdue_count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("upcoming")}
          className={`p-4 rounded-2xl text-left border transition ${
            statusTab === "upcoming"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100"
          }`}
        >
          <span className="text-2xs font-bold uppercase tracking-wider block opacity-80">
            Upcoming (Next 14 Days)
          </span>
          <span className="text-2xl font-black mt-1 block">
            {summary.upcoming_count + summary.due_today_count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("completed")}
          className={`p-4 rounded-2xl text-left border transition ${
            statusTab === "completed"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100"
          }`}
        >
          <span className="text-2xs font-bold uppercase tracking-wider block opacity-80">
            Completed / Active
          </span>
          <span className="text-2xl font-black mt-1 block">
            {summary.completed_count}
          </span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900">
          ✓ {message}
        </div>
      )}

      {/* Reminder Cards Grid */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No maintenance reminders found under the &quot;{statusTab}&quot; tab.
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const isOverdue = rem.status === "overdue";
            const isDueToday = rem.status === "due_today";
            const isUpcoming = rem.status === "upcoming";

            const badgeColor = isOverdue
              ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
              : isDueToday
              ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
              : isUpcoming
              ? "bg-teal-100 text-teal-800 border-teal-300 font-bold"
              : "bg-slate-100 text-slate-600 border-slate-200";

            return (
              <div
                key={rem.schedule_id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isOverdue
                    ? "bg-rose-50/40 border-rose-200"
                    : isDueToday
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${badgeColor}`}
                    >
                      {rem.status === "due_today" ? "Due Today" : rem.status.toUpperCase()}
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {rem.title}
                    </span>

                    {rem.asset_name && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                        🏷️ {rem.asset_name} ({rem.asset_brand || "Standard"} {rem.asset_model || ""})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      🏢 Property: <strong className="text-slate-700">{rem.property_name}</strong>
                    </span>
                    <span>
                      📅 Due Date: <strong className="text-slate-700">{rem.next_due_date}</strong>
                    </span>
                    <span>
                      ⏱️ {rem.reminder_basis}
                    </span>
                  </div>

                  {rem.description && (
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {rem.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(rem.schedule_id)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
                  >
                    Mark Done
                  </button>

                  <Link
                    href={`/business/maintenance?propertyId=${rem.property_id}&assetId=${rem.asset_id || ""}`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                  >
                    Request Quote →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
