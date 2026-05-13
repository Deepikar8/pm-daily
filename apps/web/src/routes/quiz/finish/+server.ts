import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localDate } from "$lib/server/timezone/helpers";
import { compareIsoDate } from "$lib/server/quiz/date";
import {
  anonymousUserId,
  getOrCreateAnonymousQuizId,
  setPendingQuizClaim,
} from "$lib/server/quiz/anonymous";
import { getQuizSessionStub } from "$lib/server/quiz/runtime-session";
import { persistQuizAttempt, scoreQuizState } from "$lib/server/quiz/attempt";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { previewWeeklyRank } from "$lib/server/leaderboard/rank-preview";

/**
 * Finalize the user's quiz for the day:
 *   1. Tell the DO to flip `submitted = true` (idempotent)
 *   2. Read its state (answers + startedAt + attemptId)
 *   3. Score against D1's correct keys, write attempt + answers
 *   4. applyAttemptToStats (streak math) + recomputeLeaderboard (debounced)
 *   5. Return the score summary for the client to render /quiz/done
 *
 * Idempotent: if a submitted attempt row already exists for (user, date),
 * we just return its existing summary — re-pressing "Finish" never
 * double-counts points.
 */
export const POST: RequestHandler = async ({ request, locals, platform, cookies }) => {
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const env = platform.env;
  const body = (await request.json().catch(() => ({}))) as {
    date?: string;
    mode?: "scored_today" | "late" | "practice";
    sessionId?: string;
  };
  const tz = locals.user?.timezone ?? "UTC";
  const today = localDate(tz);
  const date = body.date ?? today;
  const mode = body.mode ?? (compareIsoDate(date, today) < 0 ? "late" : "scored_today");
  const anonId = locals.user ? null : getOrCreateAnonymousQuizId(cookies);
  const quizUserId = locals.user?.id ?? anonymousUserId(anonId!);

  // Finalize the DO
  const stub = getQuizSessionStub(env, { userId: quizUserId, date, sessionId: body.sessionId });
  const finalRes = await stub.fetch("https://do/finalize", { method: "POST" });
  if (!finalRes.ok) {
    return new Response("could not finalize quiz", { status: 400 });
  }
  const state = (await finalRes.json()) as {
    attemptId: string;
    userId: string;
    date: string;
    startedAt: number;
    answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
  };

  const db = getDb(env.DB);

  const stats = locals.user
    ? await db.select().from(schema.userStats).where(eq(schema.userStats.userId, locals.user.id)).get()
    : null;
  const currentStreak = stats?.currentStreak ?? 0;

  const scored = await scoreQuizState({
    db,
    state,
    date,
    streak: currentStreak,
    mode,
  });

  if (!locals.user) {
    setPendingQuizClaim(cookies, { anonId: anonId!, date });
    const lb = await readLeaderboards(env);
    const previewRank =
      mode === "scored_today" && compareIsoDate(date, today) === 0
        ? previewWeeklyRank(lb.weekly.rows, scored.totalPoints)
        : null;
    return Response.json({
      attemptId: null,
      date,
      mode: "preview",
      totalCorrect: scored.totalCorrect,
      totalSeconds: scored.totalSeconds,
      totalPoints: scored.totalPoints,
      basePoints: scored.basePoints,
      speedBonus: scored.speedBonus,
      streakMultiplier: scored.streakMultiplier,
      leaderboardEligible: false,
      previewRank,
    });
  }

  // Idempotent: if attempt already exists, return its summary instead of re-writing
  const existing = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, locals.user.id), eq(schema.quizAttempts.date, date)))
    .get();
  if (existing?.submittedAt) {
    return Response.json({
      attemptId: existing.id,
      totalCorrect: existing.totalCorrect,
      totalSeconds: existing.totalSeconds,
      totalPoints: existing.totalPoints,
      basePoints: existing.basePoints,
      speedBonus: existing.speedBonus,
      streakMultiplier: existing.streakMultiplier,
    });
  }

  if (mode === "practice") {
    return Response.json({
      attemptId: null,
      date,
      mode,
      totalCorrect: scored.totalCorrect,
      totalSeconds: scored.totalSeconds,
      totalPoints: 0,
      basePoints: scored.basePoints,
      speedBonus: scored.speedBonus,
      streakMultiplier: 1,
      leaderboardEligible: false,
    });
  }

  const persisted = await persistQuizAttempt({
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

  return Response.json({
    attemptId: persisted.attemptId,
    date,
    mode,
    totalCorrect: persisted.totalCorrect,
    totalSeconds: persisted.totalSeconds,
    totalPoints: persisted.totalPoints,
    basePoints: persisted.basePoints,
    speedBonus: persisted.speedBonus,
    streakMultiplier: persisted.streakMultiplier,
    leaderboardEligible: persisted.leaderboardEligible,
  });
};
