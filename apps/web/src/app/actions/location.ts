"use server";

import { getLocationProvider } from "@/lib/location/adapter";
import { calculateServiceDistance } from "@/lib/location/distance";
import { GeoCoordinates, LocationSearchResult, DistanceCalculationResult } from "@/lib/location/types";

export async function searchLocationsAction(
  query: string,
  city?: string
): Promise<{ success: boolean; data: LocationSearchResult[]; error?: string }> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const provider = getLocationProvider();
    const results = await provider.search(query.trim(), city);
    return { success: true, data: results };
  } catch (err: any) {
    console.error("searchLocationsAction error:", err);
    return { success: false, data: [], error: err.message };
  }
}

export async function geocodeAddressAction(
  address: string,
  city?: string
): Promise<{ success: boolean; data: LocationSearchResult | null; error?: string }> {
  try {
    if (!address || !address.trim()) {
      return { success: false, data: null, error: "Address is required." };
    }

    const provider = getLocationProvider();
    const result = await provider.geocode(address.trim(), city);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("geocodeAddressAction error:", err);
    return { success: false, data: null, error: err.message };
  }
}

export async function calculateServiceDistanceAction(
  origin: GeoCoordinates,
  destination: GeoCoordinates
): Promise<{ success: boolean; data: DistanceCalculationResult | null; error?: string }> {
  try {
    if (!origin?.latitude || !destination?.latitude) {
      return { success: false, data: null, error: "Valid origin and destination coordinates required." };
    }

    const result = calculateServiceDistance(origin, destination);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("calculateServiceDistanceAction error:", err);
    return { success: false, data: null, error: err.message };
  }
}
