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
import { ProfilePhotoUploader } from "@/components/ui/profile-photo-uploader";

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
    <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Business &amp; Trade Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
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
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328] transition"
          >
            {isEditing ? "Cancel Edit" : "Edit Business Details"}
          </button>
        </div>
      </div>

      {/* Profile Photo Uploader */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          Professional Avatar / Badge Photo
        </h3>
        <ProfilePhotoUploader
          currentAvatarUrl={profile.avatar_url}
          fallbackInitial={profile.business_name.slice(0, 2).toUpperCase()}
          size="md"
        />
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            feedback.ok
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900"
              : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Trade / Business Name *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Provider Classification
              </label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              >
                {Object.entries(PROVIDER_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Primary Operating Hub
              </label>
              <select
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              >
                {PILOT_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Years of Practical Experience *
              </label>
              <input
                type="number"
                min="0"
                max="70"
                required
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Base Call-out Diagnosis Fee (₦ NGN)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={baseCalloutFeeNaira}
                onChange={(e) => setBaseCalloutFeeNaira(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Professional Bio &amp; Capabilities (min 20 characters) *
            </label>
            <textarea
              rows={4}
              required
              minLength={20}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1F2328]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-[#E8590C] text-white text-xs font-bold hover:bg-[#E8590C] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Trade / Business Name</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                {profile.business_name}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Provider Classification</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">
                {PROVIDER_TYPE_LABELS[profile.provider_type || "trade_technician"] ||
                  profile.provider_type}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Primary Hub</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">
                {profile.primary_city}, {profile.primary_state}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Headline</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">
                {profile.headline || "Specialist Service Professional"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Years of Experience</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                {profile.years_of_experience} Years
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Base Call-out Diagnosis Fee</span>
              <span className="text-sm font-bold text-[#E8590C] mt-1 block">
                ₦{Math.round((profile.base_callout_fee_kobo || 0) / 100).toLocaleString("en-NG")}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block text-xs mb-1">
              Professional Bio &amp; Capabilities
            </span>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-slate-50 dark:bg-[#1F2328]/50 text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
              {profile.bio || "No description provided."}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
