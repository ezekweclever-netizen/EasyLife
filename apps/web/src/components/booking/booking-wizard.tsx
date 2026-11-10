"use client";

import { useState } from "react";
import Link from "next/link";
import { createBookingAction } from "@/app/actions/booking";
import { uploadFileAction } from "@/app/actions/storage";
import type { ServiceCategoryItem, PublicProfessionalItem } from "@/lib/supabase/customer";

export interface BookingWizardProps {
  categories: ServiceCategoryItem[];
  preSelectedCategory?: string;
  preSelectedPro?: PublicProfessionalItem | null;
  defaultCity?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialUrgency?: "normal" | "high" | "emergency";
  userEmail?: string;
  userName?: string;
}

const NIGERIAN_CITIES = [
  {
    name: "Port Harcourt",
    state: "Rivers State",
    lgas: ["Obio-Akpor (GRA, Woji, Rumuola, Choba)", "Port Harcourt City (Old GRA, D-Line, Borokiri)", "Eleme", "Oyigbo"],
  },
  {
    name: "Lagos",
    state: "Lagos State",
    lgas: ["Eti-Osa (Lekki, VI, Ikoyi)", "Ikeja (GRA, Maryland)", "Surulere", "Alimosho", "Yaba / Lagos Mainland"],
  },
  {
    name: "Abuja",
    state: "Federal Capital Territory",
    lgas: ["Abuja Municipal (Maitama, Wuse 2, Garki, Asokoro)", "Bwari (Kubwa, Bwari)", "Gwagwalada"],
  },
];

export function BookingWizard({
  categories,
  preSelectedCategory,
  preSelectedPro,
  defaultCity = "Port Harcourt",
  initialTitle,
  initialDescription,
  initialUrgency,
  userEmail,
  userName,
}: BookingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [categoryId, setCategoryId] = useState(preSelectedCategory || (categories[0]?.id || ""));
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [urgency, setUrgency] = useState<"normal" | "high" | "emergency">(initialUrgency || "normal");

  // Attachments State
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; file: File }>>([]);

  // Location & Schedule State
  const [city, setCity] = useState(defaultCity);
  const [lgaOrDistrict, setLgaOrDistrict] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("Morning (8:00 AM – 12:00 PM)");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    referenceCode: string;
  } | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const currentCityConfig = NIGERIAN_CITIES.find((c) => c.name === city) || NIGERIAN_CITIES[0]!;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const valid = files.slice(0, 5).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!categoryId) errs.categoryId = "Please select a service category.";
    if (!title.trim() || title.trim().length < 5) {
      errs.title = "Please provide a concise title (minimum 5 characters).";
    }
    if (!description.trim() || description.trim().length < 15) {
      errs.description = "Please describe the problem or fault in at least 15 characters.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!serviceAddress.trim() || serviceAddress.trim().length < 6) {
      errs.serviceAddress = "Please enter your full street address or estate and house number.";
    }
    if (!preferredDate) {
      errs.preferredDate = "Please choose a preferred service date.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const uploadedAttachmentLines: string[] = [];
    for (const item of attachments) {
      const uploadForm = new FormData();
      uploadForm.append("file", item.file);
      uploadForm.append("bucketId", "booking-attachments");
      const upRes = await uploadFileAction(uploadForm);
      if (!upRes.success || !upRes.path) {
        setSubmissionError(upRes.error || `Failed to upload attachment "${item.name}".`);
        setIsSubmitting(false);
        return;
      }
      uploadedAttachmentLines.push(`${item.name} (${upRes.path})`);
    }

    const combinedInstructions = [
      additionalInstructions.trim(),
      uploadedAttachmentLines.length > 0
        ? `Uploaded Attachments: ${uploadedAttachmentLines.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const formData = new FormData();
    formData.append("categoryId", categoryId || "");
    formData.append("title", title || "");
    formData.append("description", description || "");
    formData.append("urgency", urgency || "normal");
    formData.append("city", city || "Port Harcourt");
    formData.append("lgaOrDistrict", lgaOrDistrict || "");
    formData.append("serviceAddress", serviceAddress || "");
    formData.append("preferredDate", preferredDate || "");
    formData.append("preferredTimeSlot", preferredTimeSlot || "");
    formData.append("additionalInstructions", combinedInstructions);

    if (preSelectedPro?.professional_id) {
      formData.append("professionalId", preSelectedPro.professional_id);
    }

    try {
      const result = await createBookingAction(
        { status: "idle", message: "" },
        formData
      );

      if (result.status === "success" && result.bookingId && result.referenceCode) {
        setCreatedBooking({
          id: result.bookingId,
          referenceCode: result.referenceCode,
        });
      } else {
        setSubmissionError(result.message || "Failed to submit request.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CONFIRMATION SCREEN (Requirement Met)
  // ==========================================
  if (createdBooking) {
    const selectedCat = categories.find((c) => c.id === categoryId);

    return (
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-sm space-y-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#F0FDFA] text-[#0F766E] mx-auto flex items-center justify-center text-4xl shadow-inner">
          ✓
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
            Request Successfully Submitted
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            Service Request Confirmed!
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            Your request has been broadcast to accredited technicians in {city}. You will receive quotation(s) shortly.
          </p>
        </div>

        {/* Reference Number Box */}
        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Booking Reference Code</span>
            <span className="font-semibold text-[#0F766E]">Save this code</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#0F766E] tracking-wider">
              {createdBooking.referenceCode}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdBooking.referenceCode)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-white text-[#334155] transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* Next Steps Timeline */}
        <div className="text-left space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">What happens next:</h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <p className="font-bold text-[#0F172A]">Technician Matching</p>
                <p className="text-[#64748B]">Nearby verified pros review your fault details and prepare a written quote.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <p className="font-bold text-[#0F172A]">Review & Approve Quote</p>
                <p className="text-[#64748B]">You inspect the itemized parts and labor breakdown, then approve with one click.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <p className="font-bold text-[#0F172A]">Escrow Payment & Arrival</p>
                <p className="text-[#64748B]">Your funds are held securely in escrow. Technician arrives at your preferred schedule.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/bookings/${createdBooking.id}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm"
          >
            View Booking Details
          </Link>
          <Link
            href="/bookings"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] transition-colors"
          >
            My Bookings History
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROGRESS INDICATOR (Step 1 -> 2 -> 3 -> 4)
  // ==========================================
  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[
            { num: 1, label: "Fault Details" },
            { num: 2, label: "Photos / Media" },
            { num: 3, label: "Location & Time" },
            { num: 4, label: "Review & Submit" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num as any)}
                  disabled={s.num > step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step === s.num
                      ? "bg-[#0F766E] text-white shadow-xs"
                      : step > s.num
                      ? "bg-[#CCFBF1] text-[#0F766E]"
                      : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </button>
                <span className="text-[10px] font-medium text-[#64748B] mt-1 hidden sm:block">
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`w-10 sm:w-16 h-0.5 mx-1 transition-colors ${
                    step > s.num ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{submissionError}</span>
          </div>
        )}

        {/* Pre-Selected Professional Notice */}
        {preSelectedPro && (
          <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-between text-xs text-[#0F766E]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                {preSelectedPro.display_name ? preSelectedPro.display_name[0] : "P"}
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">Direct Request for {preSelectedPro.business_name || preSelectedPro.display_name}</p>
                <p className="text-[#64748B]">This pro will be sent your request first.</p>
              </div>
            </div>
            <span className="font-semibold text-emerald-700">✓ Assigned</span>
          </div>
        )}

        {/* STEP 1: FAULT DETAILS */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">1. Service Category & Fault Description</h2>
              <p className="text-xs text-[#64748B]">Tell us what trade specialization and repair you need</p>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label htmlFor="cat-select" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Select Service Category <span className="text-red-500">*</span>
              </label>
              <select
                id="cat-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <p className="text-xs text-red-600">{fieldErrors.categoryId}</p>
              )}
            </div>

            {/* Title / Summary */}
            <div className="space-y-1.5">
              <label htmlFor="title-input" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Brief Title / Summary <span className="text-red-500">*</span>
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2.5HP Standing AC not cooling in living room"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="desc-input" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Detailed Fault Description <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-[#94A3B8]">{description.length} / 1000</span>
              </div>
              <textarea
                id="desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is happening, error codes, leaking pipes, unusual sounds, when the fault started, and any parts that may need replacement..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Urgency Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "normal", label: "Standard", desc: "Within scheduled date/time", badge: "Standard" },
                  { id: "high", label: "Urgent", desc: "Same-day priority dispatch", badge: "Same Day" },
                  { id: "emergency", label: "Emergency", desc: "Immediate 2-hour response", badge: "🚨 24/7" },
                ].map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrgency(u.id as any)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      urgency === u.id
                        ? "border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]"
                        : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F172A]">{u.label}</span>
                      <span className="text-[10px] font-semibold text-[#0F766E]">{u.badge}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">{u.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs"
              >
                Next: Attach Photos →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ATTACHMENTS & MEDIA */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">2. Photos & Video Attachments</h2>
              <p className="text-xs text-[#64748B]">Attaching clear photos helps technicians provide faster, accurate quotations</p>
            </div>

            {/* Drag & Drop Upload Area */}
            <div className="border-2 border-dashed border-[#CBD5E1] rounded-2xl p-6 text-center space-y-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
              <div className="w-12 h-12 rounded-full bg-white text-[#0F766E] text-2xl mx-auto flex items-center justify-center shadow-xs">
                📷
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Upload fault photographs or video clips</p>
                <p className="text-xs text-[#64748B]">Supports JPEG, PNG, WebP, MP4 (Max 5 files, 10MB each)</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] cursor-pointer transition-colors shadow-xs">
                <span>Select Files from Device</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Preview Grid */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Attached Files ({attachments.length} / 5)
                </span>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{file.type.startsWith("video") ? "🎥" : "🖼️"}</span>
                        <span className="font-semibold text-[#0F172A] truncate">{file.name}</span>
                        <span className="text-[#94A3B8]">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs"
              >
                Next: Location & Schedule →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & SCHEDULE */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">3. Service Location & Preferred Schedule</h2>
              <p className="text-xs text-[#64748B]">Provide the property address and convenient arrival time</p>
            </div>

            {/* City Selector */}
            <div className="space-y-1.5">
              <label htmlFor="city-select" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Service City <span className="text-red-500">*</span>
              </label>
              <select
                id="city-select"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setLgaOrDistrict("");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                {NIGERIAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* LGA / District Select */}
            <div className="space-y-1.5">
              <label htmlFor="lga-select" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                LGA / District
              </label>
              <select
                id="lga-select"
                value={lgaOrDistrict}
                onChange={(e) => setLgaOrDistrict(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="">Select LGA or District (Optional)</option>
                {currentCityConfig.lgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>

            {/* Physical Address */}
            <div className="space-y-1.5">
              <label htmlFor="addr-input" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Street Address, Flat / Estate Name & Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-input"
                type="text"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="e.g. Flat 3B, Plot 14, Peter Odili Road, Opposite Total Filling Station"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {fieldErrors.serviceAddress && (
                <p className="text-xs text-red-600">{fieldErrors.serviceAddress}</p>
              )}
            </div>

            {/* Schedule Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="date-input" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                {fieldErrors.preferredDate && (
                  <p className="text-xs text-red-600">{fieldErrors.preferredDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="slot-select" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Preferred Time Slot
                </label>
                <select
                  id="slot-select"
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="Morning (8:00 AM – 12:00 PM)">Morning (8:00 AM – 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM – 4:00 PM)">Afternoon (12:00 PM – 4:00 PM)</option>
                  <option value="Evening (4:00 PM – 7:00 PM)">Evening (4:00 PM – 7:00 PM)</option>
                  <option value="Emergency (Immediate Dispatch)">Emergency (Immediate Dispatch)</option>
                </select>
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="space-y-1.5">
              <label htmlFor="notes-input" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Additional Access Instructions (Optional)
              </label>
              <textarea
                id="notes-input"
                rows={2}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Estate security code, visitor parking details, watch out for dog in compound, ask for Mrs. Amadi..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs"
              >
                Next: Review Request →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">4. Review & Confirm Service Request</h2>
              <p className="text-xs text-[#64748B]">Please verify your booking details before sending to dispatch</p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block text-xs">Service Category</span>
                  <span className="font-bold text-[#0F172A]">
                    {categories.find((c) => c.id === categoryId)?.name || "General Maintenance"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Urgency</span>
                  <span className="font-bold capitalize text-[#0F766E]">{urgency}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Preferred Schedule</span>
                  <span className="font-bold text-[#0F172A]">{preferredDate} — {preferredTimeSlot}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Service City</span>
                  <span className="font-bold text-[#0F172A]">{city}</span>
                </div>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Summary Title</span>
                <span className="font-bold text-[#0F172A]">{title}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Problem Description</span>
                <p className="text-[#334155] whitespace-pre-line bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  {description}
                </p>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Address & Instructions</span>
                <p className="text-[#334155] font-medium">
                  {serviceAddress} {lgaOrDistrict ? `(${lgaOrDistrict})` : ""}
                </p>
                {additionalInstructions && (
                  <p className="text-[#64748B] mt-1 italic">
                    Note: {additionalInstructions}
                  </p>
                )}
              </div>

              {attachments.length > 0 && (
                <div>
                  <span className="text-[#64748B] block text-xs">Attached Media</span>
                  <span className="font-semibold text-[#0F766E]">{attachments.length} file(s) attached</span>
                </div>
              )}
            </div>

            {/* Escrow Guarantee Callout */}
            <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0F766E] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️ Zero Upfront Risk Guarantee</span>
              </p>
              <p className="text-[#134E4A] leading-relaxed">
                Submitting this request does not charge your card. You will receive quotation(s) with parts and labor breakdown. Payment is funded into protected EasyLife escrow only when you approve the quote.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
                disabled={isSubmitting}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting to Dispatch...</span>
                  </>
                ) : (
                  <span>Confirm & Submit Request ✓</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
