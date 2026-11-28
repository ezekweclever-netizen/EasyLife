"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBookingAction } from "@/app/actions/booking";
import { uploadFileAction } from "@/app/actions/storage";
import type { ServiceCategoryItem, PublicProfessionalItem } from "@/lib/supabase/customer";
import type { CatalogueServiceItem } from "@easylife/shared-types";
import { formatServicePriceRange } from "@/lib/catalogue-display";

export interface BookingWizardProps {
  categories: ServiceCategoryItem[];
  preSelectedCategory?: string;
  preSelectedSubcategoryId?: string;
  preSelectedService?: CatalogueServiceItem | null;
  unavailableServiceNotice?: {
    name: string;
    reason: string;
    categorySlug?: string;
  } | null;
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
  preSelectedSubcategoryId,
  preSelectedService,
  unavailableServiceNotice = null,
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

  useEffect(() => {
    setCity(defaultCity);
    setLgaOrDistrict("");
  }, [defaultCity]);

  const currentCityConfig = NIGERIAN_CITIES.find((c) => c.name === city) || NIGERIAN_CITIES[0]!;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSubmissionError(null);
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    const maxBytes = 8 * 1024 * 1024;
    const files = Array.from(e.target.files);
    const rejected: string[] = [];
    const valid = files
      .filter((f) => {
        const mime = (f.type || "").toLowerCase();
        const ext = f.name.toLowerCase().split(".").pop() || "";
        const validExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);
        if ((!allowedTypes.has(mime) && !validExt) || f.size <= 0 || f.size > maxBytes) {
          rejected.push(f.name);
          return false;
        }
        return true;
      })
      .slice(0, 5)
      .map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
      }));

    if (rejected.length > 0) {
      setSubmissionError(
        `Skipped invalid or oversized file(s): ${rejected.join(", ")}. Only JPEG, PNG, WebP, or PDF up to 8MB are supported.`
      );
    }

    setAttachments((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = "";
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

    const uploadedAttachments: Array<{
      storage_bucket: string;
      storage_path: string;
      file_name: string;
      mime_type: string;
      file_size_bytes: number;
    }> = [];
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
      uploadedAttachments.push({
        storage_bucket: "booking-attachments",
        storage_path: upRes.path,
        file_name: item.name,
        mime_type: item.type || "application/octet-stream",
        file_size_bytes: item.size,
      });
    }

    const formData = new FormData();
    formData.append("categoryId", categoryId || "");
    if (
      preSelectedService?.id &&
      (!preSelectedService.category_id || preSelectedService.category_id === categoryId)
    ) {
      formData.append("serviceId", preSelectedService.id);
      if (preSelectedService.subcategory_id || preSelectedSubcategoryId) {
        formData.append(
          "subcategoryId",
          preSelectedService.subcategory_id || preSelectedSubcategoryId || ""
        );
      }
    } else if (preSelectedSubcategoryId && preSelectedCategory === categoryId) {
      formData.append("subcategoryId", preSelectedSubcategoryId);
    }
    formData.append("title", title || "");
    formData.append("description", description || "");
    formData.append("urgency", urgency || "normal");
    formData.append("city", city || "Port Harcourt");
    formData.append("lgaOrDistrict", lgaOrDistrict || "");
    formData.append("serviceAddress", serviceAddress || "");
    formData.append("preferredDate", preferredDate || "");
    formData.append("preferredTimeSlot", preferredTimeSlot || "");
    formData.append("additionalInstructions", additionalInstructions.trim());
    if (uploadedAttachments.length > 0) {
      formData.append("attachmentsJson", JSON.stringify(uploadedAttachments));
    }

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
      <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] p-6 sm:p-10 shadow-sm space-y-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#FCEBDD] text-[#E8590C] mx-auto flex items-center justify-center text-4xl shadow-inner">
          ✓
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FCEBDD] text-[#E8590C] border border-[#FCEBDD]">
            Request Sent Successfully
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2328]">
            Your Request Has Been Sent!
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            Verified technicians in {city} have been notified. You will receive quotes shortly.
          </p>
        </div>

        {/* Reference Number Box */}
        <div className="p-5 rounded-2xl bg-[#FAF7F3] border border-[#E6E0D8] space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Booking Reference Code</span>
            <span className="font-semibold text-[#E8590C]">Save this code</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#E8590C] tracking-wider">
              {createdBooking.referenceCode}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdBooking.referenceCode)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-white dark:bg-[#1F2328] text-[#4A525C] transition-colors"
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
              <span className="w-6 h-6 rounded-full bg-[#E8590C] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <p className="font-bold text-[#1F2328]">Technician Matching</p>
                <p className="text-[#64748B]">Nearby verified pros review your fault details and prepare a written quote.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E6E0D8] text-[#475569] flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <p className="font-bold text-[#1F2328]">Review & Approve Quote</p>
                <p className="text-[#64748B]">You inspect the itemized parts and labor breakdown, then approve with one click.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E6E0D8] text-[#475569] flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <p className="font-bold text-[#1F2328]">Escrow Payment & Arrival</p>
                <p className="text-[#64748B]">Your funds are held securely in escrow. Technician arrives at your preferred schedule.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/bookings/${createdBooking.id}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-sm"
          >
            View Booking Details
          </Link>
          <Link
            href="/bookings"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#4A525C] hover:bg-[#FAF7F3] transition-colors"
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
    <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] shadow-sm overflow-hidden max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-[#FAF7F3] border-b border-[#E6E0D8] px-6 py-4">
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
                      ? "bg-[#E8590C] text-white shadow-xs"
                      : step > s.num
                      ? "bg-[#FCEBDD] text-[#E8590C]"
                      : "bg-[#E6E0D8] text-[#64748B]"
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
                    step > s.num ? "bg-[#E8590C]" : "bg-[#E6E0D8]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{submissionError}</span>
          </div>
        )}

        {/* Temporarily Unavailable Catalogue Service Notice */}
        {unavailableServiceNotice && (
          <div
            role="status"
            className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-950 space-y-2 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm">
                &ldquo;{unavailableServiceNotice.name}&rdquo; is Currently Unavailable
              </span>
              <div className="flex items-center gap-2">
                {unavailableServiceNotice.categorySlug && (
                  <Link
                    href={`/explore-services?cat=${encodeURIComponent(unavailableServiceNotice.categorySlug)}`}
                    className="font-bold text-[#E8590C] hover:underline"
                  >
                    View Active Alternatives →
                  </Link>
                )}
                <Link
                  href="/services"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Catalogue
                </Link>
              </div>
            </div>
            <p className="text-amber-900 leading-relaxed">
              {unavailableServiceNotice.reason} You can continue below to submit a custom request under the matching parent category so verified specialists can review and quote your scope.
            </p>
          </div>
        )}

        {/* Pre-Selected Catalogue Service Notice */}
        {preSelectedService && (
          <div className="p-4 rounded-xl bg-[#EEF9F9] border border-[#E8590C]/30 space-y-2 text-xs text-[#1F2328]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#1F2328] text-white font-mono font-bold text-[10px]">
                  {preSelectedService.service_code}
                </span>
                <p className="font-bold text-sm text-[#1F2328]">
                  {preSelectedService.name}
                </p>
              </div>
              <span className="font-bold text-[#E8590C]">
                {formatServicePriceRange(
                  preSelectedService.base_price_min_kobo,
                  preSelectedService.base_price_max_kobo
                )}
              </span>
            </div>
            {preSelectedService.short_description && (
              <p className="text-[#4E6065] leading-relaxed">
                {preSelectedService.short_description}
              </p>
            )}
            {(preSelectedService.requirements || []).filter(
              (r) => r.applies_to === "customer" || r.applies_to === "both"
            ).length > 0 && (
              <div className="pt-2 border-t border-[#E8590C]/20 space-y-1">
                <p className="font-bold text-[11px] uppercase tracking-wider text-[#E8590C]">
                  Helpful Details to Include:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[#4A525C]">
                  {(preSelectedService.requirements || [])
                    .filter((r) => r.applies_to === "customer" || r.applies_to === "both")
                    .slice(0, 3)
                    .map((req) => (
                      <li key={req.id}>
                        <span className="font-semibold">{req.title}</span>
                        {req.description ? ` — ${req.description}` : ""}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Pre-Selected Professional Notice */}
        {preSelectedPro && (
          <div className="p-4 rounded-xl bg-[#FCEBDD] border border-[#FCEBDD] flex items-center justify-between text-xs text-[#E8590C]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E8590C] text-white flex items-center justify-center font-bold text-xs">
                {preSelectedPro.display_name ? preSelectedPro.display_name[0] : "P"}
              </div>
              <div>
                <p className="font-bold text-[#1F2328]">Direct Request for {preSelectedPro.business_name || preSelectedPro.display_name}</p>
                <p className="text-[#64748B]">This pro will be sent your request first.</p>
              </div>
            </div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">✓ Assigned</span>
          </div>
        )}

        {/* STEP 1: FAULT DETAILS */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#1F2328]">1. Service Category & Fault Description</h2>
              <p className="text-xs text-[#64748B]">Tell us what trade specialization and repair you need</p>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label htmlFor="cat-select" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                Select Service Category <span className="text-red-500">*</span>
              </label>
              <select
                id="cat-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
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
              <label htmlFor="title-input" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                Brief Title / Summary <span className="text-red-500">*</span>
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2.5HP Standing AC not cooling in living room"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
              />
              {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="desc-input" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
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
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
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
                        ? "border-[#E8590C] bg-[#FCEBDD] ring-1 ring-[#E8590C]"
                        : "border-[#E6E0D8] hover:border-[#CBD5E1] bg-white dark:bg-[#1F2328]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1F2328]">{u.label}</span>
                      <span className="text-[10px] font-semibold text-[#E8590C]">{u.badge}</span>
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
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-xs"
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
              <h2 className="text-xl font-bold text-[#1F2328]">2. Fault Photos &amp; Document Attachments</h2>
              <p className="text-xs text-[#64748B]">Attaching clear photos or PDFs helps technicians provide faster, accurate quotations</p>
            </div>

            {/* Drag & Drop Upload Area */}
            <div className="border-2 border-dashed border-[#CBD5E1] rounded-2xl p-6 text-center space-y-3 bg-[#FAF7F3] hover:bg-[#FAF7F3] transition-colors">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1F2328] text-[#E8590C] text-2xl mx-auto flex items-center justify-center shadow-xs">
                📷
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2328]">Upload fault photographs or supporting PDFs</p>
                <p className="text-xs text-[#64748B]">Supports JPEG, PNG, WebP, and PDF (Max 5 files, 8MB each)</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#E8590C] text-white hover:bg-[#C84A06] cursor-pointer transition-colors shadow-xs">
                <span>Select Files from Device</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Preview Grid */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                  Attached Files ({attachments.length} / 5)
                </span>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1F2328] border border-[#E6E0D8] text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{file.type.startsWith("video") ? "🎥" : "🖼️"}</span>
                        <span className="font-semibold text-[#1F2328] truncate">{file.name}</span>
                        <span className="text-[#94A3B8]">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 font-semibold text-xs ml-2"
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
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#4A525C] hover:bg-[#FAF7F3]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-xs"
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
              <h2 className="text-xl font-bold text-[#1F2328]">3. Service Location & Preferred Schedule</h2>
              <p className="text-xs text-[#64748B]">Provide the property address and convenient arrival time</p>
            </div>

            {/* City Selector */}
            <div className="space-y-1.5">
              <label htmlFor="city-select" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                Service City <span className="text-red-500">*</span>
              </label>
              <select
                id="city-select"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setLgaOrDistrict("");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
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
              <label htmlFor="lga-select" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                LGA / District
              </label>
              <select
                id="lga-select"
                value={lgaOrDistrict}
                onChange={(e) => setLgaOrDistrict(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
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
              <label htmlFor="addr-input" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                Street Address, Flat / Estate Name & Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-input"
                type="text"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="e.g. Flat 3B, Plot 14, Peter Odili Road, Opposite Total Filling Station"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
              />
              {fieldErrors.serviceAddress && (
                <p className="text-xs text-red-600">{fieldErrors.serviceAddress}</p>
              )}
            </div>

            {/* Schedule Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="date-input" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
                />
                {fieldErrors.preferredDate && (
                  <p className="text-xs text-red-600">{fieldErrors.preferredDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="slot-select" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                  Preferred Time Slot
                </label>
                <select
                  id="slot-select"
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
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
              <label htmlFor="notes-input" className="block text-xs font-bold text-[#4A525C] uppercase tracking-wider">
                Additional Access Instructions (Optional)
              </label>
              <textarea
                id="notes-input"
                rows={2}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Estate security code, visitor parking details, watch out for dog in compound, ask for Mrs. Amadi..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#4A525C] hover:bg-[#FAF7F3]"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-xs"
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
              <h2 className="text-xl font-bold text-[#1F2328]">4. Review & Confirm Service Request</h2>
              <p className="text-xs text-[#64748B]">Please verify your booking details before sending to dispatch</p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-[#FAF7F3] border border-[#E6E0D8] space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E6E0D8]">
                <div>
                  <span className="text-[#64748B] block text-xs">Service Category</span>
                  <span className="font-bold text-[#1F2328]">
                    {categories.find((c) => c.id === categoryId)?.name || "General Maintenance"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Urgency</span>
                  <span className="font-bold capitalize text-[#E8590C]">{urgency}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Preferred Schedule</span>
                  <span className="font-bold text-[#1F2328]">{preferredDate} — {preferredTimeSlot}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-xs">Service City</span>
                  <span className="font-bold text-[#1F2328]">{city}</span>
                </div>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Summary Title</span>
                <span className="font-bold text-[#1F2328]">{title}</span>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Problem Description</span>
                <p className="text-[#4A525C] whitespace-pre-line bg-white dark:bg-[#1F2328] p-3 rounded-xl border border-[#E6E0D8]">
                  {description}
                </p>
              </div>

              <div>
                <span className="text-[#64748B] block text-xs">Address & Instructions</span>
                <p className="text-[#4A525C] font-medium">
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
                  <span className="font-semibold text-[#E8590C]">{attachments.length} file(s) attached</span>
                </div>
              )}
            </div>

            {/* Escrow Guarantee Callout */}
            <div className="p-4 rounded-xl bg-[#FCEBDD] border border-[#FCEBDD] text-xs text-[#E8590C] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️ Zero Upfront Risk Guarantee</span>
              </p>
              <p className="text-[#4A525C] leading-relaxed">
                Submitting this request does not charge your card. You will receive quotation(s) with parts and labor breakdown. Payment is funded into protected EasyLife escrow only when you approve the quote.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#CBD5E1] text-[#4A525C] hover:bg-[#FAF7F3]"
                disabled={isSubmitting}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-bold text-sm bg-[#E8590C] text-white hover:bg-[#C84A06] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <span>Send Request ✓</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
