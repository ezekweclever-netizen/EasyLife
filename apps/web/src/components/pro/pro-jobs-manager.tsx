"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ProJobRequestItem } from "@/lib/supabase/pro";
import { QuotationModal } from "@/components/pro/quotation-modal";

interface ProJobsManagerProps {
  initialOpenRequests: ProJobRequestItem[];
  initialActiveJobs: ProJobRequestItem[];
  initialCompletedJobs: ProJobRequestItem[];
  professionalId: string;
  isVerified: boolean;
}

export function ProJobsManager({
  initialOpenRequests,
  initialActiveJobs,
  initialCompletedJobs,
  professionalId,
  isVerified,
}: ProJobsManagerProps) {
  const [activeTab, setActiveTab] = useState<"eligible" | "active" | "history">("eligible");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedUrgency, setSelectedUrgency] = useState("all");

  // Quotation Modal state
  const [activeQuoteJob, setActiveQuoteJob] = useState<ProJobRequestItem | null>(null);

  const filterJobs = (jobs: ProJobRequestItem[]) => {
    return jobs.filter((j) => {
      if (selectedCity !== "All Cities" && !j.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      if (selectedUrgency !== "all" && j.urgency !== selectedUrgency) {
        return false;
      }
      return true;
    });
  };

  const displayedJobs =
    activeTab === "eligible"
      ? filterJobs(initialOpenRequests)
      : activeTab === "active"
      ? filterJobs(initialActiveJobs)
      : filterJobs(initialCompletedJobs);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("eligible")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "eligible"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Eligible Requests ({initialOpenRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "active"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Active Jobs ({initialActiveJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Job History ({initialCompletedJobs.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white"
          >
            <option value="All Cities">All Pilot Cities</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </select>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white"
          >
            <option value="all">All Urgencies</option>
            <option value="emergency">Emergency</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Verification Notice if not verified */}
      {!isVerified && activeTab === "eligible" && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>Note:</strong> You can inspect open requests, but must submit ID &amp; trade credentials for vetting to send binding quotations.
            </span>
          </div>
          <Link
            href="/pro/profile#documents"
            className="font-bold text-[#0D9488] hover:underline"
          >
            Submit Documents →
          </Link>
        </div>
      )}

      {/* Jobs Listing */}
      {displayedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <span className="text-3xl block mb-2">📋</span>
          <h3 className="text-sm font-bold text-slate-900">
            No service requests found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === "eligible"
              ? "There are currently no open service requests matching your filter criteria in this city."
              : activeTab === "active"
              ? "You do not have any active appointments or work in progress."
              : "No completed jobs recorded yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedJobs.map((job) => {
            const isAssigned = job.is_assigned_to_pro;
            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
                      {job.category?.name || "General Service"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.urgency === "emergency"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {job.urgency}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-400">📍</span>
                      <span className="font-medium text-slate-800">
                        {job.service_address}
                      </span>
                    </div>

                    {job.preferred_date && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">📅</span>
                        <span>
                          {job.preferred_date} {job.preferred_time_slot ? `(${job.preferred_time_slot})` : ""}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">👤</span>
                      <span>{job.customer_display_name}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {job.reference_code}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pro/jobs/${job.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      View Details
                    </Link>

                    {activeTab === "eligible" && (
                      <button
                        type="button"
                        onClick={() => setActiveQuoteJob(job)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
                      >
                        Prepare Quote
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quotation Builder Modal */}
      {activeQuoteJob && (
        <QuotationModal
          bookingId={activeQuoteJob.id}
          bookingRef={activeQuoteJob.reference_code}
          bookingTitle={activeQuoteJob.title}
          professionalId={professionalId}
          isOpen={Boolean(activeQuoteJob)}
          onClose={() => setActiveQuoteJob(null)}
          onSuccess={() => {
            setActiveQuoteJob(null);
          }}
        />
      )}
    </div>
  );
}
