import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { localDate } from "$lib/server/timezone/helpers";
import { getDb } from "$lib/server/db/client";
import { quizAttempts, users } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { compareIsoDate, isIsoDate } from "$lib/server/quiz/date";
import { anonymousUserId, getOrCreateAnonymousQuizId } from "$lib/server/quiz/anonymous";
import { getQuizSessionStub } from "$lib/server/quiz/runtime-session";

export const load: PageServerLoad = async ({ locals, platform, params, url, cookies }) => {
  if (!platform?.env) throw redirect(302, "/");
  if (!isIsoDate(params.date)) throw redirect(302, "/today");

  const env = platform.env;
  const db = getDb(env.DB);

  const userRow = locals.user
    ? await db
        .select({
          termsAcceptedAt: users.termsAcceptedAt,
          timezone: users.timezone,
        })
        .from(users)
        .where(eq(users.id, locals.user.id))
        .get()
    : null;
  if (locals.user && !userRow?.termsAcceptedAt) throw redirect(302, "/onboarding");

  const tz = userRow?.timezone ?? locals.user?.timezone ?? "UTC";
  const today = localDate(tz);
  const date = params.date;
  if (compareIsoDate(date, today) > 0) throw redirect(302, "/today");
  if (!locals.user && compareIsoDate(date, today) !== 0) throw redirect(302, `/quiz/${today}`);

  const requestedPractice = url.searchParams.get("mode") === "practice";
  const existing = locals.user
    ? await db
        .select()
        .from(quizAttempts)
        .where(and(eq(quizAttempts.userId, locals.user.id), eq(quizAttempts.date, date)))
        .get()
    : null;
  if (existing?.submittedAt && !requestedPractice) throw redirect(302, `/quiz/${date}/done`);

  const mode =
    requestedPractice ? "practice" : compareIsoDate(date, today) < 0 ? "late" : "scored_today";
  const sessionId = mode === "practice" ? `practice-${crypto.randomUUID()}` : "default";
  const quizUserId = locals.user?.id ?? anonymousUserId(getOrCreateAnonymousQuizId(cookies));

  const cachedQ = await env.KV.get(kvKeys.todayQuestions(date));
  if (!cachedQ) return { date, missing: true as const, mode, sessionId };

  const questions = JSON.parse(cachedQ);

  const stub = getQuizSessionStub(env, { userId: quizUserId, date, sessionId });
  const initRes = await stub.fetch("https://do/init", {
    method: "POST",
    body: JSON.stringify({ userId: quizUserId, date }),
  });
  if (!initRes.ok) {
    return { date, missing: true as const, mode, sessionId };
  }
  const state = (await initRes.json()) as {
    currentIndex?: number;
    startedAt?: number;
    [k: string]: unknown;
  };

  return { date, missing: false as const, questions, state, mode, sessionId, isAnonymous: !locals.user };
};
