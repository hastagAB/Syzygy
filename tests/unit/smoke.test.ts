import { describe, it, expect } from "vitest";

describe("smoke test", () => {
  it("should_pass_basic_arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("should_resolve_src_imports", async () => {
    const config = await import("@/lib/config");
    expect(config.CELESTRAK_BASE_URL).toBeDefined();
  });
});
