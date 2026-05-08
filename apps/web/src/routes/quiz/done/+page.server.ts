import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localDate } from "$lib/server/timezone/helpers";
import { readLeaderboards } from "$lib/server/leaderboard/read";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");
  const env = platform.env;
  const tz = locals.user.timezone ?? "UTC";
  const date = localDate(tz);

  const db = getDb(env.DB);
  const attempt = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, locals.user.id), eq(schema.quizAttempts.date, date)))
    .get();
  if (!attempt?.submittedAt) throw redirect(302, "/today");

  // Pull all of today's questions (with takeaways) for the recap
  const questions = await db
    .select()
    .from(schema.dailyQuestions)
    .where(eq(schema.dailyQuestions.date, date))
    .orderBy(schema.dailyQuestions.position)
    .all();

  // Pull the user's per-question answers for correctness
  const answers = await db
    .select()
    .from(schema.quizAnswers)
    .where(eq(schema.quizAnswers.attemptId, attempt.id))
    .all();
  const isCorrectByQId = new Map(answers.map((a) => [a.questionId, a.isCorrect === 1]));

  // User stats for streak display
  const stats = await db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, locals.user.id))
    .get();

  // Leaderboard rank (weekly)
  const lb = await readLeaderboards(env);
  const myRank = lb.weekly.rows.findIndex((r: { userId: string }) => r.userId === locals.user!.id);

  // Source for "Now go deeper" card
  const session = await db
    .select()
    .from(schema.dailySessions)
    .where(eq(schema.dailySessions.date, date))
    .get();
  const source = session ? JSON.parse(session.sourceJson) : null;

  return {
    date,
    attempt: {
      totalCorrect: attempt.totalCorrect ?? 0,
      totalSeconds: attempt.totalSeconds ?? 0,
      totalPoints: attempt.totalPoints ?? 0,
      streakMultiplier: attempt.streakMultiplier ?? 1,
    },
    streak: {
      current: stats?.currentStreak ?? 0,
      best: stats?.bestStreak ?? 0,
    },
    rank: myRank >= 0 ? myRank + 1 : null,
    questions: questions.map((q) => ({
      position: q.position,
      archetype: q.archetype,
      scenarioMd: q.scenarioMd,
      pmTakeaway: q.pmTakeaway,
      correct: isCorrectByQId.get(q.id) === true,
    })),
    source,
  };
};
