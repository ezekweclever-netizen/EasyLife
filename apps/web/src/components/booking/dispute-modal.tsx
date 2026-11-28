"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitDisputeAction } from "@/app/actions/disputes";
import { uploadFileAction } from "@/app/actions/storage";

interface DisputeModalProps {
  bookingId: string;
  referenceCode: string;
  agreedAmountNaira?: number;
  proName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISPUTE_CATEGORIES = [
  { value: "incomplete_work", label: "Incomplete work", desc: "Agreed tasks were not completed" },
  { value: "poor_workmanship", label: "Poor workmanship", desc: "Substandard repairs, recurring defects, or damage" },
  { value: "unapproved_charges", label: "Unapproved additional charges", desc: "Demands exceeding agreed quotation without authorization" },
  { value: "missed_appointment", label: "Missed appointment", desc: "Specialist failed to show up at scheduled time" },
  { value: "other", label: "Other service-related problems", desc: "Safety concerns, breach of policy, or contractual disputes" },
];

export function DisputeModal({
  bookingId,
  referenceCode,
  agreedAmountNaira = 0,
  proName = "the specialist",
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState("incomplete_work");
  const [description, setDescription] = useState("");
  const [disputedAmount, setDisputedAmount] = useState<number>(agreedAmountNaira);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceList, setEvidenceList] = useState<
    Array<{
      storage_path: string;
      file_name: string;
      mime_type: string;
      description?: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleEvidenceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploadingEvidence(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucketId", "dispute-evidence");
      const res = await uploadFileAction(fd);
      if (!res.success || !res.path) {
        setError(res.error || "Failed to upload evidence file.");
        return;
      }
      setEvidenceList((prev) => [
        ...prev,
        {
          storage_path: res.path!,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          description: evidenceDescription.trim() || undefined,
        },
      ]);
      setEvidenceDescription("");
    } finally {
      setIsUploadingEvidence(false);
      e.target.value = "";
    }
  };

  const handleAddEvidence = () => {
    if (!evidenceInput.trim()) return;
    const path = evidenceInput.trim();
    const fileName = path.split("/").pop() || "evidence_document.jpg";
    const mime = path.endsWith(".pdf") ? "application/pdf" : "image/jpeg";

    setEvidenceList([
      ...evidenceList,
      {
        storage_path: path,
        file_name: fileName,
        mime_type: mime,
        description: evidenceDescription.trim() || undefined,
      },
    ]);
    setEvidenceInput("");
    setEvidenceDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.trim().length < 10) {
      setError("Please provide a detailed dispute description (minimum 10 characters).");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("category", category);
    formData.append("description", description.trim());
    formData.append("disputedAmountNaira", disputedAmount.toString());
    formData.append("evidenceJson", JSON.stringify(evidenceList));

    startTransition(async () => {
      const res = await submitDisputeAction(formData);
      if (res.ok) {
        onSuccess?.();
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#15181C]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl max-w-lg w-full p-4 sm:p-6 md:p-8 space-y-5 shadow-2xl border border-[#E6E0D8] dark:border-[#2E343B] max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h3 className="text-xl font-black text-[#1F2328] dark:text-[#FAF7F3]">
                File Service Dispute
              </h3>
            </div>
            <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-1">
              Booking #{referenceCode} with <span className="font-semibold text-[#1F2328] dark:text-[#FAF7F3]">{proName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Accountability Protection Warning */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>🛡️ Escrow Protection Active</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
            A disputed booking <strong>will not automatically complete or release payment</strong>. An EasyLife administrator will investigate your evidence, communicate with both parties, and document a formal resolution.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Dispute Category *
            </label>
            <div className="space-y-2">
              {DISPUTE_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    category === cat.value
                      ? "border-red-500 bg-red-50 dark:bg-red-950/60/50 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-[#2E343B] hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">{cat.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{cat.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Disputed Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Disputed Amount (₦ Naira) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={disputedAmount}
              onChange={(e) => setDisputedAmount(parseFloat(e.target.value) || 0)}
              className="w-full p-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Default is agreed escrow total (₦{agreedAmountNaira.toLocaleString("en-NG")}).
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider mb-1">
              Describe the Issue in Detail *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide chronological facts: dates, actions promised vs executed, defects observed, unapproved charges demanded..."
              className="w-full p-3 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Minimum 10 characters</span>
              <span>{description.length} chars</span>
            </div>
          </div>

          {/* Evidence Uploads */}
          <div>
            <label className="block text-xs font-bold text-[#1F2328] dark:text-[#FAF7F3] uppercase tracking-wider mb-1">
              Supporting Evidence (Photographs / Documents / Receipts)
            </label>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleEvidenceFileUpload}
                  disabled={isUploadingEvidence}
                  className="flex-1 p-2 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs bg-white dark:bg-[#1F2328] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1F2328] file:text-white"
                />
              </div>
              <input
                type="text"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="Or paste existing evidence URL / storage path (optional)"
                className="w-full p-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Caption / description (e.g. Photo of leak after specialist departed)"
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  disabled={isUploadingEvidence}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 disabled:opacity-50"
                >
                  {isUploadingEvidence ? "Uploading..." : "Attach Reference"}
                </button>
              </div>
            </div>

            {evidenceList.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {evidenceList.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-[#1F2328] p-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B]">
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">{ev.file_name}</span>
                      {ev.description && <span className="text-slate-500 dark:text-slate-400 block truncate">{ev.description}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEvidenceList(evidenceList.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 font-bold shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 text-center"
            >
              {isPending ? "Submitting Dispute..." : "Submit Formal Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
