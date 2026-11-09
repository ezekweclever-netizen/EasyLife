/**
 * OpenStreetMap (Nominatim) Location Provider
 * Open-source, configurable geocoding provider without vendor lock-in.
 */

import { LocationSearchResult, GeoCoordinates, MapsProviderType } from "../types";
import { LocalLocationProvider } from "./local-provider";

export class OpenStreetMapLocationProvider {
  readonly name: MapsProviderType = "osm";
  private localFallback = new LocalLocationProvider();

  async search(query: string, city?: string): Promise<LocationSearchResult[]> {
    const searchQuery = city ? `${query}, ${city}, Nigeria` : `${query}, Nigeria`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&countrycodes=ng&addressdetails=1&limit=8`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "EasyLife-Marketplace/1.0 (contact@easylife.ng)",
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return this.localFallback.search(query, city);
      }

      return data.map((item: any, idx: number) => {
        const addr = item.address || {};
        return {
          id: `osm-${item.place_id || idx}`,
          displayName: item.display_name,
          formattedAddress: item.display_name,
          neighbourhood: addr.suburb || addr.neighbourhood || addr.quarter,
          lga: addr.county || addr.city_district,
          city: addr.city || addr.town || city || "Port Harcourt",
          state: addr.state || "Rivers State",
          country: "Nigeria",
          coordinates: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
          provider: "osm",
        };
      });
    } catch (err) {
      console.warn("OpenStreetMap search failed, falling back to local dataset:", err);
      return this.localFallback.search(query, city);
    }
  }

  async geocode(address: string, city?: string): Promise<LocationSearchResult | null> {
    const results = await this.search(address, city);
    return results[0] || null;
  }

  async reverseGeocode(coords: GeoCoordinates): Promise<LocationSearchResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "EasyLife-Marketplace/1.0 (contact@easylife.ng)",
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim reverse HTTP ${res.status}`);
      }

      const item = await res.json();
      if (!item || !item.lat) {
        return this.localFallback.reverseGeocode(coords);
      }

      const addr = item.address || {};
      return {
        id: `osm-rev-${item.place_id}`,
        displayName: item.display_name,
        formattedAddress: item.display_name,
        neighbourhood: addr.suburb || addr.neighbourhood,
        lga: addr.county,
        city: addr.city || addr.town || "Port Harcourt",
        state: addr.state || "Rivers State",
        country: "Nigeria",
        coordinates: coords,
        provider: "osm",
      };
    } catch (err) {
      console.warn("OpenStreetMap reverse geocode failed, using local fallback:", err);
      return this.localFallback.reverseGeocode(coords);
    }
  }
}
