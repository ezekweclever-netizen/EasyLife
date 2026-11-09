/**
 * Haversine Distance & Travel Duration Calculations
 */

import { GeoCoordinates, DistanceCalculationResult } from "./types";

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points on Earth using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  origin: GeoCoordinates,
  destination: GeoCoordinates
): number {
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);

  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Estimates driving duration based on typical Nigerian urban road conditions
 * - Assumes an average urban speed of 25 km/h in dense traffic (Port Harcourt / Lagos)
 * - Minimum response/setup overhead of 5 minutes
 */
export function estimateDrivingDurationMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 5;
  const averageSpeedKmH = distanceKm > 15 ? 40 : 25;
  const hours = distanceKm / averageSpeedKmH;
  const minutes = Math.round(hours * 60) + 5; // +5 mins parking / site arrival
  return Math.max(5, minutes);
}

/**
 * Calculate complete service distance and transit time
 */
export function calculateServiceDistance(
  origin: GeoCoordinates,
  destination: GeoCoordinates
): DistanceCalculationResult {
  const distanceKm = calculateHaversineDistanceKm(origin, destination);
  const duration = estimateDrivingDurationMinutes(distanceKm);

  return {
    origin,
    destination,
    distanceKm,
    estimatedDrivingDurationMinutes: duration,
    calculationMethod: "haversine_great_circle",
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
