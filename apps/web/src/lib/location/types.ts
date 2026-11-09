/**
 * EasyLife Location & Mapping Types
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationSearchResult {
  id: string;
  displayName: string;
  formattedAddress: string;
  neighbourhood?: string;
  lga?: string;
  city: string;
  state: string;
  country: string;
  coordinates: GeoCoordinates;
  provider: "osm" | "google" | "local";
}

export interface DistanceCalculationResult {
  origin: GeoCoordinates;
  destination: GeoCoordinates;
  distanceKm: number;
  estimatedDrivingDurationMinutes: number;
  calculationMethod: "haversine_great_circle" | "road_network";
}

export type MapsProviderType = "osm" | "google" | "mapbox" | "local";
