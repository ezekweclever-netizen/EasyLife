/**
 * Port Harcourt & Nigerian Major Hubs Local Geolocation Dataset
 * High-accuracy curated pilot geography for Port Harcourt (Rivers State), Lagos, and Abuja.
 */

import { LocationSearchResult, GeoCoordinates, MapsProviderType } from "../types";

export interface CuratedLocation {
  name: string;
  neighbourhood: string;
  lga: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  synonyms: string[];
}

export const PORT_HARCOURT_LOCATIONS: CuratedLocation[] = [
  {
    name: "Old GRA",
    neighbourhood: "Old GRA",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.8156,
    longitude: 7.0125,
    synonyms: ["gra", "old gra", "government reserved area", "forces avenue"],
  },
  {
    name: "GRA Phase 1 & 2",
    neighbourhood: "GRA Phase 2",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.821,
    longitude: 7.008,
    synonyms: ["gra 2", "gra phase 2", "tombia street", "birabi street"],
  },
  {
    name: "Peter Odili Road",
    neighbourhood: "Peter Odili",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.7981,
    longitude: 7.0425,
    synonyms: ["peter odili", "trans amadi gardens", "odili road", "abuloma"],
  },
  {
    name: "Trans-Amadi Industrial Layout",
    neighbourhood: "Trans-Amadi",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.8219,
    longitude: 7.0392,
    synonyms: ["trans amadi", "industrial layout", "slaughter", "ordinance"],
  },
  {
    name: "D-Line",
    neighbourhood: "D-Line",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.812,
    longitude: 7.001,
    synonyms: ["dline", "d-line", "olu obasanjo", "waterlines"],
  },
  {
    name: "Rumuokoro Junction",
    neighbourhood: "Rumuokoro",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.8672,
    longitude: 6.9856,
    synonyms: ["rumuokoro", "east west road", "okoro", "federal government college"],
  },
  {
    name: "Woji Estate",
    neighbourhood: "Woji",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.829,
    longitude: 7.062,
    synonyms: ["woji", "woji estate", "alcon", "ykc"],
  },
  {
    name: "Choba (Uniport Axis)",
    neighbourhood: "Choba",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.898,
    longitude: 6.914,
    synonyms: ["choba", "uniport", "university of port harcourt", "alakahia"],
  },
  {
    name: "Elelenwo",
    neighbourhood: "Elelenwo",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.835,
    longitude: 7.085,
    synonyms: ["elelenwo", "railway", "oil mill"],
  },
  {
    name: "Ada George Road",
    neighbourhood: "Ada George",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.838,
    longitude: 6.975,
    synonyms: ["ada george", "location", "agip roundabout", "chinda"],
  },
  {
    name: "Stadium Road / Rumuomasi",
    neighbourhood: "Rumuomasi",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.831,
    longitude: 7.021,
    synonyms: ["stadium road", "rumuomasi", "liberation stadium", "airforce"],
  },
  {
    name: "Artillery / Rumuokwurusi",
    neighbourhood: "Artillery",
    lga: "Obio/Akpor",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.846,
    longitude: 7.051,
    synonyms: ["artillery", "rumuokwurusi", "first artillery", "second artillery", "tank"],
  },
  {
    name: "Diobu (Mile 1, 2, 3)",
    neighbourhood: "Diobu",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.795,
    longitude: 6.995,
    synonyms: ["diobu", "mile 1", "mile 2", "mile 3", "ikwerre road", "education"],
  },
  {
    name: "Borikiri / Old Township",
    neighbourhood: "Township",
    lga: "Port Harcourt",
    city: "Port Harcourt",
    state: "Rivers State",
    latitude: 4.755,
    longitude: 7.035,
    synonyms: ["borikiri", "town", "harbour road", "creek road", "aggreg road"],
  },
];

export const OTHER_HUBS_LOCATIONS: CuratedLocation[] = [
  {
    name: "Ikeja GRA, Lagos",
    neighbourhood: "Ikeja GRA",
    lga: "Ikeja",
    city: "Lagos",
    state: "Lagos State",
    latitude: 6.5912,
    longitude: 3.3575,
    synonyms: ["ikeja", "ikeja gra", "allen avenue"],
  },
  {
    name: "Lekki Phase 1, Lagos",
    neighbourhood: "Lekki Phase 1",
    lga: "Eti-Osa",
    city: "Lagos",
    state: "Lagos State",
    latitude: 6.4474,
    longitude: 3.4723,
    synonyms: ["lekki", "lekki phase 1", "admiralty way"],
  },
  {
    name: "Maitama, Abuja",
    neighbourhood: "Maitama",
    lga: "Municipal",
    city: "Abuja",
    state: "FCT",
    latitude: 9.0882,
    longitude: 7.4933,
    synonyms: ["maitama", "abuja central"],
  },
];

export const ALL_CURATED_LOCATIONS = [
  ...PORT_HARCOURT_LOCATIONS,
  ...OTHER_HUBS_LOCATIONS,
];

/**
 * Local Location Provider: Fast, offline-reliable search for Port Harcourt & hubs
 */
export class LocalLocationProvider {
  readonly name: MapsProviderType = "local";

  async search(query: string, city?: string): Promise<LocationSearchResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    let pool = ALL_CURATED_LOCATIONS;
    if (city) {
      const c = city.toLowerCase();
      pool = pool.filter((loc) => loc.city.toLowerCase().includes(c));
    }

    const matches = pool.filter((loc) => {
      if (loc.name.toLowerCase().includes(q)) return true;
      if (loc.neighbourhood.toLowerCase().includes(q)) return true;
      if (loc.lga.toLowerCase().includes(q)) return true;
      return loc.synonyms.some((syn) => syn.includes(q) || q.includes(syn));
    });

    return matches.slice(0, 8).map((loc, idx) => ({
      id: `local-loc-${idx}-${loc.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      displayName: `${loc.name}, ${loc.lga}, ${loc.city}, ${loc.state}`,
      formattedAddress: `${loc.name}, ${loc.city}, ${loc.state}, Nigeria`,
      neighbourhood: loc.neighbourhood,
      lga: loc.lga,
      city: loc.city,
      state: loc.state,
      country: "Nigeria",
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      provider: "local",
    }));
  }

  async geocode(address: string, city?: string): Promise<LocationSearchResult | null> {
    const results = await this.search(address, city);
    return results[0] || null;
  }

  async reverseGeocode(coords: GeoCoordinates): Promise<LocationSearchResult | null> {
    // Find closest location using Haversine
    let closest: CuratedLocation | null = null;
    let minDistance = Infinity;

    for (const loc of ALL_CURATED_LOCATIONS) {
      const dLat = ((loc.latitude - coords.latitude) * Math.PI) / 180;
      const dLon = ((loc.longitude - coords.longitude) * Math.PI) / 180;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }

    if (!closest) return null;

    return {
      id: `local-rev-${closest.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      displayName: `${closest.name}, ${closest.lga}, ${closest.city}`,
      formattedAddress: `${closest.name}, ${closest.city}, ${closest.state}, Nigeria`,
      neighbourhood: closest.neighbourhood,
      lga: closest.lga,
      city: closest.city,
      state: closest.state,
      country: "Nigeria",
      coordinates: coords,
      provider: "local",
    };
  }
}
