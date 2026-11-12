"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProfessionalServiceAreaAction,
  removeProfessionalServiceAreaAction,
  saveProfessionalWeeklyAvailabilityAction,
  setPrimaryServiceAreaAction,
  toggleProfessionalServiceAreaAction,
} from "@/app/actions/pro";
import { PILOT_CITIES } from "@/lib/validation/forms";
import type {
  ProfessionalAreaItem,
  ProfessionalAvailabilityItem,
} from "@/lib/supabase/pro";
import type { OperatingNeighbourhood } from "@/lib/supabase/matching";

interface ProLocationsAvailabilityManagerProps {
  professionalId: string;
  primaryCity: string;
  primaryState: string;
  areas: ProfessionalAreaItem[];
  availability: ProfessionalAvailabilityItem[];
  neighbourhoods: OperatingNeighbourhood[];
}

const WEEKDAY_CONFIG = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

export function ProLocationsAvailabilityManager({
  professionalId,
  primaryCity,
  primaryState,
  areas,
  availability,
  neighbourhoods,
}: ProLocationsAvailabilityManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Area form state
  const [showAddArea, setShowAddArea] = useState(false);
  const [areaCity, setAreaCity] = useState(primaryCity || "Port Harcourt");
  const [selectedNeighbourhoodId, setSelectedNeighbourhoodId] = useState("");
  const [customLga, setCustomLga] = useState("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [areaFeedback, setAreaFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const cityNeighbourhoods = useMemo(
    () => neighbourhoods.filter((n) => n.city.toLowerCase() === areaCity.toLowerCase()),
    [neighbourhoods, areaCity]
  );

  // Weekly availability state
  const [schedule, setSchedule] = useState(() =>
    WEEKDAY_CONFIG.map((cfg) => {
      const existing = availability.find((a) => a.day_of_week === cfg.day);
      return {
        dayOfWeek: cfg.day,
        label: cfg.label,
        isAvailable: existing ? existing.is_available : cfg.day !== 0,
        startTime: existing?.start_time?.slice(0, 5) || "08:00",
        endTime: existing?.end_time?.slice(0, 5) || "18:00",
      };
    })
  );
  const [availFeedback, setAvailFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    setAreaFeedback(null);

    startTransition(async () => {
      const res = await addProfessionalServiceAreaAction({
        professionalId,
        city: areaCity,
        neighbourhoodId: selectedNeighbourhoodId || undefined,
        lgaOrDistrict: customLga.trim() || undefined,
        serviceRadiusKm: parseInt(radiusKm, 10) || 25,
        isPrimary: areas.length === 0,
      });

      setAreaFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setSelectedNeighbourhoodId("");
        setCustomLga("");
        setShowAddArea(false);
        router.refresh();
      }
    });
  };

  const handleToggleArea = (areaId: string, nextActive: boolean) => {
    setAreaFeedback(null);
    startTransition(async () => {
      const res = await toggleProfessionalServiceAreaAction(areaId, professionalId, nextActive);
      setAreaFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const handleSetPrimary = (areaId: string) => {
    setAreaFeedback(null);
    startTransition(async () => {
      const res = await setPrimaryServiceAreaAction(areaId, professionalId);
      setAreaFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const handleRemoveArea = (areaId: string) => {
    setAreaFeedback(null);
    startTransition(async () => {
      const res = await removeProfessionalServiceAreaAction(areaId, professionalId);
      setAreaFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const updateScheduleDay = (
    dayOfWeek: number,
    patch: Partial<{ isAvailable: boolean; startTime: string; endTime: string }>
  ) => {
    setSchedule((prev) =>
      prev.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row))
    );
  };

  const handleSaveSchedule = () => {
    setAvailFeedback(null);
    startTransition(async () => {
      const res = await saveProfessionalWeeklyAvailabilityAction({
        professionalId,
        schedule: schedule.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          isAvailable: s.isAvailable,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
      setAvailFeedback({ ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Operating Hubs & Approved Service Areas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operating Hubs &amp; Approved Coverage ({areas.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Operate across approved hubs in Port Harcourt, Lagos, and Abuja with neighbourhood-level matching.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddArea((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
          >
            {showAddArea ? "Cancel" : "+ Add Service Location"}
          </button>
        </div>

        {areaFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              areaFeedback.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {areaFeedback.msg}
          </div>
        )}

        {showAddArea && (
          <form
            onSubmit={handleAddArea}
            className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approved Pilot City *
                </label>
                <select
                  value={areaCity}
                  onChange={(e) => {
                    setAreaCity(e.target.value);
                    setSelectedNeighbourhoodId("");
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
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
                  Approved Neighbourhood ({cityNeighbourhoods.length} available)
                </label>
                <select
                  value={selectedNeighbourhoodId}
                  onChange={(e) => setSelectedNeighbourhoodId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                >
                  <option value="">-- Optional: Select Approved Neighbourhood --</option>
                  {cityNeighbourhoods.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name} ({nb.lga})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LGA / District Name (if no neighbourhood picked)
                </label>
                <input
                  type="text"
                  value={customLga}
                  onChange={(e) => setCustomLga(e.target.value)}
                  disabled={Boolean(selectedNeighbourhoodId)}
                  placeholder="e.g. Obio/Akpor, Ikeja, Maitama"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coverage Radius (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Save Service Location"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-teal-900 block">
                Primary Base: {primaryCity}, {primaryState}
              </span>
              <span className="text-[11px] text-teal-700 mt-0.5 block">
                Used as your default city anchor for customer discovery.
              </span>
            </div>
          </div>

          {areas.map((a) => (
            <div
              key={a.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                a.is_active
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200 bg-slate-100/70 opacity-75"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {a.neighbourhood ? `${a.neighbourhood} • ${a.lga_or_district}` : a.lga_or_district} ({a.city})
                  </span>
                  {a.is_primary && (
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0D9488] text-[10px] font-bold">
                      Primary Hub
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {a.is_active ? "Active" : "Paused"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                  {a.service_radius_km} km coverage radius
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {!a.is_primary && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSetPrimary(a.id)}
                    className="px-2.5 py-1 rounded-lg border border-teal-200 text-[#0D9488] hover:bg-teal-50 text-[11px] font-semibold"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleArea(a.id, !a.is_active)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold"
                >
                  {a.is_active ? "Pause" : "Activate"}
                </button>
                {areas.length > 1 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemoveArea(a.id)}
                    className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Working Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Working Hours &amp; Weekly Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the exact days and operating hours when customers can book you.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveSchedule}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-xs"
          >
            {isPending ? "Saving Schedule..." : "Save Working Hours"}
          </button>
        </div>

        {availFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              availFeedback.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {availFeedback.msg}
          </div>
        )}

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {schedule.map((row) => (
            <div
              key={row.dayOfWeek}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70"
            >
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-900 cursor-pointer w-36">
                <input
                  type="checkbox"
                  checked={row.isAvailable}
                  onChange={(e) =>
                    updateScheduleDay(row.dayOfWeek, { isAvailable: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-[#0D9488] focus:ring-[#0D9488] border-slate-300"
                />
                <span>{row.label}</span>
              </label>

              {row.isAvailable ? (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) =>
                      updateScheduleDay(row.dayOfWeek, { startTime: e.target.value })
                    }
                    className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) =>
                      updateScheduleDay(row.dayOfWeek, { endTime: e.target.value })
                    }
                    className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  Day Off (Not Accepting Bookings)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
