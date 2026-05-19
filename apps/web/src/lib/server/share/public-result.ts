import { eq } from "drizzle-orm";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { normalizeSourceLinks } from "$lib/server/content/source-links";

export type PublicShareResult = {
  date: string;
  url: string;
  absoluteUrl: string;
  imageUrl: string;
  player: {
    displayName: string;
    role: string | null;
  };
  result: {
    totalCorrect: number;
    totalSeconds: number;
    totalPoints: number;
    rank: number | null;
  };
  session: {
    headline: string;
    sourceTitle: string;
    sourceByline: string;
    sourceType: string;
  };
  questions: Array<{
    position: number;
    archetype: string;
    pmTakeaway: string;
    correct: boolean;
  }>;
};

export async function readPublicShareResult(args: {
  env: App.Platform["env"];
  attemptId: string;
  origin: string;
}): Promise<PublicShareResult | null> {
  const db = getDb(args.env.DB);
  const attempt = await db
    .select()
    .from(schema.quizAttempts)
    .where(eq(schema.quizAttempts.id, args.attemptId))
    .get();
  if (!attempt?.submittedAt) return null;

  const user = await db.select().from(schema.users).where(eq(schema.users.id, attempt.userId)).get();
  const session = await db
    .select()
    .from(schema.dailySessions)
    .where(eq(schema.dailySessions.date, attempt.date))
    .get();
  const questions = await db
    .select()
    .from(schema.dailyQuestions)
    .where(eq(schema.dailyQuestions.date, attempt.date))
    .orderBy(schema.dailyQuestions.position)
    .all();
  const answers = await db
    .select()
    .from(schema.quizAnswers)
    .where(eq(schema.quizAnswers.attemptId, attempt.id))
    .all();

  const leaderboard = await readLeaderboards(args.env);
  const rankIndex = leaderboard.weekly.rows.findIndex(
    (row: { userId: string }) => row.userId === attempt.userId,
  );
  const isCorrectByQId = new Map(answers.map((answer) => [answer.questionId, answer.isCorrect === 1]));
  const source = session ? normalizeSourceLinks(JSON.parse(session.sourceJson)) : null;
  const path = `/share/${attempt.id}`;

  return {
    date: attempt.date,
    url: path,
    absoluteUrl: `${args.origin}${path}`,
    imageUrl: `${args.origin}${path}/card.png`,
    player: {
      displayName: user && !user.deletedAt ? user.displayName : "Product Gym athlete",
      role: user && !user.deletedAt ? user.role : null,
    },
    result: {
      totalCorrect: attempt.totalCorrect ?? 0,
      totalSeconds: attempt.totalSeconds ?? 0,
      totalPoints: attempt.totalPoints ?? 0,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
    },
    session: {
      headline: session?.headline ?? "Product judgment rep",
      sourceTitle: source?.title ?? "",
      sourceByline: source?.byline ?? "",
      sourceType: source?.type ?? "",
    },
    questions: questions.map((question) => ({
      position: question.position,
      archetype: question.archetype,
      pmTakeaway: question.pmTakeaway,
      correct: isCorrectByQId.get(question.id) === true,
    })),
  };
}
