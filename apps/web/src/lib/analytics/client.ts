import { browser } from "$app/environment";
import type { AnalyticsEventName } from "./events";

type AnalyticsConfig = {
  posthogKey?: string;
  posthogHost?: string;
};

type AnalyticsUser = {
  id: string;
  email?: string;
  displayName?: string;
};

let posthogClient: typeof import("posthog-js").default | null = null;
let initPromise: Promise<typeof import("posthog-js").default | null> | null = null;
let identifiedUserId: string | null = null;

export function initAnalytics(config: AnalyticsConfig = {}) {
  if (!browser || !config.posthogKey?.trim()) return;
  if (posthogClient || initPromise) return;

  initPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(config.posthogKey!, {
        api_host: config.posthogHost || "https://us.i.posthog.com",
        autocapture: false,
        capture_pageview: false,
        person_profiles: "identified_only",
      });
      posthogClient = posthog;
      return posthog;
    })
    .catch((error) => {
      console.warn("PostHog init failed", error);
      initPromise = null;
      return null;
    });
}

export function identify(user: AnalyticsUser | null | undefined) {
  if (!browser || !initPromise) return;

  void initPromise.then((posthog) => {
    if (!posthog) return;
    if (!user?.id) {
      if (identifiedUserId) posthog.reset();
      identifiedUserId = null;
      return;
    }
    if (identifiedUserId === user.id) return;
    posthog.identify(user.id, {
      email: user.email,
      name: user.displayName,
    });
    identifiedUserId = user.id;
  });
}

export function track(event: AnalyticsEventName, properties: Record<string, unknown> = {}) {
  if (!browser) return;

  const enrichedProperties = {
    ...properties,
    path: window.location.pathname,
  };

  if (initPromise) {
    void initPromise.then((posthog) => {
      posthog?.capture(event, enrichedProperties);
    });
  }

  const body = JSON.stringify({
    event,
    properties: enrichedProperties,
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
