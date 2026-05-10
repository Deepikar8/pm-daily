import { browser } from "$app/environment";
import type { AnalyticsEventName } from "./events";

export function track(event: AnalyticsEventName, properties: Record<string, unknown> = {}) {
  if (!browser) return;

  const body = JSON.stringify({
    event,
    properties,
    path: window.location.pathname,
    at: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
