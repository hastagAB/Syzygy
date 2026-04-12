import { TLE_CACHE_TTL_MS } from "@/lib/config";

interface CacheEntry {
  readonly line1: string;
  readonly line2: string;
  readonly cachedAt: number;
}

export class TleCache {
  private readonly cache = new Map<number, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = TLE_CACHE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(noradId: number): { line1: string; line2: string } | null {
    const entry = this.cache.get(noradId);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(noradId);
      return null;
    }

    return { line1: entry.line1, line2: entry.line2 };
  }

  set(noradId: number, tle: { line1: string; line2: string }): void {
    this.cache.set(noradId, {
      line1: tle.line1,
      line2: tle.line2,
      cachedAt: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
