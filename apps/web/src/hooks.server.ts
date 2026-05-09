import type { Handle } from "@sveltejs/kit";
import { createAuth } from "$lib/server/auth/better-auth";
import { resolveAuthBaseURL } from "$lib/server/auth/config";
import { getDb } from "$lib/server/db/client";

// Re-export the Durable Object class from the worker bundle so that
// adapter-cloudflare picks it up alongside the SvelteKit handler.
// `wrangler.toml` references `class_name = "QuizSession"` on the same
// script — Cloudflare looks for the export by name on the worker module.
export { QuizSession } from "$lib/durable-objects/quiz-session";

// Re-export the cron entrypoint so the post-build patcher in
// svelte.config.js can wire it into the Cloudflare worker's `scheduled`
// hook. Cloudflare invokes `scheduled(event, env, ctx)` on the same
// module that exports `default` (the fetch handler).
export { runCron } from "$lib/server/cron";

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env;
  if (!env) {
    event.locals.user = null;
    return resolve(event);
  }

  const auth = createAuth({
    db: getDb(env.DB),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: resolveAuthBaseURL(event.request.url, env.BETTER_AUTH_URL),
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    resendApiKey: env.RESEND_API_KEY,
  });

  let session:
    | { user: { id: string; email: string; name?: string } & Record<string, unknown> }
    | null = null;
  try {
    session = (await auth.api.getSession({ headers: event.request.headers })) as
      | { user: { id: string; email: string; name?: string } & Record<string, unknown> }
      | null;
  } catch {
    session = null;
  }

  event.locals.user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        displayName: (session.user.displayName as string) ?? session.user.name ?? "",
        timezone: (session.user.timezone as string) ?? "UTC",
      }
    : null;

  return resolve(event);
};
