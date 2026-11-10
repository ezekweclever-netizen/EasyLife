"use client";

import React, { useState, useTransition } from "react";
import { uploadVerificationDocumentAction } from "@/app/actions/pro";
import type { DocumentType, ProfessionalDocumentItem } from "@/lib/supabase/pro";

interface DocumentUploadCardProps {
  professionalId: string;
  existingDocuments?: ProfessionalDocumentItem[];
  onUploadSuccess?: () => void;
}

export function DocumentUploadCard({
  professionalId,
  existingDocuments = [],
  onUploadSuccess,
}: DocumentUploadCardProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState<DocumentType>("national_id_nin");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fileName, setFileName] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!documentNumber && documentType === "national_id_nin") {
      setErrorMessage("Please enter your 11-digit NIN or slip number.");
      return;
    }

    const formData = new FormData();
    formData.append("professionalId", professionalId);
    formData.append("documentType", documentType);
    formData.append("documentNumber", documentNumber);
    formData.append("fileName", selectedFile?.name || fileName || `${documentType}_upload.pdf`);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

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
        setFileName("");
        setSelectedFile(null);
        onUploadSuccess?.();
      }
    });
  };

  return (
    <div id="documents" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Professional Verification &amp; KYC
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit required identity documents and trade qualifications. Strict vetting ensures trust on EasyLife.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0D9488] border border-teal-200">
          Admin Approval Guarded
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
          ✓ {successMessage}
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document Category
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium"
            >
              {Object.entries(docTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document / Identification Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. 11-digit NIN or RC Number"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Only the last 4 digits are retained unmasked for audit privacy.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Attach Document File (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setSelectedFile(f);
              setFileName(f ? f.name : "");
            }}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#0D9488] hover:file:bg-teal-100"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50 transition shadow-xs"
          >
            {isPending ? "Submitting for Vetting..." : "Upload & Submit for Review"}
          </button>
        </div>
      </form>

      {/* Submitted Documents Table */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Submitted Verification Documents ({existingDocuments.length})
        </h4>

        {existingDocuments.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              No verification documents submitted yet. Upload your National ID (NIN) to begin the verification process.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {existingDocuments.map((doc) => {
              let statusPill = (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Under Review
                </span>
              );
              if (doc.verification_status === "approved" || doc.verification_status === "verified") {
                statusPill = (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified ✓
                  </span>
                );
              } else if (doc.verification_status === "rejected") {
                statusPill = (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                    Rejected
                  </span>
                );
              }

              return (
                <div
                  key={doc.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50 transition"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {docTypeLabels[doc.document_type] || doc.document_type}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>File: {doc.file_name}</span>
                      {doc.document_number_masked && (
                        <span>ID: {doc.document_number_masked}</span>
                      )}
                      <span>
                        Uploaded: {new Date(doc.created_at).toLocaleDateString("en-NG")}
                      </span>
                    </div>
                    {doc.review_notes && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        Reviewer note: {doc.review_notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">{statusPill}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
