"use client";

import React, { useState, useTransition } from "react";
import { submitDirectoryReportAction } from "@/app/actions/directory-reports";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "professional" | "business" | "healthcare_facility" | "general_listing";
  entityId: string;
  entityName: string;
}

export function ReportModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}: ReportModalProps) {
  const [reason, setReason] = useState<
    "misrepresentation" | "suspicious_activity" | "unlicensed_practice" | "property_advertising_violation" | "inaccurate_contact_info" | "other"
  >("misrepresentation");
  const [details, setDetails] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      setErrorMsg("Please provide more details (at least 10 characters).");
      return;
    }
    setErrorMsg("");

    startTransition(async () => {
      const res = await submitDirectoryReportAction({
        entityType,
        entityId,
        entityName,
        reason,
        details,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit report.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setDetails("");
          onClose();
        }, 2000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Report Profile / Listing
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Report Submitted
            </h4>
            <p className="text-xs text-slate-600">
              Thank you. Our administration team will investigate this report in accordance with EasyLife community safety guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-slate-600 mb-2">
                Reporting: <strong className="text-slate-900">{entityName}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-900 font-medium"
              >
                <option value="misrepresentation">Misrepresentation of services or credentials</option>
                <option value="property_advertising_violation">Unauthorized Property Listing / Advertisement (Strictly Prohibited)</option>
                <option value="suspicious_activity">Suspicious or fraudulent behavior</option>
                <option value="unlicensed_practice">Unlicensed practice or invalid claims</option>
                <option value="inaccurate_contact_info">Inaccurate contact info or defunct location</option>
                <option value="other">Other policy concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Details &amp; Evidence
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what was inaccurate, misleading, or violated platform guidelines..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
