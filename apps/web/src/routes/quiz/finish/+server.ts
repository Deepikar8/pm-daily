import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { score } from "$lib/server/scoring/score";
import { applyAttemptToStats } from "$lib/server/scoring/streaks";
import { recomputeLeaderboard } from "$lib/server/leaderboard/recompute";
import { localDate } from "$lib/server/timezone/helpers";
import { ulid } from "ulid";

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
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const env = platform.env;
  const body = (await request.json().catch(() => ({}))) as { date?: string };
  const tz = locals.user.timezone ?? "UTC";
  const date = body.date ?? localDate(tz);

  // Finalize the DO
  const stub = env.QUIZ_SESSION.get(env.QUIZ_SESSION.idFromName(`${locals.user.id}:${date}`));
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

  // Load today's questions (with correct keys)
  const todaysQs = await db
    .select()
    .from(schema.dailyQuestions)
    .where(eq(schema.dailyQuestions.date, date))
    .all();
  const byPos = new Map(todaysQs.map((q) => [q.position, q]));

  let totalCorrect = 0;
  for (const a of state.answers) {
    const q = byPos.get(a.position);
    if (q && q.correctKey === a.selectedKey) totalCorrect++;
  }
  const totalSeconds = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));

  // Look up current streak for the multiplier
  const stats = await db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, locals.user.id))
    .get();
  const currentStreak = stats?.currentStreak ?? 0;

  const { basePoints, speedBonus, streakMultiplier, totalPoints } = score({
    correctCount: totalCorrect,
    seconds: totalSeconds,
    streak: currentStreak,
  });

  const attemptId = state.attemptId ?? ulid();
  await db
    .insert(schema.quizAttempts)
    .values({
      id: attemptId,
      userId: locals.user.id,
      date,
      startedAt: state.startedAt,
      submittedAt: Date.now(),
      totalCorrect,
      totalSeconds,
      basePoints,
      speedBonus,
      streakMultiplier,
      totalPoints,
    })
    .onConflictDoNothing()
    .run();

  for (const a of state.answers) {
    const q = byPos.get(a.position);
    if (!q) continue;
    await db
      .insert(schema.quizAnswers)
      .values({
        attemptId,
        questionId: q.id,
        selectedKey: a.selectedKey,
        isCorrect: q.correctKey === a.selectedKey ? 1 : 0,
        answeredAt: a.answeredAt,
      })
      .onConflictDoNothing()
      .run();
  }

  await applyAttemptToStats({
    db,
    userId: locals.user.id,
    date,
    points: totalPoints,
    timezone: tz,
  });
  await recomputeLeaderboard(env);

  return Response.json({
    attemptId,
    totalCorrect,
    totalSeconds,
    totalPoints,
    basePoints,
    speedBonus,
    streakMultiplier,
  });
};
