"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  moderateJobVacancyAction,
  deleteJobVacancyAction,
} from "@/app/actions/admin";

interface VacancyItem {
  id: string;
  reference_code: string;
  title: string;
  category: string;
  employment_type: string;
  workplace_type: string;
  city: string;
  state: string;
  min_salary_kobo: number | null;
  max_salary_kobo: number | null;
  salary_period: string;
  status: string;
  moderation_status: string;
  applications_count: number;
  created_at: string;
  rejection_reason?: string | null;
  posted_by_profile?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  employer?: {
    company_name?: string | null;
    city?: string | null;
  } | null;
  business?: {
    name?: string | null;
    city?: string | null;
  } | null;
}

interface AdminJobsManagerProps {
  initialVacancies: VacancyItem[];
  totalCount: number;
}

export function AdminJobsManager({
  initialVacancies,
  totalCount,
}: AdminJobsManagerProps) {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<VacancyItem[]>(initialVacancies);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "approved" | "closed">("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Rejection modal state
  const [rejectModalVacancy, setRejectModalVacancy] = useState<VacancyItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleModerate = (vacancyId: string, decision: "approved" | "rejected" | "closed", reason?: string) => {
    setActionFeedback(null);
    startTransition(async () => {
      const res = await moderateJobVacancyAction(vacancyId, decision, reason);
      setActionFeedback(res);
      if (res.ok) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? {
                  ...v,
                  moderation_status: decision === "closed" ? "approved" : decision,
                  status: decision === "approved" ? "open" : "closed",
                  rejection_reason: reason || null,
                }
              : v
          )
        );
        setRejectModalVacancy(null);
        setRejectReason("");
        router.refresh();
      }
    });
  };

  const handleDelete = (vacancyId: string) => {
    if (!confirm("Are you sure you want to permanently remove this vacancy?")) return;
    setActionFeedback(null);
    startTransition(async () => {
      const res = await deleteJobVacancyAction(vacancyId);
      setActionFeedback(res);
      if (res.ok) {
        setVacancies((prev) => prev.filter((v) => v.id !== vacancyId));
        router.refresh();
      }
    });
  };

  // Filter list
  const filtered = vacancies.filter((v) => {
    if (filterTab === "pending" && v.moderation_status !== "pending") return false;
    if (filterTab === "approved" && (v.moderation_status !== "approved" || v.status !== "open")) return false;
    if (filterTab === "closed" && v.status !== "closed" && v.moderation_status !== "rejected") return false;

    if (cityFilter !== "all" && v.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchRef = v.reference_code.toLowerCase().includes(q);
      const matchCompany = (v.employer?.company_name || v.business?.name || "").toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchCompany) return false;
    }
    return true;
  });

  const pendingCount = vacancies.filter((v) => v.moderation_status === "pending").length;
  const approvedCount = vacancies.filter((v) => v.moderation_status === "approved" && v.status === "open").length;
  const totalApps = vacancies.reduce((acc, v) => acc + (v.applications_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Vacancies
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {totalCount || vacancies.length}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pending Moderation
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Active &amp; Published
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {approvedCount}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-xs">
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
            Total Applications
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 block">
            {totalApps}
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {actionFeedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 ${
            actionFeedback.ok
              ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "all"
                  ? "bg-white dark:bg-[#163654] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({vacancies.length})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "pending"
                  ? "bg-white dark:bg-[#163654] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "approved"
                  ? "bg-white dark:bg-[#163654] text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Published ({approvedCount})
            </button>
            <button
              onClick={() => setFilterTab("closed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "closed"
                  ? "bg-white dark:bg-[#163654] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Closed / Rejected
            </button>
          </div>

          {/* Quick Create Link */}
          <Link
            href="/jobs/post"
            target="_blank"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D9488] hover:bg-[#0F766E] text-white transition shrink-0 inline-flex items-center gap-1.5"
          >
            <span>+ Create Vacancy</span>
          </Link>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by title, reference, or employer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:col-span-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="all">All Pilot Cities</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </select>
        </div>
      </div>

      {/* Vacancy Table */}
      <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-3xl block">💼</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No vacancies match the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Employer / Posted By</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Compensation</th>
                  <th className="py-3 px-4">Moderation</th>
                  <th className="py-3 px-4">Applicants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((job) => {
                  const company =
                    job.employer?.company_name ||
                    job.business?.name ||
                    job.posted_by_profile?.full_name ||
                    "Direct Partner";

                  const minNaira = job.min_salary_kobo ? Math.round(job.min_salary_kobo / 100) : 0;
                  const maxNaira = job.max_salary_kobo ? Math.round(job.max_salary_kobo / 100) : 0;
                  const compText =
                    minNaira > 0 && maxNaira > 0
                      ? `₦${minNaira.toLocaleString()} - ₦${maxNaira.toLocaleString()}`
                      : minNaira > 0
                      ? `₦${minNaira.toLocaleString()}`
                      : "Negotiable";

                  const isPendingReview = job.moderation_status === "pending";
                  const isApproved = job.moderation_status === "approved" && job.status === "open";

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {job.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {job.reference_code} • {job.category}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {company}
                        </div>
                        {job.posted_by_profile?.email && (
                          <div className="text-[11px] text-slate-400">
                            {job.posted_by_profile.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        📍 {job.city}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {compText} <span className="text-[10px] text-slate-400">/{job.salary_period || "mo"}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPendingReview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ⏳ Pending Review
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {job.moderation_status === "rejected" ? "✗ Rejected" : "Closed"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {job.applications_count || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isPendingReview && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => handleModerate(job.id, "approved")}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                            >
                              Approve
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => setRejectModalVacancy(job)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            disabled={isPending}
                            onClick={() => handleModerate(job.id, "closed")}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                          >
                            Close
                          </button>
                        )}

                        <Link
                          href={`/jobs/${job.id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          View
                        </Link>

                        <button
                          disabled={isPending}
                          onClick={() => handleDelete(job.id)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Delete vacancy"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalVacancy && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Vacancy: {rejectModalVacancy.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please state the reason for rejecting this posting. The employer will be notified.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Compensation is below statutory minimum, or trade details are ambiguous..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalVacancy(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  handleModerate(rejectModalVacancy.id, "rejected", rejectReason)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
