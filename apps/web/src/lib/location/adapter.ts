/**
 * EasyLife Location Adapter
 * Configurable location provider to avoid unnecessary vendor lock-in.
 * Supports: OpenStreetMap (default), Google Maps, and Port Harcourt Local Provider.
 */

import {
  LocationSearchResult,
  GeoCoordinates,
  MapsProviderType,
} from "./types";
import { OpenStreetMapLocationProvider } from "./providers/osm-provider";
import { LocalLocationProvider } from "./providers/local-provider";

export interface LocationProvider {
  readonly name: MapsProviderType;
  search(query: string, city?: string): Promise<LocationSearchResult[]>;
  geocode(address: string, city?: string): Promise<LocationSearchResult | null>;
  reverseGeocode(coords: GeoCoordinates): Promise<LocationSearchResult | null>;
}

/**
 * Google Maps Geocoding API Provider (activated when GOOGLE_MAPS_API_KEY is present)
 */
export class GoogleMapsLocationProvider implements LocationProvider {
  readonly name: MapsProviderType = "google";
  private apiKey: string;
  private fallback = new OpenStreetMapLocationProvider();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, city?: string): Promise<LocationSearchResult[]> {
    if (!this.apiKey) return this.fallback.search(query, city);

    const address = city ? `${query}, ${city}, Nigeria` : `${query}, Nigeria`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&components=country:NG&key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== "OK" || !Array.isArray(json.results) || json.results.length === 0) {
        return this.fallback.search(query, city);
      }

      return json.results.map((r: any, idx: number) => {
        const getComponent = (type: string) =>
          r.address_components?.find((c: any) => c.types?.includes(type))?.long_name;

        return {
          id: `google-${r.place_id || idx}`,
          displayName: r.formatted_address,
          formattedAddress: r.formatted_address,
          neighbourhood: getComponent("neighborhood") || getComponent("sublocality"),
          lga: getComponent("administrative_area_level_2"),
          city: getComponent("locality") || city || "Port Harcourt",
          state: getComponent("administrative_area_level_1") || "Rivers State",
          country: "Nigeria",
          coordinates: {
            latitude: r.geometry.location.lat,
            longitude: r.geometry.location.lng,
          },
          provider: "google" as const,
        };
      });
    } catch (err) {
      console.warn("Google Maps geocoding error, falling back:", err);
      return this.fallback.search(query, city);
    }
  }

  async geocode(address: string, city?: string): Promise<LocationSearchResult | null> {
    const results = await this.search(address, city);
    return results[0] || null;
  }

  async reverseGeocode(coords: GeoCoordinates): Promise<LocationSearchResult | null> {
    if (!this.apiKey) return this.fallback.reverseGeocode(coords);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${this.apiKey}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== "OK" || !json.results?.[0]) {
        return this.fallback.reverseGeocode(coords);
      }

      const r = json.results[0];
      return {
        id: `google-rev-${r.place_id}`,
        displayName: r.formatted_address,
        formattedAddress: r.formatted_address,
        city: "Port Harcourt",
        state: "Rivers State",
        country: "Nigeria",
        coordinates: coords,
        provider: "google",
      };
    } catch {
      return this.fallback.reverseGeocode(coords);
    }
  }
}

/**
 * Factory to retrieve the active configured Location Provider
 */
export function getLocationProvider(): LocationProvider {
  const providerType = (process.env.MAPS_PROVIDER || "osm").toLowerCase() as MapsProviderType;
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (providerType === "google" && googleApiKey) {
    return new GoogleMapsLocationProvider(googleApiKey);
  }

  if (providerType === "local") {
    return new LocalLocationProvider();
  }

  // Default: OpenStreetMap (Nominatim with automatic Port Harcourt fallback)
  return new OpenStreetMapLocationProvider();
}
