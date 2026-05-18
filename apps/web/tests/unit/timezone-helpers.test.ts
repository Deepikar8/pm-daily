import { describe, expect, it } from "vitest";
import { localDate, normalizeTimezone } from "../../src/lib/server/timezone/helpers";

describe("timezone helpers", () => {
  it("keeps valid IANA timezones", () => {
    expect(normalizeTimezone("Asia/Kolkata")).toBe("Asia/Kolkata");
  });

  it("falls back for invalid timezone labels", () => {
    expect(normalizeTimezone("India")).toBe("UTC");
    expect(localDate("India", new Date("2026-05-18T12:00:00Z"))).toBe("2026-05-18");
  });
});
