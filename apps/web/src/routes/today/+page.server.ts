import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { getDb } from "$lib/server/db/client";
import { dailySessions, users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";

function todayInTZ(tz: string) {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");

  const db = getDb(platform.env.DB);
  const env = platform.env;

  // Confirm onboarding completed; otherwise → /onboarding
  const userRow = await db
    .select({
      termsAcceptedAt: users.termsAcceptedAt,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();
  if (!userRow?.termsAcceptedAt) throw redirect(302, "/onboarding");

  const tz = userRow.timezone ?? locals.user.timezone ?? "UTC";
  const date = todayInTZ(tz);

  // Try KV first (hot path)
  let cached = await env.KV.get(kvKeys.todayDigest(date));
  if (!cached) {
    // Fallback: D1 → cache
    const row = await db
      .select()
      .from(dailySessions)
      .where(eq(dailySessions.date, date))
      .get();
    if (!row) {
      return { date, missing: true as const, content: null };
    }
    cached = JSON.stringify({
      date: row.date,
      headline: row.headline,
      digest_md: row.digestMd,
      takeaways: JSON.parse(row.takeawaysJson),
      source: JSON.parse(row.sourceJson),
    });
    await env.KV.put(kvKeys.todayDigest(date), cached);
  }

  return { date, missing: false as const, content: JSON.parse(cached) };
};
