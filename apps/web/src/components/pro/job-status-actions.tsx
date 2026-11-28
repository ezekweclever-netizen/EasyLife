"use client";

import React, { useState, useTransition } from "react";
import { updateProJobStatusAction } from "@/app/actions/pro";

interface JobStatusActionsProps {
  bookingId: string;
  currentStatus: string;
  isAssignedToPro: boolean;
  onStatusUpdated?: () => void;
}

export function JobStatusActions({
  bookingId,
  currentStatus,
  isAssignedToPro,
  onStatusUpdated,
}: JobStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isAssignedToPro) {
    return null;
  }

  const handleStartJob = () => {
    setMessage(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("actionType", "start_job");

    startTransition(async () => {
      const res = await updateProJobStatusAction(formData);
      if (res.ok) {
        setMessage({ type: "success", text: "Job started! Status marked as in-progress." });
        onStatusUpdated?.();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("actionType", "submit_completion");
    formData.append("notes", completionNotes);

    startTransition(async () => {
      const res = await updateProJobStatusAction(formData);
      if (res.ok) {
        setShowCompletionModal(false);
        setMessage({ type: "success", text: "Completion request submitted! Waiting for customer inspection." });
        onStatusUpdated?.();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("actionType", "update_appointment");
    formData.append("scheduledStartAt", newScheduleDate);

    startTransition(async () => {
      const res = await updateProJobStatusAction(formData);
      if (res.ok) {
        setShowScheduleModal(false);
        setMessage({ type: "success", text: "Appointment schedule updated." });
        onStatusUpdated?.();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-3">
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-900 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* If status is confirmed/accepted/scheduled, show Start Job */}
        {["confirmed", "accepted", "scheduled"].includes(currentStatus) && (
          <button
            type="button"
            onClick={handleStartJob}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] disabled:opacity-50 transition shadow-xs"
          >
            {isPending ? "Starting..." : "▶ Start Job"}
          </button>
        )}

        {/* If status is in_progress, show Submit Completion Request */}
        {currentStatus === "in_progress" && (
          <button
            type="button"
            onClick={() => setShowCompletionModal(true)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
          >
            ✓ Mark Job as Done
          </button>
        )}

        {/* If completion already requested */}
        {currentStatus === "pro_marked_complete" && (
          <span className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-[#F06A1F] text-xs font-semibold">
            ⏳ Waiting for customer inspection and payment release
          </span>
        )}

        {/* If completed */}
        {currentStatus === "completed" && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            ✓ Done
          </span>
        )}

        {/* If disputed */}
        {currentStatus === "disputed" && (
          <div className="w-full p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
            <span className="font-extrabold flex items-center gap-1.5 text-purple-950">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              Dispute Under Administrative Arbitration
            </span>
            <p className="text-[11px] text-purple-800">
              A customer dispute has been filed. Actions are locked pending administrator investigation and decision.
            </p>
          </div>
        )}

        {/* Update Appointment Information */}
        {["confirmed", "accepted", "scheduled", "in_progress"].includes(currentStatus) && (
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition"
          >
            Update Appointment
          </button>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1F2328] rounded-2xl max-w-md w-full border border-slate-200 dark:border-[#2E343B] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Submit Job Completion Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide brief notes on the work completed. Once submitted, the customer is invited to inspect the work and release escrow funds.
            </p>

            <form onSubmit={handleCompleteJob} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Completion Notes &amp; Handover Summary
                </label>
                <textarea
                  rows={4}
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Diagnosed burnt coil, installed new 2.5HP compressor, tested cooling gas pressure at 65 PSI. System tested cold for 30 minutes with client present."
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !completionNotes}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isPending ? "Submitting..." : "Confirm Handover & Request Release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Update Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1F2328] rounded-2xl max-w-sm w-full border border-slate-200 dark:border-[#2E343B] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Appointment Time
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select the revised arrival date and time agreed upon with the customer.
            </p>

            <form onSubmit={handleUpdateSchedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  New Arrival Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newScheduleDate}
                  className="px-4 py-2 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] disabled:opacity-50 transition"
                >
                  {isPending ? "Updating..." : "Save Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
