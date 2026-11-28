"use client";

import React, { useState, useTransition } from "react";
import type { HealthcareFacilityRow, DirectoryReportRow, BusinessRow } from "@easylife/shared-types";
import {
  setBusinessVerificationStatusAction,
  setHealthcareFacilityStatusAction,
  resolveReportAction,
} from "@/app/actions/admin-directories";

interface AdminDirectoriesManagerProps {
  reports?: DirectoryReportRow[];
  businesses?: BusinessRow[];
  facilities?: HealthcareFacilityRow[];
  initialReports?: DirectoryReportRow[];
  initialBusinesses?: BusinessRow[];
  initialFacilities?: HealthcareFacilityRow[];
}

export function AdminDirectoriesManager(props: AdminDirectoriesManagerProps) {
  const reports = props.reports || props.initialReports || [];
  const businesses = props.businesses || props.initialBusinesses || [];
  const facilities = props.facilities || props.initialFacilities || [];
  const [activeTab, setActiveTab] = useState<"reports" | "businesses" | "healthcare">("reports");
  const [isPending, startTransition] = useTransition();
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>("");

  const handleResolveReport = (reportId: string, status: "resolved" | "dismissed") => {
    startTransition(async () => {
      const notes = adminNote[reportId];
      const res = await resolveReportAction(reportId, status, notes);
      if (res.success) {
        setFeedback(`Report marked as ${status}.`);
      } else {
        setFeedback(res.error || "Failed to resolve report.");
      }
    });
  };

  const handleBusinessStatus = (businessId: string, status: "approved" | "rejected" | "suspended") => {
    startTransition(async () => {
      const res = await setBusinessVerificationStatusAction(businessId, status);
      if (res.success) {
        setFeedback(`Business status set to ${status}.`);
      } else {
        setFeedback(res.error || "Failed to update business.");
      }
    });
  };

  const handleFacilityToggle = (facilityId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await setHealthcareFacilityStatusAction(facilityId, !currentActive);
      if (res.success) {
        setFeedback(`Facility ${!currentActive ? "activated" : "disabled"}.`);
      } else {
        setFeedback(res.error || "Failed to update facility.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2E343B] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "reports"
              ? "bg-[#1F2328] text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          }`}
        >
          🚩 Reported Listings ({reports.filter((r) => r.status === "pending").length} Pending)
        </button>
        <button
          onClick={() => setActiveTab("businesses")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "businesses"
              ? "bg-[#1F2328] text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          }`}
        >
          🏢 Local Businesses ({businesses.length})
        </button>
        <button
          onClick={() => setActiveTab("healthcare")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "healthcare"
              ? "bg-[#1F2328] text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          }`}
        >
          🏥 Healthcare Directory ({facilities.length})
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-[#F06A1F] rounded-xl text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* 1. REPORTED LISTINGS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Community Reports &amp; Policy Violation Flags
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Includes misrepresentation, unauthorized property listings, and suspicious behavior.
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              ✓ No active reports. All listings are currently compliant with platform guidelines.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:text-red-400 uppercase">
                        {rep.reason.replace(/_/g, " ")}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Reported Entity: {rep.entity_name} ({rep.entity_type})
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:text-amber-300"
                          : rep.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {rep.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#1F2328] p-2.5 rounded-lg border border-slate-200 dark:border-[#2E343B]">
                    &quot;{rep.details}&quot;
                  </p>

                  {rep.status === "pending" && (
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Admin notes (optional)..."
                        value={adminNote[rep.id] || ""}
                        onChange={(e) =>
                          setAdminNote((prev) => ({ ...prev, [rep.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleResolveReport(rep.id, "resolved")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Action Taken / Resolved
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleResolveReport(rep.id, "dismissed")}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. LOCAL BUSINESSES TAB */}
      {activeTab === "businesses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Local Business Directory Profiles &amp; Verification
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Only approved businesses display a public Verified badge.
            </span>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1F2328] border-b border-slate-200 dark:border-[#2E343B] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Business Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]">
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-[11px] text-slate-400">{b.registration_number || "CAC Unregistered"}</p>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-200">
                        {b.business_category || b.industry || "General"}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {b.city}, {b.state}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.verification_status === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                              : b.verification_status === "rejected"
                              ? "bg-red-100 text-red-800 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {b.verification_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.verification_status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleBusinessStatus(b.id, "approved")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {b.verification_status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleBusinessStatus(b.id, "rejected")}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold"
                            >
                              Reject
                            </button>
                          )}
                          {b.verification_status !== "suspended" && (
                            <button
                              type="button"
                              onClick={() => handleBusinessStatus(b.id, "suspended")}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. HEALTHCARE DIRECTORY TAB */}
      {activeTab === "healthcare" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Healthcare Directory Facilities (Informational Only)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Hospitals, Clinics &amp; Community Pharmacies in Port Harcourt
            </span>
          </div>

          <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1F2328] border-b border-slate-200 dark:border-[#2E343B] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Facility Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Address &amp; LGA</th>
                    <th className="p-3">Emergency</th>
                    <th className="p-3">Active</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facilities.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{f.name}</td>
                      <td className="p-3 capitalize text-slate-700 dark:text-slate-200 font-semibold">{f.facility_type}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{f.address}, {f.lga}</td>
                      <td className="p-3">
                        {f.is_emergency_24_7 ? (
                          <span className="text-red-600 font-bold">24/7 Yes</span>
                        ) : (
                          <span className="text-slate-400">Regular</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.is_active ? "bg-emerald-100 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {f.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleFacilityToggle(f.id, f.is_active)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            f.is_active
                              ? "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {f.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
