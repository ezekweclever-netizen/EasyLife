"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  type EmployerVacancyWithApplications,
  type EmployerJobsPortalData,
  updateJobApplicationStatusAction,
  toggleJobVacancyStatusAction,
} from "@/app/actions/jobs";
import type { JobApplicationStatus } from "@easylife/shared-types";

interface EmployerJobsClientProps {
  initialData: EmployerJobsPortalData;
  businessName?: string;
}

export function EmployerJobsClient({
  initialData,
  businessName,
}: EmployerJobsClientProps) {
  const [data, setData] = useState<EmployerJobsPortalData>(initialData);
  const [activeTab, setActiveTab] = useState<"vacancies" | "applications">(
    "vacancies"
  );
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Notes modal / form state for reviewing candidates
  const [editingNotesAppId, setEditingNotesAppId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [targetStatus, setTargetStatus] = useState<JobApplicationStatus>("shortlisted");

  // Filter vacancies
  const vacancies = data.vacancies;

  // Flatten applications with their vacancy reference
  const allApplications = vacancies.flatMap((v) =>
    v.applications.map((app) => ({
      ...app,
      vacancyTitle: v.title,
      vacancyCity: v.city,
      vacancySlug: v.slug,
    }))
  );

  const filteredApplications = allApplications.filter((app) => {
    if (selectedVacancyId !== "all" && app.vacancy_id !== selectedVacancyId) {
      return false;
    }
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: JobApplicationStatus,
    notes?: string
  ) => {
    setIsUpdating(applicationId);
    setFeedback(null);
    try {
      const res = await updateJobApplicationStatusAction(
        applicationId,
        newStatus,
        notes
      );
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Applicant status updated to "${newStatus}".`,
        });
        // Update local state
        setData((prev) => {
          const nextVacancies = prev.vacancies.map((vac) => ({
            ...vac,
            applications: vac.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    status: newStatus,
                    employer_notes: notes ?? a.employer_notes,
                    reviewed_at: new Date().toISOString(),
                  }
                : a
            ),
          }));
          return {
            ...prev,
            vacancies: nextVacancies,
          };
        });
        setEditingNotesAppId(null);
      } else {
        setFeedback({
          type: "error",
          message: res.message || "Failed to update applicant status.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleVacancyStatus = async (
    vacancyId: string,
    currentStatus: string
  ) => {
    const nextStatus = currentStatus === "open" ? "closed" : "open";
    setIsUpdating(`vac-${vacancyId}`);
    try {
      const res = await toggleJobVacancyStatusAction(vacancyId, nextStatus);
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Vacancy is now ${nextStatus}.`,
        });
        setData((prev) => ({
          ...prev,
          vacancies: prev.vacancies.map((v) =>
            v.id === vacancyId ? { ...v, status: nextStatus } : v
          ),
          summary: {
            ...prev.summary,
            openVacancies:
              nextStatus === "open"
                ? prev.summary.openVacancies + 1
                : Math.max(0, prev.summary.openVacancies - 1),
          },
        }));
      } else {
        setFeedback({
          type: "error",
          message: res.message || "Failed to toggle vacancy status.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0D223A] p-6 rounded-3xl border border-slate-200/90 dark:border-[#163654] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
              Employer Recruitment Console
            </span>
            {businessName && (
              <span className="text-xs text-slate-400">• {businessName}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Vacancies &amp; Candidate Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review job applicants, manage trade vacancies, inspect candidate credentials, and schedule interviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Public Board &rarr;
          </Link>
          <Link
            href="/jobs/post"
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs sm:text-sm font-bold hover:bg-[#0D655E] transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span>
            <span>Post New Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data.summary.totalVacancies}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Total Vacancies
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {data.summary.openVacancies}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Active Openings
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {data.summary.totalApplications}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Total Applicants
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {data.summary.pendingApplications}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Pending Review
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {data.summary.shortlistedApplications}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Shortlisted
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {data.summary.interviewedApplications}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Interviewed
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200/90 dark:border-[#163654] p-4 text-center">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {data.summary.offeredApplications}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Hired / Offered
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("vacancies")}
          className={`pb-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "vacancies"
              ? "border-[#0F766E] text-[#0F766E] dark:text-[#5CD3D5]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          My Posted Vacancies ({vacancies.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "applications"
              ? "border-[#0F766E] text-[#0F766E] dark:text-[#5CD3D5]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Candidate Applications ({allApplications.length})
        </button>
      </div>

      {/* VACANCIES TAB */}
      {activeTab === "vacancies" && (
        <div className="space-y-4">
          {vacancies.length === 0 ? (
            <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-2xl mx-auto flex items-center justify-center">
                💼
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No vacancies posted yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Create your first job vacancy or apprenticeship role to start receiving applications from verified trade professionals.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/jobs/post"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs sm:text-sm font-bold hover:bg-[#0D655E] transition shadow-md"
                >
                  + Post a Vacancy Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {vacancies.map((vac) => {
                const minKobo = vac.min_salary_kobo ?? 0;
                const maxKobo = vac.max_salary_kobo ?? 0;
                const salaryFormatted =
                  minKobo > 0 && maxKobo > 0
                    ? `₦${(minKobo / 100).toLocaleString()} – ₦${(
                        maxKobo / 100
                      ).toLocaleString()}`
                    : minKobo > 0
                    ? `From ₦${(minKobo / 100).toLocaleString()}`
                    : "Negotiable";

                const isClosed = vac.status === "closed";
                const isPendingMod = vac.moderation_status === "pending";

                return (
                  <div
                    key={vac.id}
                    className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
                          {vac.category}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isClosed
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}
                        >
                          ● {vac.status.toUpperCase()}
                        </span>
                        {isPendingMod && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            ⏳ Under Admin Review
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          📍 {vac.city}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {vac.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {vac.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          Compensation:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {salaryFormatted} / {vac.salary_period || "month"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Type:{" "}
                          <strong className="text-slate-800 dark:text-slate-200 capitalize">
                            {(vac.employment_type || "").replace("_", " ")}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Openings:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {vac.positions_available || 1}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVacancyId(vac.id);
                            setActiveTab("applications");
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>👥</span>
                          <span>
                            View Applicants ({vac.applications.length})
                          </span>
                        </button>

                        <Link
                          href={`/jobs/${vac.slug || vac.id}`}
                          target="_blank"
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          Public View ↗
                        </Link>
                      </div>

                      <button
                        disabled={isUpdating === `vac-${vac.id}`}
                        onClick={() =>
                          handleToggleVacancyStatus(vac.id, vac.status)
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          isClosed
                            ? "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            : "text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        }`}
                      >
                        {isClosed ? "Reopen Vacancy" : "Close Vacancy"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0D223A] p-4 rounded-2xl border border-slate-200/90 dark:border-[#163654]">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Filter by Vacancy:
                </label>
                <select
                  value={selectedVacancyId}
                  onChange={(e) => setSelectedVacancyId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value="all">All Vacancies ({allApplications.length})</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.applications.length})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Candidate Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offered">Offered / Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {selectedVacancyId !== "all" && (
              <button
                onClick={() => setSelectedVacancyId("all")}
                className="text-xs font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
              >
                Clear Vacancy Filter &times;
              </button>
            )}
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-2xl mx-auto flex items-center justify-center">
                📋
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No applications found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {selectedVacancyId !== "all"
                    ? "No candidates have applied to this specific role yet."
                    : "No job applications match your active filters."}
                </p>
              </div>
              {selectedVacancyId !== "all" && (
                <button
                  onClick={() => setSelectedVacancyId("all")}
                  className="text-xs font-bold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
                >
                  View All Vacancy Applications
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredApplications.map((app) => {
                const isShortlisted = app.status === "shortlisted";
                const isInterviewed = app.status === "interviewed";
                const isOffered = app.status === "offered";
                const isRejected = app.status === "rejected";

                let statusBadgeColor =
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (isShortlisted)
                  statusBadgeColor =
                    "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800";
                if (isInterviewed)
                  statusBadgeColor =
                    "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
                if (isOffered)
                  statusBadgeColor =
                    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
                if (isRejected)
                  statusBadgeColor =
                    "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800";

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {app.applicant_name}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeColor}`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          Applied for:{" "}
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {app.vacancyTitle}
                          </span>{" "}
                          ({app.vacancyCity}) • Ref: {app.reference_code}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>
                          {new Date(app.created_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-[#071526]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">✉️</span>
                        <a
                          href={`mailto:${app.applicant_email}`}
                          className="font-medium text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
                        >
                          {app.applicant_email}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">📞</span>
                        <a
                          href={`tel:${app.applicant_phone}`}
                          className="font-medium text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
                        >
                          {app.applicant_phone}
                        </a>
                      </div>

                      {app.resume_url && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">📄</span>
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View Resume / CV ↗
                          </a>
                        </div>
                      )}

                      {app.portfolio_links && app.portfolio_links.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">🔗 Portfolio:</span>
                          {app.portfolio_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-slate-700 dark:text-slate-300 hover:underline"
                            >
                              Link {idx + 1} ↗
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cover Pitch */}
                    {app.cover_letter && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                          Candidate Introduction / Pitch:
                        </span>
                        <p className="bg-white dark:bg-[#0D223A] p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* Employer Notes if any */}
                    {app.employer_notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
                        <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">
                          Employer Private Notes:
                        </span>
                        {app.employer_notes}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${app.applicant_phone}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          📞 Call Candidate
                        </a>
                        <a
                          href={`mailto:${app.applicant_email}?subject=Regarding your application for ${encodeURIComponent(
                            app.vacancyTitle
                          )}&body=Dear ${encodeURIComponent(app.applicant_name)},`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          ✉️ Email Candidate
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingNotesAppId(app.id);
                            setTargetStatus(app.status);
                            setNotesInput(app.employer_notes || "");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] transition cursor-pointer"
                        >
                          Update Status &amp; Notes
                        </button>
                      </div>
                    </div>

                    {/* Inline Status & Notes Editing Modal */}
                    {editingNotesAppId === app.id && (
                      <div className="bg-slate-50 dark:bg-[#071526] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Update Candidate Status for {app.applicant_name}
                          </h5>
                          <button
                            onClick={() => setEditingNotesAppId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            &times; Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              New Status:
                            </label>
                            <select
                              value={targetStatus}
                              onChange={(e) =>
                                setTargetStatus(
                                  e.target.value as JobApplicationStatus
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs font-medium text-slate-900 dark:text-white"
                            >
                              <option value="submitted">Submitted</option>
                              <option value="under_review">Under Review</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interviewed">Interview Scheduled / Completed</option>
                              <option value="offered">Offer Extended / Hired</option>
                              <option value="rejected">Not Selected / Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Employer Private Notes:
                            </label>
                            <input
                              type="text"
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              placeholder="e.g. Passed initial technical screening. Interview Friday 10 AM."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingNotesAppId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating === app.id}
                            onClick={() =>
                              handleUpdateStatus(
                                app.id,
                                targetStatus,
                                notesInput.trim()
                              )
                            }
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] transition shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdating === app.id
                              ? "Saving..."
                              : "Save Status"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}