"use client";

import React, { useState, useRef, useTransition } from "react";
import { uploadAvatarAction, removeAvatarAction } from "@/app/actions/profile";

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string | null;
  fallbackInitial?: string;
  size?: "md" | "lg";
  className?: string;
  onAvatarChange?: (url: string | null) => void;
}

export function ProfilePhotoUploader({
  currentAvatarUrl,
  fallbackInitial = "U",
  size = "lg",
  className = "",
  onAvatarChange,
}: ProfilePhotoUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("File size must not exceed 2 MB.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Please choose a valid JPG, PNG, or WebP image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await uploadAvatarAction(formData);
      if (!res.ok || !res.avatarUrl) {
        setErrorMsg(res.error || "Failed to upload profile photo.");
      } else {
        setAvatarUrl(res.avatarUrl);
        setSuccessMsg("Profile photo updated successfully!");
        onAvatarChange?.(res.avatarUrl);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleRemove = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await removeAvatarAction();
      if (!res.ok) {
        setErrorMsg(res.error || "Failed to remove photo.");
      } else {
        setAvatarUrl(null);
        setSuccessMsg("Profile photo removed.");
        onAvatarChange?.(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const dimClass = size === "lg" ? "w-20 h-20 sm:w-24 sm:h-24" : "w-14 h-14 sm:w-16 sm:h-16";
  const textClass = size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Avatar Display */}
        <div
          className={`relative ${dimClass} rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold ${textClass} uppercase shadow-md overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{fallbackInitial}</span>
          )}

          {isPending && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id="avatar-file-input"
            disabled={isPending}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#0D655E] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {avatarUrl ? "Change Photo" : "Upload Photo"}
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleRemove}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-red-200 dark:border-red-800 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/60 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            JPG, PNG or WebP. Max file size: 2 MB.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 dark:bg-red-950/40 border border-red-200 dark:border-red-800 dark:border-red-900 text-xs text-red-700 dark:text-red-400 dark:text-red-300 font-medium"
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium"
        >
          {successMsg}
        </div>
      )}
    </div>
  );
}
