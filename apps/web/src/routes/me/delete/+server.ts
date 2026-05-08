import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db/client";
import { users, session as sessionTable, account } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const db = getDb(platform.env.DB);
  const id = locals.user.id;

  // Anonymize per spec §7.4: keep the row + its FK targets so quiz_attempts
  // history stays intact, but null out PII and mark deletedAt.
  await db.update(users).set({
    email: `deleted+${id}@invalid.local`,
    displayName: "deleted user",
    company: null,
    role: null,
    deletedAt: Date.now(),
  }).where(eq(users.id, id)).run();

  // Revoke sessions/accounts so the user is signed out + can't sign in
  await db.delete(sessionTable).where(eq(sessionTable.userId, id)).run();
  await db.delete(account).where(eq(account.userId, id)).run();

  throw redirect(302, "/");
};
