import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTleText, fetchTle } from "@/lib/data/tle-fetcher";
import {
  ISS_TLE_RAW_TEXT,
  MALFORMED_TLE_TEXT,
  MULTI_SAT_TLE_RAW,
} from "../../../tests/fixtures/tle-fixtures";

describe("TLE parser", () => {
  it("should_parse_valid_tle_lines", () => {
    const records = parseTleText(ISS_TLE_RAW_TEXT);
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("ISS (ZARYA)");
    expect(records[0].noradId).toBe(25544);
    expect(records[0].line1).toContain("25544U");
    expect(records[0].line2).toContain("25544");
    expect(records[0].epoch).toBeInstanceOf(Date);
  });

  it("should_parse_multiple_satellites", () => {
    const records = parseTleText(MULTI_SAT_TLE_RAW);
    expect(records).toHaveLength(2);
    expect(records[0].name).toBe("ISS (ZARYA)");
    expect(records[1].name).toBe("HST");
    expect(records[1].noradId).toBe(20580);
  });

  it("should_compute_epoch_date_from_tle", () => {
    const records = parseTleText(ISS_TLE_RAW_TEXT);
    const epoch = records[0].epoch;
    // Epoch 24045.51750649 = 2024, day 45.517... = Feb 14, 2024 ~12:25 UTC
    expect(epoch.getUTCFullYear()).toBe(2024);
    expect(epoch.getUTCMonth()).toBe(1); // February
    expect(epoch.getUTCDate()).toBe(14);
  });

  it("should_reject_malformed_tle", () => {
    const records = parseTleText(MALFORMED_TLE_TEXT);
    expect(records).toHaveLength(0);
  });

  it("should_handle_empty_input", () => {
    const records = parseTleText("");
    expect(records).toHaveLength(0);
  });
});

describe("TLE fetcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should_fetch_tle_from_celestrak", async () => {
    const mockResponse = new Response(ISS_TLE_RAW_TEXT, { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    const result = await fetchTle(25544);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.noradId).toBe(25544);
    }
  });

  it("should_return_error_for_http_failure", async () => {
    const mockResponse = new Response("Not Found", { status: 404 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    const result = await fetchTle(99999);
    expect(result.ok).toBe(false);
  });

  it("should_return_error_for_network_failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchTle(25544);
    expect(result.ok).toBe(false);
  });
});
