"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerProfessionalAction } from "@/app/actions/pro";
import { PILOT_CITIES } from "@/lib/validation/forms";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";
import type { OperatingNeighbourhood } from "@/lib/supabase/matching";
import type {
  CatalogueCategoryNode,
  CatalogueServiceItem,
} from "@easylife/shared-types";

interface ProRegisterWizardProps {
  categories: ServiceCategoryItem[];
  catalogueTree?: CatalogueCategoryNode[];
  neighbourhoods?: OperatingNeighbourhood[];
  defaultUser?: {
    fullName?: string;
    email?: string;
    phone?: string | null;
  } | null;
}

interface ServiceQualificationDraft {
  qualificationNotes: string;
  certificationReference: string;
  yearsExperienceInService: string;
}

const WEEKDAYS = [
  { day: 1, short: "Mon" },
  { day: 2, short: "Tue" },
  { day: 3, short: "Wed" },
  { day: 4, short: "Thu" },
  { day: 5, short: "Fri" },
  { day: 6, short: "Sat" },
  { day: 0, short: "Sun" },
];

export function ProRegisterWizard({
  categories,
  catalogueTree = [],
  neighbourhoods = [],
  defaultUser,
}: ProRegisterWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 fields
  const [providerType, setProviderType] = useState<
    "trade_technician" | "dispatch_rider" | "property_agent" | "general_artisan"
  >("trade_technician");
  const [agentDisclaimerAccepted, setAgentDisclaimerAccepted] = useState(false);
  const [vehicleType, setVehicleType] = useState("Motorcycle");
  const [businessName, setBusinessName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(3);

  // Step 2: 3-tier catalogue & qualification state
  const [activeMainCatId, setActiveMainCatId] = useState<string>(
    catalogueTree[0]?.id || categories[0]?.id || ""
  );
  const [activeSubcatId, setActiveSubcatId] = useState<string>("all");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [serviceQualifications, setServiceQualifications] = useState<
    Record<string, ServiceQualificationDraft>
  >({});

  // Step 2: Location & neighbourhoods
  const [city, setCity] = useState("Port Harcourt");
  const [selectedNeighbourhoodIds, setSelectedNeighbourhoodIds] = useState<string[]>([]);
  const [lgaOrDistrict, setLgaOrDistrict] = useState("");

  // Step 3: Schedule & fee
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [baseCalloutFee, setBaseCalloutFee] = useState(5000);

  // Lookup map of all catalogue services
  const allCatalogueServicesMap = useMemo(() => {
    const map = new Map<string, CatalogueServiceItem>();
    for (const main of catalogueTree) {
      for (const ds of main.direct_services || []) {
        map.set(ds.id, ds);
      }
      for (const sub of main.subcategories || []) {
        for (const s of sub.services || []) {
          map.set(s.id, s);
        }
      }
    }
    return map;
  }, [catalogueTree]);

  const activeMainCategory = useMemo(
    () => catalogueTree.find((c) => c.id === activeMainCatId) || catalogueTree[0] || null,
    [catalogueTree, activeMainCatId]
  );

  const visibleServices = useMemo(() => {
    if (!activeMainCategory) return [] as CatalogueServiceItem[];
    if (activeSubcatId === "all") {
      const items: CatalogueServiceItem[] = [...(activeMainCategory.direct_services || [])];
      for (const sub of activeMainCategory.subcategories || []) {
        items.push(...(sub.services || []));
      }
      return items;
    }
    if (activeSubcatId === "direct") {
      return activeMainCategory.direct_services || [];
    }
    const sub = activeMainCategory.subcategories.find((s) => s.id === activeSubcatId);
    return sub?.services || [];
  }, [activeMainCategory, activeSubcatId]);

  const cityNeighbourhoods = useMemo(
    () => neighbourhoods.filter((n) => n.city.toLowerCase() === city.toLowerCase()),
    [neighbourhoods, city]
  );

  const selectedServicesList = useMemo(
    () =>
      selectedServiceIds
        .map((id) => allCatalogueServicesMap.get(id))
        .filter((s): s is CatalogueServiceItem => Boolean(s)),
    [selectedServiceIds, allCatalogueServicesMap]
  );

  const requiredCredentialSummary = useMemo(() => {
    const needsTradeCert = selectedServicesList.some((s) => s.requires_trade_certification);
    const needsCac = selectedServicesList.some((s) => s.requires_business_registration);
    const maxMinYears = selectedServicesList.reduce(
      (max, s) => Math.max(max, s.min_years_experience || 0),
      0
    );
    const mismatchedTypes = selectedServicesList.filter(
      (s) =>
        Array.isArray(s.eligible_provider_types) &&
        s.eligible_provider_types.length > 0 &&
        !s.eligible_provider_types.includes(providerType)
    );
    return { needsTradeCert, needsCac, maxMinYears, mismatchedTypes };
  }, [selectedServicesList, providerType]);

  const toggleService = (srv: CatalogueServiceItem) => {
    if (selectedServiceIds.includes(srv.id)) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== srv.id));
    } else {
      setSelectedServiceIds((prev) => [...prev, srv.id]);
      setServiceQualifications((prev) => {
        if (prev[srv.id]) return prev;
        return {
          ...prev,
          [srv.id]: {
            qualificationNotes: "",
            certificationReference: "",
            yearsExperienceInService: String(yearsExperience),
          },
        };
      });
    }
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleNeighbourhood = (id: string) => {
    setSelectedNeighbourhoodIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateQualificationField = (
    serviceId: string,
    field: keyof ServiceQualificationDraft,
    value: string
  ) => {
    setServiceQualifications((prev) => ({
      ...prev,
      [serviceId]: {
        qualificationNotes: prev[serviceId]?.qualificationNotes || "",
        certificationReference: prev[serviceId]?.certificationReference || "",
        yearsExperienceInService: prev[serviceId]?.yearsExperienceInService || String(yearsExperience),
        [field]: value,
      },
    }));
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setSelectedNeighbourhoodIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (providerType === "property_agent" && !agentDisclaimerAccepted) {
      setErrorMessage("You must accept the EasyLife property advisory policy prohibiting property listings.");
      setCurrentStep(1);
      return;
    }

    if (!businessName || businessName.length < 3) {
      setErrorMessage("Please enter your business or artisan trade name.");
      setCurrentStep(1);
      return;
    }

    if (!bio || bio.length < 20) {
      setErrorMessage("Please provide at least 20 characters describing your skills and trade background.");
      setCurrentStep(1);
      return;
    }

    if (selectedServiceIds.length === 0 && selectedCategories.length === 0) {
      setErrorMessage("Please select at least one specific service or trade category.");
      setCurrentStep(2);
      return;
    }

    if (workingDays.length === 0) {
      setErrorMessage("Please select at least one active working day.");
      setCurrentStep(3);
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage("Closing time must be later than opening time.");
      setCurrentStep(3);
      return;
    }

    const qualPayload: Record<
      string,
      {
        qualificationNotes: string;
        certificationReference: string;
        yearsExperienceInService: number | null;
      }
    > = {};

    for (const sId of selectedServiceIds) {
      const draft = serviceQualifications[sId];
      if (draft) {
        const parsedYears = parseInt(draft.yearsExperienceInService, 10);
        qualPayload[sId] = {
          qualificationNotes: draft.qualificationNotes.trim(),
          certificationReference: draft.certificationReference.trim(),
          yearsExperienceInService: Number.isNaN(parsedYears) ? null : parsedYears,
        };
      }
    }

    const formData = new FormData();
    formData.append("providerType", providerType);
    formData.append("agentDisclaimerAccepted", agentDisclaimerAccepted ? "true" : "false");
    if (providerType === "dispatch_rider") {
      formData.append("vehicleType", vehicleType);
    }
    formData.append("businessName", businessName);
    formData.append("headline", headline);
    formData.append("bio", bio);
    formData.append("yearsExperience", yearsExperience.toString());
    formData.append("city", city);
    formData.append("lgaOrDistrict", lgaOrDistrict);
    formData.append("baseCalloutFee", baseCalloutFee.toString());
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("serviceQualificationsJson", JSON.stringify(qualPayload));

    for (const srvId of selectedServiceIds) {
      formData.append("serviceIds", srvId);
    }
    for (const catId of selectedCategories) {
      formData.append("categoryIds", catId);
    }
    for (const nbId of selectedNeighbourhoodIds) {
      formData.append("neighbourhoodIds", nbId);
    }
    for (const day of workingDays) {
      formData.append("workingDays", String(day));
    }

    startTransition(async () => {
      const res = await registerProfessionalAction(
        { status: "idle", message: "" },
        formData
      );

      if (res.status === "error") {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        setTimeout(() => {
          router.push("/pro/profile#documents");
        }, 1200);
      }
    });
  };

  const hasCatalogueServices = catalogueTree.length > 0 && allCatalogueServicesMap.size > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
      {/* Wizard Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[
            { num: 1, label: "Identity & Trade" },
            { num: 2, label: "Services & Hubs" },
            { num: 3, label: "Schedule & KYC" },
          ].map((st) => (
            <div key={st.num} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === st.num
                    ? "bg-[#0D9488] text-white ring-4 ring-teal-100"
                    : currentStep > st.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {currentStep > st.num ? "✓" : st.num}
              </div>
              <span className="text-[11px] font-semibold text-slate-600 mt-1.5">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Personal & Business Identity */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Provider Role &amp; Trade Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your service provider classification, trading identity, and practical background.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Provider Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "trade_technician",
                    label: "Trade Technician",
                    desc: "Plumber, electrician, AC tech, generator mechanic, tiler, painter",
                    badge: "Hands-on Trade",
                  },
                  {
                    id: "dispatch_rider",
                    label: "Delivery & Dispatch",
                    desc: "Courier rider or vehicle operator offering point-to-point delivery",
                    badge: "Logistics",
                  },
                  {
                    id: "property_agent",
                    label: "Property & Tenancy Consultant",
                    desc: "Rental assistant, property sourcing agent, facility manager (Services only)",
                    badge: "Advisory Only",
                  },
                  {
                    id: "general_artisan",
                    label: "Everyday Helper / Artisan",
                    desc: "General errands, house moving helper, furniture assembly, event staff",
                    badge: "Everyday Tasks",
                  },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setProviderType(role.id as any)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      providerType === role.id
                        ? "bg-teal-50/70 border-[#0D9488] ring-2 ring-[#0D9488]/30 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{role.label}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          providerType === role.id
                            ? "bg-[#0D9488] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{role.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {providerType === "dispatch_rider" && (
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs">
                <label className="block font-semibold text-teal-950 mb-1.5">
                  Primary Delivery Vehicle *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-teal-300 text-xs text-slate-900 bg-white"
                >
                  <option value="Motorcycle">Motorcycle (Express Dispatch)</option>
                  <option value="Bicycle">Bicycle / E-Cargo Bike</option>
                  <option value="Minivan / Car">Minivan / Car (Parcel Delivery)</option>
                  <option value="Truck / Haulage">Truck / Cargo Haulage (Heavy Delivery)</option>
                </select>
              </div>
            )}

            {providerType === "property_agent" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Strict Anti-Listing Platform Policy
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  EasyLife is a service platform, <strong>NOT a property listing website</strong>. You may offer rental assistance, tenancy consulting, and inspection services, and <strong>you are strictly prohibited from listing properties for rent or sale</strong>.
                </p>
                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentDisclaimerAccepted}
                    onChange={(e) => setAgentDisclaimerAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    I acknowledge EasyLife does not provide property listings and agree never to upload property advertisements. *
                  </span>
                </label>
              </div>
            )}

            {defaultUser && (
              <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Account Owner: </span>
                  <span>{defaultUser.fullName || defaultUser.email}</span>
                </div>
                {defaultUser.phone && (
                  <span className="text-slate-500 font-mono">{defaultUser.phone}</span>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Business Name or Trade Brand Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Chukwuma Electricals & AC Services"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Certified Generator Technician & Industrial Electrician"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Trade Bio &amp; Experience Overview *
              </label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your training, equipment brands you service, and workmanship guarantees..."
                className="w-full p-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-400">Minimum 20 characters.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Years of Practical Experience *
              </label>
              <input
                type="number"
                min="0"
                max="70"
                required
                value={yearsExperience}
                onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                className="w-32 h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (providerType === "property_agent" && !agentDisclaimerAccepted) {
                    setErrorMessage("You must accept the EasyLife property advisory policy prohibiting property listings.");
                    return;
                  }
                  if (!businessName || businessName.trim().length < 3 || bio.trim().length < 20) {
                    setErrorMessage("Please complete your business name (min 3 chars) and bio (min 20 chars).");
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(2);
                }}
                className="px-6 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
              >
                Continue to Services &amp; Hubs →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 3-Tier Catalogue Services, Qualifications & Operating Hubs */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Service Catalogue, Qualifications &amp; Approved Locations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse categories and subcategories to select eligible services, declare trade credentials, and pick approved neighbourhoods.
              </p>
            </div>

            {hasCatalogueServices ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Main Categories * ({selectedServiceIds.length} individual services selected)
                  </label>
                </div>

                {/* Main Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  {catalogueTree.map((main) => {
                    const countInMain =
                      (main.direct_services || []).filter((s) => selectedServiceIds.includes(s.id)).length +
                      (main.subcategories || []).reduce(
                        (sum, sub) =>
                          sum + (sub.services || []).filter((s) => selectedServiceIds.includes(s.id)).length,
                        0
                      );
                    const isActive = activeMainCategory?.id === main.id;
                    return (
                      <button
                        key={main.id}
                        type="button"
                        onClick={() => {
                          setActiveMainCatId(main.id);
                          setActiveSubcatId("all");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {main.name}
                        {countInMain > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500 text-white">
                            {countInMain}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory Filter Pills */}
                {activeMainCategory &&
                  (activeMainCategory.subcategories.length > 0 ||
                    activeMainCategory.direct_services.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">
                        Subcategory:
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveSubcatId("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          activeSubcatId === "all"
                            ? "bg-[#0D9488] text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        All in {activeMainCategory.name}
                      </button>
                      {activeMainCategory.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveSubcatId(sub.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            activeSubcatId === sub.id
                              ? "bg-[#0D9488] text-white"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {sub.name} ({sub.services.length})
                        </button>
                      ))}
                    </div>
                  )}

                {/* Services List + Inline Qualification Inputs */}
                <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {visibleServices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                      No active catalogue services inside this subcategory yet.
                    </div>
                  ) : (
                    visibleServices.map((srv) => {
                      const isSelected = selectedServiceIds.includes(srv.id);
                      const typeEligible =
                        !srv.eligible_provider_types?.length ||
                        srv.eligible_provider_types.includes(providerType);
                      const expShortfall = (srv.min_years_experience || 0) > yearsExperience;
                      const draft = serviceQualifications[srv.id] || {
                        qualificationNotes: "",
                        certificationReference: "",
                        yearsExperienceInService: String(yearsExperience),
                      };

                      return (
                        <div
                          key={srv.id}
                          className={`rounded-xl border transition ${
                            isSelected
                              ? "bg-teal-50/40 border-[#0D9488] ring-1 ring-[#0D9488]/40"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <label className="p-3.5 flex items-start justify-between gap-3 cursor-pointer">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {srv.name}
                                </span>
                                {srv.base_price_min_kobo > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                    From ₦{Math.round(srv.base_price_min_kobo / 100).toLocaleString("en-NG")}
                                  </span>
                                )}
                                {srv.requires_trade_certification && (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                    Trade Cert Required
                                  </span>
                                )}
                                {srv.requires_business_registration && (
                                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                                    CAC Cert Required
                                  </span>
                                )}
                                {srv.min_years_experience > 0 && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      expShortfall
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    Min {srv.min_years_experience} yrs exp
                                  </span>
                                )}
                                {!typeEligible && (
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                                    Requires: {srv.eligible_provider_types.join(", ")}
                                  </span>
                                )}
                              </div>
                              {srv.short_description && (
                                <p className="text-[11px] text-slate-500">
                                  {srv.short_description}
                                </p>
                              )}
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleService(srv)}
                              className="mt-1 h-4 w-4 rounded text-[#0D9488] focus:ring-[#0D9488] border-slate-300 shrink-0"
                            />
                          </label>

                          {isSelected && (
                            <div className="px-3.5 pb-3.5 pt-2 border-t border-teal-200/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/70 rounded-b-xl">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                  Years in This Service
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="70"
                                  value={draft.yearsExperienceInService}
                                  onChange={(e) =>
                                    updateQualificationField(
                                      srv.id,
                                      "yearsExperienceInService",
                                      e.target.value
                                    )
                                  }
                                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                  Cert / Licence No. (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={draft.certificationReference}
                                  onChange={(e) =>
                                    updateQualificationField(
                                      srv.id,
                                      "certificationReference",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. NABTEB / NEMSA / COREN"
                                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                  Qualification / Equipment Notes
                                </label>
                                <input
                                  type="text"
                                  value={draft.qualificationNotes}
                                  onChange={(e) =>
                                    updateQualificationField(
                                      srv.id,
                                      "qualificationNotes",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. Daikin/LG Inverter specialist"
                                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Select Your Service Specialties *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? "bg-teal-50/60 border-[#0D9488] ring-1 ring-[#0D9488]"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                              {cat.description}
                            </span>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.id)}
                          className="h-4 w-4 rounded text-[#0D9488] focus:ring-[#0D9488] border-slate-300"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved Pilot City & Operating Neighbourhoods */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Primary Approved Pilot City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                  >
                    {PILOT_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Custom LGA / Workshop Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={lgaOrDistrict}
                    onChange={(e) => setLgaOrDistrict(e.target.value)}
                    placeholder="e.g. Trans-Amadi, Ikeja, or Wuse II"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                  />
                </div>
              </div>

              {cityNeighbourhoods.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    Approved Neighbourhoods Covered in {city} ({selectedNeighbourhoodIds.length} selected)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    {cityNeighbourhoods.map((nb) => {
                      const active = selectedNeighbourhoodIds.includes(nb.id);
                      return (
                        <label
                          key={nb.id}
                          className={`px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition ${
                            active
                              ? "bg-teal-50 border-[#0D9488] text-teal-950 font-semibold"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleNeighbourhood(nb.id)}
                            className="h-3.5 w-3.5 rounded text-[#0D9488] border-slate-300"
                          />
                          <div className="min-w-0">
                            <span className="block truncate">{nb.name}</span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              {nb.lga}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedServiceIds.length === 0 && selectedCategories.length === 0) {
                    setErrorMessage("Please select at least one individual service or trade category.");
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(3);
                }}
                className="px-6 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
              >
                Continue to Schedule &amp; KYC →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Working Days, Hours, Rates & KYC Preview */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Working Schedule, Inspection Fee &amp; Verification Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your weekly operating days and verify the documents you&apos;ll submit right after creating your profile.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Active Working Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((wd) => {
                  const active = workingDays.includes(wd.day);
                  return (
                    <button
                      key={wd.day}
                      type="button"
                      onClick={() => toggleWorkingDay(wd.day)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                        active
                          ? "bg-[#0D9488] text-white border-[#0D9488]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {wd.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Available From
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Available Until
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Base Call-out &amp; Diagnosis Fee (₦)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={baseCalloutFee}
                onChange={(e) => setBaseCalloutFee(parseFloat(e.target.value) || 0)}
                placeholder="5000"
                className="w-48 h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
            </div>

            {/* Required Credentials Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block">
                Required Verification Checklist After Registration:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>
                  <strong>Mandatory Government ID:</strong> NIN, Voter&apos;s Card, Driver&apos;s Licence, or International Passport
                </li>
                {requiredCredentialSummary.needsTradeCert && (
                  <li className="text-amber-900">
                    <strong>Trade Certification Required:</strong> Selected service(s) require Trade Test / NABTEB / guild certification upload
                  </li>
                )}
                {requiredCredentialSummary.needsCac && (
                  <li className="text-purple-900">
                    <strong>CAC Business Certificate Required:</strong> Selected service(s) require RC/BN corporate registration proof
                  </li>
                )}
                {requiredCredentialSummary.maxMinYears > yearsExperience && (
                  <li className="text-rose-800">
                    <strong>Experience Threshold Advisory:</strong> Selected service(s) require up to {requiredCredentialSummary.maxMinYears} years of experience.
                  </li>
                )}
                {requiredCredentialSummary.mismatchedTypes.length > 0 && (
                  <li className="text-rose-800">
                    <strong>Provider Type Notice:</strong> {requiredCredentialSummary.mismatchedTypes.length} selected service(s) typically target another provider type.
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-3 rounded-lg bg-[#0D9488] text-white text-sm font-bold hover:bg-[#0F766E] disabled:opacity-50 transition shadow-xs"
              >
                {isPending ? "Saving Onboarding Profile..." : "Complete Registration & Upload KYC →"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
