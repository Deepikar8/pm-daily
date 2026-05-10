import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { localDate } from "$lib/server/timezone/helpers";
import { getDb } from "$lib/server/db/client";
import { quizAttempts, users } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { compareIsoDate, isIsoDate } from "$lib/server/quiz/date";
import { quizSessionName } from "$lib/server/quiz/session";

export const load: PageServerLoad = async ({ locals, platform, params, url }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");
  if (!isIsoDate(params.date)) throw redirect(302, "/today");

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
  if (!userRow?.termsAcceptedAt) throw redirect(302, "/onboarding");

  const tz = userRow.timezone ?? locals.user.timezone ?? "UTC";
  const today = localDate(tz);
  const date = params.date;
  if (compareIsoDate(date, today) > 0) throw redirect(302, "/today");

  const requestedPractice = url.searchParams.get("mode") === "practice";
  const existing = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, locals.user.id), eq(quizAttempts.date, date)))
    .get();
  if (existing?.submittedAt && !requestedPractice) throw redirect(302, `/quiz/${date}/done`);

  const mode =
    requestedPractice ? "practice" : compareIsoDate(date, today) < 0 ? "late" : "scored_today";
  const sessionId = mode === "practice" ? `practice-${crypto.randomUUID()}` : "default";

  const cachedQ = await env.KV.get(kvKeys.todayQuestions(date));
  if (!cachedQ) return { date, missing: true as const, mode, sessionId };

  const questions = JSON.parse(cachedQ);

  const doId = env.QUIZ_SESSION.idFromName(
    quizSessionName({ userId: locals.user.id, date, sessionId }),
  );
  const stub = env.QUIZ_SESSION.get(doId);
  const initRes = await stub.fetch("https://do/init", {
    method: "POST",
    body: JSON.stringify({ userId: locals.user.id, date }),
  });
  if (!initRes.ok) {
    return { date, missing: true as const, mode, sessionId };
  }
  const state = (await initRes.json()) as {
    currentIndex?: number;
    startedAt?: number;
    [k: string]: unknown;
  };

  return { date, missing: false as const, questions, state, mode, sessionId };
};

