import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";
import * as schema from "$lib/server/db/schema";
import { score } from "$lib/server/scoring/score";
import { applyAttemptToStats } from "$lib/server/scoring/streaks";
import { recomputeLeaderboard } from "$lib/server/leaderboard/recompute";
import { compareIsoDate } from "$lib/server/quiz/date";

export type FinalizedQuizState = {
  attemptId?: string;
  userId: string;
  date: string;
  startedAt: number;
  answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
};

export type QuizMode = "scored_today" | "late" | "practice";
type DailyQuestion = typeof schema.dailyQuestions.$inferSelect;

export async function scoreQuizState(args: {
  db: any;
  state: FinalizedQuizState;
  date: string;
  streak: number;
  mode: QuizMode;
}) {
  const todaysQs = (await args.db
    .select()
    .from(schema.dailyQuestions)
    .where(eq(schema.dailyQuestions.date, args.date))
    .all()) as DailyQuestion[];
  const byPos = new Map(todaysQs.map((q) => [q.position, q]));

  let totalCorrect = 0;
  const correctnessByPosition = new Map<number, boolean>();
  for (const answer of args.state.answers) {
    const q = byPos.get(answer.position);
    const correct = q?.correctKey === answer.selectedKey;
    if (correct) totalCorrect++;
    correctnessByPosition.set(answer.position, correct);
  }

  const totalSeconds = Math.max(0, Math.floor((Date.now() - args.state.startedAt) / 1000));
  const breakdown = score({
    correctCount: totalCorrect,
    seconds: totalSeconds,
    streak: args.mode === "practice" ? 0 : args.streak,
  });

  return {
    questions: todaysQs,
    correctnessByPosition,
    totalCorrect,
    totalSeconds,
    basePoints: breakdown.basePoints,
    speedBonus: breakdown.speedBonus,
    streakMultiplier: args.mode === "practice" ? 1 : breakdown.streakMultiplier,
    totalPoints: args.mode === "practice" ? 0 : breakdown.totalPoints,
  };
}

export async function persistQuizAttempt(args: {
  db: any;
  env: App.Platform["env"];
  state: FinalizedQuizState;
  userId: string;
  date: string;
  mode: QuizMode;
  timezone: string;
  today: string;
  scored: Awaited<ReturnType<typeof scoreQuizState>>;
}) {
  const existing = await args.db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, args.userId), eq(schema.quizAttempts.date, args.date)))
    .get();
  if (existing?.submittedAt) {
    return {
      attemptId: existing.id,
      totalCorrect: existing.totalCorrect ?? 0,
      totalSeconds: existing.totalSeconds ?? 0,
      totalPoints: existing.totalPoints ?? 0,
      basePoints: existing.basePoints ?? 0,
      speedBonus: existing.speedBonus ?? 0,
      streakMultiplier: existing.streakMultiplier ?? 1,
      leaderboardEligible:
        args.mode === "scored_today" && compareIsoDate(args.date, args.today) === 0,
      existing: true,
    };
  }

  const attemptId = args.state.attemptId ?? ulid();
  await args.db
    .insert(schema.quizAttempts)
    .values({
      id: attemptId,
      userId: args.userId,
      date: args.date,
      startedAt: args.state.startedAt,
      submittedAt: Date.now(),
      totalCorrect: args.scored.totalCorrect,
      totalSeconds: args.scored.totalSeconds,
      basePoints: args.scored.basePoints,
      speedBonus: args.scored.speedBonus,
      streakMultiplier: args.scored.streakMultiplier,
      totalPoints: args.scored.totalPoints,
    })
    .onConflictDoNothing()
    .run();

  const byPos = new Map(
    args.scored.questions.map((q) => [q.position, q]),
  );
  for (const answer of args.state.answers) {
    const q = byPos.get(answer.position);
    if (!q) continue;
    await args.db
      .insert(schema.quizAnswers)
      .values({
        attemptId,
        questionId: q.id,
        selectedKey: answer.selectedKey,
        isCorrect: q.correctKey === answer.selectedKey ? 1 : 0,
        answeredAt: answer.answeredAt,
      })
      .onConflictDoNothing()
      .run();
  }

  const leaderboardEligible =
    args.mode === "scored_today" && compareIsoDate(args.date, args.today) === 0;
  if (leaderboardEligible) {
    await applyAttemptToStats({
      db: args.db,
      userId: args.userId,
      date: args.date,
      points: args.scored.totalPoints,
      timezone: args.timezone,
    });
    await recomputeLeaderboard(args.env);
  }

  return {
    attemptId,
    totalCorrect: args.scored.totalCorrect,
    totalSeconds: args.scored.totalSeconds,
    totalPoints: args.scored.totalPoints,
    basePoints: args.scored.basePoints,
    speedBonus: args.scored.speedBonus,
    streakMultiplier: args.scored.streakMultiplier,
    leaderboardEligible,
    existing: false,
  };
}
