import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeAddress, reverseGeocode } from "@/lib/data/geocoder";

describe("geocoder", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should_geocode_address_to_coordinates", async () => {
    const mockResponse = [
      { lat: "45.4642", lon: "9.1900", display_name: "Milan, Italy" },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await geocodeAddress("Milan, Italy");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lat).toBeCloseTo(45.4642, 2);
      expect(result.value.lon).toBeCloseTo(9.19, 2);
      expect(result.value.displayName).toBe("Milan, Italy");
    }
  });

  it("should_return_error_for_no_results", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const result = await geocodeAddress("xyznonexistent");

    expect(result.ok).toBe(false);
  });

  it("should_reverse_geocode_coordinates", async () => {
    const mockResponse = { display_name: "Milan, Italy" };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await reverseGeocode({ lat: 45.4642, lon: 9.19 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Milan, Italy");
    }
  });

  it("should_handle_network_error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const result = await geocodeAddress("Milan");

    expect(result.ok).toBe(false);
  });
});
