export const analyticsEvents = [
  "demo_start",
  "demo_submit",
  "today_start",
  "result_share",
] as const;

export type AnalyticsEventName = (typeof analyticsEvents)[number];

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && analyticsEvents.includes(value as AnalyticsEventName);
}
