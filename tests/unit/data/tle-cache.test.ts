import { describe, it, expect, vi, beforeEach } from "vitest";
import { TleCache } from "@/lib/data/tle-cache";

describe("TleCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should_cache_tle_and_return_on_subsequent_calls", () => {
    const cache = new TleCache(60_000);
    const tle = { line1: "line1", line2: "line2" };

    cache.set(25544, tle);
    const result = cache.get(25544);

    expect(result).toEqual(tle);
  });

  it("should_expire_after_ttl", () => {
    const cache = new TleCache(1000);
    const tle = { line1: "line1", line2: "line2" };

    cache.set(25544, tle);
    expect(cache.get(25544)).toEqual(tle);

    vi.advanceTimersByTime(1001);
    expect(cache.get(25544)).toBeNull();
  });

  it("should_return_null_on_cache_miss", () => {
    const cache = new TleCache(60_000);
    expect(cache.get(99999)).toBeNull();
  });

  it("should_clear_all_entries", () => {
    const cache = new TleCache(60_000);
    cache.set(25544, { line1: "a", line2: "b" });
    cache.set(20580, { line1: "c", line2: "d" });

    cache.clear();

    expect(cache.get(25544)).toBeNull();
    expect(cache.get(20580)).toBeNull();
  });
});
