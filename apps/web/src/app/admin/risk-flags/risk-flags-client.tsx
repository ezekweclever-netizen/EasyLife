"use client";

import React, { useState, useTransition } from "react";
import type { RiskFlagRecord, RiskFlagStatus, RiskFlagType, RiskSeverity } from "@/lib/risk/risk-engine";
import {
  fetchAdminRiskFlagsAction,
  adminReviewRiskFlagAction,
  triggerAccountRiskAuditAction,
} from "@/app/actions/admin-risk";

interface RiskFlagsClientProps {
  initialData: {
    flags: RiskFlagRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialSummary: {
    total: number;
    pending_review: number;
    investigating: number;
    dismissed: number;
    resolved: number;
    high_severity: number;
    by_type: Record<string, number>;
  };
}

export function RiskFlagsClient({ initialData, initialSummary }: RiskFlagsClientProps) {
  const [data, setData] = useState(initialData);
  const [summary, setSummary] = useState(initialSummary);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const [isPending, startTransition] = useTransition();
  const [selectedFlag, setSelectedFlag] = useState<RiskFlagRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Manual Audit State
  const [auditUserId, setAuditUserId] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);

  const reloadFlags = (newStatus = statusFilter, newType = typeFilter, newSev = severityFilter) => {
    startTransition(async () => {
      const res = await fetchAdminRiskFlagsAction({
        status: newStatus !== "all" ? (newStatus as RiskFlagStatus) : undefined,
        flag_type: newType !== "all" ? (newType as RiskFlagType) : undefined,
        severity: newSev !== "all" ? (newSev as RiskSeverity) : undefined,
        limit: 50,
      });

      if (res.success && res.data) {
        setData(res.data);
        if (res.summary) setSummary(res.summary);
      }
    });
  };

  const handleReviewAction = (newStatus: RiskFlagStatus) => {
    if (!selectedFlag) return;
    if (!adminNotes.trim()) {
      setActionError("Please provide documented administrative notes for this review decision.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await adminReviewRiskFlagAction({
        flagId: selectedFlag.id,
        status: newStatus,
        adminNotes: adminNotes.trim(),
      });

      if (!res.success) {
        setActionError(res.error || "Failed to update risk flag.");
      } else {
        setActionSuccess(`Risk flag updated to ${newStatus}. Decision recorded in audit logs.`);
        setTimeout(() => {
          setSelectedFlag(null);
          setAdminNotes("");
          setActionSuccess(null);
          reloadFlags();
        }, 1200);
      }
    });
  };

  const handleRunManualAudit = () => {
    if (!auditUserId.trim()) return;
    setActionError(null);
    startTransition(async () => {
      const res = await triggerAccountRiskAuditAction(auditUserId.trim());
      if (res.success) {
        setAuditResult(res.result);
        reloadFlags();
      } else {
        setActionError(res.error || "Audit failed.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
            Total Flagged
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {summary.total}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60/70 border border-amber-200 dark:border-amber-800 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
            Pending Review
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">
            {summary.pending_review}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-rose-700 block">
            High Severity
          </span>
          <span className="text-2xl font-black text-rose-900 mt-1 block">
            {summary.high_severity}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 block">
            Investigating
          </span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">
            {summary.investigating}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60/70 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
            Resolved
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {summary.resolved}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#2E343B] shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
            Dismissed
          </span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 block">
            {summary.dismissed}
          </span>
        </div>
      </div>

      {/* Manual Audit Utility */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            🔍 On-Demand Profile Risk Audit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan any user ID for duplicate accounts, rapid cancellations, or dispute frequency.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={auditUserId}
            onChange={(e) => setAuditUserId(e.target.value)}
            placeholder="Paste User Profile UUID..."
            className="flex-1 sm:w-64 h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E8590C]"
          />
          <button
            type="button"
            onClick={handleRunManualAudit}
            disabled={!auditUserId.trim() || isPending}
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            {isPending ? "Auditing..." : "Run Audit"}
          </button>
        </div>
      </div>

      {auditResult && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-emerald-400 font-bold">Audit Evaluation Result</span>
            <button
              onClick={() => setAuditResult(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre>{JSON.stringify(auditResult, null, 2)}</pre>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              reloadFlags(e.target.value, typeFilter, severityFilter);
            }}
            className="h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1F2328]"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Indicator:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              reloadFlags(statusFilter, e.target.value, severityFilter);
            }}
            className="h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1F2328]"
          >
            <option value="all">All Indicator Types</option>
            <option value="duplicate_account">Duplicate Accounts</option>
            <option value="repeated_suspicious_activity">Suspicious Activity / Spikes</option>
            <option value="unusual_booking_pattern">Unusual Booking Velocity</option>
            <option value="repeated_complaints">Repeated Complaints</option>
            <option value="suspicious_review_activity">Suspicious Reviews</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              reloadFlags(statusFilter, typeFilter, e.target.value);
            }}
            className="h-9 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1F2328]"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>

        <span className="ml-auto text-xs font-bold text-slate-400">
          Showing {data.flags.length} of {data.total} records
        </span>
      </div>

      {/* Flags Table */}
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-slate-200 dark:border-[#2E343B] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1F2328]/80 border-b border-slate-200 dark:border-[#2E343B] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Indicator Type</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.flags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No risk flags match the selected filters.
                  </td>
                </tr>
              ) : (
                data.flags.map((flag) => {
                  const sevColor =
                    flag.severity === "high"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : flag.severity === "medium"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-blue-100 text-blue-800 border-blue-200";

                  const statusColor =
                    flag.status === "pending_review"
                      ? "bg-amber-50 text-amber-700 border-amber-300 font-bold"
                      : flag.status === "investigating"
                      ? "bg-blue-50 text-blue-700 border-blue-300 font-bold"
                      : flag.status === "resolved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                      : "bg-slate-100 text-slate-600 border-slate-200 font-medium";

                  return (
                    <tr key={flag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/60 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white uppercase block">
                          {flag.entity_type}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {flag.entity_id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {flag.flag_type.replace(/_/g, " ")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${sevColor}`}
                        >
                          {flag.severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-700 dark:text-slate-200 leading-snug">
                        {flag.description}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] border ${statusColor}`}
                        >
                          {flag.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(flag.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFlag(flag);
                            setAdminNotes(flag.admin_notes || "");
                            setActionError(null);
                            setActionSuccess(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-slate-800 dark:text-slate-100 text-[11px] transition shadow-2xs"
                        >
                          Review Flag →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Arbitration Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-[#2E343B] shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-rose-600">
                  Administrative Risk Case File
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedFlag.flag_type.replace(/_/g, " ").toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Flag ID: {selectedFlag.id} • Entity: {selectedFlag.entity_type} ({selectedFlag.entity_id})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFlag(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Non-Accusation Rule Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                🛡️ Important Policy Compliance
              </strong>
              These flags only trigger administrative review. Do not automatically accuse or permanently suspend users. Every decision must be based on verified evidence and recorded with documentation.
            </div>

            {/* Evidence & Details */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Automated Evidence &amp; Rule Findings
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] text-xs space-y-2">
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedFlag.description}</p>
                {selectedFlag.details && Object.keys(selectedFlag.details).length > 0 && (
                  <pre className="p-2.5 rounded-lg bg-white dark:bg-[#1F2328] border border-slate-200 dark:border-[#2E343B] text-[11px] font-mono text-slate-700 dark:text-slate-200 overflow-x-auto">
                    {JSON.stringify(selectedFlag.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                Administrative Notes &amp; Finding Rationale *
              </label>
              <textarea
                rows={3}
                required
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Document your investigation findings, verified evidence, or rationale for dismissal/resolution..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E8590C]"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900">
                ✓ {actionSuccess}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFlag(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2E343B] text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleReviewAction("dismissed")}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-bold transition disabled:opacity-50"
              >
                Dismiss (False Positive)
              </button>

              <button
                type="button"
                onClick={() => handleReviewAction("investigating")}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Mark Investigating
              </button>

              <button
                type="button"
                onClick={() => handleReviewAction("resolved")}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-[#E8590C] hover:bg-teal-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Resolve Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
