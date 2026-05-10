import type { RequestHandler } from "./$types";
import { isAnalyticsEventName } from "$lib/analytics/events";

export const POST: RequestHandler = async ({ request, locals }) => {
  const payload = (await request.json().catch(() => null)) as {
    event?: unknown;
    properties?: Record<string, unknown>;
    path?: string;
    at?: string;
  } | null;

  if (!payload || !isAnalyticsEventName(payload.event)) {
    return new Response("invalid event", { status: 400 });
  }

  console.info("analytics", {
    event: payload.event,
    properties: payload.properties ?? {},
    path: typeof payload.path === "string" ? payload.path : "",
    at: typeof payload.at === "string" ? payload.at : new Date().toISOString(),
    userId: locals.user?.id ?? null,
  });

  return new Response(null, { status: 204 });
};
