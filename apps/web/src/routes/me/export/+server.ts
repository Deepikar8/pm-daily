import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import { users, userStats, quizAttempts, quizAnswers } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const db = getDb(platform.env.DB);
  const id = locals.user.id;

  const [user, stats, attempts] = await Promise.all([
    db.select().from(users).where(eq(users.id, id)).get(),
    db.select().from(userStats).where(eq(userStats.userId, id)).get(),
    db.select().from(quizAttempts).where(eq(quizAttempts.userId, id)).all(),
  ]);

  // Fetch all answers for those attempts
  const answers = [];
  for (const a of attempts) {
    const ans = await db.select().from(quizAnswers).where(eq(quizAnswers.attemptId, a.id)).all();
    answers.push(...ans);
  }

  const body = JSON.stringify({
    exportedAt: new Date().toISOString(),
    user, stats, attempts, answers,
  }, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pm-daily-export-${id}.json"`,
    },
  });
};
