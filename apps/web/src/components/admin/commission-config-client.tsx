"use client";

import React, { useState } from "react";
import { adminUpdateCommissionSettingAction } from "@/app/actions/admin";

interface CommissionItem {
  id: string;
  category_id: string | null;
  city: string | null;
  commission_bps: number;
  flat_fee_kobo: number;
  is_active: boolean;
  created_at: string;
}

interface CommissionConfigClientProps {
  initialSettings: CommissionItem[];
}

export function CommissionConfigClient({
  initialSettings,
}: CommissionConfigClientProps) {
  const [settings, setSettings] = useState<CommissionItem[]>(initialSettings);
  const [showModal, setShowModal] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [percentInput, setPercentInput] = useState("10");
  const [flatFeeInput, setFlatFeeInput] = useState("0");
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    if (cityInput) fd.append("city", cityInput);
    fd.append("commissionPercentage", percentInput);
    fd.append("flatFeeNaira", flatFeeInput);
    fd.append("isActive", isActiveInput ? "true" : "false");

    const res = await adminUpdateCommissionSettingAction(fd);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setSuccess(res.message);
    const newBps = Math.round(parseFloat(percentInput) * 100);
    const newFlat = Math.round(parseFloat(flatFeeInput) * 100);

    setSettings((prev) => [
      {
        id: String(Date.now()),
        category_id: null,
        city: cityInput || null,
        commission_bps: newBps,
        flat_fee_kobo: newFlat,
        is_active: isActiveInput,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    setTimeout(() => {
      setShowModal(false);
      setCityInput("");
      setPercentInput("10");
      setFlatFeeInput("0");
      setSuccess(null);
    }, 1200);
  };

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Math.round((kobo || 0) / 100));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Configure Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-800">
            Marketplace Take Rates &amp; Transaction Fees
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">
            Default platform commission baseline: <strong>10.0%</strong> (1,000 bps)
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Add Commission Override</span>
        </button>
      </div>

      {/* Commission Rates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            Active Commission Configuration Rules ({settings.length})
          </div>
          <span className="text-2xs text-slate-400">
            Protected by trigger audit logging
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Regional Scope</th>
                <th className="py-3.5 px-4">Commission Rate (%)</th>
                <th className="py-3.5 px-4">Basis Points (bps)</th>
                <th className="py-3.5 px-4">Flat Callout / Booking Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Configured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No custom overrides. Using global default rate (10%).
                  </td>
                </tr>
              ) : (
                settings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.city || "All Pilot Cities (Global)"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 text-sm">
                      {(s.commission_bps / 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {s.commission_bps} bps
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {s.flat_fee_kobo > 0 ? formatNaira(s.flat_fee_kobo) : "None (₦0)"}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.is_active ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-2xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Commission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-sm text-slate-900">
                Configure Commission Tier Override
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Regional City Jurisdiction
              </label>
              <select
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
              >
                <option value="">All Pilot Cities (National Default)</option>
                <option value="Port Harcourt">Port Harcourt, Rivers State</option>
                <option value="Lagos">Lagos State</option>
                <option value="Abuja">Abuja, FCT</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Commission (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  required
                  value={percentInput}
                  onChange={(e) => setPercentInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Flat Fee (₦)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={flatFeeInput}
                  onChange={(e) => setFlatFeeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_check"
                checked={isActiveInput}
                onChange={(e) => setIsActiveInput(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-700">
                Rule is active immediately
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
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Commission Tier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
