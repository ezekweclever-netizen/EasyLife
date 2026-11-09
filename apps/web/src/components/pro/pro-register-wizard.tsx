"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerProfessionalAction } from "@/app/actions/pro";
import { PILOT_CITIES } from "@/lib/validation/forms";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";

interface ProRegisterWizardProps {
  categories: ServiceCategoryItem[];
  defaultUser?: {
    fullName?: string;
    email?: string;
    phone?: string | null;
  } | null;
}

export function ProRegisterWizard({
  categories,
  defaultUser,
}: ProRegisterWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form step state (1: Business & Identity, 2: Location & Categories, 3: Experience & Hours)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [providerType, setProviderType] = useState<"trade_technician" | "dispatch_rider" | "property_agent" | "general_artisan">("trade_technician");
  const [agentDisclaimerAccepted, setAgentDisclaimerAccepted] = useState(false);
  const [vehicleType, setVehicleType] = useState("Motorcycle");
  const [businessName, setBusinessName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(3);
  const [city, setCity] = useState("Port Harcourt");
  const [lgaOrDistrict, setLgaOrDistrict] = useState("");
  const [baseCalloutFee, setBaseCalloutFee] = useState(5000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
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

    if (selectedCategories.length === 0) {
      setErrorMessage("Please select at least one trade category.");
      setCurrentStep(2);
      return;
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

    for (const catId of selectedCategories) {
      formData.append("categoryIds", catId);
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
          router.push("/pro/dashboard");
        }, 1500);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
      {/* Wizard Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[
            { num: 1, label: "Identity & Trade" },
            { num: 2, label: "Services & Area" },
            { num: 3, label: "Hours & Pricing" },
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
                Select your service provider type, trading identity and technical background.
              </p>
            </div>

            {/* Provider Type Selector */}
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

            {/* Dispatch Rider Vehicle Type Option */}
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
                <p className="mt-1.5 text-[11px] text-teal-800">
                  Customers in your operating area can book on-demand deliveries matched to your vehicle capacity.
                </p>
              </div>
            )}

            {/* Property Agent Strict Anti-Listing Disclaimer */}
            {providerType === "property_agent" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Strict Anti-Listing Platform Policy
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  EasyLife is a service platform, <strong>NOT a property listing website</strong>. Estate agents, letting agents, and property managers register strictly to offer professional services (such as rental assistance, tenancy consulting, inspection, and property management).
                  <strong> You are strictly prohibited from posting, advertising, or listing apartments, houses, or land for rent or sale.</strong>
                </p>
                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentDisclaimerAccepted}
                    onChange={(e) => setAgentDisclaimerAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    I acknowledge that EasyLife does not provide property listings and agree never to upload or advertise property inventories. *
                  </span>
                </label>
              </div>
            )}

            {defaultUser && (
              <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Registered User: </span>
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
                placeholder="e.g. Chukwuma Electricals &amp; AC Services"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                If operating independently, you may use your name or your workshop brand.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Certified Generator Technician &amp; Industrial Electrician"
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
                placeholder="Describe your background, years in apprenticeship, brands you service (e.g. Perkins, Mikano, Daikin, LG), and standard of workmanship..."
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
                max="50"
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
                  if (!businessName || bio.length < 20) {
                    setErrorMessage("Please complete all required fields on this step.");
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(2);
                }}
                className="px-6 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
              >
                Continue to Services &amp; Location →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Categories & Service Areas */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Service Categories &amp; Operating Area
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the trades you are qualified to perform and the city where you can take on-site jobs.
              </p>
            </div>

            {/* Service Categories Checkbox Grid */}
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

            {/* Operating City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Primary Pilot City *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  Primary LGA / District / Workshop Area
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
                  if (selectedCategories.length === 0) {
                    setErrorMessage("Please select at least one trade category.");
                    return;
                  }
                  setErrorMessage(null);
                  setCurrentStep(3);
                }}
                className="px-6 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
              >
                Continue to Hours &amp; Rates →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Working Hours & Rates */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Working Hours &amp; Base Inspection Fee
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define when you are available to accept jobs and your initial call-out diagnosis rate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Available From (Daily)
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
                  Available Until (Daily)
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
              <p className="mt-1 text-[11px] text-slate-500">
                Covers your on-site physical diagnosis if full repair is not commissioned immediately.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-1">
                Next Step: Verification Vetting
              </span>
              After registration, you will be directed to your dashboard where you can upload your National ID (NIN) or trade certificate to unlock live customer job requests.
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
                {isPending ? "Submitting Registration..." : "Complete Professional Registration"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
