import type { RequestHandler } from "./$types";
import { buildICS } from "$lib/server/calendar/ics";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  const ics = buildICS({
    userId: locals.user.id,
    timezone: locals.user.timezone || "UTC",
    appUrl: url.origin,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pm-daily.ics"',
    },
  });
};
