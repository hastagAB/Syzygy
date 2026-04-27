import { NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT } from "@/lib/config";
import type { Result } from "@/lib/data/tle-fetcher";
import type { LatLon } from "@/types";

export interface GeocodeResult {
  readonly lat: number;
  readonly lon: number;
  readonly displayName: string;
}

export async function geocodeAddress(query: string): Promise<Result<GeocodeResult>> {
  try {
    const url = new URL("/search", NOMINATIM_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      return { ok: false, error: `Geocoding failed: ${response.status}` };
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (data.length === 0) {
      return { ok: false, error: "No results found" };
    }

    return {
      ok: true,
      value: {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      },
    };
  } catch {
    return { ok: false, error: "Geocoding request failed" };
  }
}

export async function reverseGeocode(location: LatLon): Promise<Result<string>> {
  try {
    const url = new URL("/reverse", NOMINATIM_BASE_URL);
    url.searchParams.set("lat", String(location.lat));
    url.searchParams.set("lon", String(location.lon));
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      return { ok: false, error: `Reverse geocoding failed: ${response.status}` };
    }

    const data = (await response.json()) as { display_name: string };
    return { ok: true, value: data.display_name };
  } catch {
    return { ok: false, error: "Reverse geocoding request failed" };
  }
}
