import { describe, expect, it } from "vitest";
import { compareIsoDate, isIsoDate } from "../../src/lib/server/quiz/date";

describe("quiz date helpers", () => {
  it("accepts YYYY-MM-DD dates only", () => {
    expect(isIsoDate("2026-05-10")).toBe(true);
    expect(isIsoDate("2026-5-10")).toBe(false);
    expect(isIsoDate("tomorrow")).toBe(false);
  });

  it("compares ISO dates lexically", () => {
    expect(compareIsoDate("2026-05-09", "2026-05-10")).toBeLessThan(0);
    expect(compareIsoDate("2026-05-10", "2026-05-10")).toBe(0);
    expect(compareIsoDate("2026-05-11", "2026-05-10")).toBeGreaterThan(0);
  });
});

