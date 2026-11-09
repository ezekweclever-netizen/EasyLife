"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProfessionalServiceAction,
  deleteProfessionalServiceAction,
} from "@/app/actions/pro";
import type { ProfessionalServiceItem } from "@/lib/supabase/pro";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";

interface ProServicesManagerProps {
  professionalId: string;
  services: ProfessionalServiceItem[];
  categories: ServiceCategoryItem[];
}

export function ProServicesManager({
  professionalId,
  services,
  categories,
}: ProServicesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [serviceTitle, setServiceTitle] = useState("");
  const [minPriceNaira, setMinPriceNaira] = useState("10000");
  const [maxPriceNaira, setMaxPriceNaira] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await addProfessionalServiceAction({
        professionalId,
        categoryId,
        serviceTitle,
        minPriceNaira: parseFloat(minPriceNaira) || 0,
        maxPriceNaira: maxPriceNaira ? parseFloat(maxPriceNaira) : null,
        description,
      });

      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setServiceTitle("");
        setDescription("");
        setMaxPriceNaira("");
        setShowAddForm(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (serviceId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteProfessionalServiceAction(serviceId, professionalId);
      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Service Catalogue &amp; Pricing ({services.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Offer multiple distinct services across one or several categories so customers discover all your skills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
        >
          {showAddForm ? "Cancel" : "+ Add Service Offering"}
        </button>
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

      {showAddForm && (
        <form
          onSubmit={handleAddService}
          className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Title
              </label>
              <input
                type="text"
                required
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. Split AC Installation & Regassing"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting Price (₦ NGN)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={minPriceNaira}
                onChange={(e) => setMinPriceNaira(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upper Estimate (₦ NGN, Optional)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={maxPriceNaira}
                onChange={(e) => setMaxPriceNaira(e.target.value)}
                placeholder="Optional"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Scope / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what is included in this service..."
              className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {services.length > 0 ? (
          services.map((s) => {
            const minPrice = (s.min_price_kobo || 0) / 100;
            const maxPrice = s.max_price_kobo ? s.max_price_kobo / 100 : null;
            return (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {s.service_title || s.category?.name || "Specialty Service"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-semibold">
                      {s.category?.name || "Trade"}
                    </span>
                    {s.is_primary_skill && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        Primary Skill
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-slate-600 leading-relaxed">{s.description}</p>
                  )}
                  <p className="text-[#0D9488] font-bold">
                    ₦{minPrice.toLocaleString("en-NG")}
                    {maxPrice ? ` – ₦${maxPrice.toLocaleString("en-NG")}` : "+"}
                  </p>
                </div>

                {!s.is_primary_skill && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(s.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400">
            No services listed yet. Click &quot;+ Add Service Offering&quot; above to add your services.
          </p>
        )}
      </div>
    </div>
  );
}
