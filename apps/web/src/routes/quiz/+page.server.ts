import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { localDate } from "$lib/server/timezone/helpers";
import { getDb } from "$lib/server/db/client";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!platform?.env) throw redirect(302, "/");
  if (!locals.user) {
    const date = localDate("UTC");
    throw redirect(302, `/quiz/${date}`);
  }

  const env = platform.env;
  const db = getDb(env.DB);

  // Confirm onboarding
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
  const date = localDate(tz);
  throw redirect(302, `/quiz/${date}`);
};
