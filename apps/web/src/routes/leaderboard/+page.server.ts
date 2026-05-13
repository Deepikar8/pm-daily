import type { PageServerLoad } from "./$types";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { readPendingQuizPreview } from "$lib/server/quiz/pending-preview";
import { getDb } from "$lib/server/db/client";
import { quizAttempts } from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ platform, locals, cookies }) => {
  if (!platform?.env) {
    return {
      weekly: { rows: [] },
      allTime: { rows: [] },
      weekKey: "",
      currentUserId: locals.user?.id ?? null,
      pendingPreview: null,
      shareResult: null,
    };
  }
  const data = await readLeaderboards(platform.env);
  const weeklyRank = locals.user
    ? data.weekly.rows.findIndex((row) => row.userId === locals.user!.id)
    : -1;
  const latestAttempt = locals.user
    ? await getDb(platform.env.DB)
        .select({
          id: quizAttempts.id,
          date: quizAttempts.date,
          totalCorrect: quizAttempts.totalCorrect,
        })
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, locals.user.id))
        .orderBy(desc(quizAttempts.date))
        .limit(1)
        .get()
    : null;
  return {
    ...data,
    currentUserId: locals.user?.id ?? null,
    pendingPreview: locals.user
      ? null
      : await readPendingQuizPreview({ env: platform.env, cookies }),
    shareResult: latestAttempt
      ? {
          url: `/share/${latestAttempt.id}`,
          date: latestAttempt.date,
          totalCorrect: latestAttempt.totalCorrect ?? 0,
          rank: weeklyRank >= 0 ? weeklyRank + 1 : null,
        }
      : null,
  };
};
