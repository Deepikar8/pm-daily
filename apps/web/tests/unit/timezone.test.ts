import { describe, it, expect } from "vitest";
import { localDate, isoWeekKey, daysBetween } from "../../src/lib/server/timezone/helpers";

describe("timezone helpers", () => {
  it("daysBetween: same day = 0", () => {
    expect(daysBetween("2026-05-08", "2026-05-08")).toBe(0);
  });
  it("daysBetween: across month boundary = 1", () => {
    expect(daysBetween("2026-04-30", "2026-05-01")).toBe(1);
  });
  it("daysBetween: 2 days apart", () => {
    expect(daysBetween("2026-05-06", "2026-05-08")).toBe(2);
  });
  it("daysBetween: backwards is negative", () => {
    expect(daysBetween("2026-05-08", "2026-05-06")).toBe(-2);
  });
  it("localDate Asia/Kolkata at 23:00 UTC rolls over to next day", () => {
    expect(localDate("Asia/Kolkata", new Date("2026-05-08T23:00:00Z"))).toBe("2026-05-09");
  });
  it("localDate America/Los_Angeles at 03:00 UTC is previous day", () => {
    expect(localDate("America/Los_Angeles", new Date("2026-05-08T03:00:00Z"))).toBe("2026-05-07");
  });
  it("isoWeekKey UTC mid-week of 2026 ISO week 19", () => {
    // Wed May 6 2026 → ISO week 19
    expect(isoWeekKey("UTC", new Date("2026-05-06T12:00:00Z"))).toBe("2026-W19");
  });
});
