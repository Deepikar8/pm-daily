import { describe, it, expect } from "vitest";
import { buildICS } from "../../src/lib/server/calendar/ics";

describe("buildICS", () => {
  it("contains required VEVENT fields", () => {
    const ics = buildICS({ userId: "u1", timezone: "America/Los_Angeles", appUrl: "https://pmdaily.app" });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("SUMMARY:Product Gym — 5 min");
    expect(ics).toContain("URL:https://pmdaily.app/today");
    expect(ics).toContain("TZID=America/Los_Angeles");
  });
  it("UID is stable per user", () => {
    expect(buildICS({ userId: "u1", timezone: "UTC", appUrl: "x" })).toContain("UID:pm-daily-u1@pmdaily.app");
    expect(buildICS({ userId: "u2", timezone: "UTC", appUrl: "x" })).toContain("UID:pm-daily-u2@pmdaily.app");
  });
  it("uses CRLF separators per RFC 5545", () => {
    const ics = buildICS({ userId: "u1", timezone: "UTC", appUrl: "x" });
    expect(ics).toMatch(/\r\n/);
    expect(ics).not.toMatch(/(?<!\r)\n/);   // no bare LF
  });
  it("respects different timezones", () => {
    expect(buildICS({ userId: "u1", timezone: "Asia/Kolkata",      appUrl: "x" })).toContain("TZID=Asia/Kolkata");
    expect(buildICS({ userId: "u1", timezone: "Europe/Berlin",     appUrl: "x" })).toContain("TZID=Europe/Berlin");
    expect(buildICS({ userId: "u1", timezone: "America/New_York",  appUrl: "x" })).toContain("TZID=America/New_York");
  });
  it("SUMMARY uses PT5M duration", () => {
    expect(buildICS({ userId: "u1", timezone: "UTC", appUrl: "x" })).toContain("DURATION:PT5M");
  });
});
