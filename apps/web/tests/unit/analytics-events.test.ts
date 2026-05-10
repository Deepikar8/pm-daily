import { describe, expect, it } from "vitest";
import { analyticsEvents, isAnalyticsEventName } from "../../src/lib/analytics/events";

describe("analytics events", () => {
  it("tracks the launch-critical funnel events", () => {
    expect(analyticsEvents).toEqual([
      "demo_start",
      "demo_submit",
      "today_start",
      "result_share",
    ]);
  });

  it("rejects unknown event names", () => {
    expect(isAnalyticsEventName("demo_start")).toBe(true);
    expect(isAnalyticsEventName("email")).toBe(false);
  });
});
