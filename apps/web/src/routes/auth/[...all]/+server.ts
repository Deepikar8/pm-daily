import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth/better-auth";
import { getDb } from "$lib/server/db/client";

const handler: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env) {
    return new Response("platform.env unavailable", { status: 500 });
  }
  const env = platform.env;
  const auth = createAuth({
    db: getDb(env.DB),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    resendApiKey: env.RESEND_API_KEY,
  });
  return auth.handler(request);
};

export const GET = handler;
export const POST = handler;
