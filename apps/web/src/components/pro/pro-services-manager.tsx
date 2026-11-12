"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProfessionalServiceAction,
  deleteProfessionalServiceAction,
  updateProfessionalServiceAction,
} from "@/app/actions/pro";
import type { ProfessionalServiceItem } from "@/lib/supabase/pro";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";
import type {
  CatalogueCategoryNode,
  CatalogueServiceItem,
  ProfessionalServiceEligibilityResult,
} from "@easylife/shared-types";

interface ProServicesManagerProps {
  professionalId: string;
  services: ProfessionalServiceItem[];
  categories: ServiceCategoryItem[];
  catalogueTree?: CatalogueCategoryNode[];
  eligibilities?: Record<string, ProfessionalServiceEligibilityResult>;
  defaultYearsExperience?: number;
}

export function ProServicesManager({
  professionalId,
  services,
  categories,
  catalogueTree = [],
  eligibilities = {},
  defaultYearsExperience = 0,
}: ProServicesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state (3-tier cascade: Main Category -> Subcategory -> Individual Service)
  const [selectedMainCatId, setSelectedMainCatId] = useState(
    catalogueTree[0]?.id || categories[0]?.id || ""
  );
  const [selectedSubcatId, setSelectedSubcatId] = useState("all");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [minPriceNaira, setMinPriceNaira] = useState("10000");
  const [maxPriceNaira, setMaxPriceNaira] = useState("");
  const [description, setDescription] = useState("");
  const [qualificationNotes, setQualificationNotes] = useState("");
  const [certificationReference, setCertificationReference] = useState("");
  const [yearsExperienceInService, setYearsExperienceInService] = useState(
    String(defaultYearsExperience)
  );
  const [isPrimary, setIsPrimary] = useState(services.length === 0);

  // Inline edit state
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMinPrice, setEditMinPrice] = useState("0");
  const [editMaxPrice, setEditMaxPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQualNotes, setEditQualNotes] = useState("");
  const [editCertRef, setEditCertRef] = useState("");
  const [editYearsExp, setEditYearsExp] = useState("");
  const [editIsPrimary, setEditIsPrimary] = useState(false);

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const activeMainNode = useMemo(
    () => catalogueTree.find((c) => c.id === selectedMainCatId) || null,
    [catalogueTree, selectedMainCatId]
  );

  const availableSubcategories = useMemo(
    () => activeMainNode?.subcategories || [],
    [activeMainNode]
  );

  const availableCatalogueServices = useMemo(() => {
    if (!activeMainNode) return [] as CatalogueServiceItem[];
    if (selectedSubcatId === "all") {
      const list = [...(activeMainNode.direct_services || [])];
      for (const sub of activeMainNode.subcategories) {
        list.push(...(sub.services || []));
      }
      return list;
    }
    const sub = activeMainNode.subcategories.find((s) => s.id === selectedSubcatId);
    return sub?.services || [];
  }, [activeMainNode, selectedSubcatId]);

  const pickedCatalogueService = useMemo(
    () => availableCatalogueServices.find((s) => s.id === selectedServiceId) || null,
    [availableCatalogueServices, selectedServiceId]
  );

  const handleSelectMainCategory = (mainId: string) => {
    setSelectedMainCatId(mainId);
    setSelectedSubcatId("all");
    setSelectedServiceId("");
  };

  const handleSelectCatalogueService = (srvId: string) => {
    setSelectedServiceId(srvId);
    const srv = availableCatalogueServices.find((s) => s.id === srvId);
    if (srv) {
      setServiceTitle(srv.name);
      if (srv.base_price_min_kobo > 0) {
        setMinPriceNaira(String(Math.round(srv.base_price_min_kobo / 100)));
      }
      if (srv.base_price_max_kobo) {
        setMaxPriceNaira(String(Math.round(srv.base_price_max_kobo / 100)));
      }
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const effectiveCategoryId =
      pickedCatalogueService?.subcategory_id ||
      (selectedSubcatId !== "all" ? selectedSubcatId : selectedMainCatId) ||
      categories[0]?.id ||
      "";

    const parsedYears = parseInt(yearsExperienceInService, 10);

    startTransition(async () => {
      const res = await addProfessionalServiceAction({
        professionalId,
        categoryId: effectiveCategoryId,
        serviceId: selectedServiceId || null,
        serviceTitle: serviceTitle || pickedCatalogueService?.name || "",
        minPriceNaira: parseFloat(minPriceNaira) || 0,
        maxPriceNaira: maxPriceNaira ? parseFloat(maxPriceNaira) : null,
        description,
        isPrimary,
        qualificationNotes,
        certificationReference,
        yearsExperienceInService: Number.isNaN(parsedYears) ? null : parsedYears,
      });

      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setSelectedServiceId("");
        setServiceTitle("");
        setDescription("");
        setMaxPriceNaira("");
        setQualificationNotes("");
        setCertificationReference("");
        setIsPrimary(false);
        setShowAddForm(false);
        router.refresh();
      }
    });
  };

  const openEditForm = (s: ProfessionalServiceItem) => {
    setEditingOfferingId(s.id);
    setEditTitle(s.service_title || s.service?.name || s.category?.name || "");
    setEditMinPrice(String(Math.round((s.min_price_kobo || 0) / 100)));
    setEditMaxPrice(s.max_price_kobo ? String(Math.round(s.max_price_kobo / 100)) : "");
    setEditDesc(s.description || "");
    setEditQualNotes(s.qualification_notes || "");
    setEditCertRef(s.certification_reference || "");
    setEditYearsExp(
      s.years_experience_in_service !== null && s.years_experience_in_service !== undefined
        ? String(s.years_experience_in_service)
        : String(defaultYearsExperience)
    );
    setEditIsPrimary(s.is_primary_skill);
  };

  const handleSaveEdit = (s: ProfessionalServiceItem) => {
    setFeedback(null);
    const parsedYears = parseInt(editYearsExp, 10);

    startTransition(async () => {
      const res = await updateProfessionalServiceAction({
        offeringId: s.id,
        professionalId,
        serviceId: s.service_id,
        serviceTitle: editTitle,
        minPriceNaira: parseFloat(editMinPrice) || 0,
        maxPriceNaira: editMaxPrice ? parseFloat(editMaxPrice) : null,
        description: editDesc,
        isPrimary: editIsPrimary,
        qualificationNotes: editQualNotes,
        certificationReference: editCertRef,
        yearsExperienceInService: Number.isNaN(parsedYears) ? null : parsedYears,
      });

      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setEditingOfferingId(null);
        router.refresh();
      }
    });
  };

  const handleToggleActive = (s: ProfessionalServiceItem) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProfessionalServiceAction({
        offeringId: s.id,
        professionalId,
        serviceId: s.service_id,
        minPriceNaira: Math.round((s.min_price_kobo || 0) / 100),
        maxPriceNaira: s.max_price_kobo ? Math.round(s.max_price_kobo / 100) : null,
        description: s.description || "",
        isActive: !s.is_active,
        qualificationNotes: s.qualification_notes || "",
        certificationReference: s.certification_reference || "",
        yearsExperienceInService: s.years_experience_in_service ?? null,
      });
      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const handleDelete = (offeringId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteProfessionalServiceAction(offeringId, professionalId);
      setFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Service Offerings, Qualifications &amp; Eligibility ({services.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select verified services from Main Categories &amp; Subcategories, declare service-specific credentials, and inspect eligibility status.
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
          {catalogueTree.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Main Category *
                </label>
                <select
                  value={selectedMainCatId}
                  onChange={(e) => handleSelectMainCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                >
                  {catalogueTree.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Subcategory
                </label>
                <select
                  value={selectedSubcatId}
                  onChange={(e) => {
                    setSelectedSubcatId(e.target.value);
                    setSelectedServiceId("");
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                >
                  <option value="all">All Subcategories ({availableCatalogueServices.length})</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.services.length})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Individual Service
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => handleSelectCatalogueService(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                >
                  <option value="">-- Select Catalogue Service or Custom --</option>
                  {availableCatalogueServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={selectedMainCatId}
                onChange={(e) => setSelectedMainCatId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {pickedCatalogueService && (
            <div className="p-3 rounded-lg bg-white border border-teal-200 text-xs space-y-1.5">
              <div className="font-bold text-teal-950">
                Service Eligibility Requirements for &quot;{pickedCatalogueService.name}&quot;
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Min Experience: {pickedCatalogueService.min_years_experience} yrs
                </span>
                {pickedCatalogueService.requires_trade_certification && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Trade Certificate Required
                  </span>
                )}
                {pickedCatalogueService.requires_business_registration && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                    CAC Certificate Required
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Offering Display Title *
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Years Experience in Service
              </label>
              <input
                type="number"
                min="0"
                max="70"
                value={yearsExperienceInService}
                onChange={(e) => setYearsExperienceInService(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Certification / Licence Reference
              </label>
              <input
                type="text"
                value={certificationReference}
                onChange={(e) => setCertificationReference(e.target.value)}
                placeholder="e.g. NABTEB / COREN / City & Guilds"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service-Specific Qualifications
              </label>
              <input
                type="text"
                value={qualificationNotes}
                onChange={(e) => setQualificationNotes(e.target.value)}
                placeholder="e.g. Certified in Inverter & Daikin systems"
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded text-[#0D9488] border-slate-300"
              />
              <span>Mark as my Primary Specialty</span>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Service Offering"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {services.length > 0 ? (
          services.map((s) => {
            const minPrice = (s.min_price_kobo || 0) / 100;
            const maxPrice = s.max_price_kobo ? s.max_price_kobo / 100 : null;
            const eligibility = s.service_id ? eligibilities[s.service_id] : undefined;
            const isEditingThis = editingOfferingId === s.id;
            const proRequirements = (s.service?.requirements || []).filter(
              (r) => r.applies_to === "professional" || r.applies_to === "both"
            );

            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border text-xs space-y-3 ${
                  s.is_active
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-slate-100/70 opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {s.service_title || s.service?.name || s.category?.name || "Specialty Service"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] border border-teal-200 text-[10px] font-semibold">
                        {s.category?.name || "Trade"}
                      </span>
                      {s.service && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                          {s.service.service_code}
                        </span>
                      )}
                      {s.is_primary_skill && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Primary Skill
                        </span>
                      )}
                      {!s.is_active && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">
                          Paused
                        </span>
                      )}
                      {eligibility && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            eligibility.eligible
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-900 border-amber-200"
                          }`}
                        >
                          {eligibility.eligible ? "Eligible ✓" : "Requirements Pending"}
                        </span>
                      )}
                    </div>

                    {s.description && (
                      <p className="text-slate-600 leading-relaxed">{s.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                      <span className="text-[#0D9488] font-bold text-xs">
                        ₦{minPrice.toLocaleString("en-NG")}
                        {maxPrice ? ` – ₦${maxPrice.toLocaleString("en-NG")}` : "+"}
                      </span>
                      {s.years_experience_in_service !== null &&
                        s.years_experience_in_service !== undefined && (
                          <span>• {s.years_experience_in_service} yrs service exp</span>
                        )}
                      {s.certification_reference && (
                        <span className="font-mono">• Cert: {s.certification_reference}</span>
                      )}
                      {s.qualification_notes && (
                        <span>• {s.qualification_notes}</span>
                      )}
                    </div>

                    {eligibility && !eligibility.eligible && eligibility.missing_requirements.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950">
                        <span className="font-bold block mb-0.5">
                          Missing to Unlock Verified Eligibility:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {eligibility.missing_requirements.map((req) => (
                            <li key={req}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {proRequirements.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {proRequirements.map((req) => (
                          <span
                            key={req.id}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600"
                          >
                            {req.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        isEditingThis ? setEditingOfferingId(null) : openEditForm(s)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-[11px] font-semibold"
                    >
                      {isEditingThis ? "Close Edit" : "Edit & Qualifications"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(s)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-[11px] font-semibold"
                    >
                      {s.is_active ? "Pause" : "Activate"}
                    </button>
                    {(!s.is_primary_skill || services.length > 1) && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(s.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {isEditingThis && (
                  <div className="p-3.5 rounded-xl border border-teal-200 bg-white space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Offering Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Starting Price (₦)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={editMinPrice}
                          onChange={(e) => setEditMinPrice(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Upper Estimate (₦)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={editMaxPrice}
                          onChange={(e) => setEditMaxPrice(e.target.value)}
                          placeholder="Optional"
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Service Experience (Yrs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="70"
                          value={editYearsExp}
                          onChange={(e) => setEditYearsExp(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Certification Reference
                        </label>
                        <input
                          type="text"
                          value={editCertRef}
                          onChange={(e) => setEditCertRef(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Qualification Notes
                        </label>
                        <input
                          type="text"
                          value={editQualNotes}
                          onChange={(e) => setEditQualNotes(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsPrimary}
                          onChange={(e) => setEditIsPrimary(e.target.checked)}
                          className="h-4 w-4 rounded text-[#0D9488] border-slate-300"
                        />
                        <span>Set as Primary Skill</span>
                      </label>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingOfferingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveEdit(s)}
                          className="px-4 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
                        >
                          {isPending ? "Saving..." : "Update Offering"}
                        </button>
                      </div>
                    </div>
                  </div>
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
