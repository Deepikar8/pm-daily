import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localDate } from "$lib/server/timezone/helpers";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { previewWeeklyRank } from "$lib/server/leaderboard/rank-preview";
import { compareIsoDate, isIsoDate } from "$lib/server/quiz/date";
import { score } from "$lib/server/scoring/score";
import { anonymousUserId, getPendingQuizClaim } from "$lib/server/quiz/anonymous";
import { scoreQuizState } from "$lib/server/quiz/attempt";
import { isGoogleAuthEnabled } from "$lib/server/auth/config";
import { getQuizSessionStub } from "$lib/server/quiz/runtime-session";

export const load: PageServerLoad = async ({ locals, platform, params, url, cookies }) => {
  if (!platform?.env) throw redirect(302, "/");
  if (!isIsoDate(params.date)) throw redirect(302, "/today");

  const env = platform.env;
  const tz = locals.user?.timezone ?? "UTC";
  const today = localDate(tz);
  const date = params.date;
  if (compareIsoDate(date, today) > 0) throw redirect(302, "/today");

  const db = getDb(env.DB);
  const mode = url.searchParams.get("mode") === "practice" ? "practice" : compareIsoDate(date, today) < 0 ? "late" : "scored_today";
  const sessionId = url.searchParams.get("sessionId") ?? "default";

  const questions = await db
    .select()
    .from(schema.dailyQuestions)
    .where(eq(schema.dailyQuestions.date, date))
    .orderBy(schema.dailyQuestions.position)
    .all();

  const session = await db
    .select()
    .from(schema.dailySessions)
    .where(eq(schema.dailySessions.date, date))
    .get();
  const source = session ? JSON.parse(session.sourceJson) : null;

  const stats = locals.user
    ? await db.select().from(schema.userStats).where(eq(schema.userStats.userId, locals.user.id)).get()
    : null;

  if (!locals.user) {
    const pending = getPendingQuizClaim(cookies);
    if (!pending || pending.date !== date) throw redirect(302, "/");

    const stub = getQuizSessionStub(env, {
      userId: anonymousUserId(pending.anonId),
      date,
      sessionId: "default",
    });
    const stateRes = await stub.fetch("https://do/state");
    const state = (await stateRes.json()) as
      | { uninitialized: true }
      | {
          startedAt: number;
          answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
        };
    if ("uninitialized" in state) throw redirect(302, `/quiz/${date}`);

    const scored = await scoreQuizState({
      db,
      state: { ...state, userId: anonymousUserId(pending.anonId), date },
      date,
      streak: 0,
      mode: "scored_today",
    });
    const lb = await readLeaderboards(env);
    const rank = previewWeeklyRank(lb.weekly.rows, scored.totalPoints);

    return {
      date,
      mode: "preview",
      preview: true,
      attempt: {
        id: null,
        totalCorrect: scored.totalCorrect,
        totalSeconds: scored.totalSeconds,
        totalPoints: scored.totalPoints,
        streakMultiplier: scored.streakMultiplier,
      },
      scoreBreakdown: {
        basePoints: scored.basePoints,
        speedBonus: scored.speedBonus,
        streakMultiplier: scored.streakMultiplier,
        totalPoints: scored.totalPoints,
        leaderboardEligible: false,
      },
      shareUrl: `${url.origin}/quiz/${date}/done`,
      streak: { current: 0, best: 0 },
      rank,
      claimUrl: `/quiz/claim?date=${encodeURIComponent(date)}`,
      googleEnabled: isGoogleAuthEnabled(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET),
      questions: questions.map((q) => ({
        position: q.position,
        archetype: q.archetype,
        scenarioMd: q.scenarioMd,
        pmTakeaway: q.pmTakeaway,
        correct: scored.correctnessByPosition.get(q.position) === true,
      })),
      source,
    };
  }

  if (mode === "practice") {
    const stub = getQuizSessionStub(env, { userId: locals.user.id, date, sessionId });
    const stateRes = await stub.fetch("https://do/state");
    const state = (await stateRes.json()) as
      | { uninitialized: true }
      | {
          startedAt: number;
          answers: Array<{ position: number; selectedKey: string }>;
        };
    if ("uninitialized" in state) throw redirect(302, `/quiz/${date}?mode=practice`);

    const byPos = new Map(questions.map((q) => [q.position, q]));
    const isCorrectByPos = new Map<number, boolean>();
    for (const a of state.answers) {
      const q = byPos.get(a.position);
      isCorrectByPos.set(a.position, q?.correctKey === a.selectedKey);
    }
    const totalCorrect = [...isCorrectByPos.values()].filter(Boolean).length;
    const totalSeconds = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    const breakdown = score({ correctCount: totalCorrect, seconds: totalSeconds, streak: 0 });

    return {
      date,
      mode,
      attempt: {
        id: null,
        totalCorrect,
        totalSeconds,
        totalPoints: 0,
        streakMultiplier: 1,
      },
      scoreBreakdown: {
        basePoints: breakdown.basePoints,
        speedBonus: breakdown.speedBonus,
        streakMultiplier: 1,
        totalPoints: 0,
        leaderboardEligible: false,
      },
      shareUrl: `${url.origin}/quiz/${date}/done`,
      streak: {
        current: stats?.currentStreak ?? 0,
        best: stats?.bestStreak ?? 0,
      },
      rank: null,
      questions: questions.map((q) => ({
        position: q.position,
        archetype: q.archetype,
        scenarioMd: q.scenarioMd,
        pmTakeaway: q.pmTakeaway,
        correct: isCorrectByPos.get(q.position) === true,
      })),
      source,
    };
  }

  const attempt = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, locals.user.id), eq(schema.quizAttempts.date, date)))
    .get();
  if (!attempt?.submittedAt) throw redirect(302, `/quiz/${date}`);

  const answers = await db
    .select()
    .from(schema.quizAnswers)
    .where(eq(schema.quizAnswers.attemptId, attempt.id))
    .all();
  const isCorrectByQId = new Map(answers.map((a) => [a.questionId, a.isCorrect === 1]));

  const lb = await readLeaderboards(env);
  const myRank = lb.weekly.rows.findIndex((r: { userId: string }) => r.userId === locals.user!.id);
  const leaderboardEligible = compareIsoDate(date, today) === 0;

  return {
    date,
    mode,
    attempt: {
      id: attempt.id,
      totalCorrect: attempt.totalCorrect ?? 0,
      totalSeconds: attempt.totalSeconds ?? 0,
      totalPoints: attempt.totalPoints ?? 0,
      streakMultiplier: attempt.streakMultiplier ?? 1,
    },
    scoreBreakdown: {
      basePoints: attempt.basePoints ?? 0,
      speedBonus: attempt.speedBonus ?? 0,
      streakMultiplier: attempt.streakMultiplier ?? 1,
      totalPoints: attempt.totalPoints ?? 0,
      leaderboardEligible,
    },
    shareUrl: `${url.origin}/share/${attempt.id}`,
    streak: {
      current: stats?.currentStreak ?? 0,
      best: stats?.bestStreak ?? 0,
    },
    rank: leaderboardEligible && myRank >= 0 ? myRank + 1 : null,
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
