import type { RequestHandler } from "./$types";
import { readFileSync } from "node:fs";
import { formatInTimeZone } from "date-fns-tz";
import { seedDay } from "$lib/server/content/seed";
import { getDb } from "$lib/server/db/client";

// Production-gated dev helper that seeds today's content (or a date passed
// via ?date=YYYY-MM-DD) into the locally-emulated D1 + KV. Loaded only when
// running `pnpm dev` against miniflare's platformProxy.
export const POST: RequestHandler = async ({ platform, url }) => {
  if (process.env.NODE_ENV === "production") {
    return new Response("dev only", { status: 403 });
  }
  if (!platform?.env) {
    return new Response("platform unavailable", { status: 500 });
  }

  const date =
    url.searchParams.get("date") ||
    formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");

  let json: unknown;
  try {
    json = JSON.parse(readFileSync(`./content/${date}.json`, "utf-8"));
  } catch (err) {
    return new Response(
      `content not found for ${date}: ${(err as Error).message}`,
      { status: 404 },
    );
  }

  const db = getDb(platform.env.DB);
  try {
    const result = await seedDay({ db, kv: platform.env.KV, contentJson: json });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`seed failed: ${message}`, { status: 500 });
  }
};
