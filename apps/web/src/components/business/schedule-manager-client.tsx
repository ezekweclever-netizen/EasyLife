"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createMaintenanceScheduleAction } from "@/app/actions/business";
import { formatMinorUnits } from "@easylife/shared-types";
import type { MaintenanceFrequency } from "@easylife/shared-types";

interface ScheduleItem {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  category_id?: string | null;
  title: string;
  description: string | null;
  frequency: MaintenanceFrequency;
  interval_days: number;
  estimated_cost_kobo: number;
  next_due_date: string;
  last_completed_at: string | null;
  is_active: boolean;
}

interface PropertyOption {
  id: string;
  name: string;
  code: string;
}

interface AssetOption {
  id: string;
  name: string;
  asset_tag: string;
  property_id: string;
}

interface ScheduleManagerClientProps {
  business: {
    id: string;
    name: string;
  };
  properties: PropertyOption[];
  assets: AssetOption[];
  schedules: ScheduleItem[];
  initialFilter?: string;
}

export function ScheduleManagerClient({
  business,
  properties,
  assets,
  schedules,
  initialFilter = "all",
}: ScheduleManagerClientProps) {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPropInForm, setSelectedPropInForm] = useState<string>(properties[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const todayStr: string = new Date().toISOString().split("T")[0] ?? "";

  const classifiedSchedules = schedules.map((item) => {
    const isOverdue = item.is_active && item.next_due_date < todayStr;
    const isUpcoming = item.is_active && item.next_due_date >= todayStr;
    const isCompleted = !item.is_active || Boolean(item.last_completed_at && !isOverdue);
    return {
      ...item,
      isOverdue,
      isUpcoming,
      isCompleted,
    };
  });

  const overdueCount = classifiedSchedules.filter((s) => s.isOverdue).length;
  const upcomingCount = classifiedSchedules.filter((s) => s.isUpcoming).length;
  const completedCount = classifiedSchedules.filter((s) => s.last_completed_at !== null).length;

  const filtered = classifiedSchedules.filter((s) => {
    let matchesTab = true;
    if (filter === "overdue") matchesTab = s.isOverdue;
    if (filter === "upcoming") matchesTab = s.isUpcoming;
    if (filter === "completed") matchesTab = Boolean(s.last_completed_at);

    const matchesProp = propertyFilter === "all" || s.property_id === propertyFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesProp && matchesSearch;
  });

  const formAssets = assets.filter((a) => a.property_id === selectedPropInForm);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);

    startTransition(async () => {
      const res = await createMaintenanceScheduleAction(formData);
      setFeedback(res);
      if (res.ok) {
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
        }, 1200);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0D223A] p-6 rounded-2xl border border-slate-200 dark:border-[#163654]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Maintenance Reminders & Recurring Schedules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manually configured preventive maintenance intervals to safeguard generators, HVAC systems, and key facilities.
          </p>
        </div>
        <button
          onClick={() => {
            setFeedback(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
        >
          <span>+</span> Create Schedule
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#163654]">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            filter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white dark:bg-[#0D223A] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#163654]"
          }`}
        >
          All Schedules ({schedules.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            filter === "upcoming"
              ? "bg-purple-700 text-white shadow-xs"
              : "bg-white dark:bg-[#0D223A] text-purple-700 hover:bg-purple-50 border border-purple-200"
          }`}
        >
          <span>📅</span> Upcoming Maintenance ({upcomingCount})
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            filter === "overdue"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white dark:bg-[#0D223A] text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800"
          }`}
        >
          <span>⚠️</span> Overdue Maintenance ({overdueCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
            filter === "completed"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white dark:bg-[#0D223A] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          <span>✅</span> Completed Cycles ({completedCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search maintenance schedules by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="all">All Properties ({properties.length})</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>

      {/* Schedules Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No maintenance schedules found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {filter !== "all" || searchTerm || propertyFilter !== "all"
              ? "No schedules match your current filter settings."
              : "Configure manual maintenance schedules (e.g. monthly generator servicing, quarterly AC filter cleans) to prevent unexpected equipment failure."}
          </p>
          <button
            onClick={() => {
              setFeedback(null);
              setIsModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition"
          >
            Create First Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const prop = properties.find((p) => p.id === s.property_id);
            const asset = assets.find((a) => a.id === s.asset_id);

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {s.frequency}
                    </span>
                    {s.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <span>⚠️</span> Overdue
                      </span>
                    ) : s.isUpcoming ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <span>📅</span> Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span>✅</span> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{s.title}</h3>
                  {s.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                  )}

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-[#071526] rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Property:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {prop?.name || "Assigned Facility"}
                      </span>
                    </div>
                    {asset && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Asset:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{asset.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Interval:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{s.interval_days} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Next Due:</span>
                      <span
                        className={`font-bold ${
                          s.isOverdue ? "text-amber-700 dark:text-amber-300 underline" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {s.next_due_date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Est. Cost:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatMinorUnits(s.estimated_cost_kobo || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {s.last_completed_at ? (
                    <span className="text-2xs text-slate-400">
                      Last: {new Date(s.last_completed_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-2xs text-slate-400">Initial cycle pending</span>
                  )}
                  <Link
                    href={`/business/maintenance?action=report-fault&propertyId=${s.property_id}&assetId=${s.asset_id || ""}`}
                    className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-[#5CD3D5] font-semibold text-xs rounded-lg transition"
                  >
                    Dispatch Service →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Maintenance Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-[#163654] my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Recurring Maintenance Schedule
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  feedback.ok
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Monthly Generator Filter Check & Lube"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Property *
                  </label>
                  <select
                    name="propertyId"
                    value={selectedPropInForm}
                    onChange={(e) => setSelectedPropInForm(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Equipment Asset (Optional)
                  </label>
                  <select
                    name="assetId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">General Facility</option>
                    {formAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.asset_tag})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Frequency *
                  </label>
                  <select
                    name="frequency"
                    defaultValue="monthly"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="weekly">Weekly (Every 7 Days)</option>
                    <option value="biweekly">Bi-Weekly (Every 14 Days)</option>
                    <option value="monthly">Monthly (Every 30 Days)</option>
                    <option value="quarterly">Quarterly (Every 90 Days)</option>
                    <option value="biannual">Bi-Annual (Every 180 Days)</option>
                    <option value="annual">Annual (Every 365 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    name="nextDueDate"
                    required
                    defaultValue={todayStr}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Estimated Recurring Cost (NGN)
                </label>
                <input
                  type="number"
                  name="estimatedCostNaira"
                  min="0"
                  step="500"
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Routine Maintenance Instructions
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Inspect cooling fins, lubricate bearings, test battery voltage..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Save Maintenance Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
