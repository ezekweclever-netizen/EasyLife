"use client";

import React, { useState, useTransition } from "react";
import { searchLocationsAction } from "@/app/actions/location";
import { LocationSearchResult, GeoCoordinates } from "@/lib/location/types";
import { calculateHaversineDistanceKm, estimateDrivingDurationMinutes } from "@/lib/location/distance";

// Regional Hub Reference Coordinates
const HUB_CENTERS: Record<string, GeoCoordinates> = {
  "Port Harcourt": { latitude: 4.8156, longitude: 7.0125 },
  Lagos: { latitude: 6.5244, longitude: 3.3792 },
  Abuja: { latitude: 9.0765, longitude: 7.3986 },
};

interface LocationPickerProps {
  initialValue?: string;
  initialCoords?: GeoCoordinates | null;
  onSelectLocation?: (location: LocationSearchResult) => void;
  label?: string;
  placeholder?: string;
  filterCity?: string;
}

export function LocationPicker({
  initialValue = "",
  initialCoords = null,
  onSelectLocation,
  label = "Service Location",
  placeholder = "Search district or neighbourhood (e.g. Old GRA, Lekki Phase 1, Wuse 2)...",
  filterCity = "",
}: LocationPickerProps) {
  const [query, setQuery] = useState(initialValue);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(
    initialCoords
      ? {
          id: "initial",
          displayName: initialValue || "Selected Coordinates",
          formattedAddress: initialValue || "Selected Coordinates",
          city: filterCity || "Nigeria",
          state:
            filterCity === "Lagos"
              ? "Lagos State"
              : filterCity === "Abuja"
              ? "FCT"
              : filterCity === "Port Harcourt"
              ? "Rivers State"
              : "",
          country: "Nigeria",
          coordinates: initialCoords,
          provider: "local",
        }
      : null
  );
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await searchLocationsAction(text, filterCity || undefined);
      if (res.success && res.data) {
        setSuggestions(res.data);
        setIsOpen(true);
      }
    });
  };

  const handleSelect = (loc: LocationSearchResult) => {
    setSelectedLocation(loc);
    setQuery(loc.displayName);
    setIsOpen(false);
    onSelectLocation?.(loc);
  };

  const activeHubCity =
    selectedLocation?.city && HUB_CENTERS[selectedLocation.city]
      ? selectedLocation.city
      : filterCity && HUB_CENTERS[filterCity]
      ? filterCity
      : "Port Harcourt";

  const hubCoords = HUB_CENTERS[activeHubCity] || HUB_CENTERS["Port Harcourt"]!;
  const distanceKm = selectedLocation
    ? calculateHaversineDistanceKm(hubCoords, selectedLocation.coordinates)
    : null;
  const durationMins = distanceKm !== null ? estimateDrivingDurationMinutes(distanceKm) : null;

  return (
    <div className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className="text-[10px] font-semibold text-[#0D9488] px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
          📍 {filterCity ? `${filterCity} Hub` : "Port Harcourt • Lagos • Abuja"}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#0D9488] shadow-2xs"
        />

        {isPending && (
          <div className="absolute right-3.5 top-3.5">
            <span className="flex h-3 w-3 rounded-full bg-teal-500 animate-ping" />
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {suggestions.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left p-3 hover:bg-teal-50/60 transition flex items-start gap-2.5 text-xs text-slate-800"
              >
                <span className="text-base shrink-0 mt-0.5">📍</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {loc.displayName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Lat: {loc.coordinates.latitude.toFixed(4)}, Lon: {loc.coordinates.longitude.toFixed(4)} • {loc.provider.toUpperCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Coordinates & Transit Metric Card */}
      {selectedLocation && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono font-bold text-[10px]">
              {selectedLocation.coordinates.latitude.toFixed(4)}°N, {selectedLocation.coordinates.longitude.toFixed(4)}°E
            </span>
            <span className="text-slate-600 font-medium truncate max-w-xs">
              {selectedLocation.neighbourhood || selectedLocation.city} ({selectedLocation.lga || "LGA"})
            </span>
          </div>

          {distanceKm !== null && (
            <div className="text-[11px] text-slate-500 shrink-0">
              ~<strong className="text-slate-800">{distanceKm} km</strong> from {activeHubCity} Hub ({durationMins} mins drive)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
