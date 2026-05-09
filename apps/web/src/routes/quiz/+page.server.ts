import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { localDate } from "$lib/server/timezone/helpers";
import { getDb } from "$lib/server/db/client";
import { quizAttempts, users } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");

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

  // If already completed today's quiz, redirect to results
  const existing = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, locals.user.id), eq(quizAttempts.date, date)))
    .get();
  if (existing?.submittedAt) throw redirect(302, "/quiz/done");

  // Load today's questions (KV with no correct keys / explanations / takeaways)
  const cachedQ = await env.KV.get(kvKeys.todayQuestions(date));
  if (!cachedQ) return { date, missing: true as const };

  const questions = JSON.parse(cachedQ);

  // Initialize / resume the DO
  const doId = env.QUIZ_SESSION.idFromName(`${locals.user.id}:${date}`);
  const stub = env.QUIZ_SESSION.get(doId);
  const initRes = await stub.fetch("https://do/init", {
    method: "POST",
    body: JSON.stringify({ userId: locals.user.id, date }),
  });
  if (!initRes.ok) {
    return { date, missing: true as const };
  }
  const state = (await initRes.json()) as {
    currentIndex?: number;
    startedAt?: number;
    [k: string]: unknown;
  };

  return { date, missing: false as const, questions, state };
};
