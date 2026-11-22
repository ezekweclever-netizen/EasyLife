"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteVerificationDocumentAction,
  resubmitVerificationAction,
  uploadVerificationDocumentAction,
} from "@/app/actions/pro";
import type {
  DocumentType,
  ProfessionalDocumentItem,
  ProfessionalVerificationStatus,
  ProviderDocumentChecklistItem,
} from "@/lib/supabase/pro";

interface DocumentUploadCardProps {
  professionalId: string;
  verificationStatus?: ProfessionalVerificationStatus;
  existingDocuments?: ProfessionalDocumentItem[];
  checklist?: ProviderDocumentChecklistItem[];
  onUploadSuccess?: () => void;
}

export function DocumentUploadCard({
  professionalId,
  verificationStatus = "unsubmitted",
  existingDocuments = [],
  checklist = [],
  onUploadSuccess,
}: DocumentUploadCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState<DocumentType>("national_id_nin");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const docTypeLabels: Record<DocumentType, string> = {
    national_id_nin: "National Identification Number (NIN)",
    voters_card: "INEC Voter's Card",
    drivers_license: "FRSC Driver's Licence",
    international_passport: "Nigerian International Passport",
    trade_certificate: "Trade Test / NABTEB / Apprenticeship Certificate",
    cac_certificate: "CAC Business Registration (RC / BN Certificate)",
    utility_bill: "Proof of Address (Utility Bill / Tenancy)",
    other: "Other Endorsement or Recommendation",
  };

  const hasReviewableDocs = existingDocuments.some(
    (d) => d.verification_status === "pending" || d.verification_status === "approved" || d.verification_status === "verified"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!documentNumber && documentType === "national_id_nin") {
      setErrorMessage("Please enter your 11-digit NIN or slip number.");
      return;
    }

    if (!selectedFile || selectedFile.size <= 0) {
      setErrorMessage("Please attach a valid PDF, JPG, PNG, or WebP document file.");
      return;
    }

    const formData = new FormData();
    formData.append("professionalId", professionalId);
    formData.append("documentType", documentType);
    formData.append("documentNumber", documentNumber);
    formData.append("fileName", selectedFile.name);
    formData.append("file", selectedFile);

    startTransition(async () => {
      const res = await uploadVerificationDocumentAction(
        { status: "idle", message: "" },
        formData
      );

      if (res.status === "error") {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        setDocumentNumber("");
        setSelectedFile(null);
        router.refresh();
        onUploadSuccess?.();
      }
    });
  };

  const handleDeleteDocument = (docId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const res = await deleteVerificationDocumentAction(docId, professionalId);
      if (!res.ok) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        router.refresh();
      }
    });
  };

  const handleResubmitReview = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const res = await resubmitVerificationAction(professionalId);
      if (!res.ok) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        router.refresh();
      }
    });
  };

  return (
    <div id="documents" className="bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-[#163654] p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Professional Verification &amp; KYC
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your required identity documents and trade credentials based on the services you offer.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] border border-teal-200 dark:border-teal-800 self-start">
          Admin Approval Guarded
        </span>
      </div>

      {/* Dynamic Service-Aware Checklist */}
      {checklist.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Required Credentials Checklist
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {checklist.map((item) => {
              let pill = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:text-slate-200">
                  Missing
                </span>
              );
              if (item.status === "approved") {
                pill = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:text-emerald-300">
                    Approved ✓
                  </span>
                );
              } else if (item.status === "pending") {
                pill = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:text-amber-300">
                    Pending Review
                  </span>
                );
              } else if (item.status === "rejected") {
                pill = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:text-red-300">
                    Rejected — Re-upload
                  </span>
                );
              }

              return (
                <div
                  key={item.key}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.reason}</span>
                  </div>
                  <div className="shrink-0">{pill}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-medium text-red-800 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900">
          ✓ {successMessage}
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Document Category
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs text-slate-900 dark:text-white font-medium"
            >
              {Object.entries(docTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Document / Identification Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. 11-digit NIN or RC Number"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Only the last 4 digits are retained unmasked for audit privacy.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Attach Document File (PDF, JPG, PNG, WebP) *
          </label>
          <input
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setSelectedFile(f);
            }}
            className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 dark:bg-teal-950/60 file:text-[#0D9488] hover:file:bg-teal-100"
          />
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          {(verificationStatus === "unsubmitted" || verificationStatus === "rejected") && (
            <button
              type="button"
              disabled={isPending || !hasReviewableDocs}
              onClick={handleResubmitReview}
              className="px-4 py-2.5 rounded-lg border border-slate-900 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-40 transition"
            >
              {verificationStatus === "rejected"
                ? "Re-submit Application for Review"
                : "Submit Application for Review"}
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50 transition shadow-xs ml-auto"
          >
            {isPending ? "Submitting for Vetting..." : "Upload & Submit Document"}
          </button>
        </div>
      </form>

      {/* Submitted Documents Table */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
          Submitted Verification Documents ({existingDocuments.length})
        </h4>

        {existingDocuments.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No verification documents submitted yet. Upload your National ID (NIN) to begin the verification process.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 dark:border-[#163654] rounded-xl overflow-hidden">
            {existingDocuments.map((doc) => {
              const isVerifiedDoc =
                doc.verification_status === "approved" || doc.verification_status === "verified";
              let statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Under Review
                </span>
              );
              if (isVerifiedDoc) {
                statusPill = (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Verified ✓
                  </span>
                );
              } else if (doc.verification_status === "rejected") {
                statusPill = (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                    Rejected
                  </span>
                );
              }

              return (
                <div
                  key={doc.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526] transition"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {docTypeLabels[doc.document_type] || doc.document_type}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>File: {doc.file_name}</span>
                      {doc.document_number_masked && (
                        <span>ID: {doc.document_number_masked}</span>
                      )}
                      <span>
                        Uploaded: {new Date(doc.created_at).toLocaleDateString("en-NG")}
                      </span>
                    </div>
                    {doc.review_notes && (
                      <p className="text-[11px] text-rose-700 mt-1 font-medium">
                        Reviewer note: {doc.review_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusPill}
                    {!isVerifiedDoc && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:bg-red-950/60 text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
