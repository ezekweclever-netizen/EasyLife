"use client";

import React, { useState } from "react";
import { adminUpdatePlatformSettingAction } from "@/app/actions/admin";

interface PlatformSettingItem {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

interface PlatformSettingsClientProps {
  initialSettings: PlatformSettingItem[];
}

export function PlatformSettingsClient({
  initialSettings,
}: PlatformSettingsClientProps) {
  const [settings, setSettings] = useState<PlatformSettingItem[]>(initialSettings);
  const [selectedSetting, setSelectedSetting] = useState<PlatformSettingItem | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [isPublicInput, setIsPublicInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEditor = (setting?: PlatformSettingItem) => {
    setError(null);
    setSuccess(null);
    if (setting) {
      setSelectedSetting(setting);
      setKeyInput(setting.key);
      setValueInput(
        typeof setting.value === "string"
          ? setting.value
          : JSON.stringify(setting.value, null, 2)
      );
      setDescInput(setting.description || "");
      setIsPublicInput(setting.is_public);
    } else {
      setSelectedSetting(null);
      setKeyInput("");
      setValueInput("");
      setDescInput("");
      setIsPublicInput(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("key", keyInput);
    fd.append("value", valueInput);
    fd.append("description", descInput);
    fd.append("isPublic", isPublicInput ? "true" : "false");

    const res = await adminUpdatePlatformSettingAction(fd);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setSuccess(res.message);

    let parsed: unknown = valueInput;
    try {
      parsed = JSON.parse(valueInput);
    } catch {
      parsed = valueInput;
    }

    setSettings((prev) => {
      const idx = prev.findIndex((s) => s.key === keyInput);
      const updated: PlatformSettingItem = {
        id: selectedSetting?.id || String(Date.now()),
        key: keyInput,
        value: parsed,
        description: descInput || null,
        is_public: isPublicInput,
        updated_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    setTimeout(() => {
      setSelectedSetting(null);
      setSuccess(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Add Setting Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-800">
            Platform Operational Configuration
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">
            Key-value configuration switches affecting operational runtimes and marketplace parameters.
          </div>
        </div>

        <button
          onClick={() => openEditor()}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Add Custom Setting</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((s) => (
          <div
            key={s.key}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 hover:border-teal-500 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                {s.key}
              </span>
              <div className="flex items-center gap-2">
                {s.is_public ? (
                  <span className="text-2xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                    Public
                  </span>
                ) : (
                  <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Internal
                  </span>
                )}
                <button
                  onClick={() => openEditor(s)}
                  className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Edit
                </button>
              </div>
            </div>

            {s.description && (
              <p className="text-xs text-slate-500 leading-snug">{s.description}</p>
            )}

            <div className="bg-slate-900 rounded-xl p-3 text-2xs font-mono text-teal-300 overflow-x-auto max-h-36">
              {typeof s.value === "object" ? JSON.stringify(s.value, null, 2) : String(s.value)}
            </div>

            <div className="text-2xs text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Last Updated:</span>
              <span>{new Date(s.updated_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Setting Modal */}
      {(selectedSetting || keyInput) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">
                {selectedSetting ? `Edit Setting: ${selectedSetting.key}` : "Add Platform Setting"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSetting(null);
                  setKeyInput("");
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Setting Key (e.g. maintenance_mode, payout_threshold) *
              </label>
              <input
                type="text"
                required
                disabled={!!selectedSetting}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. instant_payout_enabled"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Brief description of what this operational flag controls..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Value (JSON, Boolean, Number or String) *
              </label>
              <textarea
                required
                rows={5}
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder='e.g. true, 5000, or ["Lagos", "Port Harcourt", "Abuja"]'
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_public_check"
                checked={isPublicInput}
                onChange={(e) => setIsPublicInput(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="is_public_check" className="text-xs font-semibold text-slate-700">
                Expose to public clients (without authentication)
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSetting(null);
                  setKeyInput("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Platform Setting"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
