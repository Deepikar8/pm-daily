import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { eq } from "drizzle-orm";
import { getDb } from "$lib/server/db/client";
import { users, userStats } from "$lib/server/db/schema";
import { localDate } from "$lib/server/timezone/helpers";
import { compareIsoDate, isIsoDate } from "$lib/server/quiz/date";
import {
  anonymousUserId,
  clearPendingQuizClaim,
  getPendingQuizClaim,
} from "$lib/server/quiz/anonymous";
import { persistQuizAttempt, scoreQuizState } from "$lib/server/quiz/attempt";
import { getQuizSessionStub } from "$lib/server/quiz/runtime-session";

export const GET: RequestHandler = async ({ locals, platform, cookies, url }) => {
  const date = url.searchParams.get("date");
  if (!date || !isIsoDate(date)) throw redirect(302, "/today");
  if (!locals.user) throw redirect(302, `/signin/email?callbackURL=${encodeURIComponent(url.pathname + url.search)}`);
  if (!platform?.env) throw redirect(302, "/today");

  const env = platform.env;
  const db = getDb(env.DB);
  const userRow = await db
    .select({
      termsAcceptedAt: users.termsAcceptedAt,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();
  if (!userRow?.termsAcceptedAt) {
    throw redirect(302, `/onboarding?next=${encodeURIComponent(url.pathname + url.search)}`);
  }

  const pending = getPendingQuizClaim(cookies);
  if (!pending || pending.date !== date) throw redirect(302, `/quiz/${date}/done`);

  const stub = getQuizSessionStub(env, {
    userId: anonymousUserId(pending.anonId),
    date,
    sessionId: "default",
  });
  const finalRes = await stub.fetch("https://do/finalize", { method: "POST" });
  if (!finalRes.ok) throw redirect(302, `/quiz/${date}`);
  const state = (await finalRes.json()) as {
    userId: string;
    date: string;
    startedAt: number;
    answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
  };

  const tz = userRow.timezone ?? locals.user.timezone ?? "UTC";
  const today = localDate(tz);
  const mode = compareIsoDate(date, today) < 0 ? "late" : "scored_today";
  const stats = await db.select().from(userStats).where(eq(userStats.userId, locals.user.id)).get();
  const scored = await scoreQuizState({
    db,
    state,
    date,
    streak: stats?.currentStreak ?? 0,
    mode,
  });
  await persistQuizAttempt({
    db,
    env,
    state,
    userId: locals.user.id,
    date,
    mode,
    timezone: tz,
    today,
    scored,
  });
  clearPendingQuizClaim(cookies);
  throw redirect(302, `/quiz/${date}/done`);
};
