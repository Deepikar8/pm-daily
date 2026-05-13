import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, platform, url }) => {
  if (!platform?.env) throw error(500, "platform unavailable");

  const db = getDb(platform.env.DB);
  const attempt = await db
    .select()
    .from(schema.quizAttempts)
    .where(eq(schema.quizAttempts.id, params.attemptId))
    .get();
  if (!attempt?.submittedAt) throw error(404, "result not found");

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, attempt.userId))
    .get();
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

  const isCorrectByQId = new Map(answers.map((answer) => [answer.questionId, answer.isCorrect === 1]));
  const source = session ? JSON.parse(session.sourceJson) : null;

  return {
    date: attempt.date,
    url: `/share/${attempt.id}`,
    absoluteUrl: `${url.origin}/share/${attempt.id}`,
    imageUrl: `${url.origin}/social/product-gym-share-v2.png`,
    player: {
      displayName: user && !user.deletedAt ? user.displayName : "Product Gym athlete",
      role: user && !user.deletedAt ? user.role : null,
    },
    result: {
      totalCorrect: attempt.totalCorrect ?? 0,
      totalSeconds: attempt.totalSeconds ?? 0,
      totalPoints: attempt.totalPoints ?? 0,
    },
    session: {
      headline: session?.headline ?? "Product judgment rep",
      sourceTitle: source?.title ?? "",
      sourceByline: source?.byline ?? "",
    },
    questions: questions.map((question) => ({
      position: question.position,
      archetype: question.archetype,
      pmTakeaway: question.pmTakeaway,
      correct: isCorrectByQId.get(question.id) === true,
    })),
  };
};
