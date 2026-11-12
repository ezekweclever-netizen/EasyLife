"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleProfessionalGlobalAvailabilityAction,
  updateProfessionalProfileAction,
} from "@/app/actions/pro";
import { PILOT_CITIES } from "@/lib/validation/forms";
import type { ProfessionalProfile } from "@/lib/supabase/pro";
import type { ProviderType } from "@easylife/shared-types";

interface ProProfileEditorProps {
  profile: ProfessionalProfile;
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  trade_technician: "Trade Technician",
  dispatch_rider: "Delivery & Dispatch",
  property_agent: "Property & Tenancy Consultant",
  general_artisan: "Everyday Helper / Artisan",
};

export function ProProfileEditor({ profile }: ProProfileEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const [isAvailable, setIsAvailable] = useState(profile.is_available);
  const [businessName, setBusinessName] = useState(profile.business_name);
  const [headline, setHeadline] = useState(profile.headline || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    String(profile.years_of_experience ?? 0)
  );
  const [baseCalloutFeeNaira, setBaseCalloutFeeNaira] = useState(
    String(Math.round((profile.base_callout_fee_kobo || 0) / 100))
  );
  const [primaryCity, setPrimaryCity] = useState(profile.primary_city || "Port Harcourt");
  const [providerType, setProviderType] = useState<ProviderType>(
    (profile.provider_type as ProviderType) || "trade_technician"
  );
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleToggleAvailability = () => {
    const nextState = !isAvailable;
    setFeedback(null);
    setIsAvailable(nextState);

    startTransition(async () => {
      const res = await toggleProfessionalGlobalAvailabilityAction(profile.id, nextState);
      if (!res.ok) {
        setIsAvailable(!nextState);
      } else {
        router.refresh();
      }
      setFeedback({ ok: res.ok, msg: res.message });
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateProfessionalProfileAction({
        professionalId: profile.id,
        businessName,
        headline,
        bio,
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
        baseCalloutFeeNaira: parseFloat(baseCalloutFeeNaira) || 0,
        primaryCity,
        providerType,
      });

      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Business &amp; Trade Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Public profile details, provider classification, and live booking availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleAvailability}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
              isAvailable
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            {isAvailable ? "● Available for Jobs (Switch Off)" : "○ Unavailable (Switch On)"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsEditing((prev) => !prev);
              setFeedback(null);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            {isEditing ? "Cancel Edit" : "Edit Business Details"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            feedback.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trade / Business Name *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Provider Classification
              </label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              >
                {Object.entries(PROVIDER_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Operating Hub
              </label>
              <select
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              >
                {PILOT_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Years of Practical Experience *
              </label>
              <input
                type="number"
                min="0"
                max="70"
                required
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Call-out Diagnosis Fee (₦ NGN)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={baseCalloutFeeNaira}
                onChange={(e) => setBaseCalloutFeeNaira(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Professional Bio &amp; Capabilities (min 20 characters) *
            </label>
            <textarea
              rows={4}
              required
              minLength={20}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Trade / Business Name</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {profile.business_name}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Provider Classification</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">
                {PROVIDER_TYPE_LABELS[profile.provider_type || "trade_technician"] ||
                  profile.provider_type}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Primary Hub</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">
                {profile.primary_city}, {profile.primary_state}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Headline</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">
                {profile.headline || "Specialist Service Professional"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Years of Experience</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {profile.years_of_experience} Years
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Base Call-out Diagnosis Fee</span>
              <span className="text-sm font-bold text-[#0D9488] mt-1 block">
                ₦{Math.round((profile.base_callout_fee_kobo || 0) / 100).toLocaleString("en-NG")}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium block text-xs mb-1">
              Professional Bio &amp; Capabilities
            </span>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {profile.bio || "No description provided."}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
